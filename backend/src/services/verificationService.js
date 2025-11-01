/**
 * $50 USDC Verification Faucet Service
 * 
 * Handles credential verification and USDC rewards.
 * Users verify employment → get $50 USDC instantly (one-time).
 * 
 * Based on: https://docs.moca.network/airkit/usage/credential/verify
 */

const { ethers } = require('ethers');
const { generateVerifyToken } = require('../auth/jwt');

// Load configuration from environment
const VERIFIER_DID = process.env.VERIFIER_DID;
const VERIFICATION_PROGRAM_ID = process.env.VERIFICATION_PROGRAM_ID;
const PARTNER_ID = process.env.PARTNER_ID;

// Reward configuration
const REWARD_AMOUNT = parseFloat(process.env.REWARD_AMOUNT || '50');
const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS;
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || 'https://devnet-rpc.mocachain.org';

// In-memory claim tracking (TODO: Use database in production)
// Stores lowercase wallet addresses that have claimed the $50 USDC reward
const claimedRewards = new Set();

/**
 * Generate verification auth token (Partner JWT)
 * 
 * Creates a signed JWT that proves to AIR Kit we're authorized to request verification.
 * This token is passed to the frontend, which then uses it with airService.verifyCredential().
 * 
 * @param {string} userId - AIR Kit user ID (wallet address or internal ID)
 * @param {string} email - User email (optional but recommended)
 * @returns {string} JWT token for verification (valid for 5 minutes)
 */
function generateVerificationAuthToken(userId, email) {
  try {
    console.log('[VerificationService] 🔐 Generating verification auth token');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email || 'none'}`);
    
    // Use existing JWT generation from Phase 5
    // Scope: 'verify' tells AIR Kit this token is for credential verification
    const token = generateVerifyToken(userId, email);
    
    console.log('[VerificationService] ✅ Auth token generated (RS256, 5min expiry)');
    return token;
    
  } catch (error) {
    console.error('[VerificationService] ❌ Failed to generate auth token:', error);
    throw new Error(`Auth token generation failed: ${error.message}`);
  }
}

/**
 * Prepare verification request
 * 
 * Creates auth token and verification parameters for frontend.
 * Frontend will use this to initiate AIR Kit verification widget.
 * Also checks if user has already claimed the $50 USDC reward.
 * 
 * @param {Object} params - Verification parameters
 * @param {string} params.userId - AIR Kit user ID
 * @param {string} params.email - User email
 * @param {string} params.targetUserAddress - Address of user to verify
 * @param {string} params.requiredCredentialType - Type of credential (optional, default: EMPLOYMENT)
 * @returns {Promise<Object>} Verification request data with auth token
 */
async function prepareVerification({ 
  userId, 
  email, 
  targetUserAddress, 
  requiredCredentialType = 'EMPLOYMENT'
}) {
  try {
    console.log('[VerificationService] 🔍 Preparing $50 USDC verification');
    console.log(`   User: ${userId}`);
    console.log(`   Target Address: ${targetUserAddress}`);
    console.log(`   Required Credential: ${requiredCredentialType}`);

    // Validate required parameters
    if (!userId) {
      throw new Error('userId is required');
    }
    if (!targetUserAddress) {
      throw new Error('targetUserAddress is required');
    }

    // Check if user already claimed the $50 USDC reward
    const addressLower = targetUserAddress.toLowerCase();
    if (claimedRewards.has(addressLower)) {
      throw new Error('Reward already claimed by this address');
    }

    // Generate auth token for AIR Kit verification
    const authToken = generateVerificationAuthToken(userId, email);

    // Build verification parameters for frontend
    const verificationParams = {
      verifierDid: VERIFIER_DID,
      programId: VERIFICATION_PROGRAM_ID,
      targetUserAddress,
    };

    console.log('[VerificationService] ✅ Verification request prepared');
    console.log(`   Verifier DID: ${VERIFIER_DID}`);
    console.log(`   Program ID: ${VERIFICATION_PROGRAM_ID}`);
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
    console.error('[VerificationService] ❌ Failed to prepare verification:', error);
    throw error;
  }
}

/**
 * Transfer USDC to user's wallet
 * 
 * Simple faucet-style transfer of $50 USDC.
 * Uses treasury wallet (deployer) to send USDC to verified user.
 * 
 * @param {string} toAddress - Recipient wallet address
 * @param {number} amount - Amount of USDC to transfer (e.g., 50)
 * @returns {Promise<string>} Transaction hash
 */
async function transferUSDC(toAddress, amount) {
  try {
    console.log(`[VerificationService] 💸 Transferring ${amount} USDC to ${toAddress}...`);

    // Validate inputs
    if (!toAddress || !ethers.isAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }
    if (!USDC_CONTRACT_ADDRESS) {
      throw new Error('USDC_CONTRACT_ADDRESS not configured');
    }
    if (!TREASURY_PRIVATE_KEY) {
      throw new Error('TREASURY_PRIVATE_KEY not configured');
    }

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);

    console.log(`   Treasury wallet: ${wallet.address}`);
    console.log(`   USDC contract: ${USDC_CONTRACT_ADDRESS}`);

    // Check treasury balance first
    const usdcContract = new ethers.Contract(
      USDC_CONTRACT_ADDRESS,
      [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function balanceOf(address account) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ],
      wallet
    );

    // Get decimals (should be 6 for USDC)
    const decimals = await usdcContract.decimals();
    console.log(`   USDC decimals: ${decimals}`);

    // Check treasury balance
    const treasuryBalance = await usdcContract.balanceOf(wallet.address);
    const treasuryBalanceFormatted = ethers.formatUnits(treasuryBalance, decimals);
    console.log(`   Treasury balance: ${treasuryBalanceFormatted} USDC`);

    // Convert amount to proper decimals (USDC has 6 decimals, not 18)
    const amountInWei = ethers.parseUnits(amount.toString(), decimals);
    console.log(`   Transferring: ${amount} USDC (${amountInWei.toString()} units)`);

    // Check if treasury has enough USDC
    if (treasuryBalance < amountInWei) {
      throw new Error(`Insufficient USDC in treasury. Has: ${treasuryBalanceFormatted}, Needs: ${amount}`);
    }

    // Send transaction
    const tx = await usdcContract.transfer(toAddress, amountInWei);
    console.log(`   TX sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);

    return tx.hash;

  } catch (error) {
    console.error('[VerificationService] ❌ USDC transfer failed:', error);
    throw new Error(`USDC transfer failed: ${error.message}`);
  }
}

