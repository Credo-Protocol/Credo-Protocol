/**
 * CreditScoreCard Component
 * 
 * Displays the user's credit score with visual feedback
 * including score gauge, label, and trend information.
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getScoreLabel, getScoreColor } from '@/lib/contracts';

export default function CreditScoreCard({ score = 0, credentialCount = 0, lastUpdated = 0, loading = false }) {
  const scoreLabel = getScoreLabel(score);
  const scoreColor = getScoreColor(score);
  const scorePercentage = (score / 1000) * 100;

  // Enhanced loading state with skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <Skeleton className="h-20 w-32 rounded-lg" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-full mt-6" />
            <div className="grid grid-cols-2 gap-4 pt-4 w-full">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-8" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Score</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Score Display */}
        <div className="flex flex-col items-center justify-center py-6">
          <div className={`text-6xl font-bold ${scoreColor} mb-2`}>
            {score}
          </div>
          <div className="text-sm text-muted-foreground mb-4">/ 1000</div>
          <Badge variant={score >= 700 ? "default" : "secondary"}>
            {scoreLabel}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-out ${
                score >= 700
                  ? 'bg-green-500'
                  : score >= 500
                  ? 'bg-yellow-500'
                  : score >= 300
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
          
          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
            <div>
              <p className="text-muted-foreground">Credentials</p>
              <p className="font-semibold">{credentialCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-semibold">
                {lastUpdated > 0 
                  ? new Date(lastUpdated * 1000).toLocaleDateString()
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {score === 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Get started by requesting your first credential below
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

