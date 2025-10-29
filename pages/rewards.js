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
  Coins,
  AlertCircle
} from 'lucide-react';
import { useAirKit } from '@/hooks/useAirKit';
import { checkClaimStatus, verifyCredential } from '@/lib/verificationService';
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

  const [claimed, setClaimed] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedReward, setExpandedReward] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(''); // 'verifying', 'sending', 'complete'
  const [verificationResults, setVerificationResults] = useState([]);
  const [verificationError, setVerificationError] = useState(null);

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

  // Handle inline verification
  const handleVerify = async () => {
    try {
      setVerifying(true);
      setVerificationError(null);
      setVerificationResults([]);
      setVerificationStatus('verifying');

      console.log('💰 Starting $50 USDC claim verification...');

      const result = await verifyCredential({
        targetUserAddress: userAddress,
        requiredCredentialType: 'EMPLOYMENT',
        userInfo
      });

      // If verification succeeded and there's a reward, show sending status
      if (result.verified && result.reward) {
        setVerificationStatus('sending');
        // Small delay to show the "Sending" state
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      const verificationResult = {
        credentialType: 'EMPLOYMENT',
        ...result
      };

      setVerificationResults([verificationResult]);
      setVerificationStatus('complete');

      // If verified and reward received, update claimed status
      if (result.verified && result.reward) {
        setClaimed(true);
        setTxHash(result.reward.txHash);
        console.log('🎉 $50 USDC claimed!', result.reward.txHash);
      }

    } catch (err) {
      console.error('Verification error:', err);
      setVerificationError(err.message || 'Verification failed');
      setVerificationStatus('');
    } finally {
      setVerifying(false);
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
            <Gift className="w-20 h-20 mx-auto mb-4 text-green-600" />
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
            <h2 className="text-8xl md:text-9xl font-bold text-green-600">
              {claimed ? '0' : '1'}
            </h2>
            <p className="text-lg text-black/60 mt-2">Available Rewards</p>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Verify & Earn Rewards
          </h1>
          
          <p className="text-xl text-black/60 max-w-2xl mx-auto">
            Verify your credentials and receive instant rewards.
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
                ? 'border-green-200 bg-white'
                : 'border-black/10 hover:border-green-200 cursor-pointer'
            }`}
            onClick={() => {
              if (expandedReward !== 1 && claimed !== true) {
                setExpandedReward(1);
              }
            }}
          >
            {claimed === true && <BorderBeam size={250} duration={15} borderWidth={2} colorFrom="#22c55e" colorTo="#10b981" />}
            {expandedReward === 1 && claimed !== true && <BorderBeam size={250} duration={12} borderWidth={2} colorFrom="#22c55e" colorTo="#10b981" />}
            
            <CardContent className="p-6">
              {/* Reward Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    claimed === true 
                      ? 'bg-green-500' 
                      : 'bg-gradient-to-br from-green-500 to-emerald-500'
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
                        <Badge className="bg-green-600 hover:bg-green-700">Available</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-green-600">
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
                      {/* Requirements */}
                      <div className="space-y-4">
                        <h4 className="text-xl font-bold text-black">Requirements:</h4>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-lg text-black/80">Employment credential in your AIR Kit wallet</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-lg text-black/80">First-time claim (one per wallet)</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-lg text-black/80">Complete ZK verification process</p>
                          </div>
                        </div>
                      </div>

                      {/* Verification UI */}
                      {verificationResults.length === 0 ? (
                        // Show verification button or loading states
                        <div className="text-center space-y-4">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerify();
                            }}
                            disabled={verifying}
                            size="lg"
                            className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-lg h-auto"
                          >
                            {verificationStatus === 'verifying' ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Verifying credentials...
                              </>
                            ) : verificationStatus === 'sending' ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Sending ${REWARD_AMOUNT} USDC...
                              </>
                            ) : (
                              <>
                                <Gift className="mr-2 h-5 w-5" />
                                Verify & Claim ${REWARD_AMOUNT}
                                <ArrowRight className="ml-2 h-5 w-5" />
                              </>
                            )}
                          </Button>
                          
                          {verificationStatus && (
                            <div className="max-w-md mx-auto p-3 bg-white border-2 border-black/10 rounded-lg">
                              <div className="flex items-center gap-2 justify-center">
                                {verificationStatus === 'verifying' && (
                                  <>
                                    <Shield className="h-4 w-4 text-black" />
                                    <p className="text-sm font-medium text-black">Verifying your employment credential...</p>
                                  </>
                                )}
                                {verificationStatus === 'sending' && (
                                  <>
                                    <DollarSign className="h-4 w-4 text-black" />
                                    <p className="text-sm font-medium text-black">Processing your ${REWARD_AMOUNT} USDC reward...</p>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {verificationError && (
                            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-red-700">{verificationError}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Show verification results
                        <div className="space-y-4">
                          <div className={`p-4 bg-white border-2 rounded-lg ${
                            verificationResults[0].verified 
                              ? 'border-green-200' 
                              : 'border-red-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-base font-bold text-black">EMPLOYMENT</span>
                              <Badge className={
                                verificationResults[0].verified 
                                  ? 'bg-green-600' 
                                  : 'bg-red-600 hover:bg-red-700'
                              }>
                                {verificationResults[0].verified ? 'Verified ✓' : 'Failed'}
                              </Badge>
                            </div>
                            
                            {verificationResults[0].verified && verificationResults[0].reward ? (
                              <div className="mt-3 p-3 bg-green-50 border-2 border-green-300 rounded">
                                <div className="flex items-center gap-2 mb-1">
                                  <DollarSign className="h-4 w-4 text-green-700" />
                                  <p className="text-sm text-green-700 font-bold">
                                    {verificationResults[0].reward.amount} {verificationResults[0].reward.token} sent!
                                  </p>
                                </div>
                                {verificationResults[0].reward.txHash && (
                                  <a
                                    href={`https://devnet-scan.mocachain.org/tx/${verificationResults[0].reward.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-green-700 font-mono hover:underline flex items-center gap-1"
                                  >
                                    View transaction <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ) : !verificationResults[0].verified && (
                              <div className="mt-3 p-3 bg-red-50 border-2 border-red-300 rounded">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm text-red-700 font-bold mb-1">
                                      Verification Failed
                                    </p>
                                    <p className="text-sm text-red-600">
                                      {verificationResults[0].message || 
                                       verificationResults[0].error || 
                                       'You do not have the required employment credential. Please submit an employment credential first.'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setVerificationResults([]);
                                setVerificationError(null);
                                setVerificationStatus('');
                              }}
                              className="flex-1 h-11 px-8 py-2.5 bg-white border-2 border-black/20 rounded-md text-base font-medium text-black hover:bg-black/5 transition-colors"
                            >
                              Verify Again
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedReward(null);
                              }}
                              className="flex-1 h-11 px-8 py-2.5 bg-green-600 hover:bg-green-700 rounded-md text-base font-medium text-white transition-colors"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Claimed State Details */}
              {claimed === true && (
                <div className="mt-6 pt-6 border-t border-green-200">
                  <div className="text-center space-y-6">
                    <p className="text-lg text-green-700">
                      You&apos;ve successfully received your ${REWARD_AMOUNT} {REWARD_TOKEN}
                    </p>
                    
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-lg border border-green-200">
                      <img src="/usd-coin-usdc-logo.png" alt="USDC" className="w-6 h-6" />
                      <div className="text-left">
                        <p className="text-sm text-green-600 font-medium">Amount Received</p>
                        <p className="text-2xl font-bold text-green-900">${REWARD_AMOUNT} {REWARD_TOKEN}</p>
                      </div>
                    </div>

                    {txHash && (
                      <div>
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
    </div>
  );
}

