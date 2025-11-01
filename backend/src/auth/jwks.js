/**
 * JWKS (JSON Web Key Set) Endpoint
 * 
 * Exposes public key for AIR Kit to validate Partner JWTs
 * Based on: https://datatracker.ietf.org/doc/html/rfc7517
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Load and convert public key to JWKS format
 * This endpoint will be called by AIR Kit to validate JWTs
 */
function getJWKS() {
  try {
    // Load public key from environment variable or file
    let publicKeyPem;
    
    if (process.env.PUBLIC_KEY) {
      // Production: Read from environment variable
      publicKeyPem = process.env.PUBLIC_KEY.replace(/\\n/g, '\n');
    } else {
      // Development: Read from file
      const publicKeyPath = path.join(__dirname, '../../public.key');
      publicKeyPem = fs.readFileSync(publicKeyPath, 'utf8');
    }
    
    // Convert PEM to JWK (JSON Web Key) format
    const publicKey = crypto.createPublicKey(publicKeyPem);
    const jwk = publicKey.export({ format: 'jwk' });
    
    // Generate kid (Key ID) from Partner ID for consistency
    const kid = crypto.createHash('sha256')
      .update(process.env.PARTNER_ID || 'default')
      .digest('hex')
      .substring(0, 16);
    
    // Return JWKS format
    return {
      keys: [
        {
          ...jwk,
          kid: kid,              // Key ID (must match JWT header)
          alg: 'RS256',          // Algorithm
          use: 'sig',            // Usage: signature
          kty: 'RSA'             // Key type
        }
      ]
    };
  } catch (error) {
    console.error('❌ Failed to generate JWKS:', error);
    throw new Error('JWKS generation failed');
  }
}

/**
 * Get the Kid (Key ID) for JWT signing
 * Must match the kid in JWKS
 */
function getKid() {
  return crypto.createHash('sha256')
    .update(process.env.PARTNER_ID || 'default')
    .digest('hex')
    .substring(0, 16);
}

module.exports = {
  getJWKS,
  getKid
};

