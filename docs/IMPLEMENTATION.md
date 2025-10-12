# Credo Protocol: Wave 2 Implementation Plan

**Goal:** Deliver a working MVP that demonstrates the complete end-to-end flow of identity-backed lending on Moca Chain.

**Deliverable:** A functional prototype where a user can log in, request verifiable credentials, generate an on-chain credit score, and borrow assets with dynamic collateral requirements.

---

## Implementation Phases

### Phase 1: Smart Contract Foundation
**Owner:** Smart Contract Team (lyle)  
**Dependencies:** None (can start immediately)

#### Objectives
Build and test the core smart contracts that power the credit scoring and lending functionality.

#### Deliverables

##### 1.1 CreditScoreOracle.sol
A smart contract that verifies credentials and calculates credit scores.

**Core Functions to Implement:**
```solidity
// Registry Management
function registerIssuer(address issuer, uint256 trustScore) external onlyOwner
function updateIssuerTrustScore(address issuer, uint256 newScore) external onlyOwner
function isIssuerRegistered(address issuer) external view returns (bool)

// Credential Submission
function submitCredential(
    bytes memory credentialData,
    bytes memory signature,
    address issuer,
    uint256 credentialType,
    uint256 expirationTimestamp
) external returns (uint256 newScore)

// Score Queries
function getCreditScore(address user) external view returns (uint256)
function getScoreDetails(address user) external view returns (
    uint256 score,
    uint256 credentialCount,
    uint256 lastUpdated,
    bool initialized
)
function isScoreAboveThreshold(address user, uint256 threshold) external view returns (bool)

// User Score Management
function getUserCredentials(address user) external view returns (uint256[] memory)
```

**Data Structures:**
```solidity
struct CreditProfile {
    uint256 score;
    uint256 lastUpdated;
    uint256 credentialCount;
    bool initialized;
}

struct Credential {
    uint256 credentialType;
    address issuer;
    uint256 issuedAt;
    uint256 expiresAt;
    bytes32 credentialHash;
}

struct IssuerInfo {
    bool registered;
    uint256 trustScore; // 0-100
    uint256 credentialCount;
}

// Mappings
mapping(address => CreditProfile) public creditProfiles;
mapping(address => Credential[]) private userCredentials;
mapping(address => IssuerInfo) public issuers;
mapping(bytes32 => bool) private usedCredentialHashes;
```

**Scoring Algorithm Implementation:**
```solidity
function calculateScore(address user) internal view returns (uint256) {
    Credential[] memory creds = userCredentials[user];
    if (creds.length == 0) return 500; // Base score
    
    uint256 totalPoints = 500; // Starting base
    uint256 credentialTypeCount = 0;
    
    for (uint i = 0; i < creds.length; i++) {
        Credential memory cred = creds[i];
        
        // Skip expired credentials
        if (block.timestamp > cred.expiresAt) continue;
        
        // Get base points for credential type
        uint256 basePoints = getCredentialTypeWeight(cred.credentialType);
        
        // Apply issuer trust multiplier
        uint256 issuerMultiplier = issuers[cred.issuer].trustScore;
        uint256 adjustedPoints = (basePoints * issuerMultiplier) / 100;
        
        // Apply recency decay
        uint256 age = block.timestamp - cred.issuedAt;
        uint256 decayFactor = calculateDecayFactor(age);
        adjustedPoints = (adjustedPoints * decayFactor) / 100;
        
        totalPoints += adjustedPoints;
        credentialTypeCount++;
    }
    
    // Diversity bonus: 5% per unique credential type (capped at 25%)
    uint256 diversityBonus = credentialTypeCount * 5;
    if (diversityBonus > 25) diversityBonus = 25;
    totalPoints = (totalPoints * (100 + diversityBonus)) / 100;
    
    // Cap at 1000
    if (totalPoints > 1000) totalPoints = 1000;
    
    return totalPoints;
}

function getCredentialTypeWeight(uint256 credType) internal pure returns (uint256) {
    // 0: Proof of Income -> 150 points
    // 1: Proof of Stable Balance -> 100 points
    // 2: Proof of CEX History -> 80 points
    // 3: Proof of Employment -> 70 points
    // 4: Proof of On-Chain Activity -> 50 points
    if (credType == 0) return 150;
    if (credType == 1) return 100;
    if (credType == 2) return 80;
    if (credType == 3) return 70;
    if (credType == 4) return 50;
    return 30; // Default for unknown types
}

function calculateDecayFactor(uint256 age) internal pure returns (uint256) {
    // Fresh (< 30 days): 100%
    // 30-90 days: 95%
    // 90-180 days: 85%
    // 180+ days: 70%
    if (age < 30 days) return 100;
    if (age < 90 days) return 95;
    if (age < 180 days) return 85;
    return 70;
}
```

**Security Features:**
```solidity
// Prevent replay attacks
modifier notUsedCredential(bytes32 credHash) {
    require(!usedCredentialHashes[credHash], "Credential already used");
    _;
}

// Signature verification
function verifyCredentialSignature(
    bytes memory credentialData,
    bytes memory signature,
    address issuer
) internal pure returns (bool) {
    bytes32 messageHash = keccak256(credentialData);
    bytes32 ethSignedHash = keccak256(
        abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
    );
    address recoveredSigner = recoverSigner(ethSignedHash, signature);
    return recoveredSigner == issuer;
}
```

