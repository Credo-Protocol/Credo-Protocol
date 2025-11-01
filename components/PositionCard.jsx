/**
 * Position Card Component
 * 
 * Displays user's lending position including:
 * - Supplied collateral
 * - Borrowed amount
 * - Health factor
 * - Liquidation warnings
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { CONTRACTS, LENDING_POOL_ABI, ERC20_ABI, calculateCollateralFactor, calculateInterestRate, getScoreColor } from '@/lib/contracts';
import { getBestProvider, callWithTimeout } from '@/lib/rpcProvider';
import RepayModal from '@/components/RepayModal';

export default function PositionCard({ userAddress, creditScore, refresh, provider }) {
  const [loading, setLoading] = useState(true);
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [position, setPosition] = useState({
    totalCollateralInUSD: 0,
    totalDebtInUSD: 0,
    availableBorrowsInUSD: 0,
    currentLiquidationThreshold: 0,
    healthFactor: 0,
    suppliedAmount: 0,
    borrowedAmount: 0,
  });
  
  // Phase 3: Real-time interest tracking (Borrow)
  const [accruedInterest, setAccruedInterest] = useState(0);
  const [totalOwed, setTotalOwed] = useState(0);
  const [userAPR, setUserAPR] = useState(0);
  
  // Phase 3: Supply interest tracking (NEW!)
  const [supplyAPY, setSupplyAPY] = useState(0);
  const [earnedInterest, setEarnedInterest] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [supplyTimestamp, setSupplyTimestamp] = useState(0);

  // Calculate credit limit reactively based on current credit score
  // This updates when creditScore changes without needing to refetch position data
  const currentCollateralFactor = calculateCollateralFactor(creditScore);
  const calculatedCreditLimit = position.totalCollateralInUSD > 0 
    ? Math.max(0, (position.totalCollateralInUSD / currentCollateralFactor) * 100 - position.totalDebtInUSD)
    : 0;
  
  // Calculate interest rate and score color
  const interestRate = calculateInterestRate(creditScore);
  const scoreColor = getScoreColor(creditScore);
  
  // Derived net interest summary (annualized)
  // userAPR is in basis points (e.g., 1100 = 11%), supplyAPY is a percent number
  const borrowAPRPercent = userAPR / 100; // e.g., 11.0
  const netAnnualInterest = 
    position.suppliedAmount * (supplyAPY / 100) -
    position.borrowedAmount * (borrowAPRPercent / 100);
  
  // Display helpers declared later (after hasMeaningfulDebt)

  // Fetch position data
  // Note: creditScore is NOT in dependencies because it's only used for display calculations
  // It doesn't affect the fetched data, so we don't need to re-fetch when it changes
  useEffect(() => {
    if (userAddress && provider) {
      fetchPosition();
    }
  }, [userAddress, refresh, provider]);
  
  // Phase 3: Auto-refresh borrow interest every 5 seconds
  // Only run when there's meaningful debt (>= $0.01), not dust amounts
  useEffect(() => {
    if (!userAddress || !provider || position.borrowedAmount < 0.0001) {
      return;
    }
    
    const fetchBorrowInterest = async () => {
      try {
        const reliableProvider = await getBestProvider(null);
        const lendingPool = new ethers.Contract(
          CONTRACTS.LENDING_POOL,
          LENDING_POOL_ABI,
          reliableProvider
        );
        
        // Get total owed (principal + interest)
        const currentDebt = await callWithTimeout(
          () => lendingPool.getBorrowBalanceWithInterest(userAddress, CONTRACTS.MOCK_USDC),
          { timeout: 10000, retries: 1 }
        );
        const currentDebtFormatted = parseFloat(ethers.formatUnits(currentDebt, 6));
        
        // Get accrued interest
        const interest = await callWithTimeout(
          () => lendingPool.getAccruedInterest(userAddress, CONTRACTS.MOCK_USDC),
          { timeout: 10000, retries: 1 }
        );
        const interestFormatted = parseFloat(ethers.formatUnits(interest, 6));
        
        // Get user's APR
        const apr = await callWithTimeout(
          () => lendingPool.getUserAPR(userAddress),
          { timeout: 10000, retries: 1 }
        );
        
        setTotalOwed(currentDebtFormatted);
        setAccruedInterest(interestFormatted);
        setUserAPR(Number(apr));
        
      } catch (error) {
        console.error('Error fetching borrow interest:', error);
      }
    };
    
    // Fetch immediately
    fetchBorrowInterest();
    
    // Then update every 5 seconds
    const interval = setInterval(fetchBorrowInterest, 5000);
    
    return () => clearInterval(interval);
  }, [userAddress, provider, position.borrowedAmount]);

  // Phase 3: Auto-refresh supply interest every 5 seconds (NEW!)
  // Only run when user has supplied collateral
  useEffect(() => {
    if (!userAddress || !provider || position.suppliedAmount < 0.0001) {
      return;
    }
    
    const fetchSupplyInterest = async () => {
      try {
        const reliableProvider = await getBestProvider(null);
        const lendingPool = new ethers.Contract(
          CONTRACTS.LENDING_POOL,
          LENDING_POOL_ABI,
          reliableProvider
        );
        
        // Get pool data to calculate supply APY
        const assetData = await callWithTimeout(
          () => lendingPool.assets(CONTRACTS.MOCK_USDC),
          { timeout: 10000, retries: 1 }
        );
        
        const totalSupply = parseFloat(ethers.formatUnits(assetData.totalSupply, 6));
        const totalBorrowed = parseFloat(ethers.formatUnits(assetData.totalBorrowed, 6));
        const utilizationRate = totalSupply > 0 ? (totalBorrowed / totalSupply) : 0;
        
        // Calculate average borrow APR (simplified - using 12% as base)
        // In production, you'd calculate weighted average of all borrowers
        const avgBorrowAPR = 12; // 12% (matches contract's accrueInterest function)
        
        // Supply APY = Borrow APR × Utilization Rate
        // This is the standard DeFi lending formula
        const calculatedSupplyAPY = avgBorrowAPR * utilizationRate;
        
        // Calculate time elapsed since supply (in seconds)
        // Note: Using current timestamp as approximation
        // In production, track actual supply timestamp on-chain
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const timeElapsed = supplyTimestamp > 0 ? currentTimestamp - supplyTimestamp : 0;
        
        // Calculate earned interest: principal × APY × (time / year)
        // Formula: interest = principal × (APY / 100) × (seconds / 31557600)
        const secondsPerYear = 31557600; // 365.25 days
        const calculatedInterest = timeElapsed > 0 
          ? position.suppliedAmount * (calculatedSupplyAPY / 100) * (timeElapsed / secondsPerYear)
          : 0;
        
        setSupplyAPY(calculatedSupplyAPY);
        setEarnedInterest(calculatedInterest);
        setTotalBalance(position.suppliedAmount + calculatedInterest);
        
      } catch (error) {
        console.error('Error fetching supply interest:', error);
      }
    };
    
    // Fetch immediately
    fetchSupplyInterest();
    
    // Then update every 5 seconds
    const interval = setInterval(fetchSupplyInterest, 5000);
    
    return () => clearInterval(interval);
  }, [userAddress, provider, position.suppliedAmount, supplyTimestamp]);

  const fetchPosition = async () => {
    try {
      setLoading(true);
      
      // IMPORTANT: Always use public provider to avoid AIR Kit caching issues
      // AIR Kit provider can cache getUserSupplied() results even after withdrawals
      const reliableProvider = await getBestProvider(null); // Force public provider
      
      // Get LendingPool contract
      const lendingPool = new ethers.Contract(
        CONTRACTS.LENDING_POOL,
        LENDING_POOL_ABI,
        reliableProvider
      );

      // Get MockUSDC contract
      const mockUSDC = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        ERC20_ABI,
        reliableProvider
      );

      // Fetch user account data from LendingPool with timeout
      const accountData = await callWithTimeout(
        () => lendingPool.getUserAccountData(userAddress),
        { timeout: 30000, retries: 2 }
      ).catch(() => null);
      
      if (!accountData) {
        throw new Error('Disconnected');
      }
      
      // Parse account data first
      // MockUSDC uses 6 decimals, not 8
      const totalCollateralUSD = Number(ethers.formatUnits(accountData[0], 6));
      const totalDebtUSD = Number(ethers.formatUnits(accountData[1], 6));
      
      // Fetch supplied amount for MockUSDC
      const supplied = await callWithTimeout(
        () => lendingPool.getUserSupplied(userAddress, CONTRACTS.MOCK_USDC),
        { timeout: 30000, retries: 2 }
      );

      // Convert to JavaScript numbers (MockUSDC uses 6 decimals)
      const suppliedFormatted = Number(ethers.formatUnits(supplied, 6));
      
      // Get last update timestamp for supply interest calculation
      // Note: For now, we'll calculate from current timestamp
      // In production, you'd want to track the actual supply timestamp on-chain
      const currentTimestamp = Math.floor(Date.now() / 1000);
      setSupplyTimestamp(currentTimestamp);
      
      // Use totalDebt from getUserAccountData instead of getUserBorrowed
      // to avoid caching issues and ensure consistency
      const borrowedFormatted = totalDebtUSD;
      
      // Store position data (credit limit will be calculated reactively based on current credit score)
      const positionData = {
        totalCollateralInUSD: totalCollateralUSD,
        totalDebtInUSD: totalDebtUSD,
        availableBorrowsInUSD: 0, // Not used, calculated reactively
        currentLiquidationThreshold: Number(accountData[3]),
        healthFactor: Number(ethers.formatUnits(accountData[4], 18)), // 18 decimals for health factor
        suppliedAmount: suppliedFormatted,
        borrowedAmount: borrowedFormatted,
      };

      setPosition(positionData);
    } catch (error) {
      console.error('Error fetching position:', error);
      if (String(error?.message || '').toLowerCase().includes('disconnect')) {
        return; // silent on disconnect
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if health factor is infinite (no debt)
  // Health factor > 1 million indicates no meaningful debt (effectively infinite)
  const isHealthFactorInfinite = position.healthFactor > 1000000;
  
  // Calculate health factor percentage for progress bar
  // Health factor > 1 means safe, < 1 means at risk of liquidation
  const healthFactorPercentage = isHealthFactorInfinite ? 100 : Math.min(position.healthFactor * 50, 100);
  
  // Format health factor for display
  const formatHealthFactor = () => {
    if (isHealthFactorInfinite) return '∞';
    return position.healthFactor.toFixed(2);
  };
  
  // Determine health factor color
  const getHealthFactorColor = () => {
    if (isHealthFactorInfinite || position.healthFactor >= 2) return 'text-green-500';
    if (position.healthFactor >= 1.5) return 'text-yellow-500';
    if (position.healthFactor >= 1.2) return 'text-orange-500';
    return 'text-red-500';
  };

  // Show position card if user has supplied collateral OR has meaningful borrows
  // Use dust tolerance for borrows to handle rounding (< $0.01 = effectively zero)
  const hasSuppliedCollateral = position.suppliedAmount > 0;
  const hasMeaningfulDebt = position.borrowedAmount >= 0.01;
  const hasPosition = hasSuppliedCollateral || hasMeaningfulDebt;
  
  // Display helpers for consistent UI when values are zero
  const displayBorrowAPR = (userAPR && userAPR > 0) ? (userAPR / 100) : interestRate; // percent number
  const displayedAccruedInterest = hasMeaningfulDebt ? accruedInterest : 0;
  const displayedTotalOwed = hasMeaningfulDebt ? totalOwed : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Position</CardTitle>
          <CardDescription>Loading position data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasPosition) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Position</CardTitle>
          <CardDescription>No active positions yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Supply collateral to start borrowing with your credit score.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="glass-card glass-strong hover-expand">
      <CardHeader>
        <CardTitle>Your Position</CardTitle>
        <CardDescription>Current lending position overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Liquidation Warning */}
        {!isHealthFactorInfinite && position.healthFactor > 0 && position.healthFactor < 1.2 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Liquidation Risk!</AlertTitle>
            <AlertDescription>
              Your health factor is below 1.2. Repay your debt or add more collateral to avoid liquidation.
            </AlertDescription>
          </Alert>
        )}

        {/* Position Stats */}
        <div className="flex justify-center">
          <div className="grid grid-cols-2 gap-36 max-w-3xl">
            {/* Supplied Collateral */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <p className="text-base text-muted-foreground">Supplied</p>
                {supplyAPY > 0 && (
                  <Badge variant="outline" className="text-green-700 border-green-400 text-xs font-medium">
                    {supplyAPY.toFixed(2)}% APY
                  </Badge>
                )}
              </div>
              <p className="text-4xl font-bold">${position.suppliedAmount.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={14} height={14} className="inline" /> USDC
              </p>
            </div>

            {/* Borrowed Amount */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <p className="text-base text-muted-foreground">Borrowed</p>
                {userAPR > 0 && (
                  <Badge variant="outline" className="text-orange-700 border-orange-400 text-xs font-medium">
                    {(userAPR / 100).toFixed(2)}% APR
                  </Badge>
                )}
              </div>
              <p className="text-4xl font-bold">${position.borrowedAmount.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={14} height={14} className="inline" /> USDC
              </p>
            </div>
          </div>
        </div>

        {/* Credit Score Info */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            {/* Credit Score */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Credit Score</p>
              {creditScore > 0 && !loading ? (
                <p className={`text-3xl font-bold ${scoreColor}`}>{creditScore}</p>
              ) : (
                <Skeleton className="h-8 w-full" />
              )}
            </div>

            {/* Collateral Factor */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Collateral Factor</p>
              {creditScore > 0 && !loading ? (
                <p className="text-2xl font-bold text-orange-500">{currentCollateralFactor}%</p>
              ) : (
                <Skeleton className="h-8 w-full" />
              )}
            </div>

            {/* Borrow APR - clearer label for users */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Borrow APR (est.)</p>
              {creditScore > 0 && !loading ? (
                <p className="text-2xl font-bold">{interestRate}%</p>
              ) : (
                <Skeleton className="h-8 w-full" />
              )}
            </div>
          </div>
        </div>

        {/* Supply Earnings + Debt Overview in a clear two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Earnings Overview */}
          <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg space-y-4 h-full">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <span className="text-base font-semibold text-gray-900">Earnings Overview</span>
                  <Badge variant="outline" className="text-green-700 border-green-400 font-medium">
                    {supplyAPY.toFixed(2)}% APY
                  </Badge>
                </div>

                {/* Supplied Amount */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Supplied Amount</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        ${position.suppliedAmount.toFixed(2)}
                      </span>
                      <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={20} height={20} className="inline" />
                    </div>
                  </div>

                  {/* Interest Earned */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-green-700 font-medium uppercase tracking-wide">Interest Earned</span>
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Clock className="w-3 h-3" />
                        <span>Live</span>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-green-700">
                      +${earnedInterest.toFixed(6)}
                    </p>
                  </div>

                  {/* Total Balance */}
                  <div className="pt-3 border-t-2 border-gray-300">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-gray-900">Total Balance:</span>
                      <span className="text-2xl font-bold text-gray-900">${totalBalance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
          </div>

          {/* Debt Overview */}
          <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg space-y-4 h-full">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <span className="text-base font-semibold text-gray-900">Debt Overview</span>
                  <Badge variant="outline" className="text-orange-700 border-orange-400 font-medium">
                    {displayBorrowAPR.toFixed(2)}% APR
                  </Badge>
                </div>

                {/* Current Borrowed Amount */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Current Borrowed Amount</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        ${position.borrowedAmount.toFixed(2)}
                      </span>
                      <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={20} height={20} className="inline" />
                    </div>
                  </div>

                  {/* Accrued Interest */}
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-orange-700 font-medium uppercase tracking-wide">Accrued Interest</span>
                      <div className="flex items-center gap-1 text-xs text-orange-600">
                        <Clock className="w-3 h-3" />
                        <span>Live</span>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-orange-700">
                      +${displayedAccruedInterest.toFixed(6)}
                    </p>
                  </div>

                  {/* Total Owed */}
                  <div className="pt-3 border-t-2 border-gray-300">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-gray-900">Total Amount to Repay:</span>
                      <span className="text-2xl font-bold text-gray-900">${displayedTotalOwed.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Repay Button */}
                <button 
                  className="w-full h-12 text-base bg-green-600 text-white rounded-md transition-all duration-300 hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  onClick={() => setRepayModalOpen(true)}
                  disabled={position.borrowedAmount <= 0}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span className="flex items-center gap-1.5">Repay <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={16} height={16} className="inline" /> USDC</span>
                </button>
          </div>
        </div>

        {/* Net Interest Summary (shows only when both sides exist) */}
        {hasSuppliedCollateral && hasMeaningfulDebt && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Net Interest (est. annual)</span>
              <span className={`text-lg font-bold ${netAnnualInterest >= 0 ? 'text-green-700' : 'text-orange-700'}`}>
                ${netAnnualInterest.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ({supplyAPY.toFixed(2)}% APY on ${position.suppliedAmount.toFixed(2)} - {(borrowAPRPercent).toFixed(2)}% APR on ${position.borrowedAmount.toFixed(2)})
            </p>
          </div>
        )}

        {/* Health Factor */}
        {position.healthFactor > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Health Factor</p>
              <p className={`text-lg font-bold ${getHealthFactorColor()}`}>
                {formatHealthFactor()}
              </p>
            </div>
            <Progress value={healthFactorPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {isHealthFactorInfinite ? 'Very Safe' :
               position.healthFactor >= 2 ? 'Very Safe' :
               position.healthFactor >= 1.5 ? 'Safe' :
               position.healthFactor >= 1.2 ? 'Moderate Risk' : 'High Risk'}
            </p>
          </div>
        )}

        {/* Credit Limit (Based on Score & Collateral) */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Credit Limit</p>
            {creditScore > 0 && !loading ? (
              <p className="text-lg font-semibold">${calculatedCreditLimit.toFixed(2)}</p>
            ) : (
              <Skeleton className="h-7 w-24" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Repay Modal */}
    <RepayModal
      isOpen={repayModalOpen}
      onClose={() => setRepayModalOpen(false)}
      userAddress={userAddress}
      onSuccess={() => {
        setRepayModalOpen(false);
        // Trigger refresh by updating the key
        window.location.reload();
      }}
      provider={provider}
    />
    </>
  );
}

