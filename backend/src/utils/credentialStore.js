/**
 * In-Memory Credential Store
 * 
 * Tracks all issued credentials with status (active, expired, revoked).
 * Implements best practices for credential lifecycle management.
 * 
 * In production, replace with a proper database (MongoDB, PostgreSQL, etc.)
 */

class CredentialStore {
  constructor() {
    this.credentials = new Map(); // userAddress -> array of credentials
    this.credentialById = new Map(); // credentialId -> credential object
  }

  /**
   * Track a newly issued credential
   */
  trackIssuedCredential(data) {
    const {
      userAddress,
      credentialType,
      credentialId, // programId from AIR Kit
      bucket,
      weight,
      issuanceDate,
      expirationDate,
      issuerDid,
      schemaId
    } = data;

    const credential = {
      id: credentialId,
      userAddress,
      credentialType,
      bucket,
      weight,
      issuanceDate,
      expirationDate,
      issuerDid,
      schemaId,
      status: 'active',
      issuedAt: new Date().toISOString(),
      revokedAt: null,
      revocationReason: null
    };

    // Store by ID
    this.credentialById.set(credentialId, credential);

    // Store by user
    if (!this.credentials.has(userAddress)) {
      this.credentials.set(userAddress, []);
    }
    this.credentials.get(userAddress).push(credential);

    console.log(`📝 Tracked credential: ${bucket} for ${userAddress}`);
    return credential;
  }

  /**
   * Get all credentials for a user
   */
  getUserCredentials(userAddress) {
    const userCreds = this.credentials.get(userAddress) || [];
    
    // Update status based on expiration
    return userCreds.map(cred => ({
      ...cred,
      status: this.getCredentialStatus(cred)
    }));
  }

  /**
   * Get credential status (active, expired, revoked)
   */
  getCredentialStatus(credential) {
    if (credential.status === 'revoked') {
      return 'revoked';
    }

    const now = Math.floor(Date.now() / 1000);
    if (credential.expirationDate && credential.expirationDate < now) {
      return 'expired';
    }

    return 'active';
  }

  /**
   * Check if credential is valid (not expired or revoked)
   */
  isCredentialValid(credentialId) {
    const credential = this.credentialById.get(credentialId);
    if (!credential) return false;

    const status = this.getCredentialStatus(credential);
    return status === 'active';
  }

  /**
   * Revoke a credential
   */
  revokeCredential(credentialId, reason = 'Admin revocation') {
    const credential = this.credentialById.get(credentialId);
    if (!credential) {
      throw new Error('Credential not found');
    }

    if (credential.status === 'revoked') {
      throw new Error('Credential already revoked');
    }

    credential.status = 'revoked';
    credential.revokedAt = new Date().toISOString();
    credential.revocationReason = reason;

    console.log(`🚫 Revoked credential: ${credentialId} - Reason: ${reason}`);
    return credential;
  }

  /**
   * Get credential by ID
   */
  getCredential(credentialId) {
    return this.credentialById.get(credentialId);
  }

  /**
   * Get statistics
   */
  getStats() {
    let totalActive = 0;
    let totalExpired = 0;
    let totalRevoked = 0;

    for (const credential of this.credentialById.values()) {
      const status = this.getCredentialStatus(credential);
      if (status === 'active') totalActive++;
      else if (status === 'expired') totalExpired++;
      else if (status === 'revoked') totalRevoked++;
    }

    return {
      total: this.credentialById.size,
      active: totalActive,
      expired: totalExpired,
      revoked: totalRevoked,
      users: this.credentials.size
    };
  }
}

// Singleton instance
const credentialStore = new CredentialStore();

module.exports = credentialStore;

