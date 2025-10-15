# Credo Protocol

> **Moca Network Proof of Build - Wave 2 Submission**  
> **Identity-Backed DeFi Lending on Moca Chain**

Credo Protocol is an undercollateralized lending platform on Moca Chain, built for the Moca Network Proof of Build. It leverages the AIR Kit to generate privacy-preserving, on-chain credit scores from verifiable credentials, unlocking fair access to capital in DeFi.

[![Moca Chain](https://img.shields.io/badge/Moca_Chain-Devnet-blue)](https://devnet-scan.mocachain.org)
[![Buildathon](https://img.shields.io/badge/Buildathon-Wave_2-purple)]()
[![Status](https://img.shields.io/badge/Status-Live_Demo-success)](https://credo-protocol.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📺 Demo Links

- **🌐 Live Application**: [https://credo-protocol.vercel.app](https://credo-protocol.vercel.app)
- **🔗 Backend API**: [https://credo-protocol.onrender.com](https://credo-protocol.onrender.com)
- **📹 Demo Video**: [Coming Soon - Oct 19]
- **📊 Smart Contracts**: [Moca Chain Devnet Explorer](https://devnet-scan.mocachain.org)

---

## 🎯 The Problem We're Solving

### Traditional Finance (TradFi)
Credit systems are **opaque, centralized, and exclusionary**. Billions of people are locked out of capital markets due to lack of formal credit history.

### Current DeFi
While open and permissionless, DeFi lending is **capital-inefficient**. Protocols like Aave require **150% collateral** to borrow $100, making them unsuitable for genuine credit needs.

### Our Solution
Credo Protocol bridges this gap by creating an **identity-backed lending model**. Instead of relying solely on collateral, we assess creditworthiness based on verifiable on-chain and off-chain reputation.

### Key Innovation

**Traditional DeFi**: Borrow $100 → Need $150 collateral  
**Credo Protocol**: Borrow $100 → Need $50-$150 collateral (based on your credit score)

## ✨ Features

### Core Functionality
- **🔐 Seamless Login** - One-click Web3 SSO via Moca AIR Kit (Google/Email/Wallet)
- **🎫 Verifiable Credentials** - Submit proof of CEX history, employment, and stable balances
- **📊 On-Chain Credit Scoring** - Transparent 0-1000 scale with diversity bonuses
- **⚡ Dynamic Collateral** - 50-150% requirements based on your score
- **💰 Complete Lending Flow** - Supply, borrow, and repay USDC seamlessly

### Why Credo Protocol?

**For Users:**
- 🎯 Borrow **2x-3x more** with the same collateral compared to Aave/Compound
- 🔒 Keep your data **private** - prove creditworthiness without revealing sensitive information
- 🌍 Access DeFi **without crypto wealth** - your real-world reputation matters
- 📈 Build **portable credit history** that works across all dApps

**For the Moca Ecosystem:**
- 🚀 **Killer App** for Moca ID adoption (requires Moca login)
- 🛠️ **AIR Kit Showcase** - demonstrates both Account + Credential Services
- 🧱 **Composable Primitive** - other dApps can use Credo credit scores
- 💡 **Web3 Innovation** - shifts DeFi from "how much you have" to "who you are"

**For DeFi:**
- 💰 Unlocks **trillions in capital** currently locked due to over-collateralization
- 🌊 Brings **real-world identity** to on-chain finance
- 🔗 Creates **interoperability** between TradFi credentials and DeFi protocols
- 🎪 Enables **new primitives** (credit-gated DAOs, reputation-based insurance, etc.)

## 🚀 Deployed Contracts (Moca Chain Devnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| **CreditScoreOracle** | `0x82Adc3540672eA15C2B9fF9dFCf01BF8d81F2Cd2` | [View](https://devnet-scan.mocachain.org/address/0x82Adc3540672eA15C2B9fF9dFCf01BF8d81F2Cd2) |
| **LendingPool** | `0x72efF02BF767b79369ea749dd7d57c143A92Cf09` | [View](https://devnet-scan.mocachain.org/address/0x72efF02BF767b79369ea749dd7d57c143A92Cf09) |
| **MockUSDC** | `0x76FdD416C70a9b51071C1751088d6715dD60d864` | [View](https://devnet-scan.mocachain.org/address/0x76FdD416C70a9b51071C1751088d6715dD60d864) |

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

## 📊 Buildathon Progress

### ✅ Wave 2 Deliverables (COMPLETED - Oct 15, 2025)

**What's New This Wave:** The entire foundational infrastructure - from zero to a working, on-chain proof-of-concept demonstrating identity-based lending on Moca Chain.

#### 1. Smart Contracts (Deployed on Moca Devnet)
- ✅ **CreditScoreOracle.sol** - Verifies credentials & calculates credit scores (0-1000)
- ✅ **LendingPool.sol** - Dynamic collateral lending pool with 8 credit tiers
- ✅ **MockUSDC.sol** - Test token with faucet functionality
- ✅ Comprehensive test suite with 100% pass rate
- ✅ Deployed and verified on Moca Chain Devnet

#### 2. Backend Services (Live on Render)
- ✅ Express API server for credential issuance
- ✅ 3 Mock issuers (CEX, Employer, Bank)
- ✅ EIP-191 signature generation for verifiable credentials
- ✅ RESTful API endpoints for credential types and requests
- ✅ Production deployment with CORS configuration

#### 3. Frontend Application (Live on Vercel)
- ✅ **AIR Account Services Integration** - Seamless login with Google/Email/Wallet
- ✅ **AIR Credential Services Framework** - Request and submit verifiable credentials
- ✅ Beautiful landing page with animations (shadcn/ui + Framer Motion)
- ✅ Dashboard with real-time credit score display
- ✅ Credential marketplace (3 credential types)
- ✅ Lending interface (Supply/Borrow/Repay flows)
- ✅ Faucet page for test USDC tokens
- ✅ Real-time position monitoring & health factor tracking
- ✅ Fully responsive design (mobile-optimized)
- ✅ Comprehensive error handling & loading states
- ✅ Transaction feedback & confirmations

#### 4. Deployment & Infrastructure
- ✅ Frontend deployed to Vercel (Production)
- ✅ Backend deployed to Render (Production)
- ✅ Environment configuration for production
- ✅ CORS and security headers configured
- ✅ Public GitHub repository with documentation

---

### 🚀 Wave 3 Plans (Oct 19-23, 2025)

**Goal:** Evolve the MVP into a robust, privacy-preserving prototype with real-world integrations and production-grade UX.

#### Planned Deliverables:
- 🔜 **Real-World Data Integration** - Plaid API sandbox for "Proof of Bank Balance"
- 🔜 **Zero-Knowledge Proofs** - Implement ZK capabilities from AIR Credential Services
  - Prove "income > $X" without revealing exact salary
  - Prove "balance stable for Y months" without exposing amounts
- 🔜 **Liquidation Mechanism** - Automated liquidations for unhealthy positions
- 🔜 **Interest Accrual** - Time-based interest calculation on borrows
- 🔜 **Enhanced Dashboard** - Credential management with interactive score breakdowns
- 🔜 **UI/UX Refinement** - Polished design with micro-interactions, onboarding flows, and accessibility
- 🔜 **Issuer SDK v0.1** - Documentation for third-party credential issuers
- 🔜 **Advanced Analytics** - Historical credit score tracking & trends

**Note:** Wave 2 focused on proving core functionality. Wave 3 will add privacy features, protocol completeness, and transform the interface into a production-ready experience.

---

### 🎯 Post-Buildathon Vision

**Phase 1: Beachhead (Q1 2026)**
- Target crypto-native users in Moca & Animoca ecosystems
- Partner with GameFi projects for on-chain activity credentials
- Build initial liquidity pools

**Phase 2: Crossover (Q2-Q3 2026)**
- Integrate with regional FinTechs (Southeast Asia focus)
- Real credential issuers (exchanges, neobanks, payroll systems)
- Expand to multi-asset support (ETH, BTC, stablecoins)

**Phase 3: Platform (2027+)**
- Open Issuer SDK for any developer
- Composable credit score as infrastructure primitive
- Cross-chain credit score portability
- DAO governance and $CREDO token launch

## 👥 Team

**Built with ❤️ by Marcus**

- **Role**: Full-Stack Developer (Smart Contracts, Frontend, Backend, Integration & Deployment)
- **Location**: Southeast Asia (Malaysia, UTC+8)
- **Twitter/X**: [@marcustan1337](https://x.com/marcustan1337)

---

**🏆 Moca Network Proof of Build - Wave 2 Submission**

*Transforming trust into capital, one credential at a time.* 🚀

## 🙏 Acknowledgments

- **Moca Network** for the AIR Kit SDK and developer tools
- **OpenZeppelin** for secure smart contract libraries  
- **Hardhat** for the excellent development framework
- **shadcn/ui** for beautiful, accessible UI components
- **Vercel** for Next.js and hosting platform


