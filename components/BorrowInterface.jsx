/**
 * Borrow Interface Component
 * 
 * Handles borrowing with dynamic collateral requirements based on credit score:
 * - Shows available borrowing power
 * - Displays collateral factor from credit score
 * - Real-time collateral calculation with slider
 * - Calls borrow() which internally queries CreditScoreOracle
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingDown, Info } from 'lucide-react';
import { CONTRACTS, LENDING_POOL_ABI, calculateCollateralFactor } from '@/lib/contracts';

export default function BorrowInterface({ userAddress, creditScore, onSuccess, provider }) {
  const [borrowAmount, setBorrowAmount] = useState(0);
  const [maxBorrow, setMaxBorrow] = useState(0);
  const [borrowing, setBorrowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calculate collateral factor from credit score
  const collateralFactor = calculateCollateralFactor(creditScore);

  // Fetch max borrowing capacity (recalculate when credit score changes)
  useEffect(() => {
    if (userAddress && provider && creditScore >= 0) {
      fetchMaxBorrow();
    }
  }, [userAddress, provider, creditScore, collateralFactor]);

  const fetchMaxBorrow = async () => {
    try {
      setLoading(true);
      
      const lendingPool = new ethers.Contract(
        CONTRACTS.LENDING_POOL,
        LENDING_POOL_ABI,
        provider
      );

      // Get user account data
      const accountData = await lendingPool.getUserAccountData(userAddress);
      
      // MockUSDC uses 6 decimals
      const totalCollateralUSD = Number(ethers.formatUnits(accountData[0], 6));
      const totalDebtUSD = Number(ethers.formatUnits(accountData[1], 6));
      
      // Calculate max borrow based on user's credit score collateral factor
      // availableBorrowsUSD = (collateral / collateralFactor) - currentDebt
      const maxBorrowFromCollateral = (totalCollateralUSD / collateralFactor) * 100;
      const availableBorrowsUSD = maxBorrowFromCollateral - totalDebtUSD;
      
      console.log('Max borrow calculation:', {
        totalCollateral: totalCollateralUSD,
        totalDebt: totalDebtUSD,
        creditScore,
        collateralFactor: collateralFactor + '%',
        maxBorrow: maxBorrowFromCollateral,
        available: availableBorrowsUSD
      });
      
      // For simplicity, assume 1 USDC = 1 USD
      setMaxBorrow(Math.max(0, availableBorrowsUSD));
      
      // Set initial borrow amount to 50% of max
      setBorrowAmount(Math.max(0, availableBorrowsUSD * 0.5));
    } catch (error) {
      console.error('Error fetching max borrow:', error);
      setError('Failed to fetch borrowing capacity');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (borrowAmount <= 0) {
      setError('Please enter a valid borrow amount');
      return;
    }

    if (borrowAmount > maxBorrow) {
      setError('Borrow amount exceeds available capacity');
      return;
    }

    try {
      setBorrowing(true);
      setError('');

      const signer = await provider.getSigner();
      
      const lendingPool = new ethers.Contract(
        CONTRACTS.LENDING_POOL,
        LENDING_POOL_ABI,
        signer
      );

      // Convert borrow amount to 6 decimals (MockUSDC)
      const borrowAmountWei = ethers.parseUnits(borrowAmount.toFixed(6), 6);

      console.log('Borrowing:', borrowAmount, 'USDC');
      
      // Call borrow function
      // This will internally query CreditScoreOracle for user's score
      const tx = await lendingPool.borrow(CONTRACTS.MOCK_USDC, borrowAmountWei);
      
      console.log('Borrow transaction submitted:', tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      console.log('Borrow transaction confirmed');
      
      // Reset state
      setBorrowAmount(0);
      
      // Call success callback to refresh UI
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error borrowing:', error);
      setError(error.message || 'Failed to borrow. Please try again.');
    } finally {
      setBorrowing(false);
    }
  };

  // Calculate required collateral based on borrow amount and collateral factor
  const requiredCollateral = (borrowAmount * collateralFactor) / 100;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Borrow</CardTitle>
          <CardDescription>Loading borrow capacity...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Borrow</CardTitle>
        <CardDescription>Borrow against your supplied collateral</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credit Score Info */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Your Credit Score</span>
            <span className="text-lg font-bold">{creditScore}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Collateral Factor</span>
            <span className="text-sm font-semibold">{collateralFactor}%</span>
          </div>
        </div>

        {/* Max Borrow Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Available to Borrow</span>
            <span className="text-lg font-semibold">{maxBorrow.toFixed(2)} USDC</span>
          </div>
        </div>

        {maxBorrow > 0 ? (
          <>
            {/* Borrow Amount Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Borrow Amount</label>
                <span className="text-2xl font-bold">{borrowAmount.toFixed(2)} USDC</span>
              </div>
              
              <Slider
                min={0}
                max={maxBorrow}
                step={0.01}
                value={[borrowAmount]}
                onValueChange={(value) => setBorrowAmount(value[0])}
                className="py-4"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{maxBorrow.toFixed(2)} USDC</span>
              </div>
            </div>

            {/* Collateral Calculation */}
            {borrowAmount > 0 && (
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Required Collateral</p>
                    <p className="text-xl font-bold">{requiredCollateral.toFixed(2)} USDC</p>
                    <p className="text-xs text-muted-foreground">
                      Based on your {collateralFactor}% collateral factor
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Borrow Button */}
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleBorrow}
              disabled={borrowing || borrowAmount <= 0 || borrowAmount > maxBorrow}
            >
              {borrowing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Borrowing...
                </>
              ) : (
                <>
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Borrow {borrowAmount.toFixed(2)} USDC
                </>
              )}
            </Button>
          </>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You need to supply collateral before you can borrow. Go to the Supply tab to deposit USDC.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

