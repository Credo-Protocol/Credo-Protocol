# Phase 3: Register with Moca Oracle

**Duration:** ~30 minutes (+ Moca team response time)  
**Difficulty:** Easy  
**Prerequisites:** Phase 1 & 2 completed, deployment addresses documented

---

## Overview

**Goal:** Register your contracts with the Moca team so the Identity Oracle knows to relay your events.

**What You'll Do:**
- Prepare comprehensive registration documentation
- Contact Moca team through official channels
- Provide all necessary technical details
- Update oracle addresses once received
- Verify registration is successful

**Why This Matters:**
The Moca Identity Oracle must be configured to monitor your specific contract and events. This phase establishes the connection between your Moca Chain contract and the destination chain receivers.

---

## Step 3.1: Prepare Registration Information

Create a comprehensive registration document with all information the Moca team needs.

### Registration Document Template

Create `documents/cross-chain oracle/moca-oracle-registration.md`:

```markdown
# Credo Protocol - Cross-Chain Oracle Registration Request

## Project Information

**Project Name:** Credo Protocol  
**Description:** Decentralized credit scoring protocol with cross-chain score relay  
**Website:** https://credo-protocol.vercel.app  
**GitHub:** https://github.com/yourusername/Credo-Protocol  
**Contact Person:** [Your Name]  
**Email:** [your@email.com]  
**Telegram:** [@yourusername]  
**Discord:** [username#1234]

---

## Source Chain Configuration

**Network:** Moca Devnet  
**Chain ID:** 5151  
**Contract Address:** 0x12ad1aBfBde99Ce4D37fB18A5e622A619d59f705  
**Contract Name:** CreditScoreOracle  
**Deployed:** [Date]  
**Explorer:** https://explorer.devnet.mocachain.org/address/0x12ad1aBfBde99Ce4D37fB18A5e622A619d59f705

### Event to Monitor

**Event Name:** `CrossChainScoreUpdate`

**Event Signature:**
```solidity
event CrossChainScoreUpdate(
    address indexed user,
    uint256 score,
    uint256 timestamp,
    uint256 targetChainId,
    bytes32 indexed messageId
);
```

**Event Topic Hash:**
```
0x[calculated_event_topic_hash]
```

**Emission Trigger:** User calls `requestCrossChainRelay(uint256 targetChainId)`

---

## Target Chain Configurations

### 1. Ethereum Sepolia

**Network:** Sepolia Testnet  
**Chain ID:** 11155111  
**Contract Address:** [FROM_PHASE_2_DEPLOYMENT]  
**Contract Name:** CrossChainCreditScore  
**Deployed:** [Date]  
**Explorer:** https://sepolia.etherscan.io/address/[CONTRACT_ADDRESS]

**Method to Call:** `submitCreditScore(address,uint256,uint256,bytes32)`

**Method Signature:**
```solidity
function submitCreditScore(
    address user,
    uint256 score,
    uint256 mocaChainTimestamp,
    bytes32 messageId
) external
```

**Parameter Mapping:**
- `user` → event.user
- `score` → event.score
- `mocaChainTimestamp` → event.timestamp
- `messageId` → event.messageId

---

### 2. Base Sepolia

**Network:** Base Sepolia Testnet  
**Chain ID:** 84532  
**Contract Address:** [FROM_PHASE_2_DEPLOYMENT]  
**Contract Name:** CrossChainCreditScore  
**Deployed:** [Date]  
**Explorer:** https://sepolia.basescan.org/address/[CONTRACT_ADDRESS]

**Method to Call:** `submitCreditScore(address,uint256,uint256,bytes32)`

**Method Signature:**
```solidity
function submitCreditScore(
    address user,
    uint256 score,
    uint256 mocaChainTimestamp,
    bytes32 messageId
) external
```

**Parameter Mapping:**
- `user` → event.user
- `score` → event.score
- `mocaChainTimestamp` → event.timestamp
- `messageId` → event.messageId

---

## Relay Configuration (JSON Format)

```json
{
  "project": "Credo Protocol",
  "source": {
    "chainId": 5151,
    "network": "Moca Devnet",
    "contract": "0x12ad1aBfBde99Ce4D37fB18A5e622A619d59f705",
    "eventName": "CrossChainScoreUpdate",
    "eventSignature": "CrossChainScoreUpdate(address,uint256,uint256,uint256,bytes32)"
  },
  "targets": [
    {
      "chainId": 11155111,
      "network": "Sepolia",
      "contract": "[FROM_DEPLOYMENT]",
      "method": "submitCreditScore",
      "methodSignature": "submitCreditScore(address,uint256,uint256,bytes32)",
      "parameterMapping": {
        "user": "event.user",
        "score": "event.score",
        "mocaChainTimestamp": "event.timestamp",
        "messageId": "event.messageId"
      }
    },
    {
      "chainId": 84532,
      "network": "Base Sepolia",
      "contract": "[FROM_DEPLOYMENT]",
      "method": "submitCreditScore",
      "methodSignature": "submitCreditScore(address,uint256,uint256,bytes32)",
      "parameterMapping": {
        "user": "event.user",
        "score": "event.score",
        "mocaChainTimestamp": "event.timestamp",
        "messageId": "event.messageId"
      }
    }
  ]
}
```

---

## Additional Information

### Use Case
Credit scoring protocol that allows users to build credit scores on Moca Chain using verifiable credentials, then relay those scores to other chains for use in DeFi protocols, DAOs, and gated applications.

### Expected Volume
- Initial: ~10-50 relay requests per day
- Growth: ~100-500 relay requests per day
- Peak: ~1000 relay requests per day

### Security Measures
- Duplicate message ID prevention
- Score validation (0-1000 range)
- Oracle-only write access on receivers
- Event-based auditing

### Support Timeline
- Immediate need for buildathon demo (Week of [DATE])
- Production launch planned for [DATE]

---

## Questions for Moca Team

1. What are the official Identity Oracle addresses for:
   - Sepolia testnet
   - Base Sepolia testnet
   - Polygon Amoy testnet

2. What is the expected relay latency?
   - Average time from event emission to destination tx

3. Is there a registration fee or ongoing cost?

4. How do we monitor relay status?
   - Dashboard/API for tracking

5. What is the SLA for oracle uptime?

6. How do we handle oracle downtime?
   - Fallback mechanisms recommended

7. Are there rate limits we should be aware of?

8. Is there a testnet vs mainnet registration process difference?

---

## Testing Plan

Once registered, we will:
1. Emit test event on Moca Chain
2. Monitor for relay on Sepolia (expect ~2 min)
3. Verify score matches on both chains
4. Test duplicate prevention
5. Test with multiple users
6. Load test with batch relays

---

## Contact Preference

**Primary:** Discord (@username in #dev-chat)  
**Secondary:** Email (your@email.com)  
**Urgent:** Telegram (@yourusername)

**Timezone:** [Your Timezone]  
**Available:** [Your Available Hours]

---

**Submitted:** [Date]  
**Status:** Pending Moca Team Response
```

