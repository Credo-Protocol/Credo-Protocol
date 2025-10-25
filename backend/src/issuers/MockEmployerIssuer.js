/**
 * Mock Employer Issuer - Phase 2 Upgrade
 * 
 * Implements privacy-preserving bucketed income range credentials.
 * Uses 4 income brackets to protect user privacy while proving earning capacity.
 * 
 * In production, this would integrate with payroll APIs (e.g., Gusto, ADP)
 * to get real income data and issue bucketed credentials.
 */

const { ethers } = require('ethers');

class MockEmployerIssuer {
    constructor(privateKey) {
        this.privateKey = privateKey;
        this.wallet = new ethers.Wallet(privateKey);
        this.issuerAddress = this.wallet.address;
    }
    
    /**
     * Issue bucketed income range credential
     * In production: Pull from payroll API (e.g., Gusto, ADP)
     * For demo: Simulate realistic income distribution
     */
    async issueIncomeRangeCredential(userAddress) {
        console.log(`[Mock Employer] Issuing income range credential for ${userAddress}`);
        
        // Simulate payroll API data
        const simulatedMonthlyIncome = this._simulatePayrollData();
        
        // Determine income bucket
        const bucket = this._determineBucket(simulatedMonthlyIncome, [
            { min: 10000, type: 'INCOME_VERY_HIGH', weight: 180, display: 'Very High Income ($10k+/mo)' },
            { min: 5000, type: 'INCOME_HIGH', weight: 140, display: 'High Income ($5k-$10k/mo)' },
            { min: 2000, type: 'INCOME_MEDIUM', weight: 100, display: 'Medium Income ($2k-$5k/mo)' },
            { min: 0, type: 'INCOME_LOW', weight: 50, display: 'Low Income (<$2k/mo)' }
        ]);
        
        console.log(`  Simulated income: $${simulatedMonthlyIncome.toFixed(2)}/mo`);
        console.log(`  Bucket: ${bucket.display}`);
        
        const timestamp = Math.floor(Date.now() / 1000);
        const expirationDate = timestamp + (180 * 24 * 60 * 60); // 6 months
        
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
                description: `Monthly income in ${bucket.type.replace('INCOME_', '').toLowerCase()} range`,
                privacyNote: 'Exact salary not disclosed',
                dataSource: 'Payroll API (simulated)',
                verification: 'Employment status verified'
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
     * Legacy employment credential (non-bucketed)
     */
    async issueEmploymentCredential(userAddress) {
        console.log(`[Mock Employer] Issuing basic employment credential for ${userAddress}`);
        
        const timestamp = Math.floor(Date.now() / 1000);
        const expirationDate = timestamp + (180 * 24 * 60 * 60);
        const credentialType = 'EMPLOYMENT';
        const credentialTypeHash = ethers.id(credentialType);
        
        // Encode credential data for signature
        const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
            ['string', 'address', 'address', 'uint256', 'uint256'],
            [credentialType, this.issuerAddress, userAddress, timestamp, expirationDate]
        );
        
        // Sign the credential data
        const messageHash = ethers.keccak256(credentialData);
        const signature = await this.wallet.signMessage(ethers.getBytes(messageHash));
        
        const credential = {
            credentialType: credentialType,
            credentialTypeHash: credentialTypeHash,
            issuer: this.issuerAddress,
            subject: userAddress,
            issuanceDate: timestamp,
            expirationDate: expirationDate,
            metadata: {
                weight: 70,
                display: 'Employment Verified',
                description: 'Current employment status confirmed',
                employmentStatus: 'Full-time',
                tenure: 'Simulated'
            }
        };
        
        return { credential, credentialData, signature, issuer: this.issuerAddress };
    }
    
    /**
     * Route to appropriate credential type
     */
    async issueCredential(userAddress, credentialType) {
        if (credentialType === 'income-range') {
            return this.issueIncomeRangeCredential(userAddress);
        } else if (credentialType === 'employment') {
            return this.issueEmploymentCredential(userAddress);
        }
        
        throw new Error(`Unknown credential type: ${credentialType}`);
    }
    
    /**
     * Simulate payroll data with realistic income distribution
     */
    _simulatePayrollData() {
        const incomes = [
            { amount: 1500, weight: 0.25 },   // 25% low income
            { amount: 3500, weight: 0.40 },   // 40% middle income
            { amount: 7000, weight: 0.25 },   // 25% upper-middle
            { amount: 12000, weight: 0.10 }   // 10% high income
        ];
        
        const rand = Math.random();
        let cumulative = 0;
        
        for (const income of incomes) {
            cumulative += income.weight;
            if (rand < cumulative) {
                // Add noise ±$500
                return income.amount + (Math.random() - 0.5) * 1000;
            }
        }
        
        return incomes[0].amount;
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
        return bucketDefinitions[bucketDefinitions.length - 1];
    }
}

module.exports = MockEmployerIssuer;
