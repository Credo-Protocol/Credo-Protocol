/**
 * Lending Interface Component
 * 
 * Main lending interface with tabs for:
 * - Supply: Deposit collateral
 * - Borrow: Borrow against collateral
 * - Repay: Pay back borrowed funds
 * 
 * Also displays user's position with health factor
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PositionCard from '@/components/PositionCard';
import BorrowInterface from '@/components/BorrowInterface';
import SupplyModal from '@/components/SupplyModal';
import RepayModal from '@/components/RepayModal';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function LendingInterface({ userAddress, creditScore, provider }) {
  const [supplyModalOpen, setSupplyModalOpen] = useState(false);
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh position data when transactions complete
  const handleTransactionSuccess = () => {
    console.log('Transaction successful, refreshing position...');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Lending Pool</h2>
        <p className="text-muted-foreground mt-1">
          Supply collateral and borrow based on your credit score
        </p>
      </div>

      {/* Position Overview */}
      <PositionCard 
        userAddress={userAddress} 
        creditScore={creditScore}
        refresh={refreshKey}
        provider={provider}
      />

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
              <CardDescription>
                Deposit USDC to use as collateral for borrowing
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
                        <span>Get test USDC from the faucet (10,000 max)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">2.</span>
                        <span>Approve the lending pool to use your tokens</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">3.</span>
                        <span>Supply USDC as collateral to start borrowing</span>
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
                className="w-full h-12 text-base bg-black text-white rounded-md transition-all duration-300 hover:bg-black/80 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md" 
                onClick={() => setSupplyModalOpen(true)}
              >
                <TrendingUp className="h-5 w-5" />
                Supply USDC
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

          {/* Repay Section */}
          <Card>
            <CardHeader>
              <CardTitle>Repay Debt</CardTitle>
              <CardDescription>
                Pay back your borrowed USDC to reduce debt and improve health factor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button 
                className="w-full h-12 text-base bg-black text-white rounded-md transition-all duration-300 hover:bg-black/80 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md" 
                onClick={() => setRepayModalOpen(true)}
              >
                <TrendingUp className="h-5 w-5" />
                Repay USDC
              </button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Supply Modal */}
      <SupplyModal
        isOpen={supplyModalOpen}
        onClose={() => setSupplyModalOpen(false)}
        userAddress={userAddress}
        onSuccess={handleTransactionSuccess}
        provider={provider}
      />

      {/* Repay Modal */}
      <RepayModal
        isOpen={repayModalOpen}
        onClose={() => setRepayModalOpen(false)}
        userAddress={userAddress}
        onSuccess={handleTransactionSuccess}
        provider={provider}
      />
    </div>
  );
}

