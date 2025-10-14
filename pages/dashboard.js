/**
 * Dashboard Page (AIR Kit Version)
 * Clean white/black/grey minimalist theme matching landing page
 * 
 * Main application page using AIR Kit for authentication
 * Shows:
 * - User's credit score
 * - Credential marketplace
 * - Lending pool interface
 * - Quick stats
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import Image from 'next/image';
import CreditScoreCard from '@/components/CreditScoreCard';
import CredentialMarketplace from '@/components/CredentialMarketplace';
import LendingInterface from '@/components/LendingInterface';
import ConnectButton from '@/components/auth/ConnectButton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplets, Sparkles, CheckCircle, Home, ArrowRight } from 'lucide-react';
import { CONTRACTS, CREDIT_ORACLE_ABI, MOCA_CHAIN } from '@/lib/contracts';
import { useAirKit } from '@/hooks/useAirKit';
import { RetroGrid } from '@/components/ui/retro-grid';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import Link from 'next/link';

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

  // Handle connection changes from ConnectButton
  const handleConnectionChange = (connectionData) => {
    console.log('🔄 Connection changed:', connectionData);
    if (connectionData.connected && refreshUserInfo) {
      // Refresh the useAirKit state
      setTimeout(() => {
        refreshUserInfo();
      }, 100);
    } else if (!connectionData.connected) {
      // Clear dashboard state on disconnect
      setCreditScore(0);
      setScoreDetails(null);
      setLoading(false);
      // Redirect to home
      try {
        router.replace('/');
      } catch {}
    }
  };

  // Debug connection state
  useEffect(() => {
    console.log('📊 Dashboard State:', {
      isConnected,
      userAddress,
      hasUserInfo: !!userInfo,
      hasProvider: !!provider,
      airKitLoading
    });
  }, [isConnected, userAddress, userInfo, provider, airKitLoading]);

  // Fetch credit score when user address changes
  useEffect(() => {
    if (userAddress && provider) {
      fetchCreditScore();
    }
  }, [userAddress, provider]);

  const fetchCreditScore = async () => {
    // Early return if not connected or missing data
    if (!isConnected || !userAddress || !provider) {
      console.log('Not connected, skipping credit score fetch');
      return;
    }

    try {
      setLoading(true);
      
      const oracleContract = new ethers.Contract(
        CONTRACTS.CREDIT_ORACLE,
        CREDIT_ORACLE_ABI,
        provider
      );

      // Double check we're still connected before async call
      if (!isConnected || !userAddress) {
        console.log('User disconnected during fetch, aborting');
        return;
      }

      // Get score details
      const details = await oracleContract.getScoreDetails(userAddress);
      
      // Check again after async operation
      if (!isConnected || !userAddress) {
        console.log('User disconnected during credit score fetch, aborting');
        return;
      }
      
      const scoreData = {
        score: Number(details[0]),
        credentialCount: Number(details[1]),
        lastUpdated: Number(details[2]),
        initialized: details[3]
      };

      console.log('Credit score fetched:', scoreData);
      
      setCreditScore(scoreData.score);
      setScoreDetails(scoreData);
    } catch (error) {
      console.error('Error fetching credit score:', error);
      // Only reset scores if still connected (ignore errors if disconnected)
      if (isConnected) {
        setCreditScore(0);
        setScoreDetails(null);
      }
    } finally {
      // Only clear loading if still connected
      if (isConnected) {
        setLoading(false);
      }
    }
  };

  const handleCredentialSubmitted = () => {
    // Refresh credit score after credential is submitted
    console.log('Credential submitted, refreshing score...');
    setTimeout(() => {
      fetchCreditScore();
    }, 2000); // Wait 2 seconds for transaction to confirm
  };

  // Show loading while initializing AIR Kit (only when not connected yet)
  if (airKitLoading && !isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black relative overflow-hidden">
        <RetroGrid className="opacity-50" />
        <div className="max-w-md w-full p-8 space-y-6 text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 bg-white/50 backdrop-blur-sm">
              <Image src="/moca.jpg" alt="Moca" width={16} height={16} className="rounded-full" />
              <span className="text-sm font-medium">Built on Moca Chain</span>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-bold">Credo Protocol</h1>
            <AnimatedShinyText className="text-xl">
              Identity-Backed DeFi Lending
            </AnimatedShinyText>
          </div>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
          <p className="text-sm text-black/60">
            Initializing AIR Kit...
          </p>
        </div>
      </div>
    );
  }

  // Show connect screen if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black relative overflow-hidden">
        <RetroGrid className="opacity-50" />
        <div className="max-w-lg w-full p-8 space-y-8 text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 bg-white/50 backdrop-blur-sm">
              <Image src="/moca.jpg" alt="Moca" width={16} height={16} className="rounded-full" />
              <span className="text-sm font-medium">Built on Moca Chain</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold">Credo Protocol</h1>
            <AnimatedShinyText className="text-xl">
              Identity-Backed DeFi Lending
            </AnimatedShinyText>
          </div>
          
          <div className="space-y-6 py-6">
            <p className="text-lg text-black/70">
              Build your on-chain credit score with verifiable credentials
            </p>
            <div className="space-y-3 text-left max-w-sm mx-auto">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5 flex-shrink-0 shadow-lg shadow-green-200">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-black/80">Connect with Google, Email, or Wallet</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5 flex-shrink-0 shadow-lg shadow-green-200">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-black/80">Get better collateral terms</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5 flex-shrink-0 shadow-lg shadow-green-200">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-black/80">Privacy-preserving with ZK proofs</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ConnectButton size="lg" onConnectionChange={handleConnectionChange} />
          </div>

          <p className="text-xs text-black/50">
            Powered by Moca Network AIR Kit • Chain ID: {MOCA_CHAIN.id}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black/10 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">Credo Protocol</h1>
                <p className="text-sm text-black/60">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button 
                  variant="ghost" 
                  className="h-[44px] px-3 flex items-center gap-2 text-black/70 hover:text-black hover:bg-black/5"
                >
                  <Home className="h-4 w-4" />
                  <span className="text-sm">Home</span>
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => router.push('/faucet')}
                className="h-[44px] px-4 flex items-center gap-2 border-black/20 hover:bg-black/5 hover:border-black/30 text-black bg-white"
              >
                <Droplets className="h-4 w-4" />
                <span className="text-sm">Get Test USDC</span>
              </Button>
              <ConnectButton onConnectionChange={handleConnectionChange} />
              <Button 
                variant="outline" 
                onClick={fetchCreditScore}
                className="h-[44px] px-4 border-black/20 hover:bg-black/5 hover:border-black/30 text-black bg-white"
              >
                <span className="text-sm">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Credit Score Card */}
          <div className="lg:col-span-1">
            <CreditScoreCard
              score={creditScore}
              credentialCount={scoreDetails?.credentialCount || 0}
              lastUpdated={scoreDetails?.lastUpdated || 0}
              loading={loading}
            />
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 border border-black/10 rounded-2xl bg-white hover:shadow-lg transition-all duration-300">
              <p className="text-sm text-black/60 mb-2">Collateral Factor</p>
              <p className="text-3xl font-bold text-black">
                {creditScore >= 900 ? '50%' : 
                 creditScore >= 800 ? '60%' :
                 creditScore >= 700 ? '75%' :
                 creditScore >= 600 ? '90%' :
                 creditScore >= 500 ? '100%' :
                 creditScore >= 400 ? '110%' :
                 creditScore >= 300 ? '125%' : '150%'}
              </p>
              <p className="text-xs text-black/50 mt-2">
                Required collateral for borrowing
              </p>
            </div>

            <div className="p-6 border border-black/10 rounded-2xl bg-white hover:shadow-lg transition-all duration-300">
              <p className="text-sm text-black/60 mb-2">Login Method</p>
              <p className="text-xl font-bold text-black">
                {userInfo?.user?.email ? 'Email/Google' : 'Moca ID'}
              </p>
              <p className="text-xs text-black/50 mt-2">
                AIR Kit SSO • {MOCA_CHAIN.name}
              </p>
            </div>
          </div>
        </div>

        {/* Main Tabs: Credentials and Lending */}
        <Tabs defaultValue="credentials" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-neutral-100 p-1 rounded-full border border-black/5">
            <TabsTrigger 
              value="credentials"
              className="rounded-full data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Build Credit Score
            </TabsTrigger>
            <TabsTrigger 
              value="lending"
              className="rounded-full data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Lending Pool
            </TabsTrigger>
          </TabsList>

          {/* Credentials Tab */}
          <TabsContent value="credentials">
            <CredentialMarketplace
              userAddress={userAddress}
              onCredentialSubmitted={handleCredentialSubmitted}
              provider={provider}
            />
          </TabsContent>

          {/* Lending Tab */}
          <TabsContent value="lending">
            <LendingInterface
              userAddress={userAddress}
              creditScore={creditScore}
              provider={provider}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

