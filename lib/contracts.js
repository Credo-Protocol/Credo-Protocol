/**
 * Smart Contract Configuration and ABIs
 * 
 * This file contains contract addresses and ABI definitions
 * for interacting with the Credo Protocol smart contracts on Moca Chain.
 */

// Contract addresses from .env.local
export const CONTRACTS = {
  CREDIT_ORACLE: process.env.NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS || '0x91f94Dd05D397de363CFcb5fcf396272a07a8dcd',
  LENDING_POOL: process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS || '0x5f8832b3F5D037F345e9aF9db9A0816E681E6C99',
  MOCK_USDC: process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || '0x53060dDE048c99bB6B1E9556c294D12E9272f52F',
};

// Issuer addresses for reference
export const ISSUERS = {
  EXCHANGE: process.env.NEXT_PUBLIC_MOCK_EXCHANGE_ADDRESS || '0x499CEB20A05A1eF76D6805f293ea9fD570d6A431',
  EMPLOYER: process.env.NEXT_PUBLIC_MOCK_EMPLOYER_ADDRESS || '0x22a052d047E8EDC3A75010588B034d66db9bBCE1',
  BANK: process.env.NEXT_PUBLIC_MOCK_BANK_ADDRESS || '0x3cb42f88131DBe9D0b53E0c945c6e1F76Ea0220E',
};

// Backend API URL
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

/**
 * CreditScoreOracle v2 ABI
 * Includes all v2 registry, tier, and transparency features
 */
export const CREDIT_ORACLE_ABI = [
  // ============ Read Functions ============
  // Legacy scoring
  'function getCreditScore(address user) view returns (uint256)',
  'function getScoreDetails(address user) view returns (uint256 score, uint256 credentialCount, uint256 lastUpdated, bool initialized)',
  'function isIssuerRegistered(address issuer) view returns (bool)',
  'function getUserCredentialCount(address user) view returns (uint256)',
  'function isScoreAboveThreshold(address user, uint256 threshold) view returns (bool)',
  
  // Issuer Registry (v2)
  'function issuers(address issuer) view returns (bool registered, bool isActive, uint8 trustScore, string name, uint256 registeredAt, uint256 credentialCount)',
  
  // Credential Type Registry (v2)
  'function credentialTypes(bytes32 typeHash) view returns (uint16 baseWeight, uint8 decayDays, bool isActive, string displayName)',
  
  // Tier Configuration (v2)
  'function tiers(uint256 index) view returns (uint16 minScore, uint16 maxScore, uint16 collateralFactor, string tierName)',
  'function getTierForScore(uint16 score) view returns (tuple(uint16 minScore, uint16 maxScore, uint16 collateralFactor, string tierName))',
  
  // Constants (v2)
  'function MAX_CREDENTIALS_PER_USER() view returns (uint256)',
  
  // ============ Write Functions ============
  // Phase 2 submission (updated signature)
  'function submitCredential(bytes memory credentialData, bytes memory signature, address issuer, bytes32 credentialTypeHash, uint256 expirationTimestamp) returns (uint256)',
  
  // V2 Score Computation
  'function computeCreditScore(address user) returns (uint16)',
  
  // Admin functions (owner only) - for reference
  'function registerIssuer(address issuer, uint8 trustScore, string memory name)',
  'function updateIssuerTrust(address issuer, uint8 newTrustScore)',
  'function deactivateIssuer(address issuer)',
  'function registerCredentialType(bytes32 typeHash, uint16 baseWeight, uint8 decayDays, string memory displayName)',
  'function updateCredentialTypeWeight(bytes32 typeHash, uint16 newWeight)',
  'function initializeTiers()',
  
  // ============ Events ============
  // Legacy Events
  'event CredentialSubmitted(address indexed user, address indexed issuer, uint256 credentialType, uint256 newScore)',
  'event ScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore)',
  
  // Issuer Registry Events (v2)
  'event IssuerRegistered(address indexed issuer, uint8 trustScore, string name)',
  'event IssuerTrustUpdated(address indexed issuer, uint8 oldScore, uint8 newScore)',
  'event IssuerDeactivated(address indexed issuer)',
  
  // Credential Type Registry Events (v2)
  'event CredentialTypeRegistered(bytes32 indexed typeHash, uint16 baseWeight, string displayName)',
  'event CredentialTypeUpdated(bytes32 indexed typeHash, uint16 newWeight)',
  
  // Score Computation Events (v2)
  'event ScoreComputed(address indexed user, uint16 baseScore, uint8 diversityBonusPercent, uint16 finalScore, bytes32 scoreRoot)',
  'event ScoreComponentAdded(address indexed user, bytes32 indexed credentialType, uint16 pointsAdded, uint8 trustScore, uint8 recencyPercent)'
];

/**
 * LendingPool ABI (Phase 3: Includes Interest System)
 * Only includes the functions we need for the frontend
 */
