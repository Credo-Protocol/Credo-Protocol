# Phase 5: MOCA Official Infrastructure Migration

**Day**: 3 Afternoon (Oct 27)  
**Duration**: 6-8 hours  
**Prerequisites**: Phases 1-4 Complete  
**Next**: Phase 6 (Documentation & Demo)

---

## 🎯 Goal

Migrate from custom credential infrastructure to **MOCA's official AIR Kit credential services**. Replace mock issuers with proper Issuer DIDs, implement official verification flow, and enable gas sponsorship for seamless UX.

**Why This Phase**: Your current implementation bypasses MOCA's credential ecosystem. This migration makes your credentials:
- ✅ Interoperable with other MOCA dApps
- ✅ Stored in decentralized storage (MCSP)
- ✅ Verifiable by third parties
- ✅ Discoverable via MOCA's credential registry
- ✅ Eligible for gas sponsorship

**Critical**: Without this migration, your project doesn't truly integrate with MOCA Network - it just uses MOCA for login.

---

## 📋 What You're Migrating

### Current Architecture (Wave 2-3)
```
❌ Custom Express backend with mock issuers
❌ Manual EIP-191 signature generation
❌ Credentials stored locally/centrally
❌ No issuer reputation/trust scoring
❌ Not discoverable by other dApps
❌ Users need MOCA tokens for every transaction
```

### Target Architecture (Official MOCA)
```
✅ AIR Kit Developer Dashboard for issuer management
✅ Official Issuer DIDs for each credential type
✅ Credentials stored on MOCA Chain Storage Providers (MCSP)
✅ Integrated with MOCA's trust registry
✅ Public schema registry for discovery
✅ Gas sponsorship for credential issuance
```

---

## 🗺️ Migration Roadmap

### Part A: AIR Kit Dashboard Setup (2 hours)
1. Register as Issuer (3 separate DIDs)
2. Register as Verifier
3. Create credential schemas
4. Configure gas sponsorship
5. Generate Partner secrets

### Part B: Backend Refactor (2-3 hours)
1. Add Partner JWT generation
2. Replace mock issuers with schema metadata endpoints
3. Add credential preparation endpoints
4. Remove manual signature generation

### Part C: Frontend Integration (2-3 hours)
1. Update credential issuance flow
2. Update credential verification flow
3. Add gas sponsorship config
4. Update credential display

---

## 🛠️ Part A: AIR Kit Dashboard Setup

### Step 1: Access Developer Dashboard (5 min)

