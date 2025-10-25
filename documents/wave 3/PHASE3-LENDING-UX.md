# Phase 3: LendingPool v2 + UX Enhancements

**Day**: 2 PM - 3 AM (Oct 26-27)  
**Duration**: 8-10 hours  
**Prerequisites**: Phases 1 & 2 Complete  
**Next**: [PHASE4-DEPLOYMENT.md](./PHASE4-DEPLOYMENT.md)

---

## 🎯 Goal

Add interest accrual to LendingPool and create Score Builder Wizard that clearly shows users how to earn better rates.

**Why This Phase**: Addresses "more defined user journey" feedback and adds protocol completeness.

---

## 📋 What You're Building

### Part A: LendingPool v2 (4 hours)
- Interest accrual system (5-18% APR based on tier)
- Time-based interest calculation
- `getBorrowBalanceWithInterest()` view function
- Updated repay logic to handle interest

### Part B: Score Builder Wizard (4 hours)
- Real-time score simulation
- "Points to next tier" progress tracking
- Credential selector with impact preview
- Before/after comparison

---

## 🛠️ Part A: LendingPool v2 Interest System

### Step 1: Add Interest State Variables (30 min)

**File**: `contracts/contracts/LendingPool.sol`

Add these after existing state variables:

```solidity
// Interest rate configuration
mapping(address => uint256) public borrowIndex;  // Per-user borrow index
uint256 public globalBorrowIndex = 1e18;         // Starts at 1.0
uint256 public lastUpdateTime;

// Interest rates by tier (annual APR in basis points)
// Updated to match Phase 1 tier system
uint16[8] public tierInterestRates;

// Events
event InterestAccrued(uint256 newIndex, uint256 timeElapsed, uint256 timestamp);
event BorrowWithInterest(address indexed user, uint256 principal, uint256 interest, uint256 total);

// Initialize in constructor
constructor(address _usdcAddress, address _oracleAddress) {
    usdc = IERC20(_usdcAddress);
    creditScoreOracle = ICreditScoreOracle(_oracleAddress);
    owner = msg.sender;
    lastUpdateTime = block.timestamp;
    
    // Initialize interest rates (basis points, e.g., 500 = 5%)
    tierInterestRates[0] = 500;   // 900-1000: 5% APR
    tierInterestRates[1] = 600;   // 800-899: 6% APR
    tierInterestRates[2] = 750;   // 700-799: 7.5% APR
    tierInterestRates[3] = 900;   // 600-699: 9% APR
    tierInterestRates[4] = 1100;  // 500-599: 11% APR
    tierInterestRates[5] = 1300;  // 400-499: 13% APR
    tierInterestRates[6] = 1500;  // 300-399: 15% APR
    tierInterestRates[7] = 1800;  // 0-299: 18% APR
}
```

---

### Step 2: Implement Interest Accrual Logic (1.5 hours)

Add these functions:

