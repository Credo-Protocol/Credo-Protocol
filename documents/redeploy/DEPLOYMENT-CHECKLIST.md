# 📋 Smart Contract Deployment Checklist

Quick reference guide for deploying Credo Protocol contracts.

## ⚠️ Critical Steps (Don't Skip!)

Every time you deploy contracts, follow this order:

### 1. Deploy Contracts
```bash
cd contracts
npm run deploy:devnet
```

### 2. ⚠️ REGISTER ISSUERS (REQUIRED!)
```bash
npx hardhat run --network moca-devnet scripts/register-deployer-issuer.ts
```

**Why this is critical:**
- Without this step, ALL credential submissions will fail
- Error message: "missing revert data (action="estimateGas"...)"
- The Oracle contract requires issuers to be registered before accepting credentials

**What it does:**
- Registers deployer address as trusted issuer (trust score: 100)
- Registers all mock issuers (Exchange, Employer, Bank)
- Allows these addresses to submit credentials to the Oracle

### 3. Update Environment Variables

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS=<NEW_ORACLE_ADDRESS>
NEXT_PUBLIC_LENDING_POOL_ADDRESS=<NEW_POOL_ADDRESS>
NEXT_PUBLIC_MOCK_USDC_ADDRESS=<NEW_USDC_ADDRESS>
```

**Backend** (`backend/.env`):
```bash
CREDIT_ORACLE_ADDRESS=<NEW_ORACLE_ADDRESS>
LENDING_POOL_ADDRESS=<NEW_POOL_ADDRESS>
MOCK_USDC_ADDRESS=<NEW_USDC_ADDRESS>
```

### 4. Restart Services

```bash
# Restart backend
cd backend
npm run dev

# Restart frontend (in new terminal)
cd ..
npm run dev
```

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
- ✅ Issuers registered (deployer + 3 mock issuers)
- ✅ Environment variables updated
- ✅ Services restarted
- ✅ Can issue credentials successfully
- ✅ Credit score updates correctly

---

## 📚 Additional Resources

- Full deployment guide: `/documents/wave 3/PHASE4-DEPLOYMENT.md`
- Clean start guide: `/CLEAN-START-GUIDE.md`
- Contract README: `/contracts/README.md`

---

**Last Updated**: October 27, 2025  
**Current Deployment**: Moca Chain Devnet (Chain ID: 5151)