**URL**: [https://developers.sandbox.air3.com/](https://developers.sandbox.air3.com/)

1. Login with your existing Moca ID
2. Navigate to your partner account
3. Note your **Partner ID** (you already have this in `.env.local`)

**Save these credentials**:
```bash
PARTNER_ID=[from dashboard]
PARTNER_SECRET=[will generate in next steps]
```

---

### Step 2: Register as Issuer (45 min)

**Dashboard Path**: Credentials → Issuers → Create Issuer

You need **3 separate Issuer DIDs** (one per credential category):

#### Issuer 1: Bank Balance Issuer

**Configuration**:
```yaml
Issuer Name: Credo Bank Balance Issuer
Description: Issues privacy-preserving bank balance credentials in 4 bucketed ranges
Category: Financial
Trust Level: Verified (request after testing)
Logo: Upload bank icon
Website: https://credo-protocol.vercel.app
Contact: your@email.com
```

**Steps**:
1. Click "Create New Issuer"
2. Fill in details above
3. Submit and wait for DID generation
4. **Copy Issuer DID** → Save as `BANK_ISSUER_DID`
5. Top up Fee Wallet with 100 test MOCA (for gas)

**Save**:
```bash
BANK_ISSUER_DID=did:moca:...[your-generated-did]
```

#### Issuer 2: Employment Issuer

**Configuration**:
```yaml
Issuer Name: Credo Employment Issuer
Description: Issues income range credentials without revealing exact salary
Category: Employment
Trust Level: Verified
Logo: Upload work icon
Website: https://credo-protocol.vercel.app
Contact: your@email.com
```

**Steps**: Same as above

**Save**:
```bash
EMPLOYMENT_ISSUER_DID=did:moca:...[your-generated-did]
```

#### Issuer 3: CEX History Issuer

**Configuration**:
```yaml
Issuer Name: Credo CEX History Issuer
Description: Issues exchange trading history credentials
Category: Financial
Trust Level: Verified
Logo: Upload exchange icon
Website: https://credo-protocol.vercel.app
Contact: your@email.com
```

**Steps**: Same as above

**Save**:
```bash
CEX_ISSUER_DID=did:moca:...[your-generated-did]
```

---

### Step 3: Register as Verifier (30 min)

**Dashboard Path**: Credentials → Verifiers → Create Verifier

**Configuration**:
```yaml
Verifier Name: Credo Protocol
Description: Verifies credentials for credit score calculation
Purpose: Undercollateralized Lending
Verification Policy: Automated on-chain verification
Logo: Upload Credo logo
Website: https://credo-protocol.vercel.app
```

**Steps**:
1. Click "Create New Verifier"
2. Fill in details
3. Submit and get Verifier DID
4. Top up Verifier Fee Wallet with 100 test MOCA

**Save**:
```bash
VERIFIER_DID=did:moca:...[your-generated-did]
```

---

### Step 4: Create Credential Schemas (45 min)

**Dashboard Path**: Credentials → Schemas → Create Schema

You need **10 schemas** (matching your bucketed credentials):

#### Schema Template

```json
{
  "schemaName": "Credo Bank Balance - High",
  "schemaVersion": "1.0.0",
  "schemaDescription": "Proves 30-day average bank balance of $10,000 or more without revealing exact amount",
  "schemaType": "BankBalance",
  "privacyLevel": "Bucketed",
  "credentialSubject": {
    "type": "object",
    "properties": {
      "balanceBucket": {
        "type": "string",
        "enum": ["BANK_BALANCE_HIGH"],
        "description": "Balance bucket classification"
      },
      "bucketRange": {
        "type": "string",
        "const": "$10,000+",
        "description": "Human-readable range"
      },
      "verifiedAt": {
        "type": "integer",
        "description": "Timestamp of verification"
      },
      "dataSource": {
        "type": "string",
        "const": "Plaid API",
        "description": "Source of financial data"
      },
      "period": {
        "type": "string",
        "const": "30 days",
        "description": "Averaging period"
      }
    },
    "required": ["balanceBucket", "bucketRange", "verifiedAt"]
  }
}
```

**Create these 10 schemas**:

1. **BANK_BALANCE_HIGH** - $10k+ (weight: 150)
2. **BANK_BALANCE_MEDIUM** - $5k-$10k (weight: 120)
3. **BANK_BALANCE_LOW** - $1k-$5k (weight: 80)
4. **BANK_BALANCE_MINIMAL** - <$1k (weight: 40)
5. **INCOME_HIGH** - $8k+/month (weight: 180)
6. **INCOME_MEDIUM** - $5k-$8k/month (weight: 140)
7. **INCOME_LOW** - $3k-$5k/month (weight: 100)
8. **INCOME_MINIMAL** - <$3k/month (weight: 50)
9. **CEX_HISTORY** - Exchange trading history (weight: 80)
10. **EMPLOYMENT** - Proof of employment (weight: 70)

**For each schema**:
1. Click "Create Schema"
2. Paste modified template
3. Assign to appropriate Issuer DID
4. Submit and get Schema ID
5. Save Schema ID

**Save all Schema IDs**:
```bash
SCHEMA_BANK_HIGH=schema:moca:...[id]
SCHEMA_BANK_MEDIUM=schema:moca:...[id]
SCHEMA_BANK_LOW=schema:moca:...[id]
SCHEMA_BANK_MINIMAL=schema:moca:...[id]
SCHEMA_INCOME_HIGH=schema:moca:...[id]
SCHEMA_INCOME_MEDIUM=schema:moca:...[id]
SCHEMA_INCOME_LOW=schema:moca:...[id]
SCHEMA_INCOME_MINIMAL=schema:moca:...[id]
SCHEMA_CEX_HISTORY=schema:moca:...[id]
SCHEMA_EMPLOYMENT=schema:moca:...[id]
```

---

### Step 5: Create Verifier Programs (30 min)

**Dashboard Path**: Credentials → Verifier Programs → Create Program

Create 10 verifier programs (one per schema):

**Program Template**:
```yaml
Program Name: Verify Bank Balance High
Description: Verify high balance bucket for credit scoring
Associated Schema: [Select SCHEMA_BANK_HIGH]
Verification Rules:
  - Check credential validity
  - Check issuer reputation
  - Check expiration date
  - Check subject matches requester
Acceptance Criteria:
  - Issuer must be trusted
  - Credential must not be revoked
  - Credential must not be expired
```

**For each schema**, create a matching verifier program.

**Save Program IDs**:
```bash
VERIFIER_PROGRAM_BANK_HIGH=[program-id]
VERIFIER_PROGRAM_BANK_MEDIUM=[program-id]
# ... etc for all 10
```

---

### Step 6: Configure Gas Sponsorship (30 min)

**Dashboard Path**: Settings → Gas Sponsorship → Configure

**Enable Paymaster**:
```yaml
Paymaster Status: Enabled
Sponsor Credential Issuance: YES
Sponsor Credential Verification: YES
Sponsor First Transaction: YES

Spending Limits:
  Global Limit: 1000 MOCA/month
  Per-User Limit: 10 MOCA/month
  Per-Transaction Limit: 0.5 MOCA

Allowlist (Function Selectors):
  - submitCredential() [your oracle contract]
  - All AIR Kit credential functions

Policy Schedule:
  Start: Immediately
  End: No end date
```

**Steps**:
1. Contact MOCA support to enable paymaster for your partner account
2. Once enabled, configure policies in dashboard
3. Top up Paymaster wallet with 500 test MOCA
4. Test with small transaction

**Note**: Contact MOCA support via Discord dev-chat channel if paymaster not available.

---

### Step 7: Generate Partner Secret (15 min)

**Dashboard Path**: Settings → API Keys → Generate Secret

**Configuration**:
```yaml
Secret Name: Backend JWT Signing Key
Scope: issue, verify
Expiration: No expiration
IP Whitelist: [optional - leave empty for testing]
```

**Steps**:
1. Click "Generate Secret"
2. **COPY IMMEDIATELY** (shown only once)
3. Save to backend `.env`

**Save**:
```bash
PARTNER_SECRET=[generated-secret-key]
```

---

## 🛠️ Part B: Backend Refactor

### Step 8: Add Partner JWT Generation (45 min)

**Create**: `backend/src/auth/jwt.js`

```javascript
/**
 * Partner JWT Generation for AIR Kit Integration
 * 
 * Based on MOCA documentation:
 * https://docs.moca.network/airkit/usage/partner-authentication
 */

const jwt = require('jsonwebtoken');

/**
 * Generate Partner JWT for credential issuance
 * 
 * @param {string} userId - Your internal user ID
 * @param {string} email - User's email address
 * @param {string} scope - 'issue' or 'verify'
 * @param {number} expiresIn - Token lifetime in seconds (default: 1 hour)
 * @returns {string} Signed JWT token
 */
function generatePartnerJWT(userId, email, scope = 'issue', expiresIn = 3600) {
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    partnerId: process.env.PARTNER_ID,
    partnerUserId: userId,
    email: email,
    scope: scope, // 'issue' or 'verify'
    iat: now,
    exp: now + expiresIn
  };
  
  const token = jwt.sign(payload, process.env.PARTNER_SECRET, {
    algorithm: 'HS256'
  });
  
  console.log(`[JWT] Generated ${scope} token for user ${userId}`);
  return token;
}

/**
 * Verify Partner JWT (for debugging)
 */
function verifyPartnerJWT(token) {
  try {
    const decoded = jwt.verify(token, process.env.PARTNER_SECRET, {
      algorithms: ['HS256']
    });
    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

module.exports = {
  generatePartnerJWT,
  verifyPartnerJWT
};
```

---

### Step 9: Refactor Credential Routes (1 hour)

**Update**: `backend/src/routes/credentials.js`

Replace entire file with:

```javascript
/**
 * Credential API Routes - MOCA Official Integration
 * 
 * New approach:
 * - Backend prepares credential metadata
 * - Frontend uses AIR Kit to issue credentials
 * - No more manual signature generation
 */

const express = require('express');
const { generatePartnerJWT } = require('../auth/jwt');

const router = express.Router();

/**
 * Get available credential types with schemas
 * Returns metadata needed for AIR Kit integration
 */
router.get('/types', async (req, res) => {
  try {
    const credentialTypes = [
      // Bank Balance Credentials
      {
        id: 'bank-balance-high',
        name: 'Bank Balance - High ($10k+)',
        category: 'Financial',
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_HIGH,
        weight: 150,
        bucket: 'BANK_BALANCE_HIGH',
        range: '$10,000+',
        description: 'Proves 30-day average balance of $10k or more',
        privacyLevel: 'Bucketed - Exact amount not disclosed',
        icon: '💰',
        color: 'green'
      },
      {
        id: 'bank-balance-medium',
        name: 'Bank Balance - Medium ($5k-$10k)',
        category: 'Financial',
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_MEDIUM,
        weight: 120,
        bucket: 'BANK_BALANCE_MEDIUM',
        range: '$5,000 - $10,000',
        description: 'Proves 30-day average balance of $5k-$10k',
        privacyLevel: 'Bucketed',
        icon: '💰',
        color: 'blue'
      },
      {
        id: 'bank-balance-low',
        name: 'Bank Balance - Low ($1k-$5k)',
        category: 'Financial',
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_LOW,
        weight: 80,
        bucket: 'BANK_BALANCE_LOW',
        range: '$1,000 - $5,000',
        description: 'Proves 30-day average balance of $1k-$5k',
        privacyLevel: 'Bucketed',
        icon: '💰',
        color: 'yellow'
      },
      {
        id: 'bank-balance-minimal',
        name: 'Bank Balance - Minimal (<$1k)',
        category: 'Financial',
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_MINIMAL,
        weight: 40,
        bucket: 'BANK_BALANCE_MINIMAL',
        range: 'Under $1,000',
        description: 'Proves 30-day average balance under $1k',
        privacyLevel: 'Bucketed',
        icon: '💰',
        color: 'gray'
      },
      
      // Income Range Credentials
      {
        id: 'income-high',
        name: 'Income Range - High ($8k+/mo)',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_HIGH,
        weight: 180,
        bucket: 'INCOME_HIGH',
        range: '$8,000+ per month',
        description: 'Proves monthly income of $8k or more',
        privacyLevel: 'Bucketed - Exact salary not disclosed',
        icon: '💼',
        color: 'green'
      },
      {
        id: 'income-medium',
        name: 'Income Range - Medium ($5k-$8k/mo)',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_MEDIUM,
        weight: 140,
        bucket: 'INCOME_MEDIUM',
        range: '$5,000 - $8,000 per month',
        description: 'Proves monthly income of $5k-$8k',
        privacyLevel: 'Bucketed',
        icon: '💼',
        color: 'blue'
      },
      {
        id: 'income-low',
        name: 'Income Range - Low ($3k-$5k/mo)',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_LOW,
        weight: 100,
        bucket: 'INCOME_LOW',
        range: '$3,000 - $5,000 per month',
        description: 'Proves monthly income of $3k-$5k',
        privacyLevel: 'Bucketed',
        icon: '💼',
        color: 'yellow'
      },
      {
        id: 'income-minimal',
        name: 'Income Range - Minimal (<$3k/mo)',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_MINIMAL,
        weight: 50,
        bucket: 'INCOME_MINIMAL',
        range: 'Under $3,000 per month',
        description: 'Proves monthly income under $3k',
        privacyLevel: 'Bucketed',
        icon: '💼',
        color: 'gray'
      },
      
      // Legacy Credentials
      {
        id: 'cex-history',
        name: 'CEX Trading History',
        category: 'Financial',
        issuerDid: process.env.CEX_ISSUER_DID,
        schemaId: process.env.SCHEMA_CEX_HISTORY,
        weight: 80,
        bucket: 'CEX_HISTORY',
        description: 'Proves active trading history on centralized exchanges',
        privacyLevel: 'Metadata only',
        icon: '📈',
        color: 'purple'
      },
      {
        id: 'employment',
        name: 'Proof of Employment',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_EMPLOYMENT,
        weight: 70,
        bucket: 'EMPLOYMENT',
        description: 'Proves current employment status',
        privacyLevel: 'Basic verification',
        icon: '🏢',
        color: 'indigo'
      }
    ];
    
    res.json({
      success: true,
      credentials: credentialTypes
    });
  } catch (error) {
    console.error('[Credentials] Error fetching types:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Prepare credential issuance
 * Generates auth token for frontend to use with AIR Kit
 */
router.post('/prepare', async (req, res) => {
  try {
    const { userAddress, credentialType, userId, email } = req.body;
    
    if (!userAddress || !credentialType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, credentialType'
      });
    }
    
    // Find credential metadata
    const credentialTypes = {
      'bank-balance-high': {
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_HIGH,
        bucket: 'BANK_BALANCE_HIGH',
        range: '$10,000+'
      },
      'bank-balance-medium': {
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_MEDIUM,
        bucket: 'BANK_BALANCE_MEDIUM',
        range: '$5,000 - $10,000'
      },
      'bank-balance-low': {
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_LOW,
        bucket: 'BANK_BALANCE_LOW',
        range: '$1,000 - $5,000'
      },
      'bank-balance-minimal': {
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_MINIMAL,
        bucket: 'BANK_BALANCE_MINIMAL',
        range: 'Under $1,000'
      },
      'income-high': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_HIGH,
        bucket: 'INCOME_HIGH',
        range: '$8,000+ per month'
      },
      'income-medium': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_MEDIUM,
        bucket: 'INCOME_MEDIUM',
        range: '$5,000 - $8,000 per month'
      },
      'income-low': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_LOW,
        bucket: 'INCOME_LOW',
        range: '$3,000 - $5,000 per month'
      },
      'income-minimal': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_MINIMAL,
        bucket: 'INCOME_MINIMAL',
        range: 'Under $3,000 per month'
      },
      'cex-history': {
        issuerDid: process.env.CEX_ISSUER_DID,
        schemaId: process.env.SCHEMA_CEX_HISTORY,
        bucket: 'CEX_HISTORY'
      },
      'employment': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_EMPLOYMENT,
        bucket: 'EMPLOYMENT'
      }
    };
    
    const credentialMeta = credentialTypes[credentialType];
    if (!credentialMeta) {
      return res.status(400).json({
        success: false,
        error: `Unknown credential type: ${credentialType}`
      });
    }
    
    // Generate Partner JWT with 'issue' scope
    const authToken = generatePartnerJWT(
      userId || userAddress, // Use address as fallback user ID
      email || `${userAddress}@credo.local`, // Fallback email
      'issue',
      3600 // 1 hour expiration
    );
    
    console.log(`[Credentials] Prepared issuance for ${credentialType} to ${userAddress}`);
    
    // Return everything frontend needs for AIR Kit
    res.json({
      success: true,
      authToken,
      issuerDid: credentialMeta.issuerDid,
      schemaId: credentialMeta.schemaId,
      credentialSubject: {
        // Credential data that will be stored
        balanceBucket: credentialMeta.bucket,
        bucketRange: credentialMeta.range,
        verifiedAt: Math.floor(Date.now() / 1000),
        dataSource: credentialType.includes('bank') ? 'Plaid API (simulated)' : 'Mock Employer',
        period: credentialType.includes('bank') ? '30 days' : 'Current'
      }
    });
    
  } catch (error) {
    console.error('[Credentials] Error preparing issuance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Legacy endpoint - now returns error with migration message
 */
router.post('/request', async (req, res) => {
  res.status(410).json({
    success: false,
    error: 'This endpoint has been deprecated. Use /api/credentials/prepare instead.',
    migration: 'See documentation for new AIR Kit integration flow'
  });
});

module.exports = router;
```

---

### Step 10: Update Backend Environment (15 min)

**Update**: `backend/.env`

```bash
# Partner Authentication
PARTNER_ID=your_partner_id_from_dashboard
PARTNER_SECRET=your_generated_secret_key

# Issuer DIDs
BANK_ISSUER_DID=did:moca:...[from-dashboard]
EMPLOYMENT_ISSUER_DID=did:moca:...[from-dashboard]
CEX_ISSUER_DID=did:moca:...[from-dashboard]

# Verifier
VERIFIER_DID=did:moca:...[from-dashboard]

# Schema IDs (Bank Balance)
SCHEMA_BANK_HIGH=schema:moca:...[from-dashboard]
SCHEMA_BANK_MEDIUM=schema:moca:...[from-dashboard]
SCHEMA_BANK_LOW=schema:moca:...[from-dashboard]
SCHEMA_BANK_MINIMAL=schema:moca:...[from-dashboard]

# Schema IDs (Income)
SCHEMA_INCOME_HIGH=schema:moca:...[from-dashboard]
SCHEMA_INCOME_MEDIUM=schema:moca:...[from-dashboard]
SCHEMA_INCOME_LOW=schema:moca:...[from-dashboard]
SCHEMA_INCOME_MINIMAL=schema:moca:...[from-dashboard]

# Schema IDs (Legacy)
SCHEMA_CEX_HISTORY=schema:moca:...[from-dashboard]
SCHEMA_EMPLOYMENT=schema:moca:...[from-dashboard]

# Verifier Program IDs
VERIFIER_PROGRAM_BANK_HIGH=[from-dashboard]
VERIFIER_PROGRAM_BANK_MEDIUM=[from-dashboard]
VERIFIER_PROGRAM_BANK_LOW=[from-dashboard]
VERIFIER_PROGRAM_BANK_MINIMAL=[from-dashboard]
VERIFIER_PROGRAM_INCOME_HIGH=[from-dashboard]
VERIFIER_PROGRAM_INCOME_MEDIUM=[from-dashboard]
VERIFIER_PROGRAM_INCOME_LOW=[from-dashboard]
VERIFIER_PROGRAM_INCOME_MINIMAL=[from-dashboard]
VERIFIER_PROGRAM_CEX_HISTORY=[from-dashboard]
VERIFIER_PROGRAM_EMPLOYMENT=[from-dashboard]

# Port
PORT=3001
```

---

### Step 11: Delete Old Issuer Files (5 min)

**Delete these files** (no longer needed):

```bash
rm backend/src/issuers/MockBankIssuer.js
rm backend/src/issuers/MockEmployerIssuer.js
rm backend/src/issuers/MockExchangeIssuer.js
```

**Update**: `backend/package.json` - Add JWT dependency:

```bash
cd backend
npm install jsonwebtoken
```

---

## 🛠️ Part C: Frontend Integration

### Step 12: Update AIR Kit Initialization (30 min)

**Update**: `lib/airkit.js`

Add paymaster configuration:

```javascript
/**
 * Initialize AIR Kit with Gas Sponsorship
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
      
      // 🆕 Enable gas sponsorship
      paymasterConfig: {
        enabled: true,
        // Sponsor credential-related transactions
        policyId: process.env.NEXT_PUBLIC_PAYMASTER_POLICY_ID,
      }
    });
    
    console.log('✅ AIR Kit initialized with gas sponsorship');
    return true;
  } catch (error) {
    console.error('Failed to initialize AIR Kit:', error);
    throw error;
  }
}
```

---

### Step 13: Refactor Credential Issuance (1.5 hours)

**Update**: `components/CredentialMarketplace.jsx` or `components/ScoreBuilderWizard.jsx`

Replace the credential request logic:

```javascript
/**
 * Request credential using official AIR Kit flow
 */
const requestCredential = async (credentialType) => {
  try {
    setLoading(true);
    
    // Step 1: Prepare credential (get auth token from backend)
    const response = await fetch(`${API_BASE_URL}/api/credentials/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAddress,
        credentialType,
        userId: userInfo?.user?.id,
        email: userInfo?.user?.email
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to prepare credential');
    }
    
    const { authToken, issuerDid, schemaId, credentialSubject } = await response.json();
    
    console.log('✅ Credential prepared:', {
      issuerDid,
      schemaId,
      credentialType
    });
    
    // Step 2: Issue credential using AIR Kit (handles everything)
    await airService.credential.issue({
      authToken,
      issuerDid,
      credentialId: schemaId,
      credentialSubject: {
        ...credentialSubject,
        subject: userAddress // Add user address as subject
      }
    });
    
    console.log('✅ Credential issued via AIR Kit');
    
    // Step 3: Get the credential from user's wallet
    const userCredentials = await airService.credential.list({
      holder: userAddress
    });
    
    // Find the newly issued credential
    const newCredential = userCredentials.find(c => 
      c.schemaId === schemaId && 
      c.issuerDid === issuerDid
    );
    
    if (!newCredential) {
      throw new Error('Credential issued but not found in wallet');
    }
    
    console.log('✅ Credential retrieved from wallet:', newCredential.id);
    
    // Step 4: Submit to smart contract for credit score calculation
    await submitCredentialToOracle(newCredential);
    
    toast.success('Credential issued and submitted successfully!');
    
  } catch (error) {
    console.error('Failed to request credential:', error);
    toast.error(error.message || 'Failed to request credential');
  } finally {
    setLoading(false);
  }
};

