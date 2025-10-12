/**
 * Credential Signing Utility
 * 
 * This utility handles the signing of credential data for submission to the
 * CreditScoreOracle smart contract. It uses ethers.js v6 to create signatures
 * that can be verified on-chain.
 */

const { ethers } = require('ethers');

/**
 * Signs credential data according to the contract's expected format
 * 
 * The signature process:
 * 1. Encode the credential data (issuer, subject, type, timestamps)
 * 2. Hash the encoded data using keccak256
 * 3. Sign the hash using EIP-191 personal_sign
 * 
 * @param {Object} credentialData - The credential information
 * @param {string} credentialData.issuer - Issuer's address
 * @param {string} credentialData.subject - User's address
 * @param {number} credentialData.credentialType - Type ID (0-4)
 * @param {number} credentialData.issuedAt - Unix timestamp
 * @param {number} credentialData.expiresAt - Unix timestamp
 * @param {ethers.Wallet} signerWallet - The wallet to sign with
 * @returns {Object} - { encodedData, signature, credentialHash }
 */
async function signCredential(credentialData, signerWallet) {
  try {
    // Encode the credential data using AbiCoder
    // This must match the format expected by the smart contract
    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'uint256', 'uint256', 'uint256'],
      [
        credentialData.issuer,
        credentialData.subject,
        credentialData.credentialType,
        credentialData.issuedAt,
        credentialData.expiresAt
      ]
    );

    // Hash the encoded data
    const credentialHash = ethers.keccak256(encodedData);

    // Sign the hash using EIP-191 personal_sign
    // This adds the "\x19Ethereum Signed Message:\n32" prefix
    const signature = await signerWallet.signMessage(ethers.getBytes(credentialHash));

    return {
      encodedData,
      signature,
      credentialHash
    };
  } catch (error) {
    console.error('Error signing credential:', error);
    throw new Error('Failed to sign credential: ' + error.message);
  }
}

/**
 * Validates that credential data has all required fields
 * 
 * @param {Object} credentialData - The credential to validate
 * @returns {boolean} - true if valid, throws error otherwise
 */
function validateCredentialData(credentialData) {
  const required = ['issuer', 'subject', 'credentialType', 'issuedAt', 'expiresAt'];
  
  for (const field of required) {
    if (credentialData[field] === undefined || credentialData[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate addresses
  if (!ethers.isAddress(credentialData.issuer)) {
    throw new Error('Invalid issuer address');
  }
  if (!ethers.isAddress(credentialData.subject)) {
    throw new Error('Invalid subject address');
  }

  // Validate credential type (0-4)
  if (credentialData.credentialType < 0 || credentialData.credentialType > 4) {
    throw new Error('Invalid credential type. Must be 0-4');
  }

  // Validate timestamps
  if (credentialData.issuedAt > credentialData.expiresAt) {
    throw new Error('Expiration must be after issuance');
  }

  return true;
}

module.exports = {
  signCredential,
  validateCredentialData
};

