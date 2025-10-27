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
import AppNav from '@/components/layout/AppNav';
import CredentialWallet from '@/components/CredentialWallet';
import CredentialMarketplace from '@/components/CredentialMarketplace';
import ConnectButton from '@/components/auth/ConnectButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAirKit } from '@/hooks/useAirKit';
import { RetroGrid } from '@/components/ui/retro-grid';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { Lock, Database, Clock } from 'lucide-react';

export default function CredentialsPage() {
  const router = useRouter();
  const { isConnected, userAddress, provider, loading: airKitLoading, refreshUserInfo } = useAirKit();
  const [isMounted, setIsMounted] = useState(true);

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
    <div className="min-h-screen bg-white text-black">
      <AppNav onConnectionChange={handleConnectionChange} />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Credentials</h1>
          <p className="text-black/60">
            Manage your verifiable credentials and build your on-chain reputation
          </p>
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
            <div className="p-6 rounded-lg border border-black/10 bg-neutral-50">
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

