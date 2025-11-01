// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @dev Interface to interact with CreditScoreOracle
 */
interface ICreditScoreOracle {
    function getCreditScore(address user) external view returns (uint256);
}

/**
 * @title LendingPool
 * @notice Decentralized lending pool with dynamic collateral factors based on credit scores
 * @dev Integrates with CreditScoreOracle to adjust collateral requirements and interest rates
 * 
 * Key Features:
 * - Dynamic collateral factors: 50% (score 900+) to 150% (score <300)
 * - Score-based interest rates: 5% (score 900+) to 15% (score <300)
 * - Supply, borrow, repay, and withdraw functionality
 * - Liquidation mechanism for unhealthy positions
 * - Real-time health factor monitoring
 */
contract LendingPool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    /**
     * @dev User's account data for supplied and borrowed assets
     */
    struct UserAccount {
        mapping(address => uint256) supplied;    // Amount supplied per asset
        mapping(address => uint256) borrowed;    // Amount borrowed per asset
        uint256 lastUpdateTimestamp;             // Last time account was updated
    }

    /**
     * @dev Data for each supported asset
     */
    struct AssetData {
        uint256 totalSupply;         // Total amount supplied
        uint256 totalBorrowed;       // Total amount borrowed
        uint256 baseInterestRate;    // Base interest rate (in basis points, e.g., 500 = 5%)
        uint256 utilizationRate;     // Current utilization rate (0-100)
        bool enabled;                // Whether asset is enabled for lending
    }

    // ============ State Variables ============

    // Credit Score Oracle address
    address public creditOracle;
    
    // User accounts
    mapping(address => UserAccount) private userAccounts;
    
    // Asset data
    mapping(address => AssetData) public assets;
    
    // Supported assets list
    address[] public supportedAssets;
    
    // Liquidation threshold (in basis points, e.g., 8000 = 80%)
    uint256 public constant LIQUIDATION_THRESHOLD = 8000;
    
    // Liquidation bonus (in basis points, e.g., 500 = 5%)
    uint256 public constant LIQUIDATION_BONUS = 500;

    // ============ Interest Rate System (Phase 3) ============
    
    // Per-user borrow index for each asset
    // Tracks the global index at the time user borrowed
    // Used to calculate accrued interest: userDebt * (currentIndex / userIndex)
    mapping(address => mapping(address => uint256)) public userBorrowIndex;
    
    // Global borrow index per asset (starts at 1e18, grows over time)
    // Represents cumulative interest accrued since contract deployment
    mapping(address => uint256) public globalBorrowIndex;
    
    // Last time interest was accrued for each asset
    mapping(address => uint256) public lastAccrualTime;
    
    // Interest rates by tier (annual APR in basis points)
    // Tier 0 (900-1000): 5% APR = 500 basis points
    // Tier 7 (0-299): 18% APR = 1800 basis points
    uint16[8] public tierInterestRates;

    // ============ Events ============

    event AssetEnabled(address indexed asset, uint256 baseInterestRate);
    event AssetDisabled(address indexed asset);
    event Supplied(address indexed user, address indexed asset, uint256 amount);
    event Withdrawn(address indexed user, address indexed asset, uint256 amount);
    event Borrowed(
        address indexed user,
        address indexed asset,
        uint256 amount,
        uint256 interestRate,
        uint256 collateralFactor
    );
    event Repaid(address indexed user, address indexed asset, uint256 amount);
    event Liquidated(
        address indexed liquidator,
        address indexed borrower,
        address indexed asset,
        uint256 debtCovered,
        uint256 collateralSeized
    );
    
    // Phase 3: Interest events
    event InterestAccrued(
        address indexed asset,
        uint256 newIndex,
        uint256 timeElapsed,
        uint256 timestamp
    );
    event BorrowWithInterest(
        address indexed user,
        address indexed asset,
        uint256 principal,
        uint256 interest,
        uint256 total
    );

    // ============ Constructor ============

    /**
     * @notice Initialize lending pool with credit oracle
     * @param _creditOracle Address of the CreditScoreOracle contract
     */
    constructor(address _creditOracle) Ownable(msg.sender) {
        require(_creditOracle != address(0), "Invalid oracle address");
        creditOracle = _creditOracle;
        
        // Phase 3: Initialize tier-based interest rates (basis points)
        // These rates match the 8-tier system from Phase 1
        tierInterestRates[0] = 500;   // Tier 0 (900-1000): 5% APR
        tierInterestRates[1] = 600;   // Tier 1 (800-899): 6% APR
        tierInterestRates[2] = 750;   // Tier 2 (700-799): 7.5% APR
        tierInterestRates[3] = 900;   // Tier 3 (600-699): 9% APR
        tierInterestRates[4] = 1100;  // Tier 4 (500-599): 11% APR
        tierInterestRates[5] = 1300;  // Tier 5 (400-499): 13% APR
        tierInterestRates[6] = 1500;  // Tier 6 (300-399): 15% APR
        tierInterestRates[7] = 1800;  // Tier 7 (0-299): 18% APR
    }

    // ============ Admin Functions ============

    /**
     * @notice Enable an asset for lending
     * @param asset Address of the ERC20 token
     * @param baseRate Base interest rate in basis points (e.g., 500 = 5%)
     */
    function enableAsset(address asset, uint256 baseRate) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(!assets[asset].enabled, "Asset already enabled");
        require(baseRate <= 10000, "Base rate too high"); // Max 100%

        assets[asset] = AssetData({
            totalSupply: 0,
            totalBorrowed: 0,
            baseInterestRate: baseRate,
            utilizationRate: 0,
            enabled: true
        });
        
        // Phase 3: Initialize interest tracking for this asset
        globalBorrowIndex[asset] = 1e18;      // Start at 1.0 (scaled by 1e18)
        lastAccrualTime[asset] = block.timestamp;

        supportedAssets.push(asset);
        emit AssetEnabled(asset, baseRate);
    }

    /**
     * @notice Disable an asset for lending
     * @param asset Address of the ERC20 token
     */
    function disableAsset(address asset) external onlyOwner {
        require(assets[asset].enabled, "Asset not enabled");
        require(assets[asset].totalBorrowed == 0, "Asset has outstanding borrows");
        
        assets[asset].enabled = false;
        emit AssetDisabled(asset);
    }

    /**
     * @notice Update the credit oracle address
     * @param newOracle Address of the new CreditScoreOracle
     */
    function updateCreditOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        creditOracle = newOracle;
    }

    // ============ Supply Functions ============

    /**
     * @notice Supply assets to the lending pool
     * @param asset Address of the ERC20 token
     * @param amount Amount to supply
     */
    function supply(address asset, uint256 amount) external nonReentrant {
        require(assets[asset].enabled, "Asset not enabled");
        require(amount > 0, "Amount must be > 0");

        // Transfer tokens from user
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Update user account
        userAccounts[msg.sender].supplied[asset] += amount;
        userAccounts[msg.sender].lastUpdateTimestamp = block.timestamp;

        // Update asset data
        assets[asset].totalSupply += amount;
        _updateUtilizationRate(asset);

        emit Supplied(msg.sender, asset, amount);
    }

    /**
     * @notice Withdraw supplied assets from the pool
     * @param asset Address of the ERC20 token
     * @param amount Amount to withdraw
     */
    function withdraw(address asset, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(
            userAccounts[msg.sender].supplied[asset] >= amount,
            "Insufficient supplied balance"
        );

        // Check if withdrawal would make position unhealthy
        uint256 newSupplied = userAccounts[msg.sender].supplied[asset] - amount;
        userAccounts[msg.sender].supplied[asset] = newSupplied;
        
        (uint256 totalCollateral, uint256 totalDebt, , , uint256 healthFactor) = 
            getUserAccountData(msg.sender);
        
        require(healthFactor >= 1e18 || totalDebt == 0, "Withdrawal would make position unhealthy");

        // Restore for actual withdrawal
        userAccounts[msg.sender].supplied[asset] = newSupplied + amount;
        
        // Update state
        userAccounts[msg.sender].supplied[asset] -= amount;
        userAccounts[msg.sender].lastUpdateTimestamp = block.timestamp;
        assets[asset].totalSupply -= amount;
        _updateUtilizationRate(asset);

        // Transfer tokens to user
        IERC20(asset).safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, asset, amount);
    }

    // ============ Borrow Functions ============

    /**
     * @notice Borrow assets from the pool
     * @param asset Address of the ERC20 token
     * @param amount Amount to borrow
     * @dev Collateral factor is dynamically calculated based on user's credit score
     * 
     * Phase 3: Now tracks borrow index for interest accrual
     */
    function borrow(address asset, uint256 amount) external nonReentrant {
        require(assets[asset].enabled, "Asset not enabled");
        require(amount > 0, "Amount must be > 0");
        require(
            assets[asset].totalSupply - assets[asset].totalBorrowed >= amount,
            "Insufficient liquidity"
        );

        // Phase 3: Accrue interest first (updates global index)
        accrueInterest(asset);

        // Get user's credit score
        uint256 userScore = ICreditScoreOracle(creditOracle).getCreditScore(msg.sender);
        
        // Calculate required collateral based on credit score
        uint256 collateralFactor = calculateCollateralFactor(userScore);
        uint256 requiredCollateral = (amount * collateralFactor) / 100;

        // Get user's total collateral
        uint256 userCollateral = getUserTotalCollateral(msg.sender);
        uint256 userCurrentBorrows = getUserTotalBorrows(msg.sender);

        // Check if user has enough collateral
        require(
            userCollateral >= userCurrentBorrows + requiredCollateral,
            "Insufficient collateral for credit score"
        );

        // Calculate interest rate based on score
        uint256 interestRate = calculateInterestRate(userScore, asset);

        // Phase 3: Handle borrow index for interest tracking
        if (userAccounts[msg.sender].borrowed[asset] == 0) {
            // First borrow: set user's index to current global index
            userBorrowIndex[msg.sender][asset] = globalBorrowIndex[asset];
        } else {
            // Existing borrow: compound accrued interest into principal first
            uint256 previousPrincipal = userAccounts[msg.sender].borrowed[asset];
            uint256 totalOwed = getBorrowBalanceWithInterest(msg.sender, asset);

            // Update user's principal to include accrued interest
            userAccounts[msg.sender].borrowed[asset] = totalOwed;

            // Keep pool accounting consistent: replace previous principal with totalOwed
            // This prevents underflow during future repayments
            if (assets[asset].totalBorrowed >= previousPrincipal) {
                assets[asset].totalBorrowed = assets[asset].totalBorrowed - previousPrincipal + totalOwed;
            } else {
                // In the unlikely event of inconsistency, reset to a safe value
                assets[asset].totalBorrowed = totalOwed;
            }

            // Reset user's index to current (interest is now in principal)
            userBorrowIndex[msg.sender][asset] = globalBorrowIndex[asset];
        }

        // Update state: add new borrow to principal
        userAccounts[msg.sender].borrowed[asset] += amount;
        userAccounts[msg.sender].lastUpdateTimestamp = block.timestamp;
        assets[asset].totalBorrowed += amount;
        _updateUtilizationRate(asset);

        // Transfer tokens to user
        IERC20(asset).safeTransfer(msg.sender, amount);

        emit Borrowed(msg.sender, asset, amount, interestRate, collateralFactor);
    }

    /**
     * @notice Repay borrowed assets
     * @param asset Address of the ERC20 token
     * @param amount Amount to repay
     * 
     * Phase 3: Now includes accrued interest in repayment calculation
     * User must repay both principal and interest
     */
    function repay(address asset, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        // Phase 3: Accrue interest first
        accrueInterest(asset);
        
        // Get total owed (principal + interest)
        uint256 totalOwed = getBorrowBalanceWithInterest(msg.sender, asset);
        require(totalOwed > 0, "No debt to repay");

        // Can't repay more than total owed
        uint256 repayAmount = amount > totalOwed ? totalOwed : amount;

        // Transfer tokens from user
        IERC20(asset).safeTransferFrom(msg.sender, address(this), repayAmount);

        // Calculate remaining debt after repayment
        uint256 remainingDebt = totalOwed - repayAmount;
        
        // Phase 3: Update principal and index
        // Store old principal before modifying it
        uint256 oldPrincipal = userAccounts[msg.sender].borrowed[asset];
        
        // Handle dust amounts (< 10 units due to rounding)
        // This prevents tiny amounts from being left over due to integer division
        if (remainingDebt < 10 || remainingDebt == 0) {
            // Full repayment: clear everything
            userAccounts[msg.sender].borrowed[asset] = 0;
            userBorrowIndex[msg.sender][asset] = 0;
            
            // Update pool's total borrowed (reduce by old principal)
            assets[asset].totalBorrowed -= oldPrincipal;
        } else {
            // Partial repayment: convert remaining debt back to principal at current index
            // Formula: newPrincipal = remainingDebt * userIndex / globalIndex
            // This ensures the user still owes remainingDebt when calculated with new index
            uint256 newPrincipal = (remainingDebt * userBorrowIndex[msg.sender][asset]) / globalBorrowIndex[asset];
            
            // Update borrowed amount and reset index to current
            userAccounts[msg.sender].borrowed[asset] = newPrincipal;
            userBorrowIndex[msg.sender][asset] = globalBorrowIndex[asset];
            
            // Update pool's total borrowed
            assets[asset].totalBorrowed = assets[asset].totalBorrowed - oldPrincipal + newPrincipal;
        }
        
        userAccounts[msg.sender].lastUpdateTimestamp = block.timestamp;
        _updateUtilizationRate(asset);

        emit Repaid(msg.sender, asset, repayAmount);
    }

    // ============ Liquidation Functions ============

    /**
     * @notice Liquidate an unhealthy position
     * @param borrower Address of the borrower to liquidate
     * @param asset Address of the borrowed asset to repay
     * @dev Liquidator repays debt and receives collateral + bonus
     */
    function liquidate(address borrower, address asset) external nonReentrant {
        require(borrower != address(0), "Invalid borrower");
        require(borrower != msg.sender, "Cannot liquidate self");

        // Check if position is liquidatable
        (, , , , uint256 healthFactor) = getUserAccountData(borrower);
        require(healthFactor < 1e18, "Position is healthy");

        uint256 debtToCover = userAccounts[borrower].borrowed[asset];
        require(debtToCover > 0, "No debt in this asset");

        // Calculate collateral to seize (with liquidation bonus)
        uint256 collateralToSeize = (debtToCover * (10000 + LIQUIDATION_BONUS)) / 10000;
        uint256 availableCollateral = userAccounts[borrower].supplied[asset];
        
        if (collateralToSeize > availableCollateral) {
            collateralToSeize = availableCollateral;
        }

        // Transfer debt payment from liquidator
        IERC20(asset).safeTransferFrom(msg.sender, address(this), debtToCover);

        // Update borrower's debt
        userAccounts[borrower].borrowed[asset] = 0;
        userAccounts[borrower].supplied[asset] -= collateralToSeize;
        assets[asset].totalBorrowed -= debtToCover;
        _updateUtilizationRate(asset);

        // Transfer collateral to liquidator
        IERC20(asset).safeTransfer(msg.sender, collateralToSeize);

        emit Liquidated(msg.sender, borrower, asset, debtToCover, collateralToSeize);
    }

    // ============ Calculation Functions ============

    /**
     * @notice Calculate collateral factor based on credit score
     * @param creditScore User's credit score (0-1000)
     * @return Collateral factor as percentage (50-150)
     * @dev Higher score = lower collateral requirement
     */
    function calculateCollateralFactor(uint256 creditScore) public pure returns (uint256) {
        if (creditScore >= 900) return 50;   // Borrow $100 with $50
        if (creditScore >= 800) return 60;
        if (creditScore >= 700) return 75;
        if (creditScore >= 600) return 90;
        if (creditScore >= 500) return 100;  // 1:1 collateral
        if (creditScore >= 400) return 110;
        if (creditScore >= 300) return 125;
        return 150; // Default DeFi level
    }

    /**
     * @notice Calculate interest rate based on credit score and utilization
     * @param score User's credit score
     * @param asset Address of the asset
     * @return Interest rate in basis points
     */
    function calculateInterestRate(uint256 score, address asset) internal view returns (uint256) {
        uint256 baseRate = assets[asset].baseInterestRate;
        uint256 utilizationRate = assets[asset].utilizationRate;

        // Score multiplier (50% to 150% of base rate)
        uint256 scoreMultiplier;
        if (score >= 900) scoreMultiplier = 50;
        else if (score >= 700) scoreMultiplier = 70;
        else if (score >= 500) scoreMultiplier = 100;
        else if (score >= 300) scoreMultiplier = 130;
        else scoreMultiplier = 150;

        uint256 finalRate = (baseRate * scoreMultiplier) / 100;

        // Add utilization premium
        finalRate += (utilizationRate * 5) / 100;

        return finalRate;
    }

    /**
     * @notice Update utilization rate for an asset
     * @param asset Address of the asset
     */
    function _updateUtilizationRate(address asset) internal {
        AssetData storage data = assets[asset];
        if (data.totalSupply == 0) {
            data.utilizationRate = 0;
        } else {
            data.utilizationRate = (data.totalBorrowed * 100) / data.totalSupply;
        }
    }

    // ============ Phase 3: Interest Accrual Functions ============

    /**
     * @notice Accrue interest for an asset based on time elapsed
     * @param asset Address of the asset to accrue interest for
     * @dev Called before any borrow/repay operation to ensure up-to-date interest
     * 
     * Interest is calculated using a simple compounding model:
     * newIndex = oldIndex * (1 + rate * time)
     * 
     * where rate = weighted average APR / seconds per year
     */
    function accrueInterest(address asset) public {
        // Skip if already updated this block
        if (lastAccrualTime[asset] == block.timestamp) {
            return;
        }
        
        uint256 timeElapsed = block.timestamp - lastAccrualTime[asset];
        
        // If no time has passed or no borrows, just update timestamp
        if (timeElapsed == 0 || assets[asset].totalBorrowed == 0) {
            lastAccrualTime[asset] = block.timestamp;
            return;
        }
        
        // Use fixed 12% APR for simplicity (can be improved with weighted average)
        // In a production system, this would calculate weighted average based on all borrowers' rates
        uint256 annualRateBps = 1200; // 12% APR
        
        // Convert annual rate to per-second rate
        // Formula: (rate_bps / 10000) / seconds_per_year
        // Multiply by 1e18 for precision
        // Seconds per year: 365.25 * 24 * 60 * 60 = 31557600
        uint256 ratePerSecond = (annualRateBps * 1e18) / 31557600 / 10000;
        
        // Calculate interest factor for time elapsed
        // interestFactor = rate * time
        uint256 interestFactor = ratePerSecond * timeElapsed;
        
        // Update global index: newIndex = oldIndex * (1 + interestFactor)
        // Simplified: newIndex = oldIndex + (oldIndex * interestFactor / 1e18)
        globalBorrowIndex[asset] = globalBorrowIndex[asset] + 
            ((globalBorrowIndex[asset] * interestFactor) / 1e18);
        
        lastAccrualTime[asset] = block.timestamp;
        
        emit InterestAccrued(
            asset,
            globalBorrowIndex[asset],
            timeElapsed,
            block.timestamp
        );
    }

    /**
     * @notice Get user's borrow balance including accrued interest
     * @param user Address to check
     * @param asset Address of the asset
     * @return Total owed (principal + interest)
     * 
     * Formula: totalOwed = principal * (currentIndex / userIndex)
     * 
     * Example:
     * - User borrowed 100 USDC when global index was 1.0
     * - Time passes, global index is now 1.05 (5% interest accrued)
     * - User owes: 100 * (1.05 / 1.0) = 105 USDC
     */
    function getBorrowBalanceWithInterest(address user, address asset) 
        public 
        view 
        returns (uint256) 
    {
        uint256 principal = userAccounts[user].borrowed[asset];
        
        if (principal == 0) {
            return 0;
        }
        
        // If user has never borrowed or index not initialized, return principal
        if (userBorrowIndex[user][asset] == 0) {
            return principal;
        }
        
        // Calculate current global index (including pending interest)
        uint256 currentGlobalIndex = _getCurrentGlobalIndex(asset);
        
        // Calculate total owed: principal * (currentIndex / userIndex)
        uint256 totalOwed = (principal * currentGlobalIndex) / userBorrowIndex[user][asset];
        
        return totalOwed;
    }

    /**
     * @dev Internal function to calculate current global index including pending interest
     * @param asset Address of the asset
     * @return Current global index (not yet saved to storage)
     * 
     * This is a view function that calculates what the index WOULD be if accrueInterest() was called now
     */
    function _getCurrentGlobalIndex(address asset) internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp - lastAccrualTime[asset];
        
        // If no time elapsed or no borrows, return current index
        if (timeElapsed == 0 || assets[asset].totalBorrowed == 0) {
            return globalBorrowIndex[asset];
        }
        
        // Same calculation as accrueInterest but read-only
        uint256 annualRateBps = 1200; // 12% APR (matches accrueInterest)
        uint256 ratePerSecond = (annualRateBps * 1e18) / 31557600 / 10000;
        uint256 interestFactor = ratePerSecond * timeElapsed;
        
        return globalBorrowIndex[asset] + 
            ((globalBorrowIndex[asset] * interestFactor) / 1e18);
    }

    /**
     * @notice Get accrued interest for a user (interest only, not principal)
     * @param user Address of the user
     * @param asset Address of the asset
     * @return Accrued interest amount
     */
    function getAccruedInterest(address user, address asset) 
        public 
        view 
        returns (uint256) 
    {
        uint256 totalOwed = getBorrowBalanceWithInterest(user, asset);
        uint256 principal = userAccounts[user].borrowed[asset];
        
        return totalOwed > principal ? totalOwed - principal : 0;
    }

    /**
     * @notice Get APR for a user based on their credit score tier
     * @param user Address of the user
     * @return Annual interest rate in basis points (e.g., 500 = 5%)
     */
    function getUserAPR(address user) public view returns (uint256) {
        uint256 score = ICreditScoreOracle(creditOracle).getCreditScore(user);
        return getTierAPR(score);
    }

    /**
     * @notice Get APR for a credit score tier
     * @param creditScore User's credit score (0-1000)
     * @return Annual interest rate in basis points
     */
    function getTierAPR(uint256 creditScore) public view returns (uint256) {
        if (creditScore >= 900) return tierInterestRates[0];  // 5%
        if (creditScore >= 800) return tierInterestRates[1];  // 6%
        if (creditScore >= 700) return tierInterestRates[2];  // 7.5%
        if (creditScore >= 600) return tierInterestRates[3];  // 9%
        if (creditScore >= 500) return tierInterestRates[4];  // 11%
        if (creditScore >= 400) return tierInterestRates[5];  // 13%
        if (creditScore >= 300) return tierInterestRates[6];  // 15%
        return tierInterestRates[7];  // 18%
    }

    // ============ View Functions ============

    /**
     * @notice Get comprehensive account data for a user
     * @param user Address of the user
     * @return totalCollateralInUSD Total collateral value
     * @return totalDebtInUSD Total debt value
     * @return availableBorrowsInUSD Available borrowing capacity
     * @return currentLiquidationThreshold Liquidation threshold
     * @return healthFactor Health factor (>1e18 is healthy)
     */
    function getUserAccountData(address user) public view returns (
        uint256 totalCollateralInUSD,
        uint256 totalDebtInUSD,
        uint256 availableBorrowsInUSD,
        uint256 currentLiquidationThreshold,
        uint256 healthFactor
    ) {
        totalCollateralInUSD = getUserTotalCollateral(user);
        totalDebtInUSD = getUserTotalBorrows(user);
        currentLiquidationThreshold = LIQUIDATION_THRESHOLD;

        // For MVP, assume 1:1 USD pricing
        // In production, this would integrate with price oracles

        if (totalDebtInUSD == 0) {
            healthFactor = type(uint256).max;
            availableBorrowsInUSD = totalCollateralInUSD;
        } else {
            // Health factor = (collateral * liquidation threshold) / debt
            healthFactor = (totalCollateralInUSD * LIQUIDATION_THRESHOLD * 1e18) / 
                          (totalDebtInUSD * 10000);
            
            uint256 maxBorrow = (totalCollateralInUSD * LIQUIDATION_THRESHOLD) / 10000;
            availableBorrowsInUSD = maxBorrow > totalDebtInUSD ? 
                                    maxBorrow - totalDebtInUSD : 0;
        }

        return (
            totalCollateralInUSD,
            totalDebtInUSD,
            availableBorrowsInUSD,
            currentLiquidationThreshold,
            healthFactor
        );
    }

    /**
     * @notice Get user's total collateral across all assets
     * @param user Address of the user
     * @return Total collateral value
     */
    function getUserTotalCollateral(address user) public view returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < supportedAssets.length; i++) {
            address asset = supportedAssets[i];
            total += userAccounts[user].supplied[asset];
        }
        return total;
    }

    /**
     * @notice Get user's total borrows across all assets
     * @param user Address of the user
     * @return Total borrowed value (including accrued interest)
     * 
     * Phase 3: Now includes accrued interest in total borrows
     * This ensures health factor calculations account for interest
     */
    function getUserTotalBorrows(address user) public view returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < supportedAssets.length; i++) {
            address asset = supportedAssets[i];
            // Phase 3: Use getBorrowBalanceWithInterest instead of just principal
            total += getBorrowBalanceWithInterest(user, asset);
        }
        return total;
    }

    /**
     * @notice Get required collateral for a borrow amount
     * @param user Address of the user
     * @param borrowAmount Amount to borrow
     * @return Required collateral amount
     */
    function getRequiredCollateral(address user, uint256 borrowAmount) 
        external 
        view 
        returns (uint256) 
    {
        uint256 userScore = ICreditScoreOracle(creditOracle).getCreditScore(user);
        uint256 collateralFactor = calculateCollateralFactor(userScore);
        return (borrowAmount * collateralFactor) / 100;
    }

    /**
     * @notice Get user's supplied balance for an asset
     * @param user Address of the user
     * @param asset Address of the asset
     * @return Supplied amount
     */
    function getUserSupplied(address user, address asset) external view returns (uint256) {
        return userAccounts[user].supplied[asset];
    }

    /**
     * @notice Get user's borrowed balance for an asset
     * @param user Address of the user
     * @param asset Address of the asset
     * @return Borrowed amount
     */
    function getUserBorrowed(address user, address asset) external view returns (uint256) {
        return userAccounts[user].borrowed[asset];
    }

    /**
     * @notice Get list of supported assets
     * @return Array of supported asset addresses
     */
    function getSupportedAssets() external view returns (address[] memory) {
        return supportedAssets;
    }
}

