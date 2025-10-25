# Credo Protocol - Wave 3 Demo Script

**Duration**: 4 minutes  
**Audience**: Judges, partners, investors  
**Goal**: Show production-ready protocol with clear user journey and ecosystem impact

---

## 📋 Pre-Demo Checklist

**30 Minutes Before Demo**:
- [ ] Demo wallet funded (MOCA + USDC)
- [ ] Demo wallet has score 850+ (all 4 credentials submitted)
- [ ] Active borrow position (interest accruing for at least 1 hour)
- [ ] Leaderboard shows 3+ users
- [ ] Browser tabs pre-opened (dashboard, API, explorer)
- [ ] Laptop fully charged
- [ ] Internet connection stable
- [ ] Backup device ready
- [ ] Screenshots saved (offline backup)

---

## 🎬 Demo Flow (4 Minutes)

### Act 1: The Problem (30 seconds)

**Open Landing Page** → `https://credo-protocol.vercel.app`

**Say:**
> "Traditional DeFi is broken for actual credit needs. Aave and Compound require **150% collateral** to borrow $100. That's not lending—that's a security deposit.
> 
> Meanwhile, billions of people have **real creditworthiness** through their bank accounts, paychecks, and trading history. But DeFi can't see it.
> 
> Credo Protocol brings **identity-backed lending** to Moca Chain. Your real-world reputation unlocks better rates."

**Action**: Click "Get Started" → Already logged in, go straight to dashboard

---

### Act 2: The Journey (2 minutes)

#### Scene 1: Score Builder Wizard (45 sec)

**Navigate to "Score Builder" tab**

**Say:**
> "Here's our **Score Builder Wizard**—the clearest path to better rates in all of DeFi.
> 
> I currently have a score of **862**—that's the 'Excellent' tier. I can borrow with just **60% collateral** instead of 150%.
> 
> Watch what happens when I select new credentials..."

**Action**:
1. Click "Income Range" credential → Score simulation jumps to 900+
2. Show "Unlocked Exceptional Tier" message
3. Point to collateral improvement: **60% → 50%**

**Say:**
> "The wizard shows exactly what each credential unlocks. No guessing. You see **'180 points to Exceptional tier'** and know exactly how to get there.
> 
> And here's the key: **privacy-first**. The 'Income Range' credential only reveals my bracket—$5k-$10k per month. Never my exact salary."

---

#### Scene 2: Borrowing Power (30 sec)

**Navigate to "Lending Pool" tab**

**Say:**
> "Now let's see this in action. I've supplied **$5,000 USDC** as collateral."

**Point to screen**:
> - Traditional DeFi (150%): Borrow max $3,333
> - Credo Protocol (60%): **Borrow max $8,333**
> 
> "That's **2.5x more borrowing power** with the same collateral."

