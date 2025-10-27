/**
 * Credential Wallet Component - Phase 5.3
 * 
 * Displays credentials stored in user's AIR Kit wallet.
 * Shows decentralized storage (MCSP) status and credential details.
 * 
 * Features:
 * - Lists all user's AIR Kit credentials
 * - Shows validation status (active/expired)
 * - Indicates MCSP storage
 * - Refresh functionality
 * - Empty state for new users
 */

import { useState, useEffect } from 'react';
import { useAirKit } from '@/hooks/useAirKit';
import { getUserCredentials, getCredentialDisplayInfo } from '@/lib/credentialServices';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, RefreshCw, CheckCircle, XCircle, Database, AlertTriangle, Clock, Ban } from 'lucide-react';

export function CredentialWallet() {
  const { userAddress, isConnected } = useAirKit();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load credentials on mount and when user connects
  useEffect(() => {
    if (isConnected && userAddress) {
      loadCredentials();
    }
  }, [isConnected, userAddress]);

  const loadCredentials = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const userCreds = await getUserCredentials(userAddress);
      setCredentials(userCreds);
      
      console.log(`✅ Loaded ${userCreds.length} credentials from AIR Kit wallet`);
    } catch (error) {
      console.error('Failed to load credentials:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadCredentials(true);
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            My Credentials
          </CardTitle>
          <CardDescription>
            Loading your AIR Kit wallet...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Not connected state
  if (!isConnected || !userAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            My Credentials
          </CardTitle>
          <CardDescription>
            Connect your wallet to view credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Please connect your wallet to view your credentials</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              My Credentials
            </CardTitle>
            <CardDescription>
              Stored securely in your AIR Kit wallet on MOCA Chain
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">
              ⚠️ {error}
            </p>
          </div>
        )}

        {credentials.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground space-y-3">
              <Wallet className="h-16 w-16 mx-auto opacity-30" />
              <div>
                <p className="font-medium">No credentials yet</p>
                <p className="text-sm mt-2">
                  Request credentials in the <strong>Build Credit</strong> section to unlock better rates!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map((credential, index) => {
              const display = getCredentialDisplayInfo(credential);
              
              return (
                <div
                  key={credential.id || index}
                  className={`p-4 border rounded-lg transition-all ${
                    display.isRevoked 
                      ? 'bg-red-50 border-red-200 opacity-75' 
                      : display.isExpired 
                      ? 'bg-yellow-50 border-yellow-200 opacity-90' 
                      : 'hover:bg-accent/50 border-black/10'
                  }`}
                >
                  {/* Header: Icon and Details */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{display.icon}</span>
                      <div>
                        <p className="font-medium capitalize">{display.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Issued: {display.issuedDate}
                        </p>
                        {display.expiryDate && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {display.expiryText}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1">
                      {display.isRevoked ? (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <Ban className="h-3 w-3" />
                          Revoked
                        </Badge>
                      ) : display.isExpired ? (
                        <Badge variant="outline" className="text-xs gap-1 bg-yellow-100 border-yellow-300 text-yellow-800">
                          <XCircle className="h-3 w-3" />
                          Expired
                        </Badge>
                      ) : display.daysUntilExpiry !== null && display.daysUntilExpiry <= 30 ? (
                        <Badge variant="outline" className="text-xs gap-1 bg-orange-50 border-orange-200 text-orange-700">
                          <AlertTriangle className="h-3 w-3" />
                          Expiring Soon
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs gap-1 bg-green-50 border-green-200 text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Revocation Notice */}
                  {display.isRevoked && display.revocationReason && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                      <strong>Revocation Reason:</strong> {display.revocationReason}
                    </div>
                  )}
                  
                  {/* Expiry Warning */}
                  {!display.isRevoked && display.isExpired && (
                    <div className="mt-2 p-2 bg-yellow-100 border border-yellow-200 rounded text-xs text-yellow-800">
                      This credential has expired. Request a new one to maintain your credit score.
                    </div>
                  )}
                  
                  {/* Bottom: Storage Badge */}
                  <div className="mt-3 pt-3 border-t border-black/5">
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Database className="h-3 w-3" />
                      MCSP Decentralized Storage
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info footer */}
        {credentials.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>🔒 Decentralized Storage:</strong> Your credentials are stored on MOCA Chain Storage Providers (MCSP), 
              ensuring privacy and availability across the MOCA ecosystem.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CredentialWallet;

