/**
 * Repay Modal Component
 * 
 * Handles repaying borrowed MockUSDC with two-step flow:
 * 1. Approve LendingPool to spend repayment tokens
 * 2. Repay debt to pool
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { CONTRACTS, LENDING_POOL_ABI, ERC20_ABI } from '@/lib/contracts';
import { Badge } from '@/components/ui/badge';
import { handleTransactionError } from '@/lib/errorHandler';
import { getBestProvider, callWithTimeout } from '@/lib/rpcProvider';

export default function RepayModal({ isOpen, onClose, userAddress, onSuccess, provider }) {
  const [repayAmount, setRepayAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [borrowed, setBorrowed] = useState(0);
  const [totalOwed, setTotalOwed] = useState(0);
  const [interestOwed, setInterestOwed] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [repaying, setRepaying] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = input, 2 = approve, 3 = repay, 4 = success

  // Fetch balance, borrowed amount, and allowance when modal opens
  useEffect(() => {
    if (isOpen && userAddress && provider) {
      fetchData();
    }
  }, [isOpen, userAddress, provider]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get reliable provider with fallback support
      const reliableProvider = await getBestProvider(provider);
      
      const mockUSDC = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        ERC20_ABI,
        reliableProvider
      );

      const lendingPool = new ethers.Contract(
        CONTRACTS.LENDING_POOL,
        LENDING_POOL_ABI,
        reliableProvider
      );

      // Get user's USDC balance with timeout and retry
      const bal = await callWithTimeout(
        () => mockUSDC.balanceOf(userAddress),
        { timeout: 30000, retries: 2 }
      );
      const balFormatted = Number(ethers.formatUnits(bal, 6));
      
      // Get borrowed amount with timeout and retry
      const borr = await callWithTimeout(
        () => lendingPool.getUserBorrowed(userAddress, CONTRACTS.MOCK_USDC),
        { timeout: 30000, retries: 2 }
      );
      const borrFormatted = Number(ethers.formatUnits(borr, 6));

      // Get total owed (principal + interest)
      const owed = await callWithTimeout(
        () => lendingPool.getBorrowBalanceWithInterest(userAddress, CONTRACTS.MOCK_USDC),
        { timeout: 30000, retries: 2 }
      );
      const owedFormatted = Number(ethers.formatUnits(owed, 6));

      // Get interest only
      const interest = await callWithTimeout(
        () => lendingPool.getAccruedInterest(userAddress, CONTRACTS.MOCK_USDC),
        { timeout: 30000, retries: 2 }
      );
      const interestFormatted = Number(ethers.formatUnits(interest, 6));
      
      // Get current allowance for LendingPool with timeout and retry
      const allow = await callWithTimeout(
        () => mockUSDC.allowance(userAddress, CONTRACTS.LENDING_POOL),
        { timeout: 30000, retries: 2 }
      );
      const allowFormatted = Number(ethers.formatUnits(allow, 6));

      setBalance(balFormatted);
      setBorrowed(borrFormatted);
      setTotalOwed(owedFormatted);
      setInterestOwed(interestFormatted);
      setAllowance(allowFormatted);
      
      console.log('Balance:', balFormatted, 'USDC, Borrowed:', borrFormatted, 'USDC, Interest:', interestFormatted, 'USDC, Total Owed:', owedFormatted, 'USDC, Allowance:', allowFormatted, 'USDC');
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      setError('');

      const signer = await provider.getSigner();
      
      const mockUSDC = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        ERC20_ABI,
        signer
      );

      // Approve LendingPool to spend tokens
      const amount = ethers.parseUnits(repayAmount, 6);
      
      console.log('Approving LendingPool to spend', repayAmount, 'USDC for repayment');
      
      const tx = await mockUSDC.approve(CONTRACTS.LENDING_POOL, amount);
      
      console.log('Approval transaction submitted:', tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      console.log('Approval confirmed');
      
      // Update allowance
      await fetchData();
      
      // Move to repay step
      setStep(3);
    } catch (error) {
      const errorMessage = handleTransactionError('Approve USDC', error);
      setError(errorMessage);
    } finally {
      setApproving(false);
    }
  };

  const handleRepay = async () => {
    try {
      setRepaying(true);
      setError('');

      const signer = await provider.getSigner();
      
      const lendingPool = new ethers.Contract(
        CONTRACTS.LENDING_POOL,
        LENDING_POOL_ABI,
        signer
      );

      // Repay debt to pool
      const amount = ethers.parseUnits(repayAmount, 6);
      
      console.log('Repaying', repayAmount, 'USDC to LendingPool');
      
      const tx = await lendingPool.repay(CONTRACTS.MOCK_USDC, amount);
      
      console.log('Repay transaction submitted:', tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      console.log('Repay transaction confirmed');
      
      // Move to success step
      setStep(4);
      
      // Call success callback after a short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      }, 2000);
    } catch (error) {
      const errorMessage = handleTransactionError('Repay', error);
      setError(errorMessage);
    } finally {
      setRepaying(false);
    }
  };

  const handleContinue = () => {
    // Validate input
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(repayAmount) > balance) {
      setError('Insufficient balance');
      return;
    }

    // Check if we need approval
    if (parseFloat(repayAmount) > allowance) {
      setStep(2); // Need approval
    } else {
      setStep(3); // Already approved, go to repay
    }
  };

  const handleClose = () => {
    setRepayAmount('');
    setStep(1);
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-black/10">
        <DialogHeader>
          <DialogTitle className="text-black text-xl font-bold">Repay Debt</DialogTitle>
          <DialogDescription className="text-black/60">
            Repay your borrowed USDC to reduce debt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Input Amount */}
          {step === 1 && (
            <>
              {/* Balance and Borrowed Display */}
              <div className="p-6 rounded-xl border border-black/10 bg-white">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary">Summary</Badge>
                  <span className="text-xs text-black/60">Total Owed = Principal + Accrued Interest</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-black/60">Your Balance</p>
                    <p className="text-lg font-bold text-black">{balance.toFixed(2)} USDC</p>
                  </div>
                  <div>
                    <p className="text-sm text-black/60">Total Owed</p>
                    <p className="text-lg font-bold text-red-500">{totalOwed.toFixed(2)} USDC</p>
                  </div>
                </div>

                {/* Interest Breakdown */}
                <div className="mb-1">
                  <Badge variant="secondary">Breakdown</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-black/60">Principal</p>
                    <p className="text-lg font-semibold text-black">{borrowed.toFixed(2)} USDC</p>
                  </div>
                  <div>
                    <p className="text-sm text-black/60">Accrued Interest</p>
                    <p className={`text-lg font-semibold ${interestOwed > 0 ? 'text-orange-600' : 'text-black'}`}>+{interestOwed.toFixed(2)} USDC</p>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">Amount to Repay</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 pr-16 text-lg border border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 bg-white text-black"
                      step="0.01"
                      min="0"
                      max={Math.min(balance, totalOwed)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-black/60">
                      USDC
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-3 py-2 text-sm border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setRepayAmount((totalOwed * 0.25).toFixed(2))}
                      disabled={balance === 0}
                    >
                      25%
                    </button>
                    <button
                      className="flex-1 px-3 py-2 text-sm border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setRepayAmount((totalOwed * 0.5).toFixed(2))}
                      disabled={balance === 0}
                    >
                      50%
                    </button>
                    <button
                      className="flex-1 px-3 py-2 text-sm border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setRepayAmount((totalOwed * 0.75).toFixed(2))}
                      disabled={balance === 0}
                    >
                      75%
                    </button>
                    <button
                      className="flex-1 px-3 py-2 text-sm border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black disabled:opacity-50 disabled:cursor-not-allowed"
                      // Add a small buffer to cover interest accrued between fetch and repay
                      onClick={() => {
                        const buffer = 0.10; // Small buffer for interest that accrues during transaction
                        const target = Math.min(balance, totalOwed + buffer);
                        setRepayAmount(target.toFixed(2));
                      }}
                      disabled={balance === 0}
                      title="Includes $0.10 buffer for interest accruing during transaction. Contract auto-caps to exact amount owed - you won't overpay!"
                    >
                      Pay Total
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Info about Pay Total buffer */}
              {repayAmount && parseFloat(repayAmount) > totalOwed && (
                <div className="p-4 rounded-xl border border-black/10 bg-neutral-50">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-black/60 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-black/70">
                      <p className="font-semibold mb-1 text-black">Why is the amount higher than what I owe?</p>
                      <p>The extra $0.10 buffer covers interest that accrues during the transaction (a few seconds). The smart contract automatically caps the payment to your exact debt, so <strong className="text-black">you won't be charged extra</strong>.</p>
                    </div>
                  </div>
                </div>
              )}

              {totalOwed === 0 && (
                <div className="p-4 rounded-xl border border-black/10 bg-neutral-50">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-black/60 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-black/70">
                      You don't have any outstanding debt to repay.
                    </p>
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
                disabled={loading || totalOwed === 0}
              >
                Continue
              </button>
            </>
          )}

          {/* Step 2: Approve */}
          {step === 2 && (
            <>
              <div className="p-4 rounded-xl border border-black/10 bg-neutral-50">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-black/60 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-black/70">
                    You need to approve the LendingPool contract to spend your USDC tokens for repayment.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-black/10 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black/60">Amount to Repay</span>
                  <span className="text-lg font-bold text-black">{repayAmount} USDC</span>
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
                  disabled={approving}
                >
                  Back
                </button>
                <button
                  className="flex-1 h-12 bg-black text-white rounded-md transition-all duration-300 hover:bg-black/80 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  onClick={handleApprove}
                  disabled={approving}
                >
                  {approving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Step 3: Repay */}
          {step === 3 && (
            <>
              <div className="p-4 rounded-xl border border-black/10 bg-neutral-50">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-black/60 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-black/70">
                    Confirm the transaction to repay your debt.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-black/10 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black/60">Amount to Repay</span>
                  <span className="text-lg font-bold text-black">{repayAmount} USDC</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-black/10">
                  <span className="text-sm text-black/60">New Debt</span>
                  <span className="text-lg font-semibold text-black">
                    {Math.max(0, totalOwed - parseFloat(repayAmount || '0')).toFixed(2)} USDC
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-50">
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              )}

              <button
                className="w-full h-12 bg-black text-white rounded-md transition-all duration-300 hover:bg-black/80 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                onClick={handleRepay}
                disabled={repaying}
              >
                {repaying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Repaying...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Repay {repayAmount} USDC
                  </>
                )}
              </button>
            </>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto animate-pulse" />
              <div>
                <h3 className="text-lg font-semibold text-black">Repayment Successful!</h3>
                <p className="text-sm text-black/60">
                  You repaid {repayAmount} USDC
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

