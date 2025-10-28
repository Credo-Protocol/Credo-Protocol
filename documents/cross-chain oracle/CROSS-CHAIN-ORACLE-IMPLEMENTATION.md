# Cross-Chain Oracle Implementation Guide

**Credo Protocol - Buildathon Wave 3**  
**Implementation Time:** ~4-6 hours  
**Difficulty:** Advanced  
**Based on:** Official Moca Identity Oracle Documentation

---

## Overview

**What We're Building:**
A cross-chain relay system that sends Credo credit scores from Moca Chain to Ethereum/Polygon/Base using Moca's Identity Oracle.

**Why This Matters:**
- Makes your credit scores usable on ANY blockchain
- Unlocks entire DeFi ecosystem (Aave, Compound, etc.)
- Demonstrates infrastructure value (not just a standalone protocol)
- Perfect buildathon showcase feature

**How It Works:**
```
1. User triggers relay on Moca Chain (emits CrossChainScoreUpdate event)
2. Identity Oracle picks up event (Listener component)
3. Validators sign with BLS keys (Vote Processor)
4. Oracle submits to target chain (Transaction Assembler)
5. Credit score now available on Ethereum/Polygon/Base
```

**Based On:** https://docs.moca.network/mocachain/technical-details/identity-oracle

---

## Important Note ⚠️

**The Identity Oracle is operated by Moca Network, NOT by you.**

You will:
- ✅ Emit events in correct format
- ✅ Deploy receiver contracts on target chains
- ✅ Contact Moca team to register your contracts
- ❌ NOT run the oracle yourself
- ❌ NOT handle BLS signatures yourself

Think of it like using Chainlink - you emit events, they relay data.

---

## Prerequisites

Before starting:
- [x] Credo contracts deployed on Moca Chain (you have this)
- [ ] MetaMask with funds on Sepolia/Base Sepolia (for testing)
- [ ] Access to Ethereum/Base testnet RPC (Alchemy/Infura)
- [ ] Contact with Moca team (Discord: https://discord.gg/mocaversenft)

---

## Phase 1: Update Moca Chain Contract (1 hour)

**Goal:** Add cross-chain event emission to your CreditScoreOracle contract

**What You'll Do:**
- Add CrossChainScoreUpdate event
- Add function to trigger relay
- Deploy updated contract
- Test event emission

---

### Step 1.1: Add Cross-Chain Event

Update `contracts/contracts/CreditScoreOracle.sol`:

```solidity
// Add this event near the top with other events
event CrossChainScoreUpdate(
    address indexed user,
    uint256 score,
    uint256 timestamp,
    uint256 targetChainId,  // 11155111 = Sepolia, 84532 = Base Sepolia
    bytes32 indexed messageId
);
```

**Why This Format:**
- `user`: Who's credit score is being relayed
- `score`: The credit score value
- `timestamp`: When it was updated
- `targetChainId`: Which chain to send to
- `messageId`: Unique ID for tracking (prevents duplicates)

---

### Step 1.2: Add Relay Request Function

Add this function to `CreditScoreOracle.sol`:

```solidity
/**
 * @notice Request cross-chain relay of credit score
 * @dev Emits event that Identity Oracle will pick up
 * @param targetChainId Chain ID to relay to (11155111 = Sepolia, 84532 = Base Sepolia)
 */
function requestCrossChainRelay(uint256 targetChainId) external {
    // Get user's current score
    uint256 score = getUserScore(msg.sender);
    require(score > 0, "No credit score to relay");
    
    // Validate target chain
    require(
        targetChainId == 11155111 || // Sepolia
        targetChainId == 84532 ||    // Base Sepolia  
        targetChainId == 80002,      // Polygon Amoy
        "Unsupported target chain"
    );
    
    // Generate unique message ID (prevents duplicate relays)
    bytes32 messageId = keccak256(
        abi.encodePacked(
            msg.sender,
            score,
            block.timestamp,
            targetChainId,
            block.number
        )
    );
    
    // Emit event for Identity Oracle
    emit CrossChainScoreUpdate(
        msg.sender,
        score,
        block.timestamp,
        targetChainId,
        messageId
    );
}
```

**Why This Works:**
- User calls this function once per target chain
- Event is automatically picked up by Oracle Listener
- Oracle handles all the relay logic
- User doesn't pay gas on destination chain

---

### Step 1.3: Deploy Updated Contract

Create `contracts/scripts/upgrade-oracle-crosschain.ts`:

```typescript
import { ethers } from 'hardhat';

async function main() {
  console.log('🔄 Upgrading CreditScoreOracle with cross-chain support...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);

  // Get old contract address
  const oldAddress = '0x12ad1aBfBde99Ce4D37fB18A5e622A619d59f705';
  console.log('Old Contract:', oldAddress);

  // Deploy new version
  const CreditScoreOracle = await ethers.getContractFactory('CreditScoreOracle');
  const oracle = await CreditScoreOracle.deploy();
  await oracle.waitForDeployment();

  const newAddress = await oracle.getAddress();
  console.log('✅ New Contract Deployed:', newAddress);

  // TODO: Migrate state from old contract if needed
  // For buildathon: just deploy fresh and re-register issuers

  console.log('\n📋 Next Steps:');
  console.log('1. Update .env with new contract address');
  console.log('2. Re-register credential issuers');
  console.log('3. Update frontend contract address');
  console.log('4. Test event emission');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run deployment:

```bash
cd contracts
npx hardhat run scripts/upgrade-oracle-crosschain.ts --network mocaDevnet
```

---

### Step 1.4: Test Event Emission

Create `contracts/test/CrossChainRelay.test.ts`:

```typescript
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Cross-Chain Relay', function () {
  let oracle: any;
  let user: any;
  
  beforeEach(async function () {
    [user] = await ethers.getSigners();
    
    const CreditScoreOracle = await ethers.getContractFactory('CreditScoreOracle');
    oracle = await CreditScoreOracle.deploy();
    await oracle.waitForDeployment();
    
    // Register a mock issuer and credential type
    await oracle.registerIssuer(user.address, 'Mock Issuer', 100);
    await oracle.registerCredentialType('BANK_BALANCE_HIGH', 150, 10);
    
    // Submit a credential to give user a score
    const credential = {
      credentialType: 0,
      issuer: user.address,
      subject: user.address,
      issuanceDate: Math.floor(Date.now() / 1000),
      expirationDate: Math.floor(Date.now() / 1000) + 31536000,
      signature: '0x'
    };
    await oracle.submitCredential(credential, '0x');
  });

  it('should emit CrossChainScoreUpdate event', async function () {
    const targetChainId = 11155111; // Sepolia
    
    await expect(oracle.requestCrossChainRelay(targetChainId))
      .to.emit(oracle, 'CrossChainScoreUpdate')
      .withArgs(
        user.address,
        (score: bigint) => score > 0n,  // Check score > 0
        (timestamp: bigint) => timestamp > 0n,  // Check timestamp > 0
        targetChainId,
        (messageId: string) => messageId.length === 66  // Check messageId is bytes32
      );
  });

  it('should reject if no credit score', async function () {
    const [newUser] = await ethers.getSigners();
    await expect(
      oracle.connect(newUser).requestCrossChainRelay(11155111)
    ).to.be.revertedWith('No credit score to relay');
  });

  it('should reject unsupported chains', async function () {
    await expect(
      oracle.requestCrossChainRelay(1)  // Ethereum mainnet
    ).to.be.revertedWith('Unsupported target chain');
  });

  it('should generate unique message IDs', async function () {
    const tx1 = await oracle.requestCrossChainRelay(11155111);
    const receipt1 = await tx1.wait();
    
    const tx2 = await oracle.requestCrossChainRelay(84532);
    const receipt2 = await tx2.wait();
    
    const event1 = receipt1?.logs[0];
    const event2 = receipt2?.logs[0];
    
    // Message IDs should be different (different target chains)
    expect(event1?.topics[2]).to.not.equal(event2?.topics[2]);
  });
});
```

Run tests:

```bash
npx hardhat test test/CrossChainRelay.test.ts
```

**Expected Output:**
```
Cross-Chain Relay
  ✔ should emit CrossChainScoreUpdate event
  ✔ should reject if no credit score
  ✔ should reject unsupported chains
  ✔ should generate unique message IDs

