# MOCA Integration Migration Summary

**Created**: Oct 25, 2025  
**Status**: Action Required  
**Priority**: 🔴 CRITICAL

---

## 🚨 What You Need to Know

Your Credo Protocol currently uses **custom credential infrastructure** instead of MOCA's official AIR Kit credential services. This means:

❌ You're only using MOCA for **SSO/login** (20% of capabilities)  
❌ Your credentials are **NOT interoperable** with other MOCA dApps  
❌ You're **bypassing** the MOCA ecosystem  
❌ Users need **MOCA tokens** for every transaction (bad UX)  

---

## ✅ What You Need to Do

### **Phase 5: MOCA Migration** (NEW - 6-8 hours, Split into 3 Sub-Phases)

**Overview Document**: `PHASE5-MOCA-MIGRATION.md`

This is now the **most critical** phase before finalizing Wave 3. It's been split into 3 focused sub-phases for easier execution.

#### Sub-Phase 5.1: Dashboard Setup (2 hours)

**Document**: `PHASE5.1-DASHBOARD-SETUP.md`

- Register 3 Issuer DIDs (Bank, Employment, CEX)
- Register 1 Verifier DID
- Create 10 credential schemas
- Create 10 verifier programs
- Configure paymaster (ERC-20 Paymaster active by default)
- Generate Partner secret for JWT

#### Sub-Phase 5.2: Backend Refactor (2-3 hours)

**Document**: `PHASE5.2-BACKEND-REFACTOR.md`

- Add Partner JWT generation module
- Replace mock issuers with credential metadata endpoints
- Delete `backend/src/issuers/*.js` files
- Update environment variables (20+ new vars)
- Test all API endpoints

#### Sub-Phase 5.3: Frontend Integration (2-3 hours)

**Document**: `PHASE5.3-FRONTEND-INTEGRATION.md`

- Update AIR Kit initialization with paymaster config
- Refactor credential issuance to use `airService.credential.issue()`
- ERC-20 Paymaster: Users pay gas with USDC/MOCA automatically
- Optional: Add sponsored paymaster policy ID for zero-cost txs
- Create credential wallet component
- Update environment variables
- Test end-to-end with gas sponsorship

---

## 📊 Current vs. Target Architecture

### Current (Wrong)
```
User → Frontend → Your Backend (mock issuers) 
                  ↓ Manual signatures
                  ↓ Local storage
                  → Smart Contract
```

### Target (Official MOCA)
```
User → Frontend → Your Backend (JWT generation)
                  ↓ Auth token
                  ↓ AIR Kit credential.issue()
                  ↓ MOCA Chain Storage Providers (MCSP)
                  → Credential in AIR Wallet
                  → Smart Contract (with proof)
```

---

## 🎯 Benefits After Migration

### For Your Project
✅ Credentials interoperable across MOCA ecosystem  
✅ Gas-sponsored transactions (better UX)  
✅ Decentralized storage on MCSP  
✅ Issuer reputation tracking  
✅ True ecosystem integration  

### For Demo/Judges
✅ Can say "official MOCA integration" (not just login)  
✅ Show credentials in AIR Kit Dashboard  
✅ Demonstrate gas sponsorship  
✅ Highlight decentralized storage  
✅ Prove ecosystem interoperability  

---

## 📋 Action Plan

### Step 1: Read Overview Document
- Open `PHASE5-MOCA-MIGRATION.md` (overview)
- Understand the migration architecture
- Review the 3 sub-phase structure

### Step 2: Execute Phase 5.1 (Dashboard Setup)
- Open `PHASE5.1-DASHBOARD-SETUP.md`
- Login: https://developers.sandbox.air3.com/
- Register all DIDs and create schemas
- Enable gas sponsorship
- Save all credentials (20+ env vars)

### Step 3: Execute Phase 5.2 (Backend Refactor)
- Open `PHASE5.2-BACKEND-REFACTOR.md`
- Add `backend/src/auth/jwt.js`
- Update `backend/src/routes/credentials.js`
- Delete old issuer files
- Update `.env` with saved values
- Test all API endpoints

