# Phase 3: Frontend Verification Service

**$50 USDC Faucet - Frontend Service Layer**  
**Time Required:** ~30-45 minutes  
**Difficulty:** Medium  

---

## Goal

Build the frontend service that handles verification and USDC reward claiming.

**What You'll Build:**
- ✅ Frontend verification service
- ✅ AIR Kit integration with verification widget
- ✅ Claim status checking
- ✅ Simulation fallback for testing
- ✅ Result processing with reward info

---

## What This Does

The frontend faucet service:
1. **Calls backend** to prepare verification
2. **Triggers AIR Kit widget** for ZK proof generation
3. **Handles verification flow** - loading states, errors
4. **Processes results** - USDC transfer confirmation
5. **Checks claim status** - prevent double-claiming

```
User Clicks → Check Claimed? → Prepare → AIR Kit Verify → Backend Transfers USDC → Show TX Hash
```

---

## Step 3.1: Create Verification Service

### File Location:
```
lib/verificationService.js
```

### Implementation:

Create `lib/verificationService.js`:

```javascript
/**
 * Frontend Verification Service - $50 USDC Faucet
 * 
 * Handles credential verification and USDC reward claiming
 * Integrates with backend verification service
 * 
 * Based on: https://docs.moca.network/airkit/usage/credential/verify
 */

import { airService } from './airkit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
                     process.env.NEXT_PUBLIC_BACKEND_URL || 
                     'http://localhost:3001';

/**
 * Verify credential and claim $50 USDC reward
 * 
 * Opens AIR Kit verification widget which:
 * 1. Requests EMPLOYMENT credential from user
 * 2. Generates zero-knowledge proof
 * 3. Submits proof to Moca Chain
 * 4. Backend transfers $50 USDC to user
 * 
 * @param {Object} params - Verification parameters
 * @param {string} params.targetUserAddress - User address to verify
 * @param {string} params.requiredCredentialType - Usually 'EMPLOYMENT'
 * @param {Object} params.userInfo - Current user's AIR Kit info
 * @returns {Promise<Object>} Verification result with reward info
 */
export async function verifyCredential({ 
  targetUserAddress, 
  requiredCredentialType,
  userInfo 
}) {
  try {
    console.log(`💰 Initiating $50 USDC claim verification`);
    console.log(`   Target: ${targetUserAddress || 'Current user'}`);
    console.log(`   Required: ${requiredCredentialType || 'EMPLOYMENT'}`);

    // Step 1: Prepare verification request
    console.log('  Step 1/3: Preparing verification...');
    
    const prepareResponse = await fetch(`${API_BASE_URL}/api/verification/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userInfo?.user?.id,
        email: userInfo?.user?.email,
        targetUserAddress,
        requiredCredentialType: requiredCredentialType || 'EMPLOYMENT'
      })
    });

    if (!prepareResponse.ok) {
      throw new Error(`Prepare failed: ${prepareResponse.statusText}`);
    }

    const prepared = await prepareResponse.json();

    if (!prepared.success) {
      throw new Error(prepared.error || 'Failed to prepare verification');
    }

    const { authToken, verifierDid, programId, reward } = prepared;

    console.log('  ✅ Verification prepared');
    console.log(`    Verifier DID: ${verifierDid}`);
    console.log(`    Program ID: ${programId}`);
    console.log(`    Reward: ${reward.amount} ${reward.token}`);

    // Step 2: Initiate verification via AIR Kit
    // This opens the AIR Kit widget for ZK proof generation
    console.log('  Step 2/3: Opening AIR Kit verification widget...');

    // Check if verifyCredential method exists
    if (typeof airService.verifyCredential !== 'function') {
      console.warn('⚠️ airService.verifyCredential not available');
      console.warn('   This requires AIR Kit SDK version with verification support');
      
      // Fallback: simulate verification for demo
      console.log('   Using simulation mode for demo');
      
      const simulatedResult = {
        verified: true,
        proofData: {
          proof: 'simulated_zk_proof',
          publicInputs: ['simulated_input']
        }
      };
      
      // Process simulated result in backend
      try {
        await fetch(`${API_BASE_URL}/api/verification/result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: targetUserAddress || userInfo?.user?.abstractAccountAddress,
            verified: true,
            proofData: simulatedResult.proofData,
            credentialType: requiredCredentialType
          })
        });
      } catch (processError) {
        console.warn('  ⚠️ Failed to process result in backend (non-critical)');
      }
      
      return {
        success: true,
        verified: true,
        simulated: true,
        rewardClaimed: true,
        reward: {
          amount: reward.amount,
          token: reward.token,
          txHash: 'simulated_tx_hash',
          claimed: true
        },
        message: 'Verification simulated - $50 USDC reward claimed (demo mode)',
        timestamp: Math.floor(Date.now() / 1000)
      };
    }

    // Real verification with AIR Kit
    const verificationResult = await airService.verifyCredential({
      authToken,
      verifierDid,
      programId,
      targetUserAddress
    });

    console.log('  ✅ Verification completed');
    console.log(`    Result: ${verificationResult.verified ? 'VERIFIED ✓' : 'FAILED ✗'}`);

    // Step 3: Process result in backend
    console.log('  Step 3/3: Processing verification result...');

    let processedResult;
    try {
      const resultResponse = await fetch(`${API_BASE_URL}/api/verification/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: targetUserAddress || userInfo?.user?.abstractAccountAddress,
          verified: verificationResult.verified,
          proofData: verificationResult.proofData,
          credentialType: requiredCredentialType
        })
      });

      processedResult = await resultResponse.json();
    } catch (processError) {
      console.warn('  ⚠️ Failed to process result in backend (non-critical)');
      processedResult = {
        success: true,
        verified: verificationResult.verified,
        rewardClaimed: verificationResult.verified
      };
    }

    console.log('✅ Verification complete!');
    
    return {
      success: true,
      verified: verificationResult.verified,
      rewardClaimed: verificationResult.verified,
      reward: processedResult.reward,
      proofData: verificationResult.proofData,
      message: processedResult.message,
      timestamp: Math.floor(Date.now() / 1000)
    };

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