```solidity
/**
 * @notice Accrue interest based on time elapsed
 * @dev Called before any borrow/repay/liquidation operation
 */
function accrueInterest() public {
    // Skip if already updated this block
    if (lastUpdateTime == block.timestamp) {
        return;
    }
    
    uint256 timeElapsed = block.timestamp - lastUpdateTime;
    
    // If no time has passed or no borrows, just update timestamp
    if (timeElapsed == 0 || totalBorrowed == 0) {
        lastUpdateTime = block.timestamp;
        return;
    }
    
    // Calculate weighted average interest rate
    // For simplicity: use fixed 12% APR (can be improved with utilization-based rates)
    uint256 annualRateBps = 1200; // 12%
    
    // Convert to per-second rate: rate / (365.25 * 24 * 60 * 60) / 10000
    // rate * 1e18 / 31557600 / 10000
    uint256 ratePerSecond = (annualRateBps * 1e18) / 31557600 / 10000;
    
    // Calculate interest factor for time elapsed
    uint256 interestFactor = ratePerSecond * timeElapsed;
    
    // Update global index: newIndex = oldIndex * (1 + rate * time)
    globalBorrowIndex = globalBorrowIndex + ((globalBorrowIndex * interestFactor) / 1e18);
    
    lastUpdateTime = block.timestamp;
    
    emit InterestAccrued(globalBorrowIndex, timeElapsed, block.timestamp);
}

/**
 * @notice Get user's borrow balance including accrued interest
 * @param user Address to check
 * @return Total owed (principal + interest)
 */
function getBorrowBalanceWithInterest(address user) public view returns (uint256) {
    uint256 principal = borrowBalance[user];
    
    if (principal == 0) {
        return 0;
    }
    
    // If user has never borrowed or index not initialized, return principal
    if (borrowIndex[user] == 0) {
        return principal;
    }
    
    // Calculate current global index (including time since last update)
    uint256 currentGlobalIndex = _getCurrentGlobalIndex();
    
    // Calculate owed: principal * (currentIndex / userIndex)
    uint256 totalOwed = (principal * currentGlobalIndex) / borrowIndex[user];
    
    return totalOwed;
}

/**
 * @dev Internal function to calculate current global index including pending interest
 */
function _getCurrentGlobalIndex() internal view returns (uint256) {
    uint256 timeElapsed = block.timestamp - lastUpdateTime;
    
    if (timeElapsed == 0 || totalBorrowed == 0) {
        return globalBorrowIndex;
    }
    
    // Same calculation as accrueInterest but read-only
    uint256 annualRateBps = 1200;
    uint256 ratePerSecond = (annualRateBps * 1e18) / 31557600 / 10000;
    uint256 interestFactor = ratePerSecond * timeElapsed;
    
    return globalBorrowIndex + ((globalBorrowIndex * interestFactor) / 1e18);
}

/**
 * @notice Get accrued interest for a user (interest only, not principal)
 */
function getAccruedInterest(address user) public view returns (uint256) {
    uint256 totalOwed = getBorrowBalanceWithInterest(user);
    uint256 principal = borrowBalance[user];
    
    return totalOwed > principal ? totalOwed - principal : 0;
}
```

---

### Step 3: Update Borrow Function (30 min)

Modify existing `borrow()` function:

```solidity
function borrow(uint256 amount) external nonReentrant {
    require(amount > 0, "Amount must be positive");
    require(totalLiquidity >= amount, "Insufficient liquidity");
    
    // Accrue interest first
    accrueInterest();
    
    // Get credit score and calculate collateral required
    uint16 creditScore = creditScoreOracle.getCreditScore(msg.sender);
    uint16 collateralFactor = creditScoreOracle.getCollateralFactor(msg.sender);
    
    require(creditScore > 0, "No credit score");
    require(collateralFactor > 0, "Invalid collateral factor");
    
    // Calculate required collateral
    uint256 requiredCollateral = (amount * collateralFactor) / 10000;
    require(suppliedBalance[msg.sender] >= requiredCollateral, "Insufficient collateral");
    
    // Update user's borrow index to current global index
    if (borrowBalance[msg.sender] == 0) {
        // First borrow: set index to current
        borrowIndex[msg.sender] = globalBorrowIndex;
    } else {
        // Existing borrow: compound interest into principal first
        uint256 totalOwed = getBorrowBalanceWithInterest(msg.sender);
        borrowBalance[msg.sender] = totalOwed;
        borrowIndex[msg.sender] = globalBorrowIndex;
    }
    
    // Update balances
    borrowBalance[msg.sender] += amount;
    totalBorrowed += amount;
    totalLiquidity -= amount;
    
    // Transfer tokens
    require(usdc.transfer(msg.sender, amount), "Transfer failed");
    
    emit Borrowed(msg.sender, amount, creditScore, collateralFactor);
}
```

---

### Step 4: Update Repay Function (30 min)

Modify existing `repay()` function:

