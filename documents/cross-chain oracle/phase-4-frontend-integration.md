# Phase 4: Frontend Integration

**Duration:** ~2 hours  
**Difficulty:** Intermediate  
**Prerequisites:** Phase 1-3 completed (or in progress)

---

## Overview

**Goal:** Build a user-friendly interface that allows users to relay their credit scores to other blockchains.

**What You'll Build:**
- Cross-chain service module
- Interactive bridge component
- Score status tracking across chains
- Error handling and loading states

**Why This Matters:**
This is the user-facing layer that makes cross-chain functionality accessible. Users can see their scores across all chains and trigger relays with a single click.

---

## Step 4.1: Create Cross-Chain Service

Create `lib/crossChainService.js`:

```javascript
/**
 * Cross-Chain Service
 * Handles credit score relay to other blockchains via Moca Identity Oracle
 */

import { ethers } from 'ethers';

// Contract addresses (from Phase 2 deployments)
const RECEIVER_CONTRACTS = {
  sepolia: process.env.NEXT_PUBLIC_SEPOLIA_RECEIVER || '',
  baseSepolia: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RECEIVER || '',
};

// RPC endpoints for reading scores
const RPC_URLS = {
  sepolia: process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo',
  baseSepolia: 'https://sepolia.base.org',
};

// Supported chain IDs
const CHAIN_IDS = {
  sepolia: 11155111,
  baseSepolia: 84532,
};

/**
 * Request cross-chain relay of credit score
 * 
 * @param {string} targetChain - Target chain name ('sepolia' or 'baseSepolia')
 * @param {Object} signer - Ethers signer (from AIR Kit)
 * @param {string} oracleAddress - CreditScoreOracle contract address on Moca Chain
 * @returns {Promise<Object>} Relay result with transaction details
 */
export async function relayCreditScore(targetChain, signer, oracleAddress) {
  try {
    console.log(`🌉 Initiating cross-chain relay to ${targetChain}...`);

    // Validate chain
    const chainId = CHAIN_IDS[targetChain];
    if (!chainId) {
      throw new Error(`Unsupported chain: ${targetChain}`);
    }

    // Contract ABI for relay function
    const oracleABI = [
      'function requestCrossChainRelay(uint256 targetChainId) external',
      'event CrossChainScoreUpdate(address indexed user, uint256 score, uint256 timestamp, uint256 targetChainId, bytes32 indexed messageId)'
    ];
    
    const oracle = new ethers.Contract(oracleAddress, oracleABI, signer);

    // Send relay request transaction
    console.log('  Sending transaction...');
    const tx = await oracle.requestCrossChainRelay(chainId);
    console.log('  Transaction hash:', tx.hash);

    // Wait for confirmation
    console.log('  Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('  ✅ Transaction confirmed in block:', receipt.blockNumber);

    // Extract event data
    const event = receipt.logs
      .map(log => {
        try {
          return oracle.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e?.name === 'CrossChainScoreUpdate');

    if (!event) {
      throw new Error('CrossChainScoreUpdate event not found in transaction');
    }

    const { user, score, timestamp, messageId } = event.args;

    console.log('✅ Cross-chain relay initiated successfully');
    console.log('   User:', user);
    console.log('   Score:', score.toString());
    console.log('   Message ID:', messageId);
    console.log('   Target:', targetChain);
    console.log('\n⏳ Oracle will relay within ~2 minutes');

    return {
      success: true,
      txHash: tx.hash,
      messageId,
      user,
      score: Number(score),
      timestamp: Number(timestamp),
      targetChain,
      targetChainId: chainId
    };

  } catch (error) {
    console.error('❌ Cross-chain relay failed:', error);
    throw error;
  }
}

/**
 * Check if credit score exists on target chain
 * 
 * @param {string} userAddress - User's wallet address
 * @param {string} targetChain - Target chain name
 * @returns {Promise<Object>} Credit score info from target chain
 */
export async function getCreditScoreOnChain(userAddress, targetChain) {
  try {
    const contractAddress = RECEIVER_CONTRACTS[targetChain];
    const rpcUrl = RPC_URLS[targetChain];

    if (!contractAddress || !rpcUrl) {
      throw new Error(`Chain not configured: ${targetChain}`);
    }

    // Connect to target chain
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const contractABI = [
      'function getCreditScore(address user) external view returns (uint256 score, uint256 lastUpdated, bool verified)'
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    // Read credit score
    const [score, lastUpdated, verified] = await contract.getCreditScore(userAddress);

    return {
      chain: targetChain,
      score: Number(score),
      lastUpdated: Number(lastUpdated),
      verified,
      hasScore: verified && Number(score) > 0
    };

  } catch (error) {
    console.error(`Failed to get score on ${targetChain}:`, error);
    return {
      chain: targetChain,
      score: 0,
      verified: false,
      hasScore: false,
      error: error.message
    };
  }
}

/**
 * Get credit scores on all supported chains
 * 
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<Array>} Array of credit score info for each chain
 */
export async function getAllChainScores(userAddress) {
  const chains = Object.keys(CHAIN_IDS);
  
  const results = await Promise.all(
    chains.map(chain => getCreditScoreOnChain(userAddress, chain))
  );

  return results;
}

export default {
  relayCreditScore,
  getCreditScoreOnChain,
  getAllChainScores
};
```

