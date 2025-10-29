/**
 * $50 USDC Verification Modal
 * 
 * Verify employment credentials to claim $50 USDC.
 * Zero-knowledge proof = privacy preserved.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
  Gift,
  DollarSign,
  Lock
} from 'lucide-react';
import { verifyCredential } from '@/lib/verificationService';

const REWARD_AMOUNT = parseFloat(process.env.NEXT_PUBLIC_REWARD_AMOUNT || '50');
const REWARD_TOKEN = process.env.NEXT_PUBLIC_REWARD_TOKEN || 'USDC';

export default function VerifyCredentialModal({ 
  isOpen, 
  onClose, 
  targetUserAddress,
  requiredCredentials = ['EMPLOYMENT'],
  userInfo,
  onVerificationComplete 
}) {
  const [verifying, setVerifying] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // Handle verification process
  const handleVerify = async () => {
    try {
      setVerifying(true);
      setError(null);
      setResults([]);

      console.log('💰 Starting $50 USDC claim verification...');

      const verificationResults = [];

      // Verify each required credential
      for (const credType of requiredCredentials) {
        try {
          const result = await verifyCredential({
            targetUserAddress,
            requiredCredentialType: credType,
            userInfo
          });

          verificationResults.push({
            credentialType: credType,
            ...result
          });

        } catch (err) {
          verificationResults.push({
            credentialType: credType,
            success: false,
            verified: false,
            error: err.message
          });
        }
      }

      setResults(verificationResults);

      // Calculate verification score
      const verifiedCount = verificationResults.filter(r => r.verified).length;
      const allVerified = verifiedCount === verificationResults.length;

      // Notify parent component
      if (onVerificationComplete) {
        onVerificationComplete({
          results: verificationResults,
          allVerified,
          verificationScore: (verifiedCount / verificationResults.length) * 100,
          rewardClaimed: allVerified
        });
      }

    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-500" />
            Claim $50 USDC
          </DialogTitle>
          <DialogDescription>
            Verify employment credential to claim ${REWARD_AMOUNT} {REWARD_TOKEN}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reward Highlight */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-blue-700 mb-1">Free Reward</p>
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <span className="text-4xl font-bold text-blue-600">{REWARD_AMOUNT}</span>
                <span className="text-2xl font-semibold text-blue-600">{REWARD_TOKEN}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                One-time reward for verified users!
              </p>
            </div>
          </div>

          {/* Required Credentials */}
          <div>
            <h4 className="text-sm font-medium mb-2">Requirements:</h4>
            <div className="space-y-2">
              {requiredCredentials.map((cred, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <span className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    {cred.replace(/_/g, ' ')}
                  </span>
                  {results.length > 0 && (
                    <div>
                      {results.find(r => r.credentialType === cred)?.verified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : results.find(r => r.credentialType === cred)?.simulated ? (
                        <Badge variant="outline" className="text-xs">
                          Simulated
                        </Badge>
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Verification Results */}
          {results.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Results:</h4>
              <div className="space-y-2">
                {results.map((result, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {result.credentialType.replace(/_/g, ' ')}
                      </span>
                      <Badge variant={result.verified ? 'success' : 'destructive'}>
                        {result.simulated ? 'Simulated' :
                         result.verified ? 'Verified' : 'Failed'}
                      </Badge>
                    </div>
                    {result.error && (
                      <p className="text-xs text-red-600">{result.error}</p>
                    )}
                    {result.simulated && (
                      <p className="text-xs text-blue-600">
                        Demo mode - using simulation for testing
                      </p>
                    )}
                    {result.reward && (
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <p className="text-xs text-green-700 font-medium">
                          💰 {result.reward.amount} {result.reward.token} sent!
                        </p>
                        {result.reward.txHash && (
                          <p className="text-xs text-green-600 font-mono truncate">
                            TX: {result.reward.txHash}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Overall Score */}
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification Score:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {Math.round(
                      (results.filter(r => r.verified).length / results.length) * 100
                    )}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {results.length === 0 ? (
              <Button
                onClick={handleVerify}
                disabled={verifying}
                className="flex-1"
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Start Verification
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleVerify} 
                  variant="outline" 
                  className="flex-1"
                  disabled={verifying}
                >
                  Verify Again
                </Button>
                <Button onClick={onClose} className="flex-1">
                  Done
                </Button>
              </>
            )}
          </div>

          {/* Privacy Info Note */}
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">
                  🔐 Privacy-Preserving Verification
                </p>
                <p className="text-blue-700">
                  Zero-knowledge proof = your private data stays private. We only verify
                  you meet the requirements, without seeing your actual details.
                </p>
                <p className="text-blue-700 mt-2">
                  <strong>Example:</strong> Proves &quot;has employment&quot; without revealing employer name.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