##### 1.2 LendingPool.sol
A lending pool with dynamic collateral factors based on credit scores.

**Core Functions to Implement:**
```solidity
// Supply & Withdraw
function supply(address asset, uint256 amount) external
function withdraw(address asset, uint256 amount) external

// Borrow & Repay
function borrow(address asset, uint256 amount) external
function repay(address asset, uint256 amount) external

// Liquidation
function liquidate(address borrower, address asset) external

// View Functions
function getUserAccountData(address user) external view returns (
    uint256 totalCollateralInUSD,
    uint256 totalDebtInUSD,
    uint256 availableBorrowsInUSD,
    uint256 currentLiquidationThreshold,
    uint256 healthFactor
)

function getRequiredCollateral(address user, uint256 borrowAmount) external view returns (uint256)
```

**Data Structures:**
```solidity
struct UserAccount {
    mapping(address => uint256) supplied;
    mapping(address => uint256) borrowed;
    uint256 lastUpdateTimestamp;
}

struct AssetData {
    uint256 totalSupply;
    uint256 totalBorrowed;
    uint256 baseInterestRate;
    uint256 utilizationRate;
    bool enabled;
}

mapping(address => UserAccount) private userAccounts;
mapping(address => AssetData) public assets;
address public creditOracle;
```

**Dynamic Collateral Logic:**
```solidity
function calculateCollateralFactor(uint256 creditScore) public pure returns (uint256) {
    // Returns collateral factor as percentage (50-150)
    // High score = lower collateral requirement
    
    if (creditScore >= 900) return 50;   // Borrow $100 with $50
    if (creditScore >= 800) return 60;
    if (creditScore >= 700) return 75;
    if (creditScore >= 600) return 90;
    if (creditScore >= 500) return 100;
    if (creditScore >= 400) return 110;
    if (creditScore >= 300) return 125;
    return 150; // Default DeFi level
}

function borrow(address asset, uint256 amount) external {
    require(assets[asset].enabled, "Asset not enabled");
    
    // Query Credit Score Oracle
    uint256 userScore = ICreditScoreOracle(creditOracle).getCreditScore(msg.sender);
    
    // Calculate required collateral
    uint256 collateralFactor = calculateCollateralFactor(userScore);
    uint256 requiredCollateral = (amount * collateralFactor) / 100;
    
    // Check user has enough collateral
    uint256 userCollateral = getUserTotalCollateral(msg.sender);
    uint256 userCurrentBorrows = getUserTotalBorrows(msg.sender);
    
    require(
        userCollateral >= userCurrentBorrows + requiredCollateral,
        "Insufficient collateral for credit score"
    );
    
    // Calculate interest rate (score-dependent)
    uint256 interestRate = calculateInterestRate(userScore, asset);
    
    // Update state
    userAccounts[msg.sender].borrowed[asset] += amount;
    assets[asset].totalBorrowed += amount;
    
    // Transfer tokens
    IERC20(asset).transfer(msg.sender, amount);
    
    emit Borrowed(msg.sender, asset, amount, interestRate, collateralFactor);
}

function calculateInterestRate(uint256 score, address asset) internal view returns (uint256) {
    uint256 baseRate = assets[asset].baseInterestRate;
    uint256 utilizationRate = assets[asset].utilizationRate;
    
    // Score multiplier (0.5x to 2x base rate)
    uint256 scoreMultiplier;
    if (score >= 900) scoreMultiplier = 50;
    else if (score >= 700) scoreMultiplier = 70;
    else if (score >= 500) scoreMultiplier = 100;
    else if (score >= 300) scoreMultiplier = 130;
    else scoreMultiplier = 150;
    
    uint256 finalRate = (baseRate * scoreMultiplier) / 100;
    
    // Add utilization premium
    finalRate += (utilizationRate * 5) / 100;
    
    return finalRate;
}
```

##### 1.3 Mock ERC20 Token
Simple token for testing purposes.

```solidity
// MockUSDC.sol
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

#### Testing Requirements

**Unit Tests (Hardhat/Foundry):**
```javascript
describe("CreditScoreOracle", () => {
  it("Should register issuers correctly")
  it("Should accept valid credentials and update score")
  it("Should reject credentials from unregistered issuers")
  it("Should prevent replay attacks")
  it("Should calculate score with proper weights")
  it("Should apply recency decay correctly")
  it("Should apply diversity bonus")
});

describe("LendingPool", () => {
  it("Should allow users to supply assets")
  it("Should calculate collateral factor based on credit score")
  it("Should allow high-score users to borrow with less collateral")
  it("Should prevent borrowing beyond collateral limits")
  it("Should calculate interest rates correctly")
  it("Should handle liquidations properly")
  it("Should update utilization rate on borrow/repay")
});

