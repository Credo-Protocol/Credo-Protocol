import { ethers } from "hardhat";

/**
 * Register the deployer address as an issuer in the CreditScoreOracle
 * This allows the deployer to submit credentials for testing
 */
async function main() {
  console.log("🔐 Registering Deployer as Issuer\n");
  console.log("=" .repeat(60));

  // Use the correct Oracle address from deployed-addresses.json
  const ORACLE_ADDRESS = "0xFA1F2920F107FE2199CC5f389349e3F2292387BD";
  
  console.log("📍 Oracle Address:", ORACLE_ADDRESS);

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
  
  const mockIssuers = [
    { address: "0x499CEB20A05A1eF76D6805f293ea9fD570d6A431", name: "Mock Exchange" },
    { address: "0x22a052d047E8EDC3A75010588B034d66db9bBCE1", name: "Mock Employer" },
    { address: "0x3cb42f88131DBe9D0b53E0c945c6e1F76Ea0220E", name: "Mock Bank" }
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

