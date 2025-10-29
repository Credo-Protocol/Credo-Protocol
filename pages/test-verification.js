/**
 * Test Page for $50 USDC Verification Faucet
 * 
 * This page allows you to test the verification flow manually.
 * Access via: http://localhost:3000/test-verification
 */

import { useState, useEffect } from 'react';
import { useAirKit } from '@/hooks/useAirKit';
import { verifyCredential, checkClaimStatus } from '@/lib/verificationService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Gift, ExternalLink } from 'lucide-react';

export default function TestVerification() {
  const { userInfo, userAddress, isConnected, loading: authLoading } = useAirKit();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Auto-check claim status on mount if logged in
  useEffect(() => {
    if (userAddress && isConnected) {
      handleCheckStatus();
    }
  }, [userAddress, isConnected]);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 Starting test verification...');
      
      const res = await verifyCredential({
        targetUserAddress: userAddress,
        requiredCredentialType: 'EMPLOYMENT',
        userInfo
      });
      
      setResult(res);
      
      // Refresh claim status after successful verification
      if (res.verified) {
        setTimeout(() => handleCheckStatus(), 1000);
      }
      
    } catch (error) {
      console.error('Test verification error:', error);
      setResult({ 
        success: false,
        error: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!userAddress) return;
    
    setCheckingStatus(true);
    try {
      const status = await checkClaimStatus(userAddress);
      setClaimStatus(status);
    } catch (error) {
      console.error('Check status error:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </Card>
      </div>
    );
  }

  // Show login prompt if not connected
  if (!isConnected || !userAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">$50 USDC Verification Test</h1>
          <p className="text-gray-600 mb-6">
            Please login with AIR Kit to test the verification flow.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Go to Home & Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Gift className="h-8 w-8 text-blue-600" />
            $50 USDC Verification Test
          </h1>
          <p className="text-gray-600">
            Test the employment verification and USDC reward claiming flow.
          </p>
        </div>

        {/* User Info Card */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">User Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-mono">{userAddress?.slice(0, 10)}...{userAddress?.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span>{userInfo?.user?.email || 'Not provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">User ID:</span>
              <span className="font-mono text-xs">{userInfo?.user?.id || 'N/A'}</span>
            </div>
          </div>
        </Card>

        {/* Claim Status Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Claim Status</h2>
            <Button 
              onClick={handleCheckStatus} 
              variant="outline" 
              size="sm"
              disabled={checkingStatus}
            >
              {checkingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Refresh Status'
              )}
            </Button>
          </div>

          {claimStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={claimStatus.claimed ? 'default' : 'secondary'}>
                  {claimStatus.claimed ? 'Claimed ✓' : 'Unclaimed'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium">Available Reward:</span>
                <span className="font-semibold text-lg">
                  {claimStatus.rewardAmount} {claimStatus.rewardToken}
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-700">{claimStatus.message}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Click "Refresh Status" to check claim status
            </div>
          )}
        </Card>

        {/* Test Verification Card */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Verification</h2>
          
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This will attempt to verify your employment credential
              and claim the $50 USDC reward. Each address can only claim once.
            </p>
          </div>

          <Button
            onClick={handleTest}
            disabled={loading || claimStatus?.claimed}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : claimStatus?.claimed ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Already Claimed
              </>
            ) : (
              <>
                <Gift className="mr-2 h-5 w-5" />
                Test Claim $50 USDC
              </>
            )}
          </Button>
        </Card>

        {/* Result Card */}
        {result && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {result.success && result.verified ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Verification Successful!
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Verification Failed
                </>
              )}
            </h2>

            <div className="space-y-3">
              {/* Success Message */}
              {result.message && (
                <div className={`p-4 rounded ${
                  result.success && result.verified 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    result.success && result.verified ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </p>
                </div>
              )}

              {/* Simulation Badge */}
              {result.simulated && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <Badge variant="outline" className="mb-2">Simulated Mode</Badge>
                  <p className="text-xs text-blue-700">
                    AIR Kit verification API not available. Using simulation for demo purposes.
                  </p>
                </div>
              )}

              {/* Reward Info */}
              {result.reward && (
                <div className="p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold mb-3">Reward Information:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold">{result.reward.amount} {result.reward.token}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={result.reward.claimed ? 'default' : 'secondary'}>
                        {result.reward.claimed ? 'Claimed' : 'Pending'}
                      </Badge>
                    </div>
                    {result.reward.txHash && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Transaction:</span>
                        <a 
                          href={`https://devnet-scan.mocachain.org/tx/${result.reward.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <span className="font-mono text-xs">{result.reward.txHash.slice(0, 10)}...</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Full Result (Debug) */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                  Show Full Result (Debug)
                </summary>
                <pre className="mt-2 p-4 bg-gray-900 text-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-2 text-blue-900">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Ensure backend is running: <code className="bg-white px-1 py-0.5 rounded">cd backend && npm run dev</code></li>
            <li>Check claim status to see if you've already claimed</li>
            <li>Click "Test Claim $50 USDC" to start verification</li>
            <li>If simulated mode: Transaction will be simulated (no real AIR Kit verification)</li>
            <li>If real mode: AIR Kit widget will open for ZK proof generation</li>
            <li>View transaction on block explorer if successful</li>
            <li>Try claiming again to test double-claim prevention</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}