describe("Integration", () => {
  it("Should query oracle from lending pool correctly")
  it("Should update borrow limits when credit score changes")
});
```

#### Deployment Scripts

```javascript
// scripts/deploy.js
async function main() {
  // Deploy CreditScoreOracle
  const CreditScoreOracle = await ethers.getContractFactory("CreditScoreOracle");
  const oracle = await CreditScoreOracle.deploy();
  await oracle.deployed();
  console.log("CreditScoreOracle deployed to:", oracle.address);
  
  // Deploy LendingPool
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const pool = await LendingPool.deploy(oracle.address);
  await pool.deployed();
  console.log("LendingPool deployed to:", pool.address);
  
  // Deploy Mock USDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.deployed();
  console.log("MockUSDC deployed to:", usdc.address);
  
  // Setup: Register issuers
  await oracle.registerIssuer(process.env.MOCK_ISSUER_ADDRESS, 100);
  
  // Setup: Enable USDC in lending pool
  await pool.enableAsset(usdc.address, 500); // 5% base rate
  
  // Save addresses
  const addresses = {
    creditScoreOracle: oracle.address,
    lendingPool: pool.address,
    mockUSDC: usdc.address
  };
  
  fs.writeFileSync(
    "deployed-addresses.json",
    JSON.stringify(addresses, null, 2)
  );
}
```

---

### Phase 2: Backend Services & Credential Issuers
**Owner:** Backend Team (Eva_code)  
**Dependencies:** Phase 1 (needs deployed contracts for testing)

#### Objectives
Build mock credential issuer services that can generate and sign verifiable credentials for testing the protocol.

#### Deliverables

##### 2.1 Mock Issuer Service Architecture
Node.js/Express service that simulates real-world credential issuers.

**Tech Stack:**
- Node.js + Express
- Ethers.js (for signing)
- AIR Credential Services SDK (for VC formatting)

**Project Structure:**
```
backend/
├── src/
│   ├── issuers/
│   │   ├── MockExchangeIssuer.js
│   │   ├── MockEmployerIssuer.js
│   │   └── MockBankIssuer.js
│   ├── services/
│   │   ├── CredentialService.js
│   │   └── SigningService.js
│   ├── routes/
│   │   └── credentials.js
│   ├── config/
│   │   └── issuers.json
│   └── server.js
├── package.json
└── .env.example
```

##### 2.2 Credential Issuer Implementations

**Mock Exchange Issuer:**
```javascript
// issuers/MockExchangeIssuer.js
class MockExchangeIssuer {
  constructor(signerWallet) {
    this.name = "Mock CEX";
    this.signerWallet = signerWallet;
    this.credentialType = 2; // CEX History
  }
  
  async issueCredential(userAddress, mockData) {
    // Simulate checking user's exchange history
    const credentialData = {
      type: "ProofOfCEXHistory",
      issuer: this.signerWallet.address,
      subject: userAddress,
      credentialType: this.credentialType,
      issuedAt: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60), // 180 days
      claims: {
        tradingVolume: mockData.volume || "high",
        accountAge: mockData.accountAge || "2_years",
        neverLiquidated: true,
        // ZK proof would go here in production
        zkProof: "0x..." 
      }
    };
    
    // Encode credential data
    const encodedData = ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "uint256", "uint256", "uint256"],
      [
        credentialData.issuer,
        credentialData.subject,
        credentialData.credentialType,
        credentialData.issuedAt,
        credentialData.expiresAt
      ]
    );
    
    // Sign the credential
    const messageHash = ethers.utils.keccak256(encodedData);
    const signature = await this.signerWallet.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    
    return {
      credential: credentialData,
      encodedData,
      signature
    };
  }
}
```

**Mock Employer Issuer:**
```javascript
// issuers/MockEmployerIssuer.js
class MockEmployerIssuer {
  constructor(signerWallet) {
    this.name = "Mock Employer";
    this.signerWallet = signerWallet;
    this.credentialType = 3; // Employment
  }
  
  async issueCredential(userAddress, mockData) {
    const credentialData = {
      type: "ProofOfEmployment",
      issuer: this.signerWallet.address,
      subject: userAddress,
      credentialType: this.credentialType,
      issuedAt: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
      claims: {
        employed: true,
        employmentDuration: mockData.duration || "3_years",
        // ZK proof would prove employment without revealing employer
        zkProof: "0x..."
      }
    };
    
    const encodedData = ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "uint256", "uint256", "uint256"],
      [
        credentialData.issuer,
        credentialData.subject,
        credentialData.credentialType,
        credentialData.issuedAt,
        credentialData.expiresAt
      ]
    );
    
    const messageHash = ethers.utils.keccak256(encodedData);
    const signature = await this.signerWallet.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    
    return {
      credential: credentialData,
      encodedData,
      signature
    };
  }
}
```

**Mock Bank Issuer:**
```javascript
// issuers/MockBankIssuer.js
class MockBankIssuer {
  constructor(signerWallet) {
    this.name = "Mock Bank";
    this.signerWallet = signerWallet;
    this.credentialType = 1; // Stable Balance
  }
  
  async issueCredential(userAddress, mockData) {
    const credentialData = {
      type: "ProofOfStableBalance",
      issuer: this.signerWallet.address,
      subject: userAddress,
      credentialType: this.credentialType,
      issuedAt: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days
      claims: {
        hasStableBalance: true,
        balanceThreshold: mockData.threshold || "10000",
        duration: mockData.duration || "6_months",
        // ZK proof proves balance > threshold without revealing exact amount
        zkProof: "0x..."
      }
    };
    
    const encodedData = ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "uint256", "uint256", "uint256"],
      [
        credentialData.issuer,
        credentialData.subject,
        credentialData.credentialType,
        credentialData.issuedAt,
        credentialData.expiresAt
      ]
    );
    
    const messageHash = ethers.utils.keccak256(encodedData);
    const signature = await this.signerWallet.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    
    return {
      credential: credentialData,
      encodedData,
      signature
    };
  }
}
```

##### 2.3 API Endpoints

```javascript
// routes/credentials.js
const express = require('express');
const router = express.Router();

