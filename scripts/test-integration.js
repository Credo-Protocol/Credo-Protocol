/**
 * Integration Testing Script
 * 
 * Tests the complete integration between contracts, backend, and frontend.
 * Run this script to verify Phase 4.1-4.3 requirements:
 * - Contract-Backend Integration
 * - Backend-Frontend Integration
 * - Frontend-Contract Integration
 * 
 * Usage: node scripts/test-integration.js
 */

const { ethers } = require('ethers');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Configuration from environment
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://devnet-rpc.mocachain.org';
const CREDIT_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS;
const LENDING_POOL_ADDRESS = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS;
const MOCK_USDC_ADDRESS = process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Issuer addresses from backend
const ISSUER_ADDRESSES = {
  EXCHANGE: process.env.NEXT_PUBLIC_MOCK_EXCHANGE_ADDRESS,
  EMPLOYER: process.env.NEXT_PUBLIC_MOCK_EMPLOYER_ADDRESS,
  BANK: process.env.NEXT_PUBLIC_MOCK_BANK_ADDRESS,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(message, colors.blue);
  log('='.repeat(60), colors.blue);
}

// ABIs (minimal for testing - using Interface to avoid ENS lookups)
const CREDIT_ORACLE_ABI = new ethers.Interface([
  'function isIssuerRegistered(address issuer) view returns (bool)',
  'function issuers(address issuer) view returns (bool registered, uint256 trustScore, uint256 credentialCount)',
  'function getCreditScore(address user) view returns (uint256)',
]);

const LENDING_POOL_ABI = new ethers.Interface([
  'function getAssetData(address asset) view returns (uint256 totalSupply, uint256 totalBorrowed, uint256 baseInterestRate, uint256 utilizationRate, bool enabled)',
  'function calculateCollateralFactor(uint256 creditScore) pure returns (uint256)',
]);

const ERC20_ABI = new ethers.Interface([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
]);

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, error = null) {
  testResults.tests.push({ name, passed, error });
  if (passed) {
    testResults.passed++;
    logSuccess(name);
  } else {
    testResults.failed++;
    logError(`${name} - ${error}`);
  }
}

async function testBackendHealth() {
  logSection('Phase 4.1: Contract-Backend Integration');
  logInfo('Testing backend health and issuer initialization...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    
    if (response.status !== 200) {
      recordTest('Backend Health Check', false, `HTTP ${response.status}`);
      return false;
    }
    
    recordTest('Backend Health Check', true);
    
    // Check issuers
    const issuers = response.data.issuers;
    if (!issuers || issuers.length !== 3) {
      recordTest('Backend Issuer Count', false, `Expected 3 issuers, got ${issuers?.length || 0}`);
      return false;
    }
    
    recordTest('Backend Issuer Count', true);
    
    // Log issuer details
    logInfo('Backend Issuers:');
    issuers.forEach(issuer => {
      console.log(`  - ${issuer.name}: ${issuer.address} (Type ${issuer.credentialType})`);
    });
    
    return true;
  } catch (error) {
    recordTest('Backend Health Check', false, error.message);
    return false;
  }
}

async function testIssuerRegistration(provider) {
  logInfo('Checking issuer registration in CreditScoreOracle...');
  
  try {
    const oracleContract = new ethers.Contract(
      CREDIT_ORACLE_ADDRESS,
      CREDIT_ORACLE_ABI,
      provider
    );
    
    for (const [name, address] of Object.entries(ISSUER_ADDRESSES)) {
      const isRegistered = await oracleContract.isIssuerRegistered(address);
      
      if (!isRegistered) {
        recordTest(`Issuer Registration: ${name}`, false, `Address ${address} not registered`);
        continue;
      }
      
      // Get issuer details
      const issuerDetails = await oracleContract.issuers(address);
      const trustScore = Number(issuerDetails[1]);
      const credentialCount = Number(issuerDetails[2]);
      
      recordTest(`Issuer Registration: ${name}`, true);
      console.log(`  - Trust Score: ${trustScore}, Credentials Issued: ${credentialCount}`);
    }
    
    return true;
  } catch (error) {
    recordTest('Issuer Registration Check', false, error.message);
    return false;
  }
}

async function testCredentialAPI() {
  logSection('Phase 4.2: Backend-Frontend Integration');
  logInfo('Testing credential API endpoints...');
  
  try {
    // Test GET /api/credentials/types
    const typesResponse = await axios.get(`${BACKEND_URL}/api/credentials/types`);
    
    if (typesResponse.status !== 200) {
      recordTest('API: Get Credential Types', false, `HTTP ${typesResponse.status}`);
      return false;
    }
    
    const credentials = typesResponse.data.credentials;
    if (!credentials || credentials.length !== 3) {
      recordTest('API: Get Credential Types', false, `Expected 3 credential types, got ${credentials?.length || 0}`);
      return false;
    }
    
    recordTest('API: Get Credential Types', true);
    
    logInfo('Available Credentials:');
    credentials.forEach(cred => {
      console.log(`  - [${cred.id}] ${cred.name} (+${cred.scoreBoost})`);
    });
    
    // Test POST /api/credentials/request (with mock data)
    const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    
    logInfo('\nTesting credential issuance (mock)...');
    const requestResponse = await axios.post(`${BACKEND_URL}/api/credentials/request`, {
      userAddress: testAddress,
      credentialType: 2, // CEX History
      mockData: { volume: 'high', accountAge: '2_years' }
    });
    
    if (requestResponse.status !== 200 || !requestResponse.data.success) {
      recordTest('API: Request Credential', false, requestResponse.data.error || 'Failed to issue');
      return false;
    }
    
    recordTest('API: Request Credential', true);
    
    // Verify credential data structure
    const { credential, encodedData, signature } = requestResponse.data;
    
    if (!credential || !encodedData || !signature) {
      recordTest('API: Credential Data Structure', false, 'Missing fields');
      return false;
    }
    
    recordTest('API: Credential Data Structure', true);
    
    logInfo('Credential issued successfully:');
    console.log(`  - Type: ${credential.type}`);
    console.log(`  - Issuer: ${credential.issuer}`);
    console.log(`  - Expires: ${new Date(credential.expiresAt * 1000).toLocaleDateString()}`);
    console.log(`  - Signature length: ${signature.length} chars`);
    
    return true;
  } catch (error) {
    recordTest('Credential API Test', false, error.message);
    return false;
  }
}