/**
 * Submit credential to CreditScoreOracle contract
 */
const submitCredentialToOracle = async (credential) => {
  try {
    // Extract credential data for contract
    const credentialData = {
      credentialType: credential.credentialSubject.balanceBucket,
      issuer: credential.issuerDid,
      subject: credential.credentialSubject.subject,
      issuanceDate: credential.issuanceDate,
      expirationDate: credential.expirationDate,
      // AIR Kit provides cryptographic proof
      proof: credential.proof
    };
    
    // Prepare contract call
    const creditScoreOracle = getContract(
      CREDIT_SCORE_ORACLE_ADDRESS,
      CreditScoreOracleABI
    );
    
    // Submit to blockchain
    const tx = await creditScoreOracle.submitCredential(
      credentialData.credentialType,
      credentialData.issuer,
      credentialData.subject,
      credentialData.issuanceDate,
      credentialData.expirationDate,
      credentialData.proof.jws // JSON Web Signature from AIR Kit
    );
    
    console.log('📤 Submitting to blockchain:', tx.hash);
    await tx.wait();
    console.log('✅ Credential verified on-chain');
    
    // Refresh credit score
    await refreshCreditScore();
    
  } catch (error) {
    console.error('Failed to submit to oracle:', error);
    throw error;
  }
};
```

---

### Step 14: Add Credential Verification UI (45 min)

**Create**: `components/CredentialWallet.jsx`

```javascript
/**
 * Display user's AIR Kit credentials
 */
