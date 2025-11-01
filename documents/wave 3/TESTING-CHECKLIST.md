# Wave 3 - Pre-Submission Testing Checklist

**Complete ALL items before submitting to buildathon**

Last Updated: Oct 27, 2025

---

## 🎯 Critical Path (MUST PASS)

### Smart Contracts

#### Oracle v2
- [ ] Contract compiles without errors or warnings
- [ ] All issuer registry functions work (register, update, deactivate)
- [ ] All credential type registry functions work
- [ ] 8 tiers initialized correctly
- [ ] `getTierForScore()` returns correct tier for any score (0, 500, 700, 900, 1000)
- [ ] `computeCreditScore()` emits `ScoreComputed` event with all components
- [ ] `ScoreComponentAdded` event emits for each credential
- [ ] ReentrancyGuard applied and tested
- [ ] `MAX_CREDENTIALS_PER_USER` enforced (try submitting 21 credentials)
- [ ] Gas usage <500k for score computation with 10 credentials
- [ ] All 10 credential types registered (4 bank + 4 income + 2 legacy)
- [ ] Deployed to Moca testnet successfully
- [ ] Contract verified on block explorer
- [ ] Transactions visible on testnet explorer

#### LendingPool v2
- [ ] Contract compiles without errors
- [ ] Interest accrues correctly (test with time manipulation)
- [ ] `getBorrowBalanceWithInterest()` returns accurate values
- [ ] `getAccruedInterest()` calculates interest only (not principal)
- [ ] Borrow function updates user borrow index
- [ ] Repay function includes accrued interest
- [ ] Health factor includes interest in calculation
- [ ] Can't borrow beyond limit based on credit score
- [ ] Can't repay more than total owed
- [ ] Deployed to testnet successfully
- [ ] Contract verified on block explorer

#### MockUSDC
- [ ] Faucet function works (public minting)
- [ ] Transfer and approve work correctly
- [ ] Deployed to testnet successfully
- [ ] Contract verified on block explorer

### Backend Services

#### Credential Issuers
- [ ] Server starts without errors (`npm run dev` in backend/)
- [ ] `/credentials/types` returns all 10 credential types
- [ ] `/credentials/request/bank-balance` issues valid credentials
- [ ] `/credentials/request/income-range` issues valid credentials
- [ ] `/credentials/request/cex` works (legacy endpoint)
- [ ] `/credentials/request/employment` works (legacy endpoint)
- [ ] Bucket logic correctly categorizes amounts (test with different values)
- [ ] EIP-191 signatures validate on-chain
- [ ] Metadata includes privacy notes
- [ ] CORS configured for frontend domain
- [ ] Deployed to production (Render/Railway/etc)
- [ ] Production URL accessible: `https://your-backend.onrender.com`

### Frontend Application

#### Authentication & Basic UI
- [ ] App loads without console errors
- [ ] Login with Moca ID works (Google)
- [ ] Login with Moca ID works (Email)
- [ ] Login with Moca ID works (Wallet)
- [ ] Dashboard displays after login
- [ ] Mobile layout responsive (test on phone or DevTools)
- [ ] All navigation tabs work
- [ ] Loading states display correctly (skeletons, no flickering)
- [ ] Error messages user-friendly (test by disconnecting wallet)
- [ ] **Pool Statistics** display on lending page
  - [ ] Total liquidity shows correctly
  - [ ] Available to borrow calculates correctly
  - [ ] Total borrowed displays
  - [ ] Utilization rate percentage and bar display
  - [ ] Moca Chain badge appears above pool card
  - [ ] Updates after transactions (supply/borrow/repay/withdraw)

#### Credit Score Display
- [ ] Base score (500) displays for new users
- [ ] Score updates after credential submission
- [ ] Tier badge displays with correct color
- [ ] Collateral factor shows correctly (e.g., "60%")
- [ ] APR displays based on tier
- [ ] **Credentials Page** credit score bar displays
  - [ ] Shows loading state initially (not 0)
  - [ ] Score number displays prominently above bar
  - [ ] Progress bar fills correctly (score/10)
  - [ ] Color coding matches tier (red/yellow/green)
  - [ ] 0-100 labels on bar ends

#### Score Builder Wizard (NEW)
- [ ] Tab "Score Builder" appears in navigation
- [ ] Current score displays accurately
- [ ] Simulated score updates when credentials selected
- [ ] "Points to next tier" calculates correctly
- [ ] Progress bar shows correct percentage
- [ ] Credential cards show all 4 types
- [ ] New credentials have "New" badges
- [ ] Privacy notes visible with shield icon
- [ ] "How It Helps" tooltips display
- [ ] Already-submitted credentials disabled/grayed out
- [ ] Selected credentials highlight visually
- [ ] Request button works for multiple credentials
- [ ] Clear selection button works
- [ ] Tier comparison shows collateral and APR differences

