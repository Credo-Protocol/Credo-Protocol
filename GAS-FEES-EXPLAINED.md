# Gas Fees Explained - Credo Protocol

## 🎯 TL;DR

**DEVNET (Current):** AIR Kit sponsors ALL transactions automatically - users can transact with 0 balance  
**MAINNET (Future):** Users pay gas with USDC/MOCA tokens (no native gas tokens needed!)

---

## 📋 Gas Payment Mechanisms

### 🔧 SANDBOX/DEVNET Environment (Current)

**What's happening:**
- ✅ **All transactions are sponsored** by AIR Kit automatically
- ✅ **Smart account deployment is FREE**
- ✅ **Users need 0 MOCA, 0 USDC, 0 anything** to transact
- ✅ **Development convenience** - no need to manage gas during testing

**Why:**
- Makes development and testing frictionless
- No need to fund test accounts with gas tokens
- Focus on building, not on gas management

**Environment Setting:**
```javascript
// lib/airkit.js
export const airService = new AirService({
  partnerId: process.env.NEXT_PUBLIC_PARTNER_ID,
  env: BUILD_ENV.SANDBOX, // ← This enables auto-sponsorship
});
```

---

### 🚀 PRODUCTION/MAINNET Deployment (Future)

When deploying to mainnet, you have **three options**:

#### Option 1: ERC-20 Paymaster (DEFAULT - Recommended)

**How it works:**
- Users pay gas fees using **ERC-20 tokens** (USDC, MOCA, USDT, etc.)
- Gas automatically deducted from smart account balance
- **No native MOCA gas tokens required!**
- AIR Kit handles the conversion behind the scenes

**User Experience:**
- User has 100 USDC in their smart account
- Makes a transaction that costs 0.01 MOCA gas
- AIR Kit automatically converts ~0.01 USDC and pays the gas
- User never sees gas tokens, just signs the transaction

**Configuration:**
```bash
# .env.local
NEXT_PUBLIC_PAYMASTER_POLICY_ID=  # Leave empty for ERC-20 Paymaster
```

**Pros:**
- ✅ No need for users to hold native gas tokens
- ✅ Seamless UX (users don't think about gas)
- ✅ Works automatically without configuration
- ✅ No additional costs for developers

**Cons:**
- ⚠️ Users need SOME token balance (USDC/MOCA)
- ⚠️ Small gas fees still apply

---

#### Option 2: Sponsored Paymaster (OPTIONAL - Custom Policy)

**How it works:**
- **You (developer) pay ALL gas fees** for your users
- Completely free transactions for users
- Set spending limits and allowlists
- Configure budgets in AIR Kit Dashboard

**User Experience:**
- User has 0 balance in their account
- Makes a transaction
- Your paymaster policy pays the gas
- Transaction completes - user pays nothing

**Configuration:**
```bash
# .env.local
NEXT_PUBLIC_PAYMASTER_POLICY_ID=your_policy_id_here
```

**Setup:**
1. Go to AIR Kit Dashboard → Account → Paymaster
2. Contact Moca team to create a paymaster policy
3. Configure spending limits (daily/weekly/monthly)
4. Set allowlists (specific contracts or functions)
5. Fund your policy wallet
6. Copy the Policy ID to `.env.local`

**Pros:**
- ✅ **Zero-cost** transactions for users
- ✅ Perfect for onboarding (no barriers)
- ✅ Can sponsor specific actions (e.g., credential issuance only)

**Cons:**
- ⚠️ You pay all gas fees
- ⚠️ Requires setup and funding
- ⚠️ Need to manage budgets

---

#### Option 3: Standard Gas Payment (NOT RECOMMENDED)

**How it works:**
- Users pay gas fees using **native MOCA tokens**
- Traditional blockchain experience
- Users must acquire MOCA specifically for gas

**User Experience:**
- User needs MOCA tokens in their wallet
- Makes a transaction
- MOCA is deducted as gas fee
- Traditional Web3 UX

**Configuration:**
- Don't use AIR Kit paymaster features

**Pros:**
- ✅ Simple (traditional model)
- ✅ No developer costs

**Cons:**
- ❌ Users need to acquire native gas tokens
- ❌ Poor UX (extra friction)
- ❌ Not recommended for Credo Protocol

---

## 🔍 How to Tell Which Mode You're In

Check your browser console when the app initializes:

### DEVNET (Sandbox Sponsorship):
```
🔧 SANDBOX/DEVNET Mode: AIR Kit sponsors all transactions for development
   (On mainnet: users will pay gas with USDC/MOCA via ERC-20 Paymaster)
   To enable SPONSORED mode on mainnet: Set NEXT_PUBLIC_PAYMASTER_POLICY_ID
✅ AIR Kit initialized successfully
```

### MAINNET with ERC-20 Paymaster:
```
💳 ERC-20 Paymaster Mode: Users pay gas with USDC/MOCA from their balance
   (No native MOCA gas tokens needed - AIR Kit handles conversion automatically)
   To enable SPONSORED mode: Set NEXT_PUBLIC_PAYMASTER_POLICY_ID in .env.local
✅ AIR Kit initialized successfully
```

### MAINNET with Sponsored Paymaster:
```
✅ SPONSORED Gas Mode: You pay all gas fees for users (completely free)
✅ AIR Kit initialized successfully
```

---

## 💡 Recommendations for Credo Protocol

### For Development (Current):
- ✅ Keep using SANDBOX environment
- ✅ Enjoy free transactions
- ✅ Focus on features, not gas management

### For Mainnet Launch:
1. **Start with ERC-20 Paymaster** (Option 1)
   - No setup required
   - Users pay their own gas with USDC/MOCA
   - Sustainable long-term

2. **Consider Sponsored Paymaster for onboarding** (Option 2)
   - Sponsor ONLY credential issuance
   - Set monthly budget ($100-500)
   - Makes onboarding friction-free
   - Users can still pay for lending/borrowing transactions

3. **Hybrid Approach** (Best of both worlds)
   - Sponsor: Credential issuance, first transaction
   - ERC-20 Paymaster: Lending, borrowing, repaying
   - Smooth onboarding + sustainable costs

---

## 📚 Additional Resources

- **Moca Paymaster Docs:** https://docs.moca.network/airkit/usage/account/paymaster
- **AIR Kit Dashboard:** https://developers.sandbox.air3.com/
- **Credo Protocol Setup:** See `.env.local` comments

---

## ❓ FAQ

### Q: Why can I sign transactions with 0 balance on devnet?
**A:** DEVNET uses SANDBOX environment where AIR Kit automatically sponsors all transactions for development convenience.

### Q: Will this work the same on mainnet?
**A:** No. On mainnet, you'll need to choose a gas payment strategy (ERC-20 Paymaster or Sponsored Paymaster).

### Q: Do users need MOCA tokens?
**A:** Not with ERC-20 Paymaster! They can pay gas with USDC, MOCA, or other supported tokens. No need to acquire native gas tokens.

### Q: How much does sponsorship cost?
**A:** Depends on transaction volume and gas prices. Budget $50-500/month for a small protocol. Set spending limits in AIR Kit Dashboard.

### Q: Can I sponsor some transactions but not others?
**A:** Yes! Configure allowlists in your paymaster policy to sponsor specific contracts or function selectors.

### Q: What happens if my paymaster runs out of funds?
**A:** Transactions gracefully fall back to ERC-20 Paymaster (users pay with their own tokens).

---

**Last Updated:** October 29, 2025  
**Environment:** SANDBOX (Devnet)  
**Status:** All transactions sponsored by AIR Kit

