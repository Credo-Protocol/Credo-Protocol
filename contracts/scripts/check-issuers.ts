import { ethers } from "hardhat";

/**
 * Check registration status of all mock issuers
 */
async function main() {
  const oracleAddress = "0x6C2A996730D4db1Cb3f8F0073f8e973D125DD08D";
  const oracle = await ethers.getContractAt("CreditScoreOracle", oracleAddress);
  
  const issuers = {
    "Mock Bank": "0x3cb42f88131DBe9D0b53E0c945c6e1F76Ea0220E",
    "Mock Employer": "0x22a052d047E8EDC3A75010588B034d66db9bBCE1",
    "Mock Exchange": "0x499CEB20A05A1eF76D6805f293ea9fD570d6A431"
  };
  
  console.log("🔍 Checking issuer registration status...\n");
  
  for (const [name, address] of Object.entries(issuers)) {
    try {
      const isRegistered = await oracle.isIssuerRegistered(address);
      console.log(`${name} (${address}):`);
      if (isRegistered) {
        console.log(`  ✅ Registered as issuer`);
      } else {
        console.log(`  ❌ NOT registered`);
      }
      console.log();
    } catch (err) {
      console.log(`${name} (${address}):`);
      console.log(`  ❌ Error checking: ${(err as Error).message}`);
      console.log();
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

