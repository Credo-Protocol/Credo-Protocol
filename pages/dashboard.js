/**
 * Dashboard Page (AIR Kit Version)
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
import CreditScoreCard from '@/components/CreditScoreCard';
import CredentialMarketplace from '@/components/CredentialMarketplace';
import LendingInterface from '@/components/LendingInterface';
import ConnectButton from '@/components/auth/ConnectButton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplets } from 'lucide-react';
import { CONTRACTS, CREDIT_ORACLE_ABI, MOCA_CHAIN } from '@/lib/contracts';
import { useAirKit } from '@/hooks/useAirKit';

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
    try {
      setLoading(true);
      
      const oracleContract = new ethers.Contract(
        CONTRACTS.CREDIT_ORACLE,
        CREDIT_ORACLE_ABI,
        provider
      );

      // Get score details
      const details = await oracleContract.getScoreDetails(userAddress);
      
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
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialSubmitted = () => {
    // Refresh credit score after credential is submitted
    console.log('Credential submitted, refreshing score...');
    setTimeout(() => {
      fetchCreditScore();
    }, 2000); // Wait 2 seconds for transaction to confirm
  };

  // Show loading while initializing AIR Kit
  if (airKitLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="max-w-md w-full p-8 space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Credo Protocol</h1>
            <p className="text-xl text-muted-foreground">
              Identity-Backed DeFi Lending
            </p>
          </div>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <p className="text-sm text-muted-foreground">
            Initializing AIR Kit...
          </p>
        </div>
      </div>
    );
  }

  // Show connect screen if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="max-w-md w-full p-8 space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Credo Protocol</h1>
            <p className="text-xl text-muted-foreground">
              Identity-Backed DeFi Lending
            </p>
          </div>
          
          <div className="space-y-4 py-6">
            <p className="text-muted-foreground">
              Build your on-chain credit score with verifiable credentials
            </p>
            <ul className="text-sm text-left space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Connect with Google, Email, or Wallet</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Get better collateral terms</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Privacy-preserving with ZK proofs</span>
              </li>
            </ul>
          </div>

          <ConnectButton size="lg" onConnectionChange={handleConnectionChange} />

          <p className="text-xs text-muted-foreground">
            Powered by Moca Network AIR Kit • Chain ID: {MOCA_CHAIN.id}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Credo Protocol</h1>
              <p className="text-sm text-muted-foreground">Dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/faucet')}
                className="flex items-center gap-2"
              >
                <Droplets className="h-4 w-4" />
                Get Test USDC
              </Button>
              <ConnectButton size="sm" onConnectionChange={handleConnectionChange} />
              <Button variant="outline" size="sm" onClick={fetchCreditScore}>
                Refresh
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
            <div className="p-6 border rounded-lg bg-card">
              <p className="text-sm text-muted-foreground mb-1">Collateral Factor</p>
              <p className="text-3xl font-bold">
                {creditScore >= 900 ? '50%' : 
                 creditScore >= 800 ? '60%' :
                 creditScore >= 700 ? '75%' :
                 creditScore >= 600 ? '90%' :
                 creditScore >= 500 ? '100%' :
                 creditScore >= 400 ? '110%' :
                 creditScore >= 300 ? '125%' : '150%'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Required collateral for borrowing
              </p>
            </div>

            <div className="p-6 border rounded-lg bg-card">
              <p className="text-sm text-muted-foreground mb-1">Login Method</p>
              <p className="text-xl font-bold">
                {userInfo?.user?.email ? 'Email/Google' : 'Moca ID'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AIR Kit SSO • {MOCA_CHAIN.name}
              </p>
            </div>
          </div>
        </div>

        {/* Main Tabs: Credentials and Lending */}
        <Tabs defaultValue="credentials" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="credentials">Build Credit Score</TabsTrigger>
            <TabsTrigger value="lending">Lending Pool</TabsTrigger>
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

