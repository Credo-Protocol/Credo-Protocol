/**
 * Mock Employer Issuer
 * 
 * Simulates an employer or payroll system that issues credentials
 * proving a user's employment status and history.
 * 
 * In production, this would integrate with HR systems and use
 * zero-knowledge proofs to prove employment without revealing
 * employer identity or salary details.
 */

const { signCredential, validateCredentialData } = require('../utils/credentialSigner');

class MockEmployerIssuer {
  /**
   * Initialize the employer issuer
   * 
   * @param {ethers.Wallet} signerWallet - Wallet with issuer's private key
   */
  constructor(signerWallet) {
    this.name = 'Mock Employer';
    this.description = 'Employment Verification Service';
    this.signerWallet = signerWallet;
    this.issuerAddress = signerWallet.address;
    
    // Credential Type 3: Proof of Employment
    this.credentialType = 3;
    
    // Weight in scoring algorithm: 70 points
    this.scoreWeight = 70;
    
    // Default expiration: 365 days (1 year)
    this.defaultExpirationDays = 365;
  }

  /**
   * Issue a credential to a user
   * 
   * @param {string} userAddress - User's wallet address
   * @param {Object} mockData - Mock employment data for simulation
   * @param {boolean} mockData.employed - Employment status
   * @param {string} mockData.employmentDuration - "6_months" | "1_year" | "3_years"
   * @param {string} mockData.employmentType - "full_time" | "part_time" | "contract"
   * @returns {Object} - Signed credential ready for blockchain submission
   */
  async issueCredential(userAddress, mockData = {}) {
    console.log(`[${this.name}] Issuing credential for ${userAddress}`);

    // Set default values if not provided
    const employmentData = {
      employed: mockData.employed !== undefined ? mockData.employed : true,
      employmentDuration: mockData.employmentDuration || '3_years',
      employmentType: mockData.employmentType || 'full_time'
    };

    // Calculate timestamps
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + (this.defaultExpirationDays * 24 * 60 * 60);

    // Build credential data structure
    const credentialData = {
      type: 'ProofOfEmployment',
      issuer: this.issuerAddress,
      subject: userAddress,
      credentialType: this.credentialType,
      issuedAt,
      expiresAt,
      claims: {
        employed: employmentData.employed,
        employmentDuration: employmentData.employmentDuration,
        employmentType: employmentData.employmentType,
        // In production, this would be a real ZK proof
        // proving employment without revealing employer or salary
        zkProof: '0x' + Buffer.from('mock_zk_proof_employment').toString('hex')
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
      credentialTypeName: 'ProofOfEmployment',
      scoreWeight: this.scoreWeight,
      expirationDays: this.defaultExpirationDays,
      benefits: [
        '+70 points to credit score',
        'Proves stable income source',
        'Valid for 12 months'
      ]
    };
  }
}

module.exports = MockEmployerIssuer;

