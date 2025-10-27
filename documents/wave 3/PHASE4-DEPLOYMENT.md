# Phase 4: Testnet Deployment & Ecosystem

**Day**: 3 PM (Oct 27)  
**Duration**: 6-8 hours  
**Prerequisites**: Phases 1, 2, 3 Complete  
**Next**: [PHASE5-DOCS-DEMO.md](./PHASE5-DOCS-DEMO.md)

---

## 🎯 Goal

Deploy all contracts to Moca testnet, create composable score API, build leaderboard, and demonstrate ecosystem readiness.

**Why This Phase**: Addresses "deploy to testnet" feedback and shows adoption path with composable infrastructure.

---

## 📋 What You're Building

### Part A: Testnet Deployment (3 hours)
- Configure Hardhat for Moca testnet
- Deploy all contracts (Oracle v2, LendingPool v2, MockUSDC)
- Initialize registries with all credential types
- Verify contracts on block explorer

### Part B: Composable Score API (2 hours)
- Public `/api/score/:address` endpoint
- CORS configuration for cross-origin access
- JSON response with score, tier, and usage guide

### Part C: Leaderboard & Adoption (2 hours)
- Leaderboard component showing top users
- Event-based data aggregation
- Demonstrate network effects

---

## 🛠️ Part A: Testnet Deployment

### Step 1: Configure Moca Testnet (30 min)

**File**: `contracts/hardhat.config.ts`

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        // Existing devnet
        mocaDevnet: {
            url: "https://devnet-rpc.mocachain.org",
            chainId: 5151,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 1000000000
        },
        // NEW: Testnet configuration
        mocaTestnet: {
            url: process.env.TESTNET_RPC_URL || "https://rpc.testnet.mocachain.org",
            chainId: 5151, // Confirm actual testnet chain ID
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 1000000000,
            timeout: 60000
        }
    },
    etherscan: {
        apiKey: {
            mocaDevnet: "no-api-key-needed",
            mocaTestnet: "no-api-key-needed"
        },
        customChains: [
            {
                network: "mocaDevnet",
                chainId: 5151,
                urls: {
                    apiURL: "https://devnet-scan.mocachain.org/api",
                    browserURL: "https://devnet-scan.mocachain.org"
                }
            },
            {
                network: "mocaTestnet",
                chainId: 5151,
                urls: {
                    apiURL: "https://testnet-scan.mocachain.org/api",
                    browserURL: "https://testnet-scan.mocachain.org"
                }
            }
        ]
    }
};

