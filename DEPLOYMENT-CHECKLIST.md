# Wave 3 Production Deployment - Quick Checklist

**Created**: October 29, 2025  
**Latest Redeployment**: October 29, 2025, 9:05 AM UTC

---

## 📍 Latest Contract Addresses (Moca Devnet)

- **CreditScoreOracle v2**: `0x91f94Dd05D397de363CFcb5fcf396272a07a8dcd`
- **LendingPool v2**: `0x5f8832b3F5D037F345e9aF9db9A0816E681E6C99`
- **MockUSDC**: `0x53060dDE048c99bB6B1E9556c294D12E9272f52F`

*All issuers registered ✅*  
*Backend USDC address updated ✅*

---

## 🎯 Quick Summary

You need to:
1. **Update Backend on Render** (with new env variables)
2. **Update Frontend on Vercel** (point to Render backend)
3. **Test everything**

**Total Time**: ~45-60 minutes

---

## ✅ Step 1: Backend (Render) - 15-20 min

### 1.1 Push Code
```bash
git add .
git commit -m "feat: Wave 3 production ready"
git push origin marcus
```

### 1.2 Update Render Environment Variables

Go to Render Dashboard → Your Backend Service → Environment

**Copy these from your local `backend/.env` file:**

**CRITICAL - Must Have:**
- [ ] `PARTNER_ID`
- [ ] `PARTNER_SECRET`
- [ ] `ISSUER_DID`
- [ ] `VERIFIER_DID`
- [ ] All 10 `SCHEMA_*` variables
- [ ] All 10 `PROGRAM_*` variables
- [ ] All 10 `VERIFIER_PROGRAM_*` variables
- [ ] `VERIFICATION_PROGRAM_ID`
- [ ] `USDC_CONTRACT_ADDRESS`
- [ ] `TREASURY_PRIVATE_KEY`
- [ ] `RPC_URL`
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL=https://your-vercel-url.vercel.app`

**See full list in DEPLOYMENT-GUIDE.md Step 1.2**

### 1.3 Deploy
- [ ] Click "Manual Deploy" in Render
- [ ] Wait for deployment (~3-5 min)
- [ ] Test: `curl https://your-backend.onrender.com/health`

---

## ✅ Step 2: Frontend (Vercel) - 10-15 min

### 2.1 Update Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**🚨 CRITICAL - Must Update:**
```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
```

**Copy from your local `.env.local`:**
- [ ] `NEXT_PUBLIC_PARTNER_ID`
- [ ] `NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS`
- [ ] `NEXT_PUBLIC_LENDING_POOL_ADDRESS`
- [ ] `NEXT_PUBLIC_MOCK_USDC_ADDRESS`
- [ ] `NEXT_PUBLIC_ISSUER_DID`
- [ ] `NEXT_PUBLIC_VERIFIER_DID`
- [ ] `NEXT_PUBLIC_VERIFICATION_PROGRAM_ID`
- [ ] `NEXT_PUBLIC_REWARD_AMOUNT=50`
- [ ] `NEXT_PUBLIC_REWARD_TOKEN=USDC`
- [ ] All other `NEXT_PUBLIC_*` variables

**See full list in DEPLOYMENT-GUIDE.md Step 2.1**

### 2.2 Deploy
- [ ] Push to GitHub (triggers auto-deploy)
- [ ] Or click "Redeploy" in Vercel dashboard
- [ ] Wait for deployment (~2-3 min)

---

## ✅ Step 3: Test Everything - 10 min

### Basic Tests
- [ ] Frontend loads: `https://your-vercel-url.vercel.app`
- [ ] Backend responds: `curl https://your-backend.onrender.com/health`
- [ ] Login with Moca ID works
- [ ] Dashboard loads

### Wave 3 Feature Tests
- [ ] **Score Builder Wizard** - Visit `/score`
- [ ] **Leaderboard** - Shows on dashboard
- [ ] **Rewards Page** - Visit `/rewards`, claim $50 USDC
- [ ] **Credential Marketplace** - Request & submit credential
- [ ] **Score Updates** - Check score increases
- [ ] **Lending** - Supply & Borrow flow
- [ ] **Interest Accrual** - Borrow, wait, check position
- [ ] **Composable API** - Visit `/api/score/YOUR_ADDRESS`

### MOCA Integration Tests
- [ ] Credentials issue via AIR Kit (not mock)
- [ ] Partner JWT authentication works
- [ ] Verification flow works ($50 USDC)

---

## 🚨 Common Issues

### "Cannot connect to backend"
```bash
# Fix: Update Vercel env variable
NEXT_PUBLIC_API_URL=https://your-actual-render-url.onrender.com
```

### "Credential submission fails"
```bash
# Fix: Register issuers on blockchain
cd contracts
npx hardhat run scripts/register-deployer-issuer.ts --network mocaDevnet
```

### "Leaderboard empty"
- Normal if no users have submitted credentials yet
- Test: Login → Submit credential → Refresh

---

## 📋 Environment Variable Quick Reference

### Backend (Render) - 40+ variables
See `backend/.env` file or DEPLOYMENT-GUIDE.md Step 1.2

**Most Critical:**
- Partner authentication (2)
- DIDs (4)
- Schema IDs (10)
- Program IDs (10)
- Verifier Program IDs (10)
- Verification faucet (4)
- Server config (3)

### Frontend (Vercel) - 20+ variables
See `.env.local` file or DEPLOYMENT-GUIDE.md Step 2.1

**Most Critical:**
- `NEXT_PUBLIC_API_URL` ← **MUST CHANGE TO RENDER URL**
- `NEXT_PUBLIC_BACKEND_URL` ← **MUST CHANGE TO RENDER URL**
- Partner ID (1)
- Contract addresses (3)
- DIDs (2)
- Verification config (3)

---

## ✅ Done!

Once all checkboxes are complete, your Wave 3 app is live!

**Features Now Live:**
- ✅ 10 advanced credentials
- ✅ Interest accrual system
- ✅ Score Builder Wizard
- ✅ Leaderboard
- ✅ Composable score API
- ✅ Official MOCA integration
- ✅ $50 USDC verification faucet

---

**Total Time**: 45-60 minutes  
**Need Help?** See DEPLOYMENT-GUIDE.md for detailed instructions

