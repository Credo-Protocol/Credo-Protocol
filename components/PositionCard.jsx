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
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { CONTRACTS, LENDING_POOL_ABI, ERC20_ABI, calculateCollateralFactor } from '@/lib/contracts';

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

  // Fetch position data (recalculate when credit score changes)
  useEffect(() => {
    if (userAddress && provider && creditScore >= 0) {
      fetchPosition();
    }
  }, [userAddress, refresh, provider, creditScore]);

  const fetchPosition = async () => {
    try {
      setLoading(true);
      
      // Get LendingPool contract
      const lendingPool = new ethers.Contract(
        CONTRACTS.LENDING_POOL,
        LENDING_POOL_ABI,
        provider
      );

      // Get MockUSDC contract
      const mockUSDC = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        ERC20_ABI,
        provider
      );

      // Fetch user account data from LendingPool
      const accountData = await lendingPool.getUserAccountData(userAddress);
      
      // Parse account data first
      // MockUSDC uses 6 decimals, not 8
      const totalCollateralUSD = Number(ethers.formatUnits(accountData[0], 6));
      const totalDebtUSD = Number(ethers.formatUnits(accountData[1], 6));
      
      // Fetch asset data to check pool liquidity (assets is a public mapping)
      const assetData = await lendingPool.assets(CONTRACTS.MOCK_USDC);
      
      // Fetch supplied amount for MockUSDC
      const supplied = await lendingPool.getUserSupplied(userAddress, CONTRACTS.MOCK_USDC);

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

      console.log('Position data (detailed):', {
        ...positionData,
        rawData: {
          supplied: supplied.toString(),
          accountData: {
            totalCollateral: accountData[0].toString(),
            totalDebt: accountData[1].toString(),
            availableBorrows: accountData[2].toString(),
            liquidationThreshold: accountData[3].toString(),
            healthFactor: accountData[4].toString()
          }
        }
      });
      setPosition(positionData);
    } catch (error) {
      console.error('Error fetching position:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if health factor is infinite (no debt)
  const isHealthFactorInfinite = position.healthFactor > 1e10;
  
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

  // Check if user has any position
  const hasPosition = position.suppliedAmount > 0 || position.borrowedAmount > 0;

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
            <p className="text-2xl font-bold">{position.suppliedAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">USDC</p>
          </div>

          {/* Borrowed Amount */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <p className="text-sm text-muted-foreground">Borrowed</p>
            </div>
            <p className="text-2xl font-bold">{position.borrowedAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">USDC</p>
          </div>
        </div>

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

