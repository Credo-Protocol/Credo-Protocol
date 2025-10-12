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

  // ============ Deploy CreditScoreOracle ============
  console.log("📦 Deploying CreditScoreOracle...");
  const CreditScoreOracleFactory = await ethers.getContractFactory("CreditScoreOracle");
  const oracle = await CreditScoreOracleFactory.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✅ CreditScoreOracle deployed to:", oracleAddress);

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

  // ============ Setup: Register Issuers ============
  console.log("\n⚙️  Setting up issuers...");
  
  // Get issuer addresses from environment
  const MOCK_EXCHANGE_ADDRESS = process.env.MOCK_EXCHANGE_ADDRESS;
  const MOCK_EMPLOYER_ADDRESS = process.env.MOCK_EMPLOYER_ADDRESS;
  const MOCK_BANK_ADDRESS = process.env.MOCK_BANK_ADDRESS;

  if (!MOCK_EXCHANGE_ADDRESS || !MOCK_EMPLOYER_ADDRESS || !MOCK_BANK_ADDRESS) {
    console.log("⚠️  Warning: Mock issuer addresses not found in .env");
    console.log("   You'll need to register issuers manually later");
  } else {
    console.log("Registering Mock Exchange issuer...");
    await oracle.registerIssuer(MOCK_EXCHANGE_ADDRESS, 100);
    console.log("✅ Mock Exchange registered:", MOCK_EXCHANGE_ADDRESS);

    console.log("Registering Mock Employer issuer...");
    await oracle.registerIssuer(MOCK_EMPLOYER_ADDRESS, 100);
    console.log("✅ Mock Employer registered:", MOCK_EMPLOYER_ADDRESS);

    console.log("Registering Mock Bank issuer...");
    await oracle.registerIssuer(MOCK_BANK_ADDRESS, 100);
    console.log("✅ Mock Bank registered:", MOCK_BANK_ADDRESS);
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
  console.log("\n📝 Next steps:");
  console.log("   1. Update frontend .env with contract addresses");
  console.log("   2. Update backend .env with contract addresses");
  console.log("   3. Verify contracts on explorer (optional)");
  console.log("   4. Test the deployed contracts");
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