async function testContractInteraction(provider) {
  logSection('Phase 4.3: Frontend-Contract Integration');
  logInfo('Testing contract read operations...');
  
  try {
    // Test CreditScoreOracle
    const oracleContract = new ethers.Contract(
      CREDIT_ORACLE_ADDRESS,
      CREDIT_ORACLE_ABI,
      provider
    );
    
    const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const score = await oracleContract.getCreditScore(testAddress);
    
    recordTest('Contract: Read Credit Score', true);
    console.log(`  - Score: ${score.toString()}`);
    
    // Test LendingPool
    const poolContract = new ethers.Contract(
      LENDING_POOL_ADDRESS,
      LENDING_POOL_ABI,
      provider
    );
    
    const assetData = await poolContract.getAssetData(MOCK_USDC_ADDRESS);
    const assetEnabled = assetData[4];
    
    if (!assetEnabled) {
      recordTest('Contract: USDC Enabled in Pool', false, 'Asset not enabled');
    } else {
      recordTest('Contract: USDC Enabled in Pool', true);
      console.log(`  - Total Supply: ${ethers.formatUnits(assetData[0], 6)} USDC`);
      console.log(`  - Total Borrowed: ${ethers.formatUnits(assetData[1], 6)} USDC`);
    }
    
    // Test collateral factor calculation
    const testScores = [0, 500, 700, 900];
    logInfo('\nCollateral Factor Calculation:');
    for (const score of testScores) {
      const factor = await poolContract.calculateCollateralFactor(score);
      console.log(`  - Score ${score}: ${factor}% collateral required`);
    }
    recordTest('Contract: Collateral Factor Calculation', true);
    
    // Test MockUSDC - resolve ENS-free
    const usdcContract = new ethers.Contract(
      MOCK_USDC_ADDRESS,
      ERC20_ABI,
      provider
    );
    
    const name = await usdcContract.name();
    const symbol = await usdcContract.symbol();
    const decimals = await usdcContract.decimals();
    
    recordTest('Contract: MockUSDC Metadata', true);
    console.log(`  - Name: ${name}`);
    console.log(`  - Symbol: ${symbol}`);
    console.log(`  - Decimals: ${decimals}`);
    
    return true;
  } catch (error) {
    // Provide more detailed error handling
    const errorMsg = error.message || String(error);
    console.error('Contract interaction error details:', error);
    recordTest('Contract Interaction', false, errorMsg);
    return false;
  }
}

async function testNetworkConnection() {
  logInfo('Testing Moca Chain Devnet connection...');
  
  try {
    // Create provider with static network configuration (no ENS support)
    const staticNetwork = ethers.Network.from({
      name: 'moca-devnet',
      chainId: 5151
    });
    
    const provider = new ethers.JsonRpcProvider(RPC_URL, staticNetwork, {
      staticNetwork: true
    });
    
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    recordTest('Network Connection', true);
    console.log(`  - Chain ID: ${network.chainId}`);
    console.log(`  - Block Number: ${blockNumber}`);
    
    return provider;
  } catch (error) {
    recordTest('Network Connection', false, error.message);
    return null;
  }
}

function printTestSummary() {
  logSection('Test Summary');
  
  console.log(`\nTotal Tests: ${testResults.tests.length}`);
  logSuccess(`Passed: ${testResults.passed}`);
  if (testResults.failed > 0) {
    logError(`Failed: ${testResults.failed}`);
  }
  
  const successRate = ((testResults.passed / testResults.tests.length) * 100).toFixed(1);
  console.log(`\nSuccess Rate: ${successRate}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
  }
  
  console.log('\n');
  
  if (testResults.failed === 0) {
    logSuccess('🎉 All integration tests passed! Ready for end-to-end testing.');
    return true;
  } else {
    logError('⚠️  Some tests failed. Please fix issues before proceeding.');
    return false;
  }
}

async function main() {
  console.clear();
  log('\n╔════════════════════════════════════════════════════════════╗', colors.blue);
  log('║       CREDO PROTOCOL - PHASE 4 INTEGRATION TESTS          ║', colors.blue);
  log('╚════════════════════════════════════════════════════════════╝', colors.blue);
  
  logInfo('\nThis script will verify:');
  console.log('  1. Backend service health and issuer initialization');
  console.log('  2. Issuer registration in CreditScoreOracle contract');
  console.log('  3. Credential API functionality');
  console.log('  4. Contract read operations');
  console.log('  5. Network connectivity');
  
  console.log('\nPress Ctrl+C to cancel...\n');
  
  // Wait a moment before starting
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run tests
  const provider = await testNetworkConnection();
  if (!provider) {
    logError('Cannot proceed without network connection');
    process.exit(1);
  }
  
  await testBackendHealth();
  await testIssuerRegistration(provider);
  await testCredentialAPI();
  await testContractInteraction(provider);
  
  // Print summary
  const allPassed = printTestSummary();
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

