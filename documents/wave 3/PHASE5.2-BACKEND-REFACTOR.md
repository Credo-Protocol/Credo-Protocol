# Phase 5.2: Backend Refactor

**Day**: 3 Afternoon (Oct 27)  
**Duration**: 2-3 hours  
**Prerequisites**: **Phase 5.1 Complete** (All DIDs, Schemas, and Partner Secret obtained)  
**Next**: Phase 5.3 (Frontend Integration)

---

## 🎯 Goal

Refactor your backend from custom mock issuers to official MOCA Partner JWT authentication. Replace manual credential signing with metadata endpoints that prepare data for AIR Kit credential issuance.

**Why This Phase**: Your backend currently bypasses MOCA by manually signing credentials. This refactor makes your backend a proper MOCA partner that generates auth tokens for the frontend to use with AIR Kit.

**What Changes**:
- ✅ Add Partner JWT generation module
- ✅ Replace mock issuer logic with schema metadata
- ✅ Update credential API to prepare (not issue) credentials
- ✅ Delete old issuer files
- ✅ Update environment variables

---

## 📋 What You're Building

### Current Architecture (Wrong)
```
Backend:
  - MockBankIssuer.js (manual signing)
  - MockEmployerIssuer.js (manual signing)
  - MockExchangeIssuer.js (manual signing)
  - POST /api/credentials/request
    → Returns signed credential
    → Frontend submits to blockchain
```

### Target Architecture (Official MOCA)
```
Backend:
  - auth/jwt.js (Partner JWT generation)
  - GET /api/credentials/types
    → Returns available credentials with schema metadata
  - POST /api/credentials/prepare
    → Generates Partner JWT for frontend
    → Returns issuer DID, schema ID, credential template
    → Frontend uses AIR Kit to issue credential
```

---

## 🛠️ Step-by-Step Instructions

### Step 1: Update Backend Environment (15 min)

**File**: `backend/.env`

Replace entire contents with:

```bash
# ============================================
# MOCA AIR Kit Integration - Phase 5.2
# ============================================

# Partner Authentication
PARTNER_ID=your_partner_id_from_dashboard
PARTNER_SECRET=your_generated_secret_from_5.1

# ============================================
# Issuer DIDs (from Phase 5.1)
# ============================================
BANK_ISSUER_DID=did:moca:...[paste-from-phase-5.1]
EMPLOYMENT_ISSUER_DID=did:moca:...[paste-from-phase-5.1]
CEX_ISSUER_DID=did:moca:...[paste-from-phase-5.1]

# ============================================
# Verifier DID (from Phase 5.1)
# ============================================
VERIFIER_DID=did:moca:...[paste-from-phase-5.1]

# ============================================
# Schema IDs - Bank Balance (from Phase 5.1)
# ============================================
SCHEMA_BANK_HIGH=schema:moca:...[paste]
SCHEMA_BANK_MEDIUM=schema:moca:...[paste]
SCHEMA_BANK_LOW=schema:moca:...[paste]
SCHEMA_BANK_MINIMAL=schema:moca:...[paste]

# ============================================
# Schema IDs - Income Range (from Phase 5.1)
# ============================================
SCHEMA_INCOME_HIGH=schema:moca:...[paste]
SCHEMA_INCOME_MEDIUM=schema:moca:...[paste]
SCHEMA_INCOME_LOW=schema:moca:...[paste]
SCHEMA_INCOME_MINIMAL=schema:moca:...[paste]

# ============================================
# Schema IDs - Legacy (from Phase 5.1)
# ============================================
SCHEMA_CEX_HISTORY=schema:moca:...[paste]
SCHEMA_EMPLOYMENT=schema:moca:...[paste]

# ============================================
# Verifier Program IDs (from Phase 5.1)
# ============================================
VERIFIER_PROGRAM_BANK_HIGH=[paste]
VERIFIER_PROGRAM_BANK_MEDIUM=[paste]
VERIFIER_PROGRAM_BANK_LOW=[paste]
VERIFIER_PROGRAM_BANK_MINIMAL=[paste]
VERIFIER_PROGRAM_INCOME_HIGH=[paste]
VERIFIER_PROGRAM_INCOME_MEDIUM=[paste]
VERIFIER_PROGRAM_INCOME_LOW=[paste]
VERIFIER_PROGRAM_INCOME_MINIMAL=[paste]
VERIFIER_PROGRAM_CEX_HISTORY=[paste]
VERIFIER_PROGRAM_EMPLOYMENT=[paste]

# ============================================
# Gas Sponsorship (from Phase 5.1)
# ============================================
PAYMASTER_POLICY_ID=[paste]

# ============================================
# Server Configuration
# ============================================
PORT=3001
NODE_ENV=development
```

