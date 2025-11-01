# 🚀 Complete Clean Start Guide - Credo Protocol

This guide will help you redeploy all contracts and test the complete MOCA integration.

**Last Updated**: October 27, 2025 (Verified & Tested)

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] MOCA Devnet tokens in your wallet
- [ ] AIR Kit Dashboard setup complete (Phase 5.1)
- [ ] All 10 schemas created
- [ ] All 10 issuance programs created
- [ ] Partner Secret generated
- [ ] RSA keys generated (`backend/private.key` & `backend/public.key`)
- [ ] ngrok running (for JWKS URL)

---

## Step 1: Clean Existing Data

```bash
# Navigate to project root
cd Credo-Protocol

# Optional: Clear any existing deployed addresses
# (We'll generate new ones)
echo "Backing up old deployment..."
cp contracts/deployed-addresses.json contracts/deployed-addresses.backup.json 2>/dev/null || true
```

---

## Step 2: Redeploy Smart Contracts

```bash
# Navigate to contracts directory
cd contracts

# Check your wallet has MOCA tokens
echo "Check balance at: https://devnet-scan.mocachain.org/faucet"

# Deploy contracts (use the correct script name)
npm run deploy:devnet

# This will:
# ✅ Deploy CreditScoreOracle v2
# ✅ Deploy LendingPool (with interest accrual)
# ✅ Deploy MockUSDC
# ✅ Register 11 credential types (all 10 types + on-chain activity)
# ✅ Enable USDC in lending pool
# ✅ Save addresses to deployed-addresses.json
```

**Expected Output:**
```
🎉 DEPLOYMENT COMPLETE!
📋 Contract Addresses:
   CreditScoreOracle: 0x12ad1aBfBde99Ce4D37fB18A5e622A619d59f705 (your addresses will vary)
   LendingPool:       0x3c30Cd9c071B9ee307C251a3e120DA6e8dde7bd4
   MockUSDC:          0xDBa63296abD241Ed9d485F890C63975452f1CD47
```

**IMPORTANT:** Copy these addresses - you'll need them for Step 3!

**Latest Successful Deployment:** October 27, 2025 at 4:15 AM UTC

### 2.1 ⚠️ CRITICAL: Register Issuers

**This step is REQUIRED after every deployment!**

```bash
# Still in contracts directory
npx hardhat run --network moca-devnet scripts/register-deployer-issuer.ts
```

**Why this is needed**: 
- Without registered issuers, credential submissions fail with "missing revert data" error
- This registers your deployer address + all mock issuers on the Oracle contract
- Must be done EVERY time you deploy new contracts
- The script automatically reads the new Oracle address from `deployed-addresses.json`

**Expected Output:**
```
🔐 Registering Deployer as Issuer
============================================================
📍 Oracle Address: 0x<YOUR_NEW_ORACLE_ADDRESS>
👤 Deployer Address: 0x32F91E4E2c60A9C16cAE736D3b42152B331c147F

⚙️  Registering deployer as issuer...
✅ Deployer registered successfully!

⚙️  Registering mock issuers on correct contract...
   ⚠️  Mock Exchange already registered (or ✅ registered if first time)
   ⚠️  Mock Employer already registered
   ⚠️  Mock Bank already registered

============================================================
✅ All issuers registered on correct contract!
```

**Note:** If you see "already registered", that's fine - it means the deploy script registered them.

---

## Step 3: Update All Environment Variables

### 3.1 Update Frontend `.env.local`

**Get addresses from:** `contracts/deployed-addresses.json`

```bash
cd Credo-Protocol
# View the deployed addresses
cat contracts/deployed-addresses.json
```

Now open `.env.local` and update **6 address variables** (3 primary + 3 legacy):

```bash
# Primary contract addresses (UPDATE THESE!)
NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS=0x<YOUR_NEW_ORACLE_ADDRESS>
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x<YOUR_NEW_POOL_ADDRESS>
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x<YOUR_NEW_USDC_ADDRESS>

# Legacy names for backward compatibility (UPDATE THESE TOO!)
NEXT_PUBLIC_CREDIT_SCORE_ORACLE=0x<YOUR_NEW_ORACLE_ADDRESS>
NEXT_PUBLIC_LENDING_POOL=0x<YOUR_NEW_POOL_ADDRESS>
NEXT_PUBLIC_USDC=0x<YOUR_NEW_USDC_ADDRESS>

# Keep these from Phase 5.1-5.3 (DON'T CHANGE)
NEXT_PUBLIC_PARTNER_ID=954fe820-050d-49fb-b22e-884922aa6cef
NEXT_PUBLIC_ISSUER_DID=did:air:id:test:4P3gyKQFs7SYu1XBDirLU7WhJqRgDHHuKbfVuGTwun
NEXT_PUBLIC_VERIFIER_DID=did:key:81eGFbL7uQGFjvbTMAyQv4XtzTv7w7JLpevwLDRtenKt6i4z8sgsuAPwGJaXrBBZUgRbfFC13mXE2QVMDffs1KScqF
NEXT_PUBLIC_PAYMASTER_POLICY_ID=
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MOCA_RPC=https://devnet-rpc.mocachain.org
```

