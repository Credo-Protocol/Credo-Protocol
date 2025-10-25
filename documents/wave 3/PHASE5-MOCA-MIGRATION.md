# Phase 5: MOCA Official Infrastructure Migration (OVERVIEW)

**Day**: 3 Full Day (Oct 27)  
**Duration**: 6-8 hours total (split into 3 sub-phases)  
**Prerequisites**: Phases 1-4 Complete  
**Next**: Phase 6 (Documentation & Demo)

---

## 🎯 Goal

Migrate from custom credential infrastructure to **MOCA's official AIR Kit credential services**. This is split into **3 focused sub-phases** for easier execution.

**Why This Phase**: Your current implementation bypasses MOCA's credential ecosystem. This migration makes your credentials:
- ✅ Interoperable with other MOCA dApps
- ✅ Stored in decentralized storage (MCSP)
- ✅ Verifiable by third parties
- ✅ Discoverable via MOCA's credential registry
- ✅ Eligible for gas sponsorship

**Critical**: Without this migration, your project doesn't truly integrate with MOCA Network - it just uses MOCA for login.

---

## 📚 Sub-Phases

This phase is split into 3 manageable parts:

### **Phase 5.1: Dashboard Setup** (2 hours)
- Register 3 Issuer DIDs
- Register 1 Verifier DID
- Create 10 credential schemas
- Create 10 verifier programs
- Enable gas sponsorship
- Generate Partner secret

**Document**: [PHASE5.1-DASHBOARD-SETUP.md](./PHASE5.1-DASHBOARD-SETUP.md)

### **Phase 5.2: Backend Refactor** (2-3 hours)
- Add Partner JWT generation
- Refactor credential routes
- Update environment variables
- Delete old issuer files
- Test backend endpoints

**Document**: [PHASE5.2-BACKEND-REFACTOR.md](./PHASE5.2-BACKEND-REFACTOR.md)

### **Phase 5.3: Frontend Integration** (2-3 hours)
- Update AIR Kit with paymaster
- Refactor credential issuance
- Create credential wallet component
- Test end-to-end flow
- Verify gas sponsorship

**Document**: [PHASE5.3-FRONTEND-INTEGRATION.md](./PHASE5.3-FRONTEND-INTEGRATION.md)

---

## 🚦 Getting Started

**IMPORTANT**: Complete each sub-phase in order. Do not skip ahead!

### Step 1: Read This Overview
- Understand what you're migrating from/to
- Review the architecture changes
- Prepare your workspace

### Step 2: Execute Sub-Phases in Order
1. **Start with Phase 5.1** - Dashboard Setup
2. **Then Phase 5.2** - Backend Refactor (requires 5.1 complete)
3. **Finally Phase 5.3** - Frontend Integration (requires 5.1 & 5.2 complete)

### Step 3: Verify Completion
After Phase 5.3, verify all acceptance criteria before proceeding to Phase 6.

---

---

## 📋 What You're Migrating

### Current Architecture (Phases 1-4)
```
❌ Custom Express backend with mock issuers
❌ Manual EIP-191 signature generation
❌ Credentials stored locally/centrally
❌ No issuer reputation/trust scoring
❌ Not discoverable by other dApps
❌ Users need MOCA tokens for every transaction
```

### Target Architecture (Official MOCA)
```
✅ AIR Kit Developer Dashboard for issuer management
✅ Official Issuer DIDs for each credential type
✅ Credentials stored on MOCA Chain Storage Providers (MCSP)
✅ Integrated with MOCA's trust registry
✅ Public schema registry for discovery
✅ Gas sponsorship for credential issuance
```

---

---

## ✅ Final Completion Checklist

After completing all 3 sub-phases, verify:

### Phase 5.1 Complete
- [ ] 3 Issuer DIDs registered and active
- [ ] 1 Verifier DID registered and active
- [ ] All 10 credential schemas created
- [ ] All 10 verifier programs created
- [ ] Gas sponsorship enabled
- [ ] Partner secret generated and saved

### Phase 5.2 Complete
- [ ] Backend `.env` updated with all DIDs/schemas
- [ ] JWT module created and tested
- [ ] Credential routes refactored
- [ ] Old issuer files deleted
- [ ] All backend endpoints tested successfully

### Phase 5.3 Complete
- [ ] Frontend `.env.local` updated
- [ ] AIR Kit initialized with paymaster
- [ ] Credential issuance uses `airService.credential.issue()`
- [ ] Credential wallet component created
- [ ] End-to-end flow tested
- [ ] Gas sponsorship verified working
- [ ] Credentials appear in AIR Kit Dashboard

---

## 🎉 What You'll Accomplish

After Phase 5 (all 3 sub-phases), you'll have:

✅ **Official MOCA Identity**: 3 Issuer DIDs + 1 Verifier DID registered  
✅ **Public Schema Registry**: 10 published, discoverable schemas  
✅ **Gas-Sponsored UX**: Zero friction for users (no MOCA tokens needed!)  
✅ **Decentralized Storage**: Credentials stored on MOCA Chain Storage Providers  
✅ **Ecosystem Interoperability**: Credentials work across all MOCA dApps  
✅ **Proper Architecture**: Backend prepares, frontend issues, AIR Kit stores  

**Your project transforms from "using MOCA for login" to "true MOCA ecosystem participant"** 🚀

---

## 📊 Impact Comparison

| Aspect | Before Phase 5 | After Phase 5 |
|--------|-----------------|---------------|
| **Login** | ✅ AIR Kit SSO | ✅ AIR Kit SSO |
| **Credentials** | ❌ Custom mock issuers | ✅ Official Issuer DIDs |
| **Storage** | ❌ Local/central | ✅ MCSP (decentralized) |
| **Gas** | ❌ Users pay | ✅ Sponsored (seamless) |
| **Interoperability** | ❌ Isolated | ✅ Ecosystem-wide |
| **Discovery** | ❌ Private schemas | ✅ Public registry |
| **Integration Level** | ~20% of MOCA | ~80% of MOCA |

---

## 🔗 Next Steps

After completing all 3 sub-phases:

1. **Verify Everything Works**
   - Test full user journey
   - Check AIR Kit Dashboard
   - Verify gas sponsorship
   - Confirm MCSP storage

2. **Proceed to Phase 6**
   - Update documentation
   - Prepare demo emphasizing MOCA integration
   - Test submission materials
   - Rehearse for judges

**Estimated Total Time**: 6-8 hours for Phase 5 + 4-6 hours for Phase 6

---

## 🚨 Critical Reminders

### Before Starting
- ✅ Phases 1-4 must be complete
- ✅ Block 6-8 hours for focused work
- ✅ Have MOCA Discord ready for support

### During Execution
- ✅ Follow sub-phases in order (5.1 → 5.2 → 5.3)
- ✅ Don't skip steps
- ✅ Test after each sub-phase
- ✅ Save all DIDs and IDs immediately

### After Completion
- ✅ Verify all 3 sub-phase checklists
- ✅ Test gas-free credential issuance
- ✅ Confirm credentials in AIR Dashboard
- ✅ Ready for Phase 6!

---

## 📞 Getting Help

**If stuck on any sub-phase**:

- **Phase 5.1** (Dashboard): MOCA Discord #dev-chat
- **Phase 5.2** (Backend): Check backend console logs
- **Phase 5.3** (Frontend): Check browser console

**Resources**:
- AIR Kit Dashboard: https://developers.sandbox.air3.com/
- MOCA Docs: https://docs.moca.network/airkit/
- Support: MOCA Discord dev-chat

---

## 🏁 Summary

Phase 5 is the **most critical upgrade** in Wave 3. It transforms your project from a basic integration into a true MOCA ecosystem participant.

**Three focused sub-phases**:
1. **5.1**: Set up official identity in MOCA ecosystem (2 hrs)
2. **5.2**: Refactor backend for Partner JWT auth (2-3 hrs)
3. **5.3**: Update frontend to use AIR Kit credentials (2-3 hrs)

**Total investment**: 6-8 hours  
**Value delivered**: 4x improvement in MOCA integration depth

Start with [PHASE5.1-DASHBOARD-SETUP.md](./PHASE5.1-DASHBOARD-SETUP.md) →

---

**Phase 5 Status**: Split into 3 manageable sub-phases  
**Start Here**: Phase 5.1 - Dashboard Setup  
**End Goal**: Full MOCA ecosystem integration before Phase 6

---

## 📚 Detailed Documentation

For step-by-step instructions, see:

### Part A: Dashboard Setup
**Document**: [PHASE5.1-DASHBOARD-SETUP.md](./PHASE5.1-DASHBOARD-SETUP.md)  
**Time**: 2 hours  
**What**: Register DIDs, create schemas, enable gas sponsorship

### Part B: Backend Refactor  
**Document**: [PHASE5.2-BACKEND-REFACTOR.md](./PHASE5.2-BACKEND-REFACTOR.md)  
**Time**: 2-3 hours  
**What**: JWT generation, API refactor, delete old files

### Part C: Frontend Integration
**Document**: [PHASE5.3-FRONTEND-INTEGRATION.md](./PHASE5.3-FRONTEND-INTEGRATION.md)  
**Time**: 2-3 hours  
**What**: AIR Kit paymaster, credential flow, wallet component

---

<END OF OVERVIEW - See Sub-Phase Documents for Implementation>

The remaining content has been moved to the individual sub-phase documents. This overview serves as your roadmap and entry point to Phase 5.

For detailed implementation steps, open the appropriate sub-phase document above.

---

**END OF PHASE 5 OVERVIEW**

All implementation details have been moved to the sub-phase documents for better organization and execution.

**Start your migration journey**: Open [PHASE5.1-DASHBOARD-SETUP.md](./PHASE5.1-DASHBOARD-SETUP.md) now!