**Important**: Replace ALL placeholder values with actual values from Phase 5.1!

---

### Step 2: Install JWT Dependency (5 min)

**Terminal**:
```bash
cd backend
npm install jsonwebtoken
```

**Verify installation**:
```bash
npm list jsonwebtoken
```

Should show: `jsonwebtoken@9.x.x`

---

### Step 3: Create JWT Authentication Module (30 min)

**Create**: `backend/src/auth/jwt.js`

```javascript
/**
 * Partner JWT Generation for AIR Kit Integration
 * 
 * Based on MOCA documentation:
 * https://docs.moca.network/airkit/usage/partner-authentication
 * 
 * Partner JWTs are used by frontend to authenticate with AIR Kit
 * when issuing or verifying credentials.
 */

const jwt = require('jsonwebtoken');

/**
 * Generate Partner JWT for credential issuance
 * 
 * The frontend will pass this token to airService.credential.issue()
 * AIR Kit verifies the token and proceeds with credential issuance.
 * 
 * @param {string} userId - Your internal user ID (or wallet address)
 * @param {string} email - User's email address (required by AIR Kit)
 * @param {string} scope - 'issue' or 'verify' (what the token allows)
 * @param {number} expiresIn - Token lifetime in seconds (default: 1 hour)
 * @returns {string} Signed JWT token
 */
function generatePartnerJWT(userId, email, scope = 'issue', expiresIn = 3600) {
  // Validate required environment variables
  if (!process.env.PARTNER_ID) {
    throw new Error('PARTNER_ID not set in environment');
  }
  if (!process.env.PARTNER_SECRET) {
    throw new Error('PARTNER_SECRET not set in environment');
  }
  
  // Validate inputs
  if (!userId || !email) {
    throw new Error('userId and email are required');
  }
  if (!['issue', 'verify'].includes(scope)) {
    throw new Error('scope must be "issue" or "verify"');
  }
  
  const now = Math.floor(Date.now() / 1000);
  
  // JWT payload as per MOCA spec
  const payload = {
    partnerId: process.env.PARTNER_ID,
    partnerUserId: userId,
    email: email,
    scope: scope,
    iat: now,                  // Issued at
    exp: now + expiresIn       // Expiration
  };
  
  // Sign with HS256 (required by MOCA)
  const token = jwt.sign(payload, process.env.PARTNER_SECRET, {
    algorithm: 'HS256'
  });
  
  console.log(`[JWT] Generated ${scope} token for user ${userId} (expires in ${expiresIn}s)`);
  return token;
}

/**
 * Verify Partner JWT (for debugging/testing)
 * 
 * @param {string} token - JWT token to verify
 * @returns {object} {valid: boolean, payload?: object, error?: string}
 */
function verifyPartnerJWT(token) {
  try {
    const decoded = jwt.verify(token, process.env.PARTNER_SECRET, {
      algorithms: ['HS256']
    });
    
    console.log('[JWT] Token verified successfully');
    return { valid: true, payload: decoded };
  } catch (error) {
    console.error('[JWT] Token verification failed:', error.message);
    return { valid: false, error: error.message };
  }
}

/**
 * Generate JWT specifically for credential issuance
 * Convenience wrapper for common use case
 */
function generateIssueToken(userId, email) {
  return generatePartnerJWT(userId, email, 'issue', 3600);
}

/**
 * Generate JWT specifically for credential verification
 * Convenience wrapper for common use case
 */
function generateVerifyToken(userId, email) {
  return generatePartnerJWT(userId, email, 'verify', 3600);
}

module.exports = {
  generatePartnerJWT,
  verifyPartnerJWT,
  generateIssueToken,
  generateVerifyToken
};
```