export const LENDING_POOL_ABI = [
  // Read functions
  'function getUserAccountData(address user) view returns (uint256 totalCollateralInUSD, uint256 totalDebtInUSD, uint256 availableBorrowsInUSD, uint256 currentLiquidationThreshold, uint256 healthFactor)',
  'function calculateCollateralFactor(uint256 creditScore) pure returns (uint256)',
  'function assets(address asset) view returns (uint256 totalSupply, uint256 totalBorrowed, uint256 baseInterestRate, uint256 utilizationRate, bool enabled)',
  'function getUserSupplied(address user, address asset) view returns (uint256)',
  'function getUserBorrowed(address user, address asset) view returns (uint256)',
  
  // Phase 3: Interest System (NEW)
  'function getBorrowBalanceWithInterest(address user, address asset) view returns (uint256)',
  'function getAccruedInterest(address user, address asset) view returns (uint256)',
  'function getUserAPR(address user) view returns (uint256)',
  'function getTierAPR(uint256 creditScore) view returns (uint256)',
  'function globalBorrowIndex(address asset) view returns (uint256)',
  'function userBorrowIndex(address user, address asset) view returns (uint256)',
  'function tierInterestRates(uint256 tierIndex) view returns (uint16)',
  'function accrueInterest(address asset)',
  
  // Write functions
  'function supply(address asset, uint256 amount)',
  'function withdraw(address asset, uint256 amount)',
  'function borrow(address asset, uint256 amount)',
  'function repay(address asset, uint256 amount)',
  
  // Events
  'event Supplied(address indexed user, address indexed asset, uint256 amount)',
  'event Withdrawn(address indexed user, address indexed asset, uint256 amount)',
  'event Borrowed(address indexed user, address indexed asset, uint256 amount, uint256 interestRate, uint256 collateralFactor)',
  'event Repaid(address indexed user, address indexed asset, uint256 amount)'
];

/**
 * ERC20 ABI (for MockUSDC)
 */
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  
  // MockUSDC specific
  'function faucet(address to, uint256 amount)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

/**
 * Moca Chain Devnet Configuration
 */
export const MOCA_CHAIN = {
  id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '5151'),
  name: 'Moca Chain Devnet',
  network: 'moca-devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MOCA',
    symbol: 'MOCA',
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet-rpc.mocachain.org'] },
    public: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet-rpc.mocachain.org'] },
  },
  blockExplorers: {
    default: { 
      name: 'Moca Chain Explorer', 
      url: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://devnet-scan.mocachain.org'
    },
  },
  testnet: true,
};

/**
 * Credential Type Mapping (v2 Enhanced)
 */
export const CREDENTIAL_TYPES = {
  0: 'Proof of Income',
  1: 'Proof of Stable Balance',
  2: 'Proof of CEX History',
  3: 'Proof of Employment',
  4: 'Proof of On-Chain Activity',
};

/**
 * Credential Type Hashes (v2) - for querying the registry
 * Use ethers.id() to compute these on the frontend
 */
export const CREDENTIAL_TYPE_NAMES = {
  CEX_HISTORY: 'CEX_HISTORY',
  EMPLOYMENT: 'EMPLOYMENT',
  BANK_BALANCE: 'BANK_BALANCE',
  INCOME: 'INCOME',
  ON_CHAIN_ACTIVITY: 'ON_CHAIN_ACTIVITY',
};

/**
 * Tier Configuration (v2) - matches on-chain tiers
 */
export const TIERS = [
  { index: 0, name: 'Exceptional', minScore: 900, maxScore: 1000, collateral: 50 },
  { index: 1, name: 'Excellent', minScore: 800, maxScore: 899, collateral: 60 },
  { index: 2, name: 'Good', minScore: 700, maxScore: 799, collateral: 75 },
  { index: 3, name: 'Fair', minScore: 600, maxScore: 699, collateral: 90 },
  { index: 4, name: 'Average', minScore: 500, maxScore: 599, collateral: 100 },
  { index: 5, name: 'Below Average', minScore: 400, maxScore: 499, collateral: 110 },
  { index: 6, name: 'Poor', minScore: 300, maxScore: 399, collateral: 125 },
  { index: 7, name: 'Very Poor', minScore: 0, maxScore: 299, collateral: 150 },
];

/**
 * Helper function to calculate collateral factor from credit score
 * Mirrors the smart contract logic
 */
export function calculateCollateralFactor(score) {
  if (score >= 900) return 50;
  if (score >= 800) return 60;
  if (score >= 700) return 75;
  if (score >= 600) return 90;
  if (score >= 500) return 100;
  if (score >= 400) return 110;
  if (score >= 300) return 125;
  return 150;
}

/**
 * Helper function to get score label (v2 - matches tier names)
 */
export function getScoreLabel(score) {
  const tier = TIERS.find(t => score >= t.minScore && score <= t.maxScore);
  return tier ? tier.name : 'Unknown';
}

/**
 * Helper function to get tier for score (v2)
 */
export function getTierForScore(score) {
  return TIERS.find(t => score >= t.minScore && score <= t.maxScore) || TIERS[7];
}

/**
 * Helper function to calculate interest rate from credit score
 * Mirrors the smart contract tierInterestRates logic
 * Returns APR as a percentage (e.g., 5.0 for 5%)
 */
export function calculateInterestRate(score) {
  if (score >= 900) return 5.0;   // 500 basis points = 5%
  if (score >= 800) return 6.0;   // 600 basis points = 6%
  if (score >= 700) return 7.5;   // 750 basis points = 7.5%
  if (score >= 600) return 9.0;   // 900 basis points = 9%
  if (score >= 500) return 11.0;  // 1100 basis points = 11%
  if (score >= 400) return 13.0;  // 1300 basis points = 13%
  if (score >= 300) return 15.0;  // 1500 basis points = 15%
  return 18.0;                    // 1800 basis points = 18%
}

/**
 * Helper function to get score color
 */
export function getScoreColor(score) {
  if (score >= 700) return 'text-green-500';
  if (score >= 500) return 'text-yellow-500';
  if (score >= 300) return 'text-orange-500';
  return 'text-red-500';
}

