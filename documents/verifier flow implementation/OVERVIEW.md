# $50 USDC Verification Faucet - Implementation Overview

**Quick Reference Guide**  
**Total Time:** 2.5-3 hours | **Difficulty:** Medium | **Feature:** User rewards verified employment with $50 USDC

---

## 🎯 What You're Building

A verification faucet where users verify employment credentials using zero-knowledge proofs and instantly receive $50 USDC.

**User Flow:**
```
Login → See "$50 USDC available" → Click verify → Prove employment (ZK) → Get $50 USDC → Show TX hash
```

---

## 📋 Phase-by-Phase Overview

### **Phase 1: Dashboard Setup** ⏱️ 30 mins
**Where:** AIR Kit Developer Dashboard  
**Goal:** Create verification program for EMPLOYMENT credentials

**What to Implement:**
- [ ] Access AIR Kit dashboard (`https://developer.moca.network`)
- [ ] Fund fee wallet with MOCA tokens
- [ ] Create verification program:
  - Name: "Employment Verification for $50 USDC"
  - Schema: EMPLOYMENT credential
  - Max age: 90 days
- [ ] Copy Program ID
- [ ] Set environment variables

**Output:**
```bash
# Frontend (.env.local)
NEXT_PUBLIC_VERIFIER_DID=did:moca:your-verifier-did
NEXT_PUBLIC_VERIFICATION_PROGRAM_ID=your-program-id

# Backend (.env)
VERIFIER_DID=did:moca:your-verifier-did
VERIFICATION_PRIVATE_KEY=your-private-key
USDC_CONTRACT_ADDRESS=0x... # MockUSDC address
```

**File:** `PHASE-1-DASHBOARD-SETUP.md`

---

### **Phase 2: Backend Service** ⏱️ 1 hour
**Where:** `backend/src/services/` and `backend/src/routes/`  
**Goal:** Build backend service that verifies and transfers USDC

**What to Implement:**

#### 1. Create `backend/src/services/verificationService.js`
```javascript
// 5 Functions to implement:

generateVerificationAuthToken(userId, email)
// → Creates JWT for AIR Kit authentication

prepareVerification({ userId, email, targetUserAddress, requiredCredentialType })
// → Prepares verification request, generates auth token

transferUSDC(toAddress, amount)
// → Transfers USDC via ERC20 contract (6 decimals!)
// → Uses ethers.js

processVerificationResult({ userAddress, verified, proofData, credentialType })
// → Processes verification result
// → If verified: transfers $50 USDC
// → Returns TX hash

checkClaimStatus(userAddress)
// → Checks if user already claimed (prevents double-claiming)
// → Uses in-memory Set
```

#### 2. Create `backend/src/routes/verification.js`
```javascript
// 3 API Routes to implement:

POST /api/verification/prepare
// → Body: { userId, email, targetUserAddress, requiredCredentialType }
// → Returns: { authToken, verifierDid, programId, reward: { amount: 50 } }

POST /api/verification/result
// → Body: { userAddress, verified, proofData, credentialType }
// → Returns: { verified, reward: { amount, token, txHash, claimed } }

GET /api/verification/claim-status/:address
// → Returns: { claimed: boolean, rewardAmount: 50, rewardToken: "USDC" }
```

#### 3. Register routes in `backend/src/server.js`
```javascript
const verificationRoutes = require('./routes/verification');
app.use('/api/verification', verificationRoutes);
```

**Key Points:**
- USDC has **6 decimals**, not 18! (`50 * 10**6`)
- Track claimed addresses in Set (in-memory for demo)
- Use `ethers.js` for USDC contract interaction

**File:** `PHASE-2-BACKEND-SERVICE.md`

---

### **Phase 3: Frontend Service** ⏱️ 45 mins
**Where:** `lib/verificationService.js`  
**Goal:** Create frontend service that integrates with AIR Kit

**What to Implement:**

#### Create `lib/verificationService.js`
```javascript
// 2 Functions to implement:

async verifyCredential({ targetUserAddress, requiredCredentialType, userInfo })
// → Step 1: Call backend /prepare
// → Step 2: Call AIR Kit verification (or simulate)
// → Step 3: Call backend /result
// → Returns: { success, verified, rewardClaimed, results }

async checkClaimStatus(userAddress)
// → Call backend /claim-status/:address
// → Returns: { claimed, rewardAmount, rewardToken }
```

