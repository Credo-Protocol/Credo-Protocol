# Credo Protocol

**Identity-Backed DeFi Lending on Moca Chain**

Transform your verifiable credentials into borrowing power. Build your on-chain credit score and unlock undercollateralized loans based on who you are, not just what you own.

[![Moca Chain](https://img.shields.io/badge/Moca_Chain-Devnet-blue)](https://devnet-scan.mocachain.org)
[![Status](https://img.shields.io/badge/Status-Live_Demo-success)]()
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎯 Overview

Credo Protocol is a revolutionary DeFi lending platform that shifts from **asset-backed** to **identity-backed** lending. By leveraging Verifiable Credentials and on-chain credit scoring, we enable loans with as little as 50% collateral (vs 150% in traditional DeFi) for users with strong reputation.

### Key Innovation

**Traditional DeFi**: Borrow $100 → Need $150 collateral  
**Credo Protocol**: Borrow $100 → Need $50-$150 collateral (based on your credit score)

## ✨ Features

- **🔐 Seamless Login** - One-click Web3 SSO via Moca AIR Kit (Google/Email/Wallet)
- **🎫 Verifiable Credentials** - Submit proof of CEX history, employment, and stable balances
- **📊 On-Chain Credit Scoring** - Transparent 0-1000 scale with diversity bonuses
- **⚡ Dynamic Collateral** - 50-150% requirements based on your score
- **💰 Complete Lending Flow** - Supply, borrow, and repay USDC seamlessly

## 🚀 Live Demo

**Frontend**: [Coming Soon - Deployment in Progress]

**Smart Contracts** (Moca Chain Devnet):
- 📝 CreditScoreOracle: [`0x82Adc3540672eA15C2B9fF9dFCf01BF8d81F2Cd2`](https://devnet-scan.mocachain.org/address/0x82Adc3540672eA15C2B9fF9dFCf01BF8d81F2Cd2)
- 💰 LendingPool: [`0x72efF02BF767b79369ea749dd7d57c143A92Cf09`](https://devnet-scan.mocachain.org/address/0x72efF02BF767b79369ea749dd7d57c143A92Cf09)
- 🪙 MockUSDC: [`0x76FdD416C70a9b51071C1751088d6715dD60d864`](https://devnet-scan.mocachain.org/address/0x76FdD416C70a9b51071C1751088d6715dD60d864)

## 📋 How It Works

```
1. Login with Moca ID (Google/Email/Wallet)
   ↓
2. Request Verifiable Credentials (CEX, Employer, Bank)
   ↓
3. Submit Credentials → Build Credit Score On-Chain
   ↓
4. Supply USDC as Collateral
   ↓
5. Borrow with Personalized Terms (Score-Based)
```

### Example User Journey

**Alice's Story**:
1. Logs in with her Google account via Moca AIR Kit ✅
2. Submits 3 credentials: CEX history, Employment proof, Stable balance ✅
3. Credit score calculated: **862/1000** ✅
4. Supplies $1,000 USDC as collateral ✅
5. **Can borrow up to $1,667 USDC** (60% collateral requirement) vs $667 in traditional DeFi 🎉

## 💎 Credit Scoring System

### Collateral Requirements by Score

| Credit Score | Collateral Required | Borrowing Power (per $100 collateral) |
|--------------|---------------------|----------------------------------------|
| 900-1000     | 50%                 | $200                                   |
| 800-899      | 60%                 | $167                                   |
| 700-799      | 75%                 | $133                                   |
| 600-699      | 90%                 | $111                                   |
| 500-599      | 100%                | $100                                   |
| 400-499      | 110%                | $91                                    |
| 300-399      | 125%                | $80                                    |
| 0-299        | 150%                | $67 (Standard DeFi)                    |

### Score Calculation

```javascript
Base Score: 500

+ Credential Type Weights:
  • Proof of Stable Balance: +100 points
  • Proof of CEX History: +80 points
  • Proof of Employment: +70 points

× Issuer Trust Score: 0-100%
× Recency Decay: 70-100% (based on credential age)

+ Diversity Bonus: 5% per unique credential type (up to 25%)

= Final Score (0-1000, capped)
```

**Example**:
- 3 credentials (CEX + Employment + Bank Balance)
- Full issuer trust (100%)
- Recent submissions (100% recency)
- Calculation: (500 + 80 + 70 + 100) × 1.15 = **862**

## 🏗️ Project Structure

```
Credo-Protocol/
├── pages/                      # Next.js pages
│   ├── index.js               # Landing page
│   ├── dashboard.js           # Main app dashboard
│   └── faucet.js              # Get test USDC
├── components/                 # React components
│   ├── auth/
│   │   └── ConnectButton.jsx  # Moca AIR Kit integration
│   ├── CreditScoreCard.jsx    # Display user's score
│   ├── CredentialMarketplace.jsx  # Request credentials
│   ├── LendingInterface.jsx   # Supply/Borrow/Repay
│   ├── SupplyModal.jsx        # Deposit collateral modal
│   ├── RepayModal.jsx         # Repay debt modal
│   └── ui/                    # shadcn/ui components
├── contracts/                  # Solidity smart contracts
│   ├── contracts/
│   │   ├── CreditScoreOracle.sol  # Credit scoring logic
│   │   ├── LendingPool.sol    # Lending/borrowing logic
│   │   └── MockUSDC.sol       # Test token with faucet
│   ├── scripts/
│   │   ├── deploy.ts          # Deploy all contracts
│   │   └── register-issuers.ts  # Setup credential issuers
│   └── test/                  # Contract tests
├── backend/                    # Express API server
│   └── src/
│       ├── issuers/           # Mock credential issuers
│       │   ├── MockBankIssuer.js
│       │   ├── MockEmployerIssuer.js
│       │   └── MockExchangeIssuer.js
│       └── routes/
│           └── credentials.js  # Credential API endpoints
├── hooks/
│   └── useAirKit.js           # AIR Kit React hook
├── lib/
│   ├── contracts.js           # Contract ABIs & addresses
│   ├── airkit.js              # AIR Kit initialization
│   └── utils.js               # Helper functions
└── docs/                       # Comprehensive documentation
    ├── OVERVIEW.md            # Technical architecture (670+ lines)
    ├── IMPLEMENTATION.md      # Implementation guide (1,900+ lines)
    ├── PHASE1-4.md            # Development progress
    └── SCORE-CALCULATOR.md    # Scoring algorithm details
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 + React 19
- **Styling**: Tailwind CSS + shadcn/ui
- **Web3**: Ethers.js v6
- **Auth**: Moca AIR Kit SDK (AIR Account Services)
- **Credentials**: AIR Credential Services framework

### Smart Contracts
- **Language**: Solidity 0.8.x
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin v5
- **Network**: Moca Chain Devnet (Chain ID: 5151)

### Backend
- **Runtime**: Node.js + Express
- **Signing**: Ethers.js for EIP-191 signatures
- **Purpose**: Mock credential issuers for demo

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/YourUsername/Credo-Protocol.git
cd Credo-Protocol

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install contract dependencies
cd ../contracts
npm install
```

### 2. Environment Setup

Create environment files from the examples:

```bash
# Frontend
cp .env.example .env.local
# Edit .env.local and add your NEXT_PUBLIC_PARTNER_ID from https://developers.sandbox.air3.com/

# Backend
cp backend/.env.example backend/.env
# No changes needed for development

# Contracts (optional - if deploying your own)
cp contracts/.env.example contracts/.env
# Add your private key if deploying
```

**Minimum Required**: Only the frontend `.env.local` needs configuration:
```bash
NEXT_PUBLIC_PARTNER_ID=your_partner_id_from_air_kit
```

All other variables have working defaults for the deployed contracts.

### 3. Start the Application

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
# → Running on http://localhost:3001
```

**Terminal 2 - Frontend**:
```bash
npm run dev
# → Running on http://localhost:3000
```

**Access**: Open http://localhost:3000 in your browser

### 4. Get Test Tokens

1. **Get MOCA for Gas**: Visit [Moca Devnet Faucet](https://devnet-scan.mocachain.org/faucet)
2. **Get Test USDC**: Visit `/faucet` page in the app (after logging in)

### 5. Try It Out!

1. **Login** - Click "Login with Moca ID" and choose Google/Email/Wallet
2. **Request Credentials** - Visit "Build Credit Score" tab, request all 3 credentials
3. **Check Score** - Your credit score updates automatically (base 500 + credentials)
4. **Supply USDC** - Go to "Lending Pool" tab, supply collateral
5. **Borrow** - Borrow up to your limit based on credit score
6. **Repay** - Pay back anytime to improve health factor

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts
npm test
```

**Test Coverage**:
- ✅ Credit score calculation with diversity bonuses
- ✅ Dynamic collateral factors (8 score tiers)
- ✅ Credential verification with EIP-191 signatures
- ✅ Supply, borrow, repay, withdraw flows
- ✅ Health factor calculations

### Integration Tests

```bash
npm run test:integration
```

Tests the full flow from frontend → backend → contracts.

## 📚 Documentation

- **[PRD.md](./docs/PRD.md)** - Product vision & requirements
- **[OVERVIEW.md](./docs/OVERVIEW.md)** - Technical architecture & Moca integration (670+ lines)
- **[IMPLEMENTATION.md](./docs/IMPLEMENTATION.md)** - Complete implementation guide (1,900+ lines)
- **[PHASE1-4.md](./docs/PHASE1-4.md)** - Development phases & completion status
- **[SCORE-CALCULATOR.md](./docs/SCORE-CALCULATOR.md)** - Credit scoring algorithm reference
- **[SETUP-GUIDE.md](./docs/SETUP-GUIDE.md)** - Detailed setup instructions

## 📊 Current Status

### ✅ Completed Features

**Phase 1: Smart Contracts**
- ✅ CreditScoreOracle with credential verification
- ✅ LendingPool with dynamic collateral
- ✅ MockUSDC with faucet functionality
- ✅ Deployed & verified on Moca Devnet
- ✅ Comprehensive test suite

**Phase 2: Backend Services**
- ✅ Express API with 3 mock issuers
- ✅ EIP-191 signature generation
- ✅ Credential type endpoints
- ✅ CORS configuration

**Phase 3: Frontend Application**
- ✅ Moca AIR Kit integration (Google/Email/Wallet login)
- ✅ Beautiful landing page with animations
- ✅ Dashboard with credit score display
- ✅ Credential marketplace with 3 types
- ✅ Lending interface (supply/borrow/repay)
- ✅ Faucet page for test tokens
- ✅ Real-time position monitoring
- ✅ Responsive design (mobile-friendly)
- ✅ Error handling & loading states
- ✅ Transaction feedback & confirmations

**Phase 4: Polish & Testing**
- ✅ Login state management fixes
- ✅ Navigation improvements
- ✅ UI/UX enhancements
- ✅ Color-coded credit scores
- ✅ Modal redesigns (minimalist theme)
- ✅ RPC timeout handling
- ✅ Graceful error fallbacks

### 🚧 In Progress (Phase 5)

- 🚧 Frontend deployment (Vercel)
- 🚧 Backend deployment (Railway/Render)
- 🚧 Demo video creation
- 🚧 Final documentation polish

### 🔮 Future Enhancements

**Post-Hackathon Roadmap**:
- Real credential issuers (Plaid, CEX APIs)
- Full Zero-Knowledge Proof implementation
- Liquidation mechanism
- Interest accrual on borrows
- Multi-asset support (ETH, BTC, etc.)
- Cross-chain credit score portability
- Delegation & credit scoring for DAOs

## 🔑 Key Innovations

### 1. Moca AIR Kit Integration

**AIR Account Services**:
- One-click Web3 SSO (no MetaMask required!)
- Multiple login options: Google, Email, Wallet
- 30-day sessions (users stay logged in)
- Smart account abstraction built-in

**AIR Credential Services**:
- Framework for verifiable credentials
- Zero-Knowledge Proof capabilities
- Privacy-preserving attestations
- EIP-191 signature verification

### 2. Privacy-Preserving Design

Unlike traditional credit bureaus, Credo never sees your raw data:

- **Prove income threshold** without revealing exact salary
- **Prove trading volume** without exposing all transactions
- **Prove employment** without sharing employer details
- **Prove stable balance** without revealing account numbers

### 3. Composable Financial Identity

Your on-chain credit score is a public good that other dApps can use:

- **Identity-gated trading** (higher leverage for trusted users)
- **Premium access** (auto-qualify for memberships)
- **DAO governance** (reputation-weighted voting)
- **Undercollateralized NFT purchases**
- **Reputation-based insurance pools**

## 🏆 Built for Moca Chain Hackathon

**Hackathon Deliverables**:
- ✅ Functional MVP on Moca Chain Devnet
- ✅ Complete user flow (login → credentials → score → borrow)
- ✅ Professional UI with error handling
- ✅ Comprehensive documentation (3,000+ lines)
- 🚧 Demo video (3 minutes)
- 🚧 Live deployment

**Team**: Built with ❤️ by Marcus

## 🤝 Contributing

This project was built for the Moca Chain Hackathon. Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Moca Network** for the AIR Kit SDK and developer tools
- **OpenZeppelin** for secure smart contract libraries  
- **Hardhat** for the excellent development framework
- **shadcn/ui** for beautiful, accessible UI components
- **Vercel** for Next.js and hosting platform

## 📞 Contact & Links

- **Documentation**: [docs/OVERVIEW.md](./docs/OVERVIEW.md)
- **Smart Contracts**: [Moca Chain Devnet Explorer](https://devnet-scan.mocachain.org)
- **Moca Developers**: [https://developers.mocaverse.xyz](https://developers.mocaverse.xyz)

---

**Built for Moca Chain Hackathon 2025**

*Transforming trust into capital, one credential at a time.* 🚀

