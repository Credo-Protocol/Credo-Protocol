# Credo Protocol Integration Guide

**Version**: 1.0  
**Date**: October 27, 2025  
**Network**: Moca Chain Devnet (Chain ID: 5151)

---

## 🎯 Overview

Credo Protocol provides a **composable credit scoring infrastructure** for the MOCA ecosystem. Any dApp can query on-chain credit scores to enable credit-based features like:

- 🎮 **GameFi**: Reputation-gated content and dynamic rewards
- 🏛️ **DAOs**: Credit-weighted voting and proposal thresholds
- 🛒 **Commerce**: Buy now, pay later with trust-based limits
- 💰 **DeFi**: Reduced collateral requirements and dynamic pricing
- 🎨 **NFTs**: Credit-gated mints and exclusive holder benefits

This guide shows you how to integrate Credo scores into your application.

---

## 🚀 Quick Start (5 Minutes)

### Option A: REST API (Easiest)

Query credit scores from any language via our public API:

```bash
curl https://credo-protocol.vercel.app/api/score/0xYOUR_USER_ADDRESS
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "address": "0x24df9DD8b51B1C7137A656596C66784F72fbb5fc",
    "creditScore": 792,
    "tier": {
      "name": "Good",
      "minScore": 700,
      "maxScore": 799,
      "collateralRequired": "75%",
      "borrowAPR": "7.5%"
    },
    "borrowingPower": {
      "collateralFactor": 75,
      "borrowPerDollar": "$1.33"
    },
    "credentials": {
      "count": 2
    }
  }
}
```

### Option B: Smart Contract (On-Chain)

Call the oracle directly from your Solidity contract:

```solidity
interface ICreditScoreOracle {
    function getCreditScore(address user) external view returns (uint256);
}

contract MyDApp {
    ICreditScoreOracle oracle = ICreditScoreOracle(0x12ad1aBfBde99Ce4D37fB18A5e622A619d59f705);
    
    function requireGoodCredit(address user) public view {
        uint256 score = oracle.getCreditScore(user);
        require(score >= 700, "Minimum credit score: 700");
    }
}
```

---

## 📡 REST API Reference

### Endpoint: Get Credit Score

**URL**: `GET /api/score/:address`  
**Base URL**: `https://credo-protocol.vercel.app`  
**CORS**: Enabled (all origins)  
**Rate Limit**: 60 requests/minute (cached)  
**Cache**: 60 seconds

#### Request

```bash
curl https://credo-protocol.vercel.app/api/score/0x24df9DD8b51B1C7137A656596C66784F72fbb5fc
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "address": "0x24df9DD8b51B1C7137A656596C66784F72fbb5fc",
    "creditScore": 850,
    "tier": {
      "name": "Excellent",
      "minScore": 800,
      "maxScore": 899,
      "collateralRequired": "60%",
      "borrowAPR": "6%"
    },
    "borrowingPower": {
      "collateralFactor": 60,
      "borrowPerDollar": "$1.67",
      "example": {
        "supply": "$1000",
        "canBorrow": "$1666",
        "description": "With excellent credit, borrow 167% of your collateral value"
      }
    },
    "credentials": {
      "count": 4,
      "types": ["INCOME_HIGH", "BANK_BALANCE_HIGH", "CEX_HISTORY", "EMPLOYMENT"]
    },
    "metadata": {
      "lastUpdated": "2025-10-27T04:15:06.820Z",
      "network": "Moca Devnet",
      "chainId": 5151,
      "cached": "60 seconds"
    }
  }
}
```

#### Error Responses

**400 Bad Request** - Invalid address format
```json
{
  "success": false,
  "error": "Invalid Ethereum address format"
}
```

**404 Not Found** - User has no credentials
```json
{
  "success": false,
  "error": "User has not submitted any credentials yet",
  "message": "Visit https://credo-protocol.vercel.app/dashboard to build your credit score"
}
```

**503 Service Unavailable** - RPC connection error
```json
{
  "success": false,
  "error": "Unable to connect to blockchain RPC"
}
```

---

