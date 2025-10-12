/**
 * Mock Bank Issuer
 * 
 * Simulates a bank or financial institution that issues credentials
 * proving a user's account balance and financial stability.
 * 
 * In production, this would integrate with banking APIs (e.g., Plaid)
 * and use zero-knowledge proofs to prove balance thresholds without
 * revealing exact amounts or account details.
 */

const { signCredential, validateCredentialData } = require('../utils/credentialSigner');

class MockBankIssuer {
  /**
   * Initialize the bank issuer
   * 
   * @param {ethers.Wallet} signerWallet - Wallet with issuer's private key
   */
  constructor(signerWallet) {
    this.name = 'Mock Bank';
    this.description = 'Financial Stability Verification Service';
    this.signerWallet = signerWallet;
    this.issuerAddress = signerWallet.address;
    
    // Credential Type 1: Proof of Stable Balance
    this.credentialType = 1;
    
    // Weight in scoring algorithm: 100 points
    this.scoreWeight = 100;
    
    // Default expiration: 90 days (3 months)
    this.defaultExpirationDays = 90;
  }

  /**
   * Issue a credential to a user
   * 
   * @param {string} userAddress - User's wallet address
   * @param {Object} mockData - Mock banking data for simulation
   * @param {boolean} mockData.hasStableBalance - Has balance > threshold
   * @param {string} mockData.balanceThreshold - "5000" | "10000" | "25000"
   * @param {string} mockData.duration - "3_months" | "6_months" | "12_months"
   * @returns {Object} - Signed credential ready for blockchain submission
   */
  async issueCredential(userAddress, mockData = {}) {
    console.log(`[${this.name}] Issuing credential for ${userAddress}`);

    // Set default values if not provided
    const bankingData = {
      hasStableBalance: mockData.hasStableBalance !== undefined ? mockData.hasStableBalance : true,
      balanceThreshold: mockData.balanceThreshold || '10000',
      duration: mockData.duration || '6_months'
    };

    // Calculate timestamps
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + (this.defaultExpirationDays * 24 * 60 * 60);

    // Build credential data structure
    const credentialData = {
      type: 'ProofOfStableBalance',
      issuer: this.issuerAddress,
      subject: userAddress,
      credentialType: this.credentialType,
      issuedAt,
      expiresAt,
      claims: {
        hasStableBalance: bankingData.hasStableBalance,
        balanceThreshold: bankingData.balanceThreshold,
        duration: bankingData.duration,
        // In production, this would be a real ZK proof
        // proving balance > threshold without revealing exact amount
        zkProof: '0x' + Buffer.from('mock_zk_proof_balance').toString('hex')
      },
      metadata: {
        issuerName: this.name,
        scoreWeight: this.scoreWeight,
        expirationDays: this.defaultExpirationDays
      }
    };

    // Validate the credential data
    validateCredentialData(credentialData);

    // Sign the credential
    const signedData = await signCredential(credentialData, this.signerWallet);

    console.log(`[${this.name}] Credential issued successfully`);
    console.log(`[${this.name}] Credential Hash: ${signedData.credentialHash}`);

    return {
      success: true,
      credential: credentialData,
      encodedData: signedData.encodedData,
      signature: signedData.signature,
      credentialHash: signedData.credentialHash
    };
  }

  /**
   * Get issuer information for display
   * 
   * @returns {Object} - Public issuer information
   */
  getInfo() {
    return {
      name: this.name,
      description: this.description,
      address: this.issuerAddress,
      credentialType: this.credentialType,
      credentialTypeName: 'ProofOfStableBalance',
      scoreWeight: this.scoreWeight,
      expirationDays: this.defaultExpirationDays,
      benefits: [
        '+100 points to credit score',
        'Demonstrates financial stability',
        'Valid for 3 months'
      ]
    };
  }
}

module.exports = MockBankIssuer;

