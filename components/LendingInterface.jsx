/**
 * Lending Interface Component
 * 
 * Main lending interface with tabs for:
 * - Supply: Deposit collateral
 * - Borrow: Borrow against collateral
 * 
 * Displays user's position with health factor and repay functionality
 */

import { useState } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PositionCard from '@/components/PositionCard';
import BorrowInterface from '@/components/BorrowInterface';
import SupplyModal from '@/components/SupplyModal';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function LendingInterface({ userAddress, creditScore, provider, onPoolRefresh }) {
  const [supplyModalOpen, setSupplyModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh position data and pool stats when transactions complete
  const handleTransactionSuccess = () => {
    console.log('Transaction successful, refreshing position and pool...');
    setRefreshKey(prev => prev + 1);
    
    // Refresh pool liquidity stats on parent page
    if (onPoolRefresh) {
      onPoolRefresh();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Side: Position Overview - Always visible */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <PositionCard 
          userAddress={userAddress} 
          creditScore={creditScore}
          refresh={refreshKey}
          provider={provider}
        />
      </div>

      {/* Right Side: Supply/Borrow Interface */}
      <div className="space-y-6">
        {/* Main Interface with Tabs */}
        <Tabs defaultValue="supply" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supply" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Supply
            </TabsTrigger>
            <TabsTrigger value="borrow" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Borrow
            </TabsTrigger>
          </TabsList>

        {/* Supply Tab */}
        <TabsContent value="supply" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supply Collateral</CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                Deposit <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={16} height={16} className="inline" /> USDC to use as collateral for borrowing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 border rounded-lg bg-muted/50 space-y-4">
                <div className="flex items-start gap-3">
                  <Wallet className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">How Supply Works</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start">
                        <span className="mr-2">1.</span>
                        <span className="flex items-center gap-1.5 flex-wrap">Get test <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={14} height={14} className="inline" /> USDC from the faucet (10,000 <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={14} height={14} className="inline" /> USDC)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">2.</span>
                        <span>Approve the lending pool to use your tokens</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">3.</span>
                        <span className="flex items-center gap-1.5">Supply <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={14} height={14} className="inline" /> USDC as collateral to start borrowing</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">4.</span>
                        <span>Higher credit score = better collateral terms</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <button 
                className="w-full h-12 text-base bg-green-600 text-white rounded-md transition-all duration-300 hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md" 
                onClick={() => setSupplyModalOpen(true)}
              >
                <TrendingUp className="h-5 w-5" />
                <span className="flex items-center gap-1.5">Supply <Image src="/usd-coin-usdc-logo.png" alt="USDC" width={16} height={16} className="inline" /> USDC</span>
              </button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Borrow Tab */}
        <TabsContent value="borrow" className="space-y-4">
          <BorrowInterface
            key={refreshKey}
            userAddress={userAddress}
            creditScore={creditScore}
            onSuccess={handleTransactionSuccess}
            provider={provider}
          />
        </TabsContent>
        </Tabs>
      </div>
      
      {/* Supply Modal */}
      <SupplyModal
        isOpen={supplyModalOpen}
        onClose={() => setSupplyModalOpen(false)}
        userAddress={userAddress}
        onSuccess={handleTransactionSuccess}
        provider={provider}
      />
    </div>
  );
}

