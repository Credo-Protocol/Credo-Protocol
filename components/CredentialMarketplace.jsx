/**
 * CredentialMarketplace Component
 * 
 * Displays all available credentials that users can request
 * to build their credit score. Fetches credentials from the backend
 * and handles the request flow.
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CredentialCard from './CredentialCard';
import RequestCredentialModal from './RequestCredentialModal';
import { Skeleton } from '@/components/ui/skeleton';
import { BACKEND_URL, CONTRACTS, CREDIT_ORACLE_ABI } from '@/lib/contracts';

export default function CredentialMarketplace({ userAddress, onCredentialSubmitted, provider }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittedCredentialIds, setSubmittedCredentialIds] = useState(new Set());

  // Fetch available credentials from backend
  useEffect(() => {
    fetchCredentials();
  }, []);

  // Fetch submitted credentials from blockchain when user changes
  useEffect(() => {
    if (userAddress && provider) {
      fetchSubmittedCredentials();
    }
  }, [userAddress, provider]);

  // Fetch user's submitted credentials from blockchain events
  const fetchSubmittedCredentials = async () => {
    try {
      console.log('[FETCH] Fetching submitted credentials from blockchain...');
      
      // Create contract instance (read-only, no signer needed)
      const oracleContract = new ethers.Contract(
        CONTRACTS.CREDIT_ORACLE,
        CREDIT_ORACLE_ABI,
        provider
      );

      // Get current block number
      const currentBlock = await provider.getBlockNumber();
      console.log('[FETCH] Current block:', currentBlock);
      
      // Moca Chain RPC limit: max 10,000 blocks per query
      // Query last 10,000 blocks to stay within limit
      const fromBlock = Math.max(0, currentBlock - 10000);
      
      console.log('[FETCH] Querying from block', fromBlock, 'to', currentBlock);

      // Query CredentialSubmitted events for this user
      // Event signature: CredentialSubmitted(address indexed user, address indexed issuer, uint256 credentialType, uint256 newScore)
      const filter = oracleContract.filters.CredentialSubmitted(userAddress);
      const events = await oracleContract.queryFilter(filter, fromBlock, currentBlock);

      console.log(`[FETCH] Found ${events.length} submitted credentials`);

      // Extract credential type hashes from events
      const submittedTypeHashes = new Set(
        events.map(event => event.args.credentialType.toString())
      );

      console.log('[FETCH] Submitted credential type hashes:', Array.from(submittedTypeHashes));

      // Store the hashes so we can check them when credentials load
      setSubmittedCredentialIds(submittedTypeHashes);

    } catch (err) {
      console.error('[ERROR] Failed to fetch submitted credentials:', err);
      // Don't fail the entire component if this fails
      // User can still see credentials and request them
    }
  };

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/credentials/types`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch credentials');
      }

      const data = await response.json();
      // Phase 2: Backend returns credentialTypes, not credentials
      setCredentials(data.credentialTypes || data.credentials || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching credentials:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCredential = (credential) => {
    setSelectedCredential(credential);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCredential(null);
  };

  const handleCredentialSuccess = () => {
    // Mark credential as submitted by adding its type hash
    if (selectedCredential) {
      // Calculate the hash of this credential's bucket (same as contract does)
      const credentialTypeHash = ethers.id(selectedCredential.bucket);
      const hashAsString = BigInt(credentialTypeHash).toString();
      
      console.log('[SUCCESS] Adding credential to submitted list:', {
        id: selectedCredential.id,
        bucket: selectedCredential.bucket,
        hash: hashAsString
      });
      
      setSubmittedCredentialIds(prev => new Set([...prev, hashAsString]));
    }
    
    // Notify parent component that a credential was submitted
    onCredentialSubmitted && onCredentialSubmitted();
  };

  // Helper function to check if a credential has been submitted
  const isCredentialSubmitted = (credential) => {
    if (!credential.bucket) return false;
    
    // Calculate the hash of this credential type
    const credentialTypeHash = ethers.id(credential.bucket);
    const hashAsString = BigInt(credentialTypeHash).toString();
    
    return submittedCredentialIds.has(hashAsString);
  };

  // Enhanced loading state with skeleton cards
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
              <Skeleton className="h-10 w-full mt-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <p className="text-red-500">Error loading credentials: {error}</p>
          <button 
            onClick={fetchCredentials}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!userAddress) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            Please connect your wallet to request credentials
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-black">
          Request Credentials
        </h2>
        <p className="text-black/60 text-lg">
          Connect your data sources and request verifiable credentials to build your credit score
        </p>
      </div>

      {/* Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {credentials.map((credential) => (
          <CredentialCard
            key={credential.id}
            credential={credential}
            onRequest={handleRequestCredential}
            isLoading={false}
            isSubmitted={isCredentialSubmitted(credential)}
          />
        ))}
      </div>

      {/* Request Modal */}
      {selectedCredential && (
        <RequestCredentialModal
          credential={selectedCredential}
          userAddress={userAddress}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleCredentialSuccess}
          provider={provider}
        />
      )}
    </div>
  );
}

