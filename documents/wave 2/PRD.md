# Credo Protocol: Complete Project Overview & Hackathon Plan

**Project:** Credo Protocol: Decentralized Trust for Capital
**Status:** Wave 2 - MVP Development Phase
**Last Updated:** October 12, 2025

---

## 1. Vision & Mission Statement

**Vision:** To build the foundational trust layer for the new digital economy, making capital accessible based on merit and reputation, not just existing wealth.
**Mission:** To create a decentralized lending protocol on Moca Chain that transforms verifiable real-world data into a privacy-preserving on-chain credit score, enabling undercollateralized loans and unlocking fair access to capital for everyone.

---

## 2. The Problem

* **Traditional Finance (TradFi):** Credit systems are opaque, centralized, and exclusionary. Billions of "unbanked" or "underbanked" individuals are locked out of capital markets due to a lack of formal credit history.
* **Decentralized Finance (DeFi):** While open and permissionless, DeFi lending is capital-inefficient. Protocols like Aave and Compound require over-collateralization (e.g., provide $150 of assets to borrow $100), making them unsuitable for genuine credit needs.

---

## 3. The Solution: Credo Protocol

Credo Protocol bridges this gap by creating an **identity-backed lending model**. Instead of relying solely on collateral, we assess creditworthiness based on a user's verifiable on-chain and off-chain reputation.

**User Journey:**
1.  **Onboard:** User logs into the Credo dApp seamlessly with their Moca ID.
2.  **Aggregate:** User connects various data sources (e.g., exchange accounts, payroll systems, bank accounts) through our secure interface.
3.  **Prove:** Issuers provide the user with Verifiable Credentials (VCs) like "Proof of Income" or "Proof of Stable Balance" using Zero-Knowledge Proofs. The raw data never leaves the user or issuer.
4.  **Score:** The user submits these proofs to the Credo smart contract, which generates a transparent, on-chain credit score.
5.  **Borrow:** Based on this score, the user unlocks access to undercollateralized loans with favorable terms.

---

## 4. Technical Architecture & Moca Stack Integration

**Frontend:**
* **Stack:** Next.js, React, Ethers.js, Tailwind CSS.
* **Moca Integration:** Uses **`AIR Account Services`** for a one-click, secure Web3 SSO login flow. This is the entry point for all users.

**Smart Contracts (Solidity):**
* **`CreditScoreOracle.sol`:**
    * Receives and cryptographically verifies VCs submitted by users.
    * Implements a weighted algorithm to calculate a credit score based on the type, issuer, and recency of credentials.
    * Maps the final score to the user's Moca ID on-chain.
* **`LendingPool.sol`:**
    * A standard lending pool contract where users can supply and borrow assets.
    * **Core Innovation:** The `borrow()` function queries the `CreditScoreOracle` to dynamically adjust the required collateral factor for each user.

**Backend/Off-Chain Services:**
* **Mock Issuer Service (For Hackathon):** A simple Node.js/Express server that acts as a mock data provider (e.g., an employer) to issue signed VCs for testing.
* **Moca Integration:** This service will use the **`AIR Credential Services`** SDK to structure, sign, and issue the Verifiable Credentials in the correct format. It will also be used to implement the ZK-proof logic in Wave 3.

---

## 5. Multi-Wave Hackathon Execution Plan

### **Wave 2: The Minimum Viable Product (MVP)**
* **Goal:** Prove the core concept is technically feasible from end-to-end.
* **Deadline:** October 19, 23:00 (+08).
* **What's New for this Wave:** The entire foundational infrastructure, demonstrating identity-based lending is possible on Moca.

#### **Action Plan (Current Wave - Starting Now):**
* **Sun, Oct 12 - Mon, Oct 13:**
    * `[ ]` (lyle) Scaffold and implement core logic for `CreditScoreOracle.sol` and `LendingPool.sol`.
    * `[ ]` (lyle) Write deployment scripts and unit tests using Hardhat.
    * `[ ]` (Eva_code) Set up the backend Node.js server and create an endpoint to issue a basic, signed VC.
* **Tue, Oct 14 - Wed, Oct 15:**
    * `[ ]` (PaulSpread) Set up the Next.js project and build the main UI components (Login page, Dashboard, Borrow interface).
    * `[ ]` (PaulSpread) Integrate **`AIR Account Services`** for the user login flow.
* **Thu, Oct 16 - Fri, Oct 17:**
    * `[ ]` (Eva_code) Integrate **`AIR Credential Services`** SDK into the backend to correctly format and issue the VC.
    * `[ ]` (PaulSpread/lyle) Connect the frontend to the smart contracts on the Moca testnet. Implement the logic for a user to request a VC from the mock issuer and submit it to the Oracle.
* **Sat, Oct 18:**
    * `[ ]` (All) Full end-to-end testing: Login -> Request VC -> Generate Score -> Borrow.
    * `[ ]` (All) Bug fixing and UI polishing.
* **Sun, Oct 19 (Submission Day):**
    * `[ ]` (PaulSpread) Record the 3-minute demo video.
    * `[ ]` (Eva_code) Finalize the GitHub repo with a comprehensive `README.md`.
    * `[ ]` (All) **Submit the project before 23:00.**

### **Wave 3: The Polished Prototype**
* **Goal:** Evolve the MVP into a robust, privacy-preserving, and user-centric prototype.
* **Deadline:** October 23, 23:00 (+08).
* **What's New for this Wave:** Integration with a real-world data sandbox (Plaid), implementation of Zero-Knowledge Proofs for privacy, and a significantly improved UX.

### **Final Demo Day Preparation**
* **Goal:** Present Credo Protocol as a viable, venture-backable business.
* **Deadline:** October 28, 23:00 (+08).
* **Key Tasks:** Refine the pitch deck, polish the live demo, and outline tokenomics for a potential `$CREDO` token.

---

## 6. Post-Hackathon Vision & Go-to-Market

1.  **Phase 1 (Beachhead):** Target the Moca & Animoca crypto-native ecosystem with on-chain credentials to build initial liquidity.
2.  **Phase 2 (Crossover):** Partner with regional FinTechs (leveraging our location in Malaysia and Animoca's network) to act as credential issuers for their user bases.
3.  **Phase 3 (Platform):** Open the Issuer SDK for any developer to use the Credo credit score as a composable reputation primitive for their own dApps.

---

## 7. Judging Criteria Alignment

* **Innovation & Novelty (25%):** We are shifting DeFi from asset-backed to identity-backed lending, a paradigm shift.
* **Technical Robustness (30%):** Our architecture is sound, modular, and directly showcases the power of the Moca Stack.
* **User Experience (20%):** Our "3-Click Loan" flow abstracts away complexity, making DeFi accessible to a mainstream audience.
* **Privacy & Trustlessness (15%):** User sovereignty is paramount, cemented by our use of ZK-proofs in Wave 3.
* **Potential Impact & Scalability (10%):** Our solution addresses a trillion-dollar market and can become a foundational layer for the entire Moca ecosystem.