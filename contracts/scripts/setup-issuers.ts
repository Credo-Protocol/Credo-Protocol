import { ethers } from "hardhat";

/**
 * Helper script to generate issuer wallets for testing
 * Run this before deployment to generate private keys for mock issuers
 */
async function main() {
  console.log("🔑 Generating Mock Issuer Wallets\n");
  console.log("=" .repeat(60));

  // Generate three random wallets for issuers
  const exchangeWallet = ethers.Wallet.createRandom();
  const employerWallet = ethers.Wallet.createRandom();
  const bankWallet = ethers.Wallet.createRandom();

  console.log("\n📝 Mock Exchange Issuer:");
  console.log("   Address:     ", exchangeWallet.address);
  console.log("   Private Key: ", exchangeWallet.privateKey);

  console.log("\n📝 Mock Employer Issuer:");
  console.log("   Address:     ", employerWallet.address);
  console.log("   Private Key: ", employerWallet.privateKey);

  console.log("\n📝 Mock Bank Issuer:");
  console.log("   Address:     ", bankWallet.address);
  console.log("   Private Key: ", bankWallet.privateKey);

  console.log("\n" + "=".repeat(60));
  console.log("\n📋 Add these to your .env files:");
  console.log("\n# Frontend .env.local");
  console.log(`MOCK_EXCHANGE_ADDRESS=${exchangeWallet.address}`);
  console.log(`MOCK_EMPLOYER_ADDRESS=${employerWallet.address}`);
  console.log(`MOCK_BANK_ADDRESS=${bankWallet.address}`);

  console.log("\n# Backend .env");
  console.log(`MOCK_EXCHANGE_PRIVATE_KEY=${exchangeWallet.privateKey}`);
  console.log(`MOCK_EMPLOYER_PRIVATE_KEY=${employerWallet.privateKey}`);
  console.log(`MOCK_BANK_PRIVATE_KEY=${bankWallet.privateKey}`);

  console.log("\n# Contracts .env");
  console.log(`MOCK_EXCHANGE_ADDRESS=${exchangeWallet.address}`);
  console.log(`MOCK_EMPLOYER_ADDRESS=${employerWallet.address}`);
  console.log(`MOCK_BANK_ADDRESS=${bankWallet.address}`);

  console.log("\n⚠️  IMPORTANT: Save these private keys securely!");
  console.log("   They will be used by the backend to sign credentials.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

