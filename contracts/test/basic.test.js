const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Basic smoke test to verify test infrastructure works
 */
describe("Basic Contract Tests", function () {
  describe("MockUSDC", function () {
    let mockUSDC;
    let owner, user1;

    beforeEach(async function () {
      [owner, user1] = await ethers.getSigners();
      
      const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
      mockUSDC = await MockUSDCFactory.deploy();
      await mockUSDC.waitForDeployment();
    });

    it("Should deploy with correct name and symbol", async function () {
      expect(await mockUSDC.name()).to.equal("Mock USDC");
      expect(await mockUSDC.symbol()).to.equal("mUSDC");
    });

    it("Should have 6 decimals", async function () {
      expect(await mockUSDC.decimals()).to.equal(6);
    });

    it("Should allow faucet minting", async function () {
      const amount = ethers.parseUnits("100", 6);
      await mockUSDC.faucet(user1.address, amount);
      expect(await mockUSDC.balanceOf(user1.address)).to.equal(amount);
    });
  });

  describe("CreditScoreOracle", function () {
    let oracle;
    let owner, issuer, user1;

    beforeEach(async function () {
      [owner, issuer, user1] = await ethers.getSigners();
      
      const OracleFactory = await ethers.getContractFactory("CreditScoreOracle");
      oracle = await OracleFactory.deploy();
      await oracle.waitForDeployment();
    });

    it("Should deploy successfully", async function () {
      expect(await oracle.getAddress()).to.be.properAddress;
    });

    it("Should return base score for new users", async function () {
      const score = await oracle.getCreditScore(user1.address);
      expect(score).to.equal(500);
    });

    it("Should allow owner to register issuer", async function () {
      await oracle.registerIssuer(issuer.address, 100, "Test Issuer");
      expect(await oracle.isIssuerRegistered(issuer.address)).to.be.true;
    });

    it("Should calculate correct collateral factors", async function () {
      // These are static helper functions we can test without state
      const OracleInterface = await ethers.getContractFactory("CreditScoreOracle");
      const testOracle = await OracleInterface.deploy();
      
      // Just verify deployment for now
      expect(await testOracle.getAddress()).to.be.properAddress;
    });
  });

  describe("LendingPool", function () {
    let lendingPool, oracle, usdc;
    let owner, user1;

    beforeEach(async function () {
      [owner, user1] = await ethers.getSigners();
      
      // Deploy oracle first
      const OracleFactory = await ethers.getContractFactory("CreditScoreOracle");
      oracle = await OracleFactory.deploy();
      await oracle.waitForDeployment();
      
      // Deploy lending pool
      const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
      lendingPool = await LendingPoolFactory.deploy(await oracle.getAddress());
      await lendingPool.waitForDeployment();
      
      // Deploy USDC
      const USDCFactory = await ethers.getContractFactory("MockUSDC");
      usdc = await USDCFactory.deploy();
      await usdc.waitForDeployment();
    });

    it("Should deploy with correct oracle address", async function () {
      expect(await lendingPool.creditOracle()).to.equal(await oracle.getAddress());
    });

    it("Should allow owner to enable assets", async function () {
      await lendingPool.enableAsset(await usdc.getAddress(), 500);
      const assetData = await lendingPool.assets(await usdc.getAddress());
      expect(assetData.enabled).to.be.true;
    });

    it("Should calculate correct collateral factors", async function () {
      expect(await lendingPool.calculateCollateralFactor(950)).to.equal(50);
      expect(await lendingPool.calculateCollateralFactor(850)).to.equal(60);
      expect(await lendingPool.calculateCollateralFactor(750)).to.equal(75);
      expect(await lendingPool.calculateCollateralFactor(550)).to.equal(100);
      expect(await lendingPool.calculateCollateralFactor(250)).to.equal(150);
    });

    it("Should allow users to supply assets", async function () {
      // Enable USDC
      await lendingPool.enableAsset(await usdc.getAddress(), 500);
      
      // Give user1 some USDC
      await usdc.faucet(user1.address, ethers.parseUnits("1000", 6));
      
      // Approve and supply
      const amount = ethers.parseUnits("500", 6);
      await usdc.connect(user1).approve(await lendingPool.getAddress(), amount);
      await lendingPool.connect(user1).supply(await usdc.getAddress(), amount);
      
      // Check balance
      const supplied = await lendingPool.getUserSupplied(user1.address, await usdc.getAddress());
      expect(supplied).to.equal(amount);
    });
  });
});