4 passing (2s)
```

---

### ✅ Phase 1 Complete - Checklist

- [ ] Cross-chain event added to contract
- [ ] Relay request function implemented
- [ ] Contract deployed to Moca Devnet
- [ ] All tests passing
- [ ] Event emission verified

**If all checked, proceed to Phase 2. Otherwise, debug before continuing.**

---

## Phase 2: Deploy Receiver Contracts (2 hours)

**Goal:** Deploy contracts on Ethereum/Base that receive credit scores

**What You'll Do:**
- Create receiver contract
- Deploy to Sepolia testnet
- Deploy to Base Sepolia
- Test contract functions

---

### Step 2.1: Create Receiver Contract

Create `contracts/contracts/CrossChainCreditScore.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CrossChainCreditScore
 * @notice Receives credit scores from Moca Chain via Identity Oracle
 * @dev Only the Moca Identity Oracle can submit scores
 */
contract CrossChainCreditScore is Ownable {
    
    // Moca Identity Oracle address (will be set after deployment)
    address public mocaOracle;
    
    // Moca Chain ID where scores originate
    uint256 public constant SOURCE_CHAIN_ID = 5151; // Moca Devnet
    
    // Credit score data structure
    struct CreditScore {
        uint256 score;              // Credit score (0-1000)
        uint256 lastUpdated;        // Timestamp of last update
        uint256 mocaChainTimestamp; // Original timestamp on Moca Chain
        bytes32 messageId;          // Unique message ID from Moca Chain
        bool verified;              // Whether score is verified by oracle
    }
    
    // User address => Credit score
    mapping(address => CreditScore) public creditScores;
    
    // Track all users with scores (for leaderboard)
    address[] public usersWithScores;
    mapping(address => bool) public hasScore;
    
    // Events
    event CreditScoreUpdated(
        address indexed user,
        uint256 score,
        uint256 timestamp,
        bytes32 messageId
    );
    
    event OracleUpdated(
        address indexed oldOracle,
        address indexed newOracle
    );
    
    /**
     * @notice Constructor
     * @param _mocaOracle Address of Moca Identity Oracle on this chain
     */
    constructor(address _mocaOracle) Ownable(msg.sender) {
        require(_mocaOracle != address(0), "Invalid oracle address");
        mocaOracle = _mocaOracle;
    }
    
    /**
     * @notice Update oracle address (admin only)
     * @param _newOracle New oracle address
     */
    function updateOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid oracle address");
        address oldOracle = mocaOracle;
        mocaOracle = _newOracle;
        emit OracleUpdated(oldOracle, _newOracle);
    }
    
    /**
     * @notice Submit credit score (Oracle only)
     * @dev Called by Moca Identity Oracle
     * @param user User's address
     * @param score Credit score (0-1000)
     * @param mocaChainTimestamp Original timestamp from Moca Chain
     * @param messageId Unique message ID from Moca Chain event
     */
    function submitCreditScore(
        address user,
        uint256 score,
        uint256 mocaChainTimestamp,
        bytes32 messageId
    ) external {
        // Only oracle can submit
        require(msg.sender == mocaOracle, "Only oracle can submit");
        require(user != address(0), "Invalid user address");
        require(score <= 1000, "Score must be <= 1000");
        require(messageId != bytes32(0), "Invalid message ID");
        
        // Check for duplicate message (prevent replay attacks)
        require(
            creditScores[user].messageId != messageId,
            "Duplicate message ID"
        );
        
        // Track new user
        if (!hasScore[user]) {
            usersWithScores.push(user);
            hasScore[user] = true;
        }
        
        // Update credit score
        creditScores[user] = CreditScore({
            score: score,
            lastUpdated: block.timestamp,
            mocaChainTimestamp: mocaChainTimestamp,
            messageId: messageId,
            verified: true
        });
        
        emit CreditScoreUpdated(user, score, block.timestamp, messageId);
    }
    
    /**
     * @notice Get user's credit score
     * @param user User's address
     * @return score Credit score
     * @return lastUpdated Last update timestamp
     * @return verified Whether score is verified
     */
    function getCreditScore(address user) 
        external 
        view 
        returns (
            uint256 score,
            uint256 lastUpdated,
            bool verified
        ) 
    {
        CreditScore memory cs = creditScores[user];
        return (cs.score, cs.lastUpdated, cs.verified);
    }
    
    /**
     * @notice Check if user has verified credit score
     * @param user User's address
     * @return Whether user has verified score
     */
    function hasVerifiedScore(address user) external view returns (bool) {
        return creditScores[user].verified && creditScores[user].score > 0;
    }
    
    /**
     * @notice Get total number of users with scores
     * @return Number of users
     */
    function getUserCount() external view returns (uint256) {
        return usersWithScores.length;
    }
    
    /**
     * @notice Get user address at index (for leaderboard)
     * @param index Index in users array
     * @return User address
     */
    function getUserAt(uint256 index) external view returns (address) {
        require(index < usersWithScores.length, "Index out of bounds");
        return usersWithScores[index];
    }
    
    /**
     * @notice Get minimum score required for loan approval
     * @dev Can be used by lending protocols
     * @return Minimum score (600)
     */
    function getMinimumScore() external pure returns (uint256) {
        return 600;
    }
}
```

**Key Features:**
- Only oracle can submit scores
- Prevents duplicate submissions (messageId check)
- Tracks all users (for leaderboard)
- Provides view functions for integrations
- Emits events for transparency

---

### Step 2.2: Configure Hardhat for Multi-Chain

Update `contracts/hardhat.config.ts`:

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
        runs: 200,
      },
    },
  },
  networks: {
    mocaDevnet: {
      url: "https://rpc.devnet.mocachain.org",
      chainId: 5151,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/your-api-key",
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    amoy: {
      url: "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      amoy: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
};

export default config;
```

