/**
 * $50 USDC Reward Banner
 * 
 * Shows unclaimed reward or claimed status.
 * Automatically checks claim status on mount.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Gift, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkClaimStatus } from '@/lib/verificationService';
import { useAirKit } from '@/hooks/useAirKit';

const REWARD_AMOUNT = parseFloat(process.env.NEXT_PUBLIC_REWARD_AMOUNT || '50');
const REWARD_TOKEN = process.env.NEXT_PUBLIC_REWARD_TOKEN || 'USDC';

export default function RewardBanner() {
  const router = useRouter();
  const [claimed, setClaimed] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const { userAddress, isConnected } = useAirKit();

  // Check claim status on mount
  useEffect(() => {
    if (userAddress && isConnected) {
      checkClaimStatus(userAddress)
        .then(status => {
          setClaimed(status.claimed);
        })
        .catch(err => {
          console.error('Failed to check claim status:', err);
          setClaimed(false); // Default to unclaimed on error
        });
    }
  }, [userAddress, isConnected]);

  // Don't show banner if not connected
  if (!isConnected || !userAddress) {
    return null;
  }

  // Loading state
  if (claimed === null) {
    return null;
  }

  // If already claimed, show success
  if (claimed === true) {
    return (
      <div className="inline-flex items-center gap-3 px-4 py-2 bg-white border-2 border-green-500/20 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="h-4 w-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-black text-sm whitespace-nowrap">
            ✅ Reward Claimed!
          </h4>
          <p className="text-xs text-black/60 whitespace-nowrap">
            ${REWARD_AMOUNT} {REWARD_TOKEN} received
          </p>
          {txHash && (
            <a 
              href={`https://devnet-scan.mocachain.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-black/50 hover:text-black hover:underline flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              View TX <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // If not claimed, show reward offer
  if (claimed === false) {
    return (
      <div className="inline-flex items-center gap-3 px-4 py-3 bg-white border-2 border-black/5 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
          <Gift className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="font-bold text-black text-sm whitespace-nowrap">
            Claim Your Free ${REWARD_AMOUNT} {REWARD_TOKEN}!
          </h4>
          <Button
            onClick={() => router.push('/rewards')}
            size="sm"
            className="bg-black hover:bg-black/80 hover:scale-105 text-white h-8 px-3 text-xs w-fit transition-all duration-200 hover:shadow-lg"
          >
            Verify & Claim ${REWARD_AMOUNT}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