## 🔗 Smart Contract Integration

### Contract Information

**Network**: Moca Chain Devnet  
**Chain ID**: 5151  
**Oracle Address**: `0x12ad1aBfBde99Ce4D37fB18A5e622A619d59f705`

### Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICreditScoreOracle {
    // Get user's credit score (0-1000)
    function getCreditScore(address user) external view returns (uint256);
    
    // Get detailed score information
    function getScoreDetails(address user) external view returns (
        uint256 score,
        uint256 credentialCount,
        uint256 lastUpdated
    );
    
    // Get tier for a given score
    function getTierForScore(uint16 score) external view returns (
        uint16 minScore,
        uint16 maxScore,
        uint16 collateralFactor,
        string memory tierName
    );
    
    // Check if user has minimum score
    function hasMinimumScore(address user, uint256 minScore) external view returns (bool);
}
```

### Example Implementations

#### 1. Credit-Gated Access

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ICreditScoreOracle.sol";

contract PremiumGameContent {
    ICreditScoreOracle public oracle;
    uint256 public constant MIN_SCORE = 700; // "Good" tier
    
    constructor(address _oracle) {
        oracle = ICreditScoreOracle(_oracle);
    }
    
    modifier requireGoodCredit() {
        require(
            oracle.getCreditScore(msg.sender) >= MIN_SCORE,
            "Premium content requires credit score >= 700"
        );
        _;
    }
    
    function unlockPremiumLevel() external requireGoodCredit {
        // Only users with Good credit or better can access
        // ... your logic here
    }
}
```

#### 2. Dynamic Pricing

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ICreditScoreOracle.sol";

contract DynamicPricingNFT {
    ICreditScoreOracle public oracle;
    uint256 public basePrice = 1 ether;
    
    constructor(address _oracle) {
        oracle = ICreditScoreOracle(_oracle);
    }
    
    function getMintPrice(address user) public view returns (uint256) {
        uint256 score = oracle.getCreditScore(user);
        
        // Exceptional (900+): 20% discount
        if (score >= 900) return basePrice * 80 / 100;
        
        // Excellent (800-899): 15% discount
        if (score >= 800) return basePrice * 85 / 100;
        
        // Good (700-799): 10% discount
        if (score >= 700) return basePrice * 90 / 100;
        
        // Fair (600-699): 5% discount
        if (score >= 600) return basePrice * 95 / 100;
        
        // Average or below: Full price
        return basePrice;
    }
    
    function mint() external payable {
        uint256 price = getMintPrice(msg.sender);
        require(msg.value >= price, "Insufficient payment");
        
        // ... minting logic
    }
}
```

#### 3. Credit-Weighted Voting (DAO)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ICreditScoreOracle.sol";

contract CreditWeightedDAO {
    ICreditScoreOracle public oracle;
    
    struct Proposal {
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        mapping(address => bool) hasVoted;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    constructor(address _oracle) {
        oracle = ICreditScoreOracle(_oracle);
    }
    
    function createProposal(string memory description) external {
        // Require minimum score to create proposals
        require(
            oracle.getCreditScore(msg.sender) >= 700,
            "Need Good credit or better to create proposals"
        );
        
        proposals[proposalCount].description = description;
        proposalCount++;
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        // Voting power = credit score (700-1000 = 0.7x to 1.0x weight)
        uint256 score = oracle.getCreditScore(msg.sender);
        uint256 votingPower = score; // Could normalize to 0-100
        
        if (support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }
        
        proposal.hasVoted[msg.sender] = true;
    }
}
```

