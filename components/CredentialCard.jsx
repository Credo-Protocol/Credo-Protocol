/**
 * CredentialCard Component - Phase 2 Upgrade
 * 
 * Displays credential types with support for:
 * - Basic credentials (existing)
 * - Advanced bucketed credentials with privacy badges (Phase 2)
 * - Privacy-preserving metadata display
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Sparkles, TrendingUp } from 'lucide-react';

export default function CredentialCard({ credential, onRequest, isLoading }) {
  // Check if this is a new Phase 2 credential (from /types endpoint)
  const isPhase2Format = credential.category !== undefined;
  
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-1">
            <CardTitle className="text-xl">
              {isPhase2Format ? credential.name : credential.name}
            </CardTitle>
            {credential.new && (
              <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            )}
          </div>
          <Badge variant="secondary" className="ml-2">
            {isPhase2Format ? credential.weight : `+${credential.scoreWeight} pts`}
          </Badge>
        </div>
        
        {/* Category Badge for Phase 2 */}
        {credential.badge && (
          <Badge 
            className={`w-fit mb-2 ${
              credential.badge === 'Privacy-First' 
                ? 'bg-green-500 text-white' 
                : 'bg-purple-500 text-white'
            }`}
          >
            {credential.badge}
          </Badge>
        )}
        
        <CardDescription>{credential.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-3">
        {/* Privacy Note (Phase 2 Advanced Credentials) */}
        {credential.privacyPreserving && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2 text-xs text-green-700">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Privacy-Preserving</p>
                <p>
                  {credential.badge === 'Privacy-First' 
                    ? 'Only bucket range revealed, not exact amount'
                    : 'Only income range disclosed, not exact salary'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* How It Helps (Phase 2) */}
        {credential.privacyPreserving && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2 text-xs text-blue-700">
              <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">How It Helps</p>
                <p>
                  {credential.id === 'income-range' 
                    ? 'Highest weight credential - can boost score by up to 180 points'
                    : 'Higher balance buckets unlock significantly better borrowing terms'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Legacy Benefits Display */}
        {credential.benefits && credential.benefits.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Benefits</p>
            <ul className="space-y-1">
              {credential.benefits.map((benefit, idx) => (
                <li key={idx} className="text-sm flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Issuer Info */}
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            {isPhase2Format ? (
              <>Issuer: {credential.issuer}</>
            ) : (
              <>
                Issuer: <span className="font-mono">{credential.address?.slice(0, 6)}...{credential.address?.slice(-4)}</span>
              </>
            )}
          </p>
          {credential.category && (
            <p className="text-xs text-muted-foreground mt-1">
              Category: <span className="font-medium">{credential.category}</span>
            </p>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => onRequest(credential)}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Request Credential'}
        </Button>
      </CardFooter>
    </Card>
  );
}
