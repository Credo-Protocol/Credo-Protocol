/**
 * Landing Page - Redirects to Dashboard
 * In a production app, this would be a proper landing page with features, etc.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Credo Protocol</h1>
        <p className="text-muted-foreground">Identity-Backed DeFi Lending</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
