/**
 * Repay Modal Component
 * 
 * Handles repaying borrowed MockUSDC with two-step flow:
 * 1. Approve LendingPool to spend repayment tokens
 * 2. Repay debt to pool
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { CONTRACTS, LENDING_POOL_ABI, ERC20_ABI } from '@/lib/contracts';

export default function RepayModal({ isOpen, onClose, userAddress, onSuccess, provider }) {
  const [repayAmount, setRepayAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [borrowed, setBorrowed] = useState(0);
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
      
      const mockUSDC = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        ERC20_ABI,
        provider
      );

      const lendingPool = new ethers.Contract(
        CONTRACTS.LENDING_POOL,
        LENDING_POOL_ABI,
        provider
      );

      // Get user's USDC balance
      const bal = await mockUSDC.balanceOf(userAddress);
      const balFormatted = Number(ethers.formatUnits(bal, 6));
      
      // Get borrowed amount
      const borr = await lendingPool.getUserBorrowed(userAddress, CONTRACTS.MOCK_USDC);
      const borrFormatted = Number(ethers.formatUnits(borr, 6));
      
      // Get current allowance for LendingPool
      const allow = await mockUSDC.allowance(userAddress, CONTRACTS.LENDING_POOL);
      const allowFormatted = Number(ethers.formatUnits(allow, 6));

      setBalance(balFormatted);
      setBorrowed(borrFormatted);
      setAllowance(allowFormatted);
      
      console.log('Balance:', balFormatted, 'USDC, Borrowed:', borrFormatted, 'USDC, Allowance:', allowFormatted, 'USDC');
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
      console.error('Error approving:', error);
      setError(error.message || 'Failed to approve. Please try again.');
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
      console.error('Error repaying:', error);
      setError(error.message || 'Failed to repay. Please try again.');
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

    if (parseFloat(repayAmount) > borrowed) {
      setError('Repay amount exceeds borrowed amount');
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Repay Debt</DialogTitle>
          <DialogDescription>
            Repay your borrowed USDC to reduce debt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Input Amount */}
          {step === 1 && (
            <>
              {/* Balance and Borrowed Display */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Your Balance</p>
                      <p className="text-lg font-bold">{balance.toFixed(2)} USDC</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Borrowed</p>
                      <p className="text-lg font-bold text-red-500">{borrowed.toFixed(2)} USDC</p>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount to Repay</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 pr-16 text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        step="0.01"
                        min="0"
                        max={Math.min(balance, borrowed)}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        USDC
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setRepayAmount((borrowed * 0.25).toFixed(2))}
                        disabled={balance === 0}
                      >
                        25%
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setRepayAmount((borrowed * 0.5).toFixed(2))}
                        disabled={balance === 0}
                      >
                        50%
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setRepayAmount((borrowed * 0.75).toFixed(2))}
                        disabled={balance === 0}
                      >
                        75%
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setRepayAmount(Math.min(balance, borrowed).toFixed(2))}
                        disabled={balance === 0}
                      >
                        Max
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {borrowed === 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You don't have any outstanding debt to repay.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleContinue} 
                disabled={loading || borrowed === 0}
              >
                Continue
              </Button>
            </>
          )}

          {/* Step 2: Approve */}
          {step === 2 && (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You need to approve the LendingPool contract to spend your USDC tokens for repayment.
                </AlertDescription>
              </Alert>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount to Repay</span>
                    <span className="text-lg font-bold">{repayAmount} USDC</span>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} disabled={approving}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleApprove} disabled={approving}>
                  {approving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Repay */}
          {step === 3 && (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Confirm the transaction to repay your debt.
                </AlertDescription>
              </Alert>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount to Repay</span>
                    <span className="text-lg font-bold">{repayAmount} USDC</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-muted-foreground">New Debt</span>
                    <span className="text-lg font-semibold">
                      {(borrowed - parseFloat(repayAmount)).toFixed(2)} USDC
                    </span>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" size="lg" onClick={handleRepay} disabled={repaying}>
                {repaying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Repaying...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Repay {repayAmount} USDC
                  </>
                )}
              </Button>
            </>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto animate-pulse" />
              <div>
                <h3 className="text-lg font-semibold">Repayment Successful!</h3>
                <p className="text-sm text-muted-foreground">
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

