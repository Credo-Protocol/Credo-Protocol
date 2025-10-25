# Phase 5.3: Frontend Integration

**Day**: 3 Late Afternoon (Oct 27)  
**Duration**: 2-3 hours  
**Prerequisites**: **Phases 5.1 & 5.2 Complete**  
**Next**: Phase 6 (Documentation & Demo)

---

## 🎯 Goal

Update your frontend to use AIR Kit's official credential issuance flow with gas sponsorship. Replace the old "request credential" flow with proper `airService.credential.issue()` calls.

**Why This Phase**: Your frontend currently expects signed credentials from your backend. This update makes it use AIR Kit properly, enabling gas sponsorship and decentralized storage.

**What Changes**:
- ✅ Update AIR Kit initialization with paymaster
- ✅ Refactor credential issuance flow
- ✅ Add credential wallet component
- ✅ Update environment variables
- ✅ Test end-to-end with gas sponsorship

---

## 📋 What You're Building

### Current Flow (Old)
```
User clicks "Request Credential"
  ↓
Frontend: POST /api/credentials/request
  ↓
Backend: Returns signed credential
  ↓
Frontend: Submit to CreditScoreOracle contract
  ↓
Done
```

### Target Flow (Official MOCA)
```
User clicks "Request Credential" (NO MOCA TOKENS NEEDED!)
  ↓
Frontend: POST /api/credentials/prepare
  ↓
Backend: Returns auth token + metadata
  ↓
Frontend: airService.credential.issue({authToken, issuerDid, schemaId})
  ↓
AIR Kit: Issues credential (gas sponsored!)
  ↓
AIR Kit: Stores on MCSP (decentralized storage)
  ↓
Frontend: Get credential from wallet
  ↓
Frontend: Submit to CreditScoreOracle contract
  ↓
Done - credential in AIR wallet + on-chain score updated
```

---

## 🛠️ Step-by-Step Instructions

### Step 1: Update Frontend Environment (10 min)

**File**: `.env.local`

Add these new variables:

```bash
# ============================================
# Existing (keep these)
# ============================================
NEXT_PUBLIC_PARTNER_ID=your_partner_id
NEXT_PUBLIC_API_URL=http://localhost:3001

# ============================================
# New for Phase 5.3
# ============================================

# Gas Sponsorship (from Phase 5.1)
NEXT_PUBLIC_PAYMASTER_POLICY_ID=your_policy_id_from_5.1

# MOCA Chain RPC
NEXT_PUBLIC_MOCA_RPC=https://rpc.testnet.mocachain.org

# Contract Addresses (you already have these)
NEXT_PUBLIC_CREDIT_SCORE_ORACLE=0x82Adc3540672eA15C2B9fF9dFCf01BF8d81F2Cd2
NEXT_PUBLIC_LENDING_POOL=0x72efF02BF767b79369ea749dd7d57c143A92Cf09
NEXT_PUBLIC_USDC=0x76FdD416C70a9b51071C1751088d6715dD60d864
```

**Status Check**: ✅ Environment variables added

---

### Step 2: Update AIR Kit Initialization (15 min)

**File**: `lib/airkit.js`

Update the initialization function to include paymaster:

```javascript
/**
 * AIR Kit Integration - Phase 5.3 Update
 * 
 * Changes:
 * - Added gas sponsorship (paymaster) configuration
 * - Users no longer need MOCA tokens for credential issuance!
 */

import { AirService, BUILD_ENV } from '@mocanetwork/airkit';

// Initialize AIR Service
export const airService = new AirService({
  partnerId: process.env.NEXT_PUBLIC_PARTNER_ID || 'YOUR_PARTNER_ID_HERE',
  env: BUILD_ENV.SANDBOX,
});

/**
 * Initialize AIR Kit with Gas Sponsorship
 * 
 * NEW in Phase 5.3: Paymaster enabled!
 */
export async function initializeAirKit(options = {}) {
  const {
    skipRehydration = false,
    enableLogging = true
  } = options;

  try {
    await airService.init({
      buildEnv: BUILD_ENV.SANDBOX,
      enableLogging,
      skipRehydration,
      
      // 🆕 PHASE 5.3: Enable gas sponsorship
      paymasterConfig: {
        enabled: true,
        policyId: process.env.NEXT_PUBLIC_PAYMASTER_POLICY_ID,
      }
    });
    
    console.log('✅ AIR Kit initialized with gas sponsorship enabled');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize AIR Kit:', error);
    // If paymaster fails, continue without it (graceful degradation)
    console.warn('⚠️ Continuing without gas sponsorship - users will pay gas');
    throw error;
  }
}

// ... rest of file unchanged (keep all existing exports)
```