#### Credential Marketplace
- [ ] All 4 credential types display
- [ ] Privacy badges show on advanced credentials (Income, Bank Balance)
- [ ] Request button works for each credential type
- [ ] Loading state during request
- [ ] Success message after credential issued
- [ ] Credentials show in "Submitted Credentials" list
- [ ] Submit to blockchain button works
- [ ] Transaction confirmation received
- [ ] Score updates after blockchain submission

#### Lending Interface
- [ ] Supply USDC modal opens
- [ ] Can supply USDC (test with 100 USDC)
- [ ] Supplied balance displays correctly
- [ ] Borrow limit calculates based on credit score
- [ ] Borrow modal opens
- [ ] Can't borrow more than limit
- [ ] Borrow transaction succeeds
- [ ] Borrowed balance displays
- [ ] Repay modal opens (from position card)
- [ ] Repay includes accrued interest in total
- [ ] Can repay partial amount
- [ ] Can repay full amount
- [ ] Balances update after repay
- [ ] Withdraw modal opens (from position card)
- [ ] Withdraw button disabled when no balance
- [ ] Max button fills correct safe amount
- [ ] Can't withdraw more than supplied
- [ ] Can't withdraw amount that would make position unhealthy
- [ ] Withdraw transaction succeeds
- [ ] Balance updates after withdraw

#### My Positions
- [ ] Position card displays for users with supplied or borrowed amounts
- [ ] **Earnings Overview** section displays when user has supplied
  - [ ] Shows supplied amount correctly
  - [ ] Supply APY badge displays
  - [ ] Earned interest updates every 5 seconds
  - [ ] Total balance = supplied + interest
  - [ ] Withdraw button appears and works
- [ ] **Debt Overview** section displays when user has borrowed
  - [ ] Shows borrowed principal amount
  - [ ] Shows accrued interest (updates every 5 seconds)
  - [ ] Shows total owed (principal + interest)
  - [ ] Borrow APR badge displays correct tier-based rate
  - [ ] Repay button appears and works
- [ ] **Net Interest** summary displays at bottom
  - [ ] Shows earnings - debt correctly
  - [ ] Color coded (green for positive, red for negative)
- [ ] Both sections display even when one is zero (consistent layout)
- [ ] Health factor displays and includes interest
- [ ] Interest ticker animates/updates live for both supply and borrow
- [ ] Credit score, collateral factor, and interest rate display in card header

#### Leaderboard (NEW)
- [ ] Leaderboard section appears on dashboard
- [ ] Shows at least 3 users (seed test data if needed)
- [ ] Displays rank icons (trophy, medal, award for top 3)
- [ ] Shows score and tier for each user
- [ ] Shows credential count
- [ ] Shows diversity bonus if applicable
- [ ] Refresh button works
- [ ] Auto-refreshes every 30 seconds
- [ ] Handles empty state gracefully (if no users)
- [ ] Handles loading state

#### Faucet Page
- [ ] Faucet page loads (`/faucet`)
- [ ] Mint button works
- [ ] USDC balance increases after minting
- [ ] Success message displays
- [ ] Error handling if already minted recently

### API Integration (NEW)

#### Score API Endpoint
- [ ] `/api/score/:address` returns valid JSON
- [ ] Returns 200 for valid address with credentials
- [ ] Returns 404 for valid address without credentials
- [ ] Returns 400 for invalid address format
- [ ] Response includes `creditScore`, `tier`, `borrowingPower`
- [ ] Response includes `composability` section with use cases
- [ ] Response includes links to dashboard, explorer, docs
- [ ] CORS headers allow cross-origin requests
- [ ] Tested from external domain (curl from terminal)
- [ ] Response time <2 seconds
- [ ] Cache headers set appropriately

---

## 🔬 Edge Cases & Error Handling

### Smart Contracts
- [ ] Can't register issuer with trust score >100
- [ ] Can't register issuer with empty name
- [ ] Can't update issuer that doesn't exist
- [ ] Can't deactivate inactive issuer
- [ ] Credentials from inactive issuer rejected
- [ ] Can't compute score with >20 credentials
- [ ] Borrow with 0 collateral rejected
- [ ] Borrow exceeding limit rejected
- [ ] Repay amount exceeding debt rejected
- [ ] Division by zero handled in health factor calculation
- [ ] **Withdraw** with 0 balance rejected
- [ ] **Withdraw** amount exceeding supplied rejected
- [ ] **Withdraw** that would cause liquidation rejected/prevented by UI

### Backend
- [ ] Invalid address format returns 400 error
- [ ] Missing `userAddress` parameter returns 400 error
- [ ] Malformed requests return appropriate error codes
- [ ] CORS preflight requests handled (OPTIONS method)
- [ ] Server doesn't crash on invalid input
- [ ] Logs errors but doesn't expose sensitive info to client

