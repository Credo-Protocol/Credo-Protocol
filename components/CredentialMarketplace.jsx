/**
 * CredentialMarketplace Component
 * 
 * Displays all available credentials that users can request
 * to build their credit score. Fetches credentials from the backend
 * and handles the request flow.
 */

import { useState, useEffect } from 'react';
import CredentialCard from './CredentialCard';
import RequestCredentialModal from './RequestCredentialModal';
import { BACKEND_URL } from '@/lib/contracts';

export default function CredentialMarketplace({ userAddress, onCredentialSubmitted, provider }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch available credentials from backend
  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/credentials/types`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch credentials');
      }

      const data = await response.json();
      setCredentials(data.credentials || []);
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
    // Notify parent component that a credential was submitted
    onCredentialSubmitted && onCredentialSubmitted();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <p className="text-sm text-muted-foreground">Loading credentials...</p>
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Build Your Credit Score
        </h2>
        <p className="text-muted-foreground">
          Connect data sources to increase your score and unlock better loan terms.
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