**Test the module**:

Create temporary test file: `backend/test-jwt.js`

```javascript
require('dotenv').config();
const { generatePartnerJWT, verifyPartnerJWT } = require('./src/auth/jwt');

console.log('Testing JWT Generation...\n');

try {
  // Generate token
  const token = generatePartnerJWT(
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    'test@example.com',
    'issue',
    3600
  );
  
  console.log('Generated Token:', token.substring(0, 50) + '...\n');
  
  // Verify token
  const verification = verifyPartnerJWT(token);
  
  if (verification.valid) {
    console.log('✅ Token is valid!');
    console.log('Payload:', JSON.stringify(verification.payload, null, 2));
  } else {
    console.log('❌ Token is invalid:', verification.error);
  }
} catch (error) {
  console.error('❌ Test failed:', error.message);
}
```

**Run test**:
```bash
node test-jwt.js
```

**Expected output**:
```
[JWT] Generated issue token for user 0x742d35...
Generated Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

[JWT] Token verified successfully
✅ Token is valid!
Payload: {
  "partnerId": "your-partner-id",
  "partnerUserId": "0x742d35...",
  "email": "test@example.com",
  "scope": "issue",
  "iat": 1730012400,
  "exp": 1730016000
}
```

**Delete test file after success**:
```bash
rm test-jwt.js
```

**Status Check**: ✅ JWT module working

---

### Step 4: Refactor Credential Routes (45 min)

**Replace**: `backend/src/routes/credentials.js`

Replace entire file contents with:

