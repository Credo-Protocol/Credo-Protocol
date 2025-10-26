# 🚀 Complete Clean Start Guide - Credo Protocol

This guide will help you redeploy all contracts and test the complete MOCA integration.

**Last Updated**: Phase 5.3 Complete (October 26, 2025)

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
cd /Users/marcus/Projects/Credo-Protocol

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

# Deploy contracts
npm run deploy

# This will:
# ✅ Deploy CreditScoreOracle
# ✅ Deploy LendingPool
# ✅ Deploy MockUSDC
# ✅ Register credential types
# ✅ Enable USDC in lending pool
# ✅ Save addresses to deployed-addresses.json
```

**Expected Output:**
```
🎉 DEPLOYMENT COMPLETE!
📋 Contract Addresses:
   CreditScoreOracle: 0x...
   LendingPool:       0x...
   MockUSDC:          0x...
```

---

## Step 3: Update All Environment Variables

### 3.1 Update Frontend `.env.local`

```bash
cd /Users/marcus/Projects/Credo-Protocol

# Open .env.local and update these lines:
```

Update with your **new contract addresses** from Step 2:

```bash
# Smart Contract Addresses (UPDATE THESE!)
NEXT_PUBLIC_CREDIT_SCORE_ORACLE=0xYOUR_NEW_ORACLE_ADDRESS
NEXT_PUBLIC_LENDING_POOL=0xYOUR_NEW_POOL_ADDRESS
NEXT_PUBLIC_USDC=0xYOUR_NEW_USDC_ADDRESS

# Keep these from Phase 5.1-5.3
NEXT_PUBLIC_PARTNER_ID=954fe820-050d-49fb-b22e-884922aa6cef
NEXT_PUBLIC_ISSUER_DID=did:air:id:test:4P3gyKQFs7SYu1XBDirLU7WhJqRgDHHuKbfVuGTwun
NEXT_PUBLIC_VERIFIER_DID=did:key:81eGFbL7uQGFjvbTMAyQv4XtzTv7w7JLpevwLDRtenKt6i4z8sgsuAPwGJaXrBBZUgRbfFC13mXE2QVMDffs1KScqF
NEXT_PUBLIC_PAYMASTER_POLICY_ID=
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MOCA_RPC=https://rpc.testnet.mocachain.org
```

### 3.2 Update `lib/contracts.js` (if needed)

Check if contract addresses are hardcoded anywhere:

```bash
grep -r "0x82Adc" lib/ components/ pages/ hooks/
```

If found, update to use env variables instead.

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
cd /Users/marcus/Projects/Credo-Protocol

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

