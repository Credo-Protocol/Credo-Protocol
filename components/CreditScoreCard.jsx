/**
 * CreditScoreCard Component
 * Clean white/black/grey minimalist theme
 * 
 * Displays the user's credit score with visual feedback
 * including score gauge, label, and trend information.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getScoreLabel, getScoreColor } from '@/lib/contracts';
import { Award, Calendar, FileCheck, TrendingUp } from 'lucide-react';

export default function CreditScoreCard({ score = 0, credentialCount = 0, lastUpdated = 0, loading = false }) {
  const scoreLabel = getScoreLabel(score);
  const scoreColor = getScoreColor(score);
  const scorePercentage = (score / 1000) * 100;

  // Enhanced loading state with skeleton
  if (loading) {
    return (
      <Card className="glass-card glass-strong hover-expand">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black flex items-center gap-2">
            <Award className="w-5 h-5" />
            Credit Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Skeleton className="h-24 w-40 rounded-lg" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-full mt-6" />
            <div className="grid grid-cols-2 gap-6 pt-6 w-full">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-12" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card glass-strong hover-expand hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-black flex items-center gap-2">
          <Award className="w-5 h-5" />
          Credit Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Score Display */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-7xl font-bold text-black mb-2">
            {score}
          </div>
          <div className="text-sm text-black/40 mb-4 flex items-center gap-1">
            <span>/ 1000</span>
          </div>
          <Badge className="bg-black text-white">
            {scoreLabel}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-4">
          <div className="h-3 bg-black/5 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-1000 ease-out bg-black"
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
          
          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-6 pt-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white flex-shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/60 mb-1">Credentials</p>
                <p className="font-bold text-lg text-black">{credentialCount}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/60 mb-1">Last Updated</p>
                <p className="font-bold text-lg text-black">
                  {lastUpdated > 0 
                    ? new Date(lastUpdated * 1000).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {score === 0 && (
          <div className="mt-6 p-4 bg-neutral-50 rounded-xl text-center border border-black/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-black" />
              <p className="text-sm font-semibold text-black">
                Get Started
              </p>
            </div>
            <p className="text-xs text-black/60">
              Request your first credential below to start building your score
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

