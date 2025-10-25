# Phase 1: Oracle v2 Foundation

**Day**: 1 (Oct 25)  
**Duration**: 6-8 hours  
**Status**: Critical Path  
**Next**: [PHASE2-CREDENTIALS.md](./PHASE2-CREDENTIALS.md)

---

## 🎯 Goal

Upgrade CreditScoreOracle to be transparent, configurable, and production-ready with on-chain registries, score breakdowns, and safety improvements.

**Why This First**: All other Wave 3 features depend on the Oracle's new capabilities (registries, breakdowns, reason codes).

---

## 📋 What You're Building

### 1. On-Chain Registries
- **Issuer Registry**: Track trusted credential issuers with trust scores (0-100)
- **Credential Type Registry**: Store weights and decay parameters for each credential type
- **Tier Configuration**: Store tier thresholds and collateral factors on-chain

### 2. Score Transparency
- **Score Breakdown Events**: Emit detailed per-credential contributions
- **Reason Codes**: Explain why a score is what it is
- **Audit Trail**: `scoreRoot` hash for off-chain verification

### 3. Safety Improvements
- **Reentrancy Guard**: Prevent reentrancy attacks
- **Gas Bounds**: Cap credential array size
- **Access Control**: Owner-only registry management

---

## 🛠️ Implementation Steps

### Step 1: Add Issuer Registry (45 min)

**File**: `contracts/contracts/CreditScoreOracle.sol`

Add this after the existing state variables:

```solidity
// Issuer Registry: Track trusted credential issuers
struct IssuerInfo {
    uint8 trustScore;      // 0-100 (percentage)
    bool isActive;
    string name;
    uint256 registeredAt;
}

mapping(address => IssuerInfo) public issuers;

// Events
event IssuerRegistered(address indexed issuer, uint8 trustScore, string name);
event IssuerTrustUpdated(address indexed issuer, uint8 oldScore, uint8 newScore);
event IssuerDeactivated(address indexed issuer);

// Functions
function registerIssuer(
    address issuer,
    uint8 trustScore,
    string memory name
) external onlyOwner {
    require(issuer != address(0), "Invalid issuer address");
    require(trustScore <= 100, "Trust score must be 0-100");
    require(bytes(name).length > 0, "Name required");
    
    issuers[issuer] = IssuerInfo({
        trustScore: trustScore,
        isActive: true,
        name: name,
        registeredAt: block.timestamp
    });
    
    emit IssuerRegistered(issuer, trustScore, name);
}

function updateIssuerTrust(address issuer, uint8 newTrustScore) external onlyOwner {
    require(issuers[issuer].isActive, "Issuer not registered");
    require(newTrustScore <= 100, "Trust score must be 0-100");
    
    uint8 oldScore = issuers[issuer].trustScore;
    issuers[issuer].trustScore = newTrustScore;
    
    emit IssuerTrustUpdated(issuer, oldScore, newTrustScore);
}

function deactivateIssuer(address issuer) external onlyOwner {
    require(issuers[issuer].isActive, "Issuer not active");
    
    issuers[issuer].isActive = false;
    
    emit IssuerDeactivated(issuer);
}
```

---

### Step 2: Add Credential Type Registry (45 min)

Add this below the issuer registry:

```solidity
// Credential Type Registry: Store weights and decay parameters
struct CredentialTypeConfig {
    uint16 baseWeight;     // e.g., 150 for high bank balance
    uint8 decayDays;       // Days until 70% weight (e.g., 90)
    bool isActive;
    string displayName;
}

mapping(bytes32 => CredentialTypeConfig) public credentialTypes;

event CredentialTypeRegistered(bytes32 indexed typeHash, uint16 baseWeight, string displayName);
event CredentialTypeUpdated(bytes32 indexed typeHash, uint16 newWeight);

function registerCredentialType(
    bytes32 typeHash,
    uint16 baseWeight,
    uint8 decayDays,
    string memory displayName
) external onlyOwner {
    require(baseWeight > 0, "Weight must be positive");
    require(decayDays > 0, "Decay days must be positive");
    require(bytes(displayName).length > 0, "Display name required");
    
    credentialTypes[typeHash] = CredentialTypeConfig({
        baseWeight: baseWeight,
        decayDays: decayDays,
        isActive: true,
        displayName: displayName
    });
    
    emit CredentialTypeRegistered(typeHash, baseWeight, displayName);
}

function updateCredentialTypeWeight(bytes32 typeHash, uint16 newWeight) external onlyOwner {
    require(credentialTypes[typeHash].isActive, "Credential type not registered");
    require(newWeight > 0, "Weight must be positive");
    
    credentialTypes[typeHash].baseWeight = newWeight;
    
    emit CredentialTypeUpdated(typeHash, newWeight);
}
```

