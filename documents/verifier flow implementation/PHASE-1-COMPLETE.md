# Phase 1: Dashboard Setup - ✅ COMPLETE

**Completion Date:** October 29, 2025  
**Status:** Ready for Phase 2  

---

## 🎉 What You Accomplished

You've successfully configured the **$50 USDC Verification Faucet** infrastructure!

### ✅ Completed Items

#### Dashboard Configuration
- [x] **AIR Kit Dashboard Access:** Logged in and verified
- [x] **Verifier DID Obtained:** `did:key:81eGFbL7uQGFjvbTMAyQv4XtzTv7w7JLpevwLDRtenKt6i4z8sgsuAPwGJaXrBBZUgRbfFC13mXE2QVMDffs1KScqF`
- [x] **Verification Program Created:** Employment Verification Program
- [x] **Program ID Obtained:** `c21si030qlizz00z7083YI`
- [x] **Program Status:** Active ✅

#### Blockchain Infrastructure
- [x] **MockUSDC Contract Deployed:** `0xDBa63296abD241Ed9d485F890C63975452f1CD47`
- [x] **Treasury Wallet Configured:** Uses deployer wallet for USDC distribution
- [x] **RPC Endpoint Configured:** `https://devnet-rpc.mocachain.org`

#### Environment Configuration

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_VERIFIER_DID=did:key:81eGFbL7uQGFjvbTMAyQv4XtzTv7w7JLpevwLDRtenKt6i4z8sgsuAPwGJaXrBBZUgRbfFC13mXE2QVMDffs1KScqF
NEXT_PUBLIC_VERIFICATION_PROGRAM_ID=c21si030qlizz00z7083YI
NEXT_PUBLIC_REWARD_AMOUNT=50
NEXT_PUBLIC_REWARD_TOKEN=USDC
```

**Backend (backend/.env):**
```bash
VERIFICATION_PROGRAM_ID=c21si030qlizz00z7083YI
REWARD_AMOUNT=50
USDC_CONTRACT_ADDRESS=0xDBa63296abD241Ed9d485F890C63975452f1CD47
TREASURY_PRIVATE_KEY=0x74ae8bfb42ea814442eeaa627d5fe2859ab10e7d78d8c3cd60e513651cf3d51f
RPC_URL=https://devnet-rpc.mocachain.org
```

---

## 📋 Final Verification Checklist

Before moving to Phase 2, please verify:

### Dashboard Verification
- [ ] **Login to Dashboard:** https://developers.sandbox.air3.com/
- [ ] **Navigate to:** Verifier → Programs
- [ ] **Find Program:** Employment Verification (ID: `c21si030qlizz00z7083YI`)
- [ ] **Check Status:** Shows "Active" 🟢
- [ ] **Verify Requirements:** EMPLOYMENT credential
- [ ] **Check Max Age:** 90 days
- [ ] **Verify Issuer:** Points to your ISSUER_DID

### Fee Wallet Verification
- [ ] **Go to:** Account → Fee Wallet
- [ ] **Check Balance:** > 1 MOCA
- [ ] **If Low:** Get more from https://devnet-scan.mocachain.org/faucet

### Treasury Wallet Verification
- [ ] **Deployer Address:** `0x32F91E4E2c60A9C16cAE736D3b42152B331c147F`
- [ ] **Check USDC Balance:** Should have USDC to distribute
- [ ] **If Low:** Mint more USDC via faucet or contract

#### How to Check USDC Balance:
```bash
# In your project directory
cd contracts
npx hardhat console --network mocaDevnet

# In the console:
const MockUSDC = await ethers.getContractFactory('MockUSDC');
const usdc = await MockUSDC.attach('0xDBa63296abD241Ed9d485F890C63975452f1CD47');
const balance = await usdc.balanceOf('0x32F91E4E2c60A9C16cAE736D3b42152B331c147F');
console.log('Treasury USDC Balance:', ethers.formatUnits(balance, 6), 'USDC');

# Should show: At least 1000+ USDC for testing
```

#### How to Mint More USDC (if needed):
```bash
# In hardhat console (from above):
const [signer] = await ethers.getSigners();
const tx = await usdc.connect(signer).faucet({ gasLimit: 300000 });
await tx.wait();
console.log('Minted 1000 USDC to deployer');
```

### Environment Variables Check
```bash
# Frontend check
cd /Users/marcus/Projects/Credo-Protocol
cat .env.local | grep -E "(VERIFICATION|REWARD)"

