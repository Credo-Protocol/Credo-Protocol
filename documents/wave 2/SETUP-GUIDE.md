# 🚀 Credo Protocol - Quick Setup Guide

This guide will help you set up and run the Credo Protocol project after cloning.

## ✅ Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- A test wallet with some MOCA tokens (for deploying contracts)

## 📝 Step 1: Install Dependencies

Run these commands to install all dependencies:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install contract dependencies
cd contracts
npm install
cd ..
```

## 🔑 Step 2: Get Your Partner ID (Required)

The frontend needs a Partner ID from Moca's AIR Kit to enable Web3 SSO (Google/Email/Wallet login).

1. Visit https://developers.sandbox.air3.com/
2. Sign up or log in
3. Create a new project
4. Copy your Partner ID

## ⚙️ Step 3: Configure Environment Variables

### Frontend (.env.local)

Open `.env.local` in the root directory and update:

```bash
# Replace with your Partner ID from Step 2
NEXT_PUBLIC_PARTNER_ID=your_partner_id_here
```

**That's it!** The other values are pre-configured to use the already deployed contracts on Moca Devnet.

### Backend (backend/.env)

The `backend/.env` file is already configured with development keys. No changes needed!

### Contracts (contracts/.env)

**Option A: Use Existing Deployed Contracts (Recommended)**
- No changes needed! The contracts are already deployed on Moca Devnet.
- Skip to Step 4.

**Option B: Deploy Your Own Contracts**
1. Get a test wallet private key
2. Get MOCA tokens from https://devnet-scan.mocachain.org/faucet
3. Update `contracts/.env`:
   ```bash
   DEPLOYER_PRIVATE_KEY=your_private_key_here
   ```
4. Deploy:
   ```bash
   cd contracts
   npm run deploy:devnet
   ```
5. Copy the new contract addresses to `.env.local` in root directory

## 🎯 Step 4: Run the Application

Open **two terminal windows**:

### Terminal 1: Start Backend
```bash
cd backend
npm run dev
```
✅ Backend will run on http://localhost:3001

### Terminal 2: Start Frontend
```bash
npm run dev
```
✅ Frontend will run on http://localhost:3000

## 🪙 Step 5: Get Test Tokens

### MOCA Tokens (for gas fees)
1. Visit https://devnet-scan.mocachain.org/faucet
2. Enter your wallet address
3. Request test MOCA

### USDC Tokens (for testing the app)
1. Open http://localhost:3000/faucet
2. Click "Get Test USDC"
3. You'll receive 1,000 USDC for testing

## 🎮 Step 6: Test the Application

1. Visit http://localhost:3000
2. Click "Connect with Moca ID"
3. Login with Google or Email
4. Request credentials from the marketplace
5. Submit credentials to build your credit score
6. Try supplying and borrowing USDC

## 📊 Project Structure

```
Credo-Protocol/
├── .env.local              ← Frontend config (UPDATE PARTNER_ID)
├── backend/
│   └── .env                ← Backend config (already set)
├── contracts/
│   └── .env                ← Contract config (optional)
├── pages/                  ← Next.js pages
├── components/             ← React components
├── lib/                    ← Utilities and ABIs
└── docs/                   ← Documentation
```

## 🔗 Important Links

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Moca Faucet**: https://devnet-scan.mocachain.org/faucet
- **Block Explorer**: https://devnet-scan.mocachain.org
- **AIR Kit Docs**: https://docs.moca.network/airkit/quickstart
- **Partner Portal**: https://developers.sandbox.air3.com/

## 📋 Deployed Contracts (Moca Devnet)

You can use these existing contracts:

| Contract | Address |
|----------|---------|
| CreditScoreOracle | `0x73d361F5a7639d67657B497C89d78031713001ee` |
| LendingPool | `0x38c0EDF8f4e79481b40D82341ca8582D7a346DB4` |
| MockUSDC | `0x3FC426Bac14Ff9C697cB2B1C65E017E99e191C03` |

## 🧪 Testing

### Run Smart Contract Tests
```bash
cd contracts
npm test
```

### Run Integration Tests
```bash
node scripts/test-integration.js
```

## ❓ Troubleshooting

### "Invalid Partner ID" Error
- Make sure you've updated `NEXT_PUBLIC_PARTNER_ID` in `.env.local`
- Get your Partner ID from https://developers.sandbox.air3.com/

### Backend Not Responding
- Check if backend is running on port 3001
- Verify `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001` in `.env.local`

### Contract Interaction Fails
- Make sure you have MOCA tokens for gas fees
- Check that you're connected to Moca Chain Devnet (Chain ID: 5151)
- Verify contract addresses in `.env.local`

### Can't Get USDC
- Make sure you have MOCA tokens for gas fees first
- Try the faucet page: http://localhost:3000/faucet
- Or call the faucet function directly from the contract

## 📚 Next Steps

1. Read the [README.md](./README.md) for full project overview
2. Check [PRD.md](./PRD.md) for product vision
3. Explore [docs/](./docs/) for technical details
4. Review smart contracts in [contracts/contracts/](./contracts/contracts/)

## 🎯 Quick Recap

**Minimum Required Setup:**
1. ✅ Install dependencies (all 3 directories)
2. ✅ Get Partner ID from https://developers.sandbox.air3.com/
3. ✅ Update `NEXT_PUBLIC_PARTNER_ID` in `.env.local`
4. ✅ Start backend: `cd backend && npm run dev`
5. ✅ Start frontend: `npm run dev`
6. ✅ Get test tokens and start using the app!

---

**Need Help?** Check the troubleshooting section above or review the detailed documentation in the [README.md](./README.md).

**Built with ❤️ for Moca Chain**

