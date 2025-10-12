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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, TrendingDown, Info, CheckCircle2 } from 'lucide-react';
import { CONTRACTS, LENDING_POOL_ABI, calculateCollateralFactor } from '@/lib/contracts';
import { handleTransactionError } from '@/lib/errorHandler';

export default function BorrowInterface({ userAddress, creditScore, onSuccess, provider }) {
  const [borrowAmount, setBorrowAmount] = useState(0);
  const [maxBorrow, setMaxBorrow] = useState(0);
  const [borrowing, setBorrowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liquidityLimited, setLiquidityLimited] = useState(false);
  const [creditLimit, setCreditLimit] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState({ amount: 0, txHash: '' });

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
      
      // Get asset data to check pool liquidity (assets is a public mapping)
      const assetData = await lendingPool.assets(CONTRACTS.MOCK_USDC);
      
      // MockUSDC uses 6 decimals
      const totalCollateralUSD = Number(ethers.formatUnits(accountData[0], 6));
      const totalDebtUSD = Number(ethers.formatUnits(accountData[1], 6));
      
      // Calculate pool's available liquidity
      const poolTotalSupply = Number(ethers.formatUnits(assetData[0], 6));
      const poolTotalBorrowed = Number(ethers.formatUnits(assetData[1], 6));
      const poolAvailableLiquidity = poolTotalSupply - poolTotalBorrowed;
      
      // Calculate max borrow based on user's credit score collateral factor
      // availableBorrowsUSD = (collateral / collateralFactor) - currentDebt
      const maxBorrowFromCollateral = (totalCollateralUSD / collateralFactor) * 100;
      const availableBorrowsFromCredit = maxBorrowFromCollateral - totalDebtUSD;
      
      // Show credit-based limit in the UI (what user's score allows)
      const availableBorrowsUSD = Math.max(0, availableBorrowsFromCredit);
      
      // Check if pool liquidity is the limiting factor
      const isLiquidityLimited = poolAvailableLiquidity < availableBorrowsFromCredit;
      
      // Actual borrowable amount (limited by pool liquidity)
      const actualBorrowableAmount = Math.max(0, Math.min(availableBorrowsFromCredit, poolAvailableLiquidity));
      
      console.log('Max borrow calculation:', {
        totalCollateral: totalCollateralUSD,
        totalDebt: totalDebtUSD,
        creditScore,
        collateralFactor: collateralFactor + '%',
        creditLimit: availableBorrowsFromCredit,
        poolLiquidity: poolAvailableLiquidity,
        displayedLimit: availableBorrowsUSD,
        actualBorrowable: actualBorrowableAmount,
        liquidityLimited: isLiquidityLimited
      });
      
      // Set max borrow to actual borrowable amount (respects pool liquidity)
      setMaxBorrow(actualBorrowableAmount);
      setCreditLimit(availableBorrowsUSD);
      setLiquidityLimited(isLiquidityLimited);
      
      // Set initial borrow amount to 50% of actual borrowable
      setBorrowAmount(Math.max(0, actualBorrowableAmount * 0.5));
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
      
      // Store success details for modal
      setSuccessDetails({
        amount: borrowAmount,
        txHash: tx.hash
      });
      
      // Wait a moment for blockchain state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh max borrow amount immediately
      await fetchMaxBorrow();
      
      // Reset borrow amount
      setBorrowAmount(0);
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Call success callback to refresh parent UI
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = handleTransactionError('Borrow', error);
      setError(errorMessage);
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
    <>
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

        {/* Credit Limit Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Credit Limit</span>
            <span className="text-lg font-semibold">{creditLimit.toFixed(2)} USDC</span>
          </div>
        </div>

        {/* Liquidity Warning */}
        {liquidityLimited && maxBorrow > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Note:</strong> Pool liquidity is currently limiting you to <strong>{maxBorrow.toFixed(2)} USDC</strong>. More will become available as others supply collateral.
            </AlertDescription>
          </Alert>
        )}

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

    {/* Success Modal */}
    <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-green-100">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">Borrow Successful!</DialogTitle>
          <DialogDescription className="text-center">
            Your borrow transaction has been confirmed on the blockchain.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Borrowed Amount */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">Amount Borrowed</span>
            <span className="text-lg font-bold">{successDetails.amount.toFixed(2)} USDC</span>
          </div>
          
          {/* Transaction Hash */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Transaction Hash</p>
            <a 
              href={`https://devnet-scan.mocachain.org/tx/${successDetails.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline break-all"
            >
              {successDetails.txHash}
            </a>
          </div>
          
          {/* Next Steps */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Next Steps:</strong> Monitor your health factor and make sure to repay your debt on time to avoid liquidation.
            </p>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={() => setShowSuccessModal(false)}
            className="w-full sm:w-auto"
          >
            Got it, thanks!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}

