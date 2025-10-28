# Phase 4: UI Integration

**$50 USDC Faucet - User Interface**  
**Time Required:** ~1 hour  
**Difficulty:** Medium  

---

## Goal

Build simple, clear UI components that let users claim $50 USDC by verifying employment credentials.

**What You'll Build:**
- ✅ Verification modal component
- ✅ Reward banner showing unclaimed $50 USDC
- ✅ Claimed confirmation with TX hash
- ✅ Visual feedback for verification states
- ✅ Polished user experience

---

## What This Looks Like

```
User sees: "Claim Your Free $50 USDC!"
          ↓
User clicks: "Verify & Claim $50"
          ↓
Modal opens: Employment verification required
          ↓
Verification: AIR Kit processes ZK proof
          ↓
Success! "$50 USDC sent to your wallet! 🎉"
          ↓
UI updates: Shows claimed status + TX hash
```

---

## Step 4.1: Create Verification Modal

### File Location:
```
components/VerifyCredentialModal.jsx
```

### Implementation:

Create `components/VerifyCredentialModal.jsx`:

```jsx
/**
 * $50 USDC Verification Modal
 * 
 * Verify employment credentials to claim $50 USDC
 * Zero-knowledge proof = privacy preserved
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
  Gift,
  DollarSign
} from 'lucide-react';
import { verifyCredential } from '@/lib/verificationService';

const REWARD_AMOUNT = parseFloat(process.env.NEXT_PUBLIC_REWARD_AMOUNT || '50');
const REWARD_TOKEN = process.env.NEXT_PUBLIC_REWARD_TOKEN || 'USDC';

export default function VerifyCredentialModal({ 
  isOpen, 
  onClose, 
  targetUserAddress,
  requiredCredentials = ['EMPLOYMENT'],
  userInfo,
  onVerificationComplete 
}) {
  const [verifying, setVerifying] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    try {
      setVerifying(true);
      setError(null);
      setResults([]);

      console.log('💰 Starting $50 USDC claim verification...');

      const verificationResults = [];

      // Verify each required credential
      for (const credType of requiredCredentials) {
        try {
          const result = await verifyCredential({
            targetUserAddress,
            requiredCredentialType: credType,
            userInfo
          });

          verificationResults.push({
            credentialType: credType,
            ...result
          });

        } catch (err) {
          verificationResults.push({
            credentialType: credType,
            success: false,
            verified: false,
            error: err.message
          });
        }
      }

      setResults(verificationResults);

      // Calculate verification score
      const verifiedCount = verificationResults.filter(r => r.verified).length;
      const allVerified = verifiedCount === verificationResults.length;

      if (onVerificationComplete) {
        onVerificationComplete({
          results: verificationResults,
          allVerified,
          verificationScore: (verifiedCount / verificationResults.length) * 100,
          rewardClaimed: allVerified
        });
      }

    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-500" />
            Claim $50 USDC
          </DialogTitle>
          <DialogDescription>
            Verify employment credential to claim ${REWARD_AMOUNT} {REWARD_TOKEN}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reward Highlight */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-blue-700 mb-1">Free Reward</p>
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <span className="text-4xl font-bold text-blue-600">{REWARD_AMOUNT}</span>
                <span className="text-2xl font-semibold text-blue-600">{REWARD_TOKEN}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                One-time reward for verified users!
              </p>
            </div>
          </div>

          {/* Required Credentials */}
          <div>
            <h4 className="text-sm font-medium mb-2">Requirements:</h4>
            <div className="space-y-2">
              {requiredCredentials.map((cred, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <span className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    {cred.replace(/_/g, ' ')}
                  </span>
                  {results.length > 0 && (
                    <div>
                      {results.find(r => r.credentialType === cred)?.verified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : results.find(r => r.credentialType === cred)?.simulated ? (
                        <Badge variant="outline" className="text-xs">
                          Simulated
                        </Badge>
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Verification Results */}
          {results.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Results:</h4>
              <div className="space-y-2">
                {results.map((result, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {result.credentialType.replace(/_/g, ' ')}
                      </span>
                      <Badge variant={result.verified ? 'success' : 'destructive'}>
                        {result.simulated ? 'Simulated' :
                         result.verified ? 'Verified' : 'Failed'}
                      </Badge>
                    </div>
                    {result.error && (
                      <p className="text-xs text-red-600">{result.error}</p>
                    )}
                    {result.simulated && (
                      <p className="text-xs text-blue-600">
                        Demo mode - AIR Kit verification API not available
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Overall Score */}
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification Score:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {Math.round(
                      (results.filter(r => r.verified).length / results.length) * 100
                    )}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {results.length === 0 ? (
              <Button
                onClick={handleVerify}
                disabled={verifying}
                className="flex-1"
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Start Verification
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleVerify} 
                  variant="outline" 
                  className="flex-1"
                >
                  Verify Again
                </Button>
                <Button onClick={onClose} className="flex-1">
                  Done
                </Button>
              </>
            )}
          </div>

          {/* Info Note */}
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">
                  🔐 Privacy-Preserving Verification
                </p>
                <p className="text-blue-700">
                  Zero-knowledge proof = your private data stays private. We only verify
                  you meet the requirements, without seeing your actual income or balance.
                </p>
                <p className="text-blue-700 mt-2">
                  <strong>Example:</strong> Proves "income &gt; $8,000" without revealing exact amount.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Step 4.2: Create Reward Banner Component

### Create Reward Banner:

Create `components/RewardBanner.jsx`:

```javascript
/**
 * $50 USDC Reward Banner
 * 
 * Shows unclaimed reward or claimed status
 */

