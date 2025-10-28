# Cross-dApp Integration Demo Implementation

**Credo Protocol - Buildathon Wave 3**  
**Implementation Time:** ~2 hours  
**Difficulty:** Easy-Medium  
**Based on:** Your Existing Public API + Official Moca Docs

---

## Overview

**What We're Building:**
A separate mini-dApp that demonstrates how OTHER applications can integrate Credo credit scores into their own products.

**Why This Matters:**
- Shows your protocol is composable infrastructure (not just standalone)
- Perfect buildathon "wow" moment
- Proves ecosystem value
- Easy to implement, high impact

**What You'll Create:**
```
┌─────────────────────────────────────────┐
│     Example Integration: DAO Gating     │
│                                         │
│  "Exclusive DAO for 800+ Credit Scores" │
│                                         │
│  [Connect Wallet]                       │
│                                         │
│  ✓ Checking your Credo score...         │
│  ✓ Score: 862                           │
│  ✓ Requirement: 800+                    │
│                                         │
│  [Access Granted - Enter DAO →]         │
└─────────────────────────────────────────┘
```

**Live Demo URL:** `https://credo-protocol.vercel.app/demo/dao-gate`

---

## Prerequisites

Before starting:
- [x] Public API endpoint working (`/api/score/:address`)
- [x] CORS enabled (you already have this)
- [ ] Basic understanding of Next.js pages
- [ ] 2 hours of focused time

---

## Phase 1: Create Demo Page Route (20 mins)

**Goal:** Set up new page route for the demo

---

### Step 1.1: Create Demo Directory Structure

```bash
mkdir -p pages/demo
mkdir -p components/demo
```

---

### Step 1.2: Create DAO Gate Demo Page

Create `pages/demo/dao-gate.js`:

```javascript
/**
 * DAO Gating Demo
 * 
 * Demonstrates how external dApps can use Credo credit scores
 * for access control, membership, or other features
 */

import { useState } from 'react';
import Head from 'next/head';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ExternalLink,
  Code,
  Users,
  Award
} from 'lucide-react';
import { useAirKit } from '@/hooks/useAirKit';

export default function DAOGateDemo() {
  const [checking, setChecking] = useState(false);
  const [score, setScore] = useState(null);
  const [eligible, setEligible] = useState(null);
  const [error, setError] = useState(null);
  const [showCode, setShowCode] = useState(false);
  
  const { userAddress, connect, isConnected } = useAirKit();

  // Demo configuration
  const REQUIRED_SCORE = 800;
  const DAO_NAME = "Exclusive Builder's DAO";
  const DAO_BENEFITS = [
    "Access to private Discord",
    "Exclusive investment opportunities",
    "Voting rights on proposals",
    "Priority support",
  ];

  const checkEligibility = async () => {
    try {
      setChecking(true);
      setError(null);
      setScore(null);
      setEligible(null);

      console.log('🔍 Checking eligibility for:', userAddress);

      // Call Credo API (this is the integration!)
      const response = await fetch(
        `/api/score/${userAddress}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch credit score');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get score');
      }

      console.log('✅ Score received:', data.score);

      // Check eligibility
      const userScore = data.score;
      const isEligible = userScore >= REQUIRED_SCORE;

      setScore(userScore);
      setEligible(isEligible);

    } catch (err) {
      console.error('❌ Error checking eligibility:', err);
      setError(err.message || 'Failed to check eligibility');
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Head>
        <title>DAO Membership Gate - Credo Integration Demo</title>
        <meta name="description" content="Demo of using Credo credit scores for DAO membership" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold">{DAO_NAME}</h1>
                  <p className="text-sm text-gray-600">Powered by Credo Protocol</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                <Code className="h-3 w-3 mr-1" />
                Integration Demo
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Left Column - DAO Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Exclusive Membership</h2>
                <p className="text-gray-600">
                  Join our elite community of builders. Membership is limited to users 
                  with verified credit scores above {REQUIRED_SCORE}.
                </p>
              </div>

              {/* Requirements */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Requirements
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Credo Credit Score: {REQUIRED_SCORE}+</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Web3 Wallet Connected</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Active Moca Network Account</span>
                  </div>
                </div>
              </Card>

              {/* Benefits */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Member Benefits
                </h3>
                <ul className="space-y-2">
                  {DAO_BENEFITS.map((benefit, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Right Column - Access Check */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Check Eligibility</h3>

                {!isConnected ? (
                  /* Not Connected */
                  <div className="text-center py-8">
                    <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Connect your wallet to check eligibility
                    </p>
                    <Button onClick={connect} className="w-full">
                      Connect Wallet
                    </Button>
                  </div>
                ) : checking ? (
                  /* Checking */
                  <div className="text-center py-8">
                    <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600 mb-2">Checking your Credo score...</p>
                    <p className="text-sm text-gray-500">
                      Querying API: /api/score/{userAddress?.slice(0, 8)}...
                    </p>
                  </div>
                ) : score !== null ? (
                  /* Result */
                  <div className="space-y-6">
                    {/* Score Display */}
                    <div className={`p-6 rounded-lg border-2 ${
                      eligible 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium">Your Credo Score</span>
                        {eligible ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                      <div className="text-center mb-4">
                        <div className="text-5xl font-bold mb-2">{score}</div>
                        <div className="text-sm text-gray-600">
                          Required: {REQUIRED_SCORE}+
                        </div>
                      </div>
                      <div className={`text-center py-3 px-4 rounded ${
                        eligible 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <p className="font-semibold">
                          {eligible ? '✓ Access Granted' : '✗ Access Denied'}
                        </p>
                        <p className="text-sm mt-1">
                          {eligible 
                            ? 'Welcome to the DAO!' 
                            : `You need ${REQUIRED_SCORE - score} more points`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {eligible ? (
                        <Button className="w-full" size="lg">
                          <Users className="mr-2 h-5 w-5" />
                          Enter DAO
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={() => window.open('https://credo-protocol.vercel.app', '_blank')}
                        >
                          Build Your Score
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={checkEligibility}
                      >
                        Re-check Score
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Ready to Check */
                  <div className="text-center py-8">
                    <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Ready to check your eligibility?
                    </p>
                    <Button onClick={checkEligibility} className="w-full" size="lg">
                      <Shield className="mr-2 h-5 w-5" />
                      Check My Score
                    </Button>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={checkEligibility}
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </Card>

              {/* Integration Info */}
              <Card className="p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">How This Works</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCode(!showCode)}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-xs text-gray-600 mb-3">
                  This demo uses Credo's public API to check credit scores. 
                  Any dApp can integrate this way.
                </p>

                {showCode && (
                  <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`// Integration Code
const response = await fetch(
  '/api/score/' + userAddress
);
const data = await response.json();

if (data.score >= 800) {
  grantAccess(); // ✓
} else {
  denyAccess(); // ✗
}`}
                  </pre>
                )}

                <a
                  href="https://github.com/yourusername/Credo-Protocol#-composable-credit-infrastructure"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-3 block"
                >
                  View Integration Docs →
                </a>
              </Card>
            </div>
          </div>

          {/* Bottom CTA */}
          <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 mt-12">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">
                Want to integrate Credo into your dApp?
              </h3>
              <p className="text-gray-600 mb-6">
                Use our public API to gate features, adjust pricing, or enable 
                credit-based functionality in your protocol.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button size="lg" onClick={() => window.open('https://credo-protocol.vercel.app', '_blank')}>
                  View Main App
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.open('/api/score/0x32F91E4E2c60A9C16cAE736D3b42152B331c147F', '_blank')}>
                  Test API
                  <Code className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </>
  );
}
```

---

### ✅ Phase 1 Complete - Checklist

- [ ] Demo directory created
- [ ] DAO gate page implemented
- [ ] Page accessible at `/demo/dao-gate`
- [ ] Basic layout renders

---

## Phase 2: Add More Integration Examples (1 hour)

**Goal:** Create 2-3 more demo examples showing different use cases

---

### Step 2.1: Create NFT Minting Demo

Create `pages/demo/nft-mint.js`:

```javascript
/**
 * NFT Minting Demo
 * Tiered minting based on credit score
 */

import { useState } from 'react';
import Head from 'next/head';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { useAirKit } from '@/hooks/useAirKit';

export default function NFTMintDemo() {
  const [score, setScore] = useState(null);
  const [tier, setTier] = useState(null);
  const [checking, setChecking] = useState(false);
  const { userAddress, connect, isConnected } = useAirKit();

  const TIERS = [
    {
      name: 'Bronze',
      minScore: 0,
      maxScore: 599,
      price: '0.1 ETH',
      supply: 'Unlimited',
      color: 'from-orange-400 to-orange-600',
      benefits: ['Standard artwork', 'Community access']
    },
    {
      name: 'Silver',
      minScore: 600,
      maxScore: 799,
      price: '0.05 ETH',
      supply: '1000',
      color: 'from-gray-300 to-gray-500',
      benefits: ['Enhanced artwork', 'Priority support', '50% discount']
    },
    {
      name: 'Gold',
      minScore: 800,
      maxScore: 899,
      price: '0.02 ETH',
      supply: '500',
      color: 'from-yellow-400 to-yellow-600',
      benefits: ['Rare artwork', 'VIP access', '80% discount', 'Future airdrops']
    },
    {
      name: 'Diamond',
      minScore: 900,
      maxScore: 1000,
      price: 'FREE',
      supply: '100',
      color: 'from-blue-400 to-purple-600',
      benefits: ['Legendary 1/1', 'Founder access', 'Free mint', 'Revenue share']
    }
  ];

  const checkEligibility = async () => {
    try {
      setChecking(true);
      const response = await fetch(`/api/score/${userAddress}`);
      const data = await response.json();
      
      if (data.success) {
        setScore(data.score);
        const userTier = TIERS.find(t => 
          data.score >= t.minScore && data.score <= t.maxScore
        );
        setTier(userTier);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Head>
        <title>Credit-Gated NFT Mint - Credo Demo</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Credit-Gated NFT Collection</h1>
            <p className="text-gray-600 text-lg">
              Your credit score determines your tier and pricing
            </p>
          </div>

          {/* Tiers Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {TIERS.map((t, idx) => (
              <Card 
                key={idx}
                className={`p-6 ${
                  tier?.name === t.name ? 'ring-4 ring-blue-500' : ''
                }`}
              >
                <div className={`h-32 rounded-lg bg-gradient-to-br ${t.color} mb-4 flex items-center justify-center`}>
                  <Image className="h-16 w-16 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-2">{t.name}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Score: {t.minScore}-{t.maxScore}
                </p>
                <div className="mb-4">
                  <div className="text-2xl font-bold mb-1">{t.price}</div>
                  <div className="text-xs text-gray-500">Supply: {t.supply}</div>
                </div>
                <ul className="text-xs space-y-1">
                  {t.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          {/* Mint Section */}
          <Card className="p-8 max-w-2xl mx-auto">
            {!isConnected ? (
              <div className="text-center">
                <Button onClick={connect} size="lg" className="w-full">
                  Connect Wallet to Check Tier
                </Button>
              </div>
            ) : !score ? (
              <div className="text-center">
                <Button 
                  onClick={checkEligibility} 
                  size="lg" 
                  className="w-full"
                  disabled={checking}
                >
                  {checking ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Checking Score...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Check My Tier
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <Badge className="mb-4" variant="outline">Your Tier</Badge>
                  <h2 className="text-3xl font-bold mb-2">{tier.name}</h2>
                  <p className="text-gray-600 mb-4">Credit Score: {score}</p>
                  <div className={`inline-block px-8 py-4 rounded-lg bg-gradient-to-br ${tier.color} text-white mb-6`}>
                    <div className="text-4xl font-bold">{tier.price}</div>
                  </div>
                </div>
                <Button size="lg" className="w-full">
                  Mint {tier.name} NFT
                </Button>
                <p className="text-xs text-center text-gray-500">
                  Pricing determined by Credo credit score
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
```

---

### Step 2.2: Create Lending Rate Demo

Create `pages/demo/lending-rate.js`:

```javascript
/**
 * Dynamic Lending Rates Demo
 * Show how credit score affects borrowing rates
 */

import { useState } from 'react';
import Head from 'head';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, Percent, Loader2 } from 'lucide-react';
import { useAirKit } from '@/hooks/useAirKit';

export default function LendingRateDemo() {
  const [score, setScore] = useState(null);
  const [loanAmount, setLoanAmount] = useState([10000]);
  const [checking, setChecking] = useState(false);
  const { userAddress, connect, isConnected } = useAirKit();

  // Calculate APR based on score
  const getAPR = (creditScore) => {
    if (creditScore >= 900) return 5;
    if (creditScore >= 800) return 7;
    if (creditScore >= 700) return 10;
    if (creditScore >= 600) return 13;
    if (creditScore >= 500) return 15;
    return 18;
  };

  // Calculate collateral ratio
  const getCollateralRatio = (creditScore) => {
    if (creditScore >= 900) return 50;
    if (creditScore >= 800) return 60;
    if (creditScore >= 700) return 75;
    if (creditScore >= 600) return 90;
    if (creditScore >= 500) return 100;
    if (creditScore >= 400) return 110;
    if (creditScore >= 300) return 125;
    return 150;
  };

  const checkScore = async () => {
    try {
      setChecking(true);
      const response = await fetch(`/api/score/${userAddress}`);
      const data = await response.json();
      if (data.success) setScore(data.score);
    } finally {
      setChecking(false);
    }
  };

  const apr = score ? getAPR(score) : 18;
  const collateralRatio = score ? getCollateralRatio(score) : 150;
  const collateralNeeded = (loanAmount[0] * collateralRatio) / 100;
  const monthlyPayment = (loanAmount[0] * (1 + apr / 100 / 12)).toFixed(2);

  return (
    <>
      <Head>
        <title>Credit-Based Lending Rates - Credo Demo</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Dynamic Lending Rates</h1>
            <p className="text-gray-600 text-lg">
              See how your credit score affects loan terms
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Score Check */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Your Credit Score</h3>
              {!isConnected ? (
                <Button onClick={connect} className="w-full">
                  Connect Wallet
                </Button>
              ) : !score ? (
                <Button onClick={checkScore} className="w-full" disabled={checking}>
                  {checking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check My Score'
                  )}
                </Button>
              ) : (
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">{score}</div>
                  <p className="text-sm text-gray-600">
                    {score >= 800 ? 'Excellent' :
                     score >= 700 ? 'Good' :
                     score >= 600 ? 'Fair' : 'Poor'}
                  </p>
                </div>
              )}
            </Card>

            {/* Right: Loan Calculator */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Loan Amount</h3>
              <div className="mb-6">
                <div className="text-3xl font-bold mb-4">
                  ${loanAmount[0].toLocaleString()}
                </div>
                <Slider
                  value={loanAmount}
                  onValueChange={setLoanAmount}
                  min={1000}
                  max={100000}
                  step={1000}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">APR</span>
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    <span className="text-2xl font-bold">{apr}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Collateral Required</span>
                  <span className="text-lg font-semibold">
                    ${collateralNeeded.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Payment</span>
                  <span className="text-lg font-semibold">
                    ${monthlyPayment}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Comparison Table */}
          {score && (
            <Card className="p-6 mt-8">
              <h3 className="font-semibold mb-4">vs Traditional DeFi</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Credo (You)</div>
                  <div className="text-2xl font-bold text-green-600">{apr}% APR</div>
                  <div className="text-sm text-gray-500">{collateralRatio}% collateral</div>
                </div>
                <div className="flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Aave/Compound</div>
                  <div className="text-2xl font-bold text-gray-400">~12% APR</div>
                  <div className="text-sm text-gray-500">150% collateral</div>
                </div>
              </div>
              {collateralRatio < 150 && (
                <p className="text-center text-sm text-green-600 mt-4 font-semibold">
                  You save {150 - collateralRatio}% on collateral requirements!
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
```

---

### Step 2.3: Create Demo Index Page

Create `pages/demo/index.js`:

```javascript
/**
 * Demo Index
 * Landing page showing all integration demos
 */

import Head from 'next/head';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Image, Percent, ArrowRight } from 'lucide-react';

export default function DemoIndex() {
  const DEMOS = [
    {
      title: 'DAO Membership Gating',
      description: 'Exclusive access control based on credit scores',
      icon: Shield,
      color: 'from-blue-500 to-blue-600',
      path: '/demo/dao-gate',
      useCase: 'Community platforms, exclusive clubs, governance'
    },
    {
      title: 'Tiered NFT Minting',
      description: 'Dynamic pricing and perks based on reputation',
      icon: Image,
      color: 'from-purple-500 to-purple-600',
      path: '/demo/nft-mint',
      useCase: 'NFT projects, loyalty programs, gaming'
    },
    {
      title: 'Dynamic Lending Rates',
      description: 'Credit-based interest rates and collateral',
      icon: Percent,
      color: 'from-green-500 to-green-600',
      path: '/demo/lending-rate',
      useCase: 'DeFi protocols, lending platforms'
    },
  ];

  return (
    <>
      <Head>
        <title>Integration Demos - Credo Protocol</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-5xl font-bold mb-4">
              Credo Integration Demos
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              See how other dApps can integrate Credo credit scores to enable 
              new features and improve user experience
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline">← Back to Main App</Button>
              </Link>
              <Link href="/api/score/0x32F91E4E2c60A9C16cAE736D3b42152B331c147F" target="_blank">
                <Button variant="outline">View API Docs</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Demos Grid */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {DEMOS.map((demo, idx) => {
              const Icon = demo.icon;
              return (
                <Link key={idx} href={demo.path}>
                  <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className={`h-16 w-16 rounded-lg bg-gradient-to-br ${demo.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{demo.title}</h3>
                    <p className="text-gray-600 mb-4">{demo.description}</p>
                    <div className="text-xs text-gray-500 mb-4">
                      <strong>Use Case:</strong> {demo.useCase}
                    </div>
                    <Button variant="outline" className="w-full">
                      Try Demo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Integration Info */}
          <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Want to Integrate?
            </h2>
            <div className="max-w-2xl mx-auto">
              <p className="text-gray-700 mb-6 text-center">
                All these demos use Credo's public API. Integration takes less than 10 minutes.
              </p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm mb-6 overflow-x-auto">
{`// Integration Code
const response = await fetch(
  'https://credo-protocol.vercel.app/api/score/' + address
);
const { score, tier } = await response.json();

// Use score for your logic
if (score >= 800) {
  enablePremiumFeatures();
}`}
              </pre>
              <div className="flex gap-4 justify-center">
                <Link href="https://github.com/yourusername/Credo-Protocol" target="_blank">
                  <Button>View Documentation</Button>
                </Link>
                <Link href="https://credo-protocol.vercel.app">
                  <Button variant="outline">Build Your Score</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
```

---

### ✅ Phase 2 Complete - Checklist

- [ ] DAO gating demo complete
- [ ] NFT minting demo complete
- [ ] Lending rate demo complete
- [ ] Demo index page created
- [ ] All demos accessible

---

## Phase 3: Testing & Polish (30 mins)

**Goal:** Ensure all demos work perfectly

---

### Step 3.1: Test Each Demo

**Testing Checklist:**

**DAO Gate (`/demo/dao-gate`):**
- [ ] Page loads without errors
- [ ] Connect wallet button works
- [ ] API call succeeds
- [ ] Score displays correctly
- [ ] Eligible/ineligible logic correct
- [ ] Code snippet toggle works
- [ ] External links work

**NFT Mint (`/demo/nft-mint`):**
- [ ] Tiers display correctly
- [ ] Score check works
- [ ] Correct tier highlighted
- [ ] Pricing shows based on score
- [ ] Responsive on mobile

**Lending Rate (`/demo/lending-rate`):**
- [ ] Slider works smoothly
- [ ] APR calculates correctly
- [ ] Collateral ratio accurate
- [ ] Comparison vs Aave shows
- [ ] Math is correct

**Index (`/demo/index`):**
- [ ] All demos listed
- [ ] Links work
- [ ] Code snippet displays
- [ ] Responsive layout

---

### Step 3.2: Add to Main Navigation

Update `components/layout/AppNav.jsx`:

```javascript
// Add to navigation links
const navLinks = [
  // ... existing links
  {
    name: 'Integration Demos',
    href: '/demo',
    icon: Code, // Import from lucide-react
    badge: 'New'
  }
];
```

---

### Step 3.3: Update README

Add to `README.md`:

```markdown
## 🔌 Integration Demos

See how other dApps can use Credo scores:

- **[DAO Membership Gating](/demo/dao-gate)** - Exclusive access control
- **[Tiered NFT Minting](/demo/nft-mint)** - Dynamic pricing by score
- **[Dynamic Lending Rates](/demo/lending-rate)** - Credit-based APR

**Live Demos:** https://credo-protocol.vercel.app/demo

### Integration API

```javascript
// Get any user's credit score
const response = await fetch(
  'https://credo-protocol.vercel.app/api/score/' + address
);
const { score, tier, borrowingPower } = await response.json();
```

See [Integration Guide](INTEGRATION-GUIDE.md) for details.
```

---

### ✅ Phase 3 Complete - Checklist

- [ ] All demos tested manually
- [ ] Navigation updated
- [ ] README updated
- [ ] Mobile responsive verified
- [ ] API calls working

---

## Final Deliverables

### What You Built:
1. ✅ DAO membership gating demo
2. ✅ NFT tiered minting demo
3. ✅ Dynamic lending rates demo
4. ✅ Demo index page
5. ✅ Integration documentation

### Why This Matters:
- Shows ecosystem value (not just standalone app)
- Perfect buildathon showcase
- Easy for judges to understand
- Demonstrates composability

---

## Buildathon Presentation Tips

**How to Demo:**

1. **Show Problem (5 seconds):**
   "Other protocols need credit infrastructure but don't want to build it."

2. **Show Solution (10 seconds):**
   "Any dApp can integrate Credo scores in 10 minutes using our API."

3. **Live Demo (30 seconds):**
   - Open `/demo/dao-gate`
   - Click "Check My Score"
   - Show 862 score
   - Show "Access Granted"
   - Point to code snippet

4. **Impact (5 seconds):**
   "We're infrastructure for Web3 credit, not just a lending protocol."

---

## Testing Commands

```bash
# Start dev server
npm run dev

# Test each demo
open http://localhost:3000/demo/dao-gate
open http://localhost:3000/demo/nft-mint
open http://localhost:3000/demo/lending-rate
open http://localhost:3000/demo

# Test API
curl http://localhost:3000/api/score/YOUR_ADDRESS
```

---

## Success Metrics

**You'll know it works when:**
- ✅ All 3 demos load without errors
- ✅ Wallet connection works
- ✅ API calls succeed
- ✅ Scores display correctly
- ✅ Logic is accurate
- ✅ Mobile responsive
- ✅ No console errors

---

## Next Steps

**After Implementation:**
1. Record demo video showing all 3 examples
2. Add to buildathon submission
3. Share on Twitter/Discord
4. Get feedback from community

**For Production:**
1. Add more demo examples (voting, insurance, etc.)
2. Create embeddable widgets
3. Build integration SDK
4. Add analytics tracking

---

## Congratulations! 🎉

You've built a compelling demonstration of Credo as composable infrastructure!

**What Judges Will See:**
- Not just a protocol, but an ecosystem primitive
- Easy integration (< 10 lines of code)
- Multiple use cases (DAO, NFT, DeFi)
- Professional execution

**Perfect for buildathon submission!** 🏆

