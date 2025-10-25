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
import { handleTransactionError } from '@/lib/errorHandler';

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

      // Determine endpoint based on credential format
      // Phase 2 credentials have 'id' field, legacy credentials have 'credentialType' field
      let endpoint;
      if (credential.id) {
        // Phase 2 format: use specific endpoints
        endpoint = `${BACKEND_URL}/api/credentials/request/${credential.id}`;
      } else if (credential.credentialType !== undefined) {
        // Legacy format: use old endpoint
        endpoint = `${BACKEND_URL}/api/credentials/request`;
      } else {
        throw new Error('Invalid credential format');
      }

      console.log('Requesting credential from backend...', {
        userAddress,
        endpoint,
        credentialId: credential.id,
        credentialType: credential.credentialType
      });

      const requestBody = credential.id 
        ? { userAddress }  // Phase 2 format
        : { userAddress, credentialType: credential.credentialType, mockData: {} }; // Legacy format

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

      console.log('🔐 Getting signer from provider...', { 
        hasProvider: !!provider,
        providerType: provider?.constructor?.name 
      });
      
      // Get signer - this should trigger AIR Kit popup
      const signer = await provider.getSigner();
      console.log('✅ Signer obtained successfully:', {
        hasSigner: !!signer,
        signerType: signer?.constructor?.name
      });

      // Create contract instance
      const oracleContract = new ethers.Contract(
        CONTRACTS.CREDIT_ORACLE,
        CREDIT_ORACLE_ABI,
        signer
      );

      // Phase 2: Determine which parameters to use based on credential format
      const isPhase2 = credentialData.credentialData !== undefined; // Phase 2 has credentialData field
      
      const submitParams = isPhase2 ? {
        credentialData: credentialData.credentialData,
        signature: credentialData.signature,
        issuer: credentialData.credential.issuer,
        credentialTypeHash: credentialData.credential.credentialTypeHash,
        expiresAt: credentialData.credential.expirationDate
      } : {
        // Legacy format
        credentialData: credentialData.encodedData,
        signature: credentialData.signature,
        issuer: credentialData.credential.issuer,
        credentialTypeHash: ethers.id('LEGACY_TYPE'), // Convert legacy to hash
        expiresAt: credentialData.credential.expiresAt
      };

      console.log('Submitting credential to oracle...', submitParams);

      // Submit credential to smart contract
      // This should trigger AIR Kit's wallet confirmation popup
      console.log('🔐 Calling submitCredential - AIR Kit popup should appear now...');
      const tx = await oracleContract.submitCredential(
        submitParams.credentialData,
        submitParams.signature,
        submitParams.issuer,
        submitParams.credentialTypeHash,
        submitParams.expiresAt
      );

      console.log('✅ Transaction sent:', tx.hash);
      setTxHash(tx.hash);

      // Wait for transaction to be mined
      console.log('⏳ Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      setStep('success');
      
      // Call success callback after a short delay to show success animation
      setTimeout(() => {
        onSuccess && onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting credential:', err);
      const errorMessage = handleTransactionError('Submit Credential', err);
      setError(errorMessage);
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
                {credential?.privacyPreserving && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-green-50 border border-green-200">
                    <span className="text-xs font-medium text-green-700">🔒 Privacy-Preserving</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/10">
                  <span className="text-sm font-medium text-black">
                    {credential?.weight || `+${credential?.scoreWeight} points`}
                  </span>
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
                  <span className="text-sm font-medium text-black">
                    {credentialData.credential.credentialType || credentialData.credential.type}
                  </span>
                </div>
                {/* Phase 2: Show bucket info if available */}
                {credentialData.credential.metadata?.display && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-black/60">Bucket:</span>
                    <span className="text-sm font-medium text-black">
                      {credentialData.credential.metadata.display}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black/60">Score Boost:</span>
                  <span className="text-sm font-medium text-green-600">
                    +{credentialData.credential.metadata?.weight || credential.scoreWeight} points
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black/60">Valid Until:</span>
                  <span className="text-sm font-medium text-black">
                    {new Date((credentialData.credential.expirationDate || credentialData.credential.expiresAt) * 1000).toLocaleDateString()}
                  </span>
                </div>
                {/* Phase 2: Show privacy note */}
                {credentialData.credential.metadata?.privacyNote && (
                  <div className="pt-2 border-t border-black/5">
                    <p className="text-xs text-green-600">
                      🔒 {credentialData.credential.metadata.privacyNote}
                    </p>
                  </div>
                )}
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
                  {txHash 
                    ? 'Waiting for transaction confirmation...' 
                    : 'Please check your wallet for a confirmation popup'}
                </p>
                {txHash && (
                  <p className="text-xs font-mono text-black/50 mt-2">
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

