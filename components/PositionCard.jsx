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
import { AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { CONTRACTS, LENDING_POOL_ABI, ERC20_ABI, calculateCollateralFactor } from '@/lib/contracts';
import { getBestProvider, callWithTimeout } from '@/lib/rpcProvider';

export default function PositionCard({ userAddress, creditScore, refresh, provider }) {
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState({
    totalCollateralInUSD: 0,
    totalDebtInUSD: 0,
    availableBorrowsInUSD: 0,
    currentLiquidationThreshold: 0,
    healthFactor: 0,
    suppliedAmount: 0,
    borrowedAmount: 0,
  });
  
  // Phase 3: Real-time interest tracking
  const [accruedInterest, setAccruedInterest] = useState(0);
  const [totalOwed, setTotalOwed] = useState(0);
  const [userAPR, setUserAPR] = useState(0);

  // Fetch position data (recalculate when credit score changes)
  useEffect(() => {
    if (userAddress && provider && creditScore >= 0) {
      fetchPosition();
    }
  }, [userAddress, refresh, provider, creditScore]);
  
  // Phase 3: Auto-refresh interest every 5 seconds
  // Only run when there's meaningful debt (>= $0.01), not dust amounts
  useEffect(() => {
    if (!userAddress || !provider || position.borrowedAmount < 0.0001) {
      return;
    }
    
    const fetchInterest = async () => {
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
        console.error('Error fetching interest:', error);
      }
    };
    
    // Fetch immediately
    fetchInterest();
    
    // Then update every 5 seconds
    const interval = setInterval(fetchInterest, 5000);
    
    return () => clearInterval(interval);
  }, [userAddress, provider, position.borrowedAmount]);

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
      
      // Fetch asset data to check pool liquidity (assets is a public mapping)
      const assetData = await callWithTimeout(
        () => lendingPool.assets(CONTRACTS.MOCK_USDC),
        { timeout: 30000, retries: 2 }
      ).catch(() => null);
      
      if (!assetData) {
        throw new Error('Disconnected');
      }
      
      // Fetch supplied amount for MockUSDC
      const supplied = await callWithTimeout(
        () => lendingPool.getUserSupplied(userAddress, CONTRACTS.MOCK_USDC),
        { timeout: 30000, retries: 2 }
      );

      // Convert to JavaScript numbers (MockUSDC uses 6 decimals)
      const suppliedFormatted = Number(ethers.formatUnits(supplied, 6));
      
      // Use totalDebt from getUserAccountData instead of getUserBorrowed
      // to avoid caching issues and ensure consistency
      const borrowedFormatted = totalDebtUSD;
      
      // Calculate pool's available liquidity
      const poolTotalSupply = Number(ethers.formatUnits(assetData[0], 6));
      const poolTotalBorrowed = Number(ethers.formatUnits(assetData[1], 6));
      const poolAvailableLiquidity = poolTotalSupply - poolTotalBorrowed;
      
      // Calculate available borrow based on user's credit score collateral factor
      const collateralFactor = calculateCollateralFactor(creditScore);
      const maxBorrowFromCollateral = (totalCollateralUSD / collateralFactor) * 100;
      const availableBorrowsFromCredit = maxBorrowFromCollateral - totalDebtUSD;
      
      // Show credit-based limit in the UI
      const availableBorrowsUSD = Math.max(0, availableBorrowsFromCredit);
      
      // Store actual borrowable amount (limited by pool liquidity) for validation
      const actualBorrowableAmount = Math.max(0, Math.min(availableBorrowsFromCredit, poolAvailableLiquidity));
      
      const positionData = {
        totalCollateralInUSD: totalCollateralUSD,
        totalDebtInUSD: totalDebtUSD,
        availableBorrowsInUSD: availableBorrowsUSD,
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
    <Card>
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
        <div className="grid grid-cols-2 gap-4">
          {/* Supplied Collateral */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">Supplied</p>
            </div>
            <p className="text-2xl font-bold">${position.suppliedAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={12} height={12} className="inline" /> USDC
            </p>
          </div>

          {/* Borrowed Amount */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <p className="text-sm text-muted-foreground">Borrowed</p>
            </div>
            <p className="text-2xl font-bold">${position.borrowedAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={12} height={12} className="inline" /> USDC
            </p>
          </div>
        </div>

        {/* Phase 3: Real-Time Interest Display (NEW!) */}
        {/* Only show when there's meaningful debt (>= $0.01), not dust amounts */}
        {hasMeaningfulDebt && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Interest Accruing</span>
              <Badge variant="outline" className="text-yellow-700 border-yellow-400">
                {(userAPR / 100).toFixed(2)}% APR
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Principal:</span>
                <span className="font-semibold">${position.borrowedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Accrued Interest:</span>
                <span className="font-semibold text-yellow-700">
                  +${accruedInterest.toFixed(6)}
                </span>
              </div>
              <div className="h-px bg-gray-300 my-2" />
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">Total Owed:</span>
                <span className="font-bold text-lg">${totalOwed.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Updates every 5 seconds</span>
            </div>
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
            <p className="text-lg font-semibold">${position.availableBorrowsInUSD.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

