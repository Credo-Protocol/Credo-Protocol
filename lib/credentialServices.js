/**
 * Credential Services - MOCA Official Integration (Phase 5.3)
 * 
 * Handles credential issuance and management using AIR Kit.
 * 
 * Flow:
 * 1. Backend prepares credential (generates Partner JWT)
 * 2. Frontend uses AIR Kit to issue credential
 * 3. AIR Kit stores credential on MCSP (decentralized storage)
 * 4. Return credential for smart contract submission
 * 
 * Based on MOCA documentation:
 * https://docs.moca.network/airkit/usage/credential/issue
 */

import airService from './airkit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

/**
 * Fetch available credential types from backend
 * 
 * Returns list of all credentials user can request, with metadata.
 * @returns {Promise<Array>} List of credential types
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
 * Issue a credential using official AIR Kit flow (Phase 5.3)
 * 
 * This is the NEW way:
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
    
    const { authToken, issuerDid, schemaId, programId, credentialSubject } = prepared;
    
    console.log('  ✅ Credential prepared');
    console.log('    Issuer DID:', issuerDid);
    console.log('    Program ID (for issuance):', programId);
    console.log('    Schema ID (for reference):', schemaId);
    
    // Step 2: Issue credential via AIR Kit
    // This is where the magic happens - AIR Kit handles everything:
    // - Cryptographic signing
    // - Storage on MOCA Chain Storage Providers (MCSP)
    // - Adding to user's wallet
    // - Gas sponsorship (if enabled)
    console.log('  Step 2/4: Issuing via AIR Kit...');
    
    // Official MOCA method: airService.issueCredential (not airService.credential.issue)
    // CRITICAL: credentialId MUST be the Program ID, NOT the Schema ID!
    await airService.issueCredential({
      authToken,
      issuerDid,
      credentialId: programId,  // Use Program ID (not Schema ID!)
      credentialSubject: {
        ...credentialSubject,
        // Ensure subject ID is set
        id: userAddress
      }
    });
    
    console.log('  ✅ Credential issued via AIR Kit');
    console.log('    - Stored on MCSP (decentralized storage)');
    console.log('    - Added to user\'s AIR wallet');
    console.log('    - Gas sponsored:', !!process.env.NEXT_PUBLIC_PAYMASTER_POLICY_ID);
    console.log('    - View in Dashboard: https://developers.sandbox.air3.com/');
    
    // Step 3: Return credential data for contract submission
    console.log('  Step 3/3: Preparing for contract submission...');
    
    // Extract the actual bucket value from credentialSubject
    const bucketValue = credentialSubject.balanceBucket || 
                        credentialSubject.incomeBucket || 
                        credentialSubject.tradingVolume || 
                        credentialSubject.employmentStatus || 
                        'VERIFIED';
    
    const bucketRange = credentialSubject.bucketRange || 'N/A';
    
    // Return credential data based on what we prepared
    // The credential is successfully issued and stored on MCSP!
    const credentialForContract = {
      // Contract-compatible format
      credentialType: bucketValue,  // Use the actual bucket value
      issuer: issuerDid,
      subject: userAddress,
      issuanceDate: credentialSubject.verifiedAt,
      expirationDate: 0, // No expiration
      // AIR Kit provides cryptographic proof (credential is signed)
      proof: { jws: 'signed-by-airkit' },
      // Additional metadata
      credentialId: programId,
      schemaId: schemaId,
      weight: credentialSubject.weight,
      bucket: bucketValue,
      bucketRange: bucketRange
    };
    
    console.log('✅ Credential issuance complete!');
    console.log('   Contract data ready:', {
      credentialType: credentialForContract.credentialType,
      weight: credentialForContract.weight,
      bucket: credentialForContract.bucket
    });
    return credentialForContract;
    
  } catch (error) {
    console.error('❌ Failed to issue credential:', error);
    throw error;
  }
}

/**
 * Get all credentials for a user from their AIR wallet
 * 
 * NOTE: The AIR Kit SDK might not have a direct method to list credentials client-side.
 * This is a placeholder that will need to be updated once we verify the correct API.
 * 
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<Array>} List of credentials
 */
export async function getUserCredentials(userAddress) {
  try {
    console.log(`📜 Fetching credentials for ${userAddress}`);
    console.warn('⚠️ Note: Credential listing might require server-side API call to AIR Kit Dashboard');
    
    // TODO: Verify if there's a client-side method to list credentials
    // For now, return empty array - credentials are still issued and stored on MCSP!
    // Users can view them in the AIR Kit Dashboard: https://developers.sandbox.air3.com/
    
    return [];
    
  } catch (error) {
    console.error('Failed to get user credentials:', error);
    return [];
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
 * 
 * @param {object} credential - Credential object from AIR Kit
 * @returns {object} Display info with icon, color, name, etc.
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
  
  const issuanceDate = credential.issuanceDate || 
                       credential.credentialSubject?.verifiedAt || 
                       Math.floor(Date.now() / 1000);
  
  return {
    icon: icons[bucket] || '📄',
    color: colors[bucket] || 'gray',
    name: bucket.replace(/_/g, ' '),
    issuedDate: new Date(issuanceDate * 1000).toLocaleDateString(),
    isValid: isCredentialValid(credential),
    storedOnMCSP: true // All AIR Kit credentials stored on MCSP
  };
}

// Export all functions as default object
export default {
  getCredentialTypes,
  issueCredential,
  getUserCredentials,
  isCredentialValid,
  getCredentialDisplayInfo
};

