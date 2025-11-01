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
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black">
            <Gift className="h-5 w-5 text-green-600" />
            Claim $50 USDC
          </DialogTitle>
          <DialogDescription className="text-black/60">
            Verify employment credential to claim ${REWARD_AMOUNT} {REWARD_TOKEN}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reward Highlight */}
          <div className="p-6 bg-white border-2 border-green-200 rounded-lg">
            <div className="text-center">
              <p className="text-base font-bold text-green-700 mb-2">Free Reward</p>
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="h-10 w-10 text-green-600" />
                <span className="text-5xl font-bold text-green-600">{REWARD_AMOUNT}</span>
                <span className="text-3xl font-bold text-green-600">{REWARD_TOKEN}</span>
              </div>
              <p className="text-sm font-medium text-green-700 mt-2">
                One-time reward for verified users!
              </p>
            </div>
          </div>

          {/* Required Credentials */}
          <div>
            <h4 className="text-base font-bold mb-3 text-black">Requirements:</h4>
            <div className="space-y-2">
              {requiredCredentials.map((cred, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-4 bg-white border-2 border-black/10 rounded"
                >
                  <span className="text-base font-medium flex items-center gap-2 text-black">
                    <Shield className="h-5 w-5 text-green-600" />
                    {cred.replace(/_/g, ' ')}
                  </span>
                  {results.length > 0 && (
                    <div>
                      {results.find(r => r.credentialType === cred)?.verified ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
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
              <h4 className="text-base font-bold mb-3 text-black">Results:</h4>
              <div className="space-y-2">
                {results.map((result, idx) => (
                  <div key={idx} className="p-4 bg-white border-2 border-black/10 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base font-medium text-black">
                        {result.credentialType.replace(/_/g, ' ')}
                      </span>
                      <Badge 
                        className={result.verified ? 'bg-green-600' : 'bg-red-600'}
                      >
                        {result.simulated ? 'Simulated' :
                         result.verified ? 'Verified' : 'Failed'}
                      </Badge>
                    </div>
                    {result.error && (
                      <p className="text-sm font-medium text-red-600 mt-1">{result.error}</p>
                    )}
                    {result.simulated && (
                      <p className="text-sm font-medium text-green-700 mt-1">
                        Demo mode - using simulation for testing
                      </p>
                    )}
                    {result.reward && (
                      <div className="mt-2 p-3 bg-green-50 border-2 border-green-200 rounded">
                        <p className="text-sm text-green-700 font-bold">
                          💰 {result.reward.amount} {result.reward.token} sent!
                        </p>
                        {result.reward.txHash && (
                          <p className="text-xs text-green-700 font-mono truncate mt-1">
                            TX: {result.reward.txHash}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Overall Score */}
              <div className="mt-4 p-4 bg-white border-2 border-green-200 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-black">Verification Score:</span>
                  <span className="text-2xl font-bold text-green-600">
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
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-base font-medium text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {results.length === 0 ? (
              <Button
                onClick={handleVerify}
                disabled={verifying}
                className="flex-1 bg-green-600 hover:bg-green-700"
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
                <Button onClick={onClose} className="flex-1 bg-green-600 hover:bg-green-700">
                  Done
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