Update `contracts/.env`:

```bash
# Add these
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
```

---

### Step 2.3: Deploy to Sepolia

Create `contracts/scripts/deploy-crosschain-receiver.ts`:

```typescript
import { ethers, network } from 'hardhat';
import fs from 'fs';

async function main() {
  console.log(`🚀 Deploying CrossChainCreditScore to ${network.name}...\n`);

  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH\n');

  // Moca Oracle addresses (PLACEHOLDER - get from Moca team)
  const ORACLE_ADDRESSES: Record<string, string> = {
    sepolia: '0x0000000000000000000000000000000000000000',  // TODO: Get from Moca
    baseSepolia: '0x0000000000000000000000000000000000000000',  // TODO: Get from Moca
    amoy: '0x0000000000000000000000000000000000000000',  // TODO: Get from Moca
  };

  const oracleAddress = ORACLE_ADDRESSES[network.name];
  
  if (!oracleAddress || oracleAddress === '0x0000000000000000000000000000000000000000') {
    console.log('⚠️  Oracle address not configured for', network.name);
    console.log('   Using deployer address as placeholder');
    console.log('   Contact Moca team for official oracle address\n');
  }

  // Deploy contract
  const CrossChainCreditScore = await ethers.getContractFactory('CrossChainCreditScore');
  const contract = await CrossChainCreditScore.deploy(
    oracleAddress || deployer.address  // Use deployer as placeholder
  );
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('✅ CrossChainCreditScore deployed to:', address);

  // Save deployment info
  const deployment = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: address,
    oracleAddress: oracleAddress || deployer.address,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  const deploymentPath = `deployments/crosschain-${network.name}.json`;
  fs.mkdirSync('deployments', { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  console.log('\n📝 Deployment saved to:', deploymentPath);

  // Wait for confirmations
  console.log('\n⏳ Waiting for block confirmations...');
  await contract.deploymentTransaction()?.wait(5);

  console.log('\n✅ Deployment complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Contact Moca team to register this contract');
  console.log('2. Update oracle address with updateOracle() if placeholder used');
  console.log('3. Verify contract on block explorer');
  console.log('4. Test score submission');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Deploy to Sepolia:

```bash
# Get Sepolia ETH from faucet first:
# https://sepoliafaucet.com/

npx hardhat run scripts/deploy-crosschain-receiver.ts --network sepolia
```

---

### Step 2.4: Deploy to Base Sepolia

```bash
# Get Base Sepolia ETH:
# https://bridge.base.org/

