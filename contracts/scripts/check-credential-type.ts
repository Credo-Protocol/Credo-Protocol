import { ethers } from "hardhat";

/**
 * Check if a credential type is registered
 */
async function main() {
  const oracleAddress = "0x6C2A996730D4db1Cb3f8F0073f8e973D125DD08D";
  const oracle = await ethers.getContractAt("CreditScoreOracle", oracleAddress);
  
  const credentialType = "EMPLOYMENT";
  const credentialTypeHash = ethers.id(credentialType);
  
  console.log("🔍 Checking credential type registration...");
  console.log(`   Type: ${credentialType}`);
  console.log(`   Hash: ${credentialTypeHash}`);
  console.log();
  
  try {
    const isRegistered = await oracle.isCredentialTypeRegistered(credentialTypeHash);
    console.log(`   Registered: ${isRegistered ? '✅ YES' : '❌ NO'}`);
    
    if (isRegistered) {
      const weight = await oracle.credentialTypeWeights(credentialTypeHash);
      console.log(`   Weight: ${weight}`);
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

