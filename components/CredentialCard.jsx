/**
 * CredentialCard Component
 * 
 * Displays an individual credential type with its metadata
 * and a button to request/issue that credential.
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CredentialCard({ credential, onRequest, isLoading }) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl">{credential.name}</CardTitle>
          <Badge variant="secondary">+{credential.scoreWeight} pts</Badge>
        </div>
        <CardDescription>{credential.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="space-y-3">
          {/* Credential Type */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Type</p>
            <p className="text-sm">{credential.credentialTypeName}</p>
          </div>
          
          {/* Benefits */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Benefits</p>
            <ul className="space-y-1">
              {credential.benefits?.map((benefit, idx) => (
                <li key={idx} className="text-sm flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Issuer Info */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Issuer: <span className="font-mono">{credential.address?.slice(0, 6)}...{credential.address?.slice(-4)}</span>
            </p>
          </div>
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