export default config;
```

---

### Step 2: Create Comprehensive Deployment Script (1 hour)

**File**: `contracts/scripts/deploy-wave3.ts`

```typescript
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    console.log("\n🚀 Deploying Credo Protocol Wave 3 to Moca Testnet...\n");
    
    const [deployer] = await ethers.getSigners();
    const balance = await deployer.getBalance();
    
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(balance), "MOCA\n");
    
    if (balance.lt(ethers.utils.parseEther("0.1"))) {
        console.warn("⚠️  Low balance! Get testnet MOCA from faucet: https://testnet-scan.mocachain.org/faucet\n");
        return;
    }
    
    // ===== 1. Deploy MockUSDC =====
    console.log("📝 Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.deployed();
    console.log("✅ MockUSDC deployed to:", usdc.address);
    console.log("   Transaction:", usdc.deployTransaction.hash, "\n");
    
    // ===== 2. Deploy CreditScoreOracle v2 =====
    console.log("📝 Deploying CreditScoreOracle v2...");
    const Oracle = await ethers.getContractFactory("CreditScoreOracle");
    const oracle = await Oracle.deploy();
    await oracle.deployed();
    console.log("✅ CreditScoreOracle deployed to:", oracle.address);
    console.log("   Transaction:", oracle.deployTransaction.hash, "\n");
    
    // ===== 3. Deploy LendingPool v2 =====
    console.log("📝 Deploying LendingPool v2...");
    const LendingPool = await ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPool.deploy(usdc.address, oracle.address);
    await lendingPool.deployed();
    console.log("✅ LendingPool deployed to:", lendingPool.address);
    console.log("   Transaction:", lendingPool.deployTransaction.hash, "\n");
    
    // ===== 4. Initialize Tiers =====
    console.log("📝 Initializing credit score tiers...");
    const initTx = await oracle.initializeTiers();
    await initTx.wait();
    console.log("✅ Tiers initialized\n");
    
    // ===== 5. Register Issuers =====
    console.log("📝 Registering credential issuers...");
    
    const bankIssuer = process.env.BANK_ISSUER_ADDRESS || deployer.address;
    const exchangeIssuer = process.env.EXCHANGE_ISSUER_ADDRESS || deployer.address;
    const employerIssuer = process.env.EMPLOYER_ISSUER_ADDRESS || deployer.address;
    
    await (await oracle.registerIssuer(bankIssuer, 100, "Mock Bank Issuer")).wait();
    console.log("  ✅ Bank Issuer:", bankIssuer);
    
    await (await oracle.registerIssuer(exchangeIssuer, 100, "Mock Exchange Issuer")).wait();
    console.log("  ✅ Exchange Issuer:", exchangeIssuer);
    
    await (await oracle.registerIssuer(employerIssuer, 100, "Mock Employer Issuer")).wait();
    console.log("  ✅ Employer Issuer:", employerIssuer, "\n");
    
    // ===== 6. Register Credential Types =====
    console.log("📝 Registering credential types (Wave 3 - 10 types)...");
    
    const credentialTypes = [
        // Bank Balance Buckets
        { name: "BANK_BALANCE_HIGH", weight: 150, decay: 90, display: "Bank Balance (High)" },
        { name: "BANK_BALANCE_MEDIUM", weight: 120, decay: 90, display: "Bank Balance (Medium)" },
        { name: "BANK_BALANCE_LOW", weight: 80, decay: 90, display: "Bank Balance (Low)" },
        { name: "BANK_BALANCE_MINIMAL", weight: 40, decay: 90, display: "Bank Balance (Minimal)" },
        
        // Income Range Buckets
        { name: "INCOME_VERY_HIGH", weight: 180, decay: 180, display: "Income (Very High)" },
        { name: "INCOME_HIGH", weight: 140, decay: 180, display: "Income (High)" },
        { name: "INCOME_MEDIUM", weight: 100, decay: 180, display: "Income (Medium)" },
        { name: "INCOME_LOW", weight: 50, decay: 180, display: "Income (Low)" },
        
        // Existing Basic Types
        { name: "CEX_HISTORY", weight: 80, decay: 365, display: "CEX Trading History" },
        { name: "EMPLOYMENT", weight: 70, decay: 180, display: "Employment Verified" }
    ];
    
    for (const type of credentialTypes) {
        const typeHash = ethers.utils.id(type.name);
        const tx = await oracle.registerCredentialType(
            typeHash,
            type.weight,
            type.decay,
            type.display
        );
        await tx.wait();
        console.log(`  ✅ ${type.display} (${type.weight} pts)`);
    }
    
    console.log("\n");
    
    // ===== 7. Save Deployment Info =====
    const deploymentInfo = {
        network: "mocaTestnet",
        chainId: 5151,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            mockUSDC: {
                address: usdc.address,
                txHash: usdc.deployTransaction.hash
            },
            creditScoreOracle: {
                address: oracle.address,
                txHash: oracle.deployTransaction.hash
            },
            lendingPool: {
                address: lendingPool.address,
                txHash: lendingPool.deployTransaction.hash
            }
        },
        issuers: {
            bank: bankIssuer,
            exchange: exchangeIssuer,
            employer: employerIssuer
        },
        credentialTypes: credentialTypes,
        explorer: {
            mockUSDC: `https://testnet-scan.mocachain.org/address/${usdc.address}`,
            oracle: `https://testnet-scan.mocachain.org/address/${oracle.address}`,
            lendingPool: `https://testnet-scan.mocachain.org/address/${lendingPool.address}`
        }
    };
    
    const filePath = path.join(__dirname, "../deployed-addresses-testnet.json");
    fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
    console.log("✅ Deployment info saved to:", filePath, "\n");
    
    // ===== 8. Summary =====
    console.log("🎉 Deployment Complete!\n");
    console.log("📋 Contract Addresses:");
    console.log("   MockUSDC:          ", usdc.address);
    console.log("   CreditScoreOracle: ", oracle.address);
    console.log("   LendingPool:       ", lendingPool.address, "\n");
    
    console.log("🔗 Block Explorer:");
    console.log("   https://testnet-scan.mocachain.org\n");
    
    console.log("🔍 Verify Contracts:");
    console.log(`   npx hardhat verify --network mocaTestnet ${usdc.address}`);
    console.log(`   npx hardhat verify --network mocaTestnet ${oracle.address}`);
    console.log(`   npx hardhat verify --network mocaTestnet ${lendingPool.address} ${usdc.address} ${oracle.address}\n`);
    
    console.log("📝 Next Steps:");
    console.log("   1. Update .env.local with new testnet addresses");
    console.log("   2. Update backend .env with issuer addresses");
    console.log("   3. Redeploy frontend to Vercel");
    console.log("   4. Test end-to-end flow on testnet\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

---

### Step 3: Deploy to Testnet (30 min)

```bash
# Make sure you have testnet MOCA
# Visit: https://testnet-scan.mocachain.org/faucet

# Deploy
cd contracts
npx hardhat run scripts/deploy-wave3.ts --network mocaTestnet

# ⚠️ CRITICAL: Register Issuers (REQUIRED STEP!)
# Without this, credential submissions will fail with "missing revert data" error
npx hardhat run --network mocaTestnet scripts/register-deployer-issuer.ts

# Verify contracts (after deployment)
npx hardhat verify --network mocaTestnet <ORACLE_ADDRESS>
npx hardhat verify --network mocaTestnet <LENDING_POOL_ADDRESS> <USDC_ADDRESS> <ORACLE_ADDRESS>
npx hardhat verify --network mocaTestnet <USDC_ADDRESS>
```

**⚠️ Important Note on Issuer Registration:**

The issuer registration step is **MANDATORY** after every contract deployment. Without it:
- Credential submissions will fail
- You'll see "missing revert data" errors
- The Oracle won't accept any credentials

This step registers:
- Your deployer address as a trusted issuer (for testing)
- All mock issuer addresses (Exchange, Employer, Bank)

---

### Step 4: Update Environment Variables (20 min)

**File**: `.env.local` (frontend)

```bash
# Update with testnet addresses
NEXT_PUBLIC_LENDING_POOL_ADDRESS=<TESTNET_LENDING_POOL_ADDRESS>
NEXT_PUBLIC_CREDIT_SCORE_ORACLE_ADDRESS=<TESTNET_ORACLE_ADDRESS>
NEXT_PUBLIC_USDC_ADDRESS=<TESTNET_USDC_ADDRESS>
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.mocachain.org
NEXT_PUBLIC_CHAIN_ID=5151
NEXT_PUBLIC_EXPLORER_URL=https://testnet-scan.mocachain.org
```

**File**: `backend/.env`

```bash
# Update issuer addresses if using separate accounts
BANK_ISSUER_ADDRESS=<TESTNET_BANK_ISSUER>
EXCHANGE_ISSUER_ADDRESS=<TESTNET_EXCHANGE_ISSUER>
EMPLOYER_ISSUER_ADDRESS=<TESTNET_EMPLOYER_ISSUER>
```

---

## 🛠️ Part B: Composable Score API

### Step 5: Create Public Score API (1 hour)

**File**: `pages/api/score/[address].js`

```javascript
import { ethers } from 'ethers';

const CREDIT_SCORE_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_CREDIT_SCORE_ORACLE_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.mocachain.org';

const ORACLE_ABI = [
    "function getCreditScore(address) view returns (uint16)",
    "function getCollateralFactor(address) view returns (uint16)",
    "function getUserCredentials(address) view returns (tuple(string credentialType, address issuer, address subject, uint256 issuanceDate, uint256 expirationDate)[])",
    "function getTierForScore(uint16) view returns (tuple(uint16 minScore, uint16 maxScore, uint16 collateralFactor, string tierName))"
];

export default async function handler(req, res) {
    // CORS headers for cross-origin access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            allowedMethods: ['GET']
        });
    }
    
    const { address } = req.query;
    
    // Validate address
    if (!address) {
        return res.status(400).json({ 
            error: 'Address parameter required',
            example: '/api/score/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
        });
    }
    
    if (!ethers.utils.isAddress(address)) {
        return res.status(400).json({ 
            error: 'Invalid Ethereum address format'
        });
    }
    
    try {
        // Connect to Moca testnet
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const oracle = new ethers.Contract(CREDIT_SCORE_ORACLE_ADDRESS, ORACLE_ABI, provider);
        
        // Fetch on-chain data
        const [score, collateralFactor, credentials, tier] = await Promise.all([
            oracle.getCreditScore(address),
            oracle.getCollateralFactor(address),
            oracle.getUserCredentials(address),
            oracle.getTierForScore(await oracle.getCreditScore(address))
        ]);
        
        // Calculate borrowing power
        const collateralPercent = collateralFactor.toNumber() / 100;
        const borrowingPowerPer100 = Math.floor(10000 / collateralPercent);
        
        // Build response
        const response = {
            success: true,
            data: {
                address: address,
                creditScore: score.toNumber(),
                tier: {
                    name: tier.tierName,
                    minScore: tier.minScore,
                    maxScore: tier.maxScore,
                    collateralFactor: `${tier.collateralFactor.toNumber() / 100}%`
                },
                borrowingPower: {
                    collateralRequired: `${collateralPercent}%`,
                    borrowPerDollar: `$${borrowingPowerPer100 / 100}`,
                    example: `Supply $1,000 → Borrow $${borrowingPowerPer100 * 10}`
                },
                credentials: {
                    count: credentials.length,
                    types: credentials.map(c => c.credentialType)
                },
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    network: 'Moca Testnet',
                    chainId: 5151
                }
            },
            composability: {
                description: "This credit score can be used by any dApp on Moca Chain",
                useCases: [
                    "Gate premium features to users with score > 700",
                    "Adjust DAO governance weights by creditworthiness",
                    "Offer 'buy now, pay later' to high-score users",
                    "Dynamic pricing based on user trust"
                ],
                integration: {
                    rest: `GET ${req.headers.host}/api/score/:address`,
                    onChain: `ICreditScoreOracle(${CREDIT_SCORE_ORACLE_ADDRESS}).getCreditScore(user)`
                }
            },
            links: {
                dashboard: `https://credo-protocol.vercel.app/dashboard`,
                explorer: `https://testnet-scan.mocachain.org/address/${CREDIT_SCORE_ORACLE_ADDRESS}`,
                docs: `https://github.com/Credo-Protocol/Credo-Protocol/tree/main/docs`
            }
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error fetching credit score:', error);
        
        // Handle specific errors
        if (error.message.includes('No credit score')) {
            return res.status(404).json({
                error: 'User has not submitted any credentials yet',
                address: address,
                suggestedAction: 'Visit https://credo-protocol.vercel.app to build credit score'
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to fetch credit score',
            message: error.message,
            address: address
        });
    }
}
```

---

### Step 6: Test API Endpoint (15 min)

```bash
# After deploying frontend, test:

