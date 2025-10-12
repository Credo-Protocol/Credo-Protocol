/**
 * Faucet Page (AIR Kit Version)
 * 
 * Dedicated page for getting test USDC tokens on Moca Chain Devnet.
 * Uses AIR Kit for authentication.
 * Users can request up to 10,000 USDC per transaction.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import ConnectButton from '@/components/auth/ConnectButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Droplets, CheckCircle2, Info, ArrowLeft } from 'lucide-react';
import { CONTRACTS, ERC20_ABI, MOCA_CHAIN } from '@/lib/contracts';
import { useAirKit } from '@/hooks/useAirKit';

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
      const mockUSDC = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        ERC20_ABI,
        provider
      );

      // Get user's USDC balance
      const bal = await mockUSDC.balanceOf(userAddress);
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
      console.error('Error requesting faucet:', error);
      setError(error.message || 'Failed to get USDC from faucet. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  // Show loading while initializing AIR Kit
  if (airKitLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="max-w-md w-full p-8 space-y-6 text-center">
          <Droplets className="h-16 w-16 mx-auto text-primary" />
          <h1 className="text-3xl font-bold">MockUSDC Faucet</h1>
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
        <div className="max-w-md w-full p-8 space-y-6">
          <div className="text-center space-y-2">
            <Droplets className="h-16 w-16 mx-auto text-primary" />
            <h1 className="text-3xl font-bold">MockUSDC Faucet</h1>
            <p className="text-muted-foreground">
              Get test USDC tokens for Moca Chain Devnet
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Test Tokens Only</AlertTitle>
            <AlertDescription>
              These tokens have no real value and are for testing purposes only on Moca Chain Devnet.
            </AlertDescription>
          </Alert>

          <ConnectButton size="lg" onConnectionChange={handleConnectionChange} />

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => router.push('/dashboard')}
              className="text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
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
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">MockUSDC Faucet</h1>
                <p className="text-sm text-muted-foreground">Get test tokens</p>
              </div>
            </div>
            <ConnectButton size="sm" onConnectionChange={handleConnectionChange} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Balance</CardTitle>
              <CardDescription>Current MockUSDC balance on Moca Chain Devnet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-5xl font-bold mb-2">{balance.toLocaleString()}</p>
                <p className="text-xl text-muted-foreground">USDC</p>
              </div>
            </CardContent>
          </Card>

          {/* Faucet Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Request Test Tokens
              </CardTitle>
              <CardDescription>
                Get 10,000 MockUSDC tokens to test the lending protocol
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Info Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>How it works</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Click the button below to request tokens</li>
                    <li>Approve the transaction in your wallet</li>
                    <li>Receive 10,000 USDC instantly (max per transaction)</li>
                    <li>You can request multiple times if needed</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Success Message */}
              {success && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">Success!</AlertTitle>
                  <AlertDescription className="text-green-600">
                    You received 10,000 USDC. Your balance has been updated.
                    {txHash && (
                      <a
                        href={`${MOCA_CHAIN.blockExplorers.default.url}/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2 underline hover:no-underline"
                      >
                        View transaction on explorer →
                      </a>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Faucet Button */}
              <Button 
                size="lg" 
                className="w-full"
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
            </CardContent>
          </Card>

          {/* Contract Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">MockUSDC Contract</span>
                <a
                  href={`${MOCA_CHAIN.blockExplorers.default.url}/address/${CONTRACTS.MOCK_USDC}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono hover:underline"
                >
                  {CONTRACTS.MOCK_USDC.slice(0, 10)}...{CONTRACTS.MOCK_USDC.slice(-8)}
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Network</span>
                <span className="text-sm font-semibold">{MOCA_CHAIN.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Chain ID</span>
                <span className="text-sm font-semibold">{MOCA_CHAIN.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Token Decimals</span>
                <span className="text-sm font-semibold">6</span>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                After getting test USDC, you can:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <div>
                    <p className="font-medium">Go to Lending Pool</p>
                    <p className="text-sm text-muted-foreground">
                      Supply USDC as collateral
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <div>
                    <p className="font-medium">Build Credit Score</p>
                    <p className="text-sm text-muted-foreground">
                      Submit credentials to increase your score
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <div>
                    <p className="font-medium">Borrow with Better Terms</p>
                    <p className="text-sm text-muted-foreground">
                      Higher credit score = lower collateral requirements
                    </p>
                  </div>
                </li>
              </ul>
              <Button 
                className="w-full mt-4" 
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

