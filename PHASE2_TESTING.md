# Phase 2 Testing Guide - Credo Protocol

## ✅ Phase 2 Complete!

You've successfully built the complete **Backend + Frontend Integration** for Credo Protocol!

### What's Been Built:

1. **Backend (Port 3001)** ✅
   - Mock credential issuer service
   - Three issuers: Exchange, Employer, Bank
   - EIP-191 signature verification
   - API endpoints for credential issuance

2. **Frontend (Next.js)** ✅
   - Dashboard with credit score display
   - Credential marketplace
   - Request/submit credential flow
   - Smart contract integration
   - Wallet connection (MetaMask)

3. **Smart Contract Integration** ✅
   - CreditScoreOracle contract calls
   - Credential submission
   - Score fetching
   - Moca Chain Devnet configuration

---

## 🧪 Testing the End-to-End Flow

### Prerequisites

1. **MetaMask Extension** installed in your browser
2. **Moca Chain Devnet** added to MetaMask:
   - Chain ID: `5151` (0x141F)
   - RPC URL: `http://devnet-rpc.mocachain.org`
   - Currency Symbol: `MOCA`

3. **Test Wallet** with MOCA tokens
   - Your deployer address: `0x32F91E4E2c60A9C16cAE736D3b42152B331c147F`
   - Should have ~1.0 MOCA remaining

### Step 1: Start the Servers

```bash
# Terminal 1: Backend (already running)
cd backend
npm start
# Should show: "🚀 Credo Protocol Backend Server on port 3001"

# Terminal 2: Frontend
cd /Users/marcus/Projects/credoprotocol
npm run dev
# Should show: "ready - started server on 0.0.0.0:3000"
```

### Step 2: Access the Dashboard

1. Open browser to: `http://localhost:3000`
2. You should see the Credo Protocol landing page
3. Click **"Connect Wallet"**

### Step 3: Connect Your Wallet

1. MetaMask will pop up requesting connection
2. Select your test account
3. Approve the connection
4. MetaMask may prompt you to switch to Moca Chain Devnet
   - Click "Switch Network" if prompted
   - Or manually switch to Moca Chain Devnet in MetaMask

### Step 4: View Your Dashboard

After connecting, you should see:

- **Credit Score Card**: Shows 0 (if no credentials yet)
- **Collateral Factor**: Shows 150% (default for score 0)
- **Network Info**: Shows "Moca Chain Devnet"
- **Credential Marketplace**: Shows 3 available credentials

### Step 5: Request Your First Credential

1. Scroll down to "Build Your Credit Score" section
2. Choose a credential (e.g., **"Mock Bank"** - highest points +100)
3. Click **"Request Credential"**

**Modal Flow:**
1. **Step 1**: Shows credential info → Click "Connect & Verify"
2. **Step 2**: Backend issues credential (loading spinner)
3. **Step 3**: Shows ✓ Credential verified → Click "Submit to Update Score"
4. **Step 4**: MetaMask pops up → Confirm transaction
5. **Step 5**: Shows 🎉 Success animation
6. Modal closes automatically

### Step 6: Verify Score Update

- Your credit score should now show: **~580-650** (depending on credential)
- Credential count should show: **1**
- Collateral factor should improve (e.g., 100% or better)
- Last updated should show today's date

### Step 7: Request Additional Credentials

Repeat Step 5 for the other two credentials:
- **Mock Employer** (+70 points)
- **Mock CEX** (+80 points)

After all three credentials:
- **Expected Score**: ~750-850
- **Collateral Factor**: 75-90%
- **Credential Count**: 3

---

## 📊 Expected Behavior

### Credit Score Calculation

The smart contract calculates scores based on:

| Credential | Base Points | Issuer Trust | Recency | Total (approx) |
|-----------|-------------|--------------|---------|----------------|
| Mock Bank (Stable Balance) | 100 | ×100% | ×100% | +100 |
| Mock CEX (Trading History) | 80 | ×100% | ×100% | +80 |
| Mock Employer (Employment) | 70 | ×100% | ×100% | +70 |
| **Base Score** | | | | 500 |
| **Diversity Bonus** | | | | +5% per type |
| **Total with 3 creds** | | | | **~750-850** |

### Collateral Factor by Score