npx hardhat run scripts/deploy-crosschain-receiver.ts --network baseSepolia
```

---

### Step 2.5: Test Receiver Contract

Create `contracts/test/CrossChainReceiver.test.ts`:

```typescript
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('CrossChainCreditScore', function () {
  let contract: any;
  let oracle: any;
  let user: any;
  let attacker: any;

  beforeEach(async function () {
    [oracle, user, attacker] = await ethers.getSigners();
    
    const CrossChainCreditScore = await ethers.getContractFactory('CrossChainCreditScore');
    contract = await CrossChainCreditScore.deploy(oracle.address);
    await contract.waitForDeployment();
  });

  describe('Deployment', function () {
    it('should set oracle address', async function () {
      expect(await contract.mocaOracle()).to.equal(oracle.address);
    });

    it('should set correct source chain ID', async function () {
      expect(await contract.SOURCE_CHAIN_ID()).to.equal(5151);
    });
  });

  describe('Score Submission', function () {
    it('should allow oracle to submit score', async function () {
      const score = 850;
      const timestamp = Math.floor(Date.now() / 1000);
      const messageId = ethers.keccak256(ethers.toUtf8Bytes('test-message-1'));

      await expect(
        contract.connect(oracle).submitCreditScore(
          user.address,
          score,
          timestamp,
          messageId
        )
      )
        .to.emit(contract, 'CreditScoreUpdated')
        .withArgs(user.address, score, (ts: bigint) => ts > 0n, messageId);

      const [fetchedScore, , verified] = await contract.getCreditScore(user.address);
      expect(fetchedScore).to.equal(score);
      expect(verified).to.be.true;
    });

    it('should reject non-oracle submissions', async function () {
      const messageId = ethers.keccak256(ethers.toUtf8Bytes('test'));
      
      await expect(
        contract.connect(attacker).submitCreditScore(
          user.address,
          850,
          Math.floor(Date.now() / 1000),
          messageId
        )
      ).to.be.revertedWith('Only oracle can submit');
    });

    it('should reject duplicate message IDs', async function () {
      const messageId = ethers.keccak256(ethers.toUtf8Bytes('duplicate-test'));
      const timestamp = Math.floor(Date.now() / 1000);

      // First submission
      await contract.connect(oracle).submitCreditScore(
        user.address,
        850,
        timestamp,
        messageId
      );

      // Duplicate submission should fail
      await expect(
        contract.connect(oracle).submitCreditScore(
          user.address,
          900,
          timestamp,
          messageId
        )
      ).to.be.revertedWith('Duplicate message ID');
    });

    it('should reject invalid scores', async function () {
      const messageId = ethers.keccak256(ethers.toUtf8Bytes('test'));
      
      await expect(
        contract.connect(oracle).submitCreditScore(
          user.address,
          1001,  // Score > 1000
          Math.floor(Date.now() / 1000),
          messageId
        )
      ).to.be.revertedWith('Score must be <= 1000');
    });
  });

  describe('Score Retrieval', function () {
    it('should return zero for users without scores', async function () {
      const [score, lastUpdated, verified] = await contract.getCreditScore(user.address);
      expect(score).to.equal(0);
      expect(lastUpdated).to.equal(0);
      expect(verified).to.be.false;
    });

    it('should track users with scores', async function () {
      const messageId = ethers.keccak256(ethers.toUtf8Bytes('test'));
      
      await contract.connect(oracle).submitCreditScore(
        user.address,
        850,
        Math.floor(Date.now() / 1000),
        messageId
      );

      expect(await contract.getUserCount()).to.equal(1);
      expect(await contract.getUserAt(0)).to.equal(user.address);
      expect(await contract.hasVerifiedScore(user.address)).to.be.true;
    });
  });

  describe('Oracle Management', function () {
    it('should allow owner to update oracle', async function () {
      const [owner, newOracle] = await ethers.getSigners();
      
      await expect(contract.updateOracle(newOracle.address))
        .to.emit(contract, 'OracleUpdated')
        .withArgs(oracle.address, newOracle.address);
      
      expect(await contract.mocaOracle()).to.equal(newOracle.address);
    });

    it('should reject non-owner oracle updates', async function () {
      await expect(
        contract.connect(attacker).updateOracle(attacker.address)
      ).to.be.reverted;
    });
  });
});
```

Run tests:

```bash
npx hardhat test test/CrossChainReceiver.test.ts
```

---

### ✅ Phase 2 Complete - Checklist

- [ ] Receiver contract created
- [ ] Deployed to Sepolia testnet
- [ ] Deployed to Base Sepolia
- [ ] All tests passing
- [ ] Contract addresses saved

**Deployment addresses saved in:**
- `contracts/deployments/crosschain-sepolia.json`
- `contracts/deployments/crosschain-baseSepolia.json`

---

## Phase 3: Register with Moca Oracle (30 mins)

**Goal:** Get Moca team to relay your events

**What You'll Do:**
- Contact Moca team
- Provide contract details
- Configure relay routes
- Verify registration

---

### Step 3.1: Prepare Registration Information

Create a document with all the info Moca team needs:

```markdown
# Credo Protocol - Cross-Chain Oracle Registration Request

## Project Details
- **Project:** Credo Protocol
- **Description:** Credit scoring protocol with cross-chain score relay
- **Website:** https://credo-protocol.vercel.app
- **GitHub:** https://github.com/yourusername/Credo-Protocol

## Source Chain (Moca Devnet)
- **Chain ID:** 5151
- **Contract Address:** 0x12ad1aBfBde99Ce4D37fB18A5e622A619d59f705
- **Event Name:** CrossChainScoreUpdate
- **Event Signature:** 
  ```
  CrossChainScoreUpdate(
    address indexed user,
    uint256 score,
    uint256 timestamp,
    uint256 targetChainId,
    bytes32 indexed messageId
  )
  ```

## Target Chains

