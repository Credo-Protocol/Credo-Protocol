require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/**
 * Hardhat configuration for Credo Protocol smart contracts
 * Configured for deployment to Moca Chain Devnet (Chain ID: 5151)
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR-based code generator to fix "stack too deep" errors
    },
  },
  networks: {
    // Hardhat local network for testing
    hardhat: {
      chainId: 31337,
    },
    // Moca Chain Devnet - Official Configuration
    "moca-devnet": {
      url: "http://devnet-rpc.mocachain.org",
      chainId: 5151, // 0x141F in hex
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      gasPrice: "auto",
    },
    // Moca Chain Testnet (for future use)
    "moca-testnet": {
      url: "http://testnet-rpc.mocachain.org",
      chainId: 222888, // 0x366a8 in hex
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      gasPrice: "auto",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  // Gas reporter configuration
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },
};

