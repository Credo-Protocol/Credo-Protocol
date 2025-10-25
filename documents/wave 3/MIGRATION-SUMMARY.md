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

### **Phase 5: MOCA Migration** (NEW - 6-8 hours)

**Document**: `PHASE5-MOCA-MIGRATION.md`

This is now the **most critical** phase before finalizing Wave 3.

#### High-Level Steps:

1. **AIR Kit Dashboard Setup** (2 hours)
   - Register 3 Issuer DIDs (Bank, Employment, CEX)
   - Register 1 Verifier DID
   - Create 10 credential schemas
   - Create 10 verifier programs
   - Enable gas sponsorship (paymaster)
   - Generate Partner secret for JWT

2. **Backend Refactor** (2-3 hours)
   - Add Partner JWT generation
   - Replace mock issuers with credential metadata endpoints
   - Delete `backend/src/issuers/*.js` files
   - Update environment variables (20+ new vars)

3. **Frontend Integration** (2-3 hours)
   - Update credential issuance to use `airService.credential.issue()`
   - Add gas sponsorship configuration
   - Create credential wallet component
   - Update environment variables

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

### Step 1: Read Phase 5 Document
- Open `PHASE5-MOCA-MIGRATION.md`
- Understand the 3-part structure
- Review all code examples

### Step 2: Access AIR Kit Dashboard
- Login: https://developers.sandbox.air3.com/
- Complete Part A (Dashboard Setup)
- Save all DIDs, schemas, program IDs

### Step 3: Refactor Backend
- Add `backend/src/auth/jwt.js`
- Update `backend/src/routes/credentials.js`
- Delete old issuer files
- Update `.env` with 20+ new variables

### Step 4: Update Frontend
- Modify credential issuance flow
- Add gas sponsorship config
- Create credential wallet component
- Update `.env.local`

### Step 5: Test Everything
- Run smoke tests
- Verify gas sponsorship
- Check AIR Kit Dashboard
- Confirm MCSP storage

### Step 6: Proceed to Phase 6
- Only after Phase 5 is 100% complete
- Update documentation
- Prepare demo
- Submit

---

## ⏱️ Timeline

**Phase 5**: 6-8 hours (split over 1-2 days recommended)  
**Phase 6**: 4-6 hours (after Phase 5 complete)  
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
- **Gas sponsorship**: Contact MOCA support to enable paymaster

**Remember**: This migration is worth it. It transforms your project from "good" to "excellent" in judges' eyes.

---

## ✅ Next Steps

1. **Read** `PHASE5-MOCA-MIGRATION.md` cover to cover
2. **Block** 6-8 hours for focused work
3. **Start** with Part A (Dashboard Setup)
4. **Test** after each major change
5. **Verify** all acceptance criteria before Phase 6

---

**Status**: Documentation Complete, Ready for Implementation  
**Priority**: Execute Phase 5 before Phase 6  
**Timeline**: Allow 1-2 days for quality implementation  
**Support**: MOCA Discord available for help

Good luck! This migration will make your project shine. 🚀