---

## Step 4.2: Update Environment Variables

Add to `.env.local`:

```bash
# Cross-Chain Receiver Contracts (from Phase 2 deployments)
NEXT_PUBLIC_SEPOLIA_RECEIVER=0x...  # Your Sepolia contract address
NEXT_PUBLIC_BASE_SEPOLIA_RECEIVER=0x...  # Your Base Sepolia contract address

# RPC Endpoints (optional - defaults provided)
NEXT_PUBLIC_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Credit Oracle Address (from Phase 1)
NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS=0x...  # Your Moca Chain oracle address
```

---

## Step 4.3: Create Cross-Chain Bridge Component

Create `components/CrossChainBridge.jsx`:

```jsx
/**
 * Cross-Chain Bridge Component
 * Allows users to relay their credit scores to other blockchains
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  ExternalLink 
} from 'lucide-react';
import { 
  relayCreditScore, 
  getAllChainScores 
} from '@/lib/crossChainService';
import { useAirKit } from '@/hooks/useAirKit';

// Supported destination chains
const CHAINS = [
  {
    id: 'sepolia',
    name: 'Ethereum Sepolia',
    icon: '⟠',
    color: 'blue',
    explorer: 'https://sepolia.etherscan.io'
  },
  {
    id: 'baseSepolia',
    name: 'Base Sepolia',
    icon: '🔵',
    color: 'indigo',
    explorer: 'https://sepolia.basescan.org'
  }
];

export default function CrossChainBridge({ userAddress, currentScore }) {
  const [chainScores, setChainScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relaying, setRelaying] = useState(null);
  const [error, setError] = useState(null);
  const [recentRelay, setRecentRelay] = useState(null);
  const { signer } = useAirKit();

  // Load scores from all chains on mount
  useEffect(() => {
    if (userAddress) {
      loadChainScores();
    }
  }, [userAddress]);

  // Load credit scores from all supported chains
  const loadChainScores = async () => {
    try {
      setLoading(true);
      setError(null);
      const scores = await getAllChainScores(userAddress);
      setChainScores(scores);
    } catch (err) {
      console.error('Failed to load chain scores:', err);
      setError('Failed to load chain scores');
    } finally {
      setLoading(false);
    }
  };

  // Handle relay request
  const handleRelay = async (chainId) => {
    try {
      setRelaying(chainId);
      setError(null);

      const result = await relayCreditScore(
        chainId,
        signer,
        process.env.NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS
      );

      setRecentRelay(result);

      // Refresh chain scores after a delay (oracle needs time to relay)
      setTimeout(() => {
        loadChainScores();
        setRelaying(null);
      }, 5000);

    } catch (err) {
      console.error('Relay failed:', err);
      setError(err.message || 'Relay failed. Please try again.');
      setRelaying(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold mb-1">
            Cross-Chain Credit Score
          </h3>
          <p className="text-sm text-gray-600">
            Relay your Moca credit score to other blockchains for broader DeFi access
          </p>
        </div>

        {/* Current Score on Moca */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Moca Chain Score</p>
              <p className="text-3xl font-bold text-blue-600">{currentScore}</p>
            </div>
            <div className="text-4xl">⛓️</div>
          </div>
        </div>

        {/* Recent Relay Success Message */}
        {recentRelay && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 mb-1">
                  Relay Initiated Successfully!
                </p>
                <p className="text-xs text-green-700 mb-2">
                  Message ID: {recentRelay.messageId.slice(0, 20)}...
                </p>
                <p className="text-xs text-green-600">
                  ⏳ Oracle will process within 2 minutes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Target Chains */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Available on:</p>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            CHAINS.map((chain) => {
              const chainScore = chainScores.find(s => s.chain === chain.id);
              const hasScore = chainScore?.hasScore;
              const isRelaying = relaying === chain.id;

              return (
                <div
                  key={chain.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  {/* Chain Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{chain.icon}</div>
                    <div className="flex-1">
                      <p className="font-medium">{chain.name}</p>
                      {hasScore ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="success" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Score: {chainScore.score}
                          </Badge>
                          {chainScore.lastUpdated > 0 && (
                            <span className="text-xs text-gray-500">
                              {new Date(chainScore.lastUpdated * 1000).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">
                          Not relayed yet
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center gap-2">
                    {hasScore && (
                      <a
                        href={`${chain.explorer}/address/${userAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <Button
                      onClick={() => handleRelay(chain.id)}
                      disabled={isRelaying || !signer}
                      variant={hasScore ? 'outline' : 'default'}
                      size="sm"
                    >
                      {isRelaying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Relaying...
                        </>
                      ) : hasScore ? (
                        <>
                          Update
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Relay Score
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Box - How it works */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-2">
              <p className="font-medium">How it works:</p>
              <ul className="space-y-1 text-xs">
                <li>• Click "Relay Score" to emit event on Moca Chain</li>
                <li>• Moca Identity Oracle picks up your event</li>
                <li>• Validators sign with BLS signatures (&gt;2/3 consensus)</li>
                <li>• Oracle submits to target chain (~2 minutes)</li>
                <li>• Your score is now usable on that chain!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

## Step 4.4: Integrate into Score Page

Update `pages/score.js`:

```javascript
// Add import at top
import CrossChainBridge from '@/components/CrossChainBridge';

// Inside your component, after credit score display section
// Add this where you want the bridge to appear (usually after score card)

{creditScore > 0 && (
  <div className="mt-6">
    <CrossChainBridge
      userAddress={userAddress}
      currentScore={creditScore}
    />
  </div>
)}
```

**Example Integration:**

```javascript
export default function ScorePage() {
  const [creditScore, setCreditScore] = useState(0);
  const [userAddress, setUserAddress] = useState('');
  const { address, isConnected } = useAirKit();

  useEffect(() => {
    if (address) {
      setUserAddress(address);
      // Load credit score...
    }
  }, [address]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Credit Score</h1>
      
      {/* Existing credit score display */}
      <CreditScoreCard score={creditScore} />
      
      {/* NEW: Cross-Chain Bridge Component */}
      {creditScore > 0 && isConnected && (
        <div className="mt-8">
          <CrossChainBridge
            userAddress={userAddress}
            currentScore={creditScore}
          />
        </div>
      )}
    </div>
  );
}
```

---

## Step 4.5: Test Full Flow

### Start Development Server

```bash
npm run dev
```

### Testing Steps

**1. Login & Navigate:**
- Open http://localhost:3000
- Login with AIR Kit
- Navigate to Score page

**2. Verify Display:**
- Should see "Cross-Chain Credit Score" section
- Current Moca score displayed
- List of target chains (Sepolia, Base)
- Each chain shows "Not relayed yet" initially

**3. Test Relay:**
- Click "Relay Score" for Sepolia
- Wallet prompt appears
- Approve transaction
- Loading state shows "Relaying..."
- Success message appears with message ID

**4. Wait for Oracle (~2 min):**
- Refresh page after 2-3 minutes
- Should see green "Score: XXX" badge
- External link icon appears
- Click to view on block explorer

**5. Test Update:**
- Click "Update" button (for already-relayed chain)
- Should emit new event
- Score updates after oracle processes

**6. Test Multiple Chains:**
- Relay to Base Sepolia
- Verify both chains show scores
- Confirm scores match Moca Chain

---

## Verification Checklist

- [ ] Cross-chain service created and working
- [ ] Environment variables configured
- [ ] Bridge component renders correctly
- [ ] Integrated into score page
- [ ] Login/wallet connection works
- [ ] Relay button triggers transaction
- [ ] Loading states display properly
- [ ] Success messages appear
- [ ] Error handling works
- [ ] Chain scores load correctly
- [ ] External links work
- [ ] Manual testing completed successfully

---

## Troubleshooting

### "Environment variables not found"
- Check `.env.local` exists in project root
- Restart dev server after adding variables
- Verify variable names start with `NEXT_PUBLIC_`

### "Signer is undefined"
- User not logged in with AIR Kit
- Check `useAirKit` hook is imported
- Verify wallet connection

### "Transaction fails"
- User has no credit score (score = 0)
- Insufficient MOCA for gas
- Unsupported chain ID
- Contract address incorrect

### "Chain scores don't load"
- Check RPC endpoints are working
- Verify receiver contract addresses
- Check network connectivity
- Look for CORS issues

### "Oracle doesn't relay"
- Wait longer (up to 5 minutes)
- Verify registration with Moca team (Phase 3)
- Check event was emitted on Moca Chain
- Contact Moca support

---

## UI/UX Enhancements (Optional)

### Add Loading Skeleton

```jsx
{loading && (
  <div className="space-y-3">
    {[1, 2].map(i => (
      <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-lg" />
    ))}
  </div>
)}
```

### Add Refresh Button

```jsx
<Button
  onClick={loadChainScores}
  variant="ghost"
  size="sm"
>
  <RefreshCw className="h-4 w-4 mr-2" />
  Refresh
</Button>
```

### Add Relay History

```jsx
const [relayHistory, setRelayHistory] = useState([]);

// After successful relay
setRelayHistory(prev => [...prev, result]);

// Display
<div className="mt-4">
  <p className="text-sm font-medium mb-2">Recent Relays</p>
  {relayHistory.map((relay, i) => (
    <div key={i} className="text-xs text-gray-600">
      {relay.targetChain}: {relay.txHash.slice(0, 10)}...
    </div>
  ))}
</div>
```

---

## Performance Optimization

### Memoize Chain Data

```jsx
import { useMemo } from 'react';

const chainConfig = useMemo(() => CHAINS, []);
```

### Debounce Refresh

```jsx
import { useCallback } from 'react';
import debounce from 'lodash/debounce';

const debouncedRefresh = useCallback(
  debounce(loadChainScores, 1000),
  []
);
```

---

## Next Steps

Once all checklist items complete:

1. **Polish UI/UX** with animations and better states
2. **Add analytics** to track relay usage
3. **Test edge cases** thoroughly
4. **Proceed to Phase 5** - Testing & Documentation

---

**Phase 4 Complete!** 🎉

Users can now relay their credit scores to other chains through a beautiful, intuitive interface. The bridge component handles all complexity behind the scenes.

**Next:** [Phase 5 - Testing & Documentation](./phase-5-testing-documentation.md)

