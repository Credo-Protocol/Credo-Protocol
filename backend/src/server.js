/**
 * Credo Protocol Backend Server
 * 
 * Mock credential issuer service for the Credo Protocol hackathon MVP.
 * This server provides API endpoints for issuing verifiable credentials
 * that can be submitted to the CreditScoreOracle smart contract.
 * 
 * In production, this would integrate with real data providers (exchanges,
 * employers, banks) and implement proper authentication and rate limiting.
 */

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

// Import issuer classes
const MockExchangeIssuer = require('./issuers/MockExchangeIssuer');
const MockEmployerIssuer = require('./issuers/MockEmployerIssuer');
const MockBankIssuer = require('./issuers/MockBankIssuer');

// Import routes
const credentialsRouter = require('./routes/credentials');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Initialize issuer wallets from environment variables
let mockExchangeWallet, mockEmployerWallet, mockBankWallet;
let mockExchangeIssuer, mockEmployerIssuer, mockBankIssuer;

try {
  // Create wallet instances from private keys
  mockExchangeWallet = new ethers.Wallet(process.env.MOCK_EXCHANGE_PRIVATE_KEY);
  mockEmployerWallet = new ethers.Wallet(process.env.MOCK_EMPLOYER_PRIVATE_KEY);
  mockBankWallet = new ethers.Wallet(process.env.MOCK_BANK_PRIVATE_KEY);

  // Create issuer instances
  mockExchangeIssuer = new MockExchangeIssuer(mockExchangeWallet);
  mockEmployerIssuer = new MockEmployerIssuer(mockEmployerWallet);
  mockBankIssuer = new MockBankIssuer(mockBankWallet);

  // Store issuers in app.locals for access in routes
  app.locals.mockExchangeIssuer = mockExchangeIssuer;
  app.locals.mockEmployerIssuer = mockEmployerIssuer;
  app.locals.mockBankIssuer = mockBankIssuer;

  console.log('✅ Issuers initialized successfully:');
  console.log(`   - ${mockExchangeIssuer.name} (${mockExchangeWallet.address})`);
  console.log(`   - ${mockEmployerIssuer.name} (${mockEmployerWallet.address})`);
  console.log(`   - ${mockBankIssuer.name} (${mockBankWallet.address})`);
} catch (error) {
  console.error('❌ Failed to initialize issuers:', error.message);
  console.error('Please check your .env file has valid private keys.');
  process.exit(1);
}

// Routes
app.use('/api/credentials', credentialsRouter);

/**
 * GET /health
 * 
 * Health check endpoint to verify the service is running
 * and all issuers are properly initialized.
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Credo Protocol Mock Issuer Service',
    version: '1.0.0',
    issuers: [
      {
        name: mockExchangeIssuer.name,
        address: mockExchangeWallet.address,
        credentialType: mockExchangeIssuer.credentialType
      },
      {
        name: mockEmployerIssuer.name,
        address: mockEmployerWallet.address,
        credentialType: mockEmployerIssuer.credentialType
      },
      {
        name: mockBankIssuer.name,
        address: mockBankWallet.address,
        credentialType: mockBankIssuer.credentialType
      }
    ]
  });
});

/**
 * GET /
 * 
 * Root endpoint with service information
 */
app.get('/', (req, res) => {
  res.json({
    service: 'Credo Protocol Mock Issuer Service',
    description: 'Backend service for issuing verifiable credentials',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      credentialTypes: 'GET /api/credentials/types',
      requestCredential: 'POST /api/credentials/request',
      listIssuers: 'GET /api/credentials/issuers'
    },
    documentation: 'See README.md for full API documentation'
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