```solidity
function repay(uint256 amount) external nonReentrant {
    require(amount > 0, "Amount must be positive");
    
    // Accrue interest first
    accrueInterest();
    
    // Get total owed (principal + interest)
    uint256 totalOwed = getBorrowBalanceWithInterest(msg.sender);
    require(totalOwed > 0, "No debt to repay");
    require(amount <= totalOwed, "Repay amount exceeds debt");
    
    // Transfer tokens from user
    require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    
    // Calculate new principal after repayment
    uint256 remainingDebt = totalOwed - amount;
    
    // Update balances
    totalBorrowed -= (borrowBalance[msg.sender] - (remainingDebt * borrowIndex[msg.sender]) / globalBorrowIndex);
    borrowBalance[msg.sender] = (remainingDebt * borrowIndex[msg.sender]) / globalBorrowIndex;
    totalLiquidity += amount;
    
    // Reset index if fully repaid
    if (borrowBalance[msg.sender] == 0) {
        borrowIndex[msg.sender] = 0;
    }
    
    emit Repaid(msg.sender, amount, borrowBalance[msg.sender]);
}
```

---

### Step 5: Update Health Factor to Include Interest (20 min)

```solidity
function getHealthFactor(address user) public view returns (uint256) {
    uint256 borrowed = getBorrowBalanceWithInterest(user); // Changed to include interest
    
    if (borrowed == 0) {
        return type(uint256).max; // No debt = perfect health
    }
    
    uint256 supplied = suppliedBalance[user];
    
    // Health factor = (supplied / borrowed) * 100
    // If HF < 100, position is unhealthy
    return (supplied * 100) / borrowed;
}
```

---

## 🛠️ Part B: Score Builder Wizard

### Step 6: Create ScoreBuilderWizard Component (2 hours)