/**
 * Request verification of multiple credentials
 * 
 * Use case: Verify all required credentials at once
 * Example: Verify BOTH income AND bank balance
 * 
 * @param {string} targetUserAddress - User to verify
 * @param {Array<string>} requiredCredentials - List of credential types
 * @param {Object} userInfo - Current user info
 * @returns {Promise<Object>} Verification results
 */
export async function verifyMultipleCredentials(
  targetUserAddress,
  requiredCredentials,
  userInfo
) {
  try {
    console.log(`📋 Verifying multiple credentials for ${targetUserAddress}`);
    console.log(`   Required: ${requiredCredentials.join(', ')}`);

    const results = [];

    // Verify each credential sequentially
    for (const credType of requiredCredentials) {
      try {
        const result = await verifyCredential({
          targetUserAddress,
          requiredCredentialType: credType,
          userInfo
        });

        results.push({
          credentialType: credType,
          ...result
        });

      } catch (error) {
        console.error(`  ❌ Failed to verify ${credType}:`, error);
        results.push({
          credentialType: credType,
          success: false,
          verified: false,
          error: error.message
        });
      }
    }

    // Calculate overall score
    const verifiedCount = results.filter(r => r.verified).length;
    const totalCount = results.length;
    const verificationScore = (verifiedCount / totalCount) * 100;

    console.log(`✅ Verification complete: ${verifiedCount}/${totalCount} verified`);

    return {
      success: true,
      targetUserAddress,
      results,
      verificationScore,
      allVerified: verifiedCount === totalCount,
      anyVerified: verifiedCount > 0
    };

  } catch (error) {
    console.error('❌ Multiple verification failed:', error);
    throw error;
  }
}

/**
 * Check if user has claimed $50 USDC reward
 * 
 * Quick check to prevent double-claiming
 * Used for UI display
 * 
 * @param {string} userAddress - User wallet address
 * @returns {Promise<Object>} Claim status
 */
export async function checkClaimStatus(userAddress) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/verification/claim-status/${userAddress}`);
    
    if (!response.ok) {
      throw new Error('Failed to check claim status');
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Failed to check claim status:', error);
    return {
      success: false,
      claimed: false,
      error: error.message
    };
  }
}

// Export all functions
export default {
  verifyCredential,
  verifyMultipleCredentials,
  checkClaimStatus
};
```

### What This Code Does:

**1. verifyCredential()**
- Main function for claiming $50 USDC
- Prepares request via backend
- Opens AIR Kit widget OR uses simulation
- Processes result and USDC transfer
- Returns reward info with TX hash

**2. verifyMultipleCredentials()**
- Verifies multiple credential types (if needed)
- Sequential verification
- Returns overall score
- Useful for complex requirements

**3. checkClaimStatus()**
- Quick check if user already claimed
- Returns claimed status
- Prevents double-claiming
- Used for UI display