// Get available credential types
router.get('/types', (req, res) => {
  res.json({
    credentials: [
      {
        id: 2,
        name: "Proof of CEX Trading History",
        issuer: "Mock Exchange",
        description: "Verify your trading history and volume",
        scoreBoost: "+80 points",
        duration: "6 months"
      },
      {
        id: 3,
        name: "Proof of Employment",
        issuer: "Mock Employer",
        description: "Prove your employment status",
        scoreBoost: "+70 points",
        duration: "12 months"
      },
      {
        id: 1,
        name: "Proof of Stable Balance",
        issuer: "Mock Bank",
        description: "Demonstrate financial stability",
        scoreBoost: "+100 points",
        duration: "3 months"
      }
    ]
  });
});

// Request a credential
router.post('/request', async (req, res) => {
  const { userAddress, credentialType, mockData } = req.body;
  
  try {
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
        return res.status(400).json({ error: "Invalid credential type" });
    }
    
    const result = await issuer.issueCredential(userAddress, mockData || {});
    
    res.json({
      success: true,
      credential: result.credential,
      encodedData: result.encodedData,
      signature: result.signature
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to issue credential" });
  }
});

module.exports = router;
```

##### 2.4 Server Setup

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Initialize issuer wallets
const mockExchangeWallet = new ethers.Wallet(process.env.MOCK_EXCHANGE_PRIVATE_KEY);
const mockEmployerWallet = new ethers.Wallet(process.env.MOCK_EMPLOYER_PRIVATE_KEY);
const mockBankWallet = new ethers.Wallet(process.env.MOCK_BANK_PRIVATE_KEY);

// Initialize issuers
global.mockExchangeIssuer = new MockExchangeIssuer(mockExchangeWallet);
global.mockEmployerIssuer = new MockEmployerIssuer(mockEmployerWallet);
global.mockBankIssuer = new MockBankIssuer(mockBankWallet);

// Routes
app.use('/api/credentials', require('./routes/credentials'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    issuers: [
      { name: mockExchangeIssuer.name, address: mockExchangeWallet.address },
      { name: mockEmployerIssuer.name, address: mockEmployerWallet.address },
      { name: mockBankIssuer.name, address: mockBankWallet.address }
    ]
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Mock Issuer Service running on port ${PORT}`);
});
```

#### Testing Requirements

```javascript
// Test issuer service
describe("Mock Issuer Service", () => {
  it("Should issue valid CEX credential")
  it("Should issue valid Employment credential")
  it("Should issue valid Bank credential")
  it("Should sign credentials correctly")
  it("Should return properly formatted data")
  it("Should set correct expiration times")
});
```

---

### Phase 3: Frontend Development
**Owner:** Frontend Team (PaulSpread)  
**Dependencies:** Phase 1 (deployed contracts), Phase 2 (issuer API)

#### Objectives
Build a beautiful, intuitive dApp that guides users through the credential → score → borrow flow.

#### Deliverables

##### 3.1 Project Setup

**Tech Stack:**
- Next.js 15 (already initialized)
- React 19
- Tailwind CSS (already configured)
- Ethers.js v6
- shadcn/ui components
- Wagmi/Viem (for wallet connection)

**Install Dependencies:**
```bash
npm install ethers@6 wagmi viem @tanstack/react-query
npm install @radix-ui/react-* # shadcn components
npm install recharts # for charts
npm install framer-motion # for animations
```

##### 3.2 Component Structure

```
components/
├── layout/
│   ├── Header.js
│   ├── Footer.js
│   └── Layout.js
├── auth/
│   ├── ConnectButton.js
│   └── MocaIDLogin.js
├── dashboard/
│   ├── CreditScoreCard.js
│   ├── ScoreBreakdown.js
│   └── QuickStats.js
├── credentials/
│   ├── CredentialMarketplace.js
│   ├── CredentialCard.js
│   ├── RequestCredentialModal.js
│   └── CredentialList.js
├── lending/
│   ├── SupplyInterface.js
│   ├── BorrowInterface.js
│   ├── BorrowSlider.js
│   ├── CollateralDisplay.js
│   └── TransactionConfirmation.js
└── ui/
    ├── button.js
    ├── card.js
    ├── dialog.js
    ├── slider.js
    └── ... (shadcn components)
```

##### 3.3 Core Pages

**pages/index.js - Landing Page**
```jsx
export default function Home() {
  return (
    <Layout>
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
    </Layout>
  );
}