**File**: `components/ScoreBuilderWizard.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AlertCircle, CheckCircle, TrendingUp, Lock, Unlock, Sparkles } from 'lucide-react';

export default function ScoreBuilderWizard({ 
    currentScore, 
    submittedCredentials = [],
    onRequestCredential 
}) {
    const [selectedCredentials, setSelectedCredentials] = useState([]);
    const [simulatedScore, setSimulatedScore] = useState(currentScore);
    
    // Tier definitions (must match on-chain)
    const tiers = [
        { min: 900, max: 1000, name: 'Exceptional', collateral: '50%', color: 'purple', apr: '5%' },
        { min: 800, max: 899, name: 'Excellent', collateral: '60%', color: 'blue', apr: '6%' },
        { min: 700, max: 799, name: 'Good', collateral: '75%', color: 'green', apr: '7.5%' },
        { min: 600, max: 699, name: 'Fair', collateral: '90%', color: 'yellow', apr: '9%' },
        { min: 500, max: 599, name: 'Average', collateral: '100%', color: 'orange', apr: '11%' },
        { min: 400, max: 499, name: 'Below Average', collateral: '110%', color: 'orange', apr: '13%' },
        { min: 300, max: 399, name: 'Poor', collateral: '125%', color: 'red', apr: '15%' },
        { min: 0, max: 299, name: 'Very Poor', collateral: '150%', color: 'red', apr: '18%' }
    ];
    
    const getCurrentTier = (score) => {
        return tiers.find(t => score >= t.min && score <= t.max) || tiers[7];
    };
    
    const getNextTier = (score) => {
        const currentIndex = tiers.findIndex(t => score >= t.min && score <= t.max);
        return currentIndex > 0 ? tiers[currentIndex - 1] : null;
    };
    
    const currentTier = getCurrentTier(currentScore);
    const nextTier = getNextTier(currentScore);
    const pointsToNextTier = nextTier ? nextTier.min - currentScore : 0;
    
    const availableCredentials = [
        {
            id: 'income-range',
            name: 'Income Range',
            icon: '💰',
            points: '+50-180',
            avgPoints: 140,
            description: 'Highest impact - verify income bracket',
            new: true,
            badge: 'Highest Weight'
        },
        {
            id: 'bank-balance',
            name: 'Bank Balance (30d avg)',
            icon: '🏦',
            points: '+40-150',
            avgPoints: 120,
            description: 'Prove financial stability',
            new: true,
            badge: 'Privacy-First'
        },
        {
            id: 'cex-history',
            name: 'CEX Trading History',
            icon: '📊',
            points: '+80',
            avgPoints: 80,
            description: 'Show crypto experience'
        },
        {
            id: 'employment',
            name: 'Employment Proof',
            icon: '💼',
            points: '+70',
            avgPoints: 70,
            description: 'Verify job status'
        }
    ];
    
    // Check if credential already submitted
    const isSubmitted = (credId) => {
        return submittedCredentials.some(c => 
            c.credentialType.toLowerCase().includes(credId.replace('-', '_'))
        );
    };
    
    // Simulate score based on selected credentials
    useEffect(() => {
        let baseScore = currentScore;
        
        selectedCredentials.forEach(cred => {
            baseScore += cred.avgPoints;
        });
        
        // Apply diversity bonus (5% per credential, max 25%)
        const totalCredentials = submittedCredentials.length + selectedCredentials.length;
        const diversityBonus = Math.min(totalCredentials * 5, 25);
        baseScore = Math.floor(baseScore * (1 + diversityBonus / 100));
        
        // Cap at 1000
        setSimulatedScore(Math.min(baseScore, 1000));
    }, [selectedCredentials, currentScore, submittedCredentials]);
    
    const toggleCredential = (cred) => {
        if (isSubmitted(cred.id)) return;
        
        setSelectedCredentials(prev => {
            const exists = prev.find(c => c.id === cred.id);
            if (exists) {
                return prev.filter(c => c.id !== cred.id);
            }
            return [...prev, cred];
        });
    };
    
    const handleRequestSelected = async () => {
        for (const cred of selectedCredentials) {
            await onRequestCredential(cred.id);
        }
        setSelectedCredentials([]);
    };
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Build Your Credit Score</h2>
                <p className="text-gray-600">
                    Select credentials to see how they'll improve your borrowing power
                </p>
            </div>
            
            {/* Current vs Simulated Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Score */}
                <Card className="p-6 border-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-500">Current Score</span>
                        </div>
                    </div>
                    <p className="text-5xl font-bold mb-3">{currentScore}</p>
                    <Badge className={`bg-${currentTier.color}-100 text-${currentTier.color}-700 border-${currentTier.color}-300`}>
                        {currentTier.name}
                    </Badge>
                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Collateral Required:</span>
                            <span className="font-semibold">{currentTier.collateral}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Borrow APR:</span>
                            <span className="font-semibold">{currentTier.apr}</span>
                        </div>
                    </div>
                </Card>
                
                {/* Simulated Score */}
                <Card className="p-6 border-2 border-blue-500 bg-blue-50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Unlock className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">Simulated Score</span>
                        </div>
                        {simulatedScore > currentScore && (
                            <Badge className="bg-green-500 text-white">
                                +{simulatedScore - currentScore} pts
                            </Badge>
                        )}
                    </div>
                    <p className="text-5xl font-bold mb-3 text-blue-600">{simulatedScore}</p>
                    <Badge className={`bg-${getCurrentTier(simulatedScore).color}-100 text-${getCurrentTier(simulatedScore).color}-700`}>
                        {getCurrentTier(simulatedScore).name}
                    </Badge>
                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between">
                            <span>Collateral Required:</span>
                            <span className="font-semibold">{getCurrentTier(simulatedScore).collateral}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Borrow APR:</span>
                            <span className="font-semibold">{getCurrentTier(simulatedScore).apr}</span>
                        </div>
                    </div>
                </Card>
            </div>
            
            {/* Progress to Next Tier */}
            {nextTier && (
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Progress to {nextTier.name} Tier
                        </h3>
                        <span className="text-sm font-medium text-gray-600">
                            {pointsToNextTier} points needed
                        </span>
                    </div>
                    
                    <Progress 
                        value={Math.min(((simulatedScore - currentTier.min) / (nextTier.min - currentTier.min)) * 100, 100)} 
                        className="h-4 mb-3"
                    />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Better collateral: <strong>{nextTier.collateral}</strong> vs {currentTier.collateral}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Lower APR: <strong>{nextTier.apr}</strong> vs {currentTier.apr}</span>
                        </div>
                    </div>
                    
                    {simulatedScore >= nextTier.min && (
                        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                            <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Selected credentials will unlock {nextTier.name} tier! 🎉
                            </p>
                        </div>
                    )}
                </Card>
            )}
            
            {/* Credential Selector */}
            <Card className="p-6">
                <h3 className="font-semibold text-xl mb-4">Select Credentials to Request</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableCredentials.map(cred => {
                        const isSelected = selectedCredentials.some(c => c.id === cred.id);
                        const submitted = isSubmitted(cred.id);
                        
                        return (
                            <div
                                key={cred.id}
                                className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                                    submitted 
                                        ? 'border-green-300 bg-green-50 cursor-not-allowed opacity-60'
                                        : isSelected 
                                        ? 'border-blue-500 bg-blue-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }`}
                                onClick={() => !submitted && toggleCredential(cred)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{cred.icon}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{cred.name}</p>
                                                {cred.new && <Badge className="bg-green-500 text-white text-xs">New</Badge>}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{cred.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-sm font-bold text-blue-600">{cred.points}</span>
                                    {submitted && (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    )}
                                    {isSelected && !submitted && (
                                        <Badge className="bg-blue-600 text-white">Selected</Badge>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
            
            {/* Action Buttons */}
            {selectedCredentials.length > 0 && (
                <div className="flex justify-end gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => setSelectedCredentials([])}
                    >
                        Clear Selection
                    </Button>
                    <Button 
                        onClick={handleRequestSelected}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Request {selectedCredentials.length} Credential{selectedCredentials.length > 1 ? 's' : ''}
                    </Button>
                </div>
            )}
        </div>
    );
}
```

---

### Step 7: Integrate Into Dashboard (30 min)

**File**: `pages/dashboard.js`

Add the Score Builder tab:

```jsx
import ScoreBuilderWizard from '../components/ScoreBuilderWizard';

// Update tabs array
const tabs = [
    { id: 'score', name: 'Credit Score', icon: TrendingUp },
    { id: 'builder', name: 'Score Builder', icon: Sparkles }, // NEW TAB
    { id: 'credentials', name: 'Build Credit', icon: FileText },
    { id: 'lending', name: 'Lending Pool', icon: Coins },
    { id: 'positions', name: 'My Positions', icon: BarChart3 }
];

// In tab rendering:
{activeTab === 'builder' && (
    <ScoreBuilderWizard
        currentScore={creditScore}
        submittedCredentials={credentials}
        onRequestCredential={handleRequestCredential}
    />
)}
```

---

### Step 8: Add Real-Time Interest Display (1 hour)

**File**: `components/PositionCard.jsx`

```jsx
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Clock } from 'lucide-react';

export default function PositionCard({ position, onRepay }) {
    const [accruedInterest, setAccruedInterest] = useState(0);
    const [totalOwed, setTotalOwed] = useState(position.borrowed);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        let interval;
        
        const fetchInterest = async () => {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const lendingPool = new ethers.Contract(
                    process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS,
                    LENDING_POOL_ABI,
                    provider
                );
                
                const currentDebt = await lendingPool.getBorrowBalanceWithInterest(position.userAddress);
                const currentDebtFormatted = parseFloat(ethers.utils.formatUnits(currentDebt, 6));
                
                setTotalOwed(currentDebtFormatted);
                setAccruedInterest(currentDebtFormatted - position.borrowed);
                
            } catch (error) {
                console.error('Error fetching interest:', error);
            }
        };
        
        // Fetch immediately
        fetchInterest();
        
        // Then update every 5 seconds
        interval = setInterval(fetchInterest, 5000);
        
        return () => clearInterval(interval);
    }, [position]);
    
    const apr = getTierAPR(position.creditScore); // Helper function
    
    return (
        <Card className="p-6">
            {/* Existing position info... */}
            
            {/* Interest Display */}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Interest Accruing</span>
                    <Badge variant="outline" className="text-yellow-700 border-yellow-400">
                        {apr}% APR
                    </Badge>
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Principal:</span>
                        <span className="font-semibold">${position.borrowed.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Accrued Interest:</span>
                        <span className="font-semibold text-yellow-700">
                            +${accruedInterest.toFixed(6)}
                        </span>
                    </div>
                    <div className="h-px bg-gray-300 my-2" />
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-900">Total Owed:</span>
                        <span className="font-bold text-lg">${totalOwed.toFixed(2)}</span>
                    </div>
                </div>
                
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>Updates every 5 seconds</span>
                </div>
            </div>
        </Card>
    );
}