### 3.2 Update `lib/contracts.js` (fallback addresses)

Open `lib/contracts.js` and update the fallback addresses in the CONTRACTS object:

```javascript
export const CONTRACTS = {
  CREDIT_ORACLE: process.env.NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS || '0x<YOUR_NEW_ORACLE_ADDRESS>',
  LENDING_POOL: process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS || '0x<YOUR_NEW_POOL_ADDRESS>',
  MOCK_USDC: process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || '0x<YOUR_NEW_USDC_ADDRESS>',
};
```

**Why update fallbacks?** If `.env.local` is missing, the app will still work with these addresses.

### 3.3 Update `backend/.env` (⚠️ CRITICAL FOR REWARDS!)

Open `backend/.env` and update the USDC contract address:

```bash
# Update USDC contract address for verification faucet
USDC_CONTRACT_ADDRESS=0x<YOUR_NEW_USDC_ADDRESS>
```

**Why this is CRITICAL:**
- The $50 USDC verification reward uses this address
- Without updating, users won't receive rewards after verification
- The transaction will fail silently with the old address

**Where to find this in backend/.env:**
- Search for `USDC_CONTRACT_ADDRESS` (around line 101)
- Replace with the new MockUSDC address from `deployed-addresses.json`

---

## Step 4: Restart All Services

### 4.1 Restart Backend

```bash
cd backend

# Kill existing process
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start backend
npm run dev

# Verify it's running
curl http://localhost:3001/health
```

**Expected Output:**
```json
{
  "status": "ok",
  "integration": {
    "partnerId": "954fe820...",
    "issuerDid": "did:air:id:test:...",
    "features": ["Partner JWT Generation", "Official AIR Kit Credentials", ...]
  },
  "credentials": {
    "total": 10
  }
}
```

### 4.2 Restart Frontend

```bash
cd Credo-Protocol

# Kill existing Next.js process
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start frontend
npm run dev

# Visit: http://localhost:3000
```

### 4.3 Verify ngrok (JWKS URL)

```bash
# Check ngrok is running
curl http://localhost:4040/api/tunnels

# Verify JWKS is accessible
curl https://YOUR_NGROK_URL/.well-known/jwks.json
```

---

## Step 5: Comprehensive Testing Checklist

### ✅ Phase 1: Login & Account Setup

- [ ] **Login via AIR Kit**
  - Test Google login
  - Test Email login
  - Verify smart account created
  - Check wallet address displayed

- [ ] **Get Test Tokens**
  - Get MOCA from faucet: https://devnet-scan.mocachain.org/faucet
  - Get MockUSDC from /faucet page (request 1000 USDC)
  - Verify balances show in dashboard

---

### ✅ Phase 2: Credential Issuance (All 10 Types)

Test each credential type individually:

#### Bank Balance Credentials:

- [ ] **Bank Balance - High** (150 pts)
  - Click "Build Credit" → Select credential
  - Verify "Preparing credential..." step
  - Verify "Issuing via AIR Kit..." step
  - Check no MOCA gas needed (gas sponsored)
  - Confirm success message
  - Check credit score increases by 150
  - Verify in AIR Kit Dashboard: https://developers.sandbox.air3.com/ → Issuer → Records

- [ ] **Bank Balance - Medium** (120 pts)
  - Same steps as above
  - Verify score increases by 120

- [ ] **Bank Balance - Low** (80 pts)
  - Verify score increases by 80

- [ ] **Bank Balance - Minimal** (40 pts)
  - Verify score increases by 40

#### Income Range Credentials:

- [ ] **Income Range - High** (180 pts)
  - Issue credential
  - Verify score increases by 180
  - Check Dashboard shows credential