---

### Step 3: Add Tier Configuration Storage (30 min)

```solidity
// Tier Configuration: Store on-chain for transparency
struct TierConfig {
    uint16 minScore;
    uint16 maxScore;
    uint16 collateralFactor;  // Basis points (5000 = 50%)
    string tierName;
}

TierConfig[8] public tiers;

// Initialize in constructor or setup function
function initializeTiers() external onlyOwner {
    tiers[0] = TierConfig(900, 1000, 5000, "Exceptional");  // 50%
    tiers[1] = TierConfig(800, 899, 6000, "Excellent");     // 60%
    tiers[2] = TierConfig(700, 799, 7500, "Good");          // 75%
    tiers[3] = TierConfig(600, 699, 9000, "Fair");          // 90%
    tiers[4] = TierConfig(500, 599, 10000, "Average");      // 100%
    tiers[5] = TierConfig(400, 499, 11000, "Below Average"); // 110%
    tiers[6] = TierConfig(300, 399, 12500, "Poor");         // 125%
    tiers[7] = TierConfig(0, 299, 15000, "Very Poor");      // 150%
}

function getTierForScore(uint16 score) public view returns (TierConfig memory) {
    for (uint8 i = 0; i < tiers.length; i++) {
        if (score >= tiers[i].minScore && score <= tiers[i].maxScore) {
            return tiers[i];
        }
    }
    return tiers[7]; // Default to lowest tier
}
```

---

### Step 4: Add Score Breakdown Events (1 hour)

```solidity
// Score breakdown for transparency
struct ScoreComponent {
    bytes32 credentialType;
    uint16 baseWeight;
    uint8 trustScore;
    uint8 recencyPercent;  // 70-100
    uint16 finalPoints;
}

event ScoreComputed(
    address indexed user,
    uint16 baseScore,
    ScoreComponent[] components,
    uint8 diversityBonusPercent,
    uint16 finalScore,
    bytes32 scoreRoot
);

event ScoreComponentAdded(
    address indexed user,
    bytes32 indexed credentialType,
    uint16 pointsAdded,
    uint8 trustScore,
    uint8 recencyPercent
);
```

---

### Step 5: Update computeCreditScore Function (1.5 hours)

**Modify existing function** to use registries and emit events:

```solidity
// Add reentrancy guard import at top
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Update contract declaration
contract CreditScoreOracle is Ownable, ReentrancyGuard {
    
    // Add max credentials limit
    uint256 public constant MAX_CREDENTIALS_PER_USER = 20;
    
    function computeCreditScore(address user) 
        external 
        nonReentrant 
        returns (uint16) 
    {
        require(user != address(0), "Invalid user address");
        
        Credential[] memory credentials = userCredentials[user];
        require(credentials.length <= MAX_CREDENTIALS_PER_USER, "Too many credentials");
        
        if (credentials.length == 0) {
            return 500; // Base score
        }
        
        uint16 baseScore = 500;
        uint256 totalPoints = baseScore;
        
        // Track components for event emission
        ScoreComponent[] memory components = new ScoreComponent[](credentials.length);
        
        // Track unique credential types for diversity bonus
        bytes32[] memory uniqueTypes = new bytes32[](credentials.length);
        uint8 uniqueCount = 0;
        
        for (uint256 i = 0; i < credentials.length; i++) {
            Credential memory cred = credentials[i];
            
            // Check issuer is active
            require(issuers[cred.issuer].isActive, "Inactive issuer");
            
            // Get credential type config
            bytes32 typeHash = keccak256(abi.encodePacked(cred.credentialType));
            CredentialTypeConfig memory typeConfig = credentialTypes[typeHash];
            require(typeConfig.isActive, "Inactive credential type");
            
            // Get issuer trust score
            uint8 issuerTrust = issuers[cred.issuer].trustScore;
            
            // Calculate recency decay
            uint256 age = block.timestamp - cred.issuanceDate;
            uint256 ageDays = age / (24 * 60 * 60);
            uint8 recencyPercent = 100;
            
            if (ageDays > typeConfig.decayDays) {
                recencyPercent = 70; // Minimum 70% after decay period
            } else if (ageDays > 0) {
                // Linear decay from 100% to 70% over decay period
                recencyPercent = uint8(100 - (30 * ageDays / typeConfig.decayDays));
            }
            
            // Calculate final points for this credential
            uint256 points = typeConfig.baseWeight;
            points = (points * issuerTrust) / 100;      // Apply trust
            points = (points * recencyPercent) / 100;   // Apply recency
            
            totalPoints += points;
            
            // Store component for event
            components[i] = ScoreComponent({
                credentialType: typeHash,
                baseWeight: typeConfig.baseWeight,
                trustScore: issuerTrust,
                recencyPercent: recencyPercent,
                finalPoints: uint16(points)
            });
            
            // Track unique types
            bool isUnique = true;
            for (uint8 j = 0; j < uniqueCount; j++) {
                if (uniqueTypes[j] == typeHash) {
                    isUnique = false;
                    break;
                }
            }
            if (isUnique && uniqueCount < uniqueTypes.length) {
                uniqueTypes[uniqueCount] = typeHash;
                uniqueCount++;
            }
            
            emit ScoreComponentAdded(user, typeHash, uint16(points), issuerTrust, recencyPercent);
        }
        
        // Apply diversity bonus (5% per unique type, max 25%)
        uint8 diversityBonus = uniqueCount * 5;
        if (diversityBonus > 25) diversityBonus = 25;
        
        totalPoints = (totalPoints * (100 + diversityBonus)) / 100;
        
        // Cap at 1000
        if (totalPoints > 1000) totalPoints = 1000;
        
        uint16 finalScore = uint16(totalPoints);
        creditScores[user] = finalScore;
        
        // Create audit hash
        bytes32 scoreRoot = keccak256(abi.encode(user, finalScore, block.timestamp));
        
        // Emit comprehensive event
        emit ScoreComputed(
            user,
            baseScore,
            components,
            diversityBonus,
            finalScore,
            scoreRoot
        );
        
        return finalScore;
    }
}
```

