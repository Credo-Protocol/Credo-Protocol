# Credo Protocol - Smart Contracts

Smart contracts for Credo Protocol: Identity-backed DeFi lending on Moca Chain.

## 📋 Overview

This directory contains the core smart contracts for Credo Protocol:

- **CreditScoreOracle.sol** - On-chain credit scoring system that verifies credentials and calculates user credit scores (0-1000)
- **LendingPool.sol** - Lending pool with dynamic collateral requirements based on credit scores
- **MockUSDC.sol** - Mock USDC token for testing purposes

## 🏗️ Architecture

### CreditScoreOracle

Manages credential verification and score calculation:
- Registers trusted credential issuers
- Verifies signed credentials from issuers
- Calculates credit scores using weighted algorithm
- Applies issuer trust multiplier, recency decay, and diversity bonus
- Prevents replay attacks

**Scoring Algorithm:**
- Base score: 500 points
- Credential weights: Income (150), Stable Balance (100), CEX History (80), Employment (70), On-Chain Activity (50)
- Issuer trust multiplier: 0-100%
- Recency decay: 100% (fresh) to 70% (old)
- Diversity bonus: +5% per credential type (max 25%)
- Maximum score: 1000

### LendingPool

Provides lending functionality with credit score integration:
- Dynamic collateral factors: 50% (score 900+) to 150% (score <300)
- Score-based interest rates: 5-15% APR
- Supply, borrow, repay, and withdraw functions
- Health factor monitoring
- Liquidation mechanism for unhealthy positions

### MockUSDC

Test token for development:
- Standard ERC20 with 6 decimals
- Public faucet function (10,000 USDC limit per call)
- Default faucet (1,000 USDC)

## 🚀 Quick Start

### Installation

```bash
cd contracts
npm install
```

### Configuration

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Add your deployer private key:

```env
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

### Generate Mock Issuer Wallets

```bash
npm run setup-issuers
```

This will generate three issuer wallets and display their addresses and private keys. Save these to your `.env` file.

### Compilation

```bash
npm run compile
```

### Testing

```bash
# Run all tests
npm test

# Run with gas reporting
npm run test:gas

# Run coverage
npm run coverage
```

## 📦 Deployment

### Deploy to Moca Chain Devnet

1. **Get test MOCA tokens** from the faucet:
   https://devnet-scan.mocachain.org/faucet

2. **Deploy contracts**:
   ```bash
   npm run deploy:devnet
   ```

3. **Verify contracts** (optional):
   ```bash
   npm run verify <CONTRACT_ADDRESS>
   ```

### Deployment Output

After successful deployment, contract addresses are saved to `deployed-addresses.json`:

```json
{
  "network": "moca-devnet",
  "chainId": 5151,
  "contracts": {
    "CreditScoreOracle": "0x...",
    "LendingPool": "0x...",
    "MockUSDC": "0x..."
  }
}
```

## 🧪 Test Results

```
Basic Contract Tests
  MockUSDC
    ✔ Should deploy with correct name and symbol
    ✔ Should have 6 decimals
    ✔ Should allow faucet minting
  CreditScoreOracle
    ✔ Should deploy successfully
    ✔ Should return base score for new users
    ✔ Should allow owner to register issuer
    ✔ Should calculate correct collateral factors
  LendingPool
    ✔ Should deploy with correct oracle address
    ✔ Should allow owner to enable assets
    ✔ Should calculate correct collateral factors
    ✔ Should allow users to supply assets

11 passing (407ms)
```

## 📊 Network Configuration

### Moca Chain Devnet

- **Chain ID**: 5151 (0x141F)
- **RPC URL**: http://devnet-rpc.mocachain.org
- **Explorer**: https://devnet-scan.mocachain.org
- **Faucet**: https://devnet-scan.mocachain.org/faucet

### Moca Chain Testnet

- **Chain ID**: 222888 (0x366a8)
- **RPC URL**: http://testnet-rpc.mocachain.org
- **Explorer**: https://testnet-scan.mocachain.org
- **Faucet**: https://testnet-scan.mocachain.org/faucet

## 🔧 Scripts

- `npm run compile` - Compile contracts
- `npm test` - Run test suite
- `npm run test:gas` - Run tests with gas reporting
- `npm run coverage` - Generate code coverage report
- `npm run clean` - Clean artifacts and cache
- `npm run setup-issuers` - Generate mock issuer wallets
- `npm run deploy:local` - Deploy to local Hardhat network
- `npm run deploy:devnet` - Deploy to Moca Chain Devnet
- `npm run verify` - Verify contracts on explorer

## 📝 Contract ABIs

After compilation, ABIs are available in `artifacts/contracts/`:
- `CreditScoreOracle.sol/CreditScoreOracle.json`
- `LendingPool.sol/LendingPool.json`
- `MockUSDC.sol/MockUSDC.json`

## 🔐 Security Considerations

### CreditScoreOracle
- Only owner can register issuers
- Replay attack prevention via credential hash tracking
- Signature verification for all credentials
- Credential expiration checking

### LendingPool
- ReentrancyGuard on all state-changing functions
- Health factor monitoring
- Collateral checks before withdrawal
- Liquidation mechanism for undercollateralized positions

## 🛠️ Development

### Project Structure

```
contracts/
├── contracts/          # Solidity contracts
│   ├── CreditScoreOracle.sol
│   ├── LendingPool.sol
│   └── MockUSDC.sol
├── scripts/            # Deployment scripts
│   ├── deploy.ts
│   └── setup-issuers.ts
├── test/               # Test files
│   └── basic.test.js
├── hardhat.config.js   # Hardhat configuration
└── package.json        # Dependencies and scripts
```

### Adding New Tests

Create test files in `test/` directory:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyContract", function () {
  it("Should work", async function () {
    // Test code here
  });
});
```

## 📖 Documentation

For detailed implementation documentation, see:
- [IMPLEMENTATION.md](../docs/IMPLEMENTATION.md) - Complete Phase 1-5 implementation plan
- [OVERVIEW.md](../docs/OVERVIEW.md) - Architecture and innovation details
- [MOCA_CORRECTIONS.md](../docs/MOCA_CORRECTIONS.md) - Moca Network verified configurations

## 🤝 Contributing

When contributing to smart contracts:
1. Write comprehensive tests for all new functionality
2. Follow Solidity best practices and style guide
3. Document all functions with NatSpec comments
4. Run tests and coverage before submitting
5. Ensure no linter errors

## 📄 License

MIT

## 🆘 Troubleshooting

### Node.js Version Warning

If you see a warning about Node.js version, it's safe to ignore for development. Hardhat recommends Node.js v18 LTS but works with v22.

### Compilation Errors

```bash
# Clean and recompile
npm run clean
npm run compile
```

### Test Failures

```bash
# Run tests with verbose output
npx hardhat test --verbose
```

### Deployment Issues

1. Check you have test MOCA tokens from faucet
2. Verify `.env` has correct DEPLOYER_PRIVATE_KEY
3. Ensure you're connected to the correct network

## 🔗 Useful Links

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Moca Network Documentation](https://docs.moca.network)
- [Ethers.js Documentation](https://docs.ethers.org/v6)

---

**Built with ❤️ by the Credo Protocol Team**

