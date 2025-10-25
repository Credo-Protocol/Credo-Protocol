/**
 * Mock Exchange Issuer - Phase 2 Compatible
 * 
 * Simulates a centralized exchange (CEX) that issues credentials
 * proving a user's trading history and account status.
 * 
 * In production, this would integrate with real exchange APIs and
 * use zero-knowledge proofs to prove trading volume without revealing
 * exact amounts or transaction details.
 */

const { ethers } = require('ethers');

class MockExchangeIssuer {
  constructor(privateKey) {
    this.privateKey = privateKey;
    this.wallet = new ethers.Wallet(privateKey);
    this.issuerAddress = this.wallet.address;
  }

  /**
   * Issue CEX history credential
   * @param {string} userAddress - User's wallet address
   * @param {string} credentialType - Credential type to issue (for routing)
   * @returns {Object} - Signed credential ready for blockchain submission
   */
  async issueCredential(userAddress, credentialType = 'cex-history') {
    console.log(`[Mock Exchange] Issuing CEX history credential for ${userAddress}`);

    const timestamp = Math.floor(Date.now() / 1000);
    const expirationDate = timestamp + (180 * 24 * 60 * 60); // 6 months
    const credType = 'CEX_HISTORY';
    const credentialTypeHash = ethers.id(credType);

    // Encode credential data for signature
    const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['string', 'address', 'address', 'uint256', 'uint256'],
      [credType, this.issuerAddress, userAddress, timestamp, expirationDate]
    );

    // Sign the credential data
    const messageHash = ethers.keccak256(credentialData);
    const signature = await this.wallet.signMessage(ethers.getBytes(messageHash));

    const credential = {
      credentialType: credType,
      credentialTypeHash: credentialTypeHash,
      issuer: this.issuerAddress,
      subject: userAddress,
      issuanceDate: timestamp,
      expirationDate: expirationDate,
      metadata: {
        weight: 80,
        display: 'CEX Trading History',
        description: 'Verified centralized exchange trading history',
        tradingVolume: 'Simulated',
        accountAge: 'Simulated'
      }
    };

    return {
      credential,
      credentialData,
      signature,
      issuer: this.issuerAddress
    };
  }
}

module.exports = MockExchangeIssuer;
