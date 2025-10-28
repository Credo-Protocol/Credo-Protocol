# Phase 2: Backend USDC Faucet Service

**$50 USDC Verification Reward - Backend Implementation**  
**Time Required:** ~1 hour  
**Difficulty:** Medium  

---

## Goal

Build the backend service that handles verification and transfers $50 USDC to verified users - like a faucet!

**What You'll Build:**
- ✅ Verification service with auth token generation
- ✅ API routes for verification & claiming
- ✅ USDC transfer function
- ✅ Claim tracking (prevent double-claiming)
- ✅ Integration with MockUSDC contract

---

## What This Does

The backend faucet service:
1. **Prepares verification requests** - Generates auth tokens for AIR Kit
2. **Processes results** - Handles verified/failed states
3. **Transfers USDC** - Sends $50 USDC to verified users
4. **Tracks claims** - Prevents users from claiming twice

```
Frontend Request → Backend Prepares → AIR Kit Verifies → Backend Processes → Frontend Updates
```

---

## Step 2.1: Create Verification Service

### File Location:
```
backend/src/services/verificationService.js
```

### Implementation:

Create `backend/src/services/verificationService.js`:

```javascript
/**
 * $50 USDC Verification Faucet Service
 * 
 * Handles credential verification and USDC rewards
 * Users verify employment → get $50 USDC instantly (one-time)
 * 
 * Based on: https://docs.moca.network/airkit/usage/credential/verify
 */

const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');

// Load configuration from environment
const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY;
const VERIFIER_DID = process.env.VERIFIER_DID;
const VERIFICATION_PROGRAM_ID = process.env.VERIFICATION_PROGRAM_ID;
const PARTNER_ID = process.env.PARTNER_ID;

// Reward configuration
const REWARD_AMOUNT = parseFloat(process.env.REWARD_AMOUNT || '50');
const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS;
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || 'https://devnet-rpc.mocachain.network';

// In-memory claim tracking (TODO: Use database in production)
const claimedRewards = new Set();

/**
 * Generate verification auth token (Partner JWT)
 * 
 * Required for initiating verification requests.
 * This token proves to AIR Kit that you're authorized to request verification.
 * 
 * @param {string} userId - AIR Kit user ID
 * @param {string} email - User email (optional)
 * @returns {string} JWT token for verification
 */
function generateVerificationAuthToken(userId, email) {
  // Build JWT payload
  const payload = {
    partnerId: PARTNER_ID,
    partnerUserId: userId,
    email: email,
    // Short expiry for verification (5 minutes)
    exp: Math.floor(Date.now() / 1000) + (5 * 60),
    iat: Math.floor(Date.now() / 1000)
  };

  // Sign with verifier's private key (RS256 algorithm)
  const token = jwt.sign(payload, VERIFIER_PRIVATE_KEY, {
    algorithm: 'RS256',
    header: {
      kid: 'verifier-key-1'
    }
  });

  return token;
}

/**
 * Prepare verification request
 * 
 * Creates auth token and verification parameters for frontend.
 * Frontend will use this to initiate AIR Kit verification widget.
 * 
 * @param {Object} params - Verification parameters
 * @param {string} params.userId - AIR Kit user ID
 * @param {string} params.email - User email
 * @param {string} params.targetUserAddress - Address of user to verify
 * @param {string} params.requiredCredentialType - Type of credential (optional)
 * @returns {Promise<Object>} Verification request data
 */
async function prepareVerification({ 
  userId, 
  email, 
  targetUserAddress, 
  requiredCredentialType 
}) {
  try {
    console.log(`🔍 Preparing $50 USDC verification`);
    console.log(`   Verifier: ${userId}`);
    console.log(`   Target: ${targetUserAddress}`);
    console.log(`   Required: ${requiredCredentialType || 'EMPLOYMENT'}`);

    // Check if user already claimed
    if (claimedRewards.has(targetUserAddress.toLowerCase())) {
      throw new Error('Reward already claimed by this address');
    }

    // Generate auth token for verifier
    const authToken = generateVerificationAuthToken(userId, email);

    // Build verification parameters
    const verificationParams = {
      verifierDid: VERIFIER_DID,
      programId: VERIFICATION_PROGRAM_ID,
      targetUserAddress,
    };

    console.log('✅ Verification request prepared');
    console.log(`   Program: ${VERIFICATION_PROGRAM_ID}`);
    console.log(`   Reward: ${REWARD_AMOUNT} USDC`);

    return {
      success: true,
      authToken,
      ...verificationParams,
      requiredCredentialType,
      // Include reward info for frontend display
      reward: {
        amount: REWARD_AMOUNT,
        token: 'USDC',
        claimed: false
      }
    };

  } catch (error) {
    console.error('❌ Failed to prepare verification:', error);
    throw error;
  }
}

/**
 * Transfer USDC to user's wallet
 * 
 * Simple faucet-style transfer of $50 USDC
 * 
 * @param {string} toAddress - Recipient wallet address
 * @param {number} amount - Amount of USDC to transfer
 * @returns {Promise<string>} Transaction hash
 */
async function transferUSDC(toAddress, amount) {
  try {
    console.log(`💸 Transferring ${amount} USDC to ${toAddress}...`);

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);

    // USDC contract (ERC20)
    const usdcContract = new ethers.Contract(
      USDC_CONTRACT_ADDRESS,
      ['function transfer(address to, uint256 amount) returns (bool)'],
      wallet
    );

    // USDC has 6 decimals (not 18 like ETH)
    const amountInWei = ethers.parseUnits(amount.toString(), 6);

    // Send transaction
    const tx = await usdcContract.transfer(toAddress, amountInWei);
    console.log(`   TX sent: ${tx.hash}`);

    // Wait for confirmation
    await tx.wait();
    console.log(`   ✅ Confirmed!`);

    return tx.hash;

  } catch (error) {
    console.error('❌ USDC transfer failed:', error);
    throw new Error(`USDC transfer failed: ${error.message}`);
  }
}

/**
 * Process verification result and transfer USDC reward
 * 
 * Called after AIR Kit completes verification.
 * If verified → transfers $50 USDC to user (one-time only).
 * 
 * @param {Object} result - Verification result from AIR Kit
 * @param {string} result.userAddress - User's wallet address
 * @param {boolean} result.verified - Whether verification succeeded
 * @param {Object} result.proofData - Zero-knowledge proof data
 * @param {string} result.credentialType - Type of credential verified
 * @returns {Promise<Object>} Processing result with reward info
 */
async function processVerificationResult(result) {
  try {
    const { userAddress, verified, proofData, credentialType } = result;

    console.log(`💰 Processing $50 USDC verification reward`);
    console.log(`   User: ${userAddress}`);
    console.log(`   Verified: ${verified}`);
    console.log(`   Credential Type: ${credentialType}`);

    // Check if already claimed (double-check)
    const addressLower = userAddress.toLowerCase();
    if (claimedRewards.has(addressLower)) {
      throw new Error('Reward already claimed by this address');
    }

    // Create verification record
    const verificationRecord = {
      userAddress,
      verified,
      credentialType,
      timestamp: Math.floor(Date.now() / 1000),
      proofHash: proofData ? JSON.stringify(proofData).slice(0, 50) : null
    };

    // Transfer USDC if verified
    let reward = null;
    if (verified) {
      console.log(`   🎉 Verification successful! Transferring ${REWARD_AMOUNT} USDC...`);
      
      // Transfer USDC
      const txHash = await transferUSDC(userAddress, REWARD_AMOUNT);
      
      // Mark as claimed
      claimedRewards.add(addressLower);
      
      reward = {
        amount: REWARD_AMOUNT,
        token: 'USDC',
        txHash,
        claimed: true,
        timestamp: Math.floor(Date.now() / 1000)
      };

      console.log(`   ✅ Reward claimed!`);
      console.log(`   Amount: ${REWARD_AMOUNT} USDC`);
      console.log(`   TX: ${txHash}`);
      
      // TODO: Store claim in database
      // Example: await db.claims.create({ userAddress, amount: REWARD_AMOUNT, txHash, timestamp })
    } else {
      console.log('   ❌ Verification failed - no reward');
    }

    return {
      success: true,
      verified,
      reward,
      message: verified 
        ? `🎉 Congratulations! ${REWARD_AMOUNT} USDC has been sent to your wallet!`
        : 'Verification failed - employment credential required',
      record: verificationRecord
    };

  } catch (error) {
    console.error('❌ Failed to process verification result:', error);
    throw error;
  }
}

/**
 * Check if user has already claimed the $50 USDC reward
 * 
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<Object>} Claim status
 */
async function checkClaimStatus(userAddress) {
  try {
    const addressLower = userAddress.toLowerCase();
    const claimed = claimedRewards.has(addressLower);

    console.log(`🔍 Checking claim status for ${userAddress}`);
    console.log(`   Claimed: ${claimed ? 'Yes' : 'No'}`);
    
    return {
      success: true,
      userAddress,
      claimed,
      rewardAmount: claimed ? 0 : REWARD_AMOUNT,
      rewardToken: 'USDC',
      message: claimed 
        ? 'Reward already claimed'
        : `${REWARD_AMOUNT} USDC available to claim`
    };

  } catch (error) {
    console.error('Failed to check claim status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export all functions
module.exports = {
  prepareVerification,
  processVerificationResult,
  checkClaimStatus,
  generateVerificationAuthToken
};
```

