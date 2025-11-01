import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deployment script for Credo Protocol contracts
 * Deploys to Moca Chain Devnet
 * 
 * Order of deployment:
 * 1. CreditScoreOracle
 * 2. LendingPool (requires oracle address)
 * 3. MockUSDC (for testing)
 * 4. Setup: Register issuers and enable assets
 */
async function main() {
  console.log("🚀 Starting Credo Protocol deployment to Moca Chain Devnet...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployer address:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "MOCA\n");

  if (balance === 0n) {
    console.error("❌ Deployer has no balance! Get test MOCA from faucet:");
    console.error("   https://devnet-scan.mocachain.org/faucet");
    process.exit(1);
  }

  // ============ Deploy CreditScoreOracle v2 ============
  console.log("📦 Deploying CreditScoreOracle v2...");
  const CreditScoreOracleFactory = await ethers.getContractFactory("CreditScoreOracle");
  const oracle = await CreditScoreOracleFactory.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✅ CreditScoreOracle v2 deployed to:", oracleAddress);
  
  // Initialize tier configurations
  console.log("⚙️  Initializing tier configurations...");
  await oracle.initializeTiers();
  console.log("✅ Tiers initialized (8 tiers: Exceptional → Very Poor)");

  // ============ Deploy LendingPool ============
  console.log("\n📦 Deploying LendingPool...");
  const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
  const pool = await LendingPoolFactory.deploy(oracleAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("✅ LendingPool deployed to:", poolAddress);

  // ============ Deploy MockUSDC ============
  console.log("\n📦 Deploying MockUSDC...");
  const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDCFactory.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ MockUSDC deployed to:", usdcAddress);

  // ============ Setup: Register Issuers (v2) ============
  console.log("\n⚙️  Setting up issuers...");
  
  // Get issuer addresses from environment or use deployer as fallback
  const MOCK_EXCHANGE_ADDRESS = process.env.MOCK_EXCHANGE_ADDRESS || deployer.address;
  const MOCK_EMPLOYER_ADDRESS = process.env.MOCK_EMPLOYER_ADDRESS || deployer.address;
  const MOCK_BANK_ADDRESS = process.env.MOCK_BANK_ADDRESS || deployer.address;

  console.log("Registering Mock Exchange issuer...");
  await oracle.registerIssuer(MOCK_EXCHANGE_ADDRESS, 100, "Mock Exchange Issuer");
  console.log("✅ Mock Exchange registered:", MOCK_EXCHANGE_ADDRESS);

  console.log("Registering Mock Employer issuer...");
  await oracle.registerIssuer(MOCK_EMPLOYER_ADDRESS, 100, "Mock Employer Issuer");
  console.log("✅ Mock Employer registered:", MOCK_EMPLOYER_ADDRESS);

  console.log("Registering Mock Bank issuer...");
  await oracle.registerIssuer(MOCK_BANK_ADDRESS, 100, "Mock Bank Issuer");
  console.log("✅ Mock Bank registered:", MOCK_BANK_ADDRESS);
  
  // ============ Setup: Register Credential Types (Phase 2 - Bucketed) ============
  console.log("\n⚙️  Registering credential types...");
  
  const credentialTypes = [
    // Bank Balance Buckets (Phase 2)
    { name: "BANK_BALANCE_HIGH", weight: 150, decay: 90, display: "Bank Balance (High)" },
    { name: "BANK_BALANCE_MEDIUM", weight: 120, decay: 90, display: "Bank Balance (Medium)" },
    { name: "BANK_BALANCE_LOW", weight: 80, decay: 90, display: "Bank Balance (Low)" },
    { name: "BANK_BALANCE_MINIMAL", weight: 40, decay: 90, display: "Bank Balance (Minimal)" },
    
    // Income Range Buckets (Phase 2) - Aligned with backend
    { name: "INCOME_HIGH", weight: 180, decay: 180, display: "Income (High - $8k+)" },
    { name: "INCOME_MEDIUM", weight: 140, decay: 180, display: "Income (Medium - $5-8k)" },
    { name: "INCOME_LOW", weight: 100, decay: 180, display: "Income (Low - $3-5k)" },
    { name: "INCOME_MINIMAL", weight: 50, decay: 180, display: "Income (Minimal - <$3k)" },
    
    // Basic Existing Types
    { name: "CEX_HISTORY", weight: 80, decay: 180, display: "CEX Trading History" },
    { name: "EMPLOYMENT", weight: 70, decay: 180, display: "Employment Verified" },
    { name: "ON_CHAIN_ACTIVITY", weight: 50, decay: 180, display: "On-Chain Activity" },
  ];
  
  for (const type of credentialTypes) {
    const typeHash = ethers.id(type.name);
    await oracle.registerCredentialType(
      typeHash,
      type.weight,
      type.decay,
      type.display
    );
    console.log(`✅ Registered ${type.name} (weight: ${type.weight}, decay: ${type.decay} days)`);
  }

  // ============ Setup: Enable USDC in Lending Pool ============
  console.log("\n⚙️  Enabling USDC in lending pool...");
  await pool.enableAsset(usdcAddress, 500); // 5% base interest rate
  console.log("✅ USDC enabled with 5% base interest rate");

  // ============ Save Deployment Addresses ============
  const deploymentData = {
    network: "moca-devnet",
    chainId: 5151,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      CreditScoreOracle: oracleAddress,
      LendingPool: poolAddress,
      MockUSDC: usdcAddress,
    },
    issuers: {
      mockExchange: MOCK_EXCHANGE_ADDRESS || "not_set",
      mockEmployer: MOCK_EMPLOYER_ADDRESS || "not_set",
      mockBank: MOCK_BANK_ADDRESS || "not_set",
    },
    configuration: {
      baseInterestRate: "5%",
      liquidationThreshold: "80%",
      liquidationBonus: "5%",
      tiersInitialized: true,
      credentialTypesCount: 11, // Phase 2: 4 bank + 4 income + 3 basic
    },
  };

  const deploymentPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log("\n💾 Deployment data saved to:", deploymentPath);

  // ============ Summary ============
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   CreditScoreOracle:", oracleAddress);
  console.log("   LendingPool:      ", poolAddress);
  console.log("   MockUSDC:         ", usdcAddress);
  console.log("\n📊 Network Info:");
  console.log("   Network:     Moca Chain Devnet");
  console.log("   Chain ID:    5151");
  console.log("   Explorer:    https://devnet-scan.mocachain.org");
  console.log("\n🔗 Verify contracts:");
  console.log(`   npx hardhat verify --network moca-devnet ${oracleAddress}`);
  console.log(`   npx hardhat verify --network moca-devnet ${poolAddress} ${oracleAddress}`);
  console.log(`   npx hardhat verify --network moca-devnet ${usdcAddress}`);
  console.log("\n📝 Oracle v2 Features:");
  console.log("   ✅ 8 tiers initialized");
  console.log("   ✅ 3 issuers registered");
  console.log("   ✅ 11 credential types configured (Phase 2)");
  console.log("   ✅ 4 bank balance buckets (40-150 pts)");
  console.log("   ✅ 4 income range buckets (50-180 pts)");
  console.log("   ✅ ReentrancyGuard enabled");
  console.log("\n⚠️  CRITICAL NEXT STEP - REGISTER ISSUERS:");
  console.log("   Run this command NOW to register issuers:");
  console.log("   npx hardhat run --network moca-devnet scripts/register-deployer-issuer.ts");
  console.log("   ");
  console.log("   ⚠️  Without this step, credential submissions will FAIL!");
  console.log("   ⚠️  You'll see 'missing revert data' errors!");
  console.log("\n📝 Next steps:");
  console.log("   1. Register issuers (see above) ← DO THIS FIRST!");
  console.log("   2. Update frontend .env with contract addresses");
  console.log("   3. Update backend .env with contract addresses");
  console.log("   4. Verify contracts on explorer (optional)");
  console.log("   5. Test the deployed contracts");
  console.log("\n✨ Ready to start building your frontend!\n");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

