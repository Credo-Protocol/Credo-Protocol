/**
 * Verify Deployed Contracts on Moca Chain Explorer
 * 
 * This script verifies all deployed contracts on the Moca Chain block explorer
 * so that function names appear correctly in wallets (instead of "Unknown")
 * 
 * Usage: npx hardhat run scripts/verify-contracts.ts --network moca-devnet
 */

const hre = require("hardhat");

// Import deployed addresses
const deployedAddresses = require("../deployed-addresses.json");

async function main() {
  console.log("🔍 Starting contract verification on Moca Chain Explorer...\n");

  const contracts = deployedAddresses.contracts;
  const issuers = deployedAddresses.issuers;

  try {
    // 1. Verify MockUSDC
    console.log("📝 Verifying MockUSDC...");
    try {
      await hre.run("verify:verify", {
        address: contracts.MockUSDC,
        constructorArguments: [],
        contract: "contracts/MockUSDC.sol:MockUSDC"
      });
      console.log("✅ MockUSDC verified successfully!\n");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ MockUSDC already verified\n");
      } else {
        console.error("❌ Error verifying MockUSDC:", error.message);
      }
    }

    // 2. Verify CreditScoreOracle
    console.log("📝 Verifying CreditScoreOracle...");
    try {
      await hre.run("verify:verify", {
        address: contracts.CreditScoreOracle,
        constructorArguments: [],
        contract: "contracts/CreditScoreOracle.sol:CreditScoreOracle"
      });
      console.log("✅ CreditScoreOracle verified successfully!\n");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ CreditScoreOracle already verified\n");
      } else {
        console.error("❌ Error verifying CreditScoreOracle:", error.message);
      }
    }

    // 3. Verify LendingPool
    console.log("📝 Verifying LendingPool...");
    try {
      await hre.run("verify:verify", {
        address: contracts.LendingPool,
        constructorArguments: [
          contracts.CreditScoreOracle  // Only takes credit oracle address
        ],
        contract: "contracts/LendingPool.sol:LendingPool"
      });
      console.log("✅ LendingPool verified successfully!\n");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ LendingPool already verified\n");
      } else {
        console.error("❌ Error verifying LendingPool:", error.message);
      }
    }

    console.log("\n🎉 Verification complete!");
    console.log("\n📋 View your contracts:");
    console.log(`CreditScoreOracle: https://devnet-scan.mocachain.org/address/${contracts.CreditScoreOracle}`);
    console.log(`LendingPool: https://devnet-scan.mocachain.org/address/${contracts.LendingPool}`);
    console.log(`MockUSDC: https://devnet-scan.mocachain.org/address/${contracts.MockUSDC}`);
    
    console.log("\n💡 Once verified, the AIR Kit wallet will show proper function names instead of 'Unknown'");

  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

