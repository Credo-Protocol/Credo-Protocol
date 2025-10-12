// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing purposes
 * @dev Simple ERC20 token with a public faucet function for easy testing
 * Features:
 * - Standard ERC20 functionality
 * - Public faucet for users to mint test tokens
 * - Initial supply minted to deployer
 */
contract MockUSDC is ERC20 {
    // Decimals for USDC (matches real USDC)
    uint8 private constant DECIMALS = 6;
    
    // Initial supply: 1,000,000 USDC
    uint256 private constant INITIAL_SUPPLY = 1_000_000 * 10**DECIMALS;
    
    /**
     * @dev Constructor mints initial supply to deployer
     */
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @notice Get the number of decimals
     * @return Number of decimals (6 for USDC)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @notice Public faucet for users to mint test tokens
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     * @dev Anyone can call this to get test tokens
     */
    function faucet(address to, uint256 amount) external {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= 10_000 * 10**DECIMALS, "Amount exceeds faucet limit (10,000 USDC)");
        
        _mint(to, amount);
    }
    
    /**
     * @notice Convenience function to mint standard test amount (1,000 USDC)
     * @param to Address to receive the tokens
     */
    function faucetDefault(address to) external {
        require(to != address(0), "Cannot mint to zero address");
        _mint(to, 1_000 * 10**DECIMALS);
    }
}