#### 4. Uncollateralized Lending (Trust-Based)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ICreditScoreOracle.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TrustBasedLending {
    ICreditScoreOracle public oracle;
    IERC20 public usdc;
    
    mapping(address => uint256) public loans;
    mapping(address => uint256) public loanTimestamp;
    
    uint256 public constant EXCEPTIONAL_LIMIT = 10000e6; // $10k for 900+ score
    uint256 public constant EXCELLENT_LIMIT = 5000e6;    // $5k for 800-899
    uint256 public constant GOOD_LIMIT = 2000e6;         // $2k for 700-799
    
    constructor(address _oracle, address _usdc) {
        oracle = ICreditScoreOracle(_oracle);
        usdc = IERC20(_usdc);
    }
    
    function getMaxLoan(address user) public view returns (uint256) {
        uint256 score = oracle.getCreditScore(user);
        
        if (score >= 900) return EXCEPTIONAL_LIMIT;
        if (score >= 800) return EXCELLENT_LIMIT;
        if (score >= 700) return GOOD_LIMIT;
        
        return 0; // No uncollateralized loans below Good tier
    }
    
    function borrowUncollateralized(uint256 amount) external {
        require(loans[msg.sender] == 0, "Existing loan must be repaid");
        
        uint256 maxLoan = getMaxLoan(msg.sender);
        require(maxLoan > 0, "Credit score too low for uncollateralized loan");
        require(amount <= maxLoan, "Amount exceeds credit limit");
        
        loans[msg.sender] = amount;
        loanTimestamp[msg.sender] = block.timestamp;
        
        usdc.transfer(msg.sender, amount);
    }
    
    function repay() external {
        uint256 amount = loans[msg.sender];
        require(amount > 0, "No active loan");
        
        // Could add interest calculation here
        usdc.transferFrom(msg.sender, address(this), amount);
        
        delete loans[msg.sender];
        delete loanTimestamp[msg.sender];
    }
}
```

---

## 🎮 Use Case Examples

### GameFi: Reputation-Based Matchmaking

**Problem**: Prevent toxic players from ruining ranked matches.

**Solution**: Gate competitive modes by credit score.

```javascript
// Frontend integration
async function canJoinRankedMatch(playerAddress) {
  const response = await fetch(
    `https://credo-protocol.vercel.app/api/score/${playerAddress}`
  );
  const data = await response.json();
  
  if (!data.success) {
    return { allowed: false, reason: "No credit history" };
  }
  
  const score = data.data.creditScore;
  
  // Require Fair credit or better for ranked
  if (score >= 600) {
    return { allowed: true, tier: data.data.tier.name };
  }
  
  return { 
    allowed: false, 
    reason: `Ranked matches require credit score >= 600. Your score: ${score}` 
  };
}
```

### DAOs: Proposal Gating

**Problem**: Spam proposals from new/untrustworthy members.

**Solution**: Require minimum credit score to create proposals.

```solidity
function createProposal(string memory description) external {
    uint256 score = oracle.getCreditScore(msg.sender);
    require(score >= 700, "Need Good credit (700+) to create proposals");
    
    // ... proposal creation logic
}
```

### NFT Marketplace: Installment Payments

**Problem**: Enable "buy now, pay later" for NFTs without centralized credit checks.

**Solution**: Allow credit-based installment plans.

```solidity
function buyWithInstallments(uint256 tokenId) external {
    uint256 score = oracle.getCreditScore(msg.sender);
    require(score >= 700, "Installments require credit score >= 700");
    
    uint256 price = getNFTPrice(tokenId);
    uint256 downPayment = price * 30 / 100; // 30% down
    
    // Collect down payment now
    usdc.transferFrom(msg.sender, address(this), downPayment);
    
    // Set up installment plan (3 months for Good credit, 6 for Excellent)
    uint256 installments = score >= 800 ? 6 : 3;
    // ... create installment schedule
}
```

### DeFi: Dynamic Interest Rates

**Problem**: One-size-fits-all lending rates are inefficient.

**Solution**: Offer better rates to more creditworthy users.

```solidity
function getBorrowAPR(address user) public view returns (uint256) {
    uint256 score = oracle.getCreditScore(user);
    
    // Better credit = lower rates
    if (score >= 900) return 500;  // 5% APR
    if (score >= 800) return 600;  // 6% APR
    if (score >= 700) return 750;  // 7.5% APR
    if (score >= 600) return 900;  // 9% APR
    if (score >= 500) return 1100; // 11% APR
    
    return 1800; // 18% APR for low/no credit
}
```

---

## 🛡️ Best Practices

### 1. **Cache API Responses**

The public API already caches responses for 60 seconds. Add your own caching layer for better UX:

```javascript
const scoreCache = new Map();
const CACHE_DURATION = 60000; // 1 minute

