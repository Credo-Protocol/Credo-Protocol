# Phase 1: Update Moca Chain Contract

**Duration:** ~1 hour  
**Difficulty:** Intermediate  
**Prerequisites:** Existing CreditScoreOracle deployed on Moca Chain

---

## Overview

**Goal:** Add cross-chain event emission capability to your existing CreditScoreOracle contract on Moca Chain.

**What You'll Build:**
- Cross-chain event definition
- Relay request function
- Event emission logic
- Comprehensive tests

**Why This Matters:**
This phase creates the foundation for cross-chain credit score relay. The events you emit here will be picked up by Moca's Identity Oracle and relayed to destination chains.

---

## Step 1.1: Add Cross-Chain Event

Update `contracts/contracts/CreditScoreOracle.sol` to include the cross-chain event:

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

**Event Parameters Explained:**
- `user` (indexed): User's wallet address whose score is being relayed
- `score`: The credit score value (0-1000)
- `timestamp`: When the score was calculated on Moca Chain
- `targetChainId`: Destination chain ID (Sepolia, Base, etc.)
- `messageId` (indexed): Unique identifier to prevent duplicate relays

**Why This Format:**
- Indexed fields enable efficient filtering by oracle
- `messageId` prevents replay attacks
- Standard uint256 types for EVM compatibility

---

## Step 1.2: Add Relay Request Function

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

**Function Flow:**
1. Fetch user's current credit score
2. Validate user has a score to relay
3. Validate target chain is supported
4. Generate unique message ID
5. Emit event for oracle to pick up

**Gas Efficiency:**
- Single storage read (getUserScore)
- Minimal computation
- No external calls
- Event emission only

---

## Step 1.3: Deploy Updated Contract

Create deployment script: `contracts/scripts/upgrade-oracle-crosschain.ts`

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

**Run Deployment:**

```bash
cd contracts
npx hardhat run scripts/upgrade-oracle-crosschain.ts --network mocaDevnet
```

**Post-Deployment Steps:**
1. Save new contract address
2. Update environment variables
3. Re-register credential issuers (if fresh deployment)
4. Update frontend configuration

---

## Step 1.4: Test Event Emission

Create comprehensive test suite: `contracts/test/CrossChainRelay.test.ts`

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
    const [, newUser] = await ethers.getSigners();
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

**Run Tests:**

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

## Verification Checklist

Before proceeding to Phase 2, verify:

- [ ] Cross-chain event added to contract
- [ ] Relay request function implemented
- [ ] Function validates user has credit score
- [ ] Function validates target chain ID
- [ ] Unique message ID generation works
- [ ] Contract deployed to Moca Devnet
- [ ] All tests passing (4/4)
- [ ] Event emission verified
- [ ] New contract address saved
- [ ] Environment variables updated

---

## Troubleshooting

### "getUserScore function not found"
- Ensure your existing contract has this function
- May need to rename to match your implementation
- Check function visibility (should be public or external)

### "Event not emitting"
- Check transaction receipt in tests
- Verify event signature matches exactly
- Use hardhat console.log for debugging

### "Deployment fails"
- Check you have MOCA for gas
- Verify network configuration in hardhat.config
- Ensure RPC endpoint is correct

### "Tests timeout"
- Increase timeout in hardhat.config
- Check RPC connection
- Try running tests individually

---

## Cost Analysis

**Gas Costs (Moca Devnet):**
- Deploy contract: ~2,000,000 gas
- Request relay: ~50,000 gas per call
- Estimated cost per relay: ~0.0001 MOCA

**User Perspective:**
- Users only pay gas on Moca Chain
- Oracle pays gas on destination chains
- Very cost-effective for users

---

## Next Steps

Once all checklist items are complete:

1. **Save contract address** to documentation
2. **Update .env files** with new address
3. **Test manually** using Hardhat console
4. **Proceed to Phase 2** - Deploy Receiver Contracts

---

## Additional Resources

- [Moca Identity Oracle Docs](https://docs.moca.network/mocachain/technical-details/identity-oracle)
- [Hardhat Testing Guide](https://hardhat.org/tutorial/testing-contracts)
- [Solidity Events Documentation](https://docs.soliditylang.org/en/latest/contracts.html#events)

---

**Phase 1 Complete!** 🎉

You now have a Moca Chain contract that can emit cross-chain relay events. The Identity Oracle will monitor these events and relay your credit scores to other chains.

**Next:** [Phase 2 - Deploy Receiver Contracts](./phase-2-deploy-receiver-contracts.md)

