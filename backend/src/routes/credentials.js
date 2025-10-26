/**
 * Credential API Routes - MOCA Official Integration
 * 
 * NEW APPROACH (Phase 5.2):
 * - Backend prepares credential metadata
 * - Frontend uses AIR Kit to issue credentials
 * - No more manual signature generation
 * 
 * Flow:
 * 1. GET /types - List all available credential types
 * 2. POST /prepare - Generate auth token + metadata for issuance
 * 3. Frontend uses AIR Kit to issue
 * 4. Frontend submits to smart contract
 */

const express = require('express');
const { generateIssueToken } = require('../auth/jwt');
const { ethers } = require('ethers');

const router = express.Router();

/**
 * Helper: Get issuer private key and address for credential type
 */
function getIssuerCredentials(credentialType) {
  // Derive issuer addresses from configured private keys to guarantee match
  const bankKey = process.env.MOCK_BANK_PRIVATE_KEY;
  const employerKey = process.env.MOCK_EMPLOYER_PRIVATE_KEY;
  const exchangeKey = process.env.MOCK_EXCHANGE_PRIVATE_KEY;

  const bankWallet = bankKey ? new ethers.Wallet(bankKey) : null;
  const employerWallet = employerKey ? new ethers.Wallet(employerKey) : null;
  const exchangeWallet = exchangeKey ? new ethers.Wallet(exchangeKey) : null;

  const issuerMap = {
    mockBank: {
      address: bankWallet?.address,
      privateKey: bankKey
    },
    mockEmployer: {
      address: employerWallet?.address,
      privateKey: employerKey
    },
    mockExchange: {
      address: exchangeWallet?.address,
      privateKey: exchangeKey
    }
  };
  
  // All bank balance credentials -> Bank issuer
  if (credentialType.includes('bank')) {
    return issuerMap.mockBank;
  }
  // All income credentials + employment -> Employer issuer
  if (credentialType.includes('income') || credentialType === 'employment') {
    return issuerMap.mockEmployer;
  }
  // CEX history -> Exchange issuer
  if (credentialType.includes('cex')) {
    return issuerMap.mockExchange;
  }
  // Fallback to bank issuer
  return issuerMap.mockBank;
}

/**
 * GET /api/credentials/types
 * 
 * Returns all available credential types with schema metadata.
 * Frontend uses this to display credential marketplace.
 */
