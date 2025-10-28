# Cross-Chain Oracle Implementation - Overview

## What We're Building

A cross-chain relay system that sends Credo credit scores from Moca Chain to Ethereum, Base, and Polygon using Moca's Identity Oracle. This allows users to build their credit score once on Moca Chain and use it across the entire DeFi ecosystem.

**Key Benefit:** Your credit scores become usable on ANY blockchain - unlocking access to Aave, Compound, DAOs, and any DeFi protocol on Ethereum, Base, or Polygon.

---

## How It Works

```
User on Moca Chain
      ↓
Emit CrossChainScoreUpdate Event
      ↓
Moca Identity Oracle (BLS signatures, >2/3 consensus)
      ↓
Score Relayed to Destination Chain (~2 minutes)
      ↓
Usable on Ethereum/Base/Polygon DeFi
```

---

## Phase Breakdown

### Phase 1: Update Moca Chain Contract
**Duration:** ~1 hour

**What:** Add cross-chain event emission to your existing CreditScoreOracle contract.

**You'll Build:**
- `CrossChainScoreUpdate` event definition
- `requestCrossChainRelay()` function that emits the event
- Tests to verify event emission

**Deliverable:** Updated contract on Moca Chain that can emit events for oracle to pick up.

---

### Phase 2: Deploy Receiver Contracts
**Duration:** ~2 hours

**What:** Deploy contracts on Ethereum Sepolia and Base Sepolia that receive and store credit scores.

**You'll Build:**
- `CrossChainCreditScore` contract (receives scores from oracle)
- Multi-chain Hardhat configuration
- Deployment scripts for Sepolia and Base
- Comprehensive test suite

**Deliverable:** Receiver contracts deployed on Sepolia and Base Sepolia that can accept score submissions from Moca's oracle.

---

### Phase 3: Register with Moca Oracle
**Duration:** ~30 mins (+ Moca team response time)

**What:** Register your contracts with Moca team so the Identity Oracle knows to relay your events.

**You'll Do:**
- Prepare detailed registration documentation
- Contact Moca team via Discord/Telegram/Email
- Provide contract addresses and event signatures
- Update receiver contracts with official oracle addresses

**Deliverable:** Moca Oracle configured to monitor your events and relay to your receiver contracts.

---

### Phase 4: Frontend Integration
**Duration:** ~2 hours

**What:** Build user interface that allows users to trigger cross-chain relay with one click.

**You'll Build:**
- `crossChainService.js` - handles relay requests and score queries
- `CrossChainBridge` component - UI for relay functionality
- Integration into existing score page
- Status tracking across all chains

**Deliverable:** User-friendly interface where users can relay scores to any chain and see their scores across all chains.

---

### Phase 5: Testing & Documentation
**Duration:** ~30 mins

**What:** Verify everything works end-to-end and create documentation.

**You'll Create:**
- Comprehensive test checklist
- Updated README with cross-chain features
- User guide for relay functionality
- Deployment documentation

**Deliverable:** Fully tested, documented cross-chain oracle integration ready for production.

---

## Final Result

### Users Can:
- Build credit score on Moca Chain (existing functionality)
- Click "Relay Score" to send it to Ethereum, Base, or Polygon
- See their score status across all chains in real-time
- Use their Moca credit score on any DeFi protocol on any supported chain

### Technical Implementation:
- **Source:** Moca Chain (emits events)
- **Relay:** Moca Identity Oracle (BLS signatures, decentralized validators)
- **Destination:** Ethereum/Base/Polygon (stores scores)
- **Latency:** ~2 minutes average
- **Cost:** Only Moca Chain gas (~0.0001 MOCA), oracle pays destination gas

### Use Cases Unlocked:
- Borrow on Aave using Moca credit score
- Get preferential rates on Compound
- Access gated DAOs on Ethereum
- Participate in Base DeFi protocols
- Universal credit reputation across all chains

---

## Important Notes

**You DO NOT run the oracle yourself** - Moca Network operates the Identity Oracle infrastructure. You only:
- ✅ Emit events in correct format
- ✅ Deploy receiver contracts
- ✅ Register with Moca team
- ❌ NOT handle BLS signatures
- ❌ NOT run oracle nodes

Think of it like using Chainlink - you emit events, they relay data.

---

## Getting Started

1. **Read full implementation guide:** [CROSS-CHAIN-ORACLE-IMPLEMENTATION.md](./CROSS-CHAIN-ORACLE-IMPLEMENTATION.md)
2. **Follow phases sequentially:** Start with Phase 1
3. **Test after each phase:** Don't skip verification checklists
4. **Contact Moca early:** Register as soon as Phase 2 is complete

---

## Quick Links

- **Phase 1:** [Update Moca Chain Contract](./phase-1-update-moca-chain-contract.md)
- **Phase 2:** [Deploy Receiver Contracts](./phase-2-deploy-receiver-contracts.md)
- **Phase 3:** [Register with Moca Oracle](./phase-3-register-with-moca-oracle.md)
- **Phase 4:** [Frontend Integration](./phase-4-frontend-integration.md)
- **Phase 5:** [Testing & Documentation](./phase-5-testing-documentation.md)

---

**Total Time:** 4-6 hours + Moca team response time  
**Difficulty:** Advanced  
**Result:** Production-ready cross-chain credit scoring infrastructure

