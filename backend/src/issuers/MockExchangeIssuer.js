/**
 * Mock Exchange Issuer
 * 
 * Simulates a centralized exchange (CEX) that issues credentials
 * proving a user's trading history and account status.
 * 
 * In production, this would integrate with real exchange APIs and
 * use zero-knowledge proofs to prove trading volume without revealing
 * exact amounts or transaction details.
 */

const { signCredential, validateCredentialData } = require('../utils/credentialSigner');

class MockExchangeIssuer {
  /**
   * Initialize the exchange issuer
   * 
   * @param {ethers.Wallet} signerWallet - Wallet with issuer's private key
   */
  constructor(signerWallet) {
    this.name = 'Mock CEX';
    this.description = 'Centralized Exchange Credential Issuer';
    this.signerWallet = signerWallet;
    this.issuerAddress = signerWallet.address;
    
    // Credential Type 2: Proof of CEX History
    this.credentialType = 2;
    
    // Weight in scoring algorithm: 80 points
    this.scoreWeight = 80;
    
    // Default expiration: 180 days (6 months)
    this.defaultExpirationDays = 180;
  }

  /**
   * Issue a credential to a user
   * 
   * @param {string} userAddress - User's wallet address
   * @param {Object} mockData - Mock trading data for simulation
   * @param {string} mockData.tradingVolume - "low" | "medium" | "high"
   * @param {string} mockData.accountAge - "new" | "1_year" | "2_years"
   * @param {boolean} mockData.neverLiquidated - Whether user was liquidated
   * @returns {Object} - Signed credential ready for blockchain submission
   */
  async issueCredential(userAddress, mockData = {}) {
    console.log(`[${this.name}] Issuing credential for ${userAddress}`);

    // Set default values if not provided
    const tradingData = {
      tradingVolume: mockData.tradingVolume || 'high',
      accountAge: mockData.accountAge || '2_years',
      neverLiquidated: mockData.neverLiquidated !== undefined ? mockData.neverLiquidated : true
    };

    // Calculate timestamps
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + (this.defaultExpirationDays * 24 * 60 * 60);

    // Build credential data structure
    const credentialData = {
      type: 'ProofOfCEXHistory',
      issuer: this.issuerAddress,
      subject: userAddress,
      credentialType: this.credentialType,
      issuedAt,
      expiresAt,
      claims: {
        tradingVolume: tradingData.tradingVolume,
        accountAge: tradingData.accountAge,
        neverLiquidated: tradingData.neverLiquidated,
        // In production, this would be a real ZK proof
        zkProof: '0x' + Buffer.from('mock_zk_proof_cex').toString('hex')
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
      credentialTypeName: 'ProofOfCEXHistory',
      scoreWeight: this.scoreWeight,
      expirationDays: this.defaultExpirationDays,
      benefits: [
        '+80 points to credit score',
        'Demonstrates trading experience',
        'Valid for 6 months'
      ]
    };
  }
}

module.exports = MockExchangeIssuer;

