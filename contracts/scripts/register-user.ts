import { ethers } from "hardhat";

/**
 * Register a user as an issuer in the CreditScoreOracle
 * This allows them to self-issue credentials for testing
 */
async function main() {
  const userAddress = process.argv[2] || "0x32F91E4E2c60A9C16cAE736D3b42152B331c147F";
  
  console.log("🔐 Registering user as issuer...");
  console.log("   User Address:", userAddress);
  
  // Get deployed oracle address
  const oracleAddress = "0x6C2A996730D4db1Cb3f8F0073f8e973D125DD08D";
  
  // Get contract
  const CreditScoreOracle = await ethers.getContractAt("CreditScoreOracle", oracleAddress);
  
  // Check if already registered
  try {
    const issuerInfo = await CreditScoreOracle.getIssuerInfo(userAddress);
    if (issuerInfo.registered) {
      console.log("✅ User already registered as issuer!");
      console.log("   Trust Score:", issuerInfo.trustScore.toString());
      console.log("   Name:", issuerInfo.name);
      return;
    }
  } catch (err) {
    // Not registered, continue
  }
  
  // Register user as issuer
  console.log("📝 Registering user...");
  const tx = await CreditScoreOracle.registerIssuer(
    userAddress,
    100, // Full trust score
    "User Self-Issued Credentials"
  );
  
  await tx.wait();
  console.log("✅ User registered as issuer successfully!");
  console.log("   Transaction:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

