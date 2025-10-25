/**
 * Mock Bank Issuer - Phase 2 Upgrade
 * 
 * Implements privacy-preserving bucketed bank balance credentials.
 * Uses 4 buckets to protect user privacy while proving financial stability.
 * 
 * In production, this would integrate with Plaid API to get real 30-day
 * average balance data and issue bucketed credentials.
 */

const { ethers } = require('ethers');

class MockBankIssuer {
    constructor(privateKey) {
        this.privateKey = privateKey;
        this.wallet = new ethers.Wallet(privateKey);
        this.issuerAddress = this.wallet.address;
    }
    
    /**
     * Issue bucketed bank balance credential
     * In production: Pull from Plaid API and compute 30-day average
     * For demo: Simulate with weighted random selection
     */
    async issueBankBalanceCredential(userAddress) {
        console.log(`[Mock Bank] Issuing bank balance credential for ${userAddress}`);
        
        // Simulate Plaid 30-day average data
        const simulatedAvgBalance = this._simulatePlaidData();
        
        // Determine bucket
        const bucket = this._determineBucket(simulatedAvgBalance, [
            { min: 10000, type: 'BANK_BALANCE_HIGH', weight: 150, display: 'High Balance ($10k+)' },
            { min: 5000, type: 'BANK_BALANCE_MEDIUM', weight: 120, display: 'Medium Balance ($5k-$10k)' },
            { min: 1000, type: 'BANK_BALANCE_LOW', weight: 80, display: 'Low Balance ($1k-$5k)' },
            { min: 0, type: 'BANK_BALANCE_MINIMAL', weight: 40, display: 'Minimal Balance (<$1k)' }
        ]);
        
        console.log(`  Simulated balance: $${simulatedAvgBalance.toFixed(2)}`);
        console.log(`  Bucket: ${bucket.display}`);
        
        const timestamp = Math.floor(Date.now() / 1000);
        const expirationDate = timestamp + (365 * 24 * 60 * 60); // 1 year
        
        // Compute credential type hash (keccak256 of type name)
        const credentialTypeHash = ethers.id(bucket.type);
        
        // Encode credential data for signature (matching contract's verification)
        const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
            ['string', 'address', 'address', 'uint256', 'uint256'],
            [bucket.type, this.issuerAddress, userAddress, timestamp, expirationDate]
        );
        
        // Sign the credential data
        const messageHash = ethers.keccak256(credentialData);
        const signature = await this.wallet.signMessage(ethers.getBytes(messageHash));
        
        // Prepare response with all data needed for contract submission
        const credential = {
            credentialType: bucket.type,
            credentialTypeHash: credentialTypeHash,
            issuer: this.issuerAddress,
            subject: userAddress,
            issuanceDate: timestamp,
            expirationDate: expirationDate,
            metadata: {
                bucket: bucket.type,
                weight: bucket.weight,
                display: bucket.display,
                description: `30-day average bank balance in ${bucket.type.replace('BANK_BALANCE_', '').toLowerCase()} range`,
                privacyNote: 'Exact amount not disclosed',
                dataSource: 'Plaid (simulated)',
                period: '30 days'
            }
        };
        
        return {
            credential,
            credentialData,  // Encoded data for contract
            signature,
            issuer: this.issuerAddress
        };
    }
    
    /**
     * Legacy method for backward compatibility
     */
    async issueCredential(userAddress, credentialType) {
        if (credentialType === 'bank-balance' || credentialType === 'stable-balance') {
            return this.issueBankBalanceCredential(userAddress);
        }
        
        throw new Error(`Unknown credential type: ${credentialType}`);
    }
    
    /**
     * Simulate Plaid API data
     * Returns weighted random balance typical of middle-class users
     */
    _simulatePlaidData() {
        const buckets = [
            { amount: 500, weight: 0.2 },    // 20% chance of low balance
            { amount: 2500, weight: 0.4 },   // 40% chance of modest balance
            { amount: 7500, weight: 0.3 },   // 30% chance of comfortable balance
            { amount: 15000, weight: 0.1 }   // 10% chance of high balance
        ];
        
        const rand = Math.random();
        let cumulative = 0;
        
        for (const bucket of buckets) {
            cumulative += bucket.weight;
            if (rand < cumulative) {
                // Add noise ±$500
                return bucket.amount + (Math.random() - 0.5) * 1000;
            }
        }
        
        return buckets[0].amount;
    }
    
    /**
     * Determine which bucket an amount falls into
     */
    _determineBucket(amount, bucketDefinitions) {
        for (const bucket of bucketDefinitions) {
            if (amount >= bucket.min) {
                return bucket;
            }
        }
        // Fallback to lowest bucket
        return bucketDefinitions[bucketDefinitions.length - 1];
    }
}

module.exports = MockBankIssuer;
