/**
 * RequestCredentialModal Component - Phase 5.3
 * 
 * NEW FLOW (Official MOCA Integration):
 * 1. Request credential preparation from backend (get Partner JWT)
 * 2. Issue credential via AIR Kit (gas-sponsored!)
 * 3. Retrieve credential from AIR Kit wallet (stored on MCSP)
 * 4. Display credential details
 * 5. Submit credential to CreditScoreOracle smart contract
 * 6. Show success/error states
 * 
 * Changes from old flow:
 * - Backend prepares (doesn't issue) credentials
 * - AIR Kit handles issuance and storage
 * - Credentials stored on MCSP (decentralized)
 * - Gas sponsorship enabled (no MOCA tokens needed)
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, Lock, FileText, Zap, XCircle } from 'lucide-react';
import { CONTRACTS, CREDIT_ORACLE_ABI } from '@/lib/contracts';
import { handleTransactionError } from '@/lib/errorHandler';
import { issueCredential } from '@/lib/credentialServices';
import { useAirKit } from '@/hooks/useAirKit';

export default function RequestCredentialModal({ credential, userAddress, isOpen, onClose, onSuccess, provider }) {
  const { userInfo } = useAirKit();
  const [step, setStep] = useState('request'); // request, preparing, issuing, storing, review, submitting, success, error
  const [loadingMessage, setLoadingMessage] = useState('');
  const [credentialData, setCredentialData] = useState(null);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [readyForAirKit, setReadyForAirKit] = useState(false); // Hide modal when AIR Kit is ready

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('request');
      setCredentialData(null);
      setError(null);
      setTxHash(null);
      setLoadingMessage('');
      setReadyForAirKit(false);
    }
  }, [isOpen]);

  // Step 1: Request credential via AIR Kit (Phase 5.3)
  const handleRequestCredential = async () => {
    try {
      setError(null);

      // Get credential type ID
      const credentialType = credential.id || 
                             (credential.credentialType === 2 ? 'cex-history' :
                              credential.credentialType === 3 ? 'employment' :
                              credential.credentialType === 1 ? 'bank-balance' : 'unknown');

      console.log('[NEW] Phase 5.3: Issuing credential via AIR Kit...', {
        userAddress,
        credentialType,
        credential
      });

      // Step 1: Preparing
      setStep('preparing');
      setLoadingMessage('Generating auth token...');
      await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5 second pause for visibility

      // Step 2: Issuing via AIR Kit
      setStep('issuing');
      setLoadingMessage('Issuing credential via AIR Kit...');
      await new Promise(resolve => setTimeout(resolve, 800)); // Show second dot before AIR Kit modal
      
      // Hide our modal so AIR Kit can show
      setReadyForAirKit(true);
      
      // Use the new credential service
      const issuedCredential = await issueCredential(
        userAddress,
        credentialType,
        userInfo
      );

      // Step 3: Complete (stored on MCSP automatically)
      setLoadingMessage('Credential issued and stored on MCSP!');
      
      // Show our modal again for review step
      setReadyForAirKit(false);

      console.log('[SUCCESS] Credential issued and stored:', issuedCredential);

      // Backend has already prepared everything for contract submission:
      // - Encoded credential data
      // - Signed with issuer's private key
      // - Proper Ethereum addresses (not DIDs)
      
      console.log('[INFO] Credential ready for contract:');
      console.log('  Type:', issuedCredential.credentialType);
      console.log('  Issuer:', issuedCredential.issuer);
      console.log('  Subject:', issuedCredential.subject);
      console.log('  Weight:', issuedCredential.weight);
      console.log('  Signature:', issuedCredential.signature.substring(0, 20) + '...');
      
      const credentialForContract = {
        success: true,
        credential: {
          credentialType: issuedCredential.credentialType,
          issuer: issuedCredential.issuer,
          subject: issuedCredential.subject,
          issuanceDate: issuedCredential.issuanceDate,
          expirationDate: issuedCredential.expirationDate,
          metadata: {
            weight: issuedCredential.weight,
            display: `${issuedCredential.bucket} - ${issuedCredential.bucketRange}`,
            privacyNote: 'Stored on MCSP (decentralized storage)',
            storedOnMCSP: true
          }
        },
        credentialData: ethers.AbiCoder.defaultAbiCoder().encode(
          ['string', 'address', 'uint256', 'uint256'],
          [
            issuedCredential.credentialType,
            issuedCredential.subject,
            issuedCredential.issuanceDate,
            issuedCredential.weight
          ]
        ),
        signature: issuedCredential.signature
      };

      setCredentialData(credentialForContract);
      setStep('review');
    } catch (err) {
      console.error('[ERROR] Error issuing credential:', err);
      setError(err.message || 'Failed to issue credential');
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

      console.log('[LOCK] Getting signer from provider...', { 
        hasProvider: !!provider,
        providerType: provider?.constructor?.name 
      });
      
      // Provider is already wrapped as ethers.BrowserProvider in useAirKit
      // Just get the signer - this will trigger AIR Kit popup
      const signer = await provider.getSigner();
      console.log('[SUCCESS] Signer obtained successfully:', {
        hasSigner: !!signer,
        signerType: signer?.constructor?.name
      });

      // Create contract instance
      const oracleContract = new ethers.Contract(
        CONTRACTS.CREDIT_ORACLE,
        CREDIT_ORACLE_ABI,
        signer
      );

      // Backend has already:
      // 1. Encoded the credential data
      // 2. Signed it with the issuer's private key
      // 3. Verified the issuer is registered
      
      // Convert credentialType string to bytes32 hash
      const credentialTypeHash = ethers.id(credentialData.credential.credentialType);
      
      const submitParams = {
        credentialData: credentialData.credentialData,
        signature: credentialData.signature,  // Backend-signed with issuer's key
        issuer: credentialData.credential.issuer,  // Issuer address from backend
        credentialTypeHash: credentialTypeHash,
        expiresAt: credentialData.credential.expirationDate
      };

      console.log('[SUBMIT] Submitting credential to oracle...');
      console.log('  Contract Address:', CONTRACTS.CREDIT_ORACLE);
      console.log('  Credential Type:', credentialData.credential.credentialType);
      console.log('  Credential Type Hash:', credentialTypeHash);
      console.log('  Issuer:', submitParams.issuer);
      console.log('  Subject:', credentialData.credential.subject);
      console.log('  Expires At:', submitParams.expiresAt);
      console.log('  Signature length:', submitParams.signature.length);

      // Submit credential to smart contract
      // This should trigger AIR Kit's wallet confirmation popup
      console.log('[LOCK] Calling submitCredential - AIR Kit popup should appear now...');
      const tx = await oracleContract.submitCredential(
        submitParams.credentialData,
        submitParams.signature,
        submitParams.issuer,
        submitParams.credentialTypeHash,
        submitParams.expiresAt
      );

      console.log('[SUCCESS] Transaction sent:', tx.hash);
      setTxHash(tx.hash);

      // Wait for transaction to be mined
      console.log('[WAIT] Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      console.log('[SUCCESS] Transaction confirmed:', receipt);

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

  // Hide modal when AIR Kit is ready to show (after we display the second dot)
  // This prevents z-index conflicts and ensures users can interact with AIR Kit
  const shouldShowDialog = isOpen && !readyForAirKit;
  
  return (
    <Dialog open={shouldShowDialog} onOpenChange={onClose}>
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
                    <Lock className="h-3 w-3 text-green-700" />
                    <span className="text-xs font-medium text-green-700">Privacy-Preserving</span>
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

          {/* Step 2: Loading - AIR Kit Issuance (Phase 5.3) */}
          {(step === 'preparing' || step === 'issuing') && (
            <div className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-black" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {step === 'preparing' && <Lock className="h-4 w-4 text-black" />}
                  {step === 'issuing' && <FileText className="h-4 w-4 text-black" />}
                  <p className="text-sm font-medium text-black">
                    {loadingMessage}
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${step === 'preparing' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <div className={`h-2 w-2 rounded-full ${step === 'issuing' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                </div>
                {step === 'issuing' && (
                  <div className="mt-2 space-y-1">
                    {process.env.NEXT_PUBLIC_PAYMASTER_POLICY_ID && (
                      <div className="flex items-center justify-center gap-1">
                        <Zap className="h-3 w-3 text-green-600" />
                        <p className="text-xs text-green-600">
                          Gas-sponsored - No MOCA tokens needed!
                        </p>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-1">
                      <Lock className="h-3 w-3 text-blue-600" />
                      <p className="text-xs text-blue-600">
                        Storing on MCSP (decentralized storage)
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
                    <div className="flex items-center gap-1">
                      <Lock className="h-3 w-3 text-green-600" />
                      <p className="text-xs text-green-600">
                        {credentialData.credential.metadata.privacyNote}
                      </p>
                    </div>
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
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-900" />
                  <p className="text-sm text-red-900 font-medium">
                    Error
                  </p>
                </div>
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

