/**
 * RequestCredentialModal Component
 * 
 * Handles the complete flow of requesting and submitting a credential:
 * 1. Request credential from backend issuer
 * 2. Display credential details
 * 3. Submit credential to CreditScoreOracle smart contract
 * 4. Show success/error states
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { BACKEND_URL, CONTRACTS, CREDIT_ORACLE_ABI } from '@/lib/contracts';

export default function RequestCredentialModal({ credential, userAddress, isOpen, onClose, onSuccess, provider }) {
  const [step, setStep] = useState('request'); // request, loading, review, submitting, success, error
  const [credentialData, setCredentialData] = useState(null);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('request');
      setCredentialData(null);
      setError(null);
      setTxHash(null);
    }
  }, [isOpen]);

  // Step 1: Request credential from backend
  const handleRequestCredential = async () => {
    try {
      setStep('loading');
      setError(null);

      console.log('Requesting credential from backend...', {
        userAddress,
        credentialType: credential.credentialType
      });

      const response = await fetch(`${BACKEND_URL}/api/credentials/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          credentialType: credential.credentialType,
          mockData: {} // In production, this would come from OAuth flow
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to issue credential');
      }

      console.log('Credential issued successfully:', data);
      setCredentialData(data);
      setStep('review');
    } catch (err) {
      console.error('Error requesting credential:', err);
      setError(err.message);
      setStep('error');
    }
  };

  // Step 2: Submit credential to smart contract
  const handleSubmitToOracle = async () => {
    try {
      setStep('submitting');
      setError(null);

      if (!provider) {
        throw new Error('Please connect your wallet to submit credentials');
      }

      // Get signer
      const signer = await provider.getSigner();

      // Create contract instance
      const oracleContract = new ethers.Contract(
        CONTRACTS.CREDIT_ORACLE,
        CREDIT_ORACLE_ABI,
        signer
      );

      console.log('Submitting credential to oracle...', {
        encodedData: credentialData.encodedData,
        signature: credentialData.signature,
        issuer: credentialData.credential.issuer,
        credentialType: credentialData.credential.credentialType,
        expiresAt: credentialData.credential.expiresAt
      });

      // Submit credential to smart contract
      const tx = await oracleContract.submitCredential(
        credentialData.encodedData,
        credentialData.signature,
        credentialData.credential.issuer,
        credentialData.credential.credentialType,
        credentialData.credential.expiresAt
      );

      console.log('Transaction sent:', tx.hash);
      setTxHash(tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      setStep('success');
      
      // Call success callback after a short delay to show success animation
      setTimeout(() => {
        onSuccess && onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting credential:', err);
      setError(err.message || 'Failed to submit credential');
      setStep('error');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border-black/10">
        <DialogHeader>
          <DialogTitle className="text-black text-xl font-bold">{credential?.name}</DialogTitle>
          <DialogDescription className="text-black/60">{credential?.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Initial Request */}
          {step === 'request' && (
            <div className="py-6 space-y-4">
              <div className="text-center space-y-4">
                <p className="text-sm text-black/70">
                  This will connect you to {credential?.name} to verify your information.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/10">
                  <span className="text-sm font-medium text-black">+{credential?.scoreWeight} points</span>
                </div>
              </div>
              <button
                className="w-full h-12 bg-black text-white rounded-md transition-all duration-300 hover:bg-black/80 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 font-medium"
                onClick={handleRequestCredential}
              >
                Connect & Verify
              </button>
            </div>
          )}

          {/* Step 2: Loading */}
          {step === 'loading' && (
            <div className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-black" />
              </div>
              <p className="text-sm text-black/60">Requesting credential...</p>
            </div>
          )}

          {/* Step 3: Review Credential */}
          {step === 'review' && credentialData && (
            <div className="py-4 space-y-4">
              <div className="p-4 rounded-xl border border-green-500/20 bg-green-50">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-900 font-medium">
                      Credential verified!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Ready to submit to blockchain
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-xl border border-black/10 bg-white space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black/60">Type:</span>
                  <span className="text-sm font-medium text-black">{credentialData.credential.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black/60">Score Boost:</span>
                  <span className="text-sm font-medium text-green-600">+{credential.scoreWeight} points</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black/60">Valid Until:</span>
                  <span className="text-sm font-medium text-black">
                    {new Date(credentialData.credential.expiresAt * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                className="w-full h-12 bg-black text-white rounded-md transition-all duration-300 hover:bg-black/80 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 font-medium"
                onClick={handleSubmitToOracle}
              >
                Submit to Update Score
              </button>
            </div>
          )}

          {/* Step 4: Submitting */}
          {step === 'submitting' && (
            <div className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-black" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-black">Submitting to blockchain...</p>
                <p className="text-xs text-black/60">
                  Please confirm the transaction in your wallet
                </p>
                {txHash && (
                  <p className="text-xs font-mono text-black/50">
                    Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto animate-pulse" />
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-black">Score Updated!</h3>
                <p className="text-sm text-black/60">
                  Your credit score has been updated on-chain.
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Error */}
          {step === 'error' && (
            <div className="py-6 space-y-4">
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-50">
                <p className="text-sm text-red-900 font-medium">
                  ✗ Error
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {error}
                </p>
              </div>
              <button
                className="w-full h-12 border border-black/20 rounded-md hover:bg-black/5 transition-colors text-black font-medium"
                onClick={() => setStep('request')}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