import { useState, useEffect } from 'react';
import { Gift, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VerifyCredentialModal from './VerifyCredentialModal';
import { checkClaimStatus } from '@/lib/verificationService';
import { useAirKit } from '@/hooks/useAirKit';

export default function RewardBanner() {
  const [showModal, setShowModal] = useState(false);
  const [claimed, setClaimed] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const { userAddress, userInfo } = useAirKit();

  // Check claim status on mount
  useEffect(() => {
    if (userAddress) {
      checkClaimStatus(userAddress).then(status => {
        setClaimed(status.claimed);
      });
    }
  }, [userAddress]);

  // If already claimed, show success
  if (claimed === true) {
    return (
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg mb-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-semibold text-green-900 mb-1">
              ✅ Reward Claimed!
            </h4>
            <p className="text-sm text-green-700">
              You've received your $50 USDC
            </p>
            {txHash && (
              <a 
                href={`https://devnet-scan.mocachain.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-1"
              >
                View transaction <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If not claimed, show reward offer
  if (claimed === false) {
    return (
      <>
        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <Gift className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">
                🎁 Claim Your Free $50 USDC!
              </h4>
              <p className="text-sm text-blue-700 mb-2">
                Verify employment and get $50 USDC instantly
              </p>
              <p className="text-xs text-blue-600 mb-3">
                🔐 Zero-knowledge proof keeps your job details private
              </p>
              <Button
                onClick={() => setShowModal(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Gift className="mr-2 h-4 w-4" />
                Verify & Claim $50
              </Button>
            </div>
          </div>
        </div>

        <VerifyCredentialModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          targetUserAddress={userAddress}
          requiredCredentials={['EMPLOYMENT']}
          userInfo={userInfo}
          onVerificationComplete={(result) => {
            if (result.allVerified && result.results[0]?.reward) {
              setClaimed(true);
              setTxHash(result.results[0].reward.txHash);
              // Optionally show success toast
              console.log('🎉 $50 USDC claimed!', result.results[0].reward.txHash);
            }
          }}
        />
      </>
    );
  }

  // Loading state
  return null;
}
```

### Integrate into Any Page:

Add to `pages/index.js`, `pages/dashboard.js`, or `pages/lending.js`:

```javascript
// Add import
import RewardBanner from '@/components/RewardBanner';

// Add component anywhere in your page
export default function Dashboard() {
  return (
    <div className="container mx-auto p-6">
      {/* Add reward banner at top */}
      <RewardBanner />
      
      {/* Rest of your page content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your existing components */}
      </div>
    </div>
  );
}
```

---

## Step 4.3: Test Complete Flow

### Manual Testing Steps:

1. **Start Application:**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

2. **Navigate to Dashboard:**
- Open http://localhost:3000 or http://localhost:3000/dashboard
- Login with AIR Kit
- Ensure you have employment credentials issued

3. **Test $50 USDC Claim Flow:**

**Step 1: See Unclaimed Reward**
- ✅ "$50 USDC available to claim!" banner visible
- ✅ Blue/cyan gradient background
- ✅ Shows "Verify & Claim $50" button
- ✅ Privacy note displayed

**Step 2: Click Claim Button**
- Click "Verify & Claim $50"
- ✅ Modal opens
- ✅ Shows "$50 USDC" prominently
- ✅ Shows EMPLOYMENT requirement
- ✅ ZK privacy info displayed

**Step 3: Start Verification**
- Click "Start Verification"
- ✅ Button shows "Verifying..." with spinner
- ✅ Either AIR Kit widget opens OR simulation runs
- ✅ Console shows verification progress

**Step 4: Verification Completes**
- ✅ Results display in modal
- ✅ Shows "Verified" or "Simulated" badge
- ✅ Shows reward info with TX hash (simulated or real)
- ✅ Verification score shows 100%

**Step 5: Close Modal**
- Click "Done"
- ✅ Modal closes
- ✅ Banner updates to "Reward Claimed!"
- ✅ Green background
- ✅ Shows TX hash link

**Step 6: Try to Claim Again**
- Refresh page
- ✅ Banner shows "Reward Claimed!" (not claim button)
- ✅ Cannot double-claim

### Expected Console Output:

```
💰 Initiating $50 USDC claim verification
   Target: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
   Required: EMPLOYMENT
  Step 1/3: Preparing verification...
  ✅ Verification prepared
    Verifier DID: did:moca:0x123...
    Program ID: abc-123-def-456
    Reward: 50 USDC
  Step 2/3: Opening AIR Kit verification widget...
   Using simulation mode for demo
  Step 3/3: Processing verification result...
✅ Verification complete!
🎉 $50 USDC claimed! simulated_tx_hash
```

---

## Step 4.4: Add Visual Polish

### Optional Enhancements:

#### 1. Add Animation to Claimed State:

```jsx
// In RewardBanner.jsx
import { motion } from 'framer-motion';

{claimed && (
  <motion.div
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.3 }}
    className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg mb-4"
  >
    {/* ... claimed content ... */}
  </motion.div>
)}
```

#### 2. Add Confetti on Claim:

```bash
npm install canvas-confetti
```

```jsx
import confetti from 'canvas-confetti';

onVerificationComplete={(result) => {
  if (result.allVerified && result.results[0]?.reward) {
    setClaimed(true);
    setTxHash(result.results[0].reward.txHash);
    // Celebration!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}}
```

#### 3. Add Toast Notification:

```jsx
// Use shadcn toast
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

onVerificationComplete={(result) => {
  if (result.allVerified && result.results[0]?.reward) {
    setClaimed(true);
    setTxHash(result.results[0].reward.txHash);
    toast({
      title: "🎉 $50 USDC Claimed!",
      description: `${result.results[0].reward.amount} USDC has been sent to your wallet!`,
      variant: "success"
    });
  }
}}
```

---

## Phase 4 Complete! ✅

### Checklist:

Before moving to Phase 5, verify:

- [ ] `VerifyCredentialModal.jsx` created in `components/`
- [ ] Modal displays correctly:
  - [ ] $50 USDC reward prominently shown
  - [ ] EMPLOYMENT requirement listed
  - [ ] ZK privacy info displayed
  - [ ] Action buttons working
  - [ ] Results display with TX hash
- [ ] `RewardBanner.jsx` created in `components/`
- [ ] Banner integrated into a page (dashboard/index/lending)
- [ ] Reward banner shows:
  - [ ] Unclaimed state (blue banner)
  - [ ] Claimed state (green banner)
  - [ ] TX hash link (for claimed state)
- [ ] Complete flow tested:
  - [ ] Unclaimed banner shows
  - [ ] Modal opens on click
  - [ ] Verification runs
  - [ ] Results display
  - [ ] Claimed banner shows
  - [ ] Double-claiming prevented
- [ ] Visual polish added (optional)
- [ ] No console errors
- [ ] Responsive design works

### What You Built:

You've created a **beautiful, functional UI** that:
- ✅ Clearly shows value proposition (free $50 USDC!)
- ✅ Guides users through verification
- ✅ Provides real-time feedback
- ✅ Celebrates success with claimed state
- ✅ Makes complex tech (ZK proofs) feel simple
- ✅ Professional polish

### Next Steps:

**Ready for Phase 5?**

Once all checkboxes above are ✅, you're ready to finalize documentation and prepare for demo.

**Phase 5 will:**
- Update README with $50 USDC faucet feature
- Create testing guide
- Prepare demo script
- Document for buildathon submission

**Time for Phase 5:** ~30 minutes

➡️ **Continue to:** [PHASE-5-DOCUMENTATION.md](./PHASE-5-DOCUMENTATION.md)

---

**Phase 4 Complete! $50 USDC reward UI ready to impress!** 🎨💰