- [ ] **Income Range - Medium** (140 pts)
- [ ] **Income Range - Low** (100 pts)
- [ ] **Income Range - Minimal** (50 pts)

#### Other Credentials:

- [ ] **CEX Trading History** (80 pts)
  - Verify credential fields match schema
  
- [ ] **Employment Verification** (70 pts)
  - Verify employment status field

---

### ✅ Phase 3: Credit Score Verification

- [ ] **Score Calculation**
  - Start with 0 score
  - Issue 1 credential → Check score increases
  - Issue 2nd credential → Verify score adds up
  - Issue 3+ credentials → Check cumulative score
  - Maximum test: Issue all 10 → Expect 1000+ points

- [ ] **Tier Assignment**
  - 0-199: Very Poor (Tier 7)
  - 200-299: Poor (Tier 6)
  - 300-449: Fair (Tier 5)
  - 450-599: Good (Tier 4)
  - 600-749: Very Good (Tier 3)
  - 750-899: Excellent (Tier 2)
  - 900+: Exceptional (Tier 1)

- [ ] **Dashboard Display**
  - Score shown correctly
  - Tier displayed
  - Credentials listed
  - Collateral ratio shown

---

### ✅ Phase 4: Lending Pool Operations

#### Supply Operations:

- [ ] **Supply USDC**
  - Go to Lending Pool tab
  - Enter amount (e.g., 100 USDC)
  - Click "Supply"
  - Approve USDC (if first time)
  - Confirm transaction
  - Verify supplied balance increases
  - Check available to borrow updates

#### Borrow Operations:

- [ ] **Borrow with High Credit Score (900+)**
  - Expected collateral ratio: 50% (Tier 1)
  - Supply 1000 USDC
  - Should be able to borrow up to 2000 USDC
  - Try borrowing 500 USDC
  - Verify borrow balance increases
  - Check health factor displayed

- [ ] **Borrow with Medium Credit Score (600-749)**
  - Expected collateral ratio: 75% (Tier 3)
  - Supply 1000 USDC
  - Should be able to borrow up to ~1333 USDC
  - Try borrowing 500 USDC

- [ ] **Borrow with Low Credit Score (300-449)**
  - Expected collateral ratio: 100% (Tier 5)
  - Supply 1000 USDC
  - Should be able to borrow up to 1000 USDC
  - Try borrowing 500 USDC

- [ ] **Over-Borrowing Prevention**
  - Try to borrow more than allowed
  - Should fail with "Insufficient collateral" error

#### Repay Operations:

- [ ] **Full Repayment**
  - Borrow some USDC
  - Click "Repay"
  - Repay full amount
  - Verify borrow balance = 0
  - Check available to borrow restored

- [ ] **Partial Repayment**
  - Borrow 1000 USDC
  - Repay 500 USDC
  - Verify borrow balance = 500 USDC

---

### ✅ Phase 5: MOCA Integration Features

- [ ] **Gas Sponsorship**
  - Issue credential without MOCA tokens
  - Verify transaction goes through
  - Check "Gas sponsored: true" in console

- [ ] **MCSP Storage**
  - After issuing credential
  - Check console log: "Stored on MCSP (decentralized storage)"
  - Verify in AIR Kit Dashboard

- [ ] **JWKS Validation**
  - Open browser console during credential issuance
  - Look for backend logs: "JWKS endpoint called"
  - Verify JWT validation works

- [ ] **Interoperability**
  - Go to AIR Kit Dashboard
  - Check credential appears
  - Verify it's stored with your Issuer DID
  - Confirm schema ID matches

---

### ✅ Phase 6: Error Handling & Edge Cases

- [ ] **Network Errors**
  - Disconnect internet
  - Try issuing credential
  - Should show error message
  - Reconnect and verify retry works

- [ ] **Insufficient Balance**
  - Try supplying more USDC than you have
  - Should show error

- [ ] **Duplicate Credentials**
  - Try issuing same credential twice
  - Both should succeed (credentials are additive)
  - Score should increase by weight each time

- [ ] **Backend Down**
  - Stop backend server
  - Try issuing credential
  - Should show connection error
  - Restart backend and verify works

- [ ] **Invalid Credential Data**
  - (This should not happen with current implementation)
  - AIR Kit validates against schemas

---

### ✅ Phase 7: User Experience

- [ ] **Loading States**
  - All operations show loading spinners
  - Progress indicators during credential issuance
  - No blank screens or freezes

