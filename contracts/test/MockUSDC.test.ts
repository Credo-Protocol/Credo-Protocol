import { expect } from "chai";
import { ethers } from "hardhat";
import { MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Test suite for MockUSDC contract
 * Tests basic ERC20 functionality and faucet features
 */
describe("MockUSDC", function () {
  let mockUSDC: MockUSDC;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  // Deploy fresh contract before each test
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy();
    await mockUSDC.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await mockUSDC.name()).to.equal("Mock USDC");
      expect(await mockUSDC.symbol()).to.equal("mUSDC");
    });

    it("Should set correct decimals (6 for USDC)", async function () {
      expect(await mockUSDC.decimals()).to.equal(6);
    });

    it("Should mint initial supply to deployer", async function () {
      const expectedSupply = ethers.parseUnits("1000000", 6); // 1M USDC
      expect(await mockUSDC.balanceOf(owner.address)).to.equal(expectedSupply);
      expect(await mockUSDC.totalSupply()).to.equal(expectedSupply);
    });
  });

  describe("Faucet", function () {
    it("Should allow anyone to mint tokens via faucet", async function () {
      const amount = ethers.parseUnits("100", 6); // 100 USDC
      
      await mockUSDC.connect(user1).faucet(user1.address, amount);
      
      expect(await mockUSDC.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should reject faucet to zero address", async function () {
      const amount = ethers.parseUnits("100", 6);
      
      await expect(
        mockUSDC.faucet(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should reject zero amount", async function () {
      await expect(
        mockUSDC.faucet(user1.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should enforce faucet limit (10,000 USDC)", async function () {
      const tooMuch = ethers.parseUnits("10001", 6); // Over limit
      
      await expect(
        mockUSDC.faucet(user1.address, tooMuch)
      ).to.be.revertedWith("Amount exceeds faucet limit (10,000 USDC)");
    });

    it("Should allow maximum faucet amount", async function () {
      const maxAmount = ethers.parseUnits("10000", 6); // Exactly 10,000
      
      await mockUSDC.faucet(user1.address, maxAmount);
      
      expect(await mockUSDC.balanceOf(user1.address)).to.equal(maxAmount);
    });
  });

  describe("Default Faucet", function () {
    it("Should mint default amount (1,000 USDC)", async function () {
      await mockUSDC.faucetDefault(user1.address);
      
      const expectedAmount = ethers.parseUnits("1000", 6);
      expect(await mockUSDC.balanceOf(user1.address)).to.equal(expectedAmount);
    });

    it("Should reject default faucet to zero address", async function () {
      await expect(
        mockUSDC.faucetDefault(ethers.ZeroAddress)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should allow multiple users to use default faucet", async function () {
      await mockUSDC.faucetDefault(user1.address);
      await mockUSDC.faucetDefault(user2.address);
      
      const expectedAmount = ethers.parseUnits("1000", 6);
      expect(await mockUSDC.balanceOf(user1.address)).to.equal(expectedAmount);
      expect(await mockUSDC.balanceOf(user2.address)).to.equal(expectedAmount);
    });
  });

  describe("ERC20 Functionality", function () {
    it("Should allow token transfers", async function () {
      const amount = ethers.parseUnits("500", 6);
      
      await mockUSDC.faucet(user1.address, amount);
      await mockUSDC.connect(user1).transfer(user2.address, amount);
      
      expect(await mockUSDC.balanceOf(user1.address)).to.equal(0);
      expect(await mockUSDC.balanceOf(user2.address)).to.equal(amount);
    });

    it("Should allow approve and transferFrom", async function () {
      const amount = ethers.parseUnits("500", 6);
      
      await mockUSDC.faucet(user1.address, amount);
      await mockUSDC.connect(user1).approve(user2.address, amount);
      await mockUSDC.connect(user2).transferFrom(user1.address, user2.address, amount);
      
      expect(await mockUSDC.balanceOf(user2.address)).to.equal(amount);
    });
  });
});

