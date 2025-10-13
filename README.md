# Credo Protocol

**Decentralized Trust for Capital on Moca Chain**

An identity-backed DeFi lending protocol that enables undercollateralized loans based on verifiable credentials and on-chain credit scores. Built for the Moca Chain Hackathon.

[![Moca Chain](https://img.shields.io/badge/Moca_Chain-Devnet-blue)](https://devnet-scan.mocachain.org)
[![Status](https://img.shields.io/badge/Status-MVP_Complete-success)]()
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎯 Vision

Transform DeFi lending from **asset-backed** to **identity-backed**, making capital accessible based on merit and reputation, not just existing wealth.

## ✨ Key Features

- **🔐 Identity-Based Lending** - Borrow based on verifiable credentials, not just collateral
- **⚡ Dynamic Collateral** - 50-150% collateral requirements based on credit score (vs 150% standard DeFi)
- **🎫 Moca ID Login** - Seamless Web3 SSO via AIR Account Services (Google/Email/Wallet)
- **📊 On-Chain Credit Scores** - Transparent scoring algorithm (0-1000 scale)
- **🔒 Privacy-Preserving** - Zero-Knowledge Proof framework for sensitive data

## 🚀 Live Demo

**Frontend**: [Coming Soon - Deployment in Progress]  
**Smart Contracts** (Moca Chain Devnet):
- 📝 CreditScoreOracle: [`0x73d361F5a7639d67657B497C89d78031713001ee`](https://devnet-scan.mocachain.org/address/0x73d361F5a7639d67657B497C89d78031713001ee)
- 💰 LendingPool: [`0x38c0EDF8f4e79481b40D82341ca8582D7a346DB4`](https://devnet-scan.mocachain.org/address/0x38c0EDF8f4e79481b40D82341ca8582D7a346DB4)
- 🪙 MockUSDC: [`0x3FC426Bac14Ff9C697cB2B1C65E017E99e191C03`](https://devnet-scan.mocachain.org/address/0x3FC426Bac14Ff9C697cB2B1C65E017E99e191C03)

## 📋 How It Works

```
1️⃣ Login with Moca ID (Google/Email/Wallet) → 2️⃣ Request Verifiable Credentials 
→ 3️⃣ Build Credit Score On-Chain → 4️⃣ Borrow with Better Terms
```

**Example**: User with credit score 750 can borrow $100 with only $75 collateral (vs. $150 in traditional DeFi)

## 🏗️ Project Structure

This is a **multi-part monorepo** with three main components:

```
credoprotocol/
├── contracts/          # Solidity smart contracts (Hardhat)
│   ├── CreditScoreOracle.sol
│   ├── LendingPool.sol
│   └── MockUSDC.sol
├── backend/            # Mock credential issuer service (Express)
│   └── src/
│       ├── issuers/    # CEX, Employer, Bank issuers
│       └── routes/     # Credential API
├── components/         # React UI components
├── pages/              # Next.js pages (Frontend)
├── lib/                # Utilities & contract ABIs
├── hooks/              # React hooks (AIR Kit integration)
└── docs/               # Detailed documentation
```

## 🛠️ Tech Stack

**Frontend**
- Next.js 15 + React 19
- Tailwind CSS + shadcn/ui
- Ethers.js v6
- Moca AIR Kit SDK

**Smart Contracts**
- Solidity 0.8.x
- Hardhat
- OpenZeppelin v5

**Backend**
- Node.js + Express
- EIP-191 Signature Verification

**Blockchain**
- Moca Chain Devnet (Chain ID: 5151)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### 1. Clone Repository

```bash
git clone https://github.com/YourUsername/credoprotocol.git
cd credoprotocol
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

**Contracts:**
```bash
cd contracts
npm install
```

### 3. Environment Setup

**Frontend** (`.env.local`):
```bash
# AIR Kit (Get from https://developers.sandbox.air3.com/)
NEXT_PUBLIC_PARTNER_ID=your_partner_id

# Deployed Contracts (Moca Devnet)
NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS=0x73d361F5a7639d67657B497C89d78031713001ee
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x38c0EDF8f4e79481b40D82341ca8582D7a346DB4
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x3FC426Bac14Ff9C697cB2B1C65E017E99e191C03

# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

**Backend** (`backend/.env`):
```bash
# Mock Issuer Private Keys (For Development Only)
MOCK_EXCHANGE_PRIVATE_KEY=0x...
MOCK_EMPLOYER_PRIVATE_KEY=0x...
MOCK_BANK_PRIVATE_KEY=0x...

# Moca Chain
RPC_URL=http://devnet-rpc.mocachain.org
```

**Contracts** (`contracts/.env`):
```bash
# Moca Chain Devnet
MOCA_DEVNET_RPC=http://devnet-rpc.mocachain.org
PRIVATE_KEY=your_private_key
```

### 4. Run the Application

**Start Backend** (Terminal 1):
```bash
cd backend
npm run dev
# → Running on http://localhost:3001
```

**Start Frontend** (Terminal 2):
```bash
npm run dev
# → Running on http://localhost:3000
```

**Access**: Open http://localhost:3000

### 5. Get Test Tokens

1. Visit the [Moca Devnet Faucet](https://devnet-scan.mocachain.org/faucet)
2. Get test MOCA for gas fees
3. In the app, visit `/faucet` to get test USDC

## 🧪 Testing

**Smart Contracts:**
```bash
cd contracts
npm test
```

**Integration Tests:**
```bash
node scripts/test-integration.js
```

**Manual Testing Guide:**
See [`docs/TESTING-GUIDE.md`](./docs/TESTING-GUIDE.md) for comprehensive test scenarios

## 📚 Documentation

- **[PRD.md](./PRD.md)** - Product vision & hackathon plan
- **[docs/OVERVIEW.md](./docs/OVERVIEW.md)** - Technical architecture (670+ lines)
- **[docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md)** - Implementation guide (1,900+ lines)
- **[docs/PHASE1-4.md](./docs/PHASE1-4.md)** - Development progress & completion status
- **[docs/SCORE-CALCULATOR.md](./docs/SCORE-CALCULATOR.md)** - Credit scoring algorithm reference
- **[docs/TESTING-GUIDE.md](./docs/TESTING-GUIDE.md)** - Comprehensive testing procedures

## 🎯 Current Status

**✅ Completed (Phases 1-4)**
- ✅ Smart contracts deployed & verified on Moca Devnet
- ✅ Backend credential issuers operational (3 types)
- ✅ Frontend with AIR Kit authentication (Google/Email/Wallet)
- ✅ Credit score calculation with diversity bonus
- ✅ Dynamic collateralization (50-150% based on score)
- ✅ Supply, Borrow, Repay functionality
- ✅ Real-time position monitoring
- ✅ Comprehensive error handling
- ✅ Mobile responsive UI

**🚧 In Progress (Phase 5)**
- 🚧 Backend deployment (Railway/Render)
- 🚧 Frontend deployment (Vercel)
- 🚧 Demo video creation
- 🚧 Final documentation polish

**🔮 Future (Post-Hackathon)**
- Real credential issuers (Plaid, CEX APIs)
- Full Zero-Knowledge Proof implementation
- Liquidation mechanism
- Interest accrual system
- Multi-asset support
- Cross-chain credit portability

## 🔑 Key Innovations

### 1. Dynamic Collateral Based on Credit Score

| Credit Score | Collateral Required | Example |
|--------------|---------------------|---------|
| 900-1000 | 50% | Borrow $100 with $50 |
| 700-899 | 75% | Borrow $100 with $75 |
| 500-699 | 100% | Borrow $100 with $100 |
| 300-499 | 125% | Borrow $100 with $125 |
| 0-299 | 150% | Standard DeFi |

### 2. Transparent Credit Scoring

```
Base Score: 500
+ Credential Weights:
  • Proof of Stable Balance: +100 points
  • Proof of CEX History: +80 points  
  • Proof of Employment: +70 points
× Issuer Trust Score (0-100%)
× Recency Decay (70-100%)
+ Diversity Bonus (5% per unique type)
= Final Score (0-1000)
```

### 3. Moca AIR Kit Integration

- **AIR Account Services**: One-click Web3 SSO (no MetaMask required!)
- **AIR Credential Services**: Framework for verifiable credentials with ZK proofs
- **30-day Sessions**: Users stay logged in automatically
- **Smart Accounts**: Built-in account abstraction

## 🏆 Hackathon Deliverables

- [x] Functional MVP on Moca Chain Devnet
- [x] Complete user flow (login → credentials → score → borrow)
- [x] Professional UI with loading states and error handling
- [x] Comprehensive documentation (3,000+ lines)
- [ ] Demo video (3 minutes)
- [ ] Deployed live demo

## 🤝 Contributing

This project was built for the Moca Chain Hackathon. Contributions, issues, and feature requests are welcome!

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- **Moca Network** for the AIR Kit SDK and developer tools
- **OpenZeppelin** for secure smart contract libraries
- **Hardhat** for development framework
- **shadcn/ui** for beautiful UI components

---

**Built with ❤️ for the Moca Chain Hackathon**

*Transforming trust into capital, one credential at a time.*
