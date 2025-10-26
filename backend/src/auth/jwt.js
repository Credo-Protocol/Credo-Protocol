/**
 * Partner JWT Generation for AIR Kit Integration
 * 
 * Based on MOCA documentation:
 * https://docs.moca.network/airkit/usage/partner-authentication
 * 
 * Uses RS256 with RSA key pair as required by MOCA:
 * - Private key (private.key) for signing
 * - Public key (public.key) exposed via JWKS endpoint
 * - Kid (Key ID) header for key identification
 * - AIR Kit validates using our JWKS URL
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { getKid } = require('./jwks');

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
    scope: scope,
    iat: now,                  // Issued at
    exp: now + 300             // 5 minutes expiry (MOCA recommendation)
  };
  
  // Load private key for RS256 signing
  const privateKeyPath = path.join(__dirname, '../../private.key');
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  
  // Get consistent kid (Key ID) - must match JWKS
  const kid = getKid();
  
  // Sign with RS256 (required by MOCA)
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    header: {
      kid: kid
    }
  });
  
  console.log(`[JWT] ✅ Generated ${scope} token (RS256, expires in 300s, kid: ${kid})`);
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
    // Load public key for verification
    const publicKeyPath = path.join(__dirname, '../../public.key');
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256']
    });
    
    console.log('[JWT] ✅ Token verified successfully');
    return { valid: true, payload: decoded };
  } catch (error) {
    console.error('[JWT] ❌ Token verification failed:', error.message);
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

