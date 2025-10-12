/**
 * Dashboard Page
 * 
 * Main application page showing:
 * - User's credit score
 * - Credential marketplace
 * - Quick stats
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CreditScoreCard from '@/components/CreditScoreCard';
import CredentialMarketplace from '@/components/CredentialMarketplace';
import { Button } from '@/components/ui/button';
import { CONTRACTS, CREDIT_ORACLE_ABI, MOCA_CHAIN } from '@/lib/contracts';

export default function Dashboard() {
  const [userAddress, setUserAddress] = useState(null);
  const [creditScore, setCreditScore] = useState(0);
  const [scoreDetails, setScoreDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Connect wallet on mount if already connected
  useEffect(() => {
    checkConnection();
  }, []);

  // Fetch credit score when user address changes
  useEffect(() => {
    if (userAddress) {
      fetchCreditScore();
    }
  }, [userAddress]);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setUserAddress(accounts[0].address);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    try {
      setConnecting(true);
      
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask to use this application');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await provider.send('eth_requestAccounts', []);
      
      // Check if we're on the right network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== MOCA_CHAIN.id) {
        try {
          // Try to switch to Moca Chain
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${MOCA_CHAIN.id.toString(16)}` }],
          });
        } catch (switchError) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${MOCA_CHAIN.id.toString(16)}`,
                chainName: MOCA_CHAIN.name,
                nativeCurrency: MOCA_CHAIN.nativeCurrency,
                rpcUrls: MOCA_CHAIN.rpcUrls.default.http,
                blockExplorerUrls: [MOCA_CHAIN.blockExplorers.default.url],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      setUserAddress(accounts[0]);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet: ' + error.message);
    } finally {
      setConnecting(false);
    }
  };

  const fetchCreditScore = async () => {
    try {
      setLoading(true);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
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

  if (!userAddress) {
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
                <span>Connect real-world identity</span>
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

          <Button 
            size="lg" 
            className="w-full"
            onClick={connectWallet}
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>

          <p className="text-xs text-muted-foreground">
            Moca Chain Devnet • Chain ID: {MOCA_CHAIN.id}
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
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Connected</p>
                <p className="text-sm font-mono">
                  {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </p>
              </div>
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
              <p className="text-sm text-muted-foreground mb-1">Network</p>
              <p className="text-2xl font-bold">{MOCA_CHAIN.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Chain ID: {MOCA_CHAIN.id}
              </p>
            </div>
          </div>
        </div>

        {/* Credential Marketplace */}
        <CredentialMarketplace
          userAddress={userAddress}
          onCredentialSubmitted={handleCredentialSubmitted}
        />
      </main>
    </div>
  );
}

