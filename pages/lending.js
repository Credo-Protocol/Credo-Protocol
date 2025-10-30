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
import Image from 'next/image';
import AppNav from '@/components/layout/AppNav';
import LendingInterface from '@/components/LendingInterface';
import ConnectButton from '@/components/auth/ConnectButton';
import { useAirKit } from '@/hooks/useAirKit';
import { CONTRACTS, CREDIT_ORACLE_ABI, LENDING_POOL_ABI } from '@/lib/contracts';
import { getBestProvider, callWithTimeout, getPublicProvider } from '@/lib/rpcProvider';
import { RetroGrid } from '@/components/ui/retro-grid';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { Card } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

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

  // Fetch all data at once (credit score + pool stats) for better performance
  useEffect(() => {
    if (userAddress && provider) {
      fetchAllData();
    }
  }, [userAddress, provider]);

  // Fetch credit score and pool stats in parallel
  const fetchAllData = async () => {
    if (!isMounted || !isConnected || !userAddress) return;

    try {
      setLoading(true);
      
      // Get provider once for both fetches
      let reliableProvider;
      try {
        reliableProvider = await getBestProvider(provider);
      } catch (providerError) {
        reliableProvider = getPublicProvider();
      }
      
      // Create contract instances
      const oracleContract = new ethers.Contract(
        CONTRACTS.CREDIT_ORACLE,
        CREDIT_ORACLE_ABI,
        reliableProvider
      );
      
      const lendingPoolContract = new ethers.Contract(
        CONTRACTS.LENDING_POOL,
        LENDING_POOL_ABI,
        reliableProvider
      );

      // Fetch both in parallel
      const [scoreResult, poolResult] = await Promise.allSettled([
        // Fetch credit score
        callWithTimeout(
          () => oracleContract.getCreditScore(userAddress),
          { timeout: 30000, retries: 2 }
        ),
        // Fetch pool stats
        callWithTimeout(
          () => lendingPoolContract.assets(CONTRACTS.MOCK_USDC),
          { timeout: 30000, retries: 2 }
        )
      ]);

      // Process credit score
      let finalScore = 500; // Default
      if (scoreResult.status === 'fulfilled') {
        const rawScore = Number(scoreResult.value);
        if (rawScore >= 0 && rawScore <= 1000 && Number.isFinite(rawScore)) {
          finalScore = rawScore;
        }
      }

      // Process pool stats
      let finalPoolStats = {
        totalLiquidity: '0',
        availableLiquidity: '0',
        totalBorrowed: '0',
        utilizationRate: 0
      };
      
      if (poolResult.status === 'fulfilled') {
        const assetData = poolResult.value;
        const totalLiquidityBigInt = assetData[0];
        const totalBorrowedBigInt = assetData[1];
        const availableLiquidityBigInt = totalLiquidityBigInt - totalBorrowedBigInt;
        const utilizationRate = totalLiquidityBigInt > 0n 
          ? Number((totalBorrowedBigInt * 10000n) / totalLiquidityBigInt) / 100 
          : 0;

        finalPoolStats = {
          totalLiquidity: ethers.formatUnits(totalLiquidityBigInt, 6),
          availableLiquidity: ethers.formatUnits(availableLiquidityBigInt, 6),
          totalBorrowed: ethers.formatUnits(totalBorrowedBigInt, 6),
          utilizationRate
        };
      }

      // Update all state at once
      if (isMounted) {
        setCreditScore(finalScore);
        setPoolStats(finalPoolStats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (isMounted) {
        setCreditScore(500);
      }
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  // Separate function for refreshing pool stats only (used after transactions)
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

      const assetData = await callWithTimeout(
        () => lendingPoolContract.assets(CONTRACTS.MOCK_USDC),
        { timeout: 30000, retries: 2 }
      );

      const totalLiquidityBigInt = assetData[0];
      const totalBorrowedBigInt = assetData[1];
      const availableLiquidityBigInt = totalLiquidityBigInt - totalBorrowedBigInt;
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

        {/* Moca Chain Badge */}
        <div className="flex items-center gap-1.5 mb-3">
          <Image 
            src="/moca.jpg" 
            alt="Moca Chain" 
            width={16} 
            height={16}
            className="rounded-sm object-cover"
          />
          <span className="text-sm text-black/60 font-medium">Moca Chain</span>
        </div>

        {/* Pool Liquidity Stats - Aave Style */}
        <Card className="mb-8 border-black/10">
          <div className="p-6">
            {/* Asset Header */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-black/10">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image 
                    src="/usd-coin-usdc-logo.png" 
                    alt="USDC" 
                    width={40} 
                    height={40}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-black">USDC</h3>
                    <a
                      href={`${process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://devnet-scan.mocachain.org'}/address/${CONTRACTS.LENDING_POOL}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black/60 hover:text-black transition-colors"
                      title="View Lending Pool Contract"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <p className="text-sm text-black/60">USD Coin</p>
                </div>
              </div>
            </div>

            {/* Pool Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Total Pool Size */}
              <div className="space-y-1">
                <p className="text-xs text-black/50 font-medium uppercase tracking-wide">Total Pool Size</p>
                <p className="text-2xl font-bold text-black">
                  ${parseFloat(poolStats.totalLiquidity).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>

              {/* Available Liquidity */}
              <div className="space-y-1">
                <p className="text-xs text-black/50 font-medium uppercase tracking-wide">Available Liquidity</p>
                <p className="text-2xl font-bold text-black">
                  ${parseFloat(poolStats.availableLiquidity).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>

              {/* Total Borrowed */}
              <div className="space-y-1">
                <p className="text-xs text-black/50 font-medium uppercase tracking-wide">Total Borrowed</p>
                <p className="text-2xl font-bold text-black">
                  ${parseFloat(poolStats.totalBorrowed).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>

              {/* Utilization Rate */}
              <div className="space-y-1">
                <p className="text-xs text-black/50 font-medium uppercase tracking-wide">Utilization Rate</p>
                <p className="text-2xl font-bold text-black">
                  {poolStats.utilizationRate.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </Card>

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

