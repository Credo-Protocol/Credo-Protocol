# Credo Protocol - Wave 3 Implementation Plan

**Timeline**: Oct 25-28, 2025 (4 days)  
**Status**: Phases 1-4 Complete ✅ | Phase 5 (MOCA Migration) In Progress  
**Objective**: Transform MVP into production-ready protocol with advanced credentials, clear user journey, official MOCA ecosystem integration, and demonstrated path to adoption

---

## 📋 Executive Summary

### Wave 2 Feedback Analysis

**What Reviewers Want:**

1. **laishaw**: "More advanced credentials for loans" + "More defined user journey for earning a higher score"
2. **0xmythril**: "How to get adoption and liquidity"
3. **patrickmoca**: "Work on CreditScore Oracle with goal of deploying to Moca chain testnet"
4. **tonyfung**: Praised "Solid integration & e2e flows" (maintain this quality)

### Wave 3 Response Strategy

Prove that Credo is **production-ready** with:
- ✅ Real credential depth (bucketed privacy-preserving credentials)
- ✅ Crystal-clear UX showing "how to earn better rates"
- ✅ Composable credit primitive (other dApps can use our scores)
- ✅ Testnet deployment proving production readiness

---

## 🎯 Success Criteria

By end of Wave 3, judges should be able to:

✅ **Try 2 new advanced credentials** (Income Range, Bank Balance Average)  
✅ **See exactly what unlocks the next tier** (Score Builder Wizard)  
✅ **Watch interest accrue** in real-time on borrowed positions  
✅ **Access a public API** to pull any user's credit score (composability)  
✅ **Use the protocol on Moca testnet** (production-ready signal)  
✅ **Understand the adoption path** via leaderboard and partnerships  
🔥 **Request credentials without native gas tokens** (ERC-20 Paymaster uses USDC/MOCA)  
🔥 **View issued credentials in AIR Kit Dashboard** (official MOCA integration)  
🔥 **Verify credentials are stored on MCSP** (decentralized storage)  
🔥 **See official Issuer DIDs registered** in AIR Kit Dashboard

---

## 📂 Implementation Phases

### Phase 1: Oracle v2 Foundation (Day 1 - Oct 25)
**Duration**: 6-8 hours  
**Document**: [PHASE1-ORACLE.md](./PHASE1-ORACLE.md)

- On-chain registries (issuers, credential types, tiers)
- Score breakdown events for transparency
- Safety improvements (reentrancy guard, gas bounds)
- Complete testing suite

**Why First**: All other features depend on Oracle's new capabilities.

---

### Phase 2: Advanced Credentials System (Day 2 AM - Oct 26)
**Duration**: 4-6 hours  
**Document**: [PHASE2-CREDENTIALS.md](./PHASE2-CREDENTIALS.md)

- Income Range buckets (privacy-preserving)
- Bank Balance 30-day average buckets
- Backend issuer upgrades
- API endpoints for new credentials

**Why Second**: Addresses "more advanced credentials" feedback directly.

---

### Phase 3: LendingPool v2 + UX Enhancements (Day 2 PM - Day 3 AM)
**Duration**: 8-10 hours  
**Document**: [PHASE3-LENDING-UX.md](./PHASE3-LENDING-UX.md)

- Interest accrual system (5-18% APR by tier)
- Score Builder Wizard (simulation + tier gaps)
- Real-time interest display
- Clear "path to next tier" UX

**Why Third**: Requires Oracle v2 and advanced credentials to be complete.

---

### Phase 4: Testnet Deployment & Ecosystem (Day 3 PM - Oct 27)
**Duration**: 6-8 hours  
**Document**: [PHASE4-DEPLOYMENT.md](./PHASE4-DEPLOYMENT.md)

- Deploy to Moca testnet
- Composable score API (`/api/score/:address`)
- Leaderboard for adoption proof
- Production monitoring

**Why Fourth**: Deploy after all features are tested locally.

---

### Phase 5: MOCA Official Integration & Migration (Day 4 - Oct 28)
**Duration**: 6-8 hours  
**Document**: [PHASE5-MOCA-MIGRATION.md](./PHASE5-MOCA-MIGRATION.md)

**🚨 CRITICAL PHASE - This transforms your project from "using MOCA for login" to "true MOCA ecosystem participant"**

#### Sub-Phases:
- **Phase 5.1**: [AIR Kit Dashboard Setup](./PHASE5.1-DASHBOARD-SETUP.md) (2-3 hours)
  - Register official Issuer DIDs (Bank, Employment, CEX)
  - Register Verifier DID (Credo Protocol)
  - Create 10 credential schemas (bucketed data)
  - Configure gas sponsorship (ERC-20 Paymaster active by default)

- **Phase 5.2**: [Backend Refactor](./PHASE5.2-BACKEND-REFACTOR.md) (2-3 hours)
  - Replace custom mock issuers with Partner JWT generation
  - Refactor credential routes to return metadata (not signatures)
  - Delete old issuer files

