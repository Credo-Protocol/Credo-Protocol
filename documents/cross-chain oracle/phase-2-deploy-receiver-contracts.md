# Phase 2: Deploy Receiver Contracts

**Duration:** ~2 hours  
**Difficulty:** Intermediate  
**Prerequisites:** Phase 1 completed, testnet ETH/tokens for deployment

---

## Overview

**Goal:** Deploy contracts on Ethereum Sepolia and Base Sepolia that can receive credit scores from Moca Chain via the Identity Oracle.

**What You'll Build:**
- Receiver smart contract for target chains
- Multi-chain Hardhat configuration
- Deployment scripts
- Comprehensive test suite

**Why This Matters:**
These receiver contracts store the credit scores on destination chains, making them queryable by any DeFi protocol, DAO, or dApp on those networks.

---

## Step 2.1: Create Receiver Contract

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
- Oracle-only write access (security)
- Duplicate prevention via messageId
- User tracking for leaderboards
- Integration-friendly view functions
- Transparent event logging

---

## Step 2.2: Configure Hardhat for Multi-Chain

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
# Existing
PRIVATE_KEY=your_private_key

# Add these for Phase 2
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

**Get API Keys:**
- Alchemy: https://www.alchemy.com/
- Etherscan: https://etherscan.io/apis
- Basescan: https://basescan.org/apis

---

## Step 2.3: Create Deployment Script

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

---

## Step 2.4: Deploy to Testnets

### Get Testnet Funds

**Sepolia ETH:**
- https://sepoliafaucet.com/
- https://faucet.quicknode.com/ethereum/sepolia

**Base Sepolia ETH:**
- Bridge from Sepolia: https://bridge.base.org/
- Or use: https://www.alchemy.com/faucets/base-sepolia

### Deploy to Sepolia

```bash
cd contracts
npx hardhat run scripts/deploy-crosschain-receiver.ts --network sepolia
```

**Expected Output:**
```
🚀 Deploying CrossChainCreditScore to sepolia...

Deployer: 0x...
Balance: 0.1 ETH

⚠️  Oracle address not configured for sepolia
   Using deployer address as placeholder
   Contact Moca team for official oracle address

✅ CrossChainCreditScore deployed to: 0x...

📝 Deployment saved to: deployments/crosschain-sepolia.json

⏳ Waiting for block confirmations...

✅ Deployment complete!
```

### Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy-crosschain-receiver.ts --network baseSepolia
```

---

## Step 2.5: Test Receiver Contract

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

**Run Tests:**

```bash
npx hardhat test test/CrossChainReceiver.test.ts
```

**Expected Output:**
```
CrossChainCreditScore
  Deployment
    ✔ should set oracle address
    ✔ should set correct source chain ID
  Score Submission
    ✔ should allow oracle to submit score
    ✔ should reject non-oracle submissions
    ✔ should reject duplicate message IDs
    ✔ should reject invalid scores
  Score Retrieval
    ✔ should return zero for users without scores
    ✔ should track users with scores
  Oracle Management
    ✔ should allow owner to update oracle
    ✔ should reject non-owner oracle updates

10 passing (3s)
```

---

## Verification Checklist

Before proceeding to Phase 3:

- [ ] Receiver contract created
- [ ] Multi-chain Hardhat config complete
- [ ] Testnet funds acquired (Sepolia + Base)
- [ ] Deployed to Sepolia testnet
- [ ] Deployed to Base Sepolia
- [ ] All tests passing (10/10)
- [ ] Contract addresses saved to deployments/
- [ ] Deployment info documented

---

## Deployment Addresses

Save these for Phase 3 registration:

**Sepolia:**
- Contract: `deployments/crosschain-sepolia.json`
- Explorer: https://sepolia.etherscan.io/address/YOUR_ADDRESS

**Base Sepolia:**
- Contract: `deployments/crosschain-baseSepolia.json`
- Explorer: https://sepolia.basescan.org/address/YOUR_ADDRESS

---

## Troubleshooting

### "Insufficient funds for deployment"
- Get more testnet ETH from faucets
- Check gas price isn't too high
- Wait and try again during low congestion

### "Contract deployment timeout"
- Increase timeout in hardhat.config
- Check RPC endpoint is responding
- Try different RPC provider

### "Nonce too high"
- Reset account nonce
- Check for pending transactions
- Use `--reset` flag

### "Contract verification failed"
- Wait a few minutes after deployment
- Ensure API keys are correct
- Check constructor arguments match

---

## Next Steps

Once all checklist items complete:

1. **Document deployment addresses**
2. **Prepare registration info for Moca team**
3. **Proceed to Phase 3** - Register with Moca Oracle

---

**Phase 2 Complete!** 🎉

You now have receiver contracts deployed on Sepolia and Base that can accept credit scores from Moca's Identity Oracle.

**Next:** [Phase 3 - Register with Moca Oracle](./phase-3-register-with-moca-oracle.md)

