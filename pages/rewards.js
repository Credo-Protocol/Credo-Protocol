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
  Loader2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Coins
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
  const [expandedReward, setExpandedReward] = useState(null);

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
          <div className="mb-6">
            <h2 className="text-8xl md:text-9xl font-bold text-blue-600">
              {claimed ? '0' : '1'}
            </h2>
            <p className="text-lg text-black/60 mt-2">Available Rewards</p>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Verify & Earn Rewards
          </h1>
          
          <p className="text-xl text-black/60 max-w-2xl mx-auto">
            Verify your employment credential and receive instant rewards.
          </p>
        </div>

        {/* Rewards List */}
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Reward 1: First-Time User $50 USDC - Expandable & Functional */}
          <Card 
            className={`relative overflow-hidden border-2 transition-all duration-300 ${
              claimed === true 
                ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' 
                : expandedReward === 1
                ? 'border-blue-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50'
                : 'border-black/10 hover:border-blue-200 cursor-pointer'
            }`}
            onClick={() => {
              if (expandedReward !== 1 && claimed !== true) {
                setExpandedReward(1);
              }
            }}
          >
            {claimed === true && <BorderBeam size={250} duration={15} borderWidth={2} colorFrom="#22c55e" colorTo="#10b981" />}
            {expandedReward === 1 && claimed !== true && <BorderBeam size={250} duration={12} borderWidth={2} />}
            
            <CardContent className="p-6">
              {/* Reward Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    claimed === true 
                      ? 'bg-green-500' 
                      : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  }`}>
                    {claimed === true ? (
                      <CheckCircle className="w-7 h-7 text-white" />
                    ) : (
                      <Gift className="w-7 h-7 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold">
                        {claimed === true ? 'Reward Claimed!' : 'First-Time User Bonus'}
                      </h3>
                      {claimed !== true && (
                        <Badge className="bg-blue-600 hover:bg-blue-700">Available</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      ${REWARD_AMOUNT} {REWARD_TOKEN}
                    </p>
                  </div>
                </div>
                
                {claimed !== true && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedReward(expandedReward === 1 ? null : 1);
                    }}
                    className="p-2 hover:bg-black/5 rounded-full transition-colors"
                  >
                    {expandedReward === 1 ? (
                      <ChevronUp className="w-6 h-6" />
                    ) : (
                      <ChevronDown className="w-6 h-6" />
                    )}
                  </button>
                )}
              </div>

              {/* Expanded Content */}
              {expandedReward === 1 && claimed !== true && (
                <div className="mt-6 pt-6 border-t border-black/10 space-y-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-black/40" />
                      <p className="text-black/60">Checking claim status...</p>
                    </div>
                  ) : (
                    <>
                      {/* Features Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-white rounded-lg border border-blue-200">
                          <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                          <p className="text-sm font-medium text-black text-center">Instant Reward</p>
                          <p className="text-xs text-black/60 mt-1 text-center">Receive USDC immediately</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-blue-200">
                          <Lock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                          <p className="text-sm font-medium text-black text-center">Privacy First</p>
                          <p className="text-xs text-black/60 mt-1 text-center">Zero-knowledge proofs</p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border border-blue-200">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                          <p className="text-sm font-medium text-black text-center">One-Time Only</p>
                          <p className="text-xs text-black/60 mt-1 text-center">First user bonus</p>
                        </div>
                      </div>

                      {/* Requirements */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-black">Requirements:</h4>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-black/70">Employment credential in your AIR Kit wallet</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-black/70">First-time claim (one per wallet)</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-black/70">Complete ZK verification process</p>
                          </div>
                        </div>
                      </div>

                      {/* Claim Button */}
                      <div className="text-center">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowModal(true);
                          }}
                          size="lg"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-lg h-auto"
                        >
                          <Gift className="mr-2 h-5 w-5" />
                          Verify & Claim ${REWARD_AMOUNT}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        
                        <p className="text-xs text-black/50 mt-3">
                          Don&apos;t have an employment credential?{' '}
                          <a 
                            href="/credentials" 
                            className="text-blue-600 hover:text-blue-800 font-medium underline"
                          >
                            Get one here →
                          </a>
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Claimed State Details */}
              {claimed === true && (
                <div className="mt-6 pt-6 border-t border-green-200">
                  <div className="text-center space-y-4">
                    <p className="text-lg text-green-700">
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
                      <a
                        href={`https://devnet-scan.mocachain.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-green-700 hover:text-green-900 font-medium transition-colors"
                      >
                        View transaction on block explorer
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reward 2: Credit Score > 800 - Locked */}
          <Card className="relative overflow-hidden border-2 border-black/10 bg-black/5">
            <CardContent className="p-6 opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-full bg-black/20 flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-black/40" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-black/60">Credit Score Champion</h3>
                      <Badge variant="outline" className="border-black/20 text-black/50">
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </Badge>
                    </div>
                    <p className="text-lg font-semibold text-black/50">Coming Soon</p>
                    <p className="text-sm text-black/40 mt-1">Requirement: Credit Score &gt; 800</p>
                  </div>
                </div>
                
                <Lock className="w-6 h-6 text-black/30" />
              </div>
            </CardContent>
          </Card>

          {/* Reward 3: Supplied > 10,000 USDC - Locked */}
          <Card className="relative overflow-hidden border-2 border-black/10 bg-black/5">
            <CardContent className="p-6 opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-full bg-black/20 flex items-center justify-center">
                    <Coins className="w-7 h-7 text-black/40" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-black/60">Whale Supplier</h3>
                      <Badge variant="outline" className="border-black/20 text-black/50">
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </Badge>
                    </div>
                    <p className="text-lg font-semibold text-black/50">Coming Soon</p>
                    <p className="text-sm text-black/40 mt-1">Requirement: Supplied &gt; 10,000 USDC</p>
                  </div>
                </div>
                
                <Lock className="w-6 h-6 text-black/30" />
              </div>
            </CardContent>
          </Card>

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

