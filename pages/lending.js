/**
 * Lending Page
 * 
 * Dedicated page for DeFi lending operations:
 * - Supply USDC as collateral
 * - Borrow based on credit score
 * - Manage positions
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import AppNav from '@/components/layout/AppNav';
import LendingInterface from '@/components/LendingInterface';
import ConnectButton from '@/components/auth/ConnectButton';
import { useAirKit } from '@/hooks/useAirKit';
import { CONTRACTS, CREDIT_ORACLE_ABI, LENDING_POOL_ABI } from '@/lib/contracts';
import { getBestProvider, callWithTimeout, getPublicProvider } from '@/lib/rpcProvider';
import { RetroGrid } from '@/components/ui/retro-grid';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { Card } from '@/components/ui/card';

export default function LendingPage() {
  const router = useRouter();
  const {
    isConnected,
    userAddress,
    provider,
    loading: airKitLoading,
    refreshUserInfo
  } = useAirKit();

  const [creditScore, setCreditScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  
  // Pool liquidity stats
  const [poolStats, setPoolStats] = useState({
    totalLiquidity: '0',
    availableLiquidity: '0',
    totalBorrowed: '0',
    utilizationRate: 0
  });

  const handleConnectionChange = useCallback((connectionData) => {
    if (connectionData.connected && refreshUserInfo) {
      setTimeout(() => refreshUserInfo(), 100);
    } else if (!connectionData.connected && isMounted) {
      router.replace('/');
    }
  }, [refreshUserInfo, isMounted, router]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Fetch credit score for lending
  useEffect(() => {
    if (userAddress && provider) {
      fetchCreditScore();
      fetchPoolStats();
    }
  }, [userAddress, provider]);

  const fetchCreditScore = async () => {
    if (!isMounted || !isConnected || !userAddress) return;

    try {
      setLoading(true);
      
      let reliableProvider;
      try {
        reliableProvider = await getBestProvider(provider);
      } catch (providerError) {
        reliableProvider = getPublicProvider();
      }
      
      const oracleContract = new ethers.Contract(
        CONTRACTS.CREDIT_ORACLE,
        CREDIT_ORACLE_ABI,
        reliableProvider
      );

      let scoreData;
      try {
        const details = await callWithTimeout(
          () => oracleContract.getScoreDetails(userAddress),
          { timeout: 30000, retries: 2 }
        );
        // Convert BigInt to Number and ensure it's within valid range (0-1000)
        const rawScore = Number(details[0]);
        scoreData = { score: Math.min(Math.max(rawScore, 0), 1000) };
      } catch {
        try {
          const score = await callWithTimeout(
            () => oracleContract.getCreditScore(userAddress),
            { timeout: 30000, retries: 2 }
          );
          // Convert BigInt to Number and ensure it's within valid range (0-1000)
          const rawScore = Number(score);
          scoreData = { score: Math.min(Math.max(rawScore, 0), 1000) };
        } catch {
          scoreData = { score: 500 };
        }
      }

      if (isMounted) {
        // Final validation: ensure score is a valid number between 0-1000
        const validScore = Math.min(Math.max(scoreData.score, 0), 1000);
        setCreditScore(validScore);
      }
    } catch (error) {
      console.error('Error fetching credit score:', error);
      if (isMounted) setCreditScore(500);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  // Fetch pool liquidity stats from the lending pool
  const fetchPoolStats = async () => {
    if (!isMounted) return;

    try {
      let reliableProvider;
      try {
        reliableProvider = await getBestProvider(provider);
      } catch (providerError) {
        reliableProvider = getPublicProvider();
      }
      
      const lendingPoolContract = new ethers.Contract(
        CONTRACTS.LENDING_POOL,
        LENDING_POOL_ABI,
        reliableProvider
      );

      // Fetch USDC asset data from the pool
      const assetData = await callWithTimeout(
        () => lendingPoolContract.assets(CONTRACTS.MOCK_USDC),
        { timeout: 30000, retries: 2 }
      );

      // Extract totalSupply and totalBorrowed from the assets struct
      const totalLiquidityBigInt = assetData[0]; // totalSupply
      const totalBorrowedBigInt = assetData[1];  // totalBorrowed
      const availableLiquidityBigInt = totalLiquidityBigInt - totalBorrowedBigInt;
      
      // Calculate utilization rate (percentage)
      const utilizationRate = totalLiquidityBigInt > 0n 
        ? Number((totalBorrowedBigInt * 10000n) / totalLiquidityBigInt) / 100 
        : 0;

      if (isMounted) {
        setPoolStats({
          totalLiquidity: ethers.formatUnits(totalLiquidityBigInt, 6),
          availableLiquidity: ethers.formatUnits(availableLiquidityBigInt, 6),
          totalBorrowed: ethers.formatUnits(totalBorrowedBigInt, 6),
          utilizationRate
        });
      }
    } catch (error) {
      console.error('Error fetching pool stats:', error);
      // Keep default values on error
    }
  };

  // If already connected, render the page immediately (no loading screen)
  // Only show loading/connect screens if not connected
  if (!isConnected) {
    // Show loading only if AIR Kit is still initializing
    if (airKitLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white text-black relative overflow-hidden">
          <RetroGrid className="opacity-50" />
          <div className="max-w-md w-full p-8 space-y-6 text-center relative z-10">
            <h1 className="text-5xl font-bold">Credo Protocol</h1>
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
            <p className="text-sm text-black/60">Initializing...</p>
          </div>
        </div>
      );
    }
    
    // Not connected - show connect button
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black relative overflow-hidden">
        <RetroGrid className="opacity-50" />
        <div className="max-w-md w-full p-8 space-y-6 text-center relative z-10">
          <h1 className="text-5xl font-bold">Credo Protocol</h1>
          <AnimatedShinyText className="text-xl">
            Please connect to access lending
          </AnimatedShinyText>
          <div className="flex justify-center py-8">
            <ConnectButton size="lg" onConnectionChange={handleConnectionChange} />
          </div>
          <p className="text-sm text-black/60">
            Connect with AIR Kit to supply or borrow
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <AppNav onConnectionChange={handleConnectionChange} />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Lending Pool</h1>
          <p className="text-black/60">
            Supply USDC as collateral or borrow based on your credit score
          </p>
        </div>

        {/* Pool Liquidity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Pool Liquidity */}
          <Card className="p-6 border-black/10 hover:border-black/20 transition-colors">
            <div className="space-y-2">
              <p className="text-sm text-black/60 font-medium">Total Pool Size</p>
              <p className="text-3xl font-bold text-black">
                {parseFloat(poolStats.totalLiquidity).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
              <p className="text-xs text-black/50">USDC</p>
            </div>
          </Card>

          {/* Available Liquidity */}
          <Card className="p-6 border-black/10 hover:border-black/20 transition-colors">
            <div className="space-y-2">
              <p className="text-sm text-black/60 font-medium">Available to Borrow</p>
              <p className="text-3xl font-bold text-black">
                {parseFloat(poolStats.availableLiquidity).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
              <p className="text-xs text-black/50">USDC</p>
            </div>
          </Card>

          {/* Total Borrowed */}
          <Card className="p-6 border-black/10 hover:border-black/20 transition-colors">
            <div className="space-y-2">
              <p className="text-sm text-black/60 font-medium">Total Borrowed</p>
              <p className="text-3xl font-bold text-black">
                {parseFloat(poolStats.totalBorrowed).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
              <p className="text-xs text-black/50">USDC</p>
            </div>
          </Card>

          {/* Utilization Rate */}
          <Card className="p-6 border-black/10 hover:border-black/20 transition-colors">
            <div className="space-y-2">
              <p className="text-sm text-black/60 font-medium">Utilization Rate</p>
              <p className="text-3xl font-bold text-black">
                {poolStats.utilizationRate.toFixed(2)}%
              </p>
              <p className="text-xs text-black/50">
                {poolStats.utilizationRate < 50 ? 'Low' : poolStats.utilizationRate < 80 ? 'Moderate' : 'High'}
              </p>
            </div>
          </Card>
        </div>

        {/* Lending Interface */}
        <LendingInterface
          userAddress={userAddress}
          creditScore={creditScore}
          provider={provider}
          onPoolRefresh={fetchPoolStats}
        />
      </main>
    </div>
  );
}

