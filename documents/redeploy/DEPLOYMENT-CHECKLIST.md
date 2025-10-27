# 📋 Smart Contract Deployment Checklist

Quick reference guide for deploying Credo Protocol contracts.

## ⚠️ Critical Steps (Don't Skip!)

Every time you deploy contracts, follow this order:

### 1. Deploy Contracts
```bash
cd contracts
npm run deploy:devnet
```

**What this does:**
- Deploys CreditScoreOracle v2 to Moca Chain Devnet
- Deploys LendingPool v2 (with interest accrual)
- Deploys MockUSDC (test token)
- Registers all 11 credential types
- Enables USDC in lending pool
- Saves addresses to `deployed-addresses.json`

### 2. ⚠️ REGISTER ISSUERS (REQUIRED!)
```bash
cd contracts
npx hardhat run --network moca-devnet scripts/register-deployer-issuer.ts
```

**IMPORTANT:** The script will automatically read the new Oracle address from `deployed-addresses.json`

**Why this is critical:**
- Without this step, ALL credential submissions will fail
- Error message: "missing revert data (action="estimateGas"...)"
- The Oracle contract requires issuers to be registered before accepting credentials

**What it does:**
- Registers deployer address as trusted issuer (trust score: 100)
- Registers all mock issuers (Exchange, Employer, Bank)
- Allows these addresses to submit credentials to the Oracle

### 3. Update Environment Variables

Get the new addresses from `contracts/deployed-addresses.json` and update:

**Frontend** (`.env.local`):
```bash
# Update these 6 lines with NEW addresses from deployed-addresses.json:
NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS=0x<NEW_ORACLE_ADDRESS>
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x<NEW_POOL_ADDRESS>
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x<NEW_USDC_ADDRESS>

# Legacy names (update these too for backward compatibility):
NEXT_PUBLIC_CREDIT_SCORE_ORACLE=0x<NEW_ORACLE_ADDRESS>
NEXT_PUBLIC_LENDING_POOL=0x<NEW_POOL_ADDRESS>
NEXT_PUBLIC_USDC=0x<NEW_USDC_ADDRESS>
```

**lib/contracts.js** (fallback addresses):
Update the fallback addresses in the CONTRACTS object:
```javascript
export const CONTRACTS = {
  CREDIT_ORACLE: process.env.NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS || '0x<NEW_ORACLE_ADDRESS>',
  LENDING_POOL: process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS || '0x<NEW_POOL_ADDRESS>',
  MOCK_USDC: process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || '0x<NEW_USDC_ADDRESS>',
};
```

**Backend** (`backend/.env`):
No contract addresses needed - backend uses private keys only

### 4. Restart Services

**Terminal 1 - Backend:**
```bash
cd backend
# Kill existing process if running
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
# Start backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd Credo-Protocol
# Kill existing process if running
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
# Start frontend
npm run dev
```

**Verify services are running:**
- Backend: `curl http://localhost:3001/health`
- Frontend: Visit http://localhost:3000

### 5. Test Integration

```bash
# 1. Login with AIR Kit
# 2. Request a credential
# 3. Verify it issues successfully
# 4. Check credit score updates
```

---

## 🔧 Troubleshooting

### Error: "missing revert data"
**Cause**: Issuers not registered on the Oracle contract  
**Solution**: Run the issuer registration script (Step 2 above)

### Error: "Invalid address"
**Cause**: Environment variables not updated  
**Solution**: Update all .env files with new contract addresses

### Error: "Call exception"
**Cause**: Wrong contract address or network mismatch  
**Solution**: Verify you're on correct network and addresses match deployed-addresses.json

---

## 📝 Verification (Optional)

After deployment, verify contracts on explorer:

```bash
npx hardhat verify --network moca-devnet <ORACLE_ADDRESS>
npx hardhat verify --network moca-devnet <POOL_ADDRESS> <ORACLE_ADDRESS>
npx hardhat verify --network moca-devnet <USDC_ADDRESS>
```

---

## 🎯 Success Criteria

Your deployment is complete when:
- ✅ All 3 contracts deployed
- ✅ `deployed-addresses.json` updated with new addresses
- ✅ Issuers registered (deployer + 3 mock issuers - script checks this)
- ✅ `.env.local` updated (6 contract address variables)
- ✅ `lib/contracts.js` fallback addresses updated
- ✅ Backend service running on port 3001
- ✅ Frontend service running on port 3000
- ✅ Can login with AIR Kit
- ✅ Can issue credentials successfully
- ✅ Credit score updates correctly
- ✅ Can supply/borrow/repay in lending pool

---

## 📚 Additional Resources

- Full deployment guide: `/documents/wave 3/PHASE4-DEPLOYMENT.md`
- Clean start guide: `/CLEAN-START-GUIDE.md`
- Contract README: `/contracts/README.md`

---

**Last Updated**: October 27, 2025 (Verified Working)  
**Current Deployment**: Moca Chain Devnet (Chain ID: 5151)  
**Deployment Script**: `contracts/scripts/deploy.ts`  
**Network Config**: `contracts/hardhat.config.ts`

