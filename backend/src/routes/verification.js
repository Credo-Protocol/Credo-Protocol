/**
 * Verification Routes - $50 USDC Faucet
 * 
 * API endpoints for credential verification and USDC reward claiming.
 * 
 * Endpoints:
 * - POST /api/verification/prepare - Start verification
 * - POST /api/verification/result - Process result + transfer USDC
 * - GET /api/verification/claim-status/:address - Check if claimed
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
 * Prepare a verification request for $50 USDC reward.
 * Returns auth token and verification parameters.
 * Checks if user has already claimed.
 * 
 * Request Body:
 * {
 *   userId: string,              // AIR Kit user ID (required)
 *   email: string,               // User email (optional)
 *   targetUserAddress: string,   // Wallet address to verify (required)
 *   requiredCredentialType: string // Usually 'EMPLOYMENT' (optional)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   authToken: string,           // Partner JWT for AIR Kit
 *   verifierDid: string,         // Verifier DID
 *   programId: string,           // Verification program ID
 *   targetUserAddress: string,   // User to verify
 *   requiredCredentialType: string,
 *   reward: {
 *     amount: 50,
 *     token: 'USDC',
 *     claimed: false
 *   }
 * }
 */
router.post('/prepare', async (req, res) => {
  try {
    console.log('[API] POST /api/verification/prepare');
    console.log('   Body:', JSON.stringify(req.body, null, 2));
    
    const { 
      userId, 
      email, 
      targetUserAddress, 
      requiredCredentialType 
    } = req.body;

    // Validate required fields
    if (!userId) {
      console.error('[API] ❌ Missing required field: userId');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    if (!targetUserAddress) {
      console.error('[API] ❌ Missing required field: targetUserAddress');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: targetUserAddress'
      });
    }

    // Prepare verification
    const result = await prepareVerification({
      userId,
      email,
      targetUserAddress,
      requiredCredentialType: requiredCredentialType || 'EMPLOYMENT'
    });

    console.log('[API] ✅ Verification prepared successfully');
    res.json(result);

  } catch (error) {
    console.error('[API] ❌ Verification prepare error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to prepare verification'
    });
  }
});

/**
 * POST /api/verification/result
 * 
 * Process verification result from frontend.
 * Stores result and transfers $50 USDC if verified.
 * 
 * Request Body:
 * {
 *   userAddress: string,    // User wallet address (required)
 *   verified: boolean,      // Verification success/fail (required)
 *   proofData: object,      // ZK proof data (optional)
 *   credentialType: string  // Type of credential verified (optional)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   verified: boolean,
 *   reward: {
 *     amount: 50,
 *     token: 'USDC',
 *     txHash: '0x...',
 *     claimed: true,
 *     timestamp: 1234567890
 *   },
 *   message: string,
 *   record: object
 * }
 */
router.post('/result', async (req, res) => {
  try {
    console.log('[API] POST /api/verification/result');
    console.log('   Body:', JSON.stringify(req.body, null, 2));
    
    const { userAddress, verified, proofData, credentialType } = req.body;

    // Validate required fields
    if (!userAddress) {
      console.error('[API] ❌ Missing required field: userAddress');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userAddress'
      });
    }
    
    if (verified === undefined) {
      console.error('[API] ❌ Missing required field: verified');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: verified'
      });
    }

    // Process result
    const result = await processVerificationResult({
      userAddress,
      verified,
      proofData,
      credentialType: credentialType || 'EMPLOYMENT'
    });

    console.log('[API] ✅ Verification result processed');
    res.json(result);

  } catch (error) {
    console.error('[API] ❌ Verification result error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process verification result'
    });
  }
});

/**
 * GET /api/verification/claim-status/:address
 * 
 * Check if user has already claimed the $50 USDC reward.
 * Returns claimed status and available reward amount.
 * 
 * URL Parameters:
 * - address: string (wallet address)
 * 
 * Response:
 * {
 *   success: true,
 *   userAddress: string,
 *   claimed: boolean,
 *   rewardAmount: number,      // 50 if unclaimed, 0 if claimed
 *   rewardToken: 'USDC',
 *   message: string
 * }
 */
router.get('/claim-status/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    console.log('[API] GET /api/verification/claim-status/:address');
    console.log('   Address:', address);

    // Validate address parameter
    if (!address) {
      console.error('[API] ❌ Missing address parameter');
      return res.status(400).json({
        success: false,
        error: 'Missing address parameter'
      });
    }

    // Check claim status
    const result = await checkClaimStatus(address);
    
    console.log('[API] ✅ Claim status retrieved');
    res.json(result);

  } catch (error) {
    console.error('[API] ❌ Claim status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check claim status'
    });
  }
});

module.exports = router;

