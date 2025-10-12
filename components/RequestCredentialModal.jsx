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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BACKEND_URL, CONTRACTS, CREDIT_ORACLE_ABI } from '@/lib/contracts';

export default function RequestCredentialModal({ credential, userAddress, isOpen, onClose, onSuccess }) {
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

      if (!window.ethereum) {
        throw new Error('Please install MetaMask to submit credentials');
      }

      // Get provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{credential?.name}</DialogTitle>
          <DialogDescription>{credential?.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Initial Request */}
          {step === 'request' && (
            <div className="py-6 space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  This will connect you to {credential?.name} to verify your information.
                </p>
                <div className="flex justify-center">
                  <Badge variant="secondary">
                    +{credential?.scoreWeight} points
                  </Badge>
                </div>
              </div>
              <Button onClick={handleRequestCredential} className="w-full">
                Connect & Verify
              </Button>
            </div>
          )}

          {/* Step 2: Loading */}
          {step === 'loading' && (
            <div className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <p className="text-sm text-muted-foreground">Requesting credential...</p>
            </div>
          )}

          {/* Step 3: Review Credential */}
          {step === 'review' && credentialData && (
            <div className="py-4 space-y-4">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                  ✓ Credential verified!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Ready to submit to blockchain
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{credentialData.credential.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Score Boost:</span>
                  <span className="font-medium text-green-600">+{credential.scoreWeight} points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid Until:</span>
                  <span className="font-medium">
                    {new Date(credentialData.credential.expiresAt * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Button onClick={handleSubmitToOracle} className="w-full">
                Submit to Update Score
              </Button>
            </div>
          )}

          {/* Step 4: Submitting */}
          {step === 'submitting' && (
            <div className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Submitting to blockchain...</p>
                <p className="text-xs text-muted-foreground">
                  Please confirm the transaction in your wallet
                </p>
                {txHash && (
                  <p className="text-xs font-mono text-muted-foreground">
                    Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <div className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="text-6xl animate-bounce">🎉</div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-green-600">Score Updated!</h3>
                <p className="text-sm text-muted-foreground">
                  Your credit score has been updated on-chain.
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Error */}
          {step === 'error' && (
            <div className="py-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  ✗ Error
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {error}
                </p>
              </div>
              <Button onClick={() => setStep('request')} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

