/**
 * Borrow Interface Component
 * 
 * Handles borrowing with dynamic collateral requirements based on credit score:
 * - Shows available borrowing power
 * - Displays collateral factor from credit score
 * - Real-time collateral calculation with slider
 * - Calls borrow() which internally queries CreditScoreOracle
 */

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, TrendingDown, Info, CheckCircle2 } from 'lucide-react';
import { CONTRACTS, LENDING_POOL_ABI, calculateCollateralFactor, calculateInterestRate, getScoreColor } from '@/lib/contracts';
import { handleTransactionError } from '@/lib/errorHandler';
import { getBestProvider, callWithTimeout } from '@/lib/rpcProvider';
import { AuroraText } from '@/components/ui/aurora-text';

export default function BorrowInterface({ userAddress, creditScore, onSuccess, provider }) {
  const [borrowAmount, setBorrowAmount] = useState(0);
  const [inputValue, setInputValue] = useState('0.00'); // Display value for payment-style input
  const [maxBorrow, setMaxBorrow] = useState(0);
  const [borrowing, setBorrowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liquidityLimited, setLiquidityLimited] = useState(false);
  const [creditLimit, setCreditLimit] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState({ amount: 0, txHash: '' });
  const inputRef = useRef(null);

  // Calculate collateral factor from credit score
  const collateralFactor = calculateCollateralFactor(creditScore);
  
  // Calculate interest rate from credit score
  const interestRate = calculateInterestRate(creditScore);
  
  // Get dynamic color for credit score display
  const scoreColor = getScoreColor(creditScore);

  // Fetch max borrowing capacity (recalculate when credit score changes)
  useEffect(() => {
    if (userAddress && provider && creditScore >= 0) {
      fetchMaxBorrow();
    }
  }, [userAddress, provider, creditScore, collateralFactor]);

  const fetchMaxBorrow = async () => {
    try {
      setLoading(true);
      
      // Get reliable provider with fallback support
      const reliableProvider = await getBestProvider(provider);
      
      const lendingPool = new ethers.Contract(
        CONTRACTS.LENDING_POOL,
        LENDING_POOL_ABI,
        reliableProvider
      );

      // Get user account data with timeout and retry
      const accountData = await callWithTimeout(
        () => lendingPool.getUserAccountData(userAddress),
        { timeout: 30000, retries: 2 }
      ).catch(() => null);
      
      if (!accountData) {
        throw new Error('Disconnected');
      }
      
      // Get asset data to check pool liquidity with timeout
      const assetData = await callWithTimeout(
        () => lendingPool.assets(CONTRACTS.MOCK_USDC),
        { timeout: 30000, retries: 2 }
      ).catch(() => null);
      
      if (!assetData) {
        throw new Error('Disconnected');
      }
      
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
      const initialAmount = Math.max(0, actualBorrowableAmount * 0.5);
      setBorrowAmount(initialAmount);
      setInputValue(initialAmount.toFixed(2));
    } catch (error) {
      console.error('Error fetching max borrow:', error);
      if (String(error?.message || '').toLowerCase().includes('disconnect')) {
        // silent when disconnecting
        return;
      }
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
      setInputValue('0.00');
      
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

  // Payment-style input handler
  const handlePaymentInput = (e) => {
    const key = e.key;
    
    // Handle backspace
    if (key === 'Backspace') {
      e.preventDefault();
      const currentCents = Math.round(borrowAmount * 100);
      const newCents = Math.floor(currentCents / 10);
      const newAmount = newCents / 100;
      const cappedAmount = Math.min(newAmount, maxBorrow);
      setBorrowAmount(cappedAmount);
      setInputValue(cappedAmount.toFixed(2));
      return;
    }
    
    // Handle number keys
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      const digit = parseInt(key);
      const currentCents = Math.round(borrowAmount * 100);
      const newCents = currentCents * 10 + digit;
      const newAmount = newCents / 100;
      
      // Cap to max borrow
      if (newAmount <= maxBorrow) {
        setBorrowAmount(newAmount);
        setInputValue(newAmount.toFixed(2));
      }
    }
  };
  
  // Sync slider changes to input
  const handleSliderChange = (value) => {
    setBorrowAmount(value);
    setInputValue(value.toFixed(2));
  };

  // Ensure caret starts at the end on mousedown (prevents initial left flicker)
  const handleMouseDownInput = (e) => {
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
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
        <div className="max-w-xl mx-auto p-6 bg-muted rounded-lg space-y-6">
          <div className="text-center space-y-3">
            <span className="text-base font-medium block text-black">Your Credit Score</span>
            <span className={`text-8xl font-bold block ${scoreColor}`}>{creditScore}</span>
          </div>
          
          {/* Collateral Factor */}
          <div className="text-center space-y-3">
            <span className="text-base font-medium block text-black">Collateral Factor</span>
            <AuroraText 
              className={`text-7xl font-bold leading-none ${
                creditScore >= 900 ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500' : 
                creditScore >= 800 ? 'bg-gradient-to-r from-green-500 via-lime-500 to-emerald-500' :
                creditScore >= 700 ? 'bg-gradient-to-r from-lime-500 via-yellow-500 to-green-500' :
                creditScore >= 600 ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500' :
                creditScore >= 500 ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500' :
                'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500'
              }`}
            >
              {collateralFactor}%
            </AuroraText>
          </div>
          
          {/* Interest Rate Pill */}
          <div className="flex justify-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-black border border-black">
              Current Interest Rate: {interestRate}% APR
            </div>
          </div>
        </div>

        {/* Credit Limit Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Credit Limit</span>
            <span className="text-lg font-semibold flex items-center gap-1.5">
              {creditLimit.toFixed(2)} <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={16} height={16} className="inline" /> USDC
            </span>
          </div>
        </div>

        {/* Liquidity Warning */}
        {liquidityLimited && maxBorrow > 0 && (
          <Alert className="border-red-500 bg-red-50">
            <AlertDescription className="flex items-center gap-2 text-sm text-red-700">
              <Info className="h-4 w-4 flex-shrink-0 text-red-600" />
              <span className="flex items-center gap-1 flex-wrap">
                <strong>Note:</strong> Pool liquidity is currently limiting you to <strong className="flex items-center gap-1">{maxBorrow.toFixed(2)} <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={14} height={14} className="inline" /> USDC</strong>. More will become available as others supply collateral.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {maxBorrow > 0 ? (
          <>
            {/* Borrow Amount Input and Slider */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Borrow Amount</label>
              
              {/* Direct Input Field - Payment Style */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onKeyDown={handlePaymentInput}
                  onChange={() => {}} // Prevent default onChange
                  onMouseDown={handleMouseDownInput}
                  onFocus={(e) => {
                    // Move cursor to the end when focused
                    const length = e.target.value.length;
                    e.target.setSelectionRange(length, length);
                  }}
                  onClick={(e) => {
                    // Always position cursor at the end on click
                    const length = e.target.value.length;
                    e.target.setSelectionRange(length, length);
                  }}
                  placeholder="0.00"
                  className="w-full px-4 py-3 pr-20 text-right text-2xl font-bold text-black border border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 bg-white cursor-text"
                  inputMode="numeric"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-black/60 font-medium flex items-center gap-1.5">
                  <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={16} height={16} className="inline" /> USDC
                </div>
              </div>
              
              {/* Slider */}
              <Slider
                min={0}
                max={maxBorrow}
                step={0.01}
                value={[borrowAmount]}
                onValueChange={(value) => handleSliderChange(value[0])}
                className="py-4"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span className="flex items-center gap-1">
                  {maxBorrow.toFixed(2)} <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={12} height={12} className="inline" /> USDC
                </span>
              </div>
            </div>

            {/* Collateral Calculation */}
            {borrowAmount > 0 && (
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Required Collateral</p>
                    <p className="text-xl font-bold flex items-center gap-1.5">
                      {requiredCollateral.toFixed(2)} <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={16} height={16} className="inline" /> USDC
                    </p>
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
                  <span className="flex items-center gap-1.5">
                    Borrow {borrowAmount.toFixed(2)} <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={16} height={16} className="inline" /> USDC
                  </span>
                </>
              )}
            </Button>
          </>
        ) : (
          <Alert>
            <AlertDescription className="flex items-center gap-2">
              <Info className="h-4 w-4 flex-shrink-0" />
              <span className="flex items-center gap-1 flex-wrap">
                You need to supply collateral before you can borrow. Go to the Supply tab to deposit <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={14} height={14} className="inline" /> USDC.
              </span>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>

    {/* Success Modal */}
    <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
      <DialogContent className="sm:max-w-md bg-white border-black/10">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <DialogTitle className="text-center text-black text-2xl font-bold">Borrow Successful!</DialogTitle>
          <DialogDescription className="text-center text-black/60">
            Your borrow transaction has been confirmed on the blockchain.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Borrowed Amount */}
          <div className="flex items-center justify-between p-6 rounded-xl border border-black/10 bg-white">
            <span className="text-sm text-black/60">Amount Borrowed</span>
            <span className="text-lg font-bold text-black flex items-center gap-1.5">
              {successDetails.amount.toFixed(2)} <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={16} height={16} className="inline" /> USDC
            </span>
          </div>
          
          {/* Transaction Hash */}
          <div className="space-y-2">
            <p className="text-sm text-black/60">Transaction Hash</p>
            <a 
              href={`https://devnet-scan.mocachain.org/tx/${successDetails.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-black hover:text-black/70 hover:underline break-all block"
            >
              {successDetails.txHash}
            </a>
          </div>
          
          {/* Next Steps */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-black/10">
            <p className="text-sm text-black/70">
              <strong className="text-black">Next Steps:</strong> Monitor your health factor and make sure to repay your debt on time to avoid liquidation.
            </p>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-center">
          <button
            className="w-full h-12 bg-black text-white rounded-md transition-all duration-300 hover:bg-black/80 hover:scale-[1.02] active:scale-[0.98] font-medium"
            onClick={() => setShowSuccessModal(false)}
          >
            Got it, thanks!
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}