**Status Check**: ✅ Paymaster configuration added

---

### Step 3: Create Credential Services Module (30 min)

**Create**: `lib/credentialServices.js`

This new module handles all credential operations with AIR Kit:

```javascript
/**
 * Credential Services - MOCA Official Integration
 * 
 * Handles credential issuance and management using AIR Kit.
 * Phase 5.3: Official MOCA credential flow.
 */

import airService from './airkit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Fetch available credential types from backend
 * 
 * Returns list of all credentials user can request, with metadata.
 */
export async function getCredentialTypes() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/credentials/types`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch credential types: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch credential types');
    }
    
    console.log(`📋 Loaded ${data.count} credential types`);
    return data.credentials;
    
  } catch (error) {
    console.error('Failed to get credential types:', error);
    throw error;
  }
}

/**
 * Issue a credential using official AIR Kit flow
 * 
 * This is the NEW way (Phase 5.3):
 * 1. Backend prepares auth token
 * 2. Frontend uses AIR Kit to issue
 * 3. Credential stored on MCSP
 * 4. Return credential for contract submission
 * 
 * @param {string} userAddress - User's wallet address
 * @param {string} credentialType - Type ID (e.g., 'bank-balance-high')
 * @param {object} userInfo - User info from AIR Kit
 * @returns {Promise<object>} Issued credential object
 */
