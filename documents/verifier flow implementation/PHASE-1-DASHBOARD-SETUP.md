# Phase 1: Dashboard Setup

**$50 USDC Faucet - Verification Program Setup**  
**Time Required:** ~30 minutes  
**Difficulty:** Easy  

---

## Goal

Create a verification program in the AIR Kit dashboard that verifies employment credentials. Users who verify get **$50 USDC instantly** - like a faucet!

**What You'll Accomplish:**
- ✅ Access AIR Kit dashboard as verifier
- ✅ Fund fee wallet for verification transactions
- ✅ Create "Employment Verification for $50 USDC" verification program
- ✅ Obtain verifier DID and program ID
- ✅ Configure environment variables

---

## What Is This?

A **verification program** defines what credentials users need to claim the $50 USDC:
- **What credentials:** EMPLOYMENT (any employment status)
- **What it proves:** User has valid employment credential
- **Who issued:** Your trusted issuer
- **How old:** Max 90 days

**Simple concept:** Verify employment → Get $50 USDC → One-time claim per user

---

## Step 1.1: Access AIR Kit Dashboard

### Actions:

1. **Navigate to Dashboard:**
   ```
   https://developers.sandbox.air3.com/
   ```

2. **Login:**
   - Connect with your deployer wallet (same one used for issuing)
   - Approve the connection

3. **Access Verifier Section:**
   - Navigate to **Account** → **General**
   - Locate your **Verifier DID**
   - Format: `did:moca:xxxxx...`
   - Copy and save this DID

### Expected Result:
```
✅ Logged into AIR Kit dashboard
✅ Verifier DID obtained: did:moca:xxxxx...
```

---

## Step 1.2: Fund Fee Wallet

### Why This Matters:

Verification transactions on Moca Chain require gas fees. The fee wallet pays for:
- ZK proof verification on-chain
- Writing verification results to blockchain
- Cryptographic operations

### Actions:

1. **Access Fee Wallet:**
   - Go to **Account** → **Fee Wallet**
   - Copy the fee wallet address shown

2. **Get MOCA Tokens:**
   - Visit: https://devnet-scan.mocachain.org/faucet
   - Paste your fee wallet address
   - Request tokens (usually gives 10 MOCA)

3. **Verify Balance:**
   - Return to AIR Kit dashboard
   - Check that fee wallet shows balance > 0
   - Recommended: At least 1 MOCA for testing

### Expected Result:
```
✅ Fee wallet funded with MOCA tokens
✅ Balance visible in dashboard: 10 MOCA
```

### Troubleshooting:

**Problem:** Faucet not working  
**Solution:** Try again in a few minutes, or ask in Moca Discord

**Problem:** Balance not showing  
**Solution:** Refresh the page, wait 30 seconds for blockchain confirmation

---

## Step 1.3: Create Verification Program

### Understanding the Setup:

We're creating a program that says:
> "To claim $50 USDC, user must have ANY EMPLOYMENT credential issued by our trusted issuer within the last 90 days."

### Actions:

1. **Navigate to Verifier:**
   - Click **"Verifier"** in left sidebar
   - Click **"Create Program"** button

2. **Basic Information:**
   ```
   Name: Employment Verification for $50 USDC
   Description: Verify employment to claim $50 USDC (one-time)
   ```

3. **Select Schema:**
   - Find your employment schema: **"Credo Employment Status"**
   - Or whatever employment credential schema you created

4. **Configure Verification Question:**

   **Question: Has Employment Credential**
   ```
   Field Name: bucket
   Operator: equals
   Value: EMPLOYMENT
   ```

   **Note:** This verifies user has ANY employment credential. We don't care about job title, salary, or employer - just that they're employed.
   
5. **Additional Settings:**
   ```
   Issuer DID: [Select your issuer DID]
   Max Credential Age: 90 days
   Allow Multiple Credentials: Yes
   ```

6. **Review and Save:**
   - Review all settings
   - Click **"Save"**
   - Click **"Apply Program"** (changes from Draft → Active)
   - Status should show: **"Active"**

7. **Copy Program ID:**
   - After saving, you'll see a **Program ID**
   - Format: Usually a UUID or hash
   - Copy and save this ID

### Expected Result:
```
✅ Verification program created
✅ Program status: Active
✅ Program ID obtained: abc123...
✅ Requirements: EMPLOYMENT credential
✅ Max age: 90 days
```

### Visual Guide:

```
┌──────────────────────────────────────────┐
│  Verification Program Dashboard           │
├──────────────────────────────────────────┤
│                                          │
│  Name: Employment Verification for $50   │
│  Status: 🟢 Active                       │
│                                          │
│  Requirements:                           │
│  • credential.bucket = "EMPLOYMENT"      │
│                                          │
│  Issuer: did:moca:your-issuer            │
│  Max Age: 90 days                        │
│                                          │
│  Program ID: abc123def456...             │
│                                          │
└──────────────────────────────────────────┘
```

---

## Step 1.4: Save Configuration

### Environment Variables:

You need to add the verifier configuration to both frontend and backend.

### Frontend Configuration:

Create or update `.env.local`:

```bash
# $50 USDC Verification Faucet
NEXT_PUBLIC_VERIFIER_DID=did:moca:your-verifier-did-here
NEXT_PUBLIC_VERIFICATION_PROGRAM_ID=your-program-id-here

# Reward Configuration
NEXT_PUBLIC_REWARD_AMOUNT=50
NEXT_PUBLIC_REWARD_TOKEN=USDC
```

### Backend Configuration:

Create or update `backend/.env`:

