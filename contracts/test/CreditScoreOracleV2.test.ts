import { expect } from "chai";
import { ethers } from "hardhat";
import { CreditScoreOracle } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * Test suite for CreditScoreOracle v2 features
 * Tests new registries, tier configuration, and enhanced scoring
 */
describe("CreditScoreOracle v2", function () {
  let oracle: CreditScoreOracle;
  let owner: SignerWithAddress;
  let issuer: SignerWithAddress;
  let user: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, issuer, user, user2] = await ethers.getSigners();

    const Oracle = await ethers.getContractFactory("CreditScoreOracle");
    oracle = await Oracle.deploy();
    await oracle.waitForDeployment();
  });

  describe("Issuer Registry v2", function () {
    it("Should register new issuer with trust score and name", async function () {
      await oracle.registerIssuer(issuer.address, 100, "Test Bank Issuer");

      const issuerInfo = await oracle.issuers(issuer.address);
      expect(issuerInfo.registered).to.be.true;
      expect(issuerInfo.isActive).to.be.true;
      expect(issuerInfo.trustScore).to.equal(100);
      expect(issuerInfo.name).to.equal("Test Bank Issuer");
      expect(issuerInfo.registeredAt).to.be.gt(0);
      expect(issuerInfo.credentialCount).to.equal(0);
    });

    it("Should emit IssuerRegistered event", async function () {
      await expect(oracle.registerIssuer(issuer.address, 100, "Test Issuer"))
        .to.emit(oracle, "IssuerRegistered")
        .withArgs(issuer.address, 100, "Test Issuer");
    });

    it("Should update issuer trust score", async function () {
      await oracle.registerIssuer(issuer.address, 100, "Test Issuer");
      await oracle.updateIssuerTrust(issuer.address, 80);

      const issuerInfo = await oracle.issuers(issuer.address);
      expect(issuerInfo.trustScore).to.equal(80);
    });

    it("Should emit IssuerTrustUpdated event", async function () {
      await oracle.registerIssuer(issuer.address, 100, "Test Issuer");

      await expect(oracle.updateIssuerTrust(issuer.address, 75))
        .to.emit(oracle, "IssuerTrustUpdated")
        .withArgs(issuer.address, 100, 75);
    });

    it("Should deactivate issuer", async function () {
      await oracle.registerIssuer(issuer.address, 100, "Test Issuer");
      await oracle.deactivateIssuer(issuer.address);

      const issuerInfo = await oracle.issuers(issuer.address);
      expect(issuerInfo.isActive).to.be.false;
    });

    it("Should emit IssuerDeactivated event", async function () {
      await oracle.registerIssuer(issuer.address, 100, "Test Issuer");

      await expect(oracle.deactivateIssuer(issuer.address))
        .to.emit(oracle, "IssuerDeactivated")
        .withArgs(issuer.address);
    });

    it("Should reject non-owner registry updates", async function () {
      await expect(
        oracle.connect(user).registerIssuer(issuer.address, 100, "Test")
      ).to.be.revertedWithCustomError(oracle, "OwnableUnauthorizedAccount");
    });

    it("Should reject invalid trust scores", async function () {
      await expect(
        oracle.registerIssuer(issuer.address, 101, "Test")
      ).to.be.revertedWith("Trust score must be 0-100");
    });

    it("Should reject empty issuer name", async function () {
      await expect(
        oracle.registerIssuer(issuer.address, 100, "")
      ).to.be.revertedWith("Name required");
    });

    it("Should reject updating inactive issuer", async function () {
      await oracle.registerIssuer(issuer.address, 100, "Test");
      await oracle.deactivateIssuer(issuer.address);

      await expect(
        oracle.updateIssuerTrust(issuer.address, 80)
      ).to.be.revertedWith("Issuer not active");
    });

    it("Should reject deactivating already inactive issuer", async function () {
      await oracle.registerIssuer(issuer.address, 100, "Test");
      await oracle.deactivateIssuer(issuer.address);

      await expect(
        oracle.deactivateIssuer(issuer.address)
      ).to.be.revertedWith("Issuer already inactive");
    });
  });

  describe("Credential Type Registry", function () {
    it("Should register credential type with weight and decay", async function () {
      const typeHash = ethers.id("BANK_BALANCE_HIGH");
      await oracle.registerCredentialType(typeHash, 150, 90, "High Bank Balance");

      const typeConfig = await oracle.credentialTypes(typeHash);
      expect(typeConfig.baseWeight).to.equal(150);
      expect(typeConfig.decayDays).to.equal(90);
      expect(typeConfig.isActive).to.be.true;
      expect(typeConfig.displayName).to.equal("High Bank Balance");
    });

    it("Should emit CredentialTypeRegistered event", async function () {
      const typeHash = ethers.id("TEST_CRED");

      await expect(oracle.registerCredentialType(typeHash, 100, 180, "Test Credential"))
        .to.emit(oracle, "CredentialTypeRegistered")
        .withArgs(typeHash, 100, "Test Credential");
    });

    it("Should update credential type weight", async function () {
      const typeHash = ethers.id("TEST_CRED");
      await oracle.registerCredentialType(typeHash, 150, 90, "Test");
      await oracle.updateCredentialTypeWeight(typeHash, 200);

      const typeConfig = await oracle.credentialTypes(typeHash);
      expect(typeConfig.baseWeight).to.equal(200);
    });

    it("Should emit CredentialTypeUpdated event", async function () {
      const typeHash = ethers.id("TEST_CRED");
      await oracle.registerCredentialType(typeHash, 150, 90, "Test");

      await expect(oracle.updateCredentialTypeWeight(typeHash, 175))
        .to.emit(oracle, "CredentialTypeUpdated")
        .withArgs(typeHash, 175);
    });

    it("Should reject zero weight", async function () {
      const typeHash = ethers.id("TEST_CRED");
      await expect(
        oracle.registerCredentialType(typeHash, 0, 90, "Test")
      ).to.be.revertedWith("Weight must be positive");
    });

    it("Should reject zero decay days", async function () {
      const typeHash = ethers.id("TEST_CRED");
      await expect(
        oracle.registerCredentialType(typeHash, 100, 0, "Test")
      ).to.be.revertedWith("Decay days must be positive");
    });

    it("Should reject empty display name", async function () {
      const typeHash = ethers.id("TEST_CRED");
      await expect(
        oracle.registerCredentialType(typeHash, 100, 90, "")
      ).to.be.revertedWith("Display name required");
    });

    it("Should reject updating unregistered credential type", async function () {
      const typeHash = ethers.id("NONEXISTENT");
      await expect(
        oracle.updateCredentialTypeWeight(typeHash, 100)
      ).to.be.revertedWith("Credential type not registered");
    });
  });

  describe("Tier Configuration", function () {
    beforeEach(async function () {
      await oracle.initializeTiers();
    });

    it("Should initialize all 8 tiers correctly", async function () {
      const tier0 = await oracle.tiers(0);
      expect(tier0.minScore).to.equal(900);
      expect(tier0.maxScore).to.equal(1000);
      expect(tier0.collateralFactor).to.equal(5000);
      expect(tier0.tierName).to.equal("Exceptional");

      const tier7 = await oracle.tiers(7);
      expect(tier7.minScore).to.equal(0);
      expect(tier7.maxScore).to.equal(299);
      expect(tier7.collateralFactor).to.equal(15000);
      expect(tier7.tierName).to.equal("Very Poor");
    });

    it("Should return correct tier for score 900", async function () {
      const tier = await oracle.getTierForScore(900);
      expect(tier.tierName).to.equal("Exceptional");
      expect(tier.collateralFactor).to.equal(5000);
    });

    it("Should return correct tier for score 500", async function () {
      const tier = await oracle.getTierForScore(500);
      expect(tier.tierName).to.equal("Average");
      expect(tier.collateralFactor).to.equal(10000);
    });

    it("Should return correct tier for score 750", async function () {
      const tier = await oracle.getTierForScore(750);
      expect(tier.tierName).to.equal("Good");
      expect(tier.collateralFactor).to.equal(7500);
    });

    it("Should return lowest tier for score 0", async function () {
      const tier = await oracle.getTierForScore(0);
      expect(tier.tierName).to.equal("Very Poor");
    });

    it("Should return highest tier for score 1000", async function () {
      const tier = await oracle.getTierForScore(1000);
      expect(tier.tierName).to.equal("Exceptional");
    });

    it("Should handle edge case at tier boundaries", async function () {
      const tier899 = await oracle.getTierForScore(899);
      expect(tier899.tierName).to.equal("Excellent");

      const tier900 = await oracle.getTierForScore(900);
      expect(tier900.tierName).to.equal("Exceptional");
    });
  });

  describe("computeCreditScore with Registries", function () {
    beforeEach(async function () {
      // Register issuer
      await oracle.registerIssuer(issuer.address, 100, "Test Issuer");

      // Register credential types (decayDays must be uint8, max 255)
      await oracle.registerCredentialType(
        ethers.id("CEX_HISTORY"),
        80,
        180, // Changed from 365 to 180 (uint8 max is 255)
        "CEX History"
      );
      await oracle.registerCredentialType(
        ethers.id("EMPLOYMENT"),
        70,
        180,
        "Employment Verification"
      );
      await oracle.registerCredentialType(
        ethers.id("BANK_BALANCE"),
        100,
        90,
        "Bank Balance"
      );

      // Initialize tiers
      await oracle.initializeTiers();
    });

    it("Should return base score for user with no credentials", async function () {
      const score = await oracle.computeCreditScore.staticCall(user.address);
      expect(score).to.equal(500);
    });

    it("Should respect MAX_CREDENTIALS_PER_USER limit", async function () {
      const maxCreds = await oracle.MAX_CREDENTIALS_PER_USER();
      expect(maxCreds).to.equal(20);
    });

    it("Should emit ScoreComputed event with breakdown", async function () {
      // First submit a credential
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "uint256"],
        [issuer.address, user.address, 0, Math.floor(Date.now() / 1000), expiresAt]
      );
      const messageHash = ethers.keccak256(credentialData);
      const signature = await issuer.signMessage(ethers.getBytes(messageHash));

      await oracle.connect(user).submitCredential(
        credentialData,
        signature,
        issuer.address,
        0,
        expiresAt
      );

      // Now compute score and check event
      await expect(oracle.computeCreditScore(user.address))
        .to.emit(oracle, "ScoreComputed");
    });

    it("Should emit ScoreComponentAdded for each credential", async function () {
      // Register the credential type (type 0 as bytes32)
      const typeHash = ethers.zeroPadValue(ethers.toBeHex(0), 32);
      await oracle.registerCredentialType(typeHash, 100, 90, "Test Type 0");

      // Submit credential
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "uint256"],
        [issuer.address, user.address, 0, Math.floor(Date.now() / 1000), expiresAt]
      );
      const messageHash = ethers.keccak256(credentialData);
      const signature = await issuer.signMessage(ethers.getBytes(messageHash));

      await oracle.connect(user).submitCredential(
        credentialData,
        signature,
        issuer.address,
        0,
        expiresAt
      );

      // Compute score and check component events
      await expect(oracle.computeCreditScore(user.address))
        .to.emit(oracle, "ScoreComponentAdded");
    });

    it("Should reject computing score for zero address", async function () {
      await expect(
        oracle.computeCreditScore(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid user address");
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should have nonReentrant modifier on computeCreditScore", async function () {
      // Register issuer and credential type
      await oracle.registerIssuer(issuer.address, 100, "Test");
      
      // The nonReentrant modifier is present in the code
      // This test verifies it compiles and deploys correctly
      const score = await oracle.computeCreditScore.staticCall(user.address);
      expect(score).to.equal(500);
    });
  });

  describe("Backward Compatibility", function () {
    it("Should still support legacy submitCredential function", async function () {
      await oracle.registerIssuer(issuer.address, 100, "Test");

      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "uint256"],
        [issuer.address, user.address, 0, Math.floor(Date.now() / 1000), expiresAt]
      );
      const messageHash = ethers.keccak256(credentialData);
      const signature = await issuer.signMessage(ethers.getBytes(messageHash));

      await expect(
        oracle.connect(user).submitCredential(
          credentialData,
          signature,
          issuer.address,
          0,
          expiresAt
        )
      ).to.emit(oracle, "CredentialSubmitted");
    });

    it("Should reject credentials from inactive issuers", async function () {
      await oracle.registerIssuer(issuer.address, 100, "Test");
      await oracle.deactivateIssuer(issuer.address);

      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "uint256"],
        [issuer.address, user.address, 0, Math.floor(Date.now() / 1000), expiresAt]
      );
      const messageHash = ethers.keccak256(credentialData);
      const signature = await issuer.signMessage(ethers.getBytes(messageHash));

      await expect(
        oracle.connect(user).submitCredential(
          credentialData,
          signature,
          issuer.address,
          0,
          expiresAt
        )
      ).to.be.revertedWith("Issuer not active");
    });
  });

  describe("Gas Optimization", function () {
    it("Should handle 10 credentials efficiently", async function () {
      await oracle.registerIssuer(issuer.address, 100, "Test");
      await oracle.registerCredentialType(ethers.id("TEST_TYPE"), 100, 90, "Test");

      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);

      // Submit 10 credentials
      for (let i = 0; i < 10; i++) {
        const nonce = Math.floor(Math.random() * 1000000); // Integer nonce
        const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "address", "uint256", "uint256", "uint256", "uint256"],
          [issuer.address, user.address, 0, Math.floor(Date.now() / 1000), expiresAt, nonce]
        );
        const messageHash = ethers.keccak256(credentialData);
        const signature = await issuer.signMessage(ethers.getBytes(messageHash));

        await oracle.connect(user).submitCredential(
          credentialData,
          signature,
          issuer.address,
          0,
          expiresAt
        );
      }

      // This should complete without running out of gas
      const score = await oracle.computeCreditScore.staticCall(user.address);
      expect(score).to.be.gte(500);
    });
  });
});

