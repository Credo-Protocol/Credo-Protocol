/**
 * Dashboard Overview Page
 * 
 * Simplified overview showing key stats and quick links.
 * Main functionality moved to dedicated pages.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import Link from 'next/link';
import CreditScoreCard from '@/components/CreditScoreCard';
import AppNav from '@/components/layout/AppNav';
import ConnectButton from '@/components/auth/ConnectButton';
import RewardBanner from '@/components/RewardBanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Wallet, TrendingUp, BarChart3, Sparkles, Coins, Droplets } from 'lucide-react';
import { CONTRACTS, CREDIT_ORACLE_ABI } from '@/lib/contracts';
import { useAirKit } from '@/hooks/useAirKit';
import { getBestProvider, callWithTimeout, getPublicProvider } from '@/lib/rpcProvider';
import { AuroraText } from '@/components/ui/aurora-text';
import { RetroGrid } from '@/components/ui/retro-grid';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import Iridescence from '@/components/ui/iridescence';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const router = useRouter();
  const {
    isConnected,
    userAddress,
    userInfo,
    provider,
    loading: airKitLoading,
    refreshUserInfo
  } = useAirKit();

  const [creditScore, setCreditScore] = useState(0);
  const [scoreDetails, setScoreDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Handle connection changes
  const handleConnectionChange = useCallback((connectionData) => {
    console.log('🔄 Connection changed:', connectionData);
    if (connectionData.connected && refreshUserInfo) {
      setTimeout(() => refreshUserInfo(), 100);
    } else if (!connectionData.connected) {
      setCreditScore(0);
      setScoreDetails(null);
      if (isMounted && router.pathname === '/dashboard') {
        router.replace('/');
      }
    }
  }, [refreshUserInfo, isMounted, router]);

  // Component mount tracking
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Fetch credit score
  useEffect(() => {
    if (userAddress && provider) {
      fetchCreditScore();
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

      if (!isMounted || !isConnected || !userAddress) return;

      let scoreData;
      try {
        const details = await callWithTimeout(
          () => oracleContract.getScoreDetails(userAddress),
          { timeout: 30000, retries: 2 }
        );
        
        if (!isMounted || !isConnected || !userAddress) return;
        
        scoreData = {
          score: Number(details[0]),
          credentialCount: Number(details[1]),
          lastUpdated: Number(details[2]),
          initialized: details[3]
        };
      } catch (detailsError) {
        try {
          const score = await callWithTimeout(
            () => oracleContract.getCreditScore(userAddress),
            { timeout: 30000, retries: 2 }
          );
          
          if (!isMounted || !isConnected || !userAddress) return;
          
          scoreData = {
            score: Number(score),
            credentialCount: 0,
            lastUpdated: 0,
            initialized: true
          };
        } catch (fallbackError) {
          scoreData = {
            score: 500,
            credentialCount: 0,
            lastUpdated: 0,
            initialized: false
          };
        }
      }

      if (!isMounted) return;

      setCreditScore(scoreData.score);
      setScoreDetails(scoreData);
      
    } catch (error) {
      console.error('Error fetching credit score:', error);
      if (isMounted && isConnected) {
        setCreditScore(500);
        setScoreDetails({
          score: 500,
          credentialCount: 0,
          lastUpdated: 0,
          initialized: false
        });
      }
    } finally {
      if (isMounted && isConnected) {
        setLoading(false);
      }
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
            <p className="text-sm text-black/60">Initializing AIR Kit...</p>
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
            Identity-Backed DeFi Lending
          </AnimatedShinyText>
          <div className="flex justify-center py-8">
            <ConnectButton size="lg" onConnectionChange={handleConnectionChange} />
          </div>
          <p className="text-sm text-black/60">
            Connect with AIR Kit to access your dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black relative overflow-hidden">
      {/* Iridescence Background */}
      <div className="fixed inset-0 opacity-16 pointer-events-none">
        <Iridescence
          color={[0.9, 0.9, 0.92]}
          mouseReact={true}
          amplitude={0.12}
          speed={0.35}
          saturation={0.08}
        />
      </div>

      <AppNav onConnectionChange={handleConnectionChange} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Section with Reward Banner */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black mb-2">Welcome Back</h1>
            <p className="text-black/60">
              Manage your on-chain credit and access DeFi lending
            </p>
          </div>
          {/* $50 USDC Reward Banner */}
          <RewardBanner />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Credit Score Card */}
          <div className="lg:col-span-1">
            <CreditScoreCard
              score={creditScore}
              credentialCount={scoreDetails?.credentialCount || 0}
              lastUpdated={scoreDetails?.lastUpdated || 0}
              loading={loading || !scoreDetails}
            />
          </div>

          {/* Collateral Factor Card */}
          <Card className="glass-card glass-strong hover-expand hover:shadow-lg transition-shadow flex flex-col">
            <CardContent className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center">
              <p className="text-sm text-black/60 mb-6">Your Collateral Factor</p>
              {loading || !scoreDetails ? (
                <div className="flex flex-col items-center justify-center w-full">
                  <Skeleton className="h-24 w-40 rounded-lg mb-6" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ) : (
                <>
                  <AuroraText 
                    className={`text-8xl font-bold mb-6 leading-none ${
                      creditScore >= 900 ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500' : 
                      creditScore >= 800 ? 'bg-gradient-to-r from-green-500 via-lime-500 to-emerald-500' :
                      creditScore >= 700 ? 'bg-gradient-to-r from-lime-500 via-yellow-500 to-green-500' :
                      creditScore >= 600 ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500' :
                      creditScore >= 500 ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500' :
                      'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500'
                    }`}
                  >
                    {creditScore >= 900 ? '50%' : 
                     creditScore >= 800 ? '60%' :
                     creditScore >= 700 ? '75%' :
                     creditScore >= 600 ? '90%' :
                     creditScore >= 500 ? '100%' :
                     creditScore >= 400 ? '110%' : '125%'}
                  </AuroraText>
                  <p className="text-sm text-black/70 font-medium">
                    Required collateral for borrowing
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Login Method Card */}
          <Card className="glass-card glass-strong hover-expand hover:shadow-lg transition-shadow flex flex-col">
            <CardContent className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center">
              <p className="text-sm text-black/60 mb-6">Login Method</p>
              {(!userInfo) ? (
                <div className="flex flex-col items-center justify-center w-full">
                  <Skeleton className="h-12 w-56 rounded-lg mb-6" />
                  <Skeleton className="h-4 w-28 mb-2" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ) : (
                <>
                  <h3 className="text-6xl font-bold text-black mb-6 leading-tight">
                    {userInfo?.user?.email ? 'Email / Google' : 'Moca ID'}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm text-black/70 font-medium">
                      AIR Kit SSO
                    </p>
                    <p className="text-xs text-black/50">
                      Moca Chain Devnet
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickLinkCard
            href="/credentials"
            icon={<Wallet className="w-8 h-8" />}
            title="Manage Credentials"
            description="View your wallet and request new credentials"
            gradient="from-purple-500 to-pink-500"
          />
          <QuickLinkCard
            href="/lending"
            icon={<Coins className="w-8 h-8" />}
            title="Lending Pool"
            description="Supply liquidity or borrow with your credit score"
            gradient="from-blue-500 to-cyan-500"
          />
          <QuickLinkCard
            href="/score"
            icon={<BarChart3 className="w-8 h-8" />}
            title="Score Builder"
            description="Simulate and optimize your credit score"
            gradient="from-green-500 to-emerald-500"
          />
          <QuickLinkCard
            href="/faucet"
            icon={<Droplets className="w-8 h-8" />}
            title="Faucet"
            description="Get test tokens for Moca Chain Devnet"
            gradient="from-cyan-500 to-blue-500"
          />
        </div>
      </main>
    </div>
  );
}

// Quick Link Card Component
function QuickLinkCard({ href, icon, title, description, gradient }) {
  return (
    <Link href={href}>
      <Card className="glass-card glass-strong hover-expand group hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="w-16 h-16 rounded-xl bg-black flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            {title}
            <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </h3>
          <p className="text-sm text-black/60">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