# Backend check
cd backend
cat .env | grep -E "(VERIFICATION|REWARD|USDC_CONTRACT|TREASURY)"
```

**Expected Output:**
- ✅ VERIFICATION_PROGRAM_ID set
- ✅ REWARD_AMOUNT = 50
- ✅ USDC_CONTRACT_ADDRESS set
- ✅ TREASURY_PRIVATE_KEY set
- ✅ All values match between frontend and backend

---

## 🔧 Configuration Summary

### Verification Flow Architecture

```
User → Frontend → Backend → AIR Kit Verification → USDC Transfer
                      ↓              ↓                   ↓
                   Prepare      ZK Proof Gen        MockUSDC
                   (JWT Auth)   (On-chain)         (Transfer)
```

### What Happens Next

**Phase 2** will implement:
1. **Backend verification service** that:
   - Generates Partner JWT for AIR Kit authentication
   - Prepares verification requests
   - Handles verification results
   - Transfers $50 USDC to verified users
   - Tracks claimed addresses (prevents double-claiming)

2. **API Endpoints:**
   - `POST /api/verification/prepare` - Start verification
   - `POST /api/verification/result` - Process result + transfer USDC
   - `GET /api/verification/claim-status/:address` - Check if claimed

---

## 🎯 Success Criteria Met

You're ready for Phase 2 when:
- ✅ Verification program is **Active** in dashboard
- ✅ Fee wallet has **> 1 MOCA**
- ✅ Treasury wallet has **> 1000 USDC**
- ✅ All environment variables **configured correctly**
- ✅ MockUSDC contract **deployed and accessible**
- ✅ Verifier DID and Program ID **saved**

---

## 📚 Quick Reference

### Important IDs
| Item | Value |
|------|-------|
| **Verifier DID** | `did:key:81eGFbL7uQGFjvbTMAyQv4XtzTv7w7JLpevwLDRtenKt6i4z8sgsuAPwGJaXrBBZUgRbfFC13mXE2QVMDffs1KScqF` |
| **Program ID** | `c21si030qlizz00z7083YI` |
| **MockUSDC Address** | `0xDBa63296abD241Ed9d485F890C63975452f1CD47` |
| **Deployer Address** | `0x32F91E4E2c60A9C16cAE736D3b42152B331c147F` |

### Important URLs
| Purpose | URL |
|---------|-----|
| **AIR Kit Dashboard** | https://developers.sandbox.air3.com/ |
| **MOCA Faucet** | https://devnet-scan.mocachain.org/faucet |
| **Block Explorer** | https://devnet-scan.mocachain.org |
| **Verification Docs** | https://docs.moca.network/airkit/usage/credential/verify |

---

## 🚀 Ready for Phase 2!

**Time Spent:** 15-30 minutes (configuration only)  
**Next Phase Duration:** ~1 hour  
**What's Next:** Backend verification service implementation

### Next Steps:
1. ✅ Complete Phase 1 verification checklist above
2. 🔜 Proceed to Phase 2: Backend Service
3. 📖 Read: `PHASE-2-BACKEND-SERVICE.md`

---

## 🛠️ Troubleshooting

### Issue: Can't find Verification Program
**Solution:** 
- Make sure you're logged into https://developers.sandbox.air3.com/
- Navigate to Verifier → Programs in left sidebar
- Program ID should be: `c21si030qlizz00z7083YI`

### Issue: Fee Wallet Low Balance
**Solution:**
- Visit https://devnet-scan.mocachain.org/faucet
- Paste your fee wallet address (from AIR Kit dashboard)
- Request tokens (10 MOCA per request)

### Issue: Treasury has no USDC
**Solution:**
```bash
# Mint USDC using hardhat console
cd contracts
npx hardhat console --network mocaDevnet
const MockUSDC = await ethers.getContractFactory('MockUSDC');
const usdc = await MockUSDC.attach('0xDBa63296abD241Ed9d485F890C63975452f1CD47');
const [signer] = await ethers.getSigners();
await usdc.connect(signer).faucet({ gasLimit: 300000 });
console.log('Minted 1000 USDC!');
```

### Issue: Environment variables not loading
**Solution:**
- Restart backend: `cd backend && npm run dev`
- Restart frontend: `npm run dev`
- Clear Next.js cache: `rm -rf .next`
- Verify .env files are not in .gitignore

---

**Phase 1 Status:** ✅ **COMPLETE**  
**Ready for:** Phase 2 - Backend Service Implementation

**Time to Phase 2:** ~5 minutes to verify checklist, then proceed! 🚀