router.get('/types', async (req, res) => {
  try {
    const credentialTypes = [
      // ============================================
      // Bank Balance Credentials
      // ============================================
      {
        id: 'bank-balance-high',
        name: 'Bank Balance - High',
        subtitle: '$10,000+ (30-day average)',
        category: 'Financial',
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_HIGH,
        programId: process.env.PROGRAM_BANK_HIGH,
        weight: 150,
        bucket: 'BANK_BALANCE_HIGH',
        range: '$10,000+',
        description: 'Proves 30-day average balance of $10k or more without revealing exact amount',
        privacyLevel: 'Bucketed - Exact amount not disclosed',
        icon: '💰',
        color: 'green',
        tier: 'Tier 1 (50% collateral)'
      },
      {
        id: 'bank-balance-medium',
        name: 'Bank Balance - Medium',
        subtitle: '$5,000 - $10,000 (30-day avg)',
        category: 'Financial',
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_MEDIUM,
        programId: process.env.PROGRAM_BANK_MEDIUM,
        weight: 120,
        bucket: 'BANK_BALANCE_MEDIUM',
        range: '$5,000 - $10,000',
        description: 'Proves 30-day average balance of $5k-$10k',
        privacyLevel: 'Bucketed',
        icon: '💰',
        color: 'blue',
        tier: 'Tier 2 (60% collateral)'
      },
      {
        id: 'bank-balance-low',
        name: 'Bank Balance - Low',
        subtitle: '$1,000 - $5,000 (30-day avg)',
        category: 'Financial',
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_LOW,
        programId: process.env.PROGRAM_BANK_LOW,
        weight: 80,
        bucket: 'BANK_BALANCE_LOW',
        range: '$1,000 - $5,000',
        description: 'Proves 30-day average balance of $1k-$5k',
        privacyLevel: 'Bucketed',
        icon: '💰',
        color: 'yellow',
        tier: 'Tier 4 (90% collateral)'
      },
      {
        id: 'bank-balance-minimal',
        name: 'Bank Balance - Minimal',
        subtitle: 'Under $1,000 (30-day avg)',
        category: 'Financial',
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_MINIMAL,
        programId: process.env.PROGRAM_BANK_MINIMAL,
        weight: 40,
        bucket: 'BANK_BALANCE_MINIMAL',
        range: 'Under $1,000',
        description: 'Proves 30-day average balance under $1k',
        privacyLevel: 'Bucketed',
        icon: '💰',
        color: 'gray',
        tier: 'Tier 7 (125% collateral)'
      },
      
      // ============================================
      // Income Range Credentials
      // ============================================
      {
        id: 'income-high',
        name: 'Income Range - High',
        subtitle: '$8,000+ per month',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_HIGH,
        programId: process.env.PROGRAM_INCOME_HIGH,
        weight: 180,
        bucket: 'INCOME_HIGH',
        range: '$8,000+ per month',
        description: 'Proves monthly income of $8k or more without revealing exact salary',
        privacyLevel: 'Bucketed - Exact salary not disclosed',
        icon: '💼',
        color: 'green',
        tier: 'Tier 1 (50% collateral)'
      },
      {
        id: 'income-medium',
        name: 'Income Range - Medium',
        subtitle: '$5,000 - $8,000 per month',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_MEDIUM,
        programId: process.env.PROGRAM_INCOME_MEDIUM,
        weight: 140,
        bucket: 'INCOME_MEDIUM',
        range: '$5,000 - $8,000 per month',
        description: 'Proves monthly income of $5k-$8k',
        privacyLevel: 'Bucketed',
        icon: '💼',
        color: 'blue',
        tier: 'Tier 2 (60% collateral)'
      },
      {
        id: 'income-low',
        name: 'Income Range - Low',
        subtitle: '$3,000 - $5,000 per month',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_LOW,
        programId: process.env.PROGRAM_INCOME_LOW,
        weight: 100,
        bucket: 'INCOME_LOW',
        range: '$3,000 - $5,000 per month',
        description: 'Proves monthly income of $3k-$5k',
        privacyLevel: 'Bucketed',
        icon: '💼',
        color: 'yellow',
        tier: 'Tier 3 (75% collateral)'
      },
      {
        id: 'income-minimal',
        name: 'Income Range - Minimal',
        subtitle: 'Under $3,000 per month',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_MINIMAL,
        programId: process.env.PROGRAM_INCOME_MINIMAL,
        weight: 50,
        bucket: 'INCOME_MINIMAL',
        range: 'Under $3,000 per month',
        description: 'Proves monthly income under $3k',
        privacyLevel: 'Bucketed',
        icon: '💼',
        color: 'gray',
        tier: 'Tier 6 (110% collateral)'
      },
      
      // ============================================
      // Legacy Credentials
      // ============================================
      {
        id: 'cex-history',
        name: 'CEX Trading History',
        subtitle: 'Proof of exchange activity',
        category: 'Financial',
        issuerDid: process.env.CEX_ISSUER_DID,
        schemaId: process.env.SCHEMA_CEX_HISTORY,
        programId: process.env.PROGRAM_CEX_HISTORY,
        weight: 80,
        bucket: 'CEX_HISTORY',
        description: 'Proves active trading history on centralized exchanges',
        privacyLevel: 'Metadata only - no trade details',
        icon: '📈',
        color: 'purple',
        tier: 'Tier 4 (90% collateral)'
      },
      {
        id: 'employment',
        name: 'Proof of Employment',
        subtitle: 'Current employment status',
        category: 'Employment',
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_EMPLOYMENT,
        programId: process.env.PROGRAM_EMPLOYMENT,
        weight: 70,
        bucket: 'EMPLOYMENT',
        description: 'Proves current employment status without revealing employer',
        privacyLevel: 'Basic verification',
        icon: '🏢',
        color: 'indigo',
        tier: 'Tier 5 (100% collateral)'
      }
    ];
    
    // Filter out any with missing env vars
    const validCredentials = credentialTypes.filter(c => 
      c.issuerDid && c.schemaId && c.programId
    );
    
    if (validCredentials.length < credentialTypes.length) {
      console.warn(`[Credentials] ${credentialTypes.length - validCredentials.length} credentials missing env vars`);
    }
    
    res.json({
      success: true,
      count: validCredentials.length,
      credentials: validCredentials
    });
    
  } catch (error) {
    console.error('[Credentials] Error fetching types:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/credentials/prepare
 * 
 * Prepares credential issuance by generating Partner JWT.
 * Frontend receives everything needed to call AIR Kit.
 * 
 * Body:
 *   - userAddress: Wallet address of credential subject
 *   - credentialType: ID of credential type (e.g., 'bank-balance-high')
 *   - userId: Optional internal user ID
 *   - email: Optional user email (fallback generated if missing)
 */
router.post('/prepare', async (req, res) => {
  try {
    const { userAddress, credentialType, userId, email } = req.body;
    
    // Validate required fields
    if (!userAddress || !credentialType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userAddress, credentialType'
      });
    }
    
    // Map credential type to schema
    const credentialMap = {
      'bank-balance-high': {
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_HIGH,
        programId: process.env.PROGRAM_BANK_HIGH,
        bucket: 'BANK_BALANCE_HIGH',
        range: '$10,000+',
        weight: 150
      },
      'bank-balance-medium': {
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_MEDIUM,
        programId: process.env.PROGRAM_BANK_MEDIUM,
        bucket: 'BANK_BALANCE_MEDIUM',
        range: '$5,000 - $10,000',
        weight: 120
      },
      'bank-balance-low': {
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_LOW,
        programId: process.env.PROGRAM_BANK_LOW,
        bucket: 'BANK_BALANCE_LOW',
        range: '$1,000 - $5,000',
        weight: 80
      },
      'bank-balance-minimal': {
        issuerDid: process.env.BANK_ISSUER_DID,
        schemaId: process.env.SCHEMA_BANK_MINIMAL,
        programId: process.env.PROGRAM_BANK_MINIMAL,
        bucket: 'BANK_BALANCE_MINIMAL',
        range: 'Under $1,000',
        weight: 40
      },
      'income-high': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_HIGH,
        programId: process.env.PROGRAM_INCOME_HIGH,
        bucket: 'INCOME_HIGH',
        range: '$8,000+ per month',
        weight: 180
      },
      'income-medium': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_MEDIUM,
        programId: process.env.PROGRAM_INCOME_MEDIUM,
        bucket: 'INCOME_MEDIUM',
        range: '$5,000 - $8,000 per month',
        weight: 140
      },
      'income-low': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_LOW,
        programId: process.env.PROGRAM_INCOME_LOW,
        bucket: 'INCOME_LOW',
        range: '$3,000 - $5,000 per month',
        weight: 100
      },
      'income-minimal': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_INCOME_MINIMAL,
        programId: process.env.PROGRAM_INCOME_MINIMAL,
        bucket: 'INCOME_MINIMAL',
        range: 'Under $3,000 per month',
        weight: 50
      },
      'cex-history': {
        issuerDid: process.env.CEX_ISSUER_DID,
        schemaId: process.env.SCHEMA_CEX_HISTORY,
        programId: process.env.PROGRAM_CEX_HISTORY,
        bucket: 'CEX_HISTORY',
        weight: 80
      },
      'employment': {
        issuerDid: process.env.EMPLOYMENT_ISSUER_DID,
        schemaId: process.env.SCHEMA_EMPLOYMENT,
        programId: process.env.PROGRAM_EMPLOYMENT,
        bucket: 'EMPLOYMENT',
        weight: 70
      }
    };
    
    const credentialMeta = credentialMap[credentialType];
    if (!credentialMeta) {
      return res.status(400).json({
        success: false,
        error: `Unknown credential type: ${credentialType}`
      });
    }
    
    // Verify env vars exist
    if (!credentialMeta.issuerDid || !credentialMeta.schemaId || !credentialMeta.programId) {
      return res.status(500).json({
        success: false,
        error: `Credential type ${credentialType} not properly configured (missing DID, schema, or program ID)`
      });
    }
    
    // Generate Partner JWT with 'issue' scope
    // Use provided userId/email or generate fallbacks
    const effectiveUserId = userId || userAddress;
    const effectiveEmail = email || `${userAddress.substring(0, 10)}@credo.local`;
    
    const authToken = generateIssueToken(effectiveUserId, effectiveEmail);
    
    // Get issuer credentials for signing
    const issuerCreds = getIssuerCredentials(credentialType);
    
    // Prepare credential subject data
    const credentialSubject = {
        // Field names MUST match your schema exactly!
        // Bank Balance schemas: balanceBucket, bucketRange, weight, verifiedAt, dataSource, period
        // Income Range schemas: incomeBucket, bucketRange, weight, verifiedAt, dataSource, period
        // CEX History schema: credentialType, weight, verifiedAt, dataSource
        // Employment schema: credentialType, weight, verifiedAt, dataSource
        ...(credentialType.includes('bank') ? {
          balanceBucket: credentialMeta.bucket,
          bucketRange: credentialMeta.range,
          weight: credentialMeta.weight,
          verifiedAt: Math.floor(Date.now() / 1000),
          dataSource: 'Plaid API',
          period: '30 days'
        } : credentialType.includes('income') ? {
          incomeBucket: credentialMeta.bucket,
          bucketRange: credentialMeta.range,
          weight: credentialMeta.weight,
          verifiedAt: Math.floor(Date.now() / 1000),
          dataSource: 'Employer Verification',
          period: 'Monthly'
        } : credentialType.includes('cex') ? {
          // CEX schema expects 'credentialType' field (not tradingVolume!)
          credentialType: credentialMeta.bucket, // 'CEX_HISTORY'
          weight: credentialMeta.weight,
          verifiedAt: Math.floor(Date.now() / 1000),
          dataSource: 'Mock Exchange'
        } : {
          // Employment schema expects 'credentialType' field (not employmentStatus!)
          credentialType: credentialMeta.bucket, // 'EMPLOYMENT'
          weight: credentialMeta.weight,
          verifiedAt: Math.floor(Date.now() / 1000),
          dataSource: 'Mock Employer'
        })
    };
    
    // Generate signature for smart contract submission
    // Contract expects: ABI-encoded(credentialType, subject, issuanceDate, weight)
    // signed by the issuer's private key
    
    const issuanceDate = Math.floor(Date.now() / 1000);
    const expirationDate = issuanceDate + (365 * 24 * 60 * 60); // 1 year from now
    
    // Extract the actual bucket value from credentialSubject
    const bucketValue = credentialSubject.balanceBucket ||  // Bank Balance
                        credentialSubject.incomeBucket ||   // Income Range
                        credentialSubject.credentialType || // CEX History or Employment
                        'VERIFIED';
    
    // Encode credential data (same format as contract expects)
    const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['string', 'address', 'uint256', 'uint256'],
      [bucketValue, userAddress, issuanceDate, credentialMeta.weight]
    );
    
    // Hash and sign the credential data
    // Contract: keccak256(credentialData) → toEthSignedMessageHash() → recover(signature)
    // Backend must match: keccak256(credentialData) → add prefix → sign
    
    const credentialDataHash = ethers.keccak256(credentialData);
    
    // Add Ethereum signed message prefix (same as contract's toEthSignedMessageHash)
    const ethSignedMessageHash = ethers.hashMessage(ethers.getBytes(credentialDataHash));
    
    // Sign the prefixed hash
    const signingKey = new ethers.SigningKey(issuerCreds.privateKey);
    const signature = signingKey.sign(ethSignedMessageHash).serialized;
    
    console.log(`[Credentials] Prepared ${credentialType} for ${userAddress}`);
    console.log(`  Issuer: ${issuerCreds.address}`);
    console.log(`  Bucket: ${bucketValue}`);
    console.log(`  Signature: ${signature.substring(0, 20)}...`);
    
    // Return everything frontend needs for AIR Kit + contract
    res.json({
      success: true,
      authToken,
      issuerDid: credentialMeta.issuerDid,
      issuerAddress: issuerCreds.address, // For contract submission
      schemaId: credentialMeta.schemaId,
      programId: credentialMeta.programId,
      credentialSubject: credentialSubject,
      // Contract submission data
      signature: signature,
      issuanceDate: issuanceDate,
      expirationDate: expirationDate,
      weight: credentialMeta.weight,
      bucket: bucketValue
    });
    
  } catch (error) {
    console.error('[Credentials] Error preparing issuance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/credentials/request (DEPRECATED)
 * 
 * Legacy endpoint - returns migration message
 */
router.post('/request', async (req, res) => {
  res.status(410).json({
    success: false,
    error: 'This endpoint has been deprecated in Phase 5.2',
    message: 'Use /api/credentials/prepare instead',
    migration: 'See PHASE5.2-BACKEND-REFACTOR.md for details'
  });
});

module.exports = router;
