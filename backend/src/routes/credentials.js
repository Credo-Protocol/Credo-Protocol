/**
 * Credentials API Routes
 * 
 * Handles credential issuance requests from the frontend.
 * Provides endpoints to:
 * - List available credential types
 * - Request and issue credentials from mock issuers
 * - Get issuer information
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/credentials/types
 * 
 * Returns a list of all available credential types with metadata
 * for display in the frontend credential marketplace.
 */
router.get('/types', (req, res) => {
  try {
    // Get global issuer instances (set by server.js)
    const { mockExchangeIssuer, mockEmployerIssuer, mockBankIssuer } = req.app.locals;

    // Build response with issuer info
    const credentials = [
      {
        id: mockExchangeIssuer.credentialType,
        ...mockExchangeIssuer.getInfo()
      },
      {
        id: mockEmployerIssuer.credentialType,
        ...mockEmployerIssuer.getInfo()
      },
      {
        id: mockBankIssuer.credentialType,
        ...mockBankIssuer.getInfo()
      }
    ];

    res.json({
      success: true,
      credentials
    });
  } catch (error) {
    console.error('Error fetching credential types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credential types'
    });
  }
});

/**
 * POST /api/credentials/request
 * 
 * Issues a credential for a user from the specified issuer.
 * 
 * Request Body:
 * {
 *   userAddress: "0x...",
 *   credentialType: 1 | 2 | 3,
 *   mockData: {} // Optional mock data for customization
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   credential: { ... },
 *   encodedData: "0x...",
 *   signature: "0x...",
 *   credentialHash: "0x..."
 * }
 */
router.post('/request', async (req, res) => {
  try {
    const { userAddress, credentialType, mockData } = req.body;

    // Validate required fields
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

    // Get global issuer instances
    const { mockExchangeIssuer, mockEmployerIssuer, mockBankIssuer } = req.app.locals;

    // Select the appropriate issuer based on credential type
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

    console.log(`Processing credential request for user ${userAddress} from ${issuer.name}`);

    // Issue the credential
    const result = await issuer.issueCredential(userAddress, mockData || {});

    // Return the signed credential
    res.json(result);

  } catch (error) {
    console.error('Error issuing credential:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to issue credential'
    });
  }
});

/**
 * GET /api/credentials/issuers
 * 
 * Returns information about all registered issuers.
 * Useful for displaying issuer metadata in the frontend.
 */
router.get('/issuers', (req, res) => {
  try {
    // Get global issuer instances
    const { mockExchangeIssuer, mockEmployerIssuer, mockBankIssuer } = req.app.locals;

    const issuers = [
      mockExchangeIssuer.getInfo(),
      mockEmployerIssuer.getInfo(),
      mockBankIssuer.getInfo()
    ];

    res.json({
      success: true,
      issuers
    });
  } catch (error) {
    console.error('Error fetching issuers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch issuers'
    });
  }
});

/**
 * GET /api/credentials/issuer/:type
 * 
 * Returns information about a specific issuer by credential type.
 */
router.get('/issuer/:type', (req, res) => {
  try {
    const credentialType = parseInt(req.params.type);
    
    // Get global issuer instances
    const { mockExchangeIssuer, mockEmployerIssuer, mockBankIssuer } = req.app.locals;

    let issuer;
    switch(credentialType) {
      case 2:
        issuer = mockExchangeIssuer;
        break;
      case 3:
        issuer = mockEmployerIssuer;
        break;
      case 1:
        issuer = mockBankIssuer;
        break;
      default:
        return res.status(404).json({
          success: false,
          error: 'Issuer not found'
        });
    }

    res.json({
      success: true,
      issuer: issuer.getInfo()
    });
  } catch (error) {
    console.error('Error fetching issuer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch issuer'
    });
  }
});

module.exports = router;