### Frontend
- [ ] Wallet disconnection handled gracefully
- [ ] Network switch handled (e.g., user on wrong chain)
- [ ] Transaction rejection handled (user clicks "Reject")
- [ ] Insufficient gas handled
- [ ] Insufficient balance handled
- [ ] Failed API requests show error message
- [ ] Loading states prevent double-submission
- [ ] Can't submit same credential twice
- [ ] Invalid form inputs prevented
- [ ] **Supply interest** displays $0.00 when no supply (not error)
- [ ] **Borrow interest** displays $0.00 when no debt (not error)
- [ ] **Credit limit** shows loading skeleton until data loaded (no premature value)
- [ ] **Pool stats** load in parallel with position (no double-fetch)
- [ ] **Withdraw modal** calculates max safe amount correctly
- [ ] **Withdraw modal** warns when withdrawal would be unsafe

---

## 🌐 Cross-Browser & Device Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if on Mac)
- [ ] Edge (latest)

### Mobile Devices
- [ ] iOS Safari (test with DevTools or real device)
- [ ] Android Chrome
- [ ] Responsive design works at 375px width (iPhone SE)
- [ ] Responsive design works at 768px width (tablet)
- [ ] Responsive design works at 1440px width (desktop)
- [ ] Touch targets large enough on mobile (44x44px minimum)
- [ ] No horizontal scrolling
- [ ] Modals fit on mobile screens

### Accessibility
- [ ] Can navigate with keyboard (Tab key)
- [ ] Focus indicators visible
- [ ] Buttons have aria-labels if icons only
- [ ] Color contrast sufficient (test with tool)
- [ ] Screen reader friendly (test with VoiceOver/NVDA if possible)

---

## ⚡ Performance Testing

### Load Times
- [ ] Initial page load <3 seconds (test with throttled network)
- [ ] Dashboard loads <2 seconds after login
- [ ] API responses <2 seconds
- [ ] Images optimized (not oversized)
- [ ] No unnecessary re-renders (check React DevTools)

### Transaction Times
- [ ] Testnet transactions confirm <30 seconds (average)
- [ ] UI shows pending state during transaction
- [ ] UI updates after confirmation

### Memory & CPU
- [ ] No memory leaks (leave app open for 5 minutes, check DevTools)
- [ ] No excessive CPU usage
- [ ] Intervals cleared on component unmount
- [ ] Event listeners removed properly

---

## 📄 Documentation Verification

### README.md
- [ ] Wave 3 section added at top
- [ ] All contract addresses updated to testnet
- [ ] Live app URL works: https://credo-protocol.vercel.app
- [ ] Backend API URL works
- [ ] Demo video link works (if uploaded)
- [ ] GitHub repo link correct
- [ ] All explorer links point to testnet
- [ ] Screenshots show Wave 3 features
- [ ] Installation instructions accurate
- [ ] No typos or grammatical errors

### Phase Documents
- [ ] OVERVIEW.md links to all 5 phases
- [ ] PHASE1-ORACLE.md complete and accurate
- [ ] PHASE2-CREDENTIALS.md complete and accurate
- [ ] PHASE3-LENDING-UX.md complete and accurate
- [ ] PHASE4-DEPLOYMENT.md complete and accurate
- [ ] PHASE5-DOCS-DEMO.md complete and accurate
- [ ] All phase docs link to next phase
- [ ] No broken internal links

### Supporting Documents
- [ ] DEMO-SCRIPT.md exists and rehearsed
- [ ] INTEGRATION-GUIDE.md complete with code examples
- [ ] TESTING-CHECKLIST.md (this file) complete
- [ ] All code examples in docs are syntactically correct
- [ ] All curl examples work when tested

### Environment Files
- [ ] `.env.example` in root exists and documented
- [ ] `.env.example` in backend exists and documented
- [ ] `.env.example` in contracts exists and documented
- [ ] No actual secrets in `.env.example` files
- [ ] Instructions for obtaining API keys included

---

## 🎬 Demo Preparation

### Demo Wallet
- [ ] Demo wallet has testnet MOCA for gas
- [ ] Demo wallet has 10,000+ USDC
- [ ] Demo wallet has submitted all 4 credentials
- [ ] Demo wallet credit score is 850-900+
- [ ] Demo wallet has active borrow position
- [ ] Interest has been accruing for at least 1 hour
- [ ] Demo wallet appears in leaderboard top 3
- [ ] Backup wallet ready (in case primary fails)

### Demo Environment
- [ ] All tabs pre-opened (Dashboard, API, Explorer)
- [ ] Browser zoom at 100%
- [ ] Notifications disabled
- [ ] Demo script printed or accessible
- [ ] Screenshots saved as backup
- [ ] Video recording made as backup
- [ ] Laptop fully charged
- [ ] Internet connection stable (test speed)
- [ ] Backup hotspot available

