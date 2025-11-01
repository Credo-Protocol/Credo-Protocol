/**
 * Withdraw Modal Component
 * 
 * Handles withdrawing supplied MockUSDC from LendingPool
 * Checks if withdrawal would make position unhealthy
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ethers } from 'ethers';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, TrendingDown, Info, AlertTriangle } from 'lucide-react';
import { CONTRACTS, LENDING_POOL_ABI } from '@/lib/contracts';
import { handleTransactionError } from '@/lib/errorHandler';
import { getBestProvider, callWithTimeout } from '@/lib/rpcProvider';

export default function WithdrawModal({ isOpen, onClose, userAddress, onSuccess, provider }) {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [suppliedBalance, setSuppliedBalance] = useState(0);
  const [borrowedAmount, setBorrowedAmount] = useState(0);
  const [debtWithInterest, setDebtWithInterest] = useState(0);
  const [liquidationThreshold, setLiquidationThreshold] = useState(8000);
  const [maxWithdrawable, setMaxWithdrawable] = useState(0);
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = input, 2 = confirm, 3 = success

  // Fetch supplied balance when modal opens
  useEffect(() => {
    if (isOpen && userAddress && provider) {
      fetchSuppliedBalance();
    }
  }, [isOpen, userAddress, provider]);

  const fetchSuppliedBalance = async () => {
    try {
      setLoading(true);
      
      // Get reliable provider with fallback support
      const reliableProvider = await getBestProvider(provider);
      
      const lendingPool = new ethers.Contract(
        CONTRACTS.LENDING_POOL,
        LENDING_POOL_ABI,
        reliableProvider
      );

      // Get account data (includes total debt with interest)
      const accountData = await callWithTimeout(
        () => lendingPool.getUserAccountData(userAddress),
        { timeout: 30000, retries: 2 }
      );

      // Parse values (MockUSDC uses 6 decimals)
      const totalCollateralUSD = Number(ethers.formatUnits(accountData[0], 6));
      const totalDebtUSD = Number(ethers.formatUnits(accountData[1], 6));
      const currentLiqThreshold = Number(accountData[3]);

      // Get user's supplied amount for this asset too (for clarity)
      const supplied = await callWithTimeout(
        () => lendingPool.getUserSupplied(userAddress, CONTRACTS.MOCK_USDC),
        { timeout: 30000, retries: 2 }
      );
      const suppliedFormatted = Number(ethers.formatUnits(supplied, 6));

      setSuppliedBalance(suppliedFormatted);
      setBorrowedAmount(totalDebtUSD);
      setDebtWithInterest(totalDebtUSD);
      setLiquidationThreshold(currentLiqThreshold);
      
      // Compute max withdrawable to keep health factor >= 1
      // Requirement: collateral >= debt * 10000 / LIQUIDATION_THRESHOLD
      const requiredCollateralForHF1 = totalDebtUSD > 0
        ? (totalDebtUSD * 10000) / (currentLiqThreshold || 8000)
        : 0;
      const maxWithdraw = Math.max(0, suppliedFormatted - requiredCollateralForHF1);
      setMaxWithdrawable(maxWithdraw);
      
      console.log('Supplied Balance:', suppliedFormatted, 'USDC, Borrowed (with interest):', totalDebtUSD, 'USDC');
    } catch (error) {
      console.error('Error fetching supplied balance:', error);
      setError('Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      setError('');

      // Pre-flight checks
      const withdrawAmountNum = parseFloat(withdrawAmount);
      
      // Check if user has enough supplied balance
      if (withdrawAmountNum > suppliedBalance) {
        setError(`💰 Insufficient supplied balance. You have ${suppliedBalance.toFixed(2)} USDC supplied but are trying to withdraw ${withdrawAmountNum.toFixed(2)} USDC.`);
        setWithdrawing(false);
        return;
      }
      
      // Check if amount is valid
      if (withdrawAmountNum <= 0) {
        setError('Please enter a valid withdraw amount greater than 0.');
        setWithdrawing(false);
        return;
      }

      // Pre-check health factor: block if over max withdrawable
      if (withdrawAmountNum > maxWithdrawable + 1e-6) {
        setError(`⚠️ Max withdrawable right now is ${maxWithdrawable.toFixed(2)} USDC based on your current debt.`);
        setWithdrawing(false);
        return;
      }

      const signer = await provider.getSigner();
      
      const lendingPool = new ethers.Contract(
        CONTRACTS.LENDING_POOL,
        LENDING_POOL_ABI,
        signer
      );

      // Withdraw tokens from pool
      const amount = ethers.parseUnits(withdrawAmount, 6);
      
      console.log('Withdrawing', withdrawAmount, 'USDC from LendingPool');
      console.log('User supplied balance:', suppliedBalance.toFixed(2), 'USDC');
      console.log('User borrowed amount:', borrowedAmount.toFixed(2), 'USDC');
      
      const tx = await lendingPool.withdraw(CONTRACTS.MOCK_USDC, amount);
      
      console.log('Withdraw transaction submitted:', tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      console.log('Withdraw transaction confirmed');
      
      // Move to success step
      setStep(3);
      
      // Call success callback after a short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Withdraw error:', error);
      
      // Check for specific error messages
      if (error.message?.includes('Withdrawal would make position unhealthy')) {
        setError('⚠️ Cannot withdraw this amount - it would make your position unhealthy. Repay some debt first or withdraw a smaller amount.');
      } else {
        const errorMessage = handleTransactionError('Withdraw', error);
        setError(errorMessage);
      }
      
      // Auto-dismiss user rejection messages after 4 seconds
      if (error.code === 'ACTION_REJECTED' || 
          error.code === 4001 || 
          error.message?.includes('user rejected') ||
          error.message?.includes('User rejected') ||
          error.message?.includes('rejected the request') ||
          error.message?.includes('User denied')) {
        setTimeout(() => setError(''), 4000);
      }
    } finally {
      setWithdrawing(false);
    }
  };

  const handleContinue = () => {
    // Validate input
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > suppliedBalance) {
      setError('Insufficient supplied balance');
      return;
    }

    if (parseFloat(withdrawAmount) > maxWithdrawable + 1e-6) {
      setError(`Max withdrawable is ${maxWithdrawable.toFixed(2)} USDC to keep your position healthy.`);
      return;
    }

    // Warn if user has borrowed funds
    if (borrowedAmount > 0) {
      setStep(2); // Show warning step
    } else {
      // No borrowed funds, safe to withdraw
      handleWithdraw();
    }
  };

  const handleClose = () => {
    setWithdrawAmount('');
    setStep(1);
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-black/10">
        <DialogHeader>
          <DialogTitle className="text-black text-xl font-bold">Withdraw Collateral</DialogTitle>
          <DialogDescription className="text-black/60">
            Withdraw your supplied USDC from the lending pool
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Input Amount */}
          {step === 1 && (
            <>
              {/* Supplied Balance Display */}
              <div className="p-6 rounded-xl border border-black/10 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-black/60">Your Supplied Balance</span>
                  <div className="text-right">
                    <p className="text-lg font-bold text-black">${suppliedBalance.toFixed(2)} USDC</p>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">Amount to Withdraw</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-black/40">
                      $
                    </div>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-16 py-3 text-lg border border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 bg-white text-black"
                      step="0.01"
                      min="0"
                      max={suppliedBalance}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-black/60">USDC</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-3 py-2 text-sm border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black"
                      onClick={() => setWithdrawAmount((Math.min(maxWithdrawable, suppliedBalance) * 0.25).toFixed(2))}
                    >
                      25%
                    </button>
                    <button
                      className="flex-1 px-3 py-2 text-sm border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black"
                      onClick={() => setWithdrawAmount((Math.min(maxWithdrawable, suppliedBalance) * 0.5).toFixed(2))}
                    >
                      50%
                    </button>
                    <button
                      className="flex-1 px-3 py-2 text-sm border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black"
                      onClick={() => setWithdrawAmount((Math.min(maxWithdrawable, suppliedBalance) * 0.75).toFixed(2))}
                    >
                      75%
                    </button>
                    <button
                      className="flex-1 px-3 py-2 text-sm border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black"
                      onClick={() => setWithdrawAmount(Math.min(maxWithdrawable, suppliedBalance).toFixed(2))}
                    >
                      Max
                    </button>
                  </div>
                  <p className="text-xs text-black/60 mt-2">Max withdrawable now: <span className="font-medium text-black">${maxWithdrawable.toFixed(2)} USDC</span></p>
                </div>
              </div>

              {/* Show warning if user has borrowed funds */}
              {borrowedAmount > 0 && (
                <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-orange-900">
                      <p className="font-medium">You have ${borrowedAmount.toFixed(2)} USDC borrowed</p>
                      <p className="mt-1 text-orange-800">Withdrawing may affect your health factor. Make sure your position stays healthy.</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-50">
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              )}

              <button
                className="w-full h-12 bg-black text-white rounded-md transition-all duration-300 hover:bg-black/80 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                onClick={handleContinue}
                disabled={loading || suppliedBalance === 0}
              >
                {borrowedAmount > 0 ? 'Continue' : 'Withdraw'}
              </button>
            </>
          )}

          {/* Step 2: Confirm Withdraw (with borrowed funds) */}
          {step === 2 && (
            <>
              <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-900">
                    <p className="font-medium">Warning: You have active debt</p>
                    <p className="mt-1">Withdrawing collateral while you have borrowed funds may affect your health factor. If your health factor drops below 1.0, your position can be liquidated.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-black/10 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black/60">Amount to Withdraw</span>
                  <span className="text-lg font-bold text-black">${withdrawAmount} USDC</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-black/10">
                  <span className="text-sm text-black/60">Your Borrowed Amount</span>
                  <span className="text-sm font-semibold text-orange-700">${borrowedAmount.toFixed(2)} USDC</span>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-50">
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  className="px-4 h-12 border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  onClick={() => setStep(1)}
                  disabled={withdrawing}
                >
                  Back
                </button>
                <button
                  className="flex-1 h-12 bg-black text-white rounded-md transition-all duration-300 hover:bg-black/80 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                >
                  {withdrawing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Withdrawing...
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4" />
                      Confirm Withdraw
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto animate-pulse" />
              <div>
                <h3 className="text-lg font-semibold text-black">Withdrawal Successful!</h3>
                <p className="text-sm text-black/60">
                  You withdrew ${withdrawAmount} USDC
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

