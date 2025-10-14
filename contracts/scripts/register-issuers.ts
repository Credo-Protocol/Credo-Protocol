import { ethers } from "hardhat";

/**
 * Register mock issuers with the CreditScoreOracle contract
 * Run this after deploying contracts
 */
async function main() {
  console.log("🔐 Registering Mock Issuers with CreditScoreOracle\n");
  console.log("=" .repeat(60));

  // Get deployed contract address
  const ORACLE_ADDRESS = process.env.CREDIT_ORACLE_ADDRESS || "0x82Adc3540672eA15C2B9fF9dFCf01BF8d81F2Cd2";
  
  // Get issuer addresses from environment
  const MOCK_EXCHANGE_ADDRESS = process.env.MOCK_EXCHANGE_ADDRESS || "0x499CEB20A05A1eF76D6805f293ea9fD570d6A431";
  const MOCK_EMPLOYER_ADDRESS = process.env.MOCK_EMPLOYER_ADDRESS || "0x22a052d047E8EDC3A75010588B034d66db9bBCE1";
  const MOCK_BANK_ADDRESS = process.env.MOCK_BANK_ADDRESS || "0x3cb42f88131DBe9D0b53E0c945c6e1F76Ea0220E";

  console.log("📍 Oracle Address:", ORACLE_ADDRESS);
  console.log("\n📝 Issuer Addresses:");
  console.log("   Exchange:", MOCK_EXCHANGE_ADDRESS);
  console.log("   Employer:", MOCK_EMPLOYER_ADDRESS);
  console.log("   Bank:    ", MOCK_BANK_ADDRESS);
  console.log("");

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Registering as:", deployer.address);

  // Get oracle contract
  const oracle = await ethers.getContractAt("CreditScoreOracle", ORACLE_ADDRESS);

  // Register issuers with trust score 100 (fully trusted for testing)
  console.log("\n⚙️  Registering issuers...");
  
  // Check if already registered
  const exchangeRegistered = await oracle.isIssuerRegistered(MOCK_EXCHANGE_ADDRESS);
  if (!exchangeRegistered) {
    console.log("   Registering Mock Exchange...");
    const tx1 = await oracle.registerIssuer(MOCK_EXCHANGE_ADDRESS, 100);
    await tx1.wait();
    console.log("   ✅ Mock Exchange registered");
  } else {
    console.log("   ⚠️  Mock Exchange already registered");
  }

  const employerRegistered = await oracle.isIssuerRegistered(MOCK_EMPLOYER_ADDRESS);
  if (!employerRegistered) {
    console.log("   Registering Mock Employer...");
    const tx2 = await oracle.registerIssuer(MOCK_EMPLOYER_ADDRESS, 100);
    await tx2.wait();
    console.log("   ✅ Mock Employer registered");
  } else {
    console.log("   ⚠️  Mock Employer already registered");
  }

  const bankRegistered = await oracle.isIssuerRegistered(MOCK_BANK_ADDRESS);
  if (!bankRegistered) {
    console.log("   Registering Mock Bank...");
    const tx3 = await oracle.registerIssuer(MOCK_BANK_ADDRESS, 100);
    await tx3.wait();
    console.log("   ✅ Mock Bank registered");
  } else {
    console.log("   ⚠️  Mock Bank already registered");
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ All issuers registered successfully!");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error registering issuers:");
    console.error(error);
    process.exit(1);
  });