function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-6">
          Borrow Based on{" "}
          <span className="text-gradient">Who You Are</span>,
          Not Just What You Have
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Credo Protocol enables undercollateralized loans through 
          verifiable credentials and on-chain credit scores.
        </p>
        <ConnectButton />
      </div>
    </section>
  );
}
```

**pages/dashboard.js - Main Dashboard**
```jsx
import { useAccount, useContractRead } from 'wagmi';
import { creditScoreOracleABI, lendingPoolABI } from '@/lib/contracts';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  
  // Read credit score
  const { data: creditScore } = useContractRead({
    address: CREDIT_ORACLE_ADDRESS,
    abi: creditScoreOracleABI,
    functionName: 'getCreditScore',
    args: [address],
    watch: true
  });
  
  // Read account data
  const { data: accountData } = useContractRead({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'getUserAccountData',
    args: [address],
    watch: true
  });
  
  if (!isConnected) {
    return <ConnectPrompt />;
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <CreditScoreCard score={creditScore} />
          <QuickStats 
            supplied={accountData?.totalCollateralInUSD}
            borrowed={accountData?.totalDebtInUSD}
          />
          <HealthFactorCard health={accountData?.healthFactor} />
        </div>
        
        <Tabs defaultValue="credentials">
          <TabsList>
            <TabsTrigger value="credentials">Build Score</TabsTrigger>
            <TabsTrigger value="borrow">Borrow</TabsTrigger>
            <TabsTrigger value="supply">Supply</TabsTrigger>
          </TabsList>
          
          <TabsContent value="credentials">
            <CredentialMarketplace userAddress={address} />
          </TabsContent>
          
          <TabsContent value="borrow">
            <BorrowInterface 
              creditScore={creditScore}
              accountData={accountData}
            />
          </TabsContent>
          
          <TabsContent value="supply">
            <SupplyInterface />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
```

##### 3.4 Key Component Implementations

**CreditScoreCard.js:**
```jsx
import { motion } from 'framer-motion';

export function CreditScoreCard({ score = 0 }) {
  const scoreColor = 
    score >= 700 ? 'text-green-500' :
    score >= 500 ? 'text-yellow-500' :
    'text-red-500';
  
  const scoreLabel =
    score >= 700 ? 'Excellent' :
    score >= 500 ? 'Good' :
    score > 0 ? 'Building' :
    'Not Started';
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Credit Score</h3>
      <div className="flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className={`text-6xl font-bold ${scoreColor}`}>
            {score}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            / 1000
          </div>
          <Badge className="mt-4">{scoreLabel}</Badge>
        </motion.div>
      </div>
      
      {/* Score visualization */}
      <div className="mt-6">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(score / 1000) * 100}%` }}
            className={`h-full ${
              score >= 700 ? 'bg-green-500' :
              score >= 500 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
          />
        </div>
      </div>
    </Card>
  );
}
```

**CredentialMarketplace.js:**
```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export function CredentialMarketplace({ userAddress }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredential, setSelectedCredential] = useState(null);
  
  useEffect(() => {
    fetchAvailableCredentials();
  }, []);
  
  async function fetchAvailableCredentials() {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_ISSUER_API}/api/credentials/types`
      );
      setCredentials(response.data.credentials);
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        Build Your Credit Score
      </h2>
      <p className="text-gray-600 mb-8">
        Connect data sources to increase your score and unlock better loan terms.
      </p>
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {credentials.map(cred => (
            <CredentialCard
              key={cred.id}
              credential={cred}
              onRequest={() => setSelectedCredential(cred)}
            />
          ))}
        </div>
      )}
      
      {selectedCredential && (
        <RequestCredentialModal
          credential={selectedCredential}
          userAddress={userAddress}
          onClose={() => setSelectedCredential(null)}
        />
      )}
    </div>
  );
}
```

