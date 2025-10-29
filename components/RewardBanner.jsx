/**
 * $50 USDC Reward Banner
 * 
 * Shows unclaimed reward or claimed status.
 * Automatically checks claim status on mount.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkClaimStatus } from '@/lib/verificationService';
import { useAirKit } from '@/hooks/useAirKit';

const REWARD_AMOUNT = parseFloat(process.env.NEXT_PUBLIC_REWARD_AMOUNT || '50');
const REWARD_TOKEN = process.env.NEXT_PUBLIC_REWARD_TOKEN || 'USDC';

export default function RewardBanner() {
  const router = useRouter();
  const [claimed, setClaimed] = useState(null);
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

  // If already claimed, don't show the banner
  if (claimed === true) {
    return null;
  }

  // If not claimed, show reward offer
  if (claimed === false) {
    return (
      <div className="inline-flex items-center gap-3 px-4 py-3 bg-white border-2 border-black/5 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
          <Gift className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col gap-2 items-center">
          <h4 className="font-bold text-black text-sm whitespace-nowrap">
            First time free ${REWARD_AMOUNT} {REWARD_TOKEN}!
          </h4>
          <Button
            onClick={() => router.push('/rewards')}
            size="sm"
            className="bg-black hover:bg-black/80 hover:scale-105 text-white h-8 px-8 text-xs transition-all duration-200 hover:shadow-lg"
          >
            Claim Now
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

