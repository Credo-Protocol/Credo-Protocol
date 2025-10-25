import { expect } from "chai";
import { ethers } from "hardhat";
import { CreditScoreOracle } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * Test suite for CreditScoreOracle contract
 * Tests issuer management, credential submission, and score calculation
 */
describe("CreditScoreOracle", function () {
  let oracle: CreditScoreOracle;
  let owner: SignerWithAddress;
  let issuer1: SignerWithAddress;
  let issuer2: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, issuer1, issuer2, user1, user2] = await ethers.getSigners();
    
    const CreditScoreOracleFactory = await ethers.getContractFactory("CreditScoreOracle");
    oracle = await CreditScoreOracleFactory.deploy();
    await oracle.waitForDeployment();
  });

  describe("Issuer Management", function () {
    it("Should allow owner to register issuer", async function () {
      await oracle.registerIssuer(issuer1.address, 100, "Test Issuer");
      
      expect(await oracle.isIssuerRegistered(issuer1.address)).to.be.true;
      
      const issuerInfo = await oracle.issuers(issuer1.address);
      expect(issuerInfo.registered).to.be.true;
      expect(issuerInfo.isActive).to.be.true;
      expect(issuerInfo.trustScore).to.equal(100);
      expect(issuerInfo.credentialCount).to.equal(0);
    });

    it("Should reject issuer registration from non-owner", async function () {
      await expect(
        oracle.connect(user1).registerIssuer(issuer1.address, 100, "Test")
      ).to.be.revertedWithCustomError(oracle, "OwnableUnauthorizedAccount");
    });

    it("Should reject invalid issuer address", async function () {
      await expect(
        oracle.registerIssuer(ethers.ZeroAddress, 100, "Test")
      ).to.be.revertedWith("Invalid issuer address");
    });

    it("Should reject trust score over 100", async function () {
      await expect(
        oracle.registerIssuer(issuer1.address, 101, "Test")
      ).to.be.revertedWith("Trust score must be 0-100");
    });

    it("Should reject duplicate issuer registration", async function () {
      await oracle.registerIssuer(issuer1.address, 100, "Test");
      
      await expect(
        oracle.registerIssuer(issuer1.address, 100, "Test")
      ).to.be.revertedWith("Issuer already registered");
    });

    it("Should allow updating issuer trust score", async function () {
      await oracle.registerIssuer(issuer1.address, 100, "Test");
      await oracle.updateIssuerTrust(issuer1.address, 80);
      
      const issuerInfo = await oracle.issuers(issuer1.address);
      expect(issuerInfo.trustScore).to.equal(80);
    });

    it("Should reject trust score update for unregistered issuer", async function () {
      await expect(
        oracle.updateIssuerTrust(issuer1.address, 80)
      ).to.be.revertedWith("Issuer not registered");
    });
  });

  describe("Credential Submission", function () {
    let credentialData: string;
    let signature: string;

    beforeEach(async function () {
      // Register issuer with 100% trust score
      await oracle.registerIssuer(issuer1.address, 100, "Test Issuer");
      
      // Create credential data
      const credentialType = 0; // Proof of Income (150 points)
      const issuedAt = Math.floor(Date.now() / 1000);
      const expiresAt = issuedAt + (180 * 24 * 60 * 60); // 180 days
      
      credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "uint256"],
        [issuer1.address, user1.address, credentialType, issuedAt, expiresAt]
      );
      
      // Sign credential data
      const messageHash = ethers.keccak256(credentialData);
      signature = await issuer1.signMessage(ethers.getBytes(messageHash));
    });

    it("Should accept valid credential and update score", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      
      await oracle.connect(user1).submitCredential(
        credentialData,
        signature,
        issuer1.address,
        0, // Proof of Income
        expiresAt
      );
      
      const score = await oracle.getCreditScore(user1.address);
      expect(score).to.be.gt(500); // Should be higher than base score
    });

    it("Should reject credential from unregistered issuer", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      
      // Create credential from unregistered issuer
      const badCredentialData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "uint256"],
        [issuer2.address, user1.address, 0, Math.floor(Date.now() / 1000), expiresAt]
      );
      
      const messageHash = ethers.keccak256(badCredentialData);
      const badSignature = await issuer2.signMessage(ethers.getBytes(messageHash));
      
      await expect(
        oracle.connect(user1).submitCredential(
          badCredentialData,
          badSignature,
          issuer2.address,
          0,
          expiresAt
        )
      ).to.be.revertedWith("Issuer not registered");
    });

    it("Should reject expired credential", async function () {
      const expiredTime = Math.floor(Date.now() / 1000) - 1; // Already expired
      
      await expect(
        oracle.connect(user1).submitCredential(
          credentialData,
          signature,
          issuer1.address,
          0,
          expiredTime
        )
      ).to.be.revertedWith("Credential already expired");
    });

    it("Should prevent replay attacks", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      
      // Submit credential once
      await oracle.connect(user1).submitCredential(
        credentialData,
        signature,
        issuer1.address,
        0,
        expiresAt
      );
      
      // Try to submit same credential again
      await expect(
        oracle.connect(user1).submitCredential(
          credentialData,
          signature,
          issuer1.address,
          0,
          expiresAt
        )
      ).to.be.revertedWith("Credential already used");
    });

    it("Should reject invalid signature", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      
      // Sign with wrong signer
      const messageHash = ethers.keccak256(credentialData);
      const wrongSignature = await issuer2.signMessage(ethers.getBytes(messageHash));
      
      await expect(
        oracle.connect(user1).submitCredential(
          credentialData,
          wrongSignature,
          issuer1.address,
          0,
          expiresAt
        )
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should reject invalid credential type", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      
      await expect(
        oracle.connect(user1).submitCredential(
          credentialData,
          signature,
          issuer1.address,
          5, // Invalid type (max is 4)
          expiresAt
        )
      ).to.be.revertedWith("Invalid credential type");
    });
  });

  describe("Score Calculation", function () {
    beforeEach(async function () {
      // Register issuers with different trust scores
      await oracle.registerIssuer(issuer1.address, 100, "Issuer 1"); // 100% trust
      await oracle.registerIssuer(issuer2.address, 50, "Issuer 2");  // 50% trust
    });

    it("Should return base score (500) for new users", async function () {
      const score = await oracle.getCreditScore(user1.address);
      expect(score).to.equal(500);
    });

    it("Should calculate score with proper credential weights", async function () {
      // Submit Proof of Income credential (150 points base)
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "uint256"],
        [issuer1.address, user1.address, 0, Math.floor(Date.now() / 1000), expiresAt]
      );
      const messageHash = ethers.keccak256(credentialData);
      const signature = await issuer1.signMessage(ethers.getBytes(messageHash));
      
      await oracle.connect(user1).submitCredential(
        credentialData,
        signature,
        issuer1.address,
        0, // Proof of Income
        expiresAt
      );
      
      const score = await oracle.getCreditScore(user1.address);
      // Base 500 + 150 (income) + 5% diversity bonus = ~682 (with full recency)
      expect(score).to.be.gte(675).and.lte(690);
    });

    it("Should apply issuer trust score multiplier", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      
      // Submit same credential type from issuer with 50% trust
      const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "uint256"],
        [issuer2.address, user2.address, 0, Math.floor(Date.now() / 1000), expiresAt]
      );
      const messageHash = ethers.keccak256(credentialData);
      const signature = await issuer2.signMessage(ethers.getBytes(messageHash));
      
      await oracle.connect(user2).submitCredential(
        credentialData,
        signature,
        issuer2.address,
        0,
        expiresAt
      );
      
      const score2 = await oracle.getCreditScore(user2.address);
      
      // Score should be lower due to 50% trust multiplier
      // Base 500 + (150 * 0.5) + 5% diversity = ~603 (with full recency)
      expect(score2).to.be.gte(595).and.lte(610);
    });

    it("Should apply diversity bonus for multiple credential types", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      
      // Submit three different credential types
      for (let credType = 0; credType < 3; credType++) {
        const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "address", "uint256", "uint256", "uint256"],
          [issuer1.address, user1.address, credType, Math.floor(Date.now() / 1000), expiresAt]
        );
        const messageHash = ethers.keccak256(credentialData);
        const signature = await issuer1.signMessage(ethers.getBytes(messageHash));
        
        await oracle.connect(user1).submitCredential(
          credentialData,
          signature,
          issuer1.address,
          credType,
          expiresAt
        );
      }
      
      const score = await oracle.getCreditScore(user1.address);
      // Should have 15% diversity bonus (3 types * 5%)
      expect(score).to.be.gte(800); // Significant boost from diversity
    });

    it("Should cap score at 1000", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      
      // Submit all 5 credential types multiple times
      for (let credType = 0; credType <= 4; credType++) {
        for (let i = 0; i < 2; i++) {
          const nonce = Math.floor(Math.random() * 1000000000); // Integer nonce
          const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "address", "uint256", "uint256", "uint256", "uint256"],
            [issuer1.address, user1.address, credType, Math.floor(Date.now() / 1000), expiresAt, nonce]
          );
          const messageHash = ethers.keccak256(credentialData);
          const signature = await issuer1.signMessage(ethers.getBytes(messageHash));
          
          await oracle.connect(user1).submitCredential(
            credentialData,
            signature,
            issuer1.address,
            credType,
            expiresAt
          );
        }
      }
      
      const score = await oracle.getCreditScore(user1.address);
      expect(score).to.equal(1000); // Should be capped
    });
  });

  describe("View Functions", function () {
    it("Should return correct score details", async function () {
      const [score, credCount, lastUpdated, initialized] = 
        await oracle.getScoreDetails(user1.address);
      
      expect(score).to.equal(500); // Base score
      expect(credCount).to.equal(0);
      expect(lastUpdated).to.equal(0);
      expect(initialized).to.be.false;
    });

    it("Should check score threshold correctly", async function () {
      expect(await oracle.isScoreAboveThreshold(user1.address, 400)).to.be.true;
      expect(await oracle.isScoreAboveThreshold(user1.address, 500)).to.be.true;
      expect(await oracle.isScoreAboveThreshold(user1.address, 501)).to.be.false;
    });

    it("Should return credential count", async function () {
      expect(await oracle.getUserCredentialCount(user1.address)).to.equal(0);
      
      // Add a credential
      await oracle.registerIssuer(issuer1.address, 100, "Test Issuer");
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "uint256"],
        [issuer1.address, user1.address, 0, Math.floor(Date.now() / 1000), expiresAt]
      );
      const messageHash = ethers.keccak256(credentialData);
      const signature = await issuer1.signMessage(ethers.getBytes(messageHash));
      
      await oracle.connect(user1).submitCredential(
        credentialData,
        signature,
        issuer1.address,
        0,
        expiresAt
      );
      
      expect(await oracle.getUserCredentialCount(user1.address)).to.equal(1);
    });
  });
});