---

## Step 3.2: Contact Moca Team

### Official Communication Channels

**1. Discord (Recommended)**
- Server: https://discord.gg/mocaversenft
- Channel: `#dev-chat` or `#buildathon-support`
- Action:
  1. Join server
  2. Go to appropriate channel
  3. Post brief message with link to registration doc
  4. Tag relevant moderators/team members

**Example Discord Message:**
```
Hey Moca team! 👋

I'm building Credo Protocol for the buildathon - a cross-chain credit scoring 
system using Moca's Identity Oracle.

I've completed contract deployment and need to register for oracle relay:
- Source: Moca Chain (CreditScoreOracle)
- Targets: Sepolia + Base Sepolia

Full registration details: [paste your doc or attach file]

Could you help with:
1. Official oracle addresses for testnets
2. Registration process/timeline
3. Expected relay latency

Happy to jump on a call if easier. Thanks!
```

---

**2. Telegram**
- Community: https://t.me/MocaverseCommunity
- Action:
  1. Ask for developer support contact
  2. Share registration document
  3. Request oracle team introduction

---

**3. Email**
- Address: developers@moca.network
- Subject: `Cross-Chain Oracle Registration - Credo Protocol`
- Attach: Registration document as PDF
- Include: All contact information

**Example Email:**
```
Subject: Cross-Chain Oracle Registration - Credo Protocol

Hi Moca Team,

I'm developing Credo Protocol, a decentralized credit scoring system for the 
Moca buildathon. I've implemented cross-chain relay functionality using the 
Identity Oracle and need to register my contracts.

Project Summary:
- Allows users to build credit scores on Moca Chain
- Relays scores to Ethereum, Base, Polygon for DeFi integration
- Uses verifiable credentials + zero-knowledge proofs

I've completed:
✅ Moca Chain contract with CrossChainScoreUpdate event
✅ Receiver contracts on Sepolia + Base Sepolia
✅ Comprehensive testing

Attached is the complete registration documentation.

Key Information Needed:
- Official oracle addresses for testnets
- Registration timeline
- Any configuration I need to complete

I'm available for a call if that would be helpful.

Thanks,
[Your Name]
[Contact Info]
```

