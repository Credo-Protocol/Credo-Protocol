import { ethers } from "hardhat";

/**
 * Verify credential type by reading directly from the contract
 */
async function main() {
  const oracleAddress = "0x6C2A996730D4db1Cb3f8F0073f8e973D125DD08D";
  const oracle = await ethers.getContractAt("CreditScoreOracle", oracleAddress);
  
  const credentialType = "EMPLOYMENT";
  const credentialTypeHash = ethers.id(credentialType);
  
  console.log("🔍 Verifying EMPLOYMENT credential type...");
  console.log(`   Type: ${credentialType}`);
  console.log(`   Hash: ${credentialTypeHash}`);
  console.log();
  
  try {
    // Query the credentialTypes mapping
    const credentialTypeConfig = await oracle.credentialTypes(credentialTypeHash);
    
    console.log(`   Base Weight: ${credentialTypeConfig.baseWeight}`);
    console.log(`   Decay Days: ${credentialTypeConfig.decayDays}`);
    console.log(`   Is Active: ${credentialTypeConfig.isActive}`);
    console.log(`   Display Name: ${credentialTypeConfig.displayName}`);
    
    if (!credentialTypeConfig.isActive) {
      console.log("\n   ❌ CREDENTIAL TYPE IS NOT ACTIVE!");
    } else {
      console.log("\n   ✅ CREDENTIAL TYPE IS ACTIVE AND READY");
    }
  } catch (err) {
    console.log(`   ❌ Error: ${(err as Error).message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