### Demo Flow
- [ ] Rehearsed at least once
- [ ] Timed (should be 3-4 minutes)
- [ ] No stumbling over words
- [ ] Transitions smooth
- [ ] Q&A talking points memorized
- [ ] Confident in explaining technical details

---

## 🚀 Deployment Verification

### Smart Contracts
- [ ] All 3 contracts deployed to Moca testnet
- [ ] Deployment addresses saved in `deployed-addresses-testnet.json`
- [ ] Deployment info committed to GitHub
- [ ] All contracts verified on block explorer
- [ ] Can view source code on explorer
- [ ] All registry initialization transactions visible

### Frontend (Vercel)
- [ ] Deployed to production (not preview)
- [ ] Environment variables set in Vercel dashboard
- [ ] Custom domain configured (if applicable)
- [ ] Build completed without errors
- [ ] No console warnings about environment variables
- [ ] Analytics configured (optional)
- [ ] Site accessible from different networks/locations

### Backend (Render/Railway)
- [ ] Deployed to production
- [ ] Environment variables set
- [ ] Health check endpoint responds
- [ ] Logs show server starting successfully
- [ ] No crash loops
- [ ] Service auto-restarts on failure
- [ ] Custom domain configured (if applicable)

---

## 🔐 Security Checks

### Smart Contracts
- [ ] Owner-only functions protected with `onlyOwner` modifier
- [ ] ReentrancyGuard on all state-changing functions
- [ ] No unbounded loops that could DoS
- [ ] Integer overflow/underflow prevented (Solidity 0.8+)
- [ ] No hard-coded private keys
- [ ] Access control on sensitive functions

### Backend
- [ ] Private keys stored in environment variables (not code)
- [ ] CORS configured (not wide open with `*` in production)
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Rate limiting considered (even if not implemented)
- [ ] Dependencies up to date (no critical vulnerabilities)

### Frontend
- [ ] No private keys in code
- [ ] API keys (if any) restricted by domain
- [ ] Environment variables not exposed to client-side if sensitive
- [ ] XSS prevention (React handles by default, but double-check)
- [ ] No `eval()` or `dangerouslySetInnerHTML` without sanitization

---

## 📊 Analytics & Monitoring

### Optional but Recommended
- [ ] Google Analytics or similar (track usage)
- [ ] Error tracking (Sentry, LogRocket) configured
- [ ] Backend logging (errors, requests)
- [ ] Smart contract events indexed (even if just manually)
- [ ] Transaction success/failure rates monitored

---

## ✅ Final Pre-Submission Check

### One Last End-to-End Test
- [ ] **As a NEW user (incognito/different wallet)**:
  1. [ ] Visit live app
  2. [ ] Login with Moca ID
  3. [ ] See base score 500
  4. [ ] Navigate to Score Builder
  5. [ ] Select 2 credentials (Income + Bank Balance)
  6. [ ] See simulated score jump
  7. [ ] Request credentials
  8. [ ] Submit to blockchain
  9. [ ] Wait for confirmation
  10. [ ] Score updates to 700+
  11. [ ] Navigate to Lending Pool
  12. [ ] Supply 1,000 USDC
  13. [ ] Borrow 500 USDC
  14. [ ] Navigate to My Positions
  15. [ ] See interest accruing
  16. [ ] Check leaderboard → Appear in list
  17. [ ] Open `/api/score/YOUR_ADDRESS` → See JSON response

### Submission Package Ready
- [ ] Live app URL: `https://credo-protocol.vercel.app`
- [ ] GitHub repo: `https://github.com/[USERNAME]/Credo-Protocol`
- [ ] Backend API: `https://your-backend.onrender.com`
- [ ] Demo video: `https://youtube.com/watch?v=...` (if applicable)
- [ ] All URLs work when pasted in incognito browser
- [ ] README has comprehensive Wave 3 section
- [ ] Documentation folder complete
- [ ] No TODO comments in production code
- [ ] No console.log in production (or at least minimal)
- [ ] License file exists (MIT recommended)

---

## 🎉 Celebration Checklist

After you submit:

- [ ] Tweet about your submission
- [ ] Share on Discord/Telegram
- [ ] Thank your supporters
- [ ] Take a well-deserved break
- [ ] Be proud—you built something amazing!

---

**If you can check ALL boxes above, you're ready to submit!** 🚀

**Don't have time to complete everything?** Focus on:
1. Smart contracts working on testnet ✅
2. Full user journey working (login → score builder → borrow) ✅
3. Documentation updated ✅
4. Demo prepared ✅

The rest is polish. Ship it! 🎊