/**
 * Process verification result and transfer USDC reward
 * 
 * Called after AIR Kit completes verification.
 * If verified → transfers $50 USDC to user (one-time only).
 * Records the claim to prevent double-claiming.
 * 
 * @param {Object} result - Verification result from AIR Kit
 * @param {string} result.userAddress - User's wallet address
 * @param {boolean} result.verified - Whether verification succeeded
 * @param {Object} result.proofData - Zero-knowledge proof data (optional)
 * @param {string} result.credentialType - Type of credential verified
 * @returns {Promise<Object>} Processing result with reward info
 */
async function processVerificationResult(result) {
  try {
    const { userAddress, verified, proofData, credentialType } = result;

    console.log('[VerificationService] 💰 Processing $50 USDC verification reward');
    console.log(`   User: ${userAddress}`);
    console.log(`   Verified: ${verified}`);
    console.log(`   Credential Type: ${credentialType || 'EMPLOYMENT'}`);

    // Validate inputs
    if (!userAddress) {
      throw new Error('userAddress is required');
    }
    if (verified === undefined) {
      throw new Error('verified status is required');
    }

    // Check if already claimed (double-check)
    const addressLower = userAddress.toLowerCase();
    if (claimedRewards.has(addressLower)) {
      throw new Error('Reward already claimed by this address');
    }

    // Create verification record
    const verificationRecord = {
      userAddress,
      verified,
      credentialType: credentialType || 'EMPLOYMENT',
      timestamp: Math.floor(Date.now() / 1000),
      proofHash: proofData ? JSON.stringify(proofData).slice(0, 50) : null
    };

    // Transfer USDC if verified
    let reward = null;
    if (verified) {
      console.log(`   🎉 Verification successful! Transferring ${REWARD_AMOUNT} USDC...`);
      
      // Transfer USDC to user
      const txHash = await transferUSDC(userAddress, REWARD_AMOUNT);
      
      // Mark as claimed (prevent double-claiming)
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
      console.log(`   Total claims: ${claimedRewards.size}`);
      
      // TODO: Store claim in database for production
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
    console.error('[VerificationService] ❌ Failed to process verification result:', error);
    throw error;
  }
}

/**
 * Check if user has already claimed the $50 USDC reward
 * 
 * Quick status check to prevent double-claiming.
 * Used by frontend to show unclaimed/claimed state.
 * 
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<Object>} Claim status
 */
async function checkClaimStatus(userAddress) {
  try {
    const addressLower = userAddress.toLowerCase();
    const claimed = claimedRewards.has(addressLower);

    console.log('[VerificationService] 🔍 Checking claim status for', userAddress);
    console.log(`   Claimed: ${claimed ? 'Yes' : 'No'}`);
    console.log(`   Total claims: ${claimedRewards.size}`);
    
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
    console.error('[VerificationService] ❌ Failed to check claim status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export all functions
module.exports = {
  generateVerificationAuthToken,
  prepareVerification,
  transferUSDC,
  processVerificationResult,
  checkClaimStatus
};