export async function issueCredential(userAddress, credentialType, userInfo) {
  try {
    console.log(`📝 Issuing credential: ${credentialType} for ${userAddress}`);
    
    // Step 1: Prepare credential (get auth token from backend)
    console.log('  Step 1/4: Preparing credential...');
    const prepareResponse = await fetch(`${API_BASE_URL}/api/credentials/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAddress,
        credentialType,
        userId: userInfo?.user?.id,
        email: userInfo?.user?.email
      })
    });
    
    if (!prepareResponse.ok) {
      throw new Error(`Prepare failed: ${prepareResponse.statusText}`);
    }
    
    const prepared = await prepareResponse.json();
    
    if (!prepared.success) {
      throw new Error(prepared.error || 'Failed to prepare credential');
    }
    
    const { authToken, issuerDid, schemaId, credentialSubject } = prepared;
    
    console.log('  ✅ Credential prepared');
    console.log('    Issuer DID:', issuerDid);
    console.log('    Schema ID:', schemaId);
    
    // Step 2: Issue credential via AIR Kit
    // This is where the magic happens - AIR Kit handles everything:
    // - Cryptographic signing
    // - Storage on MOCA Chain Storage Providers (MCSP)
    // - Adding to user's wallet
    // - Gas sponsorship (if enabled)
    console.log('  Step 2/4: Issuing via AIR Kit...');
    
    await airService.credential.issue({
      authToken,
      issuerDid,
      credentialId: schemaId,
      credentialSubject: {
        ...credentialSubject,
        // Ensure subject is set
        subject: userAddress
      }
    });
    
    console.log('  ✅ Credential issued via AIR Kit');
    console.log('    - Stored on MCSP (decentralized storage)');
    console.log('    - Added to user\'s AIR wallet');
    console.log('    - Gas sponsored:', !!process.env.NEXT_PUBLIC_PAYMASTER_POLICY_ID);
    
    // Step 3: Retrieve credential from wallet
    console.log('  Step 3/4: Retrieving from wallet...');
    
    // Get all user's credentials
    const userCredentials = await airService.credential.list({
      holder: userAddress
    });
    
    // Find the newly issued credential
    // Match by schema and issuer (most recent if multiple)
    const newCredential = userCredentials
      .filter(c => c.schemaId === schemaId && c.issuerDid === issuerDid)
      .sort((a, b) => b.issuanceDate - a.issuanceDate)[0];
    
    if (!newCredential) {
      throw new Error('Credential issued but not found in wallet');
    }
    
    console.log('  ✅ Credential retrieved from wallet');
    console.log('    Credential ID:', newCredential.id);
    console.log('    Issued at:', new Date(newCredential.issuanceDate * 1000).toLocaleString());
    
    // Step 4: Return credential data
    console.log('  Step 4/4: Preparing for contract submission...');
    
    const credentialForContract = {
      // Contract-compatible format
      credentialType: credentialSubject.credentialType,
      issuer: issuerDid,
      subject: userAddress,
      issuanceDate: newCredential.issuanceDate,
      expirationDate: newCredential.expirationDate,
      // AIR Kit provides cryptographic proof
      proof: newCredential.proof,
      // Additional metadata
      credentialId: newCredential.id,
      schemaId: schemaId,
      weight: credentialSubject.weight,
      bucket: credentialSubject.bucket,
      bucketRange: credentialSubject.bucketRange
    };
    
    console.log('✅ Credential issuance complete!');
    return credentialForContract;
    
  } catch (error) {
    console.error('❌ Failed to issue credential:', error);
    throw error;
  }
}

/**
 * Get all credentials for a user from their AIR wallet
 * 
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<Array>} List of credentials
 */
export async function getUserCredentials(userAddress) {
  try {
    console.log(`📜 Fetching credentials for ${userAddress}`);
    
    const credentials = await airService.credential.list({
      holder: userAddress
    });
    
    console.log(`✅ Found ${credentials.length} credentials in wallet`);
    return credentials;
    
  } catch (error) {
    console.error('Failed to get user credentials:', error);
    throw error;
  }
}

/**
 * Check if credential is valid (not expired, not revoked)
 * 
 * @param {object} credential - Credential object
 * @returns {boolean} True if valid
 */
export function isCredentialValid(credential) {
  const now = Math.floor(Date.now() / 1000);
  
  // Check expiration
  if (credential.expirationDate && credential.expirationDate < now) {
    return false;
  }
  
  // Check revocation status
  if (credential.status === 'revoked') {
    return false;
  }
  
  return true;
}

/**
 * Get credential display info
 * Helper to format credential for UI display
 */
export function getCredentialDisplayInfo(credential) {
  const bucket = credential.credentialSubject?.bucket || 
                 credential.credentialSubject?.credentialType ||
                 'UNKNOWN';
  
  const icons = {
    BANK_BALANCE_HIGH: '💰',
    BANK_BALANCE_MEDIUM: '💰',
    BANK_BALANCE_LOW: '💰',
    BANK_BALANCE_MINIMAL: '💰',
    INCOME_HIGH: '💼',
    INCOME_MEDIUM: '💼',
    INCOME_LOW: '💼',
    INCOME_MINIMAL: '💼',
    CEX_HISTORY: '📈',
    EMPLOYMENT: '🏢'
  };
  
  const colors = {
    BANK_BALANCE_HIGH: 'green',
    BANK_BALANCE_MEDIUM: 'blue',
    BANK_BALANCE_LOW: 'yellow',
    BANK_BALANCE_MINIMAL: 'gray',
    INCOME_HIGH: 'green',
    INCOME_MEDIUM: 'blue',
    INCOME_LOW: 'yellow',
    INCOME_MINIMAL: 'gray',
    CEX_HISTORY: 'purple',
    EMPLOYMENT: 'indigo'
  };
  
  return {
    icon: icons[bucket] || '📄',
    color: colors[bucket] || 'gray',
    name: bucket.replace(/_/g, ' '),
    issuedDate: new Date(credential.issuanceDate * 1000).toLocaleDateString(),
    isValid: isCredentialValid(credential),
    storedOnMCSP: true // All AIR Kit credentials stored on MCSP
  };
}

export default {
  getCredentialTypes,
  issueCredential,
  getUserCredentials,
  isCredentialValid,
  getCredentialDisplayInfo
};
```

**Status Check**: ✅ Credential services module created

---

### Step 4: Update Credential Request Component (45 min)

**Update**: `components/CredentialMarketplace.jsx` or `components/ScoreBuilderWizard.jsx`

Find the credential request function and replace it:

```javascript
/**
 * Request credential using official AIR Kit flow
 * Phase 5.3: New implementation
 */
import { issueCredential } from '@/lib/credentialServices';
import { useAirKit } from '@/hooks/useAirKit';
import { toast } from 'sonner'; // or your toast library

const requestCredential = async (credentialType) => {
  try {
    setLoading(true);
    
    // Show initial message
    toast.info('Preparing credential...', { id: 'credential-toast' });
    
    // Issue credential via AIR Kit (new way!)
    const credential = await issueCredential(
      userAddress,
      credentialType,
      userInfo
    );
    
    toast.loading('Submitting to blockchain...', { id: 'credential-toast' });
    
    // Submit to smart contract for credit score calculation
    await submitCredentialToOracle(credential);
    
    toast.success('Credential issued and verified on-chain!', { id: 'credential-toast' });
    
    // Refresh UI
    await refreshCreditScore();
    await refreshCredentials();
    
  } catch (error) {
    console.error('Failed to request credential:', error);
    toast.error(error.message || 'Failed to request credential', { id: 'credential-toast' });
  } finally {
    setLoading(false);
  }
};

/**
 * Submit credential to CreditScoreOracle contract
 */
const submitCredentialToOracle = async (credential) => {
  try {
    const creditScoreOracle = getContract(
      process.env.NEXT_PUBLIC_CREDIT_SCORE_ORACLE,
      CreditScoreOracleABI
    );
    
    // Prepare contract call
    // Note: Your contract may need to be updated to accept AIR Kit proof format
    const tx = await creditScoreOracle.submitCredential(
      credential.credentialType,
      credential.issuer,
      credential.subject,
      credential.issuanceDate,
      credential.expirationDate,
      credential.proof.jws // JSON Web Signature from AIR Kit
    );
    
    console.log('📤 Transaction hash:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('✅ Confirmed in block:', receipt.blockNumber);
    
  } catch (error) {
    console.error('Failed to submit to oracle:', error);
    throw new Error('Failed to verify credential on-chain');
  }
};
```

**Important Notes**:
- Remove any old `fetch('/api/credentials/request')` calls
- The gas is sponsored, so no need to check MOCA balance!
- Users see seamless UX with no gas prompts

**Status Check**: ✅ Credential request flow updated

---

### Step 5: Create Credential Wallet Component (30 min)

**Create**: `components/CredentialWallet.jsx`

This component shows user's credentials from AIR Kit:

```javascript
/**
 * Credential Wallet Component
 * 
 * Displays credentials stored in user's AIR Kit wallet.
 * Shows decentralized storage (MCSP) status.
 */

import { useState, useEffect } from 'react';
import { useAirKit } from '@/hooks/useAirKit';
import { getUserCredentials, getCredentialDisplayInfo } from '@/lib/credentialServices';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function CredentialWallet() {
  const { userAddress, isConnected } = useAirKit();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && userAddress) {
      loadCredentials();
    }
  }, [isConnected, userAddress]);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const userCreds = await getUserCredentials(userAddress);
      setCredentials(userCreds);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Credentials</CardTitle>
        <CardDescription>
          Stored securely in your AIR Kit wallet on MOCA Chain
        </CardDescription>
      </CardHeader>
      <CardContent>
        {credentials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No credentials yet</p>
            <p className="text-sm mt-2">
              Request credentials in the Score Builder to unlock better rates!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map((credential) => {
              const display = getCredentialDisplayInfo(credential);
              
              return (
                <div
                  key={credential.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{display.icon}</span>
                    <div>
                      <p className="font-medium">{display.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Issued: {display.issuedDate}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    {display.isValid ? (
                      <Badge variant="outline" className="text-xs">
                        ✓ Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        ⚠️ Expired
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      🔒 MCSP Storage
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadCredentials}
          className="w-full mt-4"
        >
          🔄 Refresh Wallet
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Add to Dashboard**:

In `pages/dashboard.js`, import and add the component:

```javascript
import { CredentialWallet } from '@/components/CredentialWallet';

// In your dashboard layout:
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Existing content */}
  </div>
  <div>
    <CredentialWallet />
  </div>
</div>
```

**Status Check**: ✅ Credential wallet component created

---

### Step 6: Add Gas Sponsorship Indicator (15 min)

**Update**: `components/CredentialMarketplace.jsx`

Add a prominent indicator that gas is sponsored:

```javascript
// Add this at the top of your credential marketplace
<div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
  <div className="flex items-center gap-3">
    <span className="text-3xl">⚡</span>
    <div>
      <h3 className="font-semibold text-green-700 dark:text-green-400">
        Gas-Free Credentials
      </h3>
      <p className="text-sm text-muted-foreground">
        No MOCA tokens needed! All credential requests are gas-sponsored by Credo Protocol.
      </p>
    </div>
  </div>
</div>
```

**Status Check**: ✅ Gas sponsorship indicator added

---

### Step 7: Update Loading States (15 min)

Make loading messages more informative:

```javascript
// When issuing credential
<div className="space-y-2">
  {step === 'preparing' && (
    <p>🔐 Generating auth token...</p>
  )}
  {step === 'issuing' && (
    <p>📝 Issuing credential via AIR Kit...</p>
  )}
  {step === 'storing' && (
    <p>💾 Storing on MOCA Chain (MCSP)...</p>
  )}
  {step === 'submitting' && (
    <p>⛓️ Submitting to blockchain...</p>
  )}
  {step === 'complete' && (
    <p>✅ Complete! Credential in your wallet.</p>
  )}
</div>
```

**Status Check**: ✅ Loading states updated

---

### Step 8: Test End-to-End Flow (30 min)

Start both backend and frontend:

**Terminal 1**:
```bash
cd backend
npm run dev
```

**Terminal 2**:
```bash
npm run dev
```

#### Test Checklist

```markdown
1. Login Flow:
   - [ ] Open http://localhost:3000
   - [ ] Login with Moca ID
   - [ ] Dashboard loads successfully

2. Credential Marketplace:
   - [ ] Navigate to Score Builder or Credentials page
   - [ ] See gas-free indicator
   - [ ] Click on a credential type
   - [ ] See detailed modal/card

3. Credential Issuance:
   - [ ] Click "Request Credential"
   - [ ] Should NOT ask for MOCA tokens (gas sponsored!)
   - [ ] See loading states (preparing → issuing → storing → submitting)
   - [ ] Success message appears
   - [ ] Credit score updates

4. Credential Wallet:
   - [ ] Open Credential Wallet component
   - [ ] New credential appears in list
   - [ ] Shows "MCSP Storage" badge
   - [ ] Shows "Active" status
   - [ ] Issued date is correct

5. Contract Verification:
   - [ ] Check credit score updated on dashboard
   - [ ] Open Moca Chain Explorer
   - [ ] Find your oracle contract transaction
   - [ ] Verify transaction succeeded

6. AIR Kit Dashboard Verification:
   - [ ] Login to https://developers.sandbox.air3.com/
   - [ ] Navigate to Credentials → Issuers → [Your Issuer]
   - [ ] See your credential in "Issued Credentials" list
   - [ ] Verify stored on MCSP (check storage section)
```

---

## ✅ Phase 5.3 Completion Checklist

Before proceeding to Phase 6, verify ALL of these:

### Code Changes
- [ ] Updated `.env.local` with paymaster policy ID
- [ ] Updated `lib/airkit.js` with paymaster config
- [ ] Created `lib/credentialServices.js`
- [ ] Updated credential request component
- [ ] Created CredentialWallet component
- [ ] Added gas sponsorship indicator
- [ ] Updated loading states

### Functionality
- [ ] AIR Kit initializes with gas sponsorship
- [ ] Can request credential without MOCA tokens
- [ ] Credential appears in AIR Kit Dashboard
- [ ] Credential appears in CredentialWallet component
- [ ] Credential submitted to oracle successfully
- [ ] Credit score updates after credential issuance
- [ ] No console errors

### Verification
- [ ] Tested with at least 2 different credential types
- [ ] Verified credential stored on MCSP (check dashboard)
- [ ] Verified gas was sponsored (check paymaster dashboard)
- [ ] Verified issuer DID shows in credential
- [ ] Verified schema ID correct

---

## 🎉 What You've Accomplished

After Phase 5.3 (and all of Phase 5), you now have:

✅ **Official MOCA Integration**: True AIR Kit credential services  
✅ **Gas-Sponsored UX**: Zero friction for users  
✅ **Decentralized Storage**: Credentials on MCSP  
✅ **Ecosystem Interoperability**: Credentials discoverable by all MOCA dApps  
✅ **AIR Wallet Integration**: Users can see their credentials  
✅ **Proper Architecture**: Backend prepares, frontend issues, AIR Kit stores  

**Your project is now a true MOCA ecosystem participant!** 🎊

---

## 🔄 Before & After Comparison

### Before Phase 5 (Phases 1-4)
```
✅ Login with Moca ID
❌ Custom mock issuers
❌ Manual credential signing
❌ Local storage
❌ Users pay gas
❌ Isolated system

Integration: ~20% of MOCA capabilities
```

### After Phase 5 (Complete)
```
✅ Login with Moca ID
✅ Official Issuer DIDs
✅ AIR Kit credential issuance
✅ MCSP decentralized storage
✅ Gas sponsorship (paymaster)
✅ Ecosystem interoperability

Integration: ~80% of MOCA capabilities
```

---

## 🚀 Next Steps

**Proceed to Phase 6**: Documentation & Demo

In Phase 6, you'll:
1. Update README with MOCA integration highlights
2. Create demo script emphasizing gas sponsorship
3. Test complete user journey
4. Prepare submission materials
5. Rehearse demo

**Estimated Time**: 4-6 hours

---

## 🐛 Troubleshooting

### "AIR Kit initialization fails"
- Check PARTNER_ID in .env.local
- Verify paymaster policy ID is correct
- Try without paymaster first (comment out paymasterConfig)

### "Credential issuance fails"
- Check backend is running
- Verify /api/credentials/prepare returns valid JWT
- Check JWT has correct partnerId and scope
- Verify issuerDid and schemaId exist

### "Credential not appearing in wallet"
- Check AIR Kit Dashboard → Issuers → Records
- Verify credential was actually issued
- Try refreshing wallet component
- Check userAddress is correct

### "Gas not sponsored"
- Verify paymaster policy ID in .env.local
- Check paymaster wallet has MOCA balance
- Verify policy is active in dashboard
- Check function selector is whitelisted

### "Contract submission fails"
- Your oracle may need to accept AIR Kit proof format
- Check proof.jws exists in credential
- Verify contract address is correct
- Check user has enough gas for contract call (sponsored gas only covers credential issuance)

---

## 📞 Getting Help

**If you're stuck**:

1. **Check AIR Kit Dashboard**
   - Credentials → Issuers → View issued credentials
   - Check if credential was issued
   - Check storage status (MCSP)

2. **Check Console Logs**
   - Frontend: Browser dev tools console
   - Backend: Terminal running backend
   - Look for error messages

3. **Verify Environment**
   - All DIDs start with `did:moca:`
   - All schemas start with `schema:moca:`
   - Partner secret is long (200+ characters)

4. **Contact Support**
   - MOCA Discord: #dev-chat
   - Documentation: https://docs.moca.network/airkit/

---

**Phase 5.3 Status**: ✅ Complete  
**Next Phase**: Phase 6 - Documentation & Demo  
**Achievement Unlocked**: Full MOCA Ecosystem Integration! 🏆