```javascript
/**
 * Credential API Routes - MOCA Official Integration
 * 
 * NEW APPROACH:
 * - Backend prepares credential metadata
 * - Frontend uses AIR Kit to issue credentials
 * - No more manual signature generation
 * 
 * Flow:
 * 1. GET /types - List all available credential types
 * 2. POST /prepare - Generate auth token + metadata for issuance
 * 3. Frontend uses AIR Kit to issue
 * 4. Frontend submits to smart contract
 */

const express = require('express');
const { generateIssueToken } = require('../auth/jwt');

const router = express.Router();

/**
 * GET /api/credentials/types
 * 
 * Returns all available credential types with schema metadata.
 * Frontend uses this to display credential marketplace.
 */
router.get('/types', async (req, res) => {
  try {
    const credentialTypes = [
      // ============================================
      // Bank Balance Credentials
      // ============================================
      {
        id: 'bank-balance-high',
        name: 'Bank Balance - High',
        subtitle: '$10,000+ (30-day average)',
        category: 'Financial',
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_HIGH,
        weight: 150,
        bucket: 'BANK_BALANCE_HIGH',
        range: '$10,000+',
        description: 'Proves 30-day average balance of $10k or more without revealing exact amount',
        privacyLevel: 'Bucketed - Exact amount not disclosed',
        icon: '💰',
        color: 'green',
        tier: 'Tier 1 (50% collateral)'
      },
      {
        id: 'bank-balance-medium',
        name: 'Bank Balance - Medium',
        subtitle: '$5,000 - $10,000 (30-day avg)',
        category: 'Financial',
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_MEDIUM,
        weight: 120,
        bucket: 'BANK_BALANCE_MEDIUM',
        range: '$5,000 - $10,000',
        description: 'Proves 30-day average balance of $5k-$10k',
        privacyLevel: 'Bucketed',
        icon: '💰',
        color: 'blue',
        tier: 'Tier 2 (60% collateral)'
      },
      {
        id: 'bank-balance-low',
        name: 'Bank Balance - Low',
        subtitle: '$1,000 - $5,000 (30-day avg)',
        category: 'Financial',
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_LOW,
        weight: 80,
        bucket: 'BANK_BALANCE_LOW',
        range: '$1,000 - $5,000',
        description: 'Proves 30-day average balance of $1k-$5k',
        privacyLevel: 'Bucketed',
        icon: '💰',
        color: 'yellow',
        tier: 'Tier 4 (90% collateral)'
      },
      {
        id: 'bank-balance-minimal',
        name: 'Bank Balance - Minimal',
        subtitle: 'Under $1,000 (30-day avg)',
        category: 'Financial',
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_MINIMAL,
        weight: 40,
        bucket: 'BANK_BALANCE_MINIMAL',
        range: 'Under $1,000',
        description: 'Proves 30-day average balance under $1k',
        privacyLevel: 'Bucketed',
        icon: '💰',
        color: 'gray',
        tier: 'Tier 7 (125% collateral)'
      },
      
      // ============================================
      // Income Range Credentials
      // ============================================
      {
        id: 'income-high',
        name: 'Income Range - High',
        subtitle: '$8,000+ per month',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_HIGH,
        weight: 180,
        bucket: 'INCOME_HIGH',
        range: '$8,000+ per month',
        description: 'Proves monthly income of $8k or more without revealing exact salary',
        privacyLevel: 'Bucketed - Exact salary not disclosed',
        icon: '💼',
        color: 'green',
        tier: 'Tier 1 (50% collateral)'
      },
      {
        id: 'income-medium',
        name: 'Income Range - Medium',
        subtitle: '$5,000 - $8,000 per month',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_MEDIUM,
        weight: 140,
        bucket: 'INCOME_MEDIUM',
        range: '$5,000 - $8,000 per month',
        description: 'Proves monthly income of $5k-$8k',
        privacyLevel: 'Bucketed',
        icon: '💼',
        color: 'blue',
        tier: 'Tier 2 (60% collateral)'
      },
      {
        id: 'income-low',
        name: 'Income Range - Low',
        subtitle: '$3,000 - $5,000 per month',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_LOW,
        weight: 100,
        bucket: 'INCOME_LOW',
        range: '$3,000 - $5,000 per month',
        description: 'Proves monthly income of $3k-$5k',
        privacyLevel: 'Bucketed',
        icon: '💼',
        color: 'yellow',
        tier: 'Tier 3 (75% collateral)'
      },
      {
        id: 'income-minimal',
        name: 'Income Range - Minimal',
        subtitle: 'Under $3,000 per month',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_MINIMAL,
        weight: 50,
        bucket: 'INCOME_MINIMAL',
        range: 'Under $3,000 per month',
        description: 'Proves monthly income under $3k',
        privacyLevel: 'Bucketed',
        icon: '💼',
        color: 'gray',
        tier: 'Tier 6 (110% collateral)'
      },
      
      // ============================================
      // Legacy Credentials
      // ============================================
      {
        id: 'cex-history',
        name: 'CEX Trading History',
        subtitle: 'Proof of exchange activity',
        category: 'Financial',
        issuerDid: process.env.CEX_ISSUER_DID,
        schemaId: process.env.SCHEMA_CEX_HISTORY,
        weight: 80,
        bucket: 'CEX_HISTORY',
        description: 'Proves active trading history on centralized exchanges',
        privacyLevel: 'Metadata only - no trade details',
        icon: '📈',
        color: 'purple',
        tier: 'Tier 4 (90% collateral)'
      },
      {
        id: 'employment',
        name: 'Proof of Employment',
        subtitle: 'Current employment status',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_EMPLOYMENT,
        weight: 70,
        bucket: 'EMPLOYMENT',
        description: 'Proves current employment status without revealing employer',
        privacyLevel: 'Basic verification',
        icon: '🏢',
        color: 'indigo',
        tier: 'Tier 5 (100% collateral)'
      }
    ];
    
    // Filter out any with missing env vars
    const validCredentials = credentialTypes.filter(c => 
      c.issuerDid && c.schemaId
    );
    
    if (validCredentials.length < credentialTypes.length) {
      console.warn(`[Credentials] ${credentialTypes.length - validCredentials.length} credentials missing env vars`);
    }
    
    res.json({
      success: true,
      count: validCredentials.length,
      credentials: validCredentials
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
 * POST /api/credentials/prepare
 * 
 * Prepares credential issuance by generating Partner JWT.
 * Frontend receives everything needed to call AIR Kit.
 * 
 * Body:
 *   - userAddress: Wallet address of credential subject
 *   - credentialType: ID of credential type (e.g., 'bank-balance-high')
 *   - userId: Optional internal user ID
 *   - email: Optional user email (fallback generated if missing)
 */
router.post('/prepare', async (req, res) => {
  try {
    const { userAddress, credentialType, userId, email } = req.body;
    
    // Validate required fields
    if (!userAddress || !credentialType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, credentialType'
      });
    }
    
    // Map credential type to schema
    const credentialMap = {
      'bank-balance-high': {
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_HIGH,
        bucket: 'BANK_BALANCE_HIGH',
        range: '$10,000+',
        weight: 150
      },
      'bank-balance-medium': {
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_MEDIUM,
        bucket: 'BANK_BALANCE_MEDIUM',
        range: '$5,000 - $10,000',
        weight: 120
      },
      'bank-balance-low': {
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_LOW,
        bucket: 'BANK_BALANCE_LOW',
        range: '$1,000 - $5,000',
        weight: 80
      },
      'bank-balance-minimal': {
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_MINIMAL,
        bucket: 'BANK_BALANCE_MINIMAL',
        range: 'Under $1,000',
        weight: 40
      },
      'income-high': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_HIGH,
        bucket: 'INCOME_HIGH',
        range: '$8,000+ per month',
        weight: 180
      },
      'income-medium': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_MEDIUM,
        bucket: 'INCOME_MEDIUM',
        range: '$5,000 - $8,000 per month',
        weight: 140
      },
      'income-low': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_LOW,
        bucket: 'INCOME_LOW',
        range: '$3,000 - $5,000 per month',
        weight: 100
      },
      'income-minimal': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_MINIMAL,
        bucket: 'INCOME_MINIMAL',
        range: 'Under $3,000 per month',
        weight: 50
      },
      'cex-history': {
        issuerDid: process.env.CEX_ISSUER_DID,
        schemaId: process.env.SCHEMA_CEX_HISTORY,
        bucket: 'CEX_HISTORY',
        weight: 80
      },
      'employment': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_EMPLOYMENT,
        bucket: 'EMPLOYMENT',
        weight: 70
      }
    };
    
    const credentialMeta = credentialMap[credentialType];
    if (!credentialMeta) {
      return res.status(400).json({
        success: false,
        error: `Unknown credential type: ${credentialType}`
      });
    }
    
    // Verify env vars exist
    if (!credentialMeta.issuerDid || !credentialMeta.schemaId) {
      return res.status(500).json({
        success: false,
        error: `Credential type ${credentialType} not properly configured (missing DID or schema)`
      });
    }
    
    // Generate Partner JWT with 'issue' scope
    // Use provided userId/email or generate fallbacks
    const effectiveUserId = userId || userAddress;
    const effectiveEmail = email || `${userAddress.substring(0, 10)}@credo.local`;
    
    const authToken = generateIssueToken(effectiveUserId, effectiveEmail);
    
    console.log(`[Credentials] Prepared ${credentialType} for ${userAddress}`);
    
    // Return everything frontend needs for AIR Kit
    res.json({
      success: true,
      authToken,
      issuerDid: credentialMeta.issuerDid,
      schemaId: credentialMeta.schemaId,
      credentialSubject: {
        // Data that will be stored in credential
        credentialType: credentialMeta.bucket,
        bucket: credentialMeta.bucket,
        bucketRange: credentialMeta.range,
        weight: credentialMeta.weight,
        verifiedAt: Math.floor(Date.now() / 1000),
        dataSource: credentialType.includes('bank') ? 'Plaid API (simulated)' : 
                     credentialType.includes('income') ? 'Mock Employer' :
                     credentialType.includes('cex') ? 'Mock Exchange' : 'Mock Provider',
        period: credentialType.includes('bank') ? '30 days' : 
                credentialType.includes('income') ? 'Monthly' : 'Current',
        subject: userAddress
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
 * POST /api/credentials/request (DEPRECATED)
 * 
 * Legacy endpoint - returns migration message
 */
router.post('/request', async (req, res) => {
  res.status(410).json({
    success: false,
    error: 'This endpoint has been deprecated in Phase 5.2',
    message: 'Use /api/credentials/prepare instead',
    migration: 'See PHASE5.2-BACKEND-REFACTOR.md for details'
  });
});

module.exports = router;
```

