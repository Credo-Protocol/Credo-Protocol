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
import ScoreBuilderWizard from '@/components/ScoreBuilderWizard';
import Leaderboard from '@/components/Leaderboard';
import ConnectButton from '@/components/auth/ConnectButton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplets, CheckCircle, Home, ArrowRight } from 'lucide-react';
import { CONTRACTS, CREDIT_ORACLE_ABI, MOCA_CHAIN } from '@/lib/contracts';
import { useAirKit } from '@/hooks/useAirKit';
import { getBestProvider, callWithTimeout, getPublicProvider } from '@/lib/rpcProvider';
import { RetroGrid } from '@/components/ui/retro-grid';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { AuroraText } from '@/components/ui/aurora-text';
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
  const [isMounted, setIsMounted] = useState(true);
  const [credentials, setCredentials] = useState([]); // Track submitted credentials for Score Builder
  const [activeTab, setActiveTab] = useState('builder'); // Track active tab

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
      // Only redirect if we're still on the dashboard page
      // Don't redirect if user is navigating away
      if (isMounted && router.pathname === '/dashboard') {
        try {
          router.replace('/');
        } catch {}
      }
    }
  };

  // Component mount/unmount tracking
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

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
    console.log('🔍 Credit score fetch trigger:', { 
      hasAddress: !!userAddress, 
      hasProvider: !!provider,
      address: userAddress 
    });
    if (userAddress && provider) {
      console.log('📞 Calling fetchCreditScore...');
      fetchCreditScore();
    }
  }, [userAddress, provider]);

  const fetchCreditScore = async () => {
    console.log('🎯 fetchCreditScore called!');
    
    // Early return if not connected or missing user address
    if (!isMounted || !isConnected || !userAddress) {
      console.log('❌ Skipping credit score fetch:', { isMounted, isConnected, hasAddress: !!userAddress });
      return;
    }

    console.log('✅ All checks passed, proceeding with fetch');

    try {
      setLoading(true);
      console.log('⏳ Loading state set to true');
      
      // Get the best available provider (with fallback support)
      let reliableProvider;
      try {
        reliableProvider = await getBestProvider(provider);
        console.log('✅ Reliable provider obtained');
      } catch (providerError) {
        console.warn('⚠️ Failed to get reliable provider, using fallback:', providerError.message);
        reliableProvider = getPublicProvider();
      }
      
      console.log('📝 Creating contract with:', {
        address: CONTRACTS.CREDIT_ORACLE,
        userAddress
      });
      
      const oracleContract = new ethers.Contract(
        CONTRACTS.CREDIT_ORACLE,
        CREDIT_ORACLE_ABI,
        reliableProvider
      );

      console.log('✅ Contract created successfully');

      // Double check we're still connected and mounted before async call
      if (!isMounted || !isConnected || !userAddress) {
        console.log('❌ Component unmounted or user disconnected, aborting fetch');
        return;
      }

      // Get score details - try new method first, fallback to old
      let scoreData;
      try {
        console.log('📞 Calling getScoreDetails on contract...');
        
        // Use the robust timeout wrapper (30 seconds with retries)
        const details = await callWithTimeout(
          () => oracleContract.getScoreDetails(userAddress),
          { 
            timeout: 30000, // 30 seconds for Vercel cold starts
            retries: 2,
          }
        );
        
        console.log('✅ getScoreDetails returned:', details);
        
        // Check again after async operation
        if (!isMounted || !isConnected || !userAddress) {
          console.log('Component unmounted during credit score fetch, aborting');
          return;
        }
        
        scoreData = {
          score: Number(details[0]),
          credentialCount: Number(details[1]),
          lastUpdated: Number(details[2]),
          initialized: details[3]
        };
      } catch (detailsError) {
        console.error('❌ getScoreDetails failed:', detailsError.message);
        console.log('🔄 Trying getCreditScore fallback...');
        
        // Fallback: try getCreditScore if getScoreDetails fails (contract version mismatch)
        try {
          console.log('📞 Calling getCreditScore (fallback)...');
          
          const score = await callWithTimeout(
            () => oracleContract.getCreditScore(userAddress),
            { 
              timeout: 30000,
              retries: 2,
            }
          );
          
          console.log('✅ getCreditScore returned:', score);
          
          // Check if still mounted
          if (!isMounted || !isConnected || !userAddress) {
            return;
          }
          
          scoreData = {
            score: Number(score),
            credentialCount: 0,
            lastUpdated: 0,
            initialized: true
          };
          console.log('Using fallback getCreditScore:', scoreData);
        } catch (fallbackError) {
          console.error('❌ getCreditScore fallback also failed:', fallbackError.message);
          console.warn('⚠️ RPC may be down or unresponsive. Using default values.');
          // Use default values
          scoreData = {
            score: 500,
            credentialCount: 0,
            lastUpdated: 0,
            initialized: false
          };
        }
      }
      
      console.log('💾 Final score data:', scoreData);

      // Final check before updating state
      if (!isMounted) {
        console.log('Component unmounted, skipping state update');
        return;
      }

      console.log('✅ Setting credit score state:', scoreData);
      
      setCreditScore(scoreData.score);
      setScoreDetails(scoreData);
      
      console.log('✅ Credit score successfully loaded!');
    } catch (error) {
      console.error('Error fetching credit score:', error);
      // Only update state if still mounted and connected
      if (isMounted && isConnected) {
        // Set default values instead of 0
        setCreditScore(500);
        setScoreDetails({
          score: 500,
          credentialCount: 0,
          lastUpdated: 0,
          initialized: false
        });
      }
    } finally {
      // Only clear loading if still mounted and connected
      if (isMounted && isConnected) {
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

  // Handler for Score Builder credential requests
  const handleRequestCredential = async (credential) => {
    // Navigate to Build Credit tab so user can request credentials
    console.log('Navigating to Build Credit tab for credential:', credential);
    setActiveTab('credentials');
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <h1 className="text-5xl md:text-6xl font-bold whitespace-nowrap">Credo Protocol</h1>
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
        <div className="max-w-md w-full p-8 space-y-6 text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 bg-white/50 backdrop-blur-sm">
              <Image src="/moca.jpg" alt="Moca" width={16} height={16} className="rounded-full" />
              <span className="text-sm font-medium">Built on Moca Chain</span>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-bold whitespace-nowrap">Credo Protocol</h1>
            <AnimatedShinyText className="text-xl">
              Identity-Backed DeFi Lending
            </AnimatedShinyText>
          </div>
          <div className="flex justify-center py-8">
            <ConnectButton size="lg" onConnectionChange={handleConnectionChange} />
          </div>
          <p className="text-sm text-black/60">
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
            {/* Logo and Brand */}
            <Link href="/" className="flex items-center gap-1 group">
              <img 
                src="/credo.jpg" 
                alt="Credo Protocol" 
                className="w-8 h-8 rounded-lg object-cover transition-transform group-hover:scale-105" 
              />
              <span className="text-xl font-bold text-black">Credo Protocol</span>
            </Link>
            
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
        {/* Dashboard Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Dashboard</h1>
        </div>
        
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
            {/* Collateral Factor Card */}
            <div className="p-8 border border-black/10 rounded-2xl bg-white hover:shadow-lg transition-all duration-300 flex flex-col justify-center items-center text-center h-full">
              <p className="text-sm text-black/60 mb-4">Collateral Factor</p>
              <AuroraText 
                className={`text-7xl leading-none mb-6 ${
                  creditScore >= 900 ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500' : 
                  creditScore >= 800 ? 'bg-gradient-to-r from-green-500 via-lime-500 to-emerald-500' :
                  creditScore >= 700 ? 'bg-gradient-to-r from-lime-500 via-yellow-500 to-green-500' :
                  creditScore >= 600 ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500' :
                  creditScore >= 500 ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500' :
                  creditScore >= 400 ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500' :
                  creditScore >= 300 ? 'bg-gradient-to-r from-red-500 via-rose-500 to-pink-500' : 
                  'bg-gradient-to-r from-red-600 via-red-700 to-red-800'
                } animate-aurora-slow`}
              >
                {creditScore >= 900 ? '50%' : 
                 creditScore >= 800 ? '60%' :
                 creditScore >= 700 ? '75%' :
                 creditScore >= 600 ? '90%' :
                 creditScore >= 500 ? '100%' :
                 creditScore >= 400 ? '110%' :
                 creditScore >= 300 ? '125%' : '150%'}
              </AuroraText>
              <p className="text-sm text-black/70 font-medium mb-1">
                Required collateral for borrowing
              </p>
            </div>

            {/* Login Method Card */}
            <div className="p-8 border border-black/10 rounded-2xl bg-white hover:shadow-lg transition-all duration-300 flex flex-col justify-center items-center text-center h-full">
              <p className="text-sm text-black/60 mb-4">Login Method</p>
              <p className="text-5xl font-bold text-black leading-none mb-6">
                {userInfo?.user?.email ? 'Email / Google' : 'Moca ID'}
              </p>
              <p className="text-sm text-black/70 font-medium mb-1">
                AIR Kit SSO • Moca Chain Devnet
              </p>
            </div>
          </div>
        </div>

        {/* Main Tabs: Score Builder, Credentials, and Lending */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6 bg-neutral-100 p-1 rounded-full border border-black/5">
            <TabsTrigger 
              value="builder"
              className="rounded-full data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Score Builder
            </TabsTrigger>
            <TabsTrigger 
              value="credentials"
              className="rounded-full data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Build Credit
            </TabsTrigger>
            <TabsTrigger 
              value="lending"
              className="rounded-full data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Lending Pool
            </TabsTrigger>
          </TabsList>

          {/* Score Builder Tab (NEW - Phase 3) */}
          <TabsContent value="builder">
            <ScoreBuilderWizard
              currentScore={creditScore}
              submittedCredentials={credentials}
              onRequestCredential={handleRequestCredential}
            />
            
            {/* Leaderboard - shown only in Score Builder tab */}
            <div className="mt-12">
              <Leaderboard />
            </div>
          </TabsContent>

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