**RequestCredentialModal.js:**
```jsx
import { useState } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import axios from 'axios';

export function RequestCredentialModal({ credential, userAddress, onClose }) {
  const [step, setStep] = useState('request'); // request -> sign -> submit
  const [credentialData, setCredentialData] = useState(null);
  
  // Contract write for submitting credential
  const { write: submitCredential, data: txData } = useContractWrite({
    address: CREDIT_ORACLE_ADDRESS,
    abi: creditScoreOracleABI,
    functionName: 'submitCredential',
  });
  
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = 
    useWaitForTransaction({
      hash: txData?.hash,
    });
  
  async function handleRequestCredential() {
    try {
      setStep('loading');
      
      // Call mock issuer API
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_ISSUER_API}/api/credentials/request`,
        {
          userAddress,
          credentialType: credential.id,
          mockData: {} // In real app, this would come from OAuth flow
        }
      );
      
      setCredentialData(response.data);
      setStep('submit');
    } catch (error) {
      console.error('Failed to request credential:', error);
      setStep('error');
    }
  }
  
  async function handleSubmitToOracle() {
    if (!credentialData) return;
    
    submitCredential({
      args: [
        credentialData.encodedData,
        credentialData.signature,
        credentialData.credential.issuer,
        credentialData.credential.credentialType,
        credentialData.credential.expiresAt
      ]
    });
  }
  
  useEffect(() => {
    if (isTxSuccess) {
      // Show success animation
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }, [isTxSuccess]);
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{credential.name}</DialogTitle>
          <DialogDescription>
            {credential.description}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'request' && (
          <div className="py-6">
            <p className="mb-4">
              This will connect you to {credential.issuer} to verify your information.
            </p>
            <Button onClick={handleRequestCredential} className="w-full">
              Connect & Verify
            </Button>
          </div>
        )}
        
        {step === 'loading' && (
          <div className="py-12 text-center">
            <LoadingSpinner />
            <p className="mt-4">Requesting credential...</p>
          </div>
        )}
        
        {step === 'submit' && (
          <div className="py-6">
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <p className="text-green-800">
                ✓ Credential verified! Ready to submit to blockchain.
              </p>
            </div>
            <Button 
              onClick={handleSubmitToOracle} 
              className="w-full"
              disabled={isTxPending}
            >
              {isTxPending ? 'Submitting...' : 'Submit to Update Score'}
            </Button>
          </div>
        )}
        
        {isTxSuccess && (
          <div className="py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">
              Score Updated!
            </h3>
            <p className="text-gray-600">
              Your credit score has been updated on-chain.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**BorrowInterface.js:**
```jsx
import { useState } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';

export function BorrowInterface({ creditScore, accountData }) {
  const [borrowAmount, setBorrowAmount] = useState(0);
  
  // Calculate collateral factor based on score
  const collateralFactor = calculateCollateralFactor(creditScore || 0);
  const requiredCollateral = borrowAmount * (collateralFactor / 100);
  const interestRate = calculateInterestRate(creditScore || 0);
  
  const { write: borrow, data: txData } = useContractWrite({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'borrow',
  });
  
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: txData?.hash,
  });
  
  function handleBorrow() {
    borrow({
      args: [
        MOCK_USDC_ADDRESS,
        parseEther(borrowAmount.toString())
      ]
    });
  }
  
  const canBorrow = creditScore > 0 && borrowAmount > 0 && 
    requiredCollateral <= (accountData?.totalCollateralInUSD || 0);
  
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Borrow Assets</h2>
      
      {creditScore === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <p className="mb-4">
            Build your credit score first to unlock borrowing.
          </p>
          <Button variant="outline">
            Go to Credentials →
          </Button>
        </div>
      ) : (
        <>
          {/* Borrow Amount Slider */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">
              Amount to Borrow
            </label>
            <Slider
              value={[borrowAmount]}
              onValueChange={([val]) => setBorrowAmount(val)}
              max={1000}
              step={10}
              className="mb-4"
            />
            <div className="text-3xl font-bold text-center">
              ${borrowAmount}
            </div>
          </div>
          
          {/* Loan Details */}
          <div className="space-y-4 mb-8">
            <DetailRow
              label="Your Credit Score"
              value={creditScore}
              badge={getScoreLabel(creditScore)}
            />
            <DetailRow
              label="Required Collateral"
              value={`$${requiredCollateral.toFixed(2)} (${collateralFactor}%)`}
              highlight
            />
            <DetailRow
              label="Interest Rate"
              value={`${interestRate}% APR`}
            />
            <DetailRow
              label="Available Collateral"
              value={`$${accountData?.totalCollateralInUSD || 0}`}
            />
          </div>
          
          {/* Borrow Button */}
          <Button
            onClick={handleBorrow}
            disabled={!canBorrow || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Borrowing...' : `Borrow $${borrowAmount}`}
          </Button>
          
          {!canBorrow && borrowAmount > 0 && (
            <p className="text-red-500 text-sm mt-2 text-center">
              Insufficient collateral for this loan amount
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function calculateCollateralFactor(score) {
  if (score >= 900) return 50;
  if (score >= 800) return 60;
  if (score >= 700) return 75;
  if (score >= 600) return 90;
  if (score >= 500) return 100;
  if (score >= 400) return 110;
  if (score >= 300) return 125;
  return 150;
}

function calculateInterestRate(score) {
  if (score >= 900) return 5;
  if (score >= 700) return 7;
  if (score >= 500) return 10;
  if (score >= 300) return 13;
  return 15;
}
```

##### 3.5 Contract Integration Setup

```javascript
// lib/contracts.js
export const CREDIT_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS;
export const LENDING_POOL_ADDRESS = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS;
export const MOCK_USDC_ADDRESS = process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS;

export const creditScoreOracleABI = [
  "function getCreditScore(address user) view returns (uint256)",
  "function getScoreDetails(address user) view returns (uint256 score, uint256 credentialCount, uint256 lastUpdated, bool initialized)",
  "function submitCredential(bytes memory credentialData, bytes memory signature, address issuer, uint256 credentialType, uint256 expirationTimestamp) returns (uint256)",
  "event CredentialSubmitted(address indexed user, uint256 credentialType, uint256 newScore)"
];

export const lendingPoolABI = [
  "function supply(address asset, uint256 amount)",
  "function withdraw(address asset, uint256 amount)",
  "function borrow(address asset, uint256 amount)",
  "function repay(address asset, uint256 amount)",
  "function getUserAccountData(address user) view returns (uint256 totalCollateralInUSD, uint256 totalDebtInUSD, uint256 availableBorrowsInUSD, uint256 currentLiquidationThreshold, uint256 healthFactor)",
  "event Borrowed(address indexed user, address asset, uint256 amount, uint256 interestRate, uint256 collateralFactor)"
];

export const erc20ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)"
];
```

```javascript
// lib/wagmi.js
import { configureChains, createConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

// Moca Chain testnet config
const mocaTestnet = {
  id: 20241, // Replace with actual Moca testnet chain ID
  name: 'Moca Chain Testnet',
  network: 'moca-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MOCA',
    symbol: 'MOCA',
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL] },
    public: { http: [process.env.NEXT_PUBLIC_RPC_URL] },
  },
  blockExplorers: {
    default: { 
      name: 'Moca Explorer', 
      url: process.env.NEXT_PUBLIC_EXPLORER_URL 
    },
  },
  testnet: true,
};

const { chains, publicClient } = configureChains(
  [mocaTestnet],
  [publicProvider()]
);

export const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient,
});

export { chains };
```

##### 3.6 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.moca.network
NEXT_PUBLIC_EXPLORER_URL=https://testnet-explorer.moca.network
NEXT_PUBLIC_CHAIN_ID=20241

NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x...
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x...

NEXT_PUBLIC_ISSUER_API=http://localhost:3001
```

---

### Phase 4: Integration & Testing
**Owner:** All Team Members  
**Dependencies:** Phases 1, 2, 3 complete

#### Objectives
Connect all components and ensure end-to-end functionality works seamlessly.

#### Tasks

##### 4.1 Contract-Backend Integration
- Ensure mock issuer wallet addresses are registered in CreditScoreOracle
- Verify signatures from issuers are validated correctly on-chain
- Test credential submission flow with all three issuer types

##### 4.2 Backend-Frontend Integration
- Connect frontend to mock issuer API
- Test credential request flow
- Ensure proper error handling
- Verify loading states work correctly

##### 4.3 Frontend-Contract Integration
- Test wallet connection on Moca testnet
- Verify contract read operations (getCreditScore, getUserAccountData)
- Test contract write operations (submitCredential, borrow, supply)
- Ensure transaction states are properly tracked
- Test gas estimation and transaction confirmations

##### 4.4 End-to-End User Journey Testing

**Test Scenario 1: New User First Loan**
```
1. User visits dApp (not connected)
2. Click "Connect Wallet" → Moca ID login
3. Navigate to Dashboard → Score shows 0
4. Go to "Build Score" tab
5. Click "Proof of CEX History" credential
6. Modal opens → "Connect & Verify"
7. API call to issuer → credential issued
8. "Submit to Update Score" → Metamask/wallet popup
9. Transaction confirms → Score updates to ~580
10. Go to "Borrow" tab
11. Move slider to $100
12. See required collateral: $100 (100% for score 580)
13. (Assuming user has supplied collateral first)
14. Click "Borrow $100"
15. Transaction confirms → Loan active
```

**Test Scenario 2: Building Higher Score**
```
1. User already has score of 580
2. Request "Proof of Employment" credential
3. Score updates to ~650
4. Request "Proof of Stable Balance" credential  
5. Score updates to ~750
6. Return to borrow interface
7. Notice collateral requirement dropped to 75%
8. Can now borrow $133 with same $100 collateral
```

**Test Scenario 3: Supply & Borrow Flow**
```
1. User connects wallet
2. Navigate to "Supply" tab
3. Approve USDC spending
4. Supply $500 USDC
5. Build credit score to 700
6. Navigate to "Borrow" tab
7. Borrow $300 (needs $225 collateral, has $500)
8. Transaction succeeds
9. Dashboard shows:
   - Supplied: $500
   - Borrowed: $300
   - Health Factor: ~1.67
```

##### 4.5 Bug Fixes & Polish
- Fix any UI/UX issues discovered during testing
- Optimize gas usage in contracts
- Add loading skeletons
- Improve error messages
- Add success animations
- Test mobile responsiveness

---

### Phase 5: Deployment & Documentation
**Owner:** All Team Members  
**Dependencies:** Phase 4 complete

#### Objectives
Deploy to Moca Chain testnet and prepare comprehensive documentation.

#### Tasks

##### 5.1 Smart Contract Deployment
```bash
# Deploy to Moca testnet
npx hardhat run scripts/deploy.js --network moca-testnet

# Verify contracts on explorer
npx hardhat verify --network moca-testnet <CONTRACT_ADDRESS>
```

**Post-Deployment Checklist:**
- [ ] CreditScoreOracle deployed and verified
- [ ] LendingPool deployed and verified
- [ ] MockUSDC deployed and verified
- [ ] Issuer addresses registered in Oracle
- [ ] USDC enabled in LendingPool
- [ ] Test faucet working for MockUSDC
- [ ] All contract addresses saved to .env

##### 5.2 Backend Deployment
```bash
# Deploy to Railway/Render/Heroku
railway up
# or
render deploy

# Set environment variables
railway variables set MOCK_EXCHANGE_PRIVATE_KEY=...
railway variables set MOCK_EMPLOYER_PRIVATE_KEY=...
railway variables set MOCK_BANK_PRIVATE_KEY=...
```

**Post-Deployment Checklist:**
- [ ] Service running and accessible
- [ ] Health endpoint returns 200
- [ ] All three issuers operational
- [ ] CORS configured for frontend domain
- [ ] API URL updated in frontend .env

##### 5.3 Frontend Deployment
```bash
# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
```

**Post-Deployment Checklist:**
- [ ] Site accessible and loads correctly
- [ ] Wallet connection works on Moca testnet
- [ ] Can read from contracts
- [ ] Can write to contracts
- [ ] Issuer API calls work
- [ ] Mobile responsive
- [ ] All pages load without errors

##### 5.4 README.md Documentation

```markdown
# Credo Protocol

Decentralized Trust for Capital on Moca Chain

## Overview
[Brief description from OVERVIEW.md]

## Live Demo
- **dApp**: https://credo-protocol.vercel.app
- **Demo Video**: [YouTube Link]
- **Smart Contracts**: 
  - CreditScoreOracle: `0x...`
  - LendingPool: `0x...`

## Quick Start

### For Users
1. Visit [dApp URL]
2. Connect your Moca ID wallet
3. Switch to Moca Chain testnet
4. Get test USDC from faucet
5. Build your credit score
6. Borrow with better terms!

### For Developers

**Prerequisites:**
- Node.js 18+
- npm or yarn

**Installation:**
```bash
git clone https://github.com/Credo-Protocol/Credo-Protocol.git
cd Credo-Protocol
npm install
```

**Smart Contracts:**
```bash
cd contracts
npm install
npx hardhat test
npx hardhat run scripts/deploy.js --network moca-testnet
```

**Backend:**
```bash
cd backend
cp .env.example .env
# Add private keys
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
cp .env.local.example .env.local
# Add contract addresses
npm install
npm run dev
```

## Architecture
[Link to OVERVIEW.md for detailed architecture]

## Moca Stack Integration
- **AIR Account Services**: Seamless Web3 SSO login
- **AIR Credential Services**: Verifiable Credentials with ZK proofs

## Technical Stack
- **Smart Contracts**: Solidity, Hardhat
- **Frontend**: Next.js 15, React 19, Tailwind CSS, Wagmi
- **Backend**: Node.js, Express, Ethers.js
- **Blockchain**: Moca Chain Testnet

## Testing
[Instructions for running tests]

## Team
- lyle - Smart Contracts
- PaulSpread - Frontend/UX
- Eva_code - Backend & Integration

## License
MIT
```

##### 5.5 Demo Video Script

**Length:** 3 minutes  
**Format:** Screen recording with voiceover

**Script Outline:**
```
[0:00-0:20] HOOK - The Problem
- Show traditional DeFi (Aave): Need $150 to borrow $100
- "This locks out billions from accessing capital"

[0:20-0:40] SOLUTION - Credo Protocol
- "Credo changes this with identity-backed lending"
- Show landing page
- "Borrow based on who you are, not just what you have"

[0:40-1:00] DEMO - Login & Dashboard
- Click "Connect Wallet"
- Moca ID login (smooth!)
- Land on dashboard, score is 0

[1:00-1:40] DEMO - Building Credit Score
- "Let's build a credit score"
- Click "Proof of CEX History"
- Request credential (fast!)
- Submit to blockchain
- Score updates: 0 → 580 (animated!)
- Add second credential
- Score: 580 → 750

[1:40-2:20] DEMO - Borrowing
- Go to Borrow tab
- "With a score of 750, I only need 75% collateral"
- Move slider to $100
- Shows: "$75 required (vs $150 in traditional DeFi)"
- Click Borrow
- Transaction confirms
- Success! 🎉

[2:20-2:50] TECH - Under the Hood
- Quick architecture diagram
- "Powered by Moca Chain's AIR Kit"
- "Privacy-preserving with Zero-Knowledge Proofs"
- "Smart contracts dynamically adjust terms based on on-chain credit scores"

[2:50-3:00] CTA - Vision
- "This is just the beginning"
- "Imagine an open financial identity layer for all of Web3"
- "Credo Protocol - Decentralized Trust for Capital"
- Show GitHub + deployed links
```

##### 5.6 Final Testing Checklist

**Functionality:**
- [ ] User can connect wallet
- [ ] User can request credentials from all 3 issuers
- [ ] Credit score updates correctly on-chain
- [ ] Score calculation matches algorithm
- [ ] User can supply collateral
- [ ] User can borrow with dynamic collateral
- [ ] Interest rates adjust based on score
- [ ] User can repay loans
- [ ] User can withdraw collateral
- [ ] All transactions confirm properly

**UI/UX:**
- [ ] Landing page loads fast
- [ ] Dashboard is intuitive
- [ ] Loading states are smooth
- [ ] Success animations work
- [ ] Error messages are helpful
- [ ] Mobile responsive
- [ ] Works on different browsers

**Documentation:**
- [ ] README is comprehensive
- [ ] Setup instructions work
- [ ] Contract addresses are correct
- [ ] Demo video is clear and engaging
- [ ] Code is commented
- [ ] Architecture is documented

**Submission:**
- [ ] GitHub repo is public
- [ ] All code pushed to main branch
- [ ] Demo video uploaded
- [ ] Deployed links work
- [ ] Submission form filled out
- [ ] Submitted before deadline

---

## Success Metrics

By the end of Wave 2, we should have:

✅ **Functional MVP:**
- Working smart contracts on Moca testnet
- 3 credential types available
- Dynamic collateralization working
- End-to-end user flow complete

✅ **Polished Presentation:**
- Beautiful, intuitive UI
- Smooth UX flow (< 1 minute to first loan)
- Professional demo video
- Comprehensive documentation

✅ **Technical Excellence:**
- Secure smart contracts
- Proper error handling
- Gas-optimized operations
- Clean, maintainable code

✅ **Moca Integration:**
- AIR Account Services integrated
- AIR Credential Services framework established
- Protocol deployed on Moca Chain

---

## Post-Wave 2: What's Next?

**Wave 3 Enhancements:**
- Real credential issuers (Plaid integration)
- Full ZK-proof implementation
- Advanced scoring algorithm
- Liquidation mechanism
- Interest accrual system
- Multi-asset support

**Long-Term Vision:**
- Open Issuer SDK
- Cross-chain credit scores
- DAO governance
- $CREDO token
- Composable identity layer for all of Moca ecosystem

---

**Let's build the trust layer for Web3! 🚀**