### Sepolia
- **Chain ID:** 11155111
- **Contract Address:** 0x... (from deployment)
- **Method:** submitCreditScore(address,uint256,uint256,bytes32)

### Base Sepolia
- **Chain ID:** 84532
- **Contract Address:** 0x... (from deployment)
- **Method:** submitCreditScore(address,uint256,uint256,bytes32)

## Relay Configuration Needed
```json
{
  "source": {
    "chainId": 5151,
    "contract": "0x12ad1aBfBde99Ce4D37fB18A5e622A619d59f705",
    "event": "CrossChainScoreUpdate"
  },
  "targets": [
    {
      "chainId": 11155111,
      "contract": "0x...",
      "method": "submitCreditScore",
      "params": ["user", "score", "mocaChainTimestamp", "messageId"]
    },
    {
      "chainId": 84532,
      "contract": "0x...",
      "method": "submitCreditScore",
      "params": ["user", "score", "mocaChainTimestamp", "messageId"]
    }
  ]
}
```

## Contact
- **Name:** Your Name
- **Email:** your@email.com
- **Telegram:** @yourusername
- **Discord:** username#1234
```

---

### Step 3.2: Contact Moca Team

**Where to Reach Them:**
1. **Discord:** https://discord.gg/mocaversenft
   - Go to #dev-chat channel
   - Tag moderators
   - Share your registration doc

2. **Telegram:** https://t.me/MocaverseCommunity/1
   - Ask for oracle team contact

3. **Email:** developers@moca.network
   - Send registration request

**What to Ask For:**
- Official oracle addresses for each chain
- Timeline for registration
- Testing process
- Any fees (likely none for buildathon)

---

### Step 3.3: Update Oracle Addresses

Once Moca provides oracle addresses, update your receiver contracts:

```bash
# On each chain
npx hardhat console --network sepolia

> const CrossChain = await ethers.getContractFactory('CrossChainCreditScore')
> const contract = await CrossChain.attach('YOUR_CONTRACT_ADDRESS')
> await contract.updateOracle('MOCA_PROVIDED_ORACLE_ADDRESS')
```

---

### Step 3.4: Verify Registration

Ask Moca team to confirm:
- [ ] Events are being picked up by Listener
- [ ] BLS signatures are being collected
- [ ] Test relay was successful

---

### ✅ Phase 3 Complete - Checklist

- [ ] Contact information sent to Moca team
- [ ] Oracle addresses received
- [ ] Contracts updated with official addresses
- [ ] Registration confirmed by Moca

**Note:** This phase depends on Moca team response time. For buildathon, you can proceed with UI implementation while waiting.

---

## Phase 4: Frontend Integration (2 hours)

**Goal:** Add UI for users to trigger cross-chain relay

**What You'll Do:**
- Create relay service
- Build UI component
- Test relay flow
- Add status tracking

---

### Step 4.1: Create Cross-Chain Service

Create `lib/crossChainService.js`:

```javascript
/**
 * Cross-Chain Service
 * Handles credit score relay to other blockchains via Moca Identity Oracle
 */

import { ethers } from 'ethers';

// Contract addresses (from deployments)
const RECEIVER_CONTRACTS = {
  sepolia: process.env.NEXT_PUBLIC_SEPOLIA_RECEIVER || '',
  baseSepolia: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RECEIVER || '',
};

// RPC endpoints
const RPC_URLS = {
  sepolia: process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo',
  baseSepolia: 'https://sepolia.base.org',
};

// Chain IDs
const CHAIN_IDS = {
  sepolia: 11155111,
  baseSepolia: 84532,
};

/**
 * Request cross-chain relay of credit score
 * 
 * @param {string} targetChain - Target chain name ('sepolia' or 'baseSepolia')
 * @param {Object} signer - Ethers signer (from AIR Kit)
 * @param {string} oracleAddress - CreditScoreOracle contract address
 * @returns {Promise<Object>} Relay result
 */