### What This Code Does:

**1. generateVerificationAuthToken()**
- Creates a JWT signed with your private key
- Proves to AIR Kit you're authorized
- Short expiry (5 minutes) for security

**2. prepareVerification()**
- Called when user clicks "Verify & Claim $50"
- Generates auth token
- Returns verification parameters for frontend
- Checks if user already claimed (prevents double-claiming)
- Includes reward info for display

**3. transferUSDC()**
- Connects to blockchain via ethers.js
- Transfers USDC using ERC20 contract
- USDC has 6 decimals (not 18)
- Returns transaction hash

**4. processVerificationResult()**
- Called after verification completes
- Transfers $50 USDC if verified
- Marks address as claimed
- Returns success message with TX hash

**5. checkClaimStatus()**
- Quick check if user already claimed
- Returns claimed status and available reward
- Used for UI display

---

## Step 2.2: Create Verification Routes

### File Location:
```
backend/src/routes/verification.js
```

### Implementation:

Create `backend/src/routes/verification.js`:

```javascript
/**
 * Verification Routes - $50 USDC Faucet
 * 
 * API endpoints for credential verification and USDC reward claiming
 */

const express = require('express');
const router = express.Router();
const { 
  prepareVerification, 
  processVerificationResult,
  checkClaimStatus
} = require('../services/verificationService');

/**
 * POST /api/verification/prepare
 * 
 * Prepare a verification request for $50 USDC reward
 * Returns auth token and verification parameters
 * Checks if user has already claimed
 * 
 * Body:
 * {
 *   userId: string,              // AIR Kit user ID
 *   email: string,               // User email
 *   targetUserAddress: string,   // Wallet address to verify
 *   requiredCredentialType: string // Usually 'EMPLOYMENT'
 * }
 */
router.post('/prepare', async (req, res) => {
  try {
    const { 
      userId, 
      email, 
      targetUserAddress, 
      requiredCredentialType 
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    // Prepare verification
    const result = await prepareVerification({
      userId,
      email,
      targetUserAddress,
      requiredCredentialType
    });

    res.json(result);

  } catch (error) {
    console.error('Verification prepare error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to prepare verification'
    });
  }
});

/**
 * POST /api/verification/result
 * 
 * Process verification result from frontend
 * Stores result and transfers $50 USDC if verified
 * 
 * Body:
 * {
 *   userAddress: string,    // User wallet address
 *   verified: boolean,      // Verification success/fail
 *   proofData: object,      // ZK proof data
 *   credentialType: string  // Type of credential verified
 * }
 */
router.post('/result', async (req, res) => {
  try {
    const { userAddress, verified, proofData, credentialType } = req.body;

    // Validate required fields
    if (!userAddress || verified === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, verified'
      });
    }

    // Process result
    const result = await processVerificationResult({
      userAddress,
      verified,
      proofData,
      credentialType
    });

    res.json(result);

  } catch (error) {
    console.error('Verification result error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process verification result'
    });
  }
});

/**
 * GET /api/verification/claim-status/:address
 * 
 * Check if user has already claimed the $50 USDC reward
 * Returns claimed status and available reward amount
 */
router.get('/claim-status/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing address parameter'
      });
    }

    const result = await checkClaimStatus(address);
    res.json(result);

  } catch (error) {
    console.error('Claim status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check claim status'
    });
  }
});

module.exports = router;
```

