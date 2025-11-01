/**
 * Credentials Page
 * 
 * Dedicated page for credential management:
 * - View credential wallet
 * - Request new credentials from marketplace
 * - See expiry status
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import AppNav from '@/components/layout/AppNav';
import CredentialWallet from '@/components/CredentialWallet';
import CredentialMarketplace from '@/components/CredentialMarketplace';
import ConnectButton from '@/components/auth/ConnectButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAirKit } from '@/hooks/useAirKit';
import { RetroGrid } from '@/components/ui/retro-grid';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import Iridescence from '@/components/ui/iridescence';
import { Lock, Database, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { CONTRACTS, CREDIT_ORACLE_ABI, getScoreColor } from '@/lib/contracts';
import { getBestProvider, callWithTimeout } from '@/lib/rpcProvider';

export default function CredentialsPage() {
  const router = useRouter();
  const { isConnected, userAddress, provider, loading: airKitLoading, refreshUserInfo } = useAirKit();
  const [isMounted, setIsMounted] = useState(true);
  const [creditScore, setCreditScore] = useState(0);
  const [scoreLoading, setScoreLoading] = useState(true);

  const handleConnectionChange = useCallback((connectionData) => {
    if (connectionData.connected && refreshUserInfo) {
      setTimeout(() => refreshUserInfo(), 100);
    } else if (!connectionData.connected && isMounted) {
      router.replace('/');
    }
  }, [refreshUserInfo, isMounted, router]);

  const handleCredentialSubmitted = () => {
    // Refresh wallet after credential submission
    console.log('Credential submitted, wallet will auto-refresh');
  };

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Fetch credit score for display on this page
  useEffect(() => {
    if (isConnected && userAddress && provider) {
      fetchCreditScore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, userAddress, provider]);

  const fetchCreditScore = async () => {
    try {
      setScoreLoading(true);
      const reliableProvider = await getBestProvider(provider);
      const oracleContract = new ethers.Contract(
        CONTRACTS.CREDIT_ORACLE,
        CREDIT_ORACLE_ABI,
        reliableProvider
      );
      const raw = await callWithTimeout(
        () => oracleContract.getCreditScore(userAddress),
        { timeout: 20000, retries: 2 }
      );
      const value = Number(raw);
      if (Number.isFinite(value) && value >= 0 && value <= 1000) {
        setCreditScore(value);
      } else {
        setCreditScore(0);
      }
    } catch (err) {
      console.error('Error fetching credit score:', err);
      setCreditScore(0);
    } finally {
      setScoreLoading(false);
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
            Please connect to view credentials
          </AnimatedShinyText>
          <div className="flex justify-center py-8">
            <ConnectButton size="lg" onConnectionChange={handleConnectionChange} />
          </div>
          <p className="text-sm text-black/60">
            Connect with AIR Kit to manage your credentials
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

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Credentials</h1>
          <p className="text-black/60">
            Manage your verifiable credentials and build your on-chain reputation
          </p>
        </div>

        {/* Credit Score Summary */}
        <div className="mb-8 p-5 rounded-lg border border-black/10 bg-white">
          <div className="mb-2">
            <span className="text-sm text-black/60 font-medium">Your Credit Score</span>
          </div>
          
          {/* Score number */}
          <div className="mb-4 text-center">
            {scoreLoading ? (
              <span className="text-sm text-black/50">Loading...</span>
            ) : (
              <span className={`text-5xl font-extrabold ${getScoreColor(creditScore)}`}>
                {creditScore}
              </span>
            )}
          </div>

          <Progress value={Math.min(creditScore / 10, 100)} className="h-2" />
          <div className="mt-1 text-xs text-black/50 flex items-center justify-between">
            <span>0</span>
            <span>100</span>
          </div>
        </div>

        {/* Tabs: Wallet and Marketplace */}
        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-neutral-100 p-1 rounded-full border border-black/5">
            <TabsTrigger 
              value="wallet"
              className="rounded-full data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              My Wallet
            </TabsTrigger>
            <TabsTrigger 
              value="marketplace"
              className="rounded-full data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Get Credentials
            </TabsTrigger>
          </TabsList>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            <CredentialWallet />
            
            {/* Info Section */}
            <div className="glass-card glass-strong hover-expand p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 text-black">About Credentials</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Lock className="h-5 w-5 text-black/60" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <strong className="text-black font-medium">Privacy-Preserving:</strong>{' '}
                      <span className="text-black/70">Credentials use zero-knowledge proofs to verify claims without revealing exact data.</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Database className="h-5 w-5 text-black/60" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <strong className="text-black font-medium">Decentralized Storage:</strong>{' '}
                      <span className="text-black/70">All credentials are stored on MOCA Chain Storage Providers (MCSP).</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Clock className="h-5 w-5 text-black/60" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <strong className="text-black font-medium">Validity Period:</strong>{' '}
                      <span className="text-black/70">Credentials expire after 1 year. You'll see warnings 30 days before expiry.</span>
                    </p>
                  </div>
                </div>
                
                
              </div>
            </div>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace">
            <CredentialMarketplace
              userAddress={userAddress}
              onCredentialSubmitted={handleCredentialSubmitted}
              provider={provider}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