### Step 4: Execute Phase 5.3 (Frontend Integration)
- Open `PHASE5.3-FRONTEND-INTEGRATION.md`
- Update AIR Kit initialization
- Refactor credential issuance flow
- Create credential wallet component
- Update `.env.local`
- Test end-to-end with gas sponsorship

### Step 5: Verify Complete Migration
- Run all tests from each sub-phase
- Verify gas sponsorship working
- Check AIR Kit Dashboard
- Confirm MCSP storage

### Step 6: Proceed to Phase 6
- Only after ALL 3 sub-phases complete
- Update documentation
- Prepare demo
- Submit

---

## ⏱️ Timeline

**Phase 5.1** (Dashboard): 2 hours  
**Phase 5.2** (Backend): 2-3 hours  
**Phase 5.3** (Frontend): 2-3 hours  
**Phase 5 Total**: 6-8 hours (split over 1-2 days recommended)  

**Phase 6** (Docs & Demo): 4-6 hours  

**Total**: 10-14 hours to properly integrate with MOCA

---

## 🔗 Key Resources

### Documentation
- **Phase 5 Guide**: `PHASE5-MOCA-MIGRATION.md` (detailed steps)
- **Phase 6 Guide**: `PHASE6-DOCS-DEMO.md` (updated for MOCA)
- **MOCA Docs**: https://docs.moca.network/airkit/

### Dashboard
- **AIR Kit Dashboard**: https://developers.sandbox.air3.com/
- **Credential Services**: Credentials → Issuers/Verifiers/Schemas

### Support
- **Discord**: #dev-chat channel
- **Docs**: https://docs.moca.network/airkit/usage/credential/

---

## 🚨 Critical Warnings

### DO NOT Skip Phase 5
Without Phase 5:
- Judges will see you only use MOCA for login
- You can't claim "MOCA ecosystem integration"
- You won't stand out from basic integrations
- You'll miss gas sponsorship benefits

### DO NOT Proceed to Phase 6 Until:
- [ ] All 3 Issuer DIDs registered
- [ ] All 10 schemas created
- [ ] Gas sponsorship working
- [ ] Credentials appear in AIR Kit Dashboard
- [ ] Credentials stored on MCSP
- [ ] Backend using Partner JWT
- [ ] Frontend using `airService.credential.issue()`

---

## 💡 Why This Matters

**Currently**: Your project is "Credo Protocol using MOCA for login"  
**After Phase 5**: Your project is "Credo Protocol - A MOCA Ecosystem DApp"

This is the difference between:
- ❌ Basic integration (using MOCA as a tool)
- ✅ True ecosystem participation (contributing to MOCA)

Judges will recognize the difference immediately.

---

## 📞 Need Help?

**If stuck on:**
- **Dashboard setup**: Check MOCA Discord #dev-chat
- **JWT generation**: See `backend/src/auth/jwt.js` example in Phase 5 doc
- **AIR Kit API**: Read https://docs.moca.network/airkit/usage/credential/
- **Gas payment**: ERC-20 Paymaster active (users pay with USDC/MOCA)
- **Sponsored gas**: Contact MOCA support to enable sponsored paymaster policy

**Remember**: This migration is worth it. It transforms your project from "good" to "excellent" in judges' eyes.

---

## ✅ Next Steps

1. **Read** `PHASE5-MOCA-MIGRATION.md` (overview)
2. **Block** 6-8 hours for focused work (can split across days)
3. **Execute** Phase 5.1 → 5.2 → 5.3 in order
4. **Test** after each sub-phase
5. **Verify** all acceptance criteria before Phase 6

### Recommended Schedule

**Day 1 Morning** (2 hours): Phase 5.1 - Dashboard Setup  
**Day 1 Afternoon** (2-3 hours): Phase 5.2 - Backend Refactor  
**Day 2 Morning** (2-3 hours): Phase 5.3 - Frontend Integration  
**Day 2 Afternoon** (4-6 hours): Phase 6 - Documentation & Demo

---

**Status**: Documentation Complete, Ready for Implementation  
**Priority**: Execute Phase 5 before Phase 6  
**Timeline**: Allow 1-2 days for quality implementation  
**Support**: MOCA Discord available for help

Good luck! This migration will make your project shine. 🚀