- **Phase 5.3**: [Frontend Integration](./PHASE5.3-FRONTEND-INTEGRATION.md) (2-3 hours)
  - Enable gas sponsorship in AIR Kit init
  - Refactor credential issuance to use `airService.credential.issue()`
  - Add credential verification UI (AIR Kit wallet display)

**Why Fifth**: You've been bypassing MOCA's official credential infrastructure. This migration makes your credentials interoperable, gas-sponsored, and stored on MCSP (decentralized storage).

**Impact**:
- ❌ Before: Custom signatures, users pay gas, isolated credentials
- ✅ After: Official AIR Kit DIDs, gas-sponsored, MOCA ecosystem interoperability

---

### Phase 6: Documentation & Demo Prep (Day 4 Evening - Oct 28)
**Duration**: 4-6 hours  
**Document**: [PHASE6-DOCS-DEMO.md](./PHASE6-DOCS-DEMO.md)

- Update README with MOCA integration highlights
- Create 4-minute demo script (emphasize gas sponsorship!)
- Integration guide for other dApps
- Complete testing checklist
- Verify credentials appear in AIR Kit Dashboard

**Why Last**: Polish and preparation after everything works.

---

## 🔗 Supporting Documents

### Core Implementation Docs
- **[DEMO-SCRIPT.md](./DEMO-SCRIPT.md)**: 4-minute demo flow for judges
- **[TESTING-CHECKLIST.md](./TESTING-CHECKLIST.md)**: Pre-submission verification

### Phase 5 Migration Docs (CRITICAL) 🔥
- **[PHASE5-MOCA-MIGRATION.md](./PHASE5-MOCA-MIGRATION.md)**: Migration overview
- **[PHASE5.1-DASHBOARD-SETUP.md](./PHASE5.1-DASHBOARD-SETUP.md)**: AIR Kit Dashboard configuration
- **[PHASE5.2-BACKEND-REFACTOR.md](./PHASE5.2-BACKEND-REFACTOR.md)**: Backend Partner JWT implementation
- **[PHASE5.3-FRONTEND-INTEGRATION.md](./PHASE5.3-FRONTEND-INTEGRATION.md)**: Frontend AIR Kit integration
- **[MIGRATION-SUMMARY.md](./MIGRATION-SUMMARY.md)**: Executive migration summary

---

## ⚡ Quick Start

### Day 1 (Oct 25) - TODAY
1. Read [PHASE1-ORACLE.md](./PHASE1-ORACLE.md)
2. Set up 3 terminal windows (contracts, backend, frontend)
3. Start implementing Oracle v2 upgrades
4. Complete all Phase 1 acceptance criteria before sleeping

### Day 2 (Oct 26)
**Morning**: [PHASE2-CREDENTIALS.md](./PHASE2-CREDENTIALS.md)  
**Afternoon**: [PHASE3-LENDING-UX.md](./PHASE3-LENDING-UX.md) (start)

### Day 3 (Oct 27)
**Morning**: [PHASE3-LENDING-UX.md](./PHASE3-LENDING-UX.md) (finish)  
**Afternoon**: [PHASE4-DEPLOYMENT.md](./PHASE4-DEPLOYMENT.md)

### Day 4 (Oct 28) - MOCA MIGRATION DAY
**Morning**: [PHASE5.1-DASHBOARD-SETUP.md](./PHASE5.1-DASHBOARD-SETUP.md)  
**Afternoon**: [PHASE5.2-BACKEND-REFACTOR.md](./PHASE5.2-BACKEND-REFACTOR.md) + [PHASE5.3-FRONTEND-INTEGRATION.md](./PHASE5.3-FRONTEND-INTEGRATION.md)  
**Evening**: [PHASE6-DOCS-DEMO.md](./PHASE6-DOCS-DEMO.md)

---

## 📊 Phase Dependencies

```
Phase 1 (Oracle v2)
    ↓ MUST COMPLETE FIRST
Phase 2 (Advanced Credentials)
    ↓ MUST COMPLETE SECOND
Phase 3 (Lending v2 + UX)
    ↓ MUST COMPLETE THIRD
Phase 4 (Testnet Deployment)
    ↓ MUST COMPLETE FOURTH
Phase 5 (MOCA Migration) 🚨 CRITICAL
    ├─ Phase 5.1 (Dashboard Setup)
    ├─ Phase 5.2 (Backend Refactor)
    └─ Phase 5.3 (Frontend Integration)
    ↓ MUST COMPLETE FIFTH
Phase 6 (Documentation & Demo)
    ↓ READY FOR SUBMISSION
```

**Critical**: Do NOT skip ahead. Each phase builds on the previous.

**🚨 Extra Critical**: Phase 5 transforms mock credentials → official MOCA ecosystem credentials. Without it, you're not truly integrated with MOCA.

---

## 🎯 What We're Shipping

### New Smart Contract Features
- On-chain registries (issuer trust scores, credential weights)
- Transparent score breakdowns (event emissions)
- Interest accrual (5-18% APR based on tier)
- 10 credential types across 3 issuers