# Test with valid address
curl https://credo-protocol.vercel.app/api/score/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Test with invalid address
curl https://credo-protocol.vercel.app/api/score/invalid

# Test CORS from external domain
curl -H "Origin: https://example.com" https://credo-protocol.vercel.app/api/score/0x...
```

---

## 🛠️ Part C: Leaderboard & Adoption

### Step 7: Create Leaderboard Component (1.5 hours)

**File**: `components/Leaderboard.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Medal, Award, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

export default function Leaderboard() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    
    useEffect(() => {
        fetchLeaderboard();
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchLeaderboard, 30000);
        return () => clearInterval(interval);
    }, []);
    
    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            
            const provider = new ethers.providers.JsonRpcProvider(
                process.env.NEXT_PUBLIC_RPC_URL
            );
            
            const oracle = new ethers.Contract(
                process.env.NEXT_PUBLIC_CREDIT_SCORE_ORACLE_ADDRESS,
                [
                    "event ScoreComputed(address indexed user, uint16 baseScore, tuple(bytes32 credentialType, uint16 baseWeight, uint8 trustScore, uint8 recencyPercent, uint16 finalPoints)[] components, uint8 diversityBonusPercent, uint16 finalScore, bytes32 scoreRoot)"
                ],
                provider
            );
            
            // Get ScoreComputed events from last 50,000 blocks
            const currentBlock = await provider.getBlockNumber();
            const filter = oracle.filters.ScoreComputed();
            const events = await oracle.queryFilter(filter, Math.max(0, currentBlock - 50000), currentBlock);
            
            // Aggregate by user (keep latest score)
            const userScores = {};
            
            for (const event of events) {
                const user = event.args.user;
                const score = event.args.finalScore.toNumber();
                const timestamp = (await event.getBlock()).timestamp;
                
                if (!userScores[user] || userScores[user].timestamp < timestamp) {
                    userScores[user] = {
                        address: user,
                        score: score,
                        credentialsCount: event.args.components.length,
                        diversityBonus: event.args.diversityBonusPercent,
                        timestamp: timestamp,
                        blockNumber: event.blockNumber
                    };
                }
            }
            
            // Sort by score (descending) and take top 10
            const sorted = Object.values(userScores)
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
            
            setLeaders(sorted);
            setLastUpdate(new Date());
            setLoading(false);
            
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            setLoading(false);
        }
    };
    
    const getTierName = (score) => {
        if (score >= 900) return 'Exceptional';
        if (score >= 800) return 'Excellent';
        if (score >= 700) return 'Good';
        if (score >= 600) return 'Fair';
        if (score >= 500) return 'Average';
        if (score >= 400) return 'Below Average';
        if (score >= 300) return 'Poor';
        return 'Very Poor';
    };
    
    const getTierColor = (score) => {
        if (score >= 900) return 'bg-purple-100 text-purple-700';
        if (score >= 800) return 'bg-blue-100 text-blue-700';
        if (score >= 700) return 'bg-green-100 text-green-700';
        if (score >= 600) return 'bg-yellow-100 text-yellow-700';
        return 'bg-orange-100 text-orange-700';
    };
    
    const getRankIcon = (index) => {
        if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
        if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
        if (index === 2) return <Award className="w-6 h-6 text-orange-600" />;
        return <span className="text-lg font-bold text-gray-400">#{index + 1}</span>;
    };
    
    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Trophy className="w-7 h-7 text-yellow-500" />
                    Top Credit Scores
                </h2>
                <button 
                    onClick={fetchLeaderboard}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>
            
            {lastUpdate && (
                <p className="text-xs text-gray-500 mb-4">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
            )}
            
            {loading && leaders.length === 0 ? (
                <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500">Loading leaderboard...</p>
                </div>
            ) : leaders.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-2">No scores yet!</p>
                    <p className="text-sm text-gray-400">Be the first to submit credentials</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {leaders.map((leader, index) => (
                        <div
                            key={leader.address}
                            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                                index === 0 ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50' :
                                index === 1 ? 'border-gray-300 bg-gray-50' :
                                index === 2 ? 'border-orange-300 bg-orange-50' :
                                'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 flex justify-center">
                                    {getRankIcon(index)}
                                </div>
                                <div>
                                    <p className="font-mono text-sm font-medium">
                                        {leader.address.slice(0, 6)}...{leader.address.slice(-4)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-gray-500">
                                            {leader.credentialsCount} credentials
                                        </p>
                                        {leader.diversityBonus > 0 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{leader.diversityBonus}% bonus
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold mb-1">{leader.score}</p>
                                <Badge className={getTierColor(leader.score)}>
                                    {getTierName(leader.score)}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
```

---

### Step 8: Add Leaderboard to Dashboard (15 min)

**File**: `pages/dashboard.js`

```jsx
import Leaderboard from '../components/Leaderboard';

// Add a new section after existing content:
<div className="mt-8">
    <Leaderboard />
</div>
```

---

## ✅ Phase 4 Acceptance Criteria

### Testnet Deployment
- [ ] All 3 contracts deployed to Moca testnet
- [ ] Deployment addresses saved in `deployed-addresses-testnet.json`
- [ ] All 10 credential types registered on-chain
- [ ] 3 issuers registered with 100% trust
- [ ] Tiers initialized (8 tiers)
- [ ] Contracts verified on block explorer
- [ ] All transactions visible on testnet explorer

### Environment Configuration
- [ ] Frontend `.env.local` updated with testnet addresses
- [ ] Backend `.env` updated with testnet issuer addresses
- [ ] RPC URL points to testnet
- [ ] No hardcoded devnet addresses remaining

### Score API
- [ ] `/api/score/:address` endpoint responds with valid JSON
- [ ] CORS headers allow cross-origin requests
- [ ] Returns 404 for users without credentials
- [ ] Returns 400 for invalid addresses
- [ ] Response includes tier, borrowing power, use cases
- [ ] Tested from external domain (curl)

### Leaderboard
- [ ] Displays top 10 users by score
- [ ] Shows credential count and diversity bonus
- [ ] Rank icons (trophy, medal, award) display correctly
- [ ] Refresh button works
- [ ] Updates every 30 seconds automatically
- [ ] Handles empty state gracefully

### Integration
- [ ] Full testnet flow works: Login → Request → Submit → Score updates → Leaderboard shows user
- [ ] Interest accrues on testnet borrows
- [ ] Health factor updates correctly
- [ ] Transactions confirm within 30 seconds

---

## 🧪 Testing Checklist

```bash
# 1. Test deployment
cd contracts
npx hardhat run scripts/deploy-wave3.ts --network mocaTestnet

# 2. Verify on explorer
# Visit: https://testnet-scan.mocachain.org
# Search for each contract address

# 3. Test API
curl https://credo-protocol.vercel.app/api/score/YOUR_WALLET_ADDRESS

# 4. Test frontend
# Open dashboard → Check leaderboard loads
# Submit a credential → Verify it appears in leaderboard

# 5. Test composability
# From another project, call the API and verify response
```

---

## 📊 Progress Tracking

**Part A: Testnet Deployment**
- [ ] Step 1: Configure Hardhat (30 min)
- [ ] Step 2: Deployment script (1 hour)
- [ ] Step 3: Deploy contracts (30 min)
- [ ] Step 4: Update environment variables (20 min)

**Part B: Score API**
- [ ] Step 5: Create API endpoint (1 hour)
- [ ] Step 6: Test API (15 min)

**Part C: Leaderboard**
- [ ] Step 7: Leaderboard component (1.5 hours)
- [ ] Step 8: Integrate into dashboard (15 min)

**Total**: 6-8 hours

---

## ✨ What You've Accomplished

After Phase 4, you'll have:

✅ **Production Deployment**: Live on Moca testnet  
✅ **Composable Infrastructure**: Public API for any dApp  
✅ **Network Effects**: Leaderboard shows adoption  
✅ **Verifiable Contracts**: All code on block explorer  
✅ **Ecosystem Ready**: Other builders can integrate  

---

## 🚀 Next Steps

1. **Commit and deploy**:
```bash
git add .
git commit -m "feat: Complete Phase 4 - Testnet deployment + composable API"
git push

# Deploy frontend to Vercel
vercel --prod
```

2. **Final Phase**: [PHASE5-DOCS-DEMO.md](./PHASE5-DOCS-DEMO.md)

---

**Phase Status**: Ready to Execute  
**Estimated Completion**: End of Day 3 Afternoon (Oct 27)

