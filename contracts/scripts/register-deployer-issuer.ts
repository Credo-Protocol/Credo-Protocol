import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Register the deployer address as an issuer in the CreditScoreOracle
 * This allows the deployer to submit credentials for testing
 * 
 * This script automatically reads the Oracle address from deployed-addresses.json
 */
async function main() {
  console.log("🔐 Registering Deployer as Issuer\n");
  console.log("=" .repeat(60));

  // Read Oracle address from deployed-addresses.json
  const deployedAddressesPath = path.join(__dirname, "..", "deployed-addresses.json");
  
  if (!fs.existsSync(deployedAddressesPath)) {
    throw new Error("❌ deployed-addresses.json not found! Please deploy contracts first.");
  }
  
  const deployedData = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf-8"));
  const ORACLE_ADDRESS = deployedData.contracts.CreditScoreOracle;
  
  if (!ORACLE_ADDRESS) {
    throw new Error("❌ CreditScoreOracle address not found in deployed-addresses.json");
  }
  
  console.log("📍 Oracle Address:", ORACLE_ADDRESS, "(from deployed-addresses.json)");

  // Get deployer signer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer Address:", deployer.address);

  // Get oracle contract
  const oracle = await ethers.getContractAt("CreditScoreOracle", ORACLE_ADDRESS);

  // Check if deployer is already registered
  const isRegistered = await oracle.isIssuerRegistered(deployer.address);
  
  if (isRegistered) {
    console.log("\n⚠️  Deployer is already registered as an issuer");
    
    // Check issuer details
    const issuerInfo = await oracle.issuers(deployer.address);
    console.log("\n📋 Issuer Info:");
    console.log("   Registered:", issuerInfo.registered);
    console.log("   Active:", issuerInfo.isActive);
    console.log("   Trust Score:", issuerInfo.trustScore.toString());
    console.log("   Name:", issuerInfo.name);
  } else {
    console.log("\n⚙️  Registering deployer as issuer...");
    
    // Register with trust score 100 (fully trusted for testing)
    const tx = await oracle.registerIssuer(
      deployer.address,
      100,
      "Deployer Test Issuer"
    );
    await tx.wait();
    
    console.log("✅ Deployer registered successfully!");
    
    // Verify registration
    const issuerInfo = await oracle.issuers(deployer.address);
    console.log("\n📋 Issuer Info:");
    console.log("   Registered:", issuerInfo.registered);
    console.log("   Active:", issuerInfo.isActive);
    console.log("   Trust Score:", issuerInfo.trustScore.toString());
    console.log("   Name:", issuerInfo.name);
  }

  // Also register the mock issuers on the correct contract
  console.log("\n⚙️  Registering mock issuers on correct contract...");
  
  // Read mock issuer addresses from deployed-addresses.json
  const mockIssuers = [
    { address: deployedData.issuers.mockExchange, name: "Mock Exchange" },
    { address: deployedData.issuers.mockEmployer, name: "Mock Employer" },
    { address: deployedData.issuers.mockBank, name: "Mock Bank" }
  ];

  for (const issuer of mockIssuers) {
    const isReg = await oracle.isIssuerRegistered(issuer.address);
    if (!isReg) {
      console.log(`   Registering ${issuer.name}...`);
      const tx = await oracle.registerIssuer(issuer.address, 100, issuer.name);
      await tx.wait();
      console.log(`   ✅ ${issuer.name} registered`);
    } else {
      console.log(`   ⚠️  ${issuer.name} already registered`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ All issuers registered on correct contract!");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error registering issuer:");
    console.error(error);
    process.exit(1);
  });