import { useState, useEffect } from 'react';
import { useAirKit } from '@/hooks/useAirKit';
import airService from '@/lib/airkit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
      
      // Get all credentials from AIR Kit wallet
      const userCredentials = await airService.credential.list({
        holder: userAddress
      });
      
      console.log('📜 Loaded credentials from wallet:', userCredentials.length);
      setCredentials(userCredentials);
      
    } catch (error) {
      console.error('Failed to load credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getCredentialIcon = (type) => {
    if (type.includes('BANK')) return '💰';
    if (type.includes('INCOME')) return '💼';
    if (type.includes('CEX')) return '📈';
    if (type.includes('EMPLOYMENT')) return '🏢';
    return '📄';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Credentials</CardTitle>
        <p className="text-sm text-muted-foreground">
          Stored securely in your AIR Kit wallet
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading credentials...</p>
        ) : credentials.length === 0 ? (
          <p className="text-muted-foreground">
            No credentials yet. Request some in the Score Builder!
          </p>
        ) : (
          <div className="space-y-3">
            {credentials.map((credential) => (
              <div
                key={credential.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {getCredentialIcon(credential.credentialSubject.balanceBucket)}
                  </span>
                  <div>
                    <p className="font-medium">
                      {credential.credentialSubject.balanceBucket.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Issued: {formatDate(credential.issuanceDate)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {credential.status === 'active' ? '✓ Active' : '⚠️ Expired'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    🔒 Private
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadCredentials}
          className="w-full mt-4"
        >
          🔄 Refresh
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

### Step 15: Update Frontend Environment (15 min)

**Update**: `.env.local`

```bash
# Existing
NEXT_PUBLIC_PARTNER_ID=your_partner_id

# Add these
NEXT_PUBLIC_PAYMASTER_POLICY_ID=[from-dashboard-gas-sponsorship]

# Backend API (if changed)
NEXT_PUBLIC_API_URL=http://localhost:3001

# MOCA Chain RPC
NEXT_PUBLIC_MOCA_RPC=https://rpc.testnet.mocachain.org
```

---

## ✅ Testing & Verification

### Step 16: Test Complete Flow (1 hour)

**Testing Checklist**:

```markdown
End-to-End Test:

1. Backend Test:
   - [ ] Start backend: `cd backend && npm run dev`
   - [ ] Test JWT generation: `curl http://localhost:3001/api/credentials/prepare -X POST -H "Content-Type: application/json" -d '{"userAddress":"0x123","credentialType":"bank-balance-high"}'`
   - [ ] Verify JWT contains correct fields
   - [ ] Test all 10 credential types return valid responses

2. Frontend Test:
   - [ ] Start frontend: `npm run dev`
   - [ ] Login with Moca ID
   - [ ] Navigate to Score Builder
   - [ ] Request credential (should NOT require MOCA tokens - gas sponsored!)
   - [ ] Watch AIR Kit handle issuance
   - [ ] Credential appears in wallet
   - [ ] Credential submitted to oracle
   - [ ] Credit score updates

3. Gas Sponsorship Verification:
   - [ ] Check user's MOCA balance before transaction
   - [ ] Issue credential
   - [ ] Check user's MOCA balance after (should be same!)
   - [ ] Check paymaster dashboard for sponsored transaction

4. Dashboard Verification:
   - [ ] Login to AIR Kit Dashboard
   - [ ] Navigate to Issuers → View Issued Credentials
   - [ ] See your test credential listed
   - [ ] Check storage location (MCSP)
   - [ ] Verify issuer reputation score

5. Interoperability Test:
   - [ ] Use AIR Kit SDK in separate test app
   - [ ] Query user's credentials by address
   - [ ] Verify credentials are discoverable
   - [ ] Verify schema is readable
```

---

### Step 17: Migration Smoke Test (30 min)

**Test Script**: `scripts/test-moca-integration.js`

```javascript
/**
 * Smoke test for MOCA official integration
 */

const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

async function runTests() {
  console.log('🧪 Testing MOCA Integration...\n');
  
  // Test 1: Credential Types Endpoint
  console.log('Test 1: Fetching credential types...');
  const typesRes = await fetch(`${API_URL}/api/credentials/types`);
  const types = await typesRes.json();
  
  if (!types.success || types.credentials.length !== 10) {
    throw new Error(`Expected 10 credentials, got ${types.credentials?.length}`);
  }
  console.log('✅ All 10 credential types available\n');
  
  // Test 2: Credential Preparation
  console.log('Test 2: Preparing credential issuance...');
  const prepareRes = await fetch(`${API_URL}/api/credentials/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userAddress: TEST_ADDRESS,
      credentialType: 'bank-balance-high',
      email: 'test@example.com'
    })
  });
  
  const prepared = await prepareRes.json();
  
  if (!prepared.success || !prepared.authToken) {
    throw new Error('Failed to prepare credential');
  }
  console.log('✅ Auth token generated\n');
  
  // Test 3: Verify JWT Structure
  console.log('Test 3: Verifying JWT structure...');
  const tokenParts = prepared.authToken.split('.');
  if (tokenParts.length !== 3) {
    throw new Error('Invalid JWT structure');
  }
  
  const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
  console.log('JWT Payload:', payload);
  
  if (!payload.partnerId || !payload.scope || payload.scope !== 'issue') {
    throw new Error('Invalid JWT payload');
  }
  console.log('✅ JWT structure valid\n');
  
  // Test 4: Verify Issuer DIDs
  console.log('Test 4: Verifying issuer DIDs...');
  const issuerDids = [
    process.env.BANK_ISSUER_DID,
    process.env.EMPLOYMENT_ISSUER_DID,
    process.env.CEX_ISSUER_DID
  ];
  
  for (const did of issuerDids) {
    if (!did || !did.startsWith('did:moca:')) {
      throw new Error(`Invalid issuer DID: ${did}`);
    }
  }
  console.log('✅ All issuer DIDs valid\n');
  
  console.log('🎉 All tests passed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Test in frontend');
  console.log('2. Verify gas sponsorship');
  console.log('3. Check AIR Kit dashboard for issued credentials');
}

runTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
```

**Run test**:
```bash
cd backend
node ../scripts/test-moca-integration.js
```

---

## 📊 Migration Success Criteria

### Technical Validation

```markdown
Backend:
- [ ] All 3 Issuer DIDs registered and active
- [ ] All 10 credential schemas created
- [ ] All 10 verifier programs configured
- [ ] Partner JWT generation working
- [ ] /api/credentials/types returns all schemas
- [ ] /api/credentials/prepare generates valid tokens
- [ ] No more manual signature generation code

Frontend:
- [ ] AIR Kit initialized with paymaster config
- [ ] Credential issuance uses airService.credential.issue()
- [ ] Credentials stored in AIR Kit wallet (not local storage)
- [ ] Can list user's credentials from wallet
- [ ] Gas sponsorship working (no MOCA required)
- [ ] Credentials submitted to oracle successfully

Dashboard:
- [ ] Can see issued credentials in AIR Kit Dashboard
- [ ] Credentials stored on MCSP (decentralized storage)
- [ ] Issuer reputation scores updating
- [ ] Gas sponsorship budget tracking
- [ ] Verifier programs showing activity

Interoperability:
- [ ] Credentials discoverable by other dApps
- [ ] Schemas publicly accessible
- [ ] Can query credentials by holder address
- [ ] Credential proofs verifiable independently
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Partner secret invalid"
```bash
# Solution: Regenerate secret in dashboard
# Make sure it's copied correctly (no extra spaces)
# Check .env file is loaded properly
```

**Issue**: "Issuer DID not found"
```bash
# Solution: Verify DID format (should be did:moca:...)
# Check issuer is approved in dashboard
# Try re-registering issuer
```

**Issue**: "Gas sponsorship not working"
```bash
# Solution: 
# 1. Verify paymaster is enabled in dashboard
# 2. Check paymaster wallet balance
# 3. Verify function selector is whitelisted
# 4. Check spending limits not exceeded
```

**Issue**: "Credential not appearing in wallet"
```bash
# Solution:
# 1. Check issuance transaction succeeded
# 2. Verify credential stored on MCSP (check dashboard)
# 3. Try refreshing wallet: airService.credential.list()
# 4. Check credential not filtered by status
```

**Issue**: "Schema validation failed"
```bash
# Solution:
# 1. Verify credentialSubject matches schema
# 2. Check all required fields present
# 3. Verify data types match schema
# 4. Check schema version is latest
```

---

## 📚 Additional Resources

### MOCA Documentation
- **Dashboard**: https://developers.sandbox.air3.com/
- **AIR Kit Docs**: https://docs.moca.network/airkit/
- **Credential Services**: https://docs.moca.network/airkit/usage/credential/
- **Gas Sponsorship**: https://docs.moca.network/airkit/usage/account/paymaster
- **Support**: Discord dev-chat channel

### Code Examples
- **Issuance Flow**: https://docs.moca.network/airkit/quickstart/issue-credentials
- **Verification Flow**: https://docs.moca.network/airkit/quickstart/verify-credentials
- **Partner JWT**: https://docs.moca.network/airkit/usage/partner-authentication

---

## ✅ Phase 5 Completion Checklist

```markdown
Part A: Dashboard Setup
- [ ] Registered 3 Issuer DIDs
- [ ] Registered 1 Verifier DID
- [ ] Created 10 credential schemas
- [ ] Created 10 verifier programs
- [ ] Configured gas sponsorship
- [ ] Generated partner secret
- [ ] Topped up all fee wallets

Part B: Backend Refactor
- [ ] Added JWT generation module
- [ ] Refactored credential routes
- [ ] Updated environment variables
- [ ] Deleted old issuer files
- [ ] Installed jsonwebtoken package
- [ ] Tested all API endpoints

Part C: Frontend Integration
- [ ] Updated AIR Kit initialization
- [ ] Refactored credential issuance flow
- [ ] Added credential wallet UI
- [ ] Updated environment variables
- [ ] Tested end-to-end flow
- [ ] Verified gas sponsorship

Testing:
- [ ] All backend endpoints working
- [ ] All frontend flows working
- [ ] Gas sponsorship verified
- [ ] Credentials in dashboard
- [ ] Smoke test passing
- [ ] Interoperability confirmed
```

---

## 🎉 What You've Accomplished

After Phase 5, your project will:

✅ **Use MOCA's Official Infrastructure** - No more custom workarounds  
✅ **Credentials Fully Interoperable** - Works with entire MOCA ecosystem  
✅ **Gas Sponsorship Enabled** - Zero-friction onboarding  
✅ **Decentralized Storage** - Credentials on MCSP  
✅ **Issuer Reputation** - Builds trust over time  
✅ **Public Discovery** - Schemas discoverable by other dApps  

**You're now a true MOCA ecosystem participant!** 🚀

---

**Phase Status**: Ready to Execute  
**Priority**: HIGH (Critical for ecosystem integration)  
**Next Phase**: Phase 6 - Documentation & Demo

---

## 🔗 Related Documentation

- **MOCA Integration Analysis**: [Previous conversation notes]
- **Phase 6 Documentation**: See PHASE6-DOCS-DEMO.md
- **Testing Checklist**: See TESTING-CHECKLIST.md
- **Integration Guide**: See INTEGRATION-GUIDE.md (to be updated)

