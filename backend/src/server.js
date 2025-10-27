/**
 * Credo Protocol Backend Server (wave 3)
 * 
 * MOCA Official Integration: Partner JWT Authentication
 * 
 * This server provides API endpoints for preparing credential issuance
 * that integrates with MOCA's AIR Kit platform. The backend generates
 * Partner JWTs that authenticate the frontend to issue official MOCA
 * credentials stored on decentralized storage (MCSP).
 * 
 * Migration: Replaced mock issuers with Partner JWT generation
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const credentialsRouter = require('./routes/credentials');
const { getJWKS } = require('./auth/jwks');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for JWKS endpoint (AIR Kit needs access)
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ngrok compatibility middleware
// ngrok free tier sometimes adds warnings that can interfere with API calls
app.use((req, res, next) => {
  // Allow ngrok to work properly
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Validate MOCA environment variables (Phase 5.2)
try {
  // Check required MOCA config
  if (!process.env.PARTNER_ID || !process.env.PARTNER_SECRET) {
    throw new Error('Missing MOCA credentials: PARTNER_ID and PARTNER_SECRET required');
  }
  
  if (!process.env.ISSUER_DID) {
    throw new Error('Missing ISSUER_DID - run Phase 5.1 setup first');
  }

  console.log('✅ MOCA Integration initialized (Phase 5.2):');
  console.log(`   - Partner ID: ${process.env.PARTNER_ID}`);
  console.log(`   - Issuer DID: ${process.env.ISSUER_DID}`);
  console.log(`   - Partner Secret: [hidden]`);
  console.log('   - Backend ready to generate Partner JWTs');
} catch (error) {
  console.error('❌ Failed to initialize MOCA integration:', error.message);
  console.error('Please complete Phase 5.1 setup and update .env file.');
  process.exit(1);
}

// Routes
app.use('/api/credentials', credentialsRouter);

/**
 * GET /.well-known/jwks.json
 * 
 * JWKS (JSON Web Key Set) endpoint for AIR Kit JWT validation
 * AIR Kit calls this endpoint to get our public key for verifying Partner JWTs
 * 
 * Required by MOCA: https://docs.moca.network/airkit/usage/partner-authentication
 * 
 * IMPORTANT: This endpoint MUST be publicly accessible for AIR Kit to work.
 * Configure this URL in MOCA Developer Dashboard under your Partner settings.
 */
app.get('/.well-known/jwks.json', (req, res) => {
  try {
    const jwks = getJWKS();
    console.log('📋 JWKS endpoint called');
    console.log('   User-Agent:', req.headers['user-agent'] || 'Unknown');
    console.log('   Origin:', req.headers['origin'] || 'Direct request');
    console.log('   Kid:', jwks.keys[0]?.kid);
    
    // Set proper headers for JWKS response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow AIR Kit to fetch
    
    res.json(jwks);
  } catch (error) {
    console.error('❌ JWKS generation failed:', error);
    res.status(500).json({
      error: 'JWKS generation failed',
      message: error.message
    });
  }
});

/**
 * GET /health
 * 
 * Health check endpoint to verify MOCA integration
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Credo Protocol Backend - MOCA Integration',
    version: '5.2.0',
    integration: {
      partnerId: process.env.PARTNER_ID,
      issuerDid: process.env.ISSUER_DID,
      mocaNetwork: 'MOCA Sandbox',
      features: [
        'Partner JWT Generation',
        'Official AIR Kit Credentials',
        'Decentralized Storage (MCSP)',
        'Gas Sponsorship Ready'
      ]
    },
    credentials: {
      bankBalance: 4,
      incomeRange: 4,
      other: 2,
      total: 10
    }
  });
});

/**
 * GET /
 * 
 * Root endpoint with service information
 */
app.get('/', (req, res) => {
  res.json({
    service: 'Credo Protocol Backend - MOCA Integration',
    description: 'Backend service for MOCA credential preparation and Partner JWT generation',
    version: '5.2.0',
    phase: 'Phase 5.2 - Backend Refactoring Complete',
    endpoints: {
      health: 'GET /health',
      jwks: 'GET /.well-known/jwks.json',
      credentialTypes: 'GET /api/credentials/types',
      prepareCredential: 'POST /api/credentials/prepare'
    },
    migration: {
      status: 'Phase 5.2 Complete',
      next: 'Phase 5.3 - Frontend Integration',
      changes: [
        'Replaced mock issuers with Partner JWT auth',
        'Backend now prepares credentials for AIR Kit',
        'Credentials stored on MOCA Chain Storage Providers',
        'Gas sponsorship ready'
      ]
    },
    documentation: 'See documents/wave 3/PHASE5.2-BACKEND-REFACTOR.md'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Credo Protocol Backend Server');
  console.log('================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;

