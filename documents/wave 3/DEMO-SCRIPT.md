# Credo Protocol Demo Script

**Duration**: 4 minutes  
**Format**: Live demonstration + talking points  
**Goal**: Show judges how Credo Protocol brings identity-based lending to MOCA ecosystem

---

## 🎯 Demo Objectives

By the end of this demo, judges should understand:
1. **The Problem**: Why DeFi needs credit scores (150% collateral is broken)
2. **The Solution**: How Credo uses MOCA credentials to enable better terms
3. **MOCA Integration**: Official AIR Kit usage (not just SSO!)
4. **Ecosystem Value**: How other dApps can use our credit scores

---

## ⏱️ Timeline Overview

| Time | Act | Key Message |
|------|-----|-------------|
| 0:00-0:30 | **Act 1: The Problem** | "DeFi is capital inefficient" |
| 0:30-2:30 | **Act 2: The Journey** | "Build score → Get better terms" |
| 2:30-3:30 | **Act 3: Ecosystem** | "Composable credit for all dApps" |
| 3:30-4:00 | **Act 4: Vision** | "Identity-backed DeFi is the future" |

---

## 🎬 Act 1: The Problem (30 seconds)

### Screen: Landing Page

**[Open https://credo-protocol.vercel.app]**

### Talking Points:

> "Let me show you the biggest problem in DeFi today."
> 
> **[Point to hero section]**
> 
> "Traditional DeFi protocols like Aave require **150% collateral** to borrow $100. That's not credit - that's just locking your own money."
> 
> "If you need $1,000 for rent, you need to already have $1,500 sitting around. This excludes billions of people from DeFi."
> 
> **[Scroll to problem section]**
> 
> "Credo Protocol solves this by bringing **identity-based credit scoring** to blockchain. Let me show you how."

**Time Check**: 0:30

---

## 🎬 Act 2: The Journey (2 minutes)

### Part A: Login & Dashboard (20 seconds)

**[Click "Get Started"]**

### Talking Points:

> "First, I'll login with Moca ID - one-click authentication powered by AIR Kit."
> 
> **[Click "Login with Moca ID" - already connected for demo]**
> 
> "Notice I'm using official **MOCA Account Services** - not a custom wallet integration. This is true MOCA ecosystem participation."
> 
> **[Dashboard loads]**
> 
> "Here's my dashboard. Current credit score: **[YOUR_SCORE]** - that's **[YOUR_TIER]** tier."

**Time Check**: 0:50

---

### Part B: Score Builder Wizard (40 seconds)

**[Navigate to "Score Builder" tab]**

### Talking Points:

> "This is our **Score Builder Wizard** - it shows exactly how to improve your credit."
> 
> **[Select Income Range credential]**
> 
> "Watch what happens when I simulate adding an Income Range credential..."
> 
> **[Score updates in real-time]**
> 
> "See? My simulated score jumped from **[CURRENT]** to **[SIMULATED]**! That unlocks **[NEW_TIER]** tier."
> 
> **[Point to progress bar]**
> 
> "The progress bar shows I need **X more points** to reach the next tier. Complete transparency - users know exactly what to do."
> 
> **[Select Bank Balance credential]**
> 
> "Add a second credential... now I'm at **[NEW_SCORE]**. Notice the **privacy badges** - these are bucketed credentials. I prove my income is '$5k-$10k' without revealing my exact salary."

**Time Check**: 1:30

---

### Part C: Request Credential (MOCA Integration) (30 seconds)

**[Click "Go to Build Credit →" button]**

### Talking Points:

> "Let me request one of these credentials to show the MOCA integration."
> 
> **[Click "Request Credential" on Income Range]**
> 
> "Here's where Credo becomes a true MOCA ecosystem participant..."
> 
> **[Modal opens]**
> 
> "Notice: **'No MOCA tokens needed - Gas Sponsored'** - we're using MOCA's Paymaster infrastructure."
> 
> **[Credential processes]**
> 
> "Behind the scenes:
> - Backend generates a **Partner JWT** with our official credentials
> - **AIR Kit signs the credential** using W3C Verifiable Credentials standard
> - Credential is stored on **MOCA Chain Storage Providers** (MCSP) - decentralized storage
> - It appears in the official **AIR Kit Dashboard** - not just our app
> - Any MOCA dApp can now discover and verify this credential"
> 
> **[Show success message with MCSP badge]**
> 
> "That's **official MOCA Credential Services** - not mock signatures!"

**Time Check**: 2:00

---

### Part D: Lending Power (30 seconds)

**[Navigate to "Lending Pool" tab]**

### Talking Points:

> "Now let's see how credit scores unlock better lending terms."
> 
> **[Point to credit score section]**
> 
> "With my **[YOUR_SCORE]** credit score, I have **[COLLATERAL]%** collateral requirements."
> 
> "That means I can borrow **$[AMOUNT]** for every $100 I supply - compare that to standard DeFi's $67!"
> 
> **[Point to existing position if you have one]**
> 
> "I already have an active position here. Notice the **interest accruing in real-time** - it updates every 5 seconds."
> 
> **[Point to APR badge]**
> 
> "My borrowing rate is **[YOUR_APR]%** - higher credit scores get lower rates. Someone with Exceptional credit (900+) gets just **5% APR**."

**Time Check**: 2:30

---

## 🎬 Act 3: Ecosystem Value (1 minute)

### Part A: Leaderboard (15 seconds)

**[Scroll down to Leaderboard section]**

### Talking Points:

> "Here's our **live leaderboard** - showing top credit scores across the network."
> 
> **[Point to top users]**
> 
> "This demonstrates network effects. Users are incentivized to build their scores, and we can see adoption happening."

**Time Check**: 2:45

---

### Part B: Composable API (30 seconds)

**[Open new tab to API endpoint]**

**[Navigate to: `https://credo-protocol.vercel.app/api/score/[YOUR_DEMO_ADDRESS]`]**

### Talking Points:

> "Now here's where Credo becomes **infrastructure for the entire ecosystem**."
> 
> **[Show JSON response]**
> 
> "Any dApp can query our public API to get credit scores. CORS is enabled - this works from anywhere."
> 
> **[Scroll through response]**
> 
> "We return: score, tier, borrowing power, APR, credentials, and **integration examples**."
> 
> "Imagine:
> - **GameFi** projects gating premium content by credit score
> - **DAOs** weighting votes by creditworthiness  
> - **NFT marketplaces** offering installment payments to trusted users
> - **Other DeFi protocols** reducing collateral for Credo users"
> 
> **[Show Solidity example in response]**
> 
> "We even include **Solidity code examples** - plug and play integration."

**Time Check**: 3:15

---

### Part C: Testnet Explorer (15 seconds)

**[Open Moca Devnet Explorer in new tab]**

**[Navigate to your Oracle contract]**

### Talking Points:

> "All of this is **deployed and live on Moca Devnet**. Contracts are verified and publicly auditable."
> 
> **[Show contract address]**
> 
> "Here's our CreditScoreOracle - **all logic is on-chain and transparent**."

**Time Check**: 3:30

---

## 🎬 Act 4: Vision & Next Steps (30 seconds)

### Screen: Back to Dashboard or Landing

### Talking Points:

> "So what have we built?
> 
> **For Users**: 
> - 2-3x better borrowing power than standard DeFi
> - Privacy-protected credentials (only ranges disclosed)
> - Clear path to improve their score
> 
> **For Developers**:
> - Composable credit primitive via public API
> - Solidity interfaces for smart contract integration  
> - Real-world identity brought to DeFi
> 
> **For MOCA Ecosystem**:
> - Official AIR Kit integration (Issuer DIDs, MCSP storage, gas sponsorship ready)
> - W3C Verifiable Credentials compliance
> - True interoperability - our credentials work across all MOCA dApps
> 
> This is just the beginning. Imagine when we integrate:
> - **Real financial data** via Plaid
> - **Zero-knowledge proofs** for full privacy
> - **Cross-chain** identity using MOCA's Identity Oracle
> - **Liquidation mechanisms** for mainnet deployment
> 
> Credo Protocol brings **TradFi credit concepts to Web3** - making DeFi accessible to everyone, not just crypto-wealthy users."
> 
> **[Pause]**
> 
> "Questions?"

**Time Check**: 4:00

---

## 📸 Screenshots to Prepare

Before the demo, take high-quality screenshots of:

1. **Landing Page Hero** - Shows the problem statement
2. **Dashboard with Score** - Your credit score + tier display
3. **Score Builder Wizard** - Simulation with credentials selected
4. **Credential Request Modal** - Showing MCSP storage badge
5. **Lending Pool Interface** - Borrowing power based on score
6. **Position Card with Interest** - Real-time interest display
7. **Leaderboard** - Top users with scores
8. **API JSON Response** - Pretty-printed with syntax highlighting
9. **Explorer Contract View** - Verified contract on devnet

**Save all screenshots to**: `/public/demo/` folder

---

## 🎯 Key Talking Points (Memorize These)

### MOCA Integration Points:
- ✅ "Official AIR Kit Issuer DIDs - not custom signatures"
- ✅ "Credentials stored on MCSP (decentralized storage)"
- ✅ "Gas sponsorship ready with Paymaster infrastructure"
- ✅ "W3C Verifiable Credentials standard compliance"
- ✅ "Interoperable across MOCA ecosystem"

### Differentiation Points:
- ✅ "Privacy-first: Only ranges disclosed, never exact amounts"
- ✅ "Crystal-clear UX: Users know exactly how to improve"
- ✅ "Composable infrastructure: Any dApp can use our scores"
- ✅ "Production-ready: Interest accrual, testnet deployment, 104+ tests"

### Impact Points:
- ✅ "2-3x better borrowing power than standard DeFi"
- ✅ "From 150% collateral down to 50% for best users"
- ✅ "Brings billions of people into DeFi"
- ✅ "Credit as infrastructure primitive for ecosystem"

---

## 🔄 Backup Plan

### If Internet Fails:
1. **Use screenshots** - walk through the flow with images
2. **Show code locally** - open project in VS Code
3. **Video backup** - have a pre-recorded 2-min video ready

### If Testnet is Slow:
1. **Mention it** - "Testnet transactions can be slow - let me explain what's happening"
2. **Use previous transactions** - show already-completed ones
3. **Skip to next section** - don't wait more than 20 seconds

### If Contract Errors:
1. **Have a second demo wallet ready** - pre-funded and tested
2. **Show error handling** - "Notice our user-friendly error messages"
3. **Fall back to API** - "Let me show the API instead"

---

## 🎤 Q&A Preparation

### Expected Questions:

**Q: "How do you verify credentials are real?"**
> A: "Great question! In this demo, we simulate credentials for testing. In production, we'd integrate with:
> - **Plaid** for real bank data
> - **Exchange APIs** (with OAuth) for trading history  
> - **Payroll providers** for employment verification
> 
> The smart contract just validates the **signature** - it doesn't know if data is 'real'. That's why issuer trust scores matter. Users can choose to trust certain issuers (like verified exchanges) more than others."

**Q: "What prevents Sybil attacks?"**
> A: "Credential issuers are the Sybil protection layer. For example:
> - **CEX verification** requires exchange account (KYC'd)
> - **Bank balance** needs Plaid connection (one per person)
> - **Employment** requires payroll system integration
> 
> You can't fake a Coinbase API credential without actually having a Coinbase account. MOCA's Issuer DIDs add another layer - only registered, trusted issuers can sign valid credentials."

**Q: "How is this better than just using tokenbound accounts or on-chain history?"**
> A: "On-chain activity only shows what you've done with crypto. Credo bridges **off-chain identity** - your job, bank balance, salary - things that matter in traditional credit. Most people have more financial history off-chain than on-chain. We're bringing that into DeFi."

**Q: "What happens if someone defaults? No liquidation mechanism shown."**
> A: "Correct - this is a **testnet demo**, not mainnet-ready. For production we'd need:
> - Liquidation mechanism (like Aave's)
> - Price oracles (Chainlink)
> - Insurance fund for protocol solvency
> - Potentially: social slashing (reputation damage for defaults)
> 
> This buildathon focused on proving the **credential infrastructure works**. Liquidation is phase 2."

**Q: "Can users game the system by requesting the same credential multiple times?"**
> A: "No - the smart contract uses `credentialHash` as a unique identifier. Same credential twice = rejected. Also, credentials **decay over time** (70-100% weight based on age), so old credentials become less valuable. Users are incentivized to update with fresh credentials."

**Q: "Why Moca Chain? Why not Ethereum?"**
> A: "MOCA's **AIR Kit** provides the credential infrastructure we need - Issuer DIDs, W3C VC signing, MCSP storage, gas sponsorship. Building this from scratch on Ethereum would take months. Plus, Moca's focus on gaming/entertainment aligns with our vision - gamers are our initial target market (they have exchange history but no traditional credit)."

**Q: "How do you handle privacy? Can everyone see my salary?"**
> A: "Privacy-first design! We use **bucketed credentials**:
> - Income: '$5k-$10k' not '$7,234.56'
> - Bank balance: '$10k+' not '$23,456.78'
> 
> On-chain data just stores `INCOME_MEDIUM` + cryptographic proof. In future phases, we can add **zero-knowledge proofs** via AIR Kit's ZK credential services - prove you earn > $5k without revealing amount."

---

## ✅ Pre-Demo Checklist

**Technical Setup:**
- [ ] Demo wallet funded with MOCA (for gas)
- [ ] Demo wallet has 10,000+ test USDC
- [ ] Demo wallet has high credit score (850+)
- [ ] Active borrow position (for interest display)
- [ ] Interest accruing for at least 1 hour
- [ ] All tabs tested in target browser
- [ ] Second backup wallet ready (if primary fails)

**Browser Setup:**
- [ ] Clear cache and cookies
- [ ] Test in incognito mode
- [ ] Zoom level at 100% (for screen share)
- [ ] Close all unnecessary tabs
- [ ] Bookmark all demo URLs
- [ ] Have API endpoint URL ready to paste

**Backup Materials:**
- [ ] Screenshots saved to `/public/demo/`
- [ ] Video recording of full flow (2-3 min)
- [ ] Slide deck with architecture diagram (optional)
- [ ] Second device ready (phone/tablet)
- [ ] Offline demo mode tested (if supported)

**Personal Prep:**
- [ ] Demo script read through 3 times
- [ ] Timing practiced (aim for 3:30-3:50)
- [ ] Key talking points memorized
- [ ] Q&A responses rehearsed
- [ ] Water bottle ready
- [ ] Good lighting and audio checked

---

## 🎥 Recording Tips (If Pre-Recording)

### Video Setup:
- **Resolution**: 1920x1080 (1080p minimum)
- **Frame Rate**: 30fps
- **Audio**: Use external mic if possible (clear voice)
- **Screen**: Record at 100% zoom, hide bookmarks bar

### Editing:
- Add **text overlays** for key points ("Gas Sponsored", "MCSP Storage", etc.)
- **Speed up** long transactions (2x speed)
- Add **arrows/highlights** pointing to important UI elements
- Include **B-roll**: Contract on explorer, code snippets, architecture diagram

### Structure:
1. **Intro** (5 sec): Logo + "Credo Protocol Demo"
2. **Problem** (20 sec): Show traditional DeFi inefficiency
3. **Solution** (2 min): Full user journey
4. **Ecosystem** (1 min): API + composability
5. **Outro** (20 sec): Links + CTA

---

## 📞 Contact Information (For Judges)

After the demo, share:

- **Live App**: https://credo-protocol.vercel.app
- **GitHub**: https://github.com/YourUsername/Credo-Protocol
- **API Endpoint**: https://credo-protocol.vercel.app/api/score/:address
- **Twitter/X**: [@marcustan1337](https://x.com/marcustan1337)
- **Telegram**: [@szaaa2311](https://t.me/szaaa2311)
- **Demo Video**: [YouTube link if uploaded]

---

## 🚀 Final Confidence Boosters

Remember:
- ✅ You've built something **production-ready** (104+ tests passing)
- ✅ You've **actually integrated MOCA** (not just using it for SSO)
- ✅ Your UX is **crystal-clear** (Score Builder is intuitive)
- ✅ It's **composable infrastructure** (other dApps can use it)
- ✅ You've **thought through edge cases** (privacy, security, etc.)

**You've got this!** 💪

---

**Document Version**: 1.0  
**Last Updated**: October 27, 2025  
**Demo Ready**: Yes ✅

