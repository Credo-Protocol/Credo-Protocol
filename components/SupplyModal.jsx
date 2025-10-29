/**
 * Supply Modal Component
 * 
 * Handles depositing MockUSDC into LendingPool with two-step flow:
 * 1. Approve LendingPool to spend tokens
 * 2. Supply tokens to pool
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { CONTRACTS, LENDING_POOL_ABI, ERC20_ABI } from '@/lib/contracts';
import { handleTransactionError } from '@/lib/errorHandler';
import { getBestProvider, callWithTimeout } from '@/lib/rpcProvider';

export default function SupplyModal({ isOpen, onClose, userAddress, onSuccess, provider }) {
  const [supplyAmount, setSupplyAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [supplying, setSupplying] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = input, 2 = approve, 3 = supply, 4 = success

  // Fetch balance and allowance when modal opens
  useEffect(() => {
    if (isOpen && userAddress && provider) {
      fetchBalanceAndAllowance();
    }
  }, [isOpen, userAddress, provider]);

  const fetchBalanceAndAllowance = async () => {
    try {
      setLoading(true);
      
      // Get reliable provider with fallback support
      const reliableProvider = await getBestProvider(provider);
      
      const mockUSDC = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        ERC20_ABI,
        reliableProvider
      );

      // Get user's USDC balance with timeout and retry
      const bal = await callWithTimeout(
        () => mockUSDC.balanceOf(userAddress),
        { timeout: 30000, retries: 2 }
      );
      const balFormatted = Number(ethers.formatUnits(bal, 6)); // MockUSDC has 6 decimals
      
      // Get current allowance for LendingPool with timeout and retry
      const allow = await callWithTimeout(
        () => mockUSDC.allowance(userAddress, CONTRACTS.LENDING_POOL),
        { timeout: 30000, retries: 2 }
      );
      const allowFormatted = Number(ethers.formatUnits(allow, 6));

      setBalance(balFormatted);
      setAllowance(allowFormatted);
      
      console.log('Balance:', balFormatted, 'USDC, Allowance:', allowFormatted, 'USDC');
    } catch (error) {
      console.error('Error fetching balance/allowance:', error);
      setError('Failed to fetch balance');
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
      const amount = ethers.parseUnits(supplyAmount, 6);
      
      console.log('Approving LendingPool to spend', supplyAmount, 'USDC');
      
      const tx = await mockUSDC.approve(CONTRACTS.LENDING_POOL, amount);
      
      console.log('Approval transaction submitted:', tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      console.log('Approval confirmed');
      
      // Update allowance
      await fetchBalanceAndAllowance();
      
      // Move to supply step
      setStep(3);
    } catch (error) {
      const errorMessage = handleTransactionError('Approve USDC', error);
      setError(errorMessage);
      
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
      setApproving(false);
    }
  };

  const handleSupply = async () => {
    try {
      setSupplying(true);
      setError('');

      const signer = await provider.getSigner();
      
      const lendingPool = new ethers.Contract(
        CONTRACTS.LENDING_POOL,
        LENDING_POOL_ABI,
        signer
      );

      // Supply tokens to pool
      const amount = ethers.parseUnits(supplyAmount, 6);
      
      console.log('Supplying', supplyAmount, 'USDC to LendingPool');
      
      const tx = await lendingPool.supply(CONTRACTS.MOCK_USDC, amount);
      
      console.log('Supply transaction submitted:', tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      console.log('Supply transaction confirmed');
      
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
      const errorMessage = handleTransactionError('Supply', error);
      setError(errorMessage);
      
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
      setSupplying(false);
    }
  };

  const handleContinue = () => {
    // Validate input
    if (!supplyAmount || parseFloat(supplyAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(supplyAmount) > balance) {
      setError('Insufficient balance');
      return;
    }

    // Check if we need approval
    if (parseFloat(supplyAmount) > allowance) {
      setStep(2); // Need approval
    } else {
      setStep(3); // Already approved, go to supply
    }
  };

  const handleClose = () => {
    setSupplyAmount('');
    setStep(1);
    setError('');
    onClose();
  };

  const handleFaucet = async () => {
    try {
      setLoading(true);
      const signer = await provider.getSigner();
      
      const mockUSDC = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        ERC20_ABI,
        signer
      );

      // Request 10,000 USDC from faucet
      const faucetAmount = ethers.parseUnits('10000', 6);
      
      console.log('Requesting USDC from faucet...');
      
      const tx = await mockUSDC.faucet(userAddress, faucetAmount);
      await tx.wait();
      
      console.log('Faucet request successful');
      
      // Refresh balance
      await fetchBalanceAndAllowance();
    } catch (error) {
      console.error('Error requesting faucet:', error);
      setError('Failed to get USDC from faucet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-black/10">
        <DialogHeader>
          <DialogTitle className="text-black text-xl font-bold">Supply Collateral</DialogTitle>
          <DialogDescription className="text-black/60">
            Deposit USDC to use as collateral for borrowing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Input Amount */}
          {step === 1 && (
            <>
              {/* Balance Display */}
              <div className="p-6 rounded-xl border border-black/10 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-black/60">Your Balance</span>
                  <div className="text-right">
                    <p className="text-lg font-bold text-black">${balance.toFixed(2)} USDC</p>
                    {balance === 0 && (
                      <button
                        onClick={handleFaucet}
                        disabled={loading}
                        className="text-sm text-black/70 hover:text-black underline mt-1 disabled:opacity-50"
                      >
                        Get test USDC
                      </button>
                    )}
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">Amount to Supply</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-black/40">
                      $
                    </div>
                    <input
                      type="number"
                      value={supplyAmount}
                      onChange={(e) => setSupplyAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-16 py-3 text-lg border border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 bg-white text-black"
                      step="0.01"
                      min="0"
                      max={balance}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-black/60">
                      USDC
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-3 py-2 text-sm border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black"
                      onClick={() => setSupplyAmount((balance * 0.25).toFixed(2))}
                    >
                      25%
                    </button>
                    <button
                      className="flex-1 px-3 py-2 text-sm border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black"
                      onClick={() => setSupplyAmount((balance * 0.5).toFixed(2))}
                    >
                      50%
                    </button>
                    <button
                      className="flex-1 px-3 py-2 text-sm border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black"
                      onClick={() => setSupplyAmount((balance * 0.75).toFixed(2))}
                    >
                      75%
                    </button>
                    <button
                      className="flex-1 px-3 py-2 text-sm border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black"
                      onClick={() => setSupplyAmount(balance.toFixed(2))}
                    >
                      Max
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-50">
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              )}

              <button
                className="w-full h-12 bg-black text-white rounded-md transition-all duration-300 hover:bg-black/80 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                onClick={handleContinue}
                disabled={loading}
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
                    You need to approve the LendingPool contract to spend your USDC tokens.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-black/10 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black/60">Amount to Supply</span>
                  <span className="text-lg font-bold text-black">${supplyAmount} USDC</span>
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

          {/* Step 3: Supply */}
          {step === 3 && (
            <>
              <div className="p-4 rounded-xl border border-black/10 bg-neutral-50">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-black/60 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-black/70">
                    Confirm the transaction to supply your USDC as collateral.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-black/10 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black/60">Amount to Supply</span>
                  <span className="text-lg font-bold text-black">${supplyAmount} USDC</span>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-50">
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              )}

              <button
                className="w-full h-12 bg-black text-white rounded-md transition-all duration-300 hover:bg-black/80 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                onClick={handleSupply}
                disabled={supplying}
              >
                {supplying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Supplying...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Supply ${supplyAmount} USDC
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
                <h3 className="text-lg font-semibold text-black">Supply Successful!</h3>
                <p className="text-sm text-black/60">
                  You supplied ${supplyAmount} USDC as collateral
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