function getTierAPR(score) {
    if (score >= 900) return 5;
    if (score >= 800) return 6;
    if (score >= 700) return 7.5;
    if (score >= 600) return 9;
    if (score >= 500) return 11;
    if (score >= 400) return 13;
    if (score >= 300) return 15;
    return 18;
}
```

---

## ✅ Phase 3 Acceptance Criteria

### Smart Contracts
- [ ] Interest accrual functions implemented
- [ ] `getBorrowBalanceWithInterest()` returns correct values
- [ ] Borrow function updates user borrow index
- [ ] Repay function handles interest correctly
- [ ] Health factor includes interest
- [ ] All existing tests still pass
- [ ] New tests for interest pass
- [ ] Gas usage reasonable (<300k for borrow with interest)

### Frontend - Score Builder
- [ ] Wizard displays current and simulated scores
- [ ] Tier progress bar shows correctly
- [ ] "Points to next tier" calculation accurate
- [ ] Credential selector shows all 4 types
- [ ] Already-submitted credentials disabled
- [ ] Selected credentials highlight visually
- [ ] Simulation updates in real-time
- [ ] Request button works for multiple credentials

### Frontend - Interest Display
- [ ] Position card shows accrued interest
- [ ] Interest updates every 5 seconds
- [ ] APR badge displays correct rate
- [ ] Total owed = principal + interest
- [ ] No console errors

### Integration
- [ ] Full flow: Supply → Borrow → Wait 1 min → Check interest accrued
- [ ] Repay includes interest amount
- [ ] Health factor decreases as interest accrues
- [ ] Score Builder simulation matches on-chain calculation

---

## 🧪 Testing Commands

```bash
# Test contracts
cd contracts
npx hardhat test test/LendingPool.test.ts