**Action**: Click "Borrow" → Show $5,000 borrow (don't execute, just show modal)

---

#### Scene 3: Live Interest (20 sec)

**Navigate to "My Positions" tab**

**Say:**
> "And because I have a high score, I pay just **6% APR** on this loan—not 18% like a low-score user.
> 
> Watch the interest ticker..."

**Action**: Point to interest updating in real-time

**Say:**
> "Updates every 5 seconds. Transparent. Fair. Based on your creditworthiness."

---

#### Scene 4: The Credentials (15 sec - if time permits)

**Navigate back to "Build Credit Score"**

**Say (quickly)**:
> "Four credential types: CEX history, employment, bank balance, income range. Mix and match. Higher diversity = bonus points."

---

### Act 3: Ecosystem Impact (1 minute)

#### Scene 1: Composable API (20 sec)

**Open new tab** → `/api/score/[DEMO_ADDRESS]`

**Say:**
> "Here's where it gets powerful. We've made credit scores **composable**—any dApp on Moca can use them.
> 
> [Point to JSON response]
> 
> One API call returns credit score, tier, borrowing power. Want to gate your GameFi features to users with scores above 700? Done. Want to weight DAO votes by creditworthiness? Done."

---

#### Scene 2: Leaderboard (20 sec)

**Back to dashboard** → Scroll to leaderboard

**Say:**
> "The leaderboard shows adoption in real-time. Competition drives credential submission. Network effects kick in.
> 
> [Point to your position]
> 
> I'm #2 with 862 points. Chasing #1."

---

#### Scene 3: Testnet = Production Ready (20 sec)

**Open new tab** → Testnet block explorer with your Oracle contract

**Say:**
> "Everything you just saw runs on **Moca testnet**—not a dev environment. Production-grade infrastructure.
> 
> [Point to verified contract]
> 
> All contracts verified. All code open source. All logic transparent on-chain."

---

### Act 4: The Vision (30 seconds)

**Return to dashboard or close with landing page**

**Say:**
> "Credo Protocol isn't just a lending pool. It's **identity infrastructure** for Web3.
> 
> **Today**: Undercollateralized lending on Moca Chain.  
> **Next Quarter**: Real credential issuers—exchanges, banks, payroll platforms.  
> **Long-term**: Every dApp in the Moca ecosystem uses Credo scores as a composable primitive.
> 
> We're bringing the $50 trillion consumer lending market on-chain—**one credential at a time**."

**Final Action**: Show slide with contact info / GitHub / Twitter

---

## 🎯 Talking Points for Q&A

### Q: "What about Sybil attacks?"

**A**: 
> "Great question. Credential issuers—whether it's Binance, your bank, or your employer—already have KYC. One person = one account. We **inherit their identity verification**. 
> 
> In the future, we can layer on zero-knowledge proofs through AIR Credential Services for additional privacy guarantees without sacrificing Sybil resistance."

---

### Q: "Why would issuers participate?"

**A**: 
> "Two reasons:
> 1. **Revenue**: Issuers earn fees for each credential issued
> 2. **User Acquisition**: If your users can borrow against their CEX history, they're more likely to use **your** exchange. It's a retention mechanism.
> 
> We're already in talks with exchanges in the Animoca ecosystem."

---

### Q: "How do you handle data privacy?"

**A**: 
> "We use **bucketed credentials**. Instead of revealing your exact $7,243.12 salary, we issue a credential saying 'Income: $5k-$10k bracket.'
> 
> The oracle only sees the bucket, never the raw data. Next wave, we're integrating AIR's zero-knowledge credential framework for provable claims without revealing **anything** beyond the assertion."

---

### Q: "What about liquidations?"

**A**: 
> "Wave 3 includes the liquidation logic—underwater positions can be liquidated by anyone for a bonus. Wave 4 will add automated liquidator bots and Dutch auction mechanisms for optimal price discovery.
> 
> But here's the thing: high-credit users are **less likely** to default. Our liquidation rate should be significantly lower than over-collateralized protocols."

---

### Q: "How do you get adoption and liquidity?"

**A**: 
> "Three vectors:
> 
> 1. **Gamification**: The leaderboard drives competition. 'I want that #1 spot' → submit more credentials
> 2. **Partnerships**: We're targeting Animoca's 570+ portfolio companies. Integrate Credo scores into GameFi, NFT marketplaces, DAOs
> 3. **Composability**: Every integration creates a flywheel. If your favorite game gates premium content to 700+ scores, you're **incentivized** to build your Credo credit."

---

### Q: "Why Moca Chain specifically?"

**A**: 
> "Three reasons:
> 
> 1. **AIR Kit**: The Account + Credential Services framework is **purpose-built** for identity. We're showcasing what it can do.
> 2. **Ecosystem Alignment**: Moca/Animoca focus on consumer applications—gaming, entertainment. That's where identity-based credit shines.
> 3. **First-Mover Advantage**: We're building foundational infrastructure **early**. As Moca grows, Credo becomes the credit layer."

---

### Q: "What's your business model?"

**A**: 
> "Multiple revenue streams:
> 
> 1. **Origination Fees**: Small % on each loan (e.g., 0.5%)
> 2. **Interest Spread**: Pool lenders earn 80% of interest, protocol keeps 20%
> 3. **API Access**: Premium API tiers for high-volume dApp integrations
> 4. **Issuer Fees**: Take a small cut when third-party issuers charge for credentials
> 
> But initially, **adoption over revenue**. Get to 10,000 users, then optimize economics."

---

### Q: "How is this different from Arcx/RociFi/TrueFi?"

**A**: 
> "Great comp question. Here's the differentiation:
> 
> - **TrueFi**: Focuses on institutional lending, manual underwriting. We're **automated** and **consumer-focused**.
> - **Arcx**: On-chain reputation (passport). We add **off-chain** credentials via AIR framework—your bank balance, salary, etc.
> - **RociFi**: Under-collateralized lending to *whitelisted* users. We're **permissionless**—anyone can build a credit score and borrow.
> 
> Our killer combo: **On-chain + Off-chain** reputation, **fully permissionless**, **composable by design**."

---

## 🚨 Backup Plan

**If Internet Fails**:
1. Show offline screenshots from `/public/demo/`
2. Walk through pre-recorded video
3. Show GitHub repo code offline

**If Smart Contract Fails**:
1. Show previous successful transactions on block explorer
2. Show code in GitHub to prove functionality
3. Explain testnet congestion

**If Demo Wallet Has Issues**:
1. Switch to Backup Wallet #2
2. Show pre-recorded video of working flow
3. Use screenshots

---

## 📸 Key Screenshots to Have Ready

Save these to `/public/demo/` for offline access:

1. **Landing page** with hero animation
2. **Score Builder Wizard** showing simulation
3. **Credential cards** with privacy badges
4. **Lending interface** showing dynamic limits
5. **Position card** with live interest ticker
6. **Leaderboard** showing your rank
7. **API response** JSON formatted
8. **Testnet explorer** with verified contracts
9. **Architecture diagram** (optional)
10. **Roadmap slide** (optional)

---

## ⏱️ Timing Breakdown

**Total: 4:00**

- Act 1 (Problem): 0:30
- Act 2 (Journey): 2:00
  - Score Builder: 0:45
  - Borrowing Power: 0:30
  - Live Interest: 0:20
  - Credentials: 0:15 (skip if short on time)
- Act 3 (Ecosystem): 1:00
  - API: 0:20
  - Leaderboard: 0:20
  - Testnet: 0:20
- Act 4 (Vision): 0:30

**Buffer**: 0:00 (no time to waste!)

---

## 🎭 Presentation Tips

1. **Pace**: Speak clearly but confidently. Don't rush.
2. **Cursor**: Keep mouse movements smooth, point intentionally
3. **Energy**: Enthusiasm is contagious—show you believe in this
4. **Brevity**: If running over, skip "Credentials" scene in Act 2
5. **Eye Contact**: Look at judges, not screen
6. **Backup**: If something breaks, stay calm, pivot to backup

---

## ✅ Final Pre-Demo Check (5 min before)

```
- [ ] Demo wallet connected
- [ ] All tabs open and loaded
- [ ] Browser zoom at 100%
- [ ] Notifications off
- [ ] Tabs organized left-to-right: Dashboard, API, Explorer
- [ ] Rehearsed once more (quietly)
- [ ] Deep breath, you've got this! 💪
```

---

**Good luck! You're going to crush this demo.** 🚀

