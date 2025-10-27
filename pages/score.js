/**
 * Score Builder Page
 * 
 * Dedicated page for credit score simulation and optimization:
 * - Interactive score builder wizard
 * - Preview score changes before submitting credentials
 * - View leaderboard
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import AppNav from '@/components/layout/AppNav';
import ScoreBuilderWizard from '@/components/ScoreBuilderWizard';
import Leaderboard from '@/components/Leaderboard';
import ConnectButton from '@/components/auth/ConnectButton';
import { useAirKit } from '@/hooks/useAirKit';
import { CONTRACTS, CREDIT_ORACLE_ABI } from '@/lib/contracts';
import { getBestProvider, callWithTimeout, getPublicProvider } from '@/lib/rpcProvider';
import { RetroGrid } from '@/components/ui/retro-grid';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';

export default function ScoreBuilderPage() {
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
  const [credentials, setCredentials] = useState([]);

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

      let scoreData;
      try {
        const details = await callWithTimeout(
          () => oracleContract.getScoreDetails(userAddress),
          { timeout: 30000, retries: 2 }
        );
        scoreData = { score: Number(details[0]) };
      } catch {
        try {
          const score = await callWithTimeout(
            () => oracleContract.getCreditScore(userAddress),
            { timeout: 30000, retries: 2 }
          );
          scoreData = { score: Number(score) };
        } catch {
          scoreData = { score: 500 };
        }
      }

      if (isMounted) {
        setCreditScore(scoreData.score);
      }
    } catch (error) {
      console.error('Error fetching credit score:', error);
      if (isMounted) setCreditScore(500);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  const handleRequestCredential = (credential) => {
    // Navigate to credentials page to request
    router.push('/credentials?tab=marketplace');
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
            Please connect to use score builder
          </AnimatedShinyText>
          <div className="flex justify-center py-8">
            <ConnectButton size="lg" onConnectionChange={handleConnectionChange} />
          </div>
          <p className="text-sm text-black/60">
            Connect with AIR Kit to simulate your credit score
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
          <h1 className="text-4xl font-bold text-black mb-2">Score Builder</h1>
          <p className="text-black/60">
            Simulate credential combinations and optimize your credit score
          </p>
        </div>

        {/* Score Builder Wizard */}
        <ScoreBuilderWizard
          currentScore={creditScore}
          submittedCredentials={credentials}
          onRequestCredential={handleRequestCredential}
        />

        {/* Leaderboard */}
        <div className="mt-12">
          <Leaderboard />
        </div>
      </main>
    </div>
  );
}