### New Frontend Features
- Score Builder Wizard with real-time simulation
- "Points to next tier" progress tracking
- Privacy-preserving credential display
- Live interest ticker
- Leaderboard

### New Backend Features
- Bucketed credentials (Income Range, Bank Balance)
- Privacy-first design (ranges, not exact amounts)
- 4 buckets per credential type

### New Ecosystem Features
- Public score API (`/api/score/:address`)
- Testnet deployment (production-ready)
- Integration guide for dApps
- Composability demonstration

### New MOCA Integration Features (Phase 5) 🔥
- **Official Issuer DIDs**: 3 registered issuers (Bank, Employment, CEX)
- **Verifier DID**: Credo Protocol as official verifier
- **Gas Sponsorship**: Users don't pay for credential issuance
- **Decentralized Storage**: Credentials stored on MCSP (not local DB)
- **Interoperability**: Credentials work across MOCA ecosystem
- **Partner JWT Auth**: Secure backend ↔ AIR Kit communication
- **Public Schema Registry**: 10 credential schemas on AIR Kit
- **AIR Kit Wallet Integration**: Users can view credentials in AIR Wallet

---

## 🚨 Risk Mitigation

### If You Fall Behind Schedule

**Must Ship (P0)**:
- ✅ Oracle v2 with registries
- ✅ 1 advanced credential (Bank Balance)
- ✅ Score Builder Wizard (basic)
- ✅ Testnet deployment
- 🚨 **Phase 5 MOCA Migration (ALL 3 sub-phases)**

**Should Ship (P1)**:
- ✅ 2nd advanced credential (Income)
- ✅ Interest accrual display
- ✅ Leaderboard
- ✅ ERC-20 Paymaster (users pay gas with USDC/MOCA automatically)

**Nice-to-Have (P2)**:
- ⭕ Score API
- ⭕ Integration guide
- ⭕ Historical charts
- ⭕ Credential verification UI

### If You Encounter Blockers

**Contract won't compile**: Revert to last working version, ship stable code  
**Testnet fails**: Use devnet, document "testnet coming soon"  
**Frontend bug**: Hide feature with feature flag, ship 95% working

---

## 📈 Expected Outcomes

### Technical Metrics
- 10+ credential types on-chain
- <500k gas for score computation
- <2s API response time
- 100% test pass rate

### User Experience
- <10 seconds login → dashboard
- Real-time score simulation
- Clear "200 pts to next tier" messaging
- Mobile-responsive design

### Demo Quality
- 4-minute rehearsed demo
- Backup wallets funded
- Professional landing page
- Judges can try it themselves

---

## 📞 Support

**Stuck on a phase?**
1. Re-read the phase document carefully
2. Check Wave 2 code for patterns
3. Test incrementally
4. Ask for help in Moca Discord

**Finished a phase?**
1. ✅ Check all acceptance criteria
2. ✅ Commit: `feat: Complete Phase X - [Description]`
3. ✅ Take 5-min break
4. ✅ Start next phase

---

## 🚀 Where You Are Now

You have:
- ✅ Solid Wave 2 foundation
- ✅ Phases 1-4 complete (Oracle v2, Advanced Credentials, Lending UX, Testnet Deployment)
- ✅ Working project with mock credentials
- 🚨 **CRITICAL**: Phase 5 (MOCA Migration) ahead

**The key**: Follow Phase 5 sub-phases in order. Test as you go. This migration is what makes you a true MOCA ecosystem participant.

**Your Next Steps**:
1. 📖 Read **[PHASE5-MOCA-MIGRATION.md](./PHASE5-MOCA-MIGRATION.md)** (Overview)
2. 🎯 Complete **[PHASE5.1-DASHBOARD-SETUP.md](./PHASE5.1-DASHBOARD-SETUP.md)** (2-3 hours)
3. 🔧 Complete **[PHASE5.2-BACKEND-REFACTOR.md](./PHASE5.2-BACKEND-REFACTOR.md)** (2-3 hours)
4. ⚛️ Complete **[PHASE5.3-FRONTEND-INTEGRATION.md](./PHASE5.3-FRONTEND-INTEGRATION.md)** (2-3 hours)
5. 📝 Finish with **[PHASE6-DOCS-DEMO.md](./PHASE6-DOCS-DEMO.md)** (4-6 hours)

**Why Phase 5 is Critical**:
- Transforms mock credentials → official MOCA ecosystem credentials
- Enables gas sponsorship (users don't pay for credentials!)
- Stores credentials on MCSP (decentralized storage)
- Makes credentials interoperable across MOCA ecosystem
- Shows judges you truly understand MOCA's vision

💪 **Start with [PHASE5.1-DASHBOARD-SETUP.md](./PHASE5.1-DASHBOARD-SETUP.md) right now!**

---

**Document Version**: 2.0  
**Created**: Oct 25, 2025  
**Updated**: Oct 28, 2025 (Added Phase 5 MOCA Migration)  
**Next Step**: Read PHASE5.1-DASHBOARD-SETUP.md

