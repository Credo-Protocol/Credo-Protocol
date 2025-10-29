/**
 * Rewards Page - Credo Protocol
 * 
 * Dedicated page for users to verify credentials and claim rewards.
 * Clean white/black minimalist theme matching the app design.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppNav from '@/components/layout/AppNav';
import ConnectButton from '@/components/auth/ConnectButton';
import VerifyCredentialModal from '@/components/VerifyCredentialModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  CheckCircle, 
  Shield, 
  ExternalLink,
  DollarSign,
  Lock,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useAirKit } from '@/hooks/useAirKit';
import { checkClaimStatus } from '@/lib/verificationService';
import { RetroGrid } from '@/components/ui/retro-grid';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { AuroraText } from '@/components/ui/aurora-text';
import { BorderBeam } from '@/components/ui/border-beam';

const REWARD_AMOUNT = parseFloat(process.env.NEXT_PUBLIC_REWARD_AMOUNT || '50');
const REWARD_TOKEN = process.env.NEXT_PUBLIC_REWARD_TOKEN || 'USDC';

export default function RewardsPage() {
  const router = useRouter();
  const {
    isConnected,
    userAddress,
    userInfo,
    loading: airKitLoading
  } = useAirKit();

  const [showModal, setShowModal] = useState(false);
  const [claimed, setClaimed] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check claim status on mount
  useEffect(() => {
    if (userAddress && isConnected) {
      setLoading(true);
      checkClaimStatus(userAddress)
        .then(status => {
          setClaimed(status.claimed);
        })
        .catch(err => {
          console.error('Failed to check claim status:', err);
          setClaimed(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [userAddress, isConnected]);

  // Handle connection changes
  const handleConnectionChange = (connectionData) => {
    if (!connectionData.connected) {
      setClaimed(null);
      setTxHash(null);
    }
  };

  // Not connected - show connect prompt
  if (!isConnected) {
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

    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black relative overflow-hidden">
        <RetroGrid className="opacity-50" />
        <div className="max-w-md w-full p-8 space-y-6 text-center relative z-10">
          <div className="mb-6">
            <Gift className="w-20 h-20 mx-auto mb-4 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold mb-4">Claim Rewards</h1>
          <AnimatedShinyText className="text-xl mb-8">
            Verify your credentials and earn ${REWARD_AMOUNT} {REWARD_TOKEN}
          </AnimatedShinyText>
          <div className="flex justify-center py-4">
            <ConnectButton size="lg" onConnectionChange={handleConnectionChange} />
          </div>
          <p className="text-sm text-black/60">
            Connect with AIR Kit to claim your reward
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <AppNav onConnectionChange={handleConnectionChange} />

      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Verify & Earn Rewards
          </h1>
          
          <p className="text-xl text-black/60 max-w-2xl mx-auto">
            Verify your employment credential and receive instant rewards. 
            Privacy-preserving verification powered by zero-knowledge proofs.
          </p>
        </div>

        {/* Main Reward Card */}
        <div className="max-w-4xl mx-auto mb-12">
          {loading ? (
            <Card className="p-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-black/40" />
              <p className="text-black/60">Checking claim status...</p>
            </Card>
          ) : claimed === true ? (
            // Already Claimed State
            <Card className="relative overflow-hidden border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <BorderBeam size={250} duration={15} borderWidth={2} colorFrom="#22c55e" colorTo="#10b981" />
              
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500 mb-6">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  
                  <h2 className="text-4xl font-bold text-green-900 mb-3">
                    Reward Claimed!
                  </h2>
                  
                  <p className="text-lg text-green-700 mb-6">
                    You&apos;ve successfully received your ${REWARD_AMOUNT} {REWARD_TOKEN}
                  </p>

                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-lg border border-green-200">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <div className="text-left">
                      <p className="text-sm text-green-600 font-medium">Amount Received</p>
                      <p className="text-2xl font-bold text-green-900">${REWARD_AMOUNT} {REWARD_TOKEN}</p>
                    </div>
                  </div>

                  {txHash && (
                    <div className="mt-6">
                      <a
                        href={`https://devnet-scan.mocachain.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-green-700 hover:text-green-900 font-medium transition-colors"
                      >
                        View transaction on block explorer
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            // Unclaimed State - Main Reward Card
            <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50">
              <BorderBeam size={250} duration={12} borderWidth={2} />
              
              <CardContent className="p-12">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 mb-6 shadow-lg">
                    <Gift className="w-12 h-12 text-white" />
                  </div>
                  
                  <div className="mb-6">
                    <Badge className="mb-4 text-sm px-4 py-1.5 bg-blue-600 hover:bg-blue-700">
                      First-Time User Reward
                    </Badge>
                    <h2 className="text-5xl md:text-6xl font-bold mb-4">
                      <AuroraText className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600">
                        ${REWARD_AMOUNT} {REWARD_TOKEN}
                      </AuroraText>
                    </h2>
                    <p className="text-xl text-blue-700 font-medium">
                      Available to claim right now!
                    </p>
                  </div>

                  <div className="max-w-2xl mx-auto mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white rounded-lg border border-blue-200">
                        <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium text-black">Instant Reward</p>
                        <p className="text-xs text-black/60 mt-1">Receive USDC immediately</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border border-blue-200">
                        <Lock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium text-black">Privacy First</p>
                        <p className="text-xs text-black/60 mt-1">Zero-knowledge proofs</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border border-blue-200">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-medium text-black">One-Time Only</p>
                        <p className="text-xs text-black/60 mt-1">First user bonus</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowModal(true)}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-lg h-auto"
                  >
                    <Gift className="mr-2 h-5 w-5" />
                    Verify & Claim ${REWARD_AMOUNT}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  <p className="text-sm text-blue-600 mt-4">
                    🔐 Your job details remain private with zero-knowledge proofs
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* How It Works Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-black/5 hover:border-black/10 hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Connect Credential</h3>
                <p className="text-black/60">
                  Verify you have an employment credential in your AIR Kit wallet
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-black/5 hover:border-black/10 hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Generate Proof</h3>
                <p className="text-black/60">
                  AIR Kit creates a zero-knowledge proof without revealing details
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-black/5 hover:border-black/10 hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Receive Reward</h3>
                <p className="text-black/60">
                  Get ${REWARD_AMOUNT} {REWARD_TOKEN} instantly sent to your wallet
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Requirements Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-black/5">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Requirements
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Employment Credential</p>
                    <p className="text-sm text-black/60">
                      You must have an active employment credential in your AIR Kit wallet
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">First-Time Claim</p>
                    <p className="text-sm text-black/60">
                      This reward can only be claimed once per wallet address
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Verification Process</p>
                    <p className="text-sm text-black/60">
                      Complete the zero-knowledge proof verification through AIR Kit
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Don&apos;t have an employment credential yet?</strong>
                  {' '}
                  <a 
                    href="/credentials" 
                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    Get one from the credentials page →
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <div className="p-8 border-2 border-dashed border-black/10 rounded-2xl">
            <Gift className="w-12 h-12 mx-auto mb-4 text-black/40" />
            <h3 className="text-2xl font-bold mb-2">More Rewards Coming Soon</h3>
            <p className="text-black/60">
              Stay tuned for additional reward opportunities and challenges
            </p>
          </div>
        </div>
      </main>

      {/* Verification Modal */}
      <VerifyCredentialModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        targetUserAddress={userAddress}
        requiredCredentials={['EMPLOYMENT']}
        userInfo={userInfo}
        onVerificationComplete={(result) => {
          console.log('Verification completed:', result);
          
          if (result.allVerified && result.results[0]?.reward) {
            setClaimed(true);
            setTxHash(result.results[0].reward.txHash);
            console.log('🎉 $50 USDC claimed!', result.results[0].reward.txHash);
          }
        }}
      />
    </div>
  );
}