**Features:**
- AIR Kit integration via `airService.verifyCredential()`
- Simulation fallback for demo mode
- Proper error handling
- Console logging for debugging

**Optional: Test Page**
```javascript
// Create pages/test-verification.js
// → Test claim flow
// → Check claim status
// → Verify USDC transfer
```

**File:** `PHASE-3-FRONTEND-SERVICE.md`

---

### **Phase 4: UI Integration** ⏱️ 1 hour
**Where:** `components/`  
**Goal:** Build beautiful UI components for reward claiming

**What to Implement:**

#### 1. Create `components/VerifyCredentialModal.jsx`
```javascript
// Verification modal component

Features:
- Shows "$50 USDC" reward prominently
- Displays EMPLOYMENT requirement
- "Start Verification" button
- Shows verification progress
- Displays results with TX hash
- Handles success/error states
```

#### 2. Create `components/RewardBanner.jsx`
```javascript
// Reward display banner component

// Unclaimed State (Blue):
🎁 Claim Your Free $50 USDC!
Verify employment and get $50 USDC instantly
🔐 Zero-knowledge proof keeps your job details private
[Verify & Claim $50] Button

// Claimed State (Green):
✅ Reward Claimed!
$50 USDC transferred to wallet
🎉 Free money secured!
Transaction: 0x1234... [View TX Link]
```

**Features:**
- Checks claim status on mount via `checkClaimStatus()`
- Opens modal when user clicks claim button
- Updates to claimed state after successful verification
- Shows transaction hash with blockchain explorer link
- Prevents double-claiming

#### 3. Integration
```javascript
// Add to pages/index.js or pages/dashboard.js

import RewardBanner from '@/components/RewardBanner';

<RewardBanner />
```

**File:** `PHASE-4-UI-INTEGRATION.md`

---

### **Phase 5: Documentation** ⏱️ 30 mins
**Where:** Documentation and testing  
**Goal:** Document, test, and prepare for buildathon demo

**What to Create:**

#### 1. README Section
```markdown
## 💰 Free $50 USDC via Employment Verification

Users verify employment → Get $50 USDC instantly!

### How It Works:
1. Login with AIR Kit
2. See "$50 USDC available to claim" banner
3. Click "Verify & Claim $50"
4. Verify employment (zero-knowledge proof)
5. $50 USDC transferred instantly
```

#### 2. Testing Guide
```bash
# Test Checklist:

Dashboard Setup:
- [ ] Verification program created
- [ ] Environment variables set
- [ ] Fee wallet funded

Backend:
- [ ] All 5 functions implemented
- [ ] All 3 API routes working
- [ ] USDC transfer successful
- [ ] Claim tracking prevents double-claims

Frontend:
- [ ] verifyCredential() working
- [ ] checkClaimStatus() working
- [ ] Simulation fallback works

UI:
- [ ] Unclaimed banner shows
- [ ] Modal opens and works
- [ ] Claimed banner shows after verification
- [ ] TX hash displayed and clickable
- [ ] No double-claiming allowed
```

#### 3. Demo Script (30 seconds)
```
Show: Dashboard with unclaimed reward
Say: "New users get $50 USDC free when they verify employment"

Show: Click verify, modal opens
Say: "Zero-knowledge proof protects privacy"

Show: Verification runs, $50 USDC transferred
Say: "$50 USDC instantly in wallet. That's Web3 done right."
```

#### 4. Buildathon Submission Checklist
- [ ] Code committed to GitHub
- [ ] README updated with feature
- [ ] Demo video recorded (30-45 seconds)
- [ ] Screenshots taken (unclaimed/claimed states)
- [ ] All tests passing

**File:** `PHASE-5-DOCUMENTATION.md`

---

## 🏗️ Technical Architecture Summary

```
┌─────────────────────────────────────────┐
│  Frontend (React/Next.js)               │
│  ├─ RewardBanner.jsx                    │
│  ├─ VerifyCredentialModal.jsx           │
│  └─ lib/verificationService.js          │
└─────────────────┬───────────────────────┘
                  │ HTTP API
                  ↓
┌─────────────────────────────────────────┐
│  Backend (Node.js/Express)              │
│  ├─ services/verificationService.js     │
│  │  ├─ generateVerificationAuthToken()  │
│  │  ├─ prepareVerification()            │
│  │  ├─ transferUSDC()                   │
│  │  ├─ processVerificationResult()      │
│  │  └─ checkClaimStatus()               │
│  └─ routes/verification.js              │
│     ├─ POST /prepare                    │
│     ├─ POST /result                     │
│     └─ GET /claim-status/:address       │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ↓                   ↓
┌───────────────┐   ┌──────────────┐
│   AIR Kit     │   │  Moca Chain  │
│  (ZK Proofs)  │   │ USDC Contract│
└───────────────┘   └──────────────┘
```