async function getCreditScoreWithCache(address) {
  const now = Date.now();
  const cached = scoreCache.get(address);
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  const response = await fetch(`https://credo-protocol.vercel.app/api/score/${address}`);
  const data = await response.json();
  
  scoreCache.set(address, { data, timestamp: now });
  return data;
}
```

### 2. **Handle Missing Scores Gracefully**

Not all users will have credit scores yet:

```javascript
async function getScoreOrDefault(address) {
  try {
    const response = await fetch(`https://credo-protocol.vercel.app/api/score/${address}`);
    const data = await response.json();
    
    if (!data.success) {
      // User has no score - treat as new user
      return { score: 500, tier: "Average", isDefault: true };
    }
    
    return { score: data.data.creditScore, tier: data.data.tier.name, isDefault: false };
  } catch (error) {
    console.error('Failed to fetch score:', error);
    // Fallback to default on error
    return { score: 500, tier: "Average", isDefault: true };
  }
}
```

### 3. **Display Score Improvement Path**

Encourage users to build their score:

```javascript
function getScoreGuidance(currentScore) {
  const tiers = [
    { min: 900, name: "Exceptional", benefits: "50% collateral, 5% APR, all perks unlocked" },
    { min: 800, name: "Excellent", benefits: "60% collateral, 6% APR, premium features" },
    { min: 700, name: "Good", benefits: "75% collateral, 7.5% APR, most features" },
    { min: 600, name: "Fair", benefits: "90% collateral, 9% APR, standard access" },
    { min: 500, name: "Average", benefits: "100% collateral, 11% APR, basic access" },
  ];
  
  const nextTier = tiers.find(t => currentScore < t.min);
  
  if (!nextTier) {
    return "You have the highest possible credit tier!";
  }
  
  const pointsNeeded = nextTier.min - currentScore;
  return `Get ${pointsNeeded} more points to reach ${nextTier.name} tier and unlock: ${nextTier.benefits}`;
}
```

### 4. **Implement Rate Limiting**

Respect the 60 req/min limit:

```javascript
class RateLimitedScoreFetcher {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.requestsThisMinute = 0;
    this.minuteStart = Date.now();
  }
  
  async fetch(address) {
    return new Promise((resolve, reject) => {
      this.queue.push({ address, resolve, reject });
      this.process();
    });
  }
  
  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    // Reset counter every minute
    const now = Date.now();
    if (now - this.minuteStart > 60000) {
      this.requestsThisMinute = 0;
      this.minuteStart = now;
    }
    
    // Wait if at limit
    if (this.requestsThisMinute >= 60) {
      const waitTime = 60000 - (now - this.minuteStart);
      await new Promise(r => setTimeout(r, waitTime));
      this.requestsThisMinute = 0;
      this.minuteStart = Date.now();
    }
    
    const { address, resolve, reject } = this.queue.shift();
    this.requestsThisMinute++;
    
    try {
      const response = await fetch(`https://credo-protocol.vercel.app/api/score/${address}`);
      const data = await response.json();
      resolve(data);
    } catch (error) {
      reject(error);
    }
    
    this.processing = false;
    this.process(); // Process next in queue
  }
}
```

### 5. **Use Events for Real-Time Updates**

Listen to on-chain score changes instead of polling:

```javascript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://rpc.moca.network');
const oracleAddress = '0x12ad1aBfBde99Ce4D37fB18A5e622A619d59f705';

const oracleABI = [
  "event ScoreComputed(address indexed user, uint16 baseScore, uint8 diversityBonusPercent, uint16 finalScore, bytes32 scoreRoot)"
];

const oracle = new ethers.Contract(oracleAddress, oracleABI, provider);