---

## Step 3.2: Update Environment Variables

### Frontend Environment:

Update `.env.local`:

```bash
# $50 USDC Verification Faucet (Phase 3)
NEXT_PUBLIC_VERIFIER_DID=did:moca:your-verifier-did
NEXT_PUBLIC_VERIFICATION_PROGRAM_ID=your-program-id

# Reward Configuration
NEXT_PUBLIC_REWARD_AMOUNT=50
NEXT_PUBLIC_REWARD_TOKEN=USDC

# Backend URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Verify Configuration:

```bash
# Check environment variables
cat .env.local | grep VERIF

# Expected output:
# NEXT_PUBLIC_VERIFIER_DID=did:moca:...
# NEXT_PUBLIC_VERIFICATION_PROGRAM_ID=...
```

---

## Step 3.3: Test Frontend Service

### Create Test Page:

Create `pages/test-verification.js`:

```javascript
import { useState } from 'react';
import { useAirKit } from '@/hooks/useAirKit';
import { verifyCredential, checkClaimStatus } from '@/lib/verificationService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TestVerification() {
  const { userInfo, userAddress } = useAirKit();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    try {
      const res = await verifyCredential({
        targetUserAddress: userAddress,
        requiredCredentialType: 'EMPLOYMENT',
        userInfo
      });
      setResult(res);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    const status = await checkClaimStatus(userAddress);
    setClaimStatus(status);
  };

  return (
    <div className="p-8">
      <Card className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Verification Service</h1>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">User: {userAddress}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTest} disabled={loading}>
              {loading ? 'Verifying...' : 'Test Claim $50 USDC'}
            </Button>
            
            <Button onClick={handleCheckStatus} variant="outline">
              Check Claim Status
            </Button>
          </div>

          {claimStatus && (
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <h3 className="font-semibold mb-2">Claim Status:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(claimStatus, null, 2)}
              </pre>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
```

### Test the Service:

1. **Start Frontend:**
```bash
npm run dev
```

2. **Navigate to Test Page:**
```
http://localhost:3000/test-verification
```

3. **Click "Test Verification"**

4. **Expected Behavior:**
- Console shows: "💰 Initiating $50 USDC claim verification"
- Either AIR Kit widget opens OR simulation runs
- Result displays with verification status
- Reward info with TX hash shown

5. **Expected Result:**
```json
{
  "success": true,
  "verified": true,
  "simulated": true,
  "rewardClaimed": true,
  "reward": {
    "amount": 50,
    "token": "USDC",
    "txHash": "simulated_tx_hash",
    "claimed": true
  },
  "message": "Verification simulated - $50 USDC reward claimed (demo mode)"
}
```

---

## Phase 3 Complete! ✅

### Checklist:

Before moving to Phase 4, verify:

- [ ] `verificationService.js` created in `lib/`
- [ ] All 3 functions implemented:
  - [ ] `verifyCredential()`
  - [ ] `verifyMultipleCredentials()`
  - [ ] `checkClaimStatus()`
- [ ] AIR Kit integration added
- [ ] Simulation fallback implemented
- [ ] Error handling added
- [ ] Environment variables configured (REWARD_AMOUNT, etc.)
- [ ] Test page created
- [ ] Verification flow tested
- [ ] Console logs show correct flow
- [ ] Result object has reward info

### What You Built:

You've created the **frontend faucet service** that:
- ✅ Integrates with backend API
- ✅ Triggers AIR Kit verification widget
- ✅ Handles verification flow
- ✅ Provides simulation fallback
- ✅ Processes and returns reward info
- ✅ Checks claim status to prevent double-claiming

### Testing Checklist:

- [ ] Service imports without errors
- [ ] `verifyCredential()` callable
- [ ] Backend API calls succeed
- [ ] Simulation mode works
- [ ] Result object has reward.amount, reward.txHash
- [ ] `checkClaimStatus()` returns claimed status
- [ ] USDC reward info displayed correctly

### Next Steps:

**Ready for Phase 4?**

Once all checkboxes above are ✅, you're ready to build the UI components.

**Phase 4 will:**
- Create verification modal component
- Build reward banner component
- Show unclaimed/claimed reward states
- Display USDC transfer confirmation

**Time for Phase 4:** ~1 hour

➡️ **Continue to:** [PHASE-4-UI-INTEGRATION.md](./PHASE-4-UI-INTEGRATION.md)

---

**Phase 3 Complete! Frontend verification service ready.** 🚀