---

## 🔑 Key Implementation Details

### Credential Type
- **Name:** EMPLOYMENT
- **Requirement:** Any employment status
- **Max Age:** 90 days

### USDC Transfer
```javascript
// CRITICAL: USDC has 6 decimals, NOT 18!
const amount = 50 * 10**6;  // 50 USDC = 50,000,000 units
await usdcContract.transfer(userAddress, amount);
```

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/verification/prepare` | Start verification |
| POST | `/api/verification/result` | Process result + transfer USDC |
| GET | `/api/verification/claim-status/:address` | Check if claimed |

### Functions
| Function | Location | Purpose |
|----------|----------|---------|
| `generateVerificationAuthToken()` | Backend | Create JWT |
| `prepareVerification()` | Backend | Setup verification |
| `transferUSDC()` | Backend | Send USDC |
| `processVerificationResult()` | Backend | Verify + reward |
| `checkClaimStatus()` | Backend | Check claimed |
| `verifyCredential()` | Frontend | Run verification |
| `checkClaimStatus()` | Frontend | Check status |

### Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `VerifyCredentialModal.jsx` | Frontend | Verification modal |
| `RewardBanner.jsx` | Frontend | Reward display |

---

## ✅ Success Criteria

You'll know it's working when:
- [ ] User sees unclaimed $50 USDC reward
- [ ] Click "Verify & Claim" opens modal
- [ ] Verification runs (ZK proof)
- [ ] Employment credential verified
- [ ] $50 USDC transfers to wallet
- [ ] Banner shows "Claimed" with TX hash
- [ ] Refresh page shows claimed state
- [ ] No double-claiming possible

---

## 📊 Time Budget

| Phase | Time | Difficulty | Skippable? |
|-------|------|------------|------------|
| Phase 1: Dashboard | 30 min | Easy | ❌ No |
| Phase 2: Backend | 1 hour | Medium | ❌ No |
| Phase 3: Frontend | 45 min | Medium | ❌ No |
| Phase 4: UI | 1 hour | Medium | ⚠️ Can simplify |
| Phase 5: Docs | 30 min | Easy | ⚠️ If rushed |
| **Total** | **2.5-3 hours** | **Medium** | - |

---

## 🚀 Quick Start

1. **Read this overview** (5 mins)
2. **Start Phase 1:** Dashboard setup → `PHASE-1-DASHBOARD-SETUP.md`
3. **Follow sequentially:** Each phase links to the next
4. **Test after each phase:** Use checklists provided
5. **Demo when complete:** Follow Phase 5 demo script

---

## 💡 Why This Matters

**For Users:**
- 💰 Free $50 USDC instantly
- 🔐 Privacy preserved (ZK proof)
- ⚡ One-click process

**For Your Protocol:**
- 🎯 User acquisition strategy
- ✅ Verified user base
- 🏆 Full AIR Kit showcase

**For Buildathon:**
- 🚀 Clear value proposition
- 🔬 Technical depth (ZK proofs)
- 🎨 Production quality
- 📦 Complete implementation

---

## 📚 Document Links

- **[PHASE-1-DASHBOARD-SETUP.md](./PHASE-1-DASHBOARD-SETUP.md)** - AIR Kit dashboard setup
- **[PHASE-2-BACKEND-SERVICE.md](./PHASE-2-BACKEND-SERVICE.md)** - Backend service implementation
- **[PHASE-3-FRONTEND-SERVICE.md](./PHASE-3-FRONTEND-SERVICE.md)** - Frontend service layer
- **[PHASE-4-UI-INTEGRATION.md](./PHASE-4-UI-INTEGRATION.md)** - UI components
- **[PHASE-5-DOCUMENTATION.md](./PHASE-5-DOCUMENTATION.md)** - Testing & demo

---

**Ready to build? Start with Phase 1!** 🚀