- [ ] **Success Messages**
  - Credentials issued successfully
  - Supply/borrow/repay confirmations
  - Clear feedback for all actions

- [ ] **Error Messages**
  - Clear error descriptions
  - Helpful troubleshooting hints
  - No cryptic error codes

- [ ] **Responsive Design**
  - Test on desktop
  - Test on mobile (if applicable)
  - All buttons accessible
  - No layout breaks

---

### ✅ Phase 8: Data Consistency

- [ ] **Refresh Page**
  - Issue credentials
  - Refresh page
  - Verify credentials persist
  - Score should remain

- [ ] **Cross-Tab Sync**
  - Open app in 2 browser tabs
  - Issue credential in tab 1
  - Refresh tab 2
  - Verify score updates

- [ ] **Logout/Login**
  - Issue credentials
  - Logout from AIR Kit
  - Login again
  - Verify credentials still there
  - Score should persist

---

## 🎯 Success Criteria

Your system is fully functional if:

✅ **All 10 credential types** can be issued
✅ **Credit score** calculates correctly
✅ **Tier assignment** works based on score
✅ **Lending operations** respect credit-based collateral ratios
✅ **MOCA integration** (gas sponsorship, MCSP, AIR Kit Dashboard)
✅ **Error handling** is graceful
✅ **UI/UX** is smooth and responsive

---

## 🐛 Common Issues & Solutions

### Issue: "JWT verification failed"
**Solution**: 
- Check ngrok is running
- Verify JWKS URL in dashboard
- Restart backend

### Issue: "Incomplete Parameters"
**Solution**:
- Field names must match schema exactly
- Check backend logs for credential data
- Verify all required fields present

### Issue: "Insufficient collateral"
**Solution**:
- Check credit score is high enough
- Verify tier assignment
- Supply more USDC before borrowing

### Issue: Credentials don't appear in dashboard
**Solution**:
- Check AIR Kit Dashboard → Issuer → Records
- Verify issuer DID matches
- Check program ID is correct

---

## 📊 Testing Report Template

After testing, fill this out:

```
Testing Date: ___________
Tester: ___________

✅ Contracts Redeployed: [ ]
✅ All 10 Credentials Work: [ ]
✅ Credit Score Accurate: [ ]
✅ Lending Pool Works: [ ]
✅ MOCA Integration Complete: [ ]
✅ No Critical Bugs: [ ]

Issues Found:
1. ___________
2. ___________

Notes:
___________
```

---

## 🎉 Next Steps After Testing

Once all tests pass:

1. **Commit Changes**
   - Follow the git commit strategy provided
   - Ensure no secrets committed

2. **Update Documentation**
   - Add any findings to docs
   - Update README with new contract addresses

3. **Prepare Demo**
   - Record demo video
   - Prepare talking points
   - Test demo script

4. **Phase 6: Documentation & Demo**
   - Update README with MOCA features
   - Create demo script
   - Final polish

---

Good luck testing! 🚀

---

## 📝 Quick Reference Commands

**Redeploy Everything:**
```bash
# 1. Deploy contracts
cd contracts && npm run deploy:devnet

# 2. Register issuers
npx hardhat run --network moca-devnet scripts/register-deployer-issuer.ts

# 3. Copy addresses from deployed-addresses.json
cat deployed-addresses.json

# 4. Update .env.local (6 variables) and lib/contracts.js (3 fallbacks)

# 5. Restart backend
cd Credo-Protocol/backend
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
npm run dev

# 6. Restart frontend (new terminal)
cd Credo-Protocol
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
npm run dev
```

**Files to Update After Redeployment:**
1. `Credo-Protocol/.env.local` (6 variables)
2. `Credo-Protocol/lib/contracts.js` (3 fallback addresses)
3. **`Credo-Protocol/backend/.env` (1 variable: USDC_CONTRACT_ADDRESS)** ← CRITICAL FOR REWARDS
4. `Credo-Protocol/contracts/scripts/register-deployer-issuer.ts` (only if it has hardcoded address)

**Important Addresses to Update:**
- `NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS` / `NEXT_PUBLIC_CREDIT_SCORE_ORACLE`
- `NEXT_PUBLIC_LENDING_POOL_ADDRESS` / `NEXT_PUBLIC_LENDING_POOL`
- `NEXT_PUBLIC_MOCK_USDC_ADDRESS` / `NEXT_PUBLIC_USDC`
- **`USDC_CONTRACT_ADDRESS` (backend/.env)** ← CRITICAL FOR REWARDS

