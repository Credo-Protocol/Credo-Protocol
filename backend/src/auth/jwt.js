/**
 * Partner JWT Generation for AIR Kit Integration
 * 
 * Based on MOCA documentation:
 * https://docs.moca.network/airkit/usage/partner-authentication
 * 
 * Partner JWTs are used by frontend to authenticate with AIR Kit
 * when issuing or verifying credentials.
 * 
 * Flow:
 * 1. Frontend calls your backend: "Give me auth token"
 * 2. Backend generates JWT signed with Partner Secret
 * 3. Frontend passes JWT to airService.credential.issue()
 * 4. AIR Kit validates JWT and proceeds with credential issuance
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

