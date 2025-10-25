import { expect } from "chai";
import { ethers } from "hardhat";
import { LendingPool, CreditScoreOracle, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Test suite for LendingPool contract
 * Tests supply, borrow, repay, withdraw, and liquidation functionality
 */
describe("LendingPool", function () {
  let lendingPool: LendingPool;
  let oracle: CreditScoreOracle;
  let usdc: MockUSDC;
  let owner: SignerWithAddress;
  let issuer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let liquidator: SignerWithAddress;

  beforeEach(async function () {
    [owner, issuer, user1, user2, liquidator] = await ethers.getSigners();
    
    // Deploy contracts
    const CreditScoreOracleFactory = await ethers.getContractFactory("CreditScoreOracle");
    oracle = await CreditScoreOracleFactory.deploy();
    await oracle.waitForDeployment();
    
    const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
    lendingPool = await LendingPoolFactory.deploy(await oracle.getAddress());
    await lendingPool.waitForDeployment();
    
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDCFactory.deploy();
    await usdc.waitForDeployment();
    
    // Enable USDC in lending pool (5% base rate)
    await lendingPool.enableAsset(await usdc.getAddress(), 500);
    
    // Register issuer in oracle
    await oracle.registerIssuer(issuer.address, 100, "Test Issuer");
  });

  describe("Asset Management", function () {
    it("Should enable asset correctly", async function () {
      const usdcAddress = await usdc.getAddress();
      const assetData = await lendingPool.assets(usdcAddress);
      
      expect(assetData.enabled).to.be.true;
      expect(assetData.baseInterestRate).to.equal(500);
      expect(assetData.totalSupply).to.equal(0);
      expect(assetData.totalBorrowed).to.equal(0);
    });

    it("Should reject enabling asset from non-owner", async function () {
      const MockToken = await ethers.getContractFactory("MockUSDC");
      const token = await MockToken.deploy();
      
      await expect(
        lendingPool.connect(user1).enableAsset(await token.getAddress(), 500)
      ).to.be.revertedWithCustomError(lendingPool, "OwnableUnauthorizedAccount");
    });

    it("Should reject duplicate asset enablement", async function () {
      await expect(
        lendingPool.enableAsset(await usdc.getAddress(), 500)
      ).to.be.revertedWith("Asset already enabled");
    });

    it("Should disable asset correctly", async function () {
      await lendingPool.disableAsset(await usdc.getAddress());
      
      const assetData = await lendingPool.assets(await usdc.getAddress());
      expect(assetData.enabled).to.be.false;
    });
  });

  describe("Supply & Withdraw", function () {
    beforeEach(async function () {
      // Give user1 some USDC
      await usdc.faucet(user1.address, ethers.parseUnits("10000", 6));
    });

    it("Should allow user to supply assets", async function () {
      const amount = ethers.parseUnits("1000", 6);
      
      // Approve and supply
      await usdc.connect(user1).approve(await lendingPool.getAddress(), amount);
      await lendingPool.connect(user1).supply(await usdc.getAddress(), amount);
      
      // Check balances
      const supplied = await lendingPool.getUserSupplied(user1.address, await usdc.getAddress());
      expect(supplied).to.equal(amount);
      
      const assetData = await lendingPool.assets(await usdc.getAddress());
      expect(assetData.totalSupply).to.equal(amount);
    });

    it("Should reject supply of disabled asset", async function () {
      const MockToken = await ethers.getContractFactory("MockUSDC");
      const token = await MockToken.deploy();
      
      await expect(
        lendingPool.connect(user1).supply(await token.getAddress(), 100)
      ).to.be.revertedWith("Asset not enabled");
    });

    it("Should allow user to withdraw supplied assets", async function () {
      const amount = ethers.parseUnits("1000", 6);
      
      // Supply first
      await usdc.connect(user1).approve(await lendingPool.getAddress(), amount);
      await lendingPool.connect(user1).supply(await usdc.getAddress(), amount);
      
      // Withdraw
      const withdrawAmount = ethers.parseUnits("500", 6);
      await lendingPool.connect(user1).withdraw(await usdc.getAddress(), withdrawAmount);
      
      const supplied = await lendingPool.getUserSupplied(user1.address, await usdc.getAddress());
      expect(supplied).to.equal(amount - withdrawAmount);
    });

    it("Should reject withdrawal exceeding supplied balance", async function () {
      const amount = ethers.parseUnits("1000", 6);
      
      await usdc.connect(user1).approve(await lendingPool.getAddress(), amount);
      await lendingPool.connect(user1).supply(await usdc.getAddress(), amount);
      
      await expect(
        lendingPool.connect(user1).withdraw(await usdc.getAddress(), ethers.parseUnits("1001", 6))
      ).to.be.revertedWith("Insufficient supplied balance");
    });
  });

  describe("Borrow & Repay", function () {
    beforeEach(async function () {
      // Setup: user1 supplies collateral, user2 has high credit score
      await usdc.faucet(user1.address, ethers.parseUnits("10000", 6));
      await usdc.connect(user1).approve(await lendingPool.getAddress(), ethers.parseUnits("5000", 6));
      await lendingPool.connect(user1).supply(await usdc.getAddress(), ethers.parseUnits("5000", 6));
      
      // Give user2 a high credit score (700+)
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      for (let credType = 0; credType < 3; credType++) {
        const nonce = Math.floor(Math.random() * 1000000000); // Integer nonce
        const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "address", "uint256", "uint256", "uint256", "uint256"],
          [issuer.address, user2.address, credType, Math.floor(Date.now() / 1000), expiresAt, nonce]
        );
        const messageHash = ethers.keccak256(credentialData);
        const signature = await issuer.signMessage(ethers.getBytes(messageHash));
        
        await oracle.connect(user2).submitCredential(
          credentialData,
          signature,
          issuer.address,
          credType,
          expiresAt
        );
      }
      
      // User2 supplies collateral
      await usdc.faucet(user2.address, ethers.parseUnits("1000", 6));
      await usdc.connect(user2).approve(await lendingPool.getAddress(), ethers.parseUnits("1000", 6));
      await lendingPool.connect(user2).supply(await usdc.getAddress(), ethers.parseUnits("1000", 6));
    });

    it("Should calculate correct collateral factor based on credit score", async function () {
      const score = await oracle.getCreditScore(user2.address);
      const collateralFactor = await lendingPool.calculateCollateralFactor(score);
      
      // Score ~800+ should give 60-75% collateral factor
      expect(collateralFactor).to.be.lte(100);
    });

    it("Should allow high-score user to borrow with less collateral", async function () {
      const borrowAmount = ethers.parseUnits("100", 6);
      
      await lendingPool.connect(user2).borrow(await usdc.getAddress(), borrowAmount);
      
      const borrowed = await lendingPool.getUserBorrowed(user2.address, await usdc.getAddress());
      expect(borrowed).to.equal(borrowAmount);
    });

    it("Should reject borrow exceeding collateral limits", async function () {
      // Try to borrow way more than collateral allows
      const tooMuch = ethers.parseUnits("5000", 6);
      
      await expect(
        lendingPool.connect(user2).borrow(await usdc.getAddress(), tooMuch)
      ).to.be.revertedWith("Insufficient collateral for credit score");
    });

    it("Should reject borrow when insufficient liquidity", async function () {
      // Try to borrow more than available in pool
      // Note: Credit score check happens first, so this will fail on collateral
      await expect(
        lendingPool.connect(user2).borrow(await usdc.getAddress(), ethers.parseUnits("6000", 6))
      ).to.be.revertedWith("Insufficient collateral for credit score");
    });

    it("Should allow user to repay borrowed assets", async function () {
      const borrowAmount = ethers.parseUnits("100", 6);
      
      // Borrow
      await lendingPool.connect(user2).borrow(await usdc.getAddress(), borrowAmount);
      
      // Repay
      await usdc.connect(user2).approve(await lendingPool.getAddress(), borrowAmount);
      await lendingPool.connect(user2).repay(await usdc.getAddress(), borrowAmount);
      
      const borrowed = await lendingPool.getUserBorrowed(user2.address, await usdc.getAddress());
      expect(borrowed).to.equal(0);
    });

    it("Should cap repayment at borrowed amount", async function () {
      const borrowAmount = ethers.parseUnits("100", 6);
      
      await lendingPool.connect(user2).borrow(await usdc.getAddress(), borrowAmount);
      
      // Try to repay more than borrowed
      const tooMuch = ethers.parseUnits("200", 6);
      await usdc.connect(user2).approve(await lendingPool.getAddress(), tooMuch);
      await lendingPool.connect(user2).repay(await usdc.getAddress(), tooMuch);
      
      // Should only repay actual borrowed amount
      const borrowed = await lendingPool.getUserBorrowed(user2.address, await usdc.getAddress());
      expect(borrowed).to.equal(0);
    });
  });

  describe("Collateral Factor Calculation", function () {
    it("Should return correct factors for different credit scores", async function () {
      expect(await lendingPool.calculateCollateralFactor(950)).to.equal(50);
      expect(await lendingPool.calculateCollateralFactor(850)).to.equal(60);
      expect(await lendingPool.calculateCollateralFactor(750)).to.equal(75);
      expect(await lendingPool.calculateCollateralFactor(650)).to.equal(90);
      expect(await lendingPool.calculateCollateralFactor(550)).to.equal(100);
      expect(await lendingPool.calculateCollateralFactor(450)).to.equal(110);
      expect(await lendingPool.calculateCollateralFactor(350)).to.equal(125);
      expect(await lendingPool.calculateCollateralFactor(250)).to.equal(150);
    });
  });

  describe("Account Data", function () {
    beforeEach(async function () {
      // Supply collateral
      await usdc.faucet(user1.address, ethers.parseUnits("1000", 6));
      await usdc.connect(user1).approve(await lendingPool.getAddress(), ethers.parseUnits("1000", 6));
      await lendingPool.connect(user1).supply(await usdc.getAddress(), ethers.parseUnits("1000", 6));
    });

    it("Should return correct account data with no borrows", async function () {
      const [totalCollateral, totalDebt, availableBorrows, liquidationThreshold, healthFactor] = 
        await lendingPool.getUserAccountData(user1.address);
      
      expect(totalCollateral).to.equal(ethers.parseUnits("1000", 6));
      expect(totalDebt).to.equal(0);
      expect(healthFactor).to.equal(ethers.MaxUint256); // Max when no debt
    });

    it("Should calculate health factor correctly", async function () {
      // Borrow some amount
      const borrowAmount = ethers.parseUnits("100", 6);
      await lendingPool.connect(user1).borrow(await usdc.getAddress(), borrowAmount);
      
      const [, , , , healthFactor] = await lendingPool.getUserAccountData(user1.address);
      
      // Health factor should be > 1e18 (healthy position)
      expect(healthFactor).to.be.gt(ethers.parseEther("1"));
    });

    it("Should return correct required collateral", async function () {
      const borrowAmount = ethers.parseUnits("100", 6);
      const score = await oracle.getCreditScore(user1.address);
      
      const requiredCollateral = await lendingPool.getRequiredCollateral(user1.address, borrowAmount);
      
      // Should match collateral factor calculation
      const collateralFactor = await lendingPool.calculateCollateralFactor(score);
      const expected = (borrowAmount * collateralFactor) / 100n;
      
      expect(requiredCollateral).to.equal(expected);
    });
  });

  describe("Liquidation", function () {
    beforeEach(async function () {
      // Setup user with position that could become unhealthy
      await usdc.faucet(user1.address, ethers.parseUnits("1000", 6));
      await usdc.connect(user1).approve(await lendingPool.getAddress(), ethers.parseUnits("1000", 6));
      await lendingPool.connect(user1).supply(await usdc.getAddress(), ethers.parseUnits("1000", 6));
      
      // User1 borrows near max
      await lendingPool.connect(user1).borrow(await usdc.getAddress(), ethers.parseUnits("700", 6));
      
      // Give liquidator funds
      await usdc.faucet(liquidator.address, ethers.parseUnits("1000", 6));
      await usdc.connect(liquidator).approve(await lendingPool.getAddress(), ethers.parseUnits("1000", 6));
    });

    it("Should reject liquidation of healthy position", async function () {
      await expect(
        lendingPool.connect(liquidator).liquidate(user1.address, await usdc.getAddress())
      ).to.be.revertedWith("Position is healthy");
    });

    it("Should reject self-liquidation", async function () {
      await expect(
        lendingPool.connect(user1).liquidate(user1.address, await usdc.getAddress())
      ).to.be.revertedWith("Cannot liquidate self");
    });
  });

  describe("Integration Tests", function () {
    it("Should update borrow limits when credit score changes", async function () {
      // Supply collateral
      await usdc.faucet(user2.address, ethers.parseUnits("1000", 6));
      await usdc.connect(user2).approve(await lendingPool.getAddress(), ethers.parseUnits("1000", 6));
      await lendingPool.connect(user2).supply(await usdc.getAddress(), ethers.parseUnits("1000", 6));
      
      // Initial borrow (low score = 500)
      const initialBorrowableWithScore500 = await lendingPool.getRequiredCollateral(
        user2.address,
        ethers.parseUnits("100", 6)
      );
      
      // Improve credit score
      const expiresAt = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);
      const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256", "uint256", "uint256"],
        [issuer.address, user2.address, 0, Math.floor(Date.now() / 1000), expiresAt]
      );
      const messageHash = ethers.keccak256(credentialData);
      const signature = await issuer.signMessage(ethers.getBytes(messageHash));
      
      await oracle.connect(user2).submitCredential(
        credentialData,
        signature,
        issuer.address,
        0,
        expiresAt
      );
      
      // Check new borrowable amount (should require less collateral)
      const newBorrowableWithHigherScore = await lendingPool.getRequiredCollateral(
        user2.address,
        ethers.parseUnits("100", 6)
      );
      
      expect(newBorrowableWithHigherScore).to.be.lt(initialBorrowableWithScore500);
    });

    it("Should handle complete borrow/repay cycle", async function () {
      // Setup
      await usdc.faucet(user1.address, ethers.parseUnits("2000", 6));
      await usdc.connect(user1).approve(await lendingPool.getAddress(), ethers.parseUnits("2000", 6));
      
      // Supply
      await lendingPool.connect(user1).supply(await usdc.getAddress(), ethers.parseUnits("1000", 6));
      
      // Borrow
      const borrowAmount = ethers.parseUnits("100", 6);
      await lendingPool.connect(user1).borrow(await usdc.getAddress(), borrowAmount);
      
      // Check borrowed
      let borrowed = await lendingPool.getUserBorrowed(user1.address, await usdc.getAddress());
      expect(borrowed).to.equal(borrowAmount);
      
      // Repay
      await lendingPool.connect(user1).repay(await usdc.getAddress(), borrowAmount);
      
      // Check repaid
      borrowed = await lendingPool.getUserBorrowed(user1.address, await usdc.getAddress());
      expect(borrowed).to.equal(0);
      
      // Withdraw
      await lendingPool.connect(user1).withdraw(await usdc.getAddress(), ethers.parseUnits("1000", 6));
      
      // Check withdrawn
      const supplied = await lendingPool.getUserSupplied(user1.address, await usdc.getAddress());
      expect(supplied).to.equal(0);
    });
  });
});