export async function relayCreditScore(targetChain, signer, oracleAddress) {
  try {
    console.log(`🌉 Initiating cross-chain relay to ${targetChain}...`);

    const chainId = CHAIN_IDS[targetChain];
    if (!chainId) {
      throw new Error(`Unsupported chain: ${targetChain}`);
    }

    // Get oracle contract
    const oracleABI = [
      'function requestCrossChainRelay(uint256 targetChainId) external',
      'event CrossChainScoreUpdate(address indexed user, uint256 score, uint256 timestamp, uint256 targetChainId, bytes32 indexed messageId)'
    ];
    
    const oracle = new ethers.Contract(oracleAddress, oracleABI, signer);

    // Request relay
    console.log('  Sending transaction...');
    const tx = await oracle.requestCrossChainRelay(chainId);
    console.log('  Transaction hash:', tx.hash);

    // Wait for confirmation
    console.log('  Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('  ✅ Transaction confirmed in block:', receipt.blockNumber);

    // Extract event data
    const event = receipt.logs
      .map(log => {
        try {
          return oracle.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e?.name === 'CrossChainScoreUpdate');

    if (!event) {
      throw new Error('CrossChainScoreUpdate event not found');
    }

    const { user, score, timestamp, messageId } = event.args;

    console.log('✅ Cross-chain relay initiated successfully');
    console.log('   User:', user);
    console.log('   Score:', score.toString());
    console.log('   Message ID:', messageId);
    console.log('   Target:', targetChain);
    console.log('\n⏳ Oracle will relay within ~2 minutes');

    return {
      success: true,
      txHash: tx.hash,
      messageId,
      user,
      score: Number(score),
      timestamp: Number(timestamp),
      targetChain,
      targetChainId: chainId
    };

  } catch (error) {
    console.error('❌ Cross-chain relay failed:', error);
    throw error;
  }
}

/**
 * Check if credit score exists on target chain
 * 
 * @param {string} userAddress - User's wallet address
 * @param {string} targetChain - Target chain name
 * @returns {Promise<Object>} Credit score info
 */
export async function getCreditScoreOnChain(userAddress, targetChain) {
  try {
    const contractAddress = RECEIVER_CONTRACTS[targetChain];
    const rpcUrl = RPC_URLS[targetChain];

    if (!contractAddress || !rpcUrl) {
      throw new Error(`Chain not configured: ${targetChain}`);
    }

    // Connect to target chain
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const contractABI = [
      'function getCreditScore(address user) external view returns (uint256 score, uint256 lastUpdated, bool verified)'
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // Get credit score
    const [score, lastUpdated, verified] = await contract.getCreditScore(userAddress);

    return {
      chain: targetChain,
      score: Number(score),
      lastUpdated: Number(lastUpdated),
      verified,
      hasScore: verified && Number(score) > 0
    };

  } catch (error) {
    console.error(`Failed to get score on ${targetChain}:`, error);
    return {
      chain: targetChain,
      score: 0,
      verified: false,
      hasScore: false,
      error: error.message
    };
  }
}

/**
 * Get credit scores on all supported chains
 * 
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<Array>} Credit scores on all chains
 */
export async function getAllChainScores(userAddress) {
  const chains = Object.keys(CHAIN_IDS);
  
  const results = await Promise.all(
    chains.map(chain => getCreditScoreOnChain(userAddress, chain))
  );

  return results;
}

export default {
  relayCreditScore,
  getCreditScoreOnChain,
  getAllChainScores
};
```

---

### Step 4.2: Update Environment Variables

Add to `.env.local`:

```bash
# Cross-Chain Receiver Contracts
NEXT_PUBLIC_SEPOLIA_RECEIVER=0x...  # From Phase 2 deployment
NEXT_PUBLIC_BASE_SEPOLIA_RECEIVER=0x...  # From Phase 2 deployment

# RPC Endpoints (optional - defaults provided)
NEXT_PUBLIC_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

---

### Step 4.3: Create Cross-Chain Bridge Component

Create `components/CrossChainBridge.jsx`:

```jsx
/**
 * Cross-Chain Bridge Component
 * Allows users to relay their credit scores to other blockchains
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  ExternalLink 
} from 'lucide-react';
import { 
  relayCreditScore, 
  getAllChainScores 
} from '@/lib/crossChainService';
import { useAirKit } from '@/hooks/useAirKit';

// Supported chains
const CHAINS = [
  {
    id: 'sepolia',
    name: 'Ethereum Sepolia',
    icon: '⟠',
    color: 'blue',
    explorer: 'https://sepolia.etherscan.io'
  },
  {
    id: 'baseSepolia',
    name: 'Base Sepolia',
    icon: '🔵',
    color: 'indigo',
    explorer: 'https://sepolia.basescan.org'
  }
];

export default function CrossChainBridge({ userAddress, currentScore }) {
  const [chainScores, setChainScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relaying, setRelaying] = useState(null);
  const [error, setError] = useState(null);
  const [recentRelay, setRecentRelay] = useState(null);
  const { signer } = useAirKit();

  // Load scores from all chains
  useEffect(() => {
    if (userAddress) {
      loadChainScores();
    }
  }, [userAddress]);

  const loadChainScores = async () => {
    try {
      setLoading(true);
      setError(null);
      const scores = await getAllChainScores(userAddress);
      setChainScores(scores);
    } catch (err) {
      console.error('Failed to load chain scores:', err);
      setError('Failed to load chain scores');
    } finally {
      setLoading(false);
    }
  };

  const handleRelay = async (chainId) => {
    try {
      setRelaying(chainId);
      setError(null);

      const result = await relayCreditScore(
        chainId,
        signer,
        process.env.NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS
      );

      setRecentRelay(result);

      // Refresh chain scores after a delay (oracle needs time)
      setTimeout(() => {
        loadChainScores();
        setRelaying(null);
      }, 5000);

    } catch (err) {
      console.error('Relay failed:', err);
      setError(err.message || 'Relay failed');
      setRelaying(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold mb-1">
            Cross-Chain Credit Score
          </h3>
          <p className="text-sm text-gray-600">
            Relay your Moca credit score to other blockchains for broader DeFi access
          </p>
        </div>

        {/* Current Score on Moca */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Moca Chain Score</p>
              <p className="text-3xl font-bold text-blue-600">{currentScore}</p>
            </div>
            <div className="text-4xl">⛓️</div>
          </div>
        </div>

        {/* Recent Relay Success */}
        {recentRelay && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 mb-1">
                  Relay Initiated Successfully!
                </p>
                <p className="text-xs text-green-700 mb-2">
                  Message ID: {recentRelay.messageId.slice(0, 20)}...
                </p>
                <p className="text-xs text-green-600">
                  ⏳ Oracle will process within 2 minutes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Target Chains */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Available on:</p>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            CHAINS.map((chain) => {
              const chainScore = chainScores.find(s => s.chain === chain.id);
              const hasScore = chainScore?.hasScore;
              const isRelaying = relaying === chain.id;

              return (
                <div
                  key={chain.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  {/* Chain Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{chain.icon}</div>
                    <div className="flex-1">
                      <p className="font-medium">{chain.name}</p>
                      {hasScore ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="success" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Score: {chainScore.score}
                          </Badge>
                          {chainScore.lastUpdated > 0 && (
                            <span className="text-xs text-gray-500">
                              {new Date(chainScore.lastUpdated * 1000).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">
                          Not relayed yet
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2">
                    {hasScore && (
                      <a
                        href={`${chain.explorer}/address/${userAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <Button
                      onClick={() => handleRelay(chain.id)}
                      disabled={isRelaying || !signer}
                      variant={hasScore ? 'outline' : 'default'}
                      size="sm"
                    >
                      {isRelaying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Relaying...
                        </>
                      ) : hasScore ? (
                        <>
                          Update
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Relay Score
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-2">
              <p className="font-medium">How it works:</p>
              <ul className="space-y-1 text-xs">
                <li>• Click "Relay Score" to emit event on Moca Chain</li>
                <li>• Moca Identity Oracle picks up your event</li>
                <li>• Validators sign with BLS signatures (&gt;2/3 consensus)</li>
                <li>• Oracle submits to target chain (~2 minutes)</li>
                <li>• Your score is now usable on that chain!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

### Step 4.4: Integrate into Score Page

Update `pages/score.js`:

```javascript
// Add import
import CrossChainBridge from '@/components/CrossChainBridge';

// Inside component, after credit score display
{creditScore > 0 && (
  <div className="mt-6">
    <CrossChainBridge
      userAddress={userAddress}
      currentScore={creditScore}
    />
  </div>
)}
```

---

### Step 4.5: Test Full Flow

**Manual Testing Steps:**

1. **Start Application:**
```bash
npm run dev
```

2. **Navigate to Score Page:**
- Login with AIR Kit
- Build credit score (if not already done)
- View score page

3. **Test Relay:**
- Click "Relay Score" for Sepolia
- Approve transaction in wallet
- Wait for confirmation
- See success message

4. **Verify on Target Chain:**
- Wait 2-3 minutes
- Refresh page
- Should see "Score: XXX" badge
- Click external link to view on block explorer

---

### ✅ Phase 4 Complete - Checklist

- [ ] Cross-chain service created
- [ ] Environment variables configured
- [ ] Bridge component implemented
- [ ] Integrated into score page
- [ ] Manual testing completed
- [ ] Relay successful

---

## Phase 5: Testing & Documentation (30 mins)

**Goal:** Document and verify everything works

---

### Step 5.1: Create Test Checklist

Create `documents/wave 3/CROSSCHAIN-TEST-CHECKLIST.md`:

```markdown
# Cross-Chain Oracle Testing Checklist

## Pre-Test Setup
- [ ] Contracts deployed on Moca Devnet
- [ ] Contracts deployed on Sepolia
- [ ] Contracts deployed on Base Sepolia
- [ ] Oracle addresses configured
- [ ] Moca team registration complete
- [ ] Frontend environment variables set

## Moca Chain Tests
- [ ] Event emits successfully
- [ ] Message ID is unique
- [ ] Transaction confirms
- [ ] Gas cost reasonable

## Target Chain Tests (Sepolia)
- [ ] Score received within 3 minutes
- [ ] Score matches Moca Chain
- [ ] Timestamp recorded correctly
- [ ] No duplicate submissions

## Target Chain Tests (Base)
- [ ] Score received within 3 minutes
- [ ] Score matches Moca Chain
- [ ] Timestamp recorded correctly
- [ ] Explorer link works

## Frontend Tests
- [ ] Relay button enabled when logged in
- [ ] Loading state shows during relay
- [ ] Success message displays
- [ ] Error handling works
- [ ] Chain scores refresh
- [ ] External links work

## Edge Cases
- [ ] Relay with no score fails gracefully
- [ ] Relay to unsupported chain rejected
- [ ] Multiple relays don't duplicate
- [ ] Oracle downtime handled

## Documentation
- [ ] README updated with cross-chain feature
- [ ] Deployment addresses documented
- [ ] Oracle contact info saved
- [ ] User guide created
```

---

### Step 5.2: Update README

Add to your `README.md`:

```markdown
## 🌉 Cross-Chain Features (NEW!)

Credo credit scores are now available on multiple blockchains via Moca Identity Oracle:

### Supported Chains
- **Ethereum Sepolia** - Use your score on Ethereum DeFi
- **Base Sepolia** - Access Base ecosystem with your credit
- **Polygon Amoy** - (Coming soon)

### How It Works
1. Build your credit score on Moca Chain
2. Click "Relay Score" on any supported chain
3. Moca Oracle automatically relays within 2 minutes
4. Your score is now usable on that chain!

### Use Cases
- Borrow on Aave using Moca credit
- Get better rates on Compound
- Access gated DAOs on Ethereum
- Participate in Base DeFi with your reputation

### Technical Details
- **Oracle:** Moca Identity Oracle (BLS signatures)
- **Finality:** ~2 minutes average
- **Cost:** Free (oracle pays gas on destination)
- **Security:** Decentralized validator network (>2/3 consensus)
```

---

### Step 5.3: Create User Guide

Create `documents/wave 3/CROSSCHAIN-USER-GUIDE.md`:

```markdown
# Cross-Chain Credit Score - User Guide

## What is Cross-Chain Relay?

Your Credo credit score lives on Moca Chain. To use it on Ethereum, Base, or Polygon, you need to "relay" it using Moca's Identity Oracle.

## Step-by-Step Guide

### Step 1: Build Your Credit Score
1. Login to Credo Protocol
2. Navigate to "Build Credit Score"
3. Request credentials (Income, Bank Balance, etc.)
4. Submit credentials to smart contract
5. Your score is calculated (visible on Score page)

### Step 2: Relay to Another Chain
1. On the Score page, find "Cross-Chain Credit Score" section
2. Choose which chain you want your score on:
   - Ethereum Sepolia (for Ethereum DeFi)
   - Base Sepolia (for Base DeFi)
3. Click "Relay Score"
4. Approve transaction in your wallet
5. Wait for confirmation (~10 seconds on Moca Chain)

### Step 3: Wait for Oracle
1. After transaction confirms, you'll see success message
2. Message ID is displayed for tracking
3. Moca Oracle needs ~2 minutes to:
   - Collect validator signatures (BLS aggregation)
   - Submit to destination chain
4. Refresh page to see updated status

### Step 4: Verify on Destination Chain
1. Once relayed, you'll see green badge: "Score: XXX"
2. Click external link icon to view on block explorer
3. Your score is now on that chain!

## FAQ

**Q: How much does it cost?**  
A: Only Moca Chain gas (~0.0001 MOCA). Oracle pays gas on destination chain.

**Q: How long does it take?**  
A: ~2 minutes average. Sometimes up to 5 minutes during high load.

**Q: Can I relay to multiple chains?**  
A: Yes! Relay to each chain separately.

**Q: Do I need to relay again if my score changes?**  
A: Yes. Click "Update" to relay new score.

**Q: What if relay fails?**  
A: Check transaction on Moca Explorer. Contact support if oracle doesn't relay within 10 minutes.

**Q: Is my score private?**  
A: Score value is public on all chains. But the credentials used to build it are private (zero-knowledge proofs).

## Troubleshooting

**"Transaction Failed"**
- Check you have MOCA for gas
- Check you have a credit score > 0
- Try again in 30 seconds

**"Relay Taking Too Long"**
- Normal: up to 5 minutes
- If >10 minutes: Contact Moca team on Discord

**"Score Doesn't Match"**
- This is a bug - report immediately
- Oracle should relay exact score from Moca Chain

## Support

- **Discord:** https://discord.gg/mocaversenft (tag @MocaSupport)
- **Docs:** https://docs.moca.network/mocachain/technical-details/identity-oracle
- **Credo Help:** your@email.com
```

---

### ✅ Phase 5 Complete - Checklist

- [ ] Test checklist created
- [ ] All tests passing
- [ ] README updated
- [ ] User guide written
- [ ] Documentation complete

---

## Final Deliverables Checklist

### Contracts
- [ ] Updated CreditScoreOracle with cross-chain event
- [ ] CrossChainCreditScore deployed on Sepolia
- [ ] CrossChainCreditScore deployed on Base
- [ ] All tests passing (100%)

### Integration
- [ ] Registered with Moca Oracle team
- [ ] Oracle addresses configured
- [ ] Relay successfully tested

### Frontend
- [ ] Cross-chain service implemented
- [ ] Bridge component created
- [ ] Integrated into score page
- [ ] Loading/error states handled

### Documentation
- [ ] README updated
- [ ] User guide created
- [ ] Test checklist completed
- [ ] Deployment addresses saved

### Testing
- [ ] Event emission verified
- [ ] Cross-chain relay confirmed
- [ ] Score matches on both chains
- [ ] UI/UX polished

---

## Buildathon Presentation Tips

**How to Demo This Feature:**

1. **Show Problem (10 seconds):**
   "DeFi is fragmented across chains. Your Ethereum credit doesn't work on Base."

2. **Show Solution (20 seconds):**
   "Credo uses Moca Identity Oracle. Build credit once, use everywhere."

3. **Live Demo (30 seconds):**
   - Show score on Moca Chain: "862"
   - Click "Relay Score" to Ethereum
   - Show transaction confirm
   - (Skip 2min wait - show pre-recorded or prepared result)
   - Show score on Ethereum: "862" ✓

4. **Impact Statement (10 seconds):**
   "Now users can borrow on Aave, Compound, or any DeFi protocol using Moca credit scores. Infrastructure, not just a protocol."

---

## Troubleshooting

### Common Issues

**1. "Oracle address not set"**
- You haven't heard back from Moca team
- Use deployer address as placeholder
- Update later with updateOracle()

**2. "Event not being relayed"**
- Check Moca team registered your contract
- Verify event signature matches exactly
- Check target chain ID is supported

**3. "Transaction reverts on Moca Chain"**
- User has no credit score
- Unsupported target chain ID
- Out of gas

**4. "Score doesn't appear on destination"**
- Wait longer (up to 5 minutes)
- Check oracle is running (ask Moca team)
- Verify transaction confirmed on Moca Chain

---

## Success Metrics

**You'll know it's working when:**
- ✅ Transaction succeeds on Moca Chain
- ✅ Event appears in transaction logs
- ✅ Score appears on destination within 5 minutes
- ✅ Score matches Moca Chain exactly
- ✅ No error messages in frontend

---

## Next Steps After Implementation

**For Production:**
1. Deploy to mainnets (Ethereum, Base, Polygon)
2. Get mainnet oracle addresses from Moca
3. Implement retry logic for failed relays
4. Add webhook for relay status updates
5. Monitor oracle uptime
6. Create fallback if oracle down

**For Buildathon:**
1. Polish UI animations
2. Add relay history table
3. Show pending relays
4. Add "Verify on Explorer" links
5. Create demo video

---

## Congratulations! 🎉

You've successfully implemented cross-chain credit score relay using Moca Identity Oracle!

**What You Built:**
- Multi-chain credit infrastructure
- Real oracle integration (not fake)
- Professional UI for relay
- Complete documentation

**Why This Matters:**
- Shows you understand cross-chain architecture
- Demonstrates deep Moca integration
- Proves infrastructure value proposition
- Perfect buildathon showcase feature

**Next:** Record killer demo video showing relay in action! 🎥