---

## Step 3.3: Update Oracle Addresses

Once Moca provides official oracle addresses, update your receiver contracts.

### Using Hardhat Console

**For Sepolia:**
```bash
npx hardhat console --network sepolia
```

Then in console:
```javascript
const CrossChain = await ethers.getContractFactory('CrossChainCreditScore')
const contract = await CrossChain.attach('YOUR_SEPOLIA_CONTRACT_ADDRESS')
await contract.updateOracle('MOCA_PROVIDED_ORACLE_ADDRESS')
```

**For Base Sepolia:**
```bash
npx hardhat console --network baseSepolia
```

```javascript
const CrossChain = await ethers.getContractFactory('CrossChainCreditScore')
const contract = await CrossChain.attach('YOUR_BASE_CONTRACT_ADDRESS')
await contract.updateOracle('MOCA_PROVIDED_ORACLE_ADDRESS')
```

### Using Script

Create `contracts/scripts/update-oracle-address.ts`:

```typescript
import { ethers, network } from 'hardhat';
import fs from 'fs';

async function main() {
  console.log(`Updating oracle address on ${network.name}...\n`);

  // Load deployment info
  const deploymentPath = `deployments/crosschain-${network.name}.json`;
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));

  // New oracle address from Moca team
  const NEW_ORACLE_ADDRESS = process.env.MOCA_ORACLE_ADDRESS || '';
  
  if (!NEW_ORACLE_ADDRESS || NEW_ORACLE_ADDRESS === '0x0000000000000000000000000000000000000000') {
    throw new Error('Please set MOCA_ORACLE_ADDRESS environment variable');
  }

  console.log('Contract:', deployment.contractAddress);
  console.log('Current Oracle:', deployment.oracleAddress);
  console.log('New Oracle:', NEW_ORACLE_ADDRESS);

  // Get contract
  const CrossChainCreditScore = await ethers.getContractFactory('CrossChainCreditScore');
  const contract = CrossChainCreditScore.attach(deployment.contractAddress);

  // Update oracle
  const tx = await contract.updateOracle(NEW_ORACLE_ADDRESS);
  console.log('\nTransaction sent:', tx.hash);
  
  await tx.wait();
  console.log('✅ Oracle address updated!');

  // Update deployment file
  deployment.oracleAddress = NEW_ORACLE_ADDRESS;
  deployment.oracleUpdatedAt = new Date().toISOString();
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log('📝 Deployment file updated');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run:
```bash
MOCA_ORACLE_ADDRESS=0x... npx hardhat run scripts/update-oracle-address.ts --network sepolia
MOCA_ORACLE_ADDRESS=0x... npx hardhat run scripts/update-oracle-address.ts --network baseSepolia
```

---

## Step 3.4: Verify Registration

### Ask Moca Team to Confirm

Request confirmation that:
- [ ] Events are being picked up by Listener component
- [ ] BLS signatures are being collected by Vote Processor
- [ ] Test relay was successful
- [ ] Configuration is correct

### Test Relay Manually

Once registered, test the full flow:

```bash
# 1. On Moca Chain, emit test event
npx hardhat console --network mocaDevnet
```

```javascript
const oracle = await ethers.getContractAt(
  'CreditScoreOracle',
  'YOUR_MOCA_CONTRACT_ADDRESS'
)

