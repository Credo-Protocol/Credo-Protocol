/**
 * Landing Page - Credo Protocol
 * Professional landing page with hero, features, and CTA
 */

import Link from 'next/link';
import { ArrowRight, Shield, TrendingUp, Zap, CheckCircle, Lock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        
        <div className="container mx-auto px-4 pt-20 pb-16 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Main Headline */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                <Zap className="w-4 h-4" />
                Built on Moca Chain
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                Borrow Based on{' '}
                <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Who You Are
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Identity-backed DeFi lending with undercollateralized loans. 
                Build your on-chain credit score and unlock better terms.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 gap-2">
                  Launch App
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/faucet">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Get Test Tokens
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 max-w-3xl mx-auto">
              <StatCard
                value="50%"
                label="Min Collateral"
                description="vs 150% in traditional DeFi"
              />
              <StatCard
                value="0-1000"
                label="Credit Score"
                description="Transparent on-chain scoring"
              />
              <StatCard
                value="3 Types"
                label="Credentials"
                description="Build your reputation"
              />
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StepCard
              number="1"
              icon={<Shield className="w-6 h-6" />}
              title="Login with Moca ID"
              description="Connect via Google, Email, or Wallet. No complex setup required."
            />
            <StepCard
              number="2"
              icon={<CheckCircle className="w-6 h-6" />}
              title="Get Credentials"
              description="Request verifiable credentials from trusted issuers."
            />
            <StepCard
              number="3"
              icon={<BarChart3 className="w-6 h-6" />}
              title="Build Score"
              description="Your credit score updates on-chain based on credentials."
            />
            <StepCard
              number="4"
              icon={<TrendingUp className="w-6 h-6" />}
              title="Borrow More"
              description="Higher scores unlock lower collateral requirements."
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Key Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8 text-primary" />}
              title="Dynamic Collateral"
              description="Collateral requirements from 50-150% based on your credit score. High scores mean better terms."
              gradient="from-blue-500/10 to-cyan-500/10"
            />
            <FeatureCard
              icon={<Lock className="w-8 h-8 text-primary" />}
              title="Privacy-Preserving"
              description="Zero-Knowledge Proofs keep your data private while proving creditworthiness on-chain."
              gradient="from-purple-500/10 to-pink-500/10"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-primary" />}
              title="Verifiable Credentials"
              description="Credentials from trusted issuers are cryptographically verified and stored securely."
              gradient="from-green-500/10 to-emerald-500/10"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-primary" />}
              title="Instant Loans"
              description="Once your score is built, borrow instantly with transparent terms and no hidden fees."
              gradient="from-orange-500/10 to-yellow-500/10"
            />
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Better Than Traditional DeFi
          </h2>
          
          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
              <div className="p-8">
                <h3 className="text-xl font-bold mb-6 text-muted-foreground">Traditional DeFi</h3>
                <ul className="space-y-4">
                  <ComparisonItem negative>150% collateral required</ComparisonItem>
                  <ComparisonItem negative>Same terms for everyone</ComparisonItem>
                  <ComparisonItem negative>Capital inefficient</ComparisonItem>
                  <ComparisonItem negative>No credit history</ComparisonItem>
                </ul>
              </div>
              <div className="p-8 bg-primary/5">
                <h3 className="text-xl font-bold mb-6 text-primary">Credo Protocol</h3>
                <ul className="space-y-4">
                  <ComparisonItem>50-150% based on score</ComparisonItem>
                  <ComparisonItem>Personalized terms</ComparisonItem>
                  <ComparisonItem>Up to 3x more efficient</ComparisonItem>
                  <ComparisonItem>Build on-chain reputation</ComparisonItem>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <Card className="p-12 text-center bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Connect your wallet and start building your on-chain credit score today.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 gap-2">
                Launch App
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>Built with ❤️ for the Moca Chain Hackathon</p>
            <p className="mt-2">Transforming trust into capital, one credential at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component: Stat Card
function StatCard({ value, label, description }) {
  return (
    <div className="text-center space-y-1">
      <div className="text-3xl font-bold text-primary">{value}</div>
      <div className="font-semibold">{label}</div>
      <div className="text-sm text-muted-foreground">{description}</div>
    </div>
  );
}

// Component: Step Card
function StepCard({ number, icon, title, description }) {
  return (
    <Card className="p-6 relative overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="absolute top-4 right-4 text-6xl font-bold text-muted-foreground/5 group-hover:text-primary/10 transition-colors">
        {number}
      </div>
      <div className="relative space-y-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}

// Component: Feature Card
function FeatureCard({ icon, title, description, gradient }) {
  return (
    <Card className={`p-6 bg-gradient-to-br ${gradient} hover:shadow-lg transition-shadow`}>
      <div className="space-y-3">
        <div className="w-12 h-12 rounded-lg bg-background/50 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-xl">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}

// Component: Comparison Item
function ComparisonItem({ children, negative = false }) {
  return (
    <li className="flex items-start gap-2">
      {negative ? (
        <span className="text-muted-foreground mt-0.5">✗</span>
      ) : (
        <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
      )}
      <span className={negative ? 'text-muted-foreground' : ''}>{children}</span>
    </li>
  );
}
