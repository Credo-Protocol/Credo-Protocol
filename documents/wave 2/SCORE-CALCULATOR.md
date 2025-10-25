# Credit Score Calculator Reference

**Last Updated:** October 12, 2025

This document provides a quick reference for calculating credit scores in the Credo Protocol.

---

## 📐 Score Calculation Formula

```
Final Score = (Base + Credential Points) × (1 + Diversity Bonus)
```

### Components

1. **Base Score:** 500 (constant for all users)
2. **Credential Points:** Sum of all valid credential type points
3. **Diversity Bonus:** 5% per unique credential type (max 25%)

---

## 💳 Credential Point Values

| Credential Type | Type ID | Base Points |
|----------------|---------|-------------|
| Proof of Income | 0 | +150 |
| **Proof of Stable Balance (Mock Bank)** | 1 | **+100** |
| **Proof of CEX History (Mock CEX)** | 2 | **+80** |
| **Proof of Employment (Mock Employer)** | 3 | **+70** |
| Proof of On-Chain Activity | 4 | +50 |

*Bold = Currently available in Wave 2 MVP*

---

## 🎯 Diversity Bonus Table

| Unique Credential Types | Bonus | Multiplier |
|------------------------|-------|------------|
| 1 | +5% | × 1.05 |
| 2 | +10% | × 1.10 |
| 3 | +15% | × 1.15 |
| 4 | +20% | × 1.20 |
| 5+ | +25% | × 1.25 |

**Important:** Diversity bonus applies from the FIRST credential!

---

## 📊 Example Calculations (Wave 2 MVP)

### Scenario 1: Add Mock CEX (First Credential)

```
Base:               500
+ CEX Points:       +80
= Subtotal:         580
× Diversity (5%):   × 1.05
= Final Score:      609 ✅
```

### Scenario 2: Add Mock Employer (Second Credential)

```
Base:               500
+ CEX Points:       +80
+ Employer Points:  +70
= Subtotal:         650
× Diversity (10%):  × 1.10
= Final Score:      715 ✅
```

### Scenario 3: Add Mock Bank (Third Credential)

```
Base:               500
+ CEX Points:       +80
+ Employer Points:  +70
+ Bank Points:      +100
= Subtotal:         750
× Diversity (15%):  × 1.15
= Final Score:      862 ✅
```

---

## 💰 Collateral Factor by Score

| Score Range | Collateral Factor | Example: Borrow $100 | Max Borrow (200 USDC collateral) |
|-------------|-------------------|----------------------|----------------------------------|
| 0-499 | 150% | Need $150 collateral | $133 |
| **500-599** | **100%** | **Need $100 collateral** | **$200** |
| **600-699** | **90%** | **Need $90 collateral** | **$222** |
| **700-899** | **75%** | **Need $75 collateral** | **$266** |
| 900-1000 | 50% | Need $50 collateral | $400 |

*Bold = Achievable in Wave 2 MVP*

---

## 🎮 Quick Reference for Testing

### Starting State (No Credentials)
- **Score:** 500
- **Collateral Factor:** 100%
- **Max Borrow:** $1.00 per $1.00 collateral

### After 1st Credential (Mock CEX)
- **Score:** 609 ✅
- **Collateral Factor:** 90% ✅
- **Max Borrow:** $1.11 per $1.00 collateral
- **Improvement:** +11% borrowing power

### After 2nd Credential (Mock Employer)
- **Score:** 715 ✅
- **Collateral Factor:** 75% ✅
- **Max Borrow:** $1.33 per $1.00 collateral
- **Improvement:** +33% borrowing power from base

### After 3rd Credential (Mock Bank)
- **Score:** 862 ✅
- **Collateral Factor:** 75% ✅ (same tier as 715)
- **Max Borrow:** $1.33 per $1.00 collateral
- **Improvement:** Higher score for future features

---

## ⚙️ Additional Score Modifiers (Smart Contract Implementation)

### Issuer Trust Multiplier
- Points are multiplied by issuer trust score (0-100%)
- All Wave 2 issuers have 100% trust → no reduction
- Formula: `Adjusted Points = Base Points × (Trust Score / 100)`

### Recency Decay
- Fresh (< 30 days): 100% of points
- 30-90 days: 95% of points
- 90-180 days: 85% of points
- 180+ days: 70% of points

### Maximum Score Cap
- Absolute maximum: 1000 points
- Prevents score overflow from excessive credentials

---

## 🧮 Manual Score Calculator

To calculate your expected score:

1. Start with **500** (base)
2. Add points for each credential type:
   - Mock CEX: +80
   - Mock Employer: +70
   - Mock Bank: +100
3. Sum all points (e.g., 500 + 80 = 580)
4. Count unique credential types (e.g., 1)
5. Multiply by diversity bonus:
   - 1 type: × 1.05
   - 2 types: × 1.10
   - 3 types: × 1.15
6. **Result:** Your credit score!

Example: `(500 + 80) × 1.05 = 609`

---

## 📝 Notes

- **All credentials expire:** Check `expiresAt` timestamp
- **Replay protection:** Same credential cannot be submitted twice
- **Score updates immediately:** On-chain transaction required
- **Collateral factors:** Checked at borrow time, not supply time

---

## 🔗 Related Documentation

- `docs/TESTING-GUIDE.md` - Complete testing scenarios
- `contracts/contracts/CreditScoreOracle.sol` - Smart contract implementation
- `docs/IMPLEMENTATION.md` - Full technical specification

---

**For questions or issues, refer to the smart contract code as the source of truth.**