// Request relay to Sepolia
const tx = await oracle.requestCrossChainRelay(11155111)
await tx.wait()

console.log('Event emitted! TX:', tx.hash)
console.log('Wait ~2 minutes for oracle relay...')
```

```bash
# 2. After 2-3 minutes, check Sepolia
npx hardhat console --network sepolia
```

```javascript
const receiver = await ethers.getContractAt(
  'CrossChainCreditScore',
  'YOUR_SEPOLIA_CONTRACT_ADDRESS'
)

const [score, lastUpdated, verified] = await receiver.getCreditScore('YOUR_WALLET_ADDRESS')

console.log('Score:', score.toString())
console.log('Verified:', verified)
console.log('Last Updated:', new Date(lastUpdated.toNumber() * 1000))
```

---

## Verification Checklist

- [ ] Registration document prepared with all details
- [ ] Contact information sent to Moca team
- [ ] Response received from Moca team
- [ ] Official oracle addresses received
- [ ] Sepolia receiver updated with oracle address
- [ ] Base receiver updated with oracle address
- [ ] Test event emitted on Moca Chain
- [ ] Score successfully relayed to Sepolia
- [ ] Score successfully relayed to Base
- [ ] Registration confirmed by Moca team

---

## Expected Timeline

**Immediate (0-24 hours):**
- Send registration request
- Receive acknowledgment

**Short-term (1-3 days):**
- Receive oracle addresses
- Complete configuration
- First successful test relay

**Ongoing:**
- Monitor relay performance
- Report any issues
- Scale testing

---

## Troubleshooting

### "No response from Moca team"
- Try different communication channel
- Check for buildathon-specific support channels
- Reach out during business hours (their timezone)
- Be patient - may take 24-48 hours

### "Oracle address not provided"
- They may be setting up infrastructure
- Ask for ETA
- Can proceed with Phase 4 using placeholder

### "Test relay fails"
- Verify oracle address is correct
- Check event signature matches exactly
- Confirm contract is whitelisted
- Ask Moca team to check logs

### "Relay takes longer than expected"
- Normal range is 2-5 minutes
- During high load may take longer
- Check Moca oracle status/dashboard
- Contact team if >10 minutes consistently

---

## Communication Tips

**Be Professional:**
- Clear, concise technical details
- Organized documentation
- Specific questions

**Be Patient:**
- Oracle team may be busy
- Allow reasonable response time
- Follow up politely if needed

**Be Helpful:**
- Provide all info upfront
- Test thoroughly before reporting issues
- Share feedback on process

---

## Next Steps

Once registration is confirmed:

1. **Document oracle addresses** in your .env files
2. **Test relay thoroughly** with multiple scenarios
3. **Proceed to Phase 4** - Frontend Integration
4. **Monitor oracle performance** and report issues

---

## While Waiting for Moca Team

You can proceed with Phase 4 (Frontend Integration) while waiting for official oracle registration. The frontend will work with placeholder addresses for development, and you can update the configuration once registration is complete.

---

**Phase 3 Complete!** 🎉

Your contracts are registered with Moca's Identity Oracle. Events emitted from your Moca Chain contract will now be automatically relayed to your receiver contracts on other chains.

**Next:** [Phase 4 - Frontend Integration](./phase-4-frontend-integration.md)

