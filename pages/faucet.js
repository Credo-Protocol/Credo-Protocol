/**
 * Faucet Page (AIR Kit Version)
 * Clean white/black/grey minimalist theme matching landing page
 * 
 * Dedicated page for getting test USDC tokens on Moca Chain Devnet.
 * Uses AIR Kit for authentication.
 * Users can request up to 10,000 USDC per transaction.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import Link from 'next/link';
import Image from 'next/image';
import AppNav from '@/components/layout/AppNav';
import ConnectButton from '@/components/auth/ConnectButton';
import { Button } from '@/components/ui/button';
import { Loader2, Droplets, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { CONTRACTS, ERC20_ABI, MOCA_CHAIN } from '@/lib/contracts';
import { useAirKit } from '@/hooks/useAirKit';
import { handleTransactionError } from '@/lib/errorHandler';
import { getBestProvider, callWithTimeout } from '@/lib/rpcProvider';
import { RetroGrid } from '@/components/ui/retro-grid';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import Iridescence from '@/components/ui/iridescence';

export default function Faucet() {
  const router = useRouter();
  const {
    isConnected,
    userAddress,
    signer,
    provider,
    loading: airKitLoading,
    refreshUserInfo
  } = useAirKit();

  const [balance, setBalance] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  // Handle connection changes from ConnectButton
  const handleConnectionChange = (connectionData) => {
    if (connectionData.connected && refreshUserInfo) {
      setTimeout(() => {
        refreshUserInfo();
      }, 100);
    }
  };

  // Fetch balance when address changes
  useEffect(() => {
    if (userAddress && provider) {
      fetchBalance();
    }
  }, [userAddress, provider]);

  const fetchBalance = async () => {
    try {
      // Get reliable provider with fallback support
      const reliableProvider = await getBestProvider(provider);
      
      const mockUSDC = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        ERC20_ABI,
        reliableProvider
      );

      // Get user's USDC balance with timeout and retry
      const bal = await callWithTimeout(
        () => mockUSDC.balanceOf(userAddress),
        { timeout: 30000, retries: 2 }
      );
      const balFormatted = Number(ethers.formatUnits(bal, 6)); // MockUSDC has 6 decimals
      
      setBalance(balFormatted);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleFaucet = async () => {
    try {
      setRequesting(true);
      setError('');
      setSuccess(false);
      setTxHash('');

      // Check if signer is available
      if (!signer) {
        setError('Wallet not connected. Please refresh the page and try again.');
        setRequesting(false);
        return;
      }

      const mockUSDC = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        ERC20_ABI,
        signer
      );

      // Request 10,000 USDC from faucet
      const faucetAmount = ethers.parseUnits('10000', 6);
      
      console.log('Requesting 10,000 USDC from faucet...');
      
      const tx = await mockUSDC.faucet(userAddress, faucetAmount);
      
      console.log('Faucet transaction submitted:', tx.hash);
      setTxHash(tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      console.log('Faucet request successful!');
      setSuccess(true);
      
      // Refresh balance
      await fetchBalance();
    } catch (error) {
      // Use centralized error handler for user-friendly messages
      const errorMessage = handleTransactionError('Faucet Request', error);
      setError(errorMessage);
      
      // Auto-dismiss user rejection messages after 4 seconds
      if (error.code === 'ACTION_REJECTED' || 
          error.code === 4001 || 
          error.message?.includes('user rejected') ||
          error.message?.includes('User rejected') ||
          error.message?.includes('rejected the request') ||
          error.message?.includes('User denied')) {
        setTimeout(() => setError(''), 4000);
      }
    } finally {
      setRequesting(false);
    }
  };

  // Show loading while initializing AIR Kit
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

  // Show connect screen if not connected
  if (!isConnected) {
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
            Connect with AIR Kit to access the faucet
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
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Heading */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black">MockUSDC Faucet</h1>
            <p className="text-black/60 mt-2">Get test tokens for Moca Chain Devnet</p>
          </div>

          {/* Main grid: Left column (Balance + Contract), Right column (Request + Next Steps) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Balance Card */}
              <div className="glass-card glass-strong hover-expand p-8 rounded-2xl">
                <div className="flex items-center gap-2 mb-6">
                  <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={20} height={20} className="rounded-full" />
                  <p className="text-sm text-black/60">Your Balance</p>
                </div>
                <div className="text-center py-8">
                  <p className="text-6xl font-bold mb-2 text-black">{balance.toLocaleString()}</p>
                  <p className="text-xl text-black/60">USDC</p>
                </div>
                <p className="text-xs text-black/50 text-center mt-4">
                  Current MockUSDC balance on Moca Chain Devnet
                </p>

                {/* Inline Contract Information */}
                <div className="mt-8 pt-6 border-t border-black/10">
                  <h2 className="text-sm font-semibold text-black mb-4">Contract Information</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-black/5">
                      <span className="text-sm text-black/60">MockUSDC Contract</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-black">
                          {CONTRACTS.MOCK_USDC.slice(0, 10)}...{CONTRACTS.MOCK_USDC.slice(-8)}
                        </span>
                        <a
                          href={`${MOCA_CHAIN.blockExplorers.default.url}/address/${CONTRACTS.MOCK_USDC}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded-md bg-black text-white hover:bg-black/90"
                        >
                          Explorer
                        </a>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-black/5">
                      <span className="text-sm text-black/60">Network</span>
                      <span className="text-sm font-semibold text-black">{MOCA_CHAIN.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-black/5">
                      <span className="text-sm text-black/60">Chain ID</span>
                      <span className="text-sm font-semibold text-black">{MOCA_CHAIN.id}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-black/60">Token Decimals</span>
                      <span className="text-sm font-semibold text-black">6</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Faucet Card */}
              <div className="glass-card glass-strong hover-expand p-8 rounded-2xl space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-black flex items-center gap-2 mb-2">
                    <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={20} height={20} className="rounded-full" />
                    Request Test Tokens
                  </h2>
                  <p className="text-sm text-black/60">
                    Get 10,000 MockUSDC tokens to test the lending protocol
                  </p>
                </div>

                {/* Info Box */}
                <div className="p-6 rounded-xl border border-black/10 bg-neutral-50">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-black/60 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-black mb-3">How it works</h3>
                      <ul className="space-y-2.5 text-sm text-black/70">
                        <li className="flex items-start gap-2.5">
                          <span className="text-black/40 font-bold">•</span>
                          <span>Click the button below to request tokens</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="text-black/40 font-bold">•</span>
                          <span>Approve the transaction in your wallet</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="text-black/40 font-bold">•</span>
                          <span>Receive 10,000 USDC instantly (max per transaction)</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="text-black/40 font-bold">•</span>
                          <span>You can request multiple times if needed</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="p-4 rounded-xl border border-green-500/20 bg-green-50">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-900 mb-1">Success!</h3>
                        <p className="text-sm text-green-700">
                          You received 10,000 USDC. Your balance has been updated.
                          {txHash && (
                            <a
                              href={`${MOCA_CHAIN.blockExplorers.default.url}/tx/${txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block mt-2 text-green-900 font-medium hover:underline"
                            >
                              View transaction on explorer →
                            </a>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-50">
                    <p className="text-sm text-red-900">{error}</p>
                  </div>
                )}

                {/* Faucet Button */}
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg bg-black text-white hover:bg-black/90 transition-all duration-300 hover:scale-[1.02]"
                  onClick={handleFaucet}
                  disabled={requesting}
                >
                  {requesting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Requesting Tokens...
                    </>
                  ) : (
                    <>
                      <Droplets className="mr-2 h-5 w-5" />
                      Request 10,000 USDC
                    </>
                  )}
                </Button>
              </div>

              {/* Next Steps */}
              <div className="glass-card glass-strong hover-expand p-8 rounded-2xl">
                <h2 className="text-lg font-bold text-black mb-4">Next Steps</h2>
                <p className="text-sm text-black/60 mb-6">
                  After getting test USDC, you can:
                </p>
                <ul className="space-y-6 mb-6">
                  <li className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-black mb-1">Go to Lending Pool</p>
                      <p className="text-sm text-black/60">
                        Supply USDC as collateral
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-black mb-1">Build Credit Score</p>
                      <p className="text-sm text-black/60">
                        Submit credentials to increase your score
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-black mb-1">Borrow with Better Terms</p>
                      <p className="text-sm text-black/60">
                        Higher credit score = lower collateral requirements
                      </p>
                    </div>
                  </li>
                </ul>
                <Link href="/dashboard">
                  <Button 
                    className="w-full h-12 bg-black text-white hover:bg-black/90 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <span className="flex items-center gap-2">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