**Status Check**: ✅ Credential routes refactored

---

### Step 5: Delete Old Issuer Files (5 min)

These files are no longer needed:

```bash
cd backend/src
rm issuers/MockBankIssuer.js
rm issuers/MockEmployerIssuer.js
rm issuers/MockExchangeIssuer.js
```

**Verify deletion**:
```bash
ls issuers/
```

Should show: (empty directory or directory doesn't exist)

**Status Check**: ✅ Old issuer files deleted

---

### Step 6: Update Server Entry Point (10 min)

**Check**: `backend/src/server.js`

Ensure it imports and uses the credential routes:

```javascript
// Should already have this, but verify:
const credentialsRouter = require('./routes/credentials');
app.use('/api/credentials', credentialsRouter);
```

If missing, add it after other routes.

**Status Check**: ✅ Server configured

---

### Step 7: Test Backend Endpoints (30 min)

Start backend:
```bash
cd backend
npm run dev
```

Should see:
```
Server running on port 3001
```

#### Test 1: GET /api/credentials/types

```bash
curl http://localhost:3001/api/credentials/types | jq
```

**Expected**:
```json
{
  "success": true,
  "count": 10,
  "credentials": [
    {
      "id": "bank-balance-high",
      "name": "Bank Balance - High",
      "issuerDid": "did:moca:...",
      "schemaId": "schema:moca:...",
      "weight": 150,
      ...
    },
    ...
  ]
}
```

**If count < 10**: Some env vars are missing. Check `.env` file.

---

#### Test 2: POST /api/credentials/prepare

```bash
curl -X POST http://localhost:3001/api/credentials/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "credentialType": "bank-balance-high",
    "email": "test@example.com"
  }' | jq
```

**Expected**:
```json
{
  "success": true,
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "issuerDid": "did:moca:...",
  "schemaId": "schema:moca:...",
  "credentialSubject": {
    "credentialType": "BANK_BALANCE_HIGH",
    "bucket": "BANK_BALANCE_HIGH",
    "bucketRange": "$10,000+",
    "weight": 150,
    "verifiedAt": 1730012400,
    "dataSource": "Plaid API (simulated)",
    "period": "30 days",
    "subject": "0x742d35..."
  }
}
```

**Verify JWT**:
- Copy the `authToken` value
- Go to [jwt.io](https://jwt.io)
- Paste token
- Check decoded payload has: `partnerId`, `scope: "issue"`, `exp`

---

#### Test 3: Test All Credential Types

Create test script: `backend/test-all-types.sh`

```bash
#!/bin/bash

TYPES=(
  "bank-balance-high"
  "bank-balance-medium"
  "bank-balance-low"
  "bank-balance-minimal"
  "income-high"
  "income-medium"
  "income-low"
  "income-minimal"
  "cex-history"
  "employment"
)

echo "Testing all credential types..."
echo

for TYPE in "${TYPES[@]}"; do
  echo "Testing: $TYPE"
  RESPONSE=$(curl -s -X POST http://localhost:3001/api/credentials/prepare \
    -H "Content-Type: application/json" \
    -d "{\"userAddress\": \"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\", \"credentialType\": \"$TYPE\"}")
  
  SUCCESS=$(echo $RESPONSE | jq -r '.success')
  
  if [ "$SUCCESS" == "true" ]; then
    echo "  ✅ Success"
  else
    echo "  ❌ Failed"
    echo "  Error: $(echo $RESPONSE | jq -r '.error')"
  fi
  echo
done

echo "Test complete!"
```

**Run**:
```bash
chmod +x backend/test-all-types.sh
./backend/test-all-types.sh
```

**Expected**: All 10 types show ✅ Success

**If any fail**: Check that env var for that credential's issuerDid and schemaId are set.

---

## ✅ Phase 5.2 Completion Checklist

Before proceeding to Phase 5.3, verify:

### Environment Setup
- [ ] Updated `backend/.env` with all DIDs and schemas
- [ ] All 3 Issuer DIDs present
- [ ] All 10 Schema IDs present
- [ ] Partner secret present
- [ ] `jsonwebtoken` package installed

### Code Changes
- [ ] Created `backend/src/auth/jwt.js`
- [ ] JWT module tested successfully
- [ ] Replaced `backend/src/routes/credentials.js`
- [ ] Deleted all 3 mock issuer files
- [ ] Server imports credential routes

### Testing
- [ ] Backend starts without errors
- [ ] GET /types returns 10 credentials
- [ ] POST /prepare returns valid JWT
- [ ] JWT decodes correctly on jwt.io
- [ ] All 10 credential types work
- [ ] No console errors

---

## 📝 What Changed

### Before Phase 5.2
```javascript
// ❌ Mock issuer manually signing
const signature = await wallet.signMessage(credentialData);
return { credential, signature };
```

### After Phase 5.2
```javascript
// ✅ Backend generates auth token
const authToken = generateIssueToken(userId, email);
return { authToken, issuerDid, schemaId, credentialSubject };
```

**Key difference**: Backend no longer issues credentials. It prepares metadata for frontend to use with AIR Kit.

---

## 🚀 Next Steps

**Proceed to Phase 5.3**: Frontend Integration

In Phase 5.3, you'll:
1. Update AIR Kit initialization with paymaster
2. Refactor credential issuance to use `airService.credential.issue()`
3. Create credential wallet component
4. Update frontend environment variables
5. Test end-to-end flow

**Estimated Time**: 2-3 hours

---

## 🐛 Troubleshooting

### "PARTNER_SECRET not set"
- Check `.env` file has the secret from Phase 5.1
- Restart backend after changing .env
- Verify no extra spaces in secret value

### "GET /types returns count: 0"
- All issuerDid or schemaId env vars are missing
- Check `.env` has all 10 schemas
- Restart backend after adding vars

### "JWT generation fails"
- Verify PARTNER_ID and PARTNER_SECRET are set
- Check secret format (no quotes, no spaces)
- Try regenerating secret in dashboard

### "POST /prepare returns 500"
- Check specific credential type has valid issuerDid and schemaId
- Look at backend console for detailed error
- Verify env var names match exactly

### "All tests fail"
- Backend may not be running
- Check `npm run dev` shows "Server running on port 3001"
- Verify PORT=3001 in .env

---

**Phase 5.2 Status**: ✅ Complete  
**Next Phase**: Phase 5.3 - Frontend Integration  
**Time to Next**: Ready to proceed immediately

