/**
 * Supply Modal Component
 * 
 * Handles depositing MockUSDC into LendingPool with two-step flow:
 * 1. Approve LendingPool to spend tokens
 * 2. Supply tokens to pool
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, TrendingUp, Coins, Info } from 'lucide-react';
import { CONTRACTS, LENDING_POOL_ABI, ERC20_ABI } from '@/lib/contracts';
import { handleTransactionError } from '@/lib/errorHandler';

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
      
      const mockUSDC = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        ERC20_ABI,
        provider
      );

      // Get user's USDC balance
      const bal = await mockUSDC.balanceOf(userAddress);
      const balFormatted = Number(ethers.formatUnits(bal, 6)); // MockUSDC has 6 decimals
      
      // Get current allowance for LendingPool
      const allow = await mockUSDC.allowance(userAddress, CONTRACTS.LENDING_POOL);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supply Collateral</DialogTitle>
          <DialogDescription>
            Deposit USDC to use as collateral for borrowing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Input Amount */}
          {step === 1 && (
            <>
              {/* Balance Display */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Your Balance</span>
                    <div className="text-right">
                      <p className="text-lg font-bold">{balance.toFixed(2)} USDC</p>
                      {balance === 0 && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          onClick={handleFaucet}
                          disabled={loading}
                          className="p-0 h-auto"
                        >
                          Get test USDC
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount to Supply</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={supplyAmount}
                        onChange={(e) => setSupplyAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 pr-16 text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        step="0.01"
                        min="0"
                        max={balance}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        USDC
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSupplyAmount((balance * 0.25).toFixed(2))}
                      >
                        25%
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSupplyAmount((balance * 0.5).toFixed(2))}
                      >
                        50%
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSupplyAmount((balance * 0.75).toFixed(2))}
                      >
                        75%
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSupplyAmount(balance.toFixed(2))}
                      >
                        Max
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" size="lg" onClick={handleContinue} disabled={loading}>
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
                  You need to approve the LendingPool contract to spend your USDC tokens.
                </AlertDescription>
              </Alert>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount to Supply</span>
                    <span className="text-lg font-bold">{supplyAmount} USDC</span>
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

          {/* Step 3: Supply */}
          {step === 3 && (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Confirm the transaction to supply your USDC as collateral.
                </AlertDescription>
              </Alert>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount to Supply</span>
                    <span className="text-lg font-bold">{supplyAmount} USDC</span>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" size="lg" onClick={handleSupply} disabled={supplying}>
                {supplying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Supplying...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Supply {supplyAmount} USDC
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
                <h3 className="text-lg font-semibold">Supply Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  You supplied {supplyAmount} USDC as collateral
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