### API Endpoints Summary:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/verification/prepare` | POST | Start verification, get auth token |
| `/api/verification/result` | POST | Process verification result, transfer USDC |
| `/api/verification/claim-status/:address` | GET | Check if user claimed $50 USDC |

---

## Step 2.3: Register Routes

### Update Backend Server:

Edit `backend/src/server.js`:

```javascript
// Add import at top of file (with other route imports)
const verificationRoutes = require('./routes/verification');

// Add route registration (after credentials routes)
app.use('/api/verification', verificationRoutes);

console.log('✅ Verification routes registered');
```

### Full Example:

```javascript
// backend/src/server.js

const express = require('express');
const cors = require('cors');
const credentialRoutes = require('./routes/credentials');
const verificationRoutes = require('./routes/verification'); // NEW

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/credentials', credentialRoutes);
app.use('/api/verification', verificationRoutes); // NEW

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`✅ Credential routes: /api/credentials/*`);
  console.log(`✅ Verification routes: /api/verification/*`); // NEW
});
```

---

## Step 2.4: Test Backend Endpoints

### Start Backend:

```bash
cd backend
npm run dev
```

Expected output:
```
🚀 Backend server running on port 3001
✅ Credential routes: /api/credentials/*
✅ Verification routes: /api/verification/*
```

### Test 1: Prepare Verification

```bash
curl -X POST http://localhost:3001/api/verification/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "email": "test@example.com",
    "targetUserAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "requiredCredentialType": "EMPLOYMENT"
  }'
```

Expected response:
```json
{
  "success": true,
  "authToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6InZlcmlmaWVyLWtleS0xIn0...",
  "verifierDid": "did:moca:0x123...",
  "programId": "abc-123-def-456",
  "targetUserAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "reward": {
    "amount": 50,
    "token": "USDC",
    "claimed": false
  }
}
```

### Test 2: Process Result

```bash
curl -X POST http://localhost:3001/api/verification/result \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "verified": true,
    "proofData": {"proof": "test"},
    "credentialType": "EMPLOYMENT"
  }'
```

Expected response:
```json
{
  "success": true,
  "verified": true,
  "reward": {
    "amount": 50,
    "token": "USDC",
    "txHash": "0xabc123def456...",
    "claimed": true,
    "timestamp": 1234567890
  },
  "message": "🎉 Congratulations! 50 USDC has been sent to your wallet!"
}
```

### Test 3: Check Claim Status

```bash
curl http://localhost:3001/api/verification/claim-status/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

Expected response:
```json
{
  "success": true,
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "claimed": false,
  "rewardAmount": 50,
  "rewardToken": "USDC",
  "message": "50 USDC available to claim"
}
```

---

## Phase 2 Complete! ✅

### Checklist:

Before moving to Phase 3, verify:

- [ ] `verificationService.js` created in `backend/src/services/`
- [ ] All 5 functions implemented:
  - [ ] `generateVerificationAuthToken()`
  - [ ] `prepareVerification()`
  - [ ] `transferUSDC()`
  - [ ] `processVerificationResult()`
  - [ ] `checkClaimStatus()`
- [ ] `verification.js` routes created in `backend/src/routes/`
- [ ] All 3 endpoints implemented:
  - [ ] `POST /api/verification/prepare`
  - [ ] `POST /api/verification/result`
  - [ ] `GET /api/verification/claim-status/:address`
- [ ] Routes registered in `server.js`
- [ ] Backend starts without errors
- [ ] Test endpoints return expected responses
- [ ] Auth token generation works
- [ ] USDC transfer logic implemented (with 6 decimals)
- [ ] Claim tracking prevents double-claiming

### What You Built:

You've created the **backend USDC faucet infrastructure** that:
- ✅ Prepares verification requests with auth tokens
- ✅ Processes verification results
- ✅ Transfers $50 USDC to verified users
- ✅ Tracks claims to prevent double-claiming
- ✅ Provides claim status checking

### Next Steps:

**Ready for Phase 3?**

Once all checkboxes above are ✅, you're ready to build the frontend verification service.

**Phase 3 will:**
- Create frontend verification service
- Integrate with AIR Kit
- Handle verification widget
- Add simulation fallback

**Time for Phase 3:** ~1 hour

➡️ **Continue to:** [PHASE-3-FRONTEND-SERVICE.md](./PHASE-3-FRONTEND-SERVICE.md)

---

**Phase 2 Complete! Backend verification service ready.** 🚀