// Listen for score updates
oracle.on("ScoreComputed", (user, baseScore, diversityBonus, finalScore, scoreRoot) => {
  console.log(`User ${user} score updated to ${finalScore}`);
  // Update your UI/cache here
});
```

---

## 🔒 Security Considerations

### 1. **Validate On-Chain for Critical Operations**

For high-value operations, always validate on-chain:

```solidity
// ❌ BAD: Trust off-chain API result
function criticalOperation() external {
    // Don't trust any off-chain data for critical operations
}

// ✅ GOOD: Verify on-chain
function criticalOperation() external {
    uint256 score = oracle.getCreditScore(msg.sender);
    require(score >= 800, "Requires Excellent credit");
    // ... proceed
}
```

### 2. **Handle Score Changes**

User scores can change over time:

```solidity
// Store score at operation time, not user address
struct Loan {
    address borrower;
    uint256 amount;
    uint256 scoreAtBorrow; // Store for reference
    uint256 timestamp;
}

mapping(uint256 => Loan) public loans;
```

### 3. **Set Appropriate Minimums**

Different features should have different score requirements:

```
Low-risk features (viewing, participation): 500+ (Average)
Medium-risk features (voting, small trades): 600+ (Fair)
High-risk features (creating, borrowing): 700+ (Good)
Critical features (governance, large loans): 800+ (Excellent)
```

### 4. **Implement Timeouts**

Don't let API calls block your application:

```javascript
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
```

---

## 📊 Credit Score Tiers

Understanding the tier system helps you design appropriate features:

| Tier | Score Range | Collateral | Borrow APR | Typical Users |
|------|-------------|------------|------------|---------------|
| **Exceptional** | 900-1000 | 50% | 5% | Power users with all credentials |
| **Excellent** | 800-899 | 60% | 6% | High-income, stable finances |
| **Good** | 700-799 | 75% | 7.5% | Proven employment + balance |
| **Fair** | 600-699 | 90% | 9% | Basic credentials submitted |
| **Average** | 500-599 | 100% | 11% | New users, few credentials |
| **Below Average** | 400-499 | 110% | 13% | Single low-value credential |
| **Poor** | 300-399 | 125% | 15% | Very limited history |
| **Very Poor** | 0-299 | 150% | 18% | No credentials (standard DeFi) |

---

## 🔧 Testing

### Local Testing (Devnet)

```javascript
// Test with a known address on Moca Devnet
const testAddress = "0x24df9DD8b51B1C7137A656596C66784F72fbb5fc";

async function testIntegration() {
  console.log("Testing Credo API integration...");
  
  const response = await fetch(
    `https://credo-protocol.vercel.app/api/score/${testAddress}`
  );
  const data = await response.json();
  
  console.log("✅ API Response:", data);
  console.log(`Score: ${data.data.creditScore}`);
  console.log(`Tier: ${data.data.tier.name}`);
}

testIntegration();
```

### Smart Contract Testing

```javascript
import { ethers } from "hardhat";

describe("Credit Score Integration", function() {
  it("Should fetch credit score on-chain", async function() {
    const Oracle = await ethers.getContractAt(
      "ICreditScoreOracle",
      "0x12ad1aBfBde99Ce4D37fB18A5e622A619d59f705"
    );
    
    const testUser = "0x24df9DD8b51B1C7137A656596C66784F72fbb5fc";
    const score = await Oracle.getCreditScore(testUser);
    
    console.log(`Credit Score: ${score}`);
    expect(score).to.be.gte(500); // At least average
  });
});
```

---

## 📞 Support & Resources

- **Documentation**: [GitHub Repository](https://github.com/YourUsername/Credo-Protocol)
- **Live Demo**: [https://credo-protocol.vercel.app](https://credo-protocol.vercel.app)
- **API Base**: [https://credo-protocol.vercel.app/api](https://credo-protocol.vercel.app/api)
- **Explorer**: [Moca Devnet Explorer](https://devnet-scan.mocachain.org)
- **Contact**: [@marcustan1337](https://x.com/marcustan1337) on X/Twitter

---

## 📄 License

This integration guide is part of Credo Protocol, licensed under MIT.

---

**Built for Moca Network Proof of Build - Wave 3**  
**Last Updated**: October 27, 2025