```bash
# $50 USDC Verification Faucet
VERIFIER_DID=did:moca:your-verifier-did-here
VERIFIER_PRIVATE_KEY=your-verifier-private-key-here
VERIFICATION_PROGRAM_ID=your-program-id-here

# Reward Configuration
REWARD_AMOUNT=50
USDC_CONTRACT_ADDRESS=0x... # Your MockUSDC contract address
TREASURY_PRIVATE_KEY=your-deployer-private-key # Wallet that holds USDC to distribute
```

### How to Get Verifier Private Key:

The verifier uses the same wallet as your issuer (your deployer wallet).

**Option 1: Export from MetaMask**
1. Open MetaMask
2. Click three dots → Account Details
3. Export Private Key
4. Copy the private key

**Option 2: Use existing issuer key**
- If `ISSUER_PRIVATE_KEY` is already set, use the same value
- `VERIFIER_PRIVATE_KEY = ISSUER_PRIVATE_KEY`

### Security Note:

⚠️ **Never commit `.env` files to git!**
- Private keys should stay private
- Add `.env*` to `.gitignore`
- Use different keys for production

---

## Phase 1 Complete! ✅

### Checklist:

Before moving to Phase 2, verify:

- [ ] Logged into AIR Kit dashboard
- [ ] Verifier DID obtained and saved
- [ ] Fee wallet funded (>1 MOCA)
- [ ] Verification program created
- [ ] Program name: "Employment Verification for $50 USDC"
- [ ] Program status: **Active** (not Draft)
- [ ] Program ID copied and saved
- [ ] Requirements configured (EMPLOYMENT credential)
- [ ] Max age set to 90 days
- [ ] `.env.local` updated with verifier config + reward amount
- [ ] `backend/.env` updated with verifier config + USDC address
- [ ] Private key securely stored
- [ ] USDC contract address obtained (your MockUSDC deployment)

### What You Accomplished:

You've set up the **verification infrastructure** that will:
1. Accept verification requests from your app
2. Check if users have EMPLOYMENT credentials
3. Generate zero-knowledge proofs
4. Return verified/failed results
5. Trigger $50 USDC transfer to verified users

### Expected Output:

```bash
# When you check your .env.local:
NEXT_PUBLIC_VERIFIER_DID=did:moca:0x1234...
NEXT_PUBLIC_VERIFICATION_PROGRAM_ID=abc-123-def-456
NEXT_PUBLIC_REWARD_AMOUNT=50
NEXT_PUBLIC_REWARD_TOKEN=USDC

# When you check backend/.env:
VERIFIER_DID=did:moca:0x1234...
VERIFIER_PRIVATE_KEY=0xabcd...
VERIFICATION_PROGRAM_ID=abc-123-def-456
REWARD_AMOUNT=50
USDC_CONTRACT_ADDRESS=0x...
TREASURY_PRIVATE_KEY=0xabcd...
```

---

## Testing Your Setup

### Quick Test:

1. **Check Dashboard:**
   - Program shows as "Active"
   - Fee wallet has balance
   - No errors visible

2. **Verify Environment Variables:**
   ```bash
   # In project root
   cat .env.local | grep VERIFIER
   
   # Expected output:
   # NEXT_PUBLIC_VERIFIER_DID=did:moca:...
   # NEXT_PUBLIC_VERIFICATION_PROGRAM_ID=...
   ```

3. **Backend Check:**
   ```bash
   # In backend folder
   cat .env | grep VERIFIER
   
   # Expected output:
   # VERIFIER_DID=did:moca:...
   # VERIFIER_PRIVATE_KEY=...
   # VERIFICATION_PROGRAM_ID=...
   ```

### Common Issues:

**Issue:** Can't find Verifier tab  
**Fix:** Make sure you're logged in with the correct wallet

**Issue:** Program won't activate  
**Fix:** Check that fee wallet has MOCA tokens

**Issue:** Don't see schemas  
**Fix:** Make sure you created schemas in previous phases (issuer setup)

---

## Next Steps

**Ready for Phase 2?**

Once all checkboxes above are ✅, you're ready to build the backend verification service.

**Phase 2 will:**
- Create verification service in backend
- Generate auth tokens for verification
- Handle verification results
- Transfer $50 USDC to verified users
- Track claimed rewards (prevent double-claiming)

**Time for Phase 2:** ~1 hour

➡️ **Continue to:** [PHASE-2-BACKEND-SERVICE.md](./PHASE-2-BACKEND-SERVICE.md)

---

## Quick Reference

### AIR Kit Dashboard URLs:

- **Sandbox Dashboard:** https://developers.sandbox.air3.com/
- **Faucet:** https://devnet-scan.mocachain.org/faucet
- **Docs:** https://docs.moca.network/airkit/usage/credential/verify

### Key Concepts:

- **Verifier DID:** Your identity as a verifier
- **Program ID:** Unique ID for this verification program
- **Fee Wallet:** Pays for verification transactions
- **Max Age:** How old credentials can be (90 days = recent)
- **EMPLOYMENT Credential:** Any valid employment status qualifies
- **$50 USDC Reward:** One-time claim per user (like a faucet)

### Configuration Summary:

```
Verification Program: Employment Verification for $50 USDC
Purpose: Reward verified users with $50 USDC (one-time)
Requirement: EMPLOYMENT credential (any employment status)
Issuer: Your trusted issuer
Max Age: 90 days
Status: Active
Reward: $50 USDC per verified user
```

---

**Phase 1 Complete! Ready to build the USDC faucet backend.** 🚀💰

