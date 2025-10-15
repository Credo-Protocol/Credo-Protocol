/**
 * Smart Contract Configuration and ABIs
 * 
 * This file contains contract addresses and ABI definitions
 * for interacting with the Credo Protocol smart contracts on Moca Chain.
 */

// Contract addresses from .env.local
export const CONTRACTS = {
  CREDIT_ORACLE: process.env.NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS || '0xb7a66cda5A21E3206f0Cb844b7938790D6aE807c',
  LENDING_POOL: process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS || '0x78aCb19366A0042dA3263747bda14BA43d68B0de',
  MOCK_USDC: process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || '0xd84254b80e4C41A88aF309793F180a206421b450',
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
 * CreditScoreOracle ABI
 * Only includes the functions we need for the frontend
 */
export const CREDIT_ORACLE_ABI = [
  // Read functions
  'function getCreditScore(address user) view returns (uint256)',
  'function getScoreDetails(address user) view returns (uint256 score, uint256 credentialCount, uint256 lastUpdated, bool initialized)',
  'function isIssuerRegistered(address issuer) view returns (bool)',
  'function issuers(address issuer) view returns (bool registered, uint256 trustScore, uint256 credentialCount)',
  
  // Write functions
  'function submitCredential(bytes memory credentialData, bytes memory signature, address issuer, uint256 credentialType, uint256 expirationTimestamp) returns (uint256)',
  
  // Events
  'event CredentialSubmitted(address indexed user, address indexed issuer, uint256 credentialType, uint256 newScore, uint256 timestamp)',
  'event ScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore)'
];

/**
 * LendingPool ABI
 * Only includes the functions we need for the frontend
 */
export const LENDING_POOL_ABI = [
  // Read functions
  'function getUserAccountData(address user) view returns (uint256 totalCollateralInUSD, uint256 totalDebtInUSD, uint256 availableBorrowsInUSD, uint256 currentLiquidationThreshold, uint256 healthFactor)',
  'function calculateCollateralFactor(uint256 creditScore) pure returns (uint256)',
  'function assets(address asset) view returns (uint256 totalSupply, uint256 totalBorrowed, uint256 baseInterestRate, uint256 utilizationRate, bool enabled)',
  'function getUserSupplied(address user, address asset) view returns (uint256)',
  'function getUserBorrowed(address user, address asset) view returns (uint256)',
  
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
 * Credential Type Mapping
 */
export const CREDENTIAL_TYPES = {
  0: 'Proof of Income',
  1: 'Proof of Stable Balance',
  2: 'Proof of CEX History',
  3: 'Proof of Employment',
  4: 'Proof of On-Chain Activity',
};

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
 * Helper function to get score label
 */
export function getScoreLabel(score) {
  if (score >= 900) return 'Excellent';
  if (score >= 700) return 'Very Good';
  if (score >= 500) return 'Good';
  if (score >= 300) return 'Fair';
  if (score > 0) return 'Building';
  return 'Not Started';
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