# Test interest accrual specifically
npx hardhat test --grep "interest"

# Test locally with time manipulation
npx hardhat node
# Then in another terminal, use ethers.provider.send("evm_increaseTime", [3600]) to fast-forward
```

---

## 📊 Progress Tracking

**Part A: LendingPool v2**
- [ ] Step 1: Add state variables (30 min)
- [ ] Step 2: Interest accrual logic (1.5 hours)
- [ ] Step 3: Update borrow function (30 min)
- [ ] Step 4: Update repay function (30 min)
- [ ] Step 5: Update health factor (20 min)

**Part B: Score Builder Wizard**
- [ ] Step 6: Create wizard component (2 hours)
- [ ] Step 7: Integrate into dashboard (30 min)
- [ ] Step 8: Real-time interest display (1 hour)

**Total**: 8-10 hours

---

## ✨ What You've Accomplished

After Phase 3, you'll have:

✅ **Complete Lending Protocol**: Interest accrual makes it production-grade  
✅ **Crystal-Clear UX**: Users see exactly how to improve their score  
✅ **Real-Time Feedback**: Interest ticking up, scores simulating live  
✅ **Tier Clarity**: Progress bars and "points to next tier" messaging  
✅ **Professional Polish**: Animated, responsive, intuitive interface  

---

## 🚀 Next Steps

1. **Commit your work**:
```bash
git add .
git commit -m "feat: Complete Phase 3 - Interest system + Score Builder Wizard"
git push
```

2. **Take a break** ☕ (you deserve it - this was a long phase!)

3. **Move to Phase 4**: [PHASE4-DEPLOYMENT.md](./PHASE4-DEPLOYMENT.md)

---

**Phase Status**: Ready to Execute  
**Estimated Completion**: End of Day 3 Morning (Oct 27)