| Score Range | Collateral Factor | Meaning |
|------------|-------------------|---------|
| 900+ | 50% | Borrow $100 with $50 |
| 800-899 | 60% | Borrow $100 with $60 |
| 700-799 | 75% | Borrow $100 with $75 |
| 600-699 | 90% | Borrow $100 with $90 |
| 500-599 | 100% | Borrow $100 with $100 |
| 0-499 | 110-150% | Over-collateralized |

---

## 🔍 Debugging

### Backend Not Responding

```bash
# Check if backend is running
curl http://localhost:3001/health

# Should return:
# {"status":"ok","issuers":[...]}
```

### Frontend Not Loading

```bash
# Check Next.js server
curl http://localhost:3000

# Check for errors in terminal
npm run dev
```

### Wallet Connection Issues

1. **Wrong Network**: Switch to Moca Chain Devnet in MetaMask
2. **No MOCA**: You need gas for transactions
3. **Rejected Transaction**: Try again with higher gas

### Contract Call Failures

```bash
# Verify contract is deployed
# Check .env.local has correct addresses

# Test contract call manually
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('http://devnet-rpc.mocachain.org');
const oracle = new ethers.Contract(
  '0xb7a66cda5A21E3206f0Cb844b7938790D6aE807c',
  ['function getCreditScore(address) view returns (uint256)'],
  provider
);
oracle.getCreditScore('YOUR_ADDRESS').then(console.log);
"
```

### Backend API Errors

Check backend logs for detailed error messages:
```bash
# Backend terminal should show:
[2025-10-12T...] POST /api/credentials/request
[Mock Bank] Issuing credential for 0x...
[Mock Bank] Credential issued successfully
```

---

## 🎯 Success Criteria

### ✅ Phase 2 is complete when:

1. [ ] Backend starts without errors
2. [ ] Frontend loads and shows dashboard
3. [ ] Wallet connects to Moca Chain Devnet
4. [ ] Can fetch credit score from contract (initially 0)
5. [ ] Can request credential from backend
6. [ ] Backend signs credential successfully
7. [ ] Can submit credential to smart contract
8. [ ] MetaMask confirms transaction
9. [ ] Credit score updates on-chain
10. [ ] Dashboard refreshes with new score

---

## 📝 Manual Test Checklist

Run through this checklist:

```
[ ] Backend health check returns OK
[ ] Frontend loads at localhost:3000
[ ] Connect wallet button works
[ ] MetaMask connection succeeds
[ ] Dashboard shows credit score card
[ ] Credential marketplace displays 3 cards
[ ] Click "Request Credential" opens modal
[ ] "Connect & Verify" calls backend API
[ ] Backend returns signed credential
[ ] "Submit to Update Score" triggers MetaMask
[ ] Transaction gets mined successfully
[ ] Success animation shows
[ ] Dashboard refreshes automatically
[ ] New score appears on card
[ ] Can request second credential
[ ] Score increases correctly
[ ] Can request third credential
[ ] Final score ~750-850 range
```

---

## 🚀 Next Steps After Testing

Once Phase 2 is verified working:

### Phase 3: Production Features
1. Real credential issuers (Plaid, OAuth integrations)
2. Zero-knowledge proof implementation
3. Lending pool functionality (supply/borrow)
4. Liquidation mechanism
5. Interest calculations
6. Position management UI

### Deployment
1. Deploy backend to Railway/Render/Heroku
2. Deploy frontend to Vercel
3. Update environment variables
4. Test on production URLs

---

## 🆘 Need Help?

If something isn't working:

1. **Check the logs** in both terminals (backend + frontend)
2. **Open browser console** (F12) for frontend errors
3. **Verify environment variables** in `.env.local`
4. **Check MetaMask** is on Moca Chain Devnet
5. **Ensure contracts are deployed** (check deployed-addresses.json)

---

## 🎉 Congratulations!

If you've made it through all the steps successfully, you've just completed a full-stack Web3 application with:

- Smart contracts on Moca Chain ✅
- Backend credential issuance ✅
- Frontend React UI ✅
- Wallet integration ✅
- On-chain credit scoring ✅

**This is a working MVP for the Moca Chain Hackathon!** 🚀

---

## 📸 Screenshot Checklist for Demo

Capture these screens for your submission:

1. Dashboard showing 0 score (before credentials)
2. Credential marketplace with 3 cards
3. Request credential modal
4. MetaMask transaction confirmation
5. Success animation
6. Updated score on dashboard (after 1 credential)
7. Final dashboard with all 3 credentials (~750+ score)
8. Browser console showing no errors

---

**Happy Testing!** 🎊

