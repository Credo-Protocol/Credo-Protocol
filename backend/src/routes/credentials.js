/**
 * Credentials API Routes - Phase 2 Upgrade
 * 
 * Handles credential issuance requests for both basic and advanced credentials.
 * Supports:
 * - Basic credentials: CEX History, Employment
 * - Advanced credentials: Bank Balance (bucketed), Income Range (bucketed)
 */

const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');

/**
 * GET /api/credentials/types
 * 
 * Returns all available credential types with metadata for the marketplace
 */
router.get('/types', (req, res) => {
    res.json({
        success: true,
        credentialTypes: [
            // Basic credentials (existing)
            {
                id: 'cex-history',
                name: 'Proof of CEX Trading History',
                description: 'Verify your centralized exchange account age and trading volume',
                issuer: 'Mock Exchange',
                weight: '80 pts',
                category: 'Basic',
                existing: true
            },
            {
                id: 'employment',
                name: 'Proof of Employment',
                description: 'Verify current employment status',
                issuer: 'Mock Employer',
                weight: '70 pts',
                category: 'Basic',
                existing: true
            },
            // Advanced credentials (NEW)
            {
                id: 'bank-balance',
                name: 'Bank Balance (30-day avg) 🆕',
                description: 'Prove your average bank balance over 30 days without revealing exact amounts',
                issuer: 'Mock Bank',
                weight: '40-150 pts (bucket-based)',
                category: 'Advanced',
                privacyPreserving: true,
                new: true,
                badge: 'Privacy-First'
            },
            {
                id: 'income-range',
                name: 'Income Range 🆕',
                description: 'Verify your monthly income bracket without disclosing exact salary',
                issuer: 'Mock Employer',
                weight: '50-180 pts (bucket-based)',
                category: 'Advanced',
                privacyPreserving: true,
                new: true,
                badge: 'Highest Weight'
            }
        ]
    });
});

/**
 * POST /api/credentials/request/bank-balance (NEW)
 * 
 * Issues a bucketed bank balance credential
 */
router.post('/request/bank-balance', async (req, res) => {
    try {
        const { userAddress } = req.body;
        
        // Validate user address
        if (!userAddress || !ethers.isAddress(userAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Valid user address required'
            });
        }
        
        // Get bank issuer from app locals
        const { mockBankIssuer } = req.app.locals;
        
        if (!mockBankIssuer) {
            return res.status(500).json({
                success: false,
                error: 'Bank issuer not initialized'
            });
        }
        
        // Issue the bucketed credential
        const result = await mockBankIssuer.issueBankBalanceCredential(userAddress);
        
        res.json({
            success: true,
            credential: result.credential,
            credentialData: result.credentialData,  // Phase 2: needed for contract
            signature: result.signature,
            issuer: result.issuer,
            message: `Bank balance credential issued: ${result.credential.metadata.display}`
        });
        
    } catch (error) {
        console.error('Error issuing bank balance credential:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/credentials/request/income-range (NEW)
 * 
 * Issues a bucketed income range credential
 */
router.post('/request/income-range', async (req, res) => {
    try {
        const { userAddress } = req.body;
        
        // Validate user address
        if (!userAddress || !ethers.isAddress(userAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Valid user address required'
            });
        }
        
        // Get employer issuer from app locals
        const { mockEmployerIssuer } = req.app.locals;
        
        if (!mockEmployerIssuer) {
            return res.status(500).json({
                success: false,
                error: 'Employer issuer not initialized'
            });
        }
        
        // Issue the bucketed credential
        const result = await mockEmployerIssuer.issueIncomeRangeCredential(userAddress);
        
        res.json({
            success: true,
            credential: result.credential,
            credentialData: result.credentialData,  // Phase 2: needed for contract
            signature: result.signature,
            issuer: result.issuer,
            message: `Income range credential issued: ${result.credential.metadata.display}`
        });
        
    } catch (error) {
        console.error('Error issuing income range credential:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Legacy endpoints (keep for backward compatibility)
 */

/**
 * POST /api/credentials/request/cex
 * POST /api/credentials/request/cex-history (alias)
 * Issues CEX trading history credential
 */
const handleCexCredential = async (req, res) => {
    try {
        const { userAddress } = req.body;
        
        if (!userAddress || !ethers.isAddress(userAddress)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Valid address required' 
            });
        }
        
        const { mockExchangeIssuer } = req.app.locals;
        
        if (!mockExchangeIssuer) {
            return res.status(500).json({
                success: false,
                error: 'Exchange issuer not initialized'
            });
        }
        
        const result = await mockExchangeIssuer.issueCredential(userAddress, 'cex-history');
        res.json({ 
            success: true, 
            credential: result.credential,
            credentialData: result.credentialData,
            signature: result.signature,
            issuer: result.issuer
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

router.post('/request/cex', handleCexCredential);
router.post('/request/cex-history', handleCexCredential);

/**
 * POST /api/credentials/request/employment
 * Issues basic employment credential
 */
router.post('/request/employment', async (req, res) => {
    try {
        const { userAddress } = req.body;
        
        if (!userAddress || !ethers.isAddress(userAddress)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Valid address required' 
            });
        }
        
        const { mockEmployerIssuer } = req.app.locals;
        
        if (!mockEmployerIssuer) {
            return res.status(500).json({
                success: false,
                error: 'Employer issuer not initialized'
            });
        }
        
        const result = await mockEmployerIssuer.issueEmploymentCredential(userAddress);
        res.json({ 
            success: true,
            credential: result.credential,
            credentialData: result.credentialData,
            signature: result.signature,
            issuer: result.issuer
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Legacy /request endpoint for backward compatibility
 */
router.post('/request', async (req, res) => {
    try {
        const { userAddress, credentialType, mockData } = req.body;

        if (!userAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: userAddress'
            });
        }

        if (credentialType === undefined || credentialType === null) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: credentialType'
            });
        }

        const { mockExchangeIssuer, mockEmployerIssuer, mockBankIssuer } = req.app.locals;

        let issuer;
        switch(credentialType) {
            case 2: // CEX History
                issuer = mockExchangeIssuer;
                break;
            case 3: // Employment
                issuer = mockEmployerIssuer;
                break;
            case 1: // Stable Balance
                issuer = mockBankIssuer;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: `Invalid credential type: ${credentialType}. Must be 1, 2, or 3`
                });
        }

        console.log(`Processing credential request for user ${userAddress} from ${issuer.name || 'issuer'}`);

        const result = await issuer.issueCredential(userAddress, mockData || {});

        if (!result || !result.credential || !result.signature) {
            console.error('Issuer returned incomplete data:', result);
            return res.status(500).json({
                success: false,
                error: 'Issuer returned incomplete credential data'
            });
        }

        res.json(result);

    } catch (error) {
        console.error('Error issuing credential:');
        console.error('  Message:', error.message);
        console.error('  Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to issue credential'
        });
    }
});

module.exports = router;