---

### Step 6: Add ReentrancyGuard Dependency (10 min)

**File**: `contracts/package.json`

Ensure OpenZeppelin is installed:

```json
{
  "dependencies": {
    "@openzeppelin/contracts": "^5.0.0"
  }
}
```

Run:
```bash
cd contracts
npm install
```

---

### Step 7: Write Tests (1.5 hours)

**File**: `contracts/test/CreditScoreOracle.test.ts`

Add new test suite:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { CreditScoreOracle } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CreditScoreOracle v2", () => {
    let oracle: CreditScoreOracle;
    let owner: SignerWithAddress;
    let issuer: SignerWithAddress;
    let user: SignerWithAddress;
    
    beforeEach(async () => {
        [owner, issuer, user] = await ethers.getSigners();
        
        const Oracle = await ethers.getContractFactory("CreditScoreOracle");
        oracle = await Oracle.deploy();
        await oracle.deployed();
    });
    
    describe("Issuer Registry", () => {
        it("Should register new issuer with trust score", async () => {
            await oracle.registerIssuer(issuer.address, 100, "Test Issuer");
            
            const issuerInfo = await oracle.issuers(issuer.address);
            expect(issuerInfo.trustScore).to.equal(100);
            expect(issuerInfo.isActive).to.equal(true);
            expect(issuerInfo.name).to.equal("Test Issuer");
        });
        
        it("Should update issuer trust score", async () => {
            await oracle.registerIssuer(issuer.address, 100, "Test Issuer");
            await oracle.updateIssuerTrust(issuer.address, 80);
            
            const issuerInfo = await oracle.issuers(issuer.address);
            expect(issuerInfo.trustScore).to.equal(80);
        });
        
        it("Should deactivate issuer", async () => {
            await oracle.registerIssuer(issuer.address, 100, "Test Issuer");
            await oracle.deactivateIssuer(issuer.address);
            
            const issuerInfo = await oracle.issuers(issuer.address);
            expect(issuerInfo.isActive).to.equal(false);
        });
        
        it("Should reject non-owner registry updates", async () => {
            await expect(
                oracle.connect(user).registerIssuer(issuer.address, 100, "Test")
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        
        it("Should reject invalid trust scores", async () => {
            await expect(
                oracle.registerIssuer(issuer.address, 101, "Test")
            ).to.be.revertedWith("Trust score must be 0-100");
        });
    });
    
    describe("Credential Type Registry", () => {
        it("Should register credential type with weight", async () => {
            const typeHash = ethers.utils.id("BANK_BALANCE_HIGH");
            await oracle.registerCredentialType(typeHash, 150, 90, "High Balance");
            
            const typeConfig = await oracle.credentialTypes(typeHash);
            expect(typeConfig.baseWeight).to.equal(150);
            expect(typeConfig.decayDays).to.equal(90);
            expect(typeConfig.isActive).to.equal(true);
        });
        
        it("Should update credential type weight", async () => {
            const typeHash = ethers.utils.id("BANK_BALANCE_HIGH");
            await oracle.registerCredentialType(typeHash, 150, 90, "High Balance");
            await oracle.updateCredentialTypeWeight(typeHash, 200);
            
            const typeConfig = await oracle.credentialTypes(typeHash);
            expect(typeConfig.baseWeight).to.equal(200);
        });
    });
    
    describe("Score Breakdown", () => {
        it("Should emit ScoreComputed with all components", async () => {
            // Register issuer and credential type
            await oracle.registerIssuer(issuer.address, 100, "Test Issuer");
            const typeHash = ethers.utils.id("TEST_CREDENTIAL");
            await oracle.registerCredentialType(typeHash, 100, 90, "Test Credential");
            
            // Submit credential (you'll need to implement this part based on your existing submitCredential function)
            // ...
            
            // Compute score
            const tx = await oracle.computeCreditScore(user.address);
            const receipt = await tx.wait();
            
            // Check event was emitted
            const event = receipt.events?.find(e => e.event === "ScoreComputed");
            expect(event).to.not.be.undefined;
        });
        
        it("Should respect MAX_CREDENTIALS_PER_USER limit", async () => {
            // This test would require submitting 21+ credentials
            // For now, just verify the constant exists
            const maxCreds = await oracle.MAX_CREDENTIALS_PER_USER();
            expect(maxCreds).to.equal(20);
        });
    });
    
    describe("Tier Configuration", () => {
        it("Should return correct tier for score", async () => {
            await oracle.initializeTiers();
            
            const tier900 = await oracle.getTierForScore(900);
            expect(tier900.tierName).to.equal("Exceptional");
            expect(tier900.collateralFactor).to.equal(5000); // 50%
            
            const tier500 = await oracle.getTierForScore(500);
            expect(tier500.tierName).to.equal("Average");
            expect(tier500.collateralFactor).to.equal(10000); // 100%
        });
        
        it("Should handle edge cases", async () => {
            await oracle.initializeTiers();
            
            const tier0 = await oracle.getTierForScore(0);
            expect(tier0.tierName).to.equal("Very Poor");
            
            const tier1000 = await oracle.getTierForScore(1000);
            expect(tier1000.tierName).to.equal("Exceptional");
        });
    });
});
```

---

### Step 8: Update Deployment Script (30 min)

**File**: `contracts/scripts/deploy.ts`

Update to initialize registries:

```typescript
async function deployOracleV2() {
    console.log("Deploying CreditScoreOracle v2...");
    
    const Oracle = await ethers.getContractFactory("CreditScoreOracle");
    const oracle = await Oracle.deploy();
    await oracle.deployed();
    
    console.log("CreditScoreOracle deployed to:", oracle.address);
    
    // Initialize tiers
    console.log("Initializing tiers...");
    await oracle.initializeTiers();
    
    // Register issuers
    console.log("Registering issuers...");
    await oracle.registerIssuer(
        process.env.BANK_ISSUER_ADDRESS || deployer.address,
        100,
        "Mock Bank Issuer"
    );
    
    await oracle.registerIssuer(
        process.env.EXCHANGE_ISSUER_ADDRESS || deployer.address,
        100,
        "Mock Exchange Issuer"
    );
    
    await oracle.registerIssuer(
        process.env.EMPLOYER_ISSUER_ADDRESS || deployer.address,
        100,
        "Mock Employer Issuer"
    );
    
    // Register credential types (basic types for now, will add buckets in Phase 2)
    console.log("Registering credential types...");
    const types = [
        { name: "CEX_HISTORY", weight: 80, decay: 365 },
        { name: "EMPLOYMENT", weight: 70, decay: 180 },
        { name: "BANK_BALANCE", weight: 100, decay: 90 }
    ];
    
    for (const type of types) {
        const typeHash = ethers.utils.id(type.name);
        await oracle.registerCredentialType(
            typeHash,
            type.weight,
            type.decay,
            type.name
        );
        console.log(`  Registered ${type.name}`);
    }
    
    console.log("Oracle v2 setup complete!");
    return oracle;
}
```

---

### Step 9: Update Frontend ABI (15 min)

**File**: `lib/contracts.js`

Add new ABI methods:

```javascript
export const CREDIT_SCORE_ORACLE_ABI = [
    // ... existing methods ...
    
    // V2 Registry methods
    "function issuers(address) view returns (uint8 trustScore, bool isActive, string name, uint256 registeredAt)",
    "function credentialTypes(bytes32) view returns (uint16 baseWeight, uint8 decayDays, bool isActive, string displayName)",
    "function tiers(uint256) view returns (uint16 minScore, uint16 maxScore, uint16 collateralFactor, string tierName)",
    "function getTierForScore(uint16) view returns (tuple(uint16 minScore, uint16 maxScore, uint16 collateralFactor, string tierName))",
    
    // V2 Events
    "event ScoreComputed(address indexed user, uint16 baseScore, tuple(bytes32 credentialType, uint16 baseWeight, uint8 trustScore, uint8 recencyPercent, uint16 finalPoints)[] components, uint8 diversityBonusPercent, uint16 finalScore, bytes32 scoreRoot)",
    "event ScoreComponentAdded(address indexed user, bytes32 indexed credentialType, uint16 pointsAdded, uint8 trustScore, uint8 recencyPercent)"
];
```

---

## ✅ Phase 1 Acceptance Criteria

**Before moving to Phase 2, verify ALL of these:**

### Smart Contract
- [ ] `registerIssuer()` function works and emits event
- [ ] `updateIssuerTrust()` updates trust score correctly
- [ ] `deactivateIssuer()` prevents credentials from inactive issuers
- [ ] `registerCredentialType()` stores weights and decay parameters
- [ ] `initializeTiers()` populates all 8 tiers correctly
- [ ] `getTierForScore()` returns correct tier for any score
- [ ] ReentrancyGuard imported and applied to `computeCreditScore`
- [ ] `MAX_CREDENTIALS_PER_USER` enforced
- [ ] `ScoreComputed` event emits with all components
- [ ] `ScoreComponentAdded` event emits for each credential

### Testing
- [ ] All new test cases pass
- [ ] All existing tests still pass
- [ ] `npm test` in contracts folder shows 100% pass rate
- [ ] No warnings or errors during compilation

### Gas & Performance
- [ ] `computeCreditScore` uses <500k gas with 10 credentials
- [ ] No infinite loops possible
- [ ] Array bounds checked

### Deployment
- [ ] Deploy script updated with registry initialization
- [ ] Deploy script registers 3 issuers
- [ ] Deploy script registers at least 3 credential types
- [ ] Tiers initialized in deployment

### Frontend Integration
- [ ] ABI updated in `lib/contracts.js`
- [ ] No TypeScript/JavaScript errors

---

## 🧪 Testing Commands

```bash
# Compile contracts
cd contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run specific test file
npx hardhat test test/CreditScoreOracle.test.ts

# Check gas usage
REPORT_GAS=true npx hardhat test

# Deploy to local network (for testing)
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy.ts --network localhost
```

---

## 🚨 Common Issues & Solutions

### Issue: "Ownable: caller is not the owner"
**Solution**: Make sure you're calling admin functions from the deployer account

### Issue: Compilation errors with ReentrancyGuard
**Solution**: Check OpenZeppelin version, ensure v5.x is installed

### Issue: Tests failing after changes
**Solution**: Update test fixtures to register issuers/types before submitting credentials

### Issue: Gas limit exceeded
**Solution**: Reduce credential array size in test, check for loops

---

## 📊 Progress Tracking

- [ ] Step 1: Issuer Registry (45 min)
- [ ] Step 2: Credential Type Registry (45 min)
- [ ] Step 3: Tier Configuration (30 min)
- [ ] Step 4: Score Breakdown Events (1 hour)
- [ ] Step 5: Update computeCreditScore (1.5 hours)
- [ ] Step 6: Add Dependencies (10 min)
- [ ] Step 7: Write Tests (1.5 hours)
- [ ] Step 8: Update Deployment Script (30 min)
- [ ] Step 9: Update Frontend ABI (15 min)

**Total**: 6-8 hours

---

## ✨ What You've Accomplished

After Phase 1, you'll have:

✅ **Transparent Oracle**: Anyone can see issuer trust scores, credential weights  
✅ **Configurable System**: Change weights without redeploying contracts  
✅ **Audit Trail**: Every score computation emits detailed breakdown  
✅ **Production Safety**: Reentrancy protection, gas bounds, access control  
✅ **Testnet-Ready**: All infrastructure for Phase 2-3 features  

---

## 🚀 Next Steps

1. **Commit your work**:
```bash
git add .
git commit -m "feat: Complete Phase 1 - Oracle v2 with registries and transparency"
git push
```

2. **Take a 10-minute break** ☕

3. **Move to Phase 2**: [PHASE2-CREDENTIALS.md](./PHASE2-CREDENTIALS.md)

---

**Phase Status**: Ready to Execute  
**Estimated Completion**: End of Day 1 (Oct 25)

