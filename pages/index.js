/**
 * Landing Page - Credo Protocol
 * Premium landing page with animated components and consistent purple/pink gradient theme
 */

import Link from 'next/link';
import { ArrowRight, Shield, TrendingUp, Zap, CheckCircle, Lock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AnimatedGradientText from '@/components/ui/animated-gradient-text';
import { Particles } from '@/components/ui/particles';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section with Particles */}
      <div className="relative overflow-hidden">
        {/* Animated Particles Background */}
        <Particles
          className="absolute inset-0"
          quantity={100}
          ease={80}
          color="#9c40ff"
          refresh={false}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-black pointer-events-none" />
        
        <div className="container mx-auto px-4 pt-20 pb-24 relative">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Animated Badge */}
            <div className="flex justify-center">
              <AnimatedGradientText>
                <Zap className="w-4 h-4 mr-2" />
                Built on Moca Chain
              </AnimatedGradientText>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Borrow Based on{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-gradient">
                Who You Are
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
              Identity-backed DeFi lending with undercollateralized loans. 
              Build your on-chain credit score and unlock better terms.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="text-lg px-8 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0"
                >
                  Launch App
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/faucet">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 border-purple-500/50 text-purple-300 hover:bg-purple-950/50"
                >
                  Get Test Tokens
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 max-w-4xl mx-auto">
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
      <div className="container mx-auto px-4 py-24 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
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
      <div className="container mx-auto px-4 py-24 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Key Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Dynamic Collateral"
              description="Collateral requirements from 50-150% based on your credit score. High scores mean better terms."
            />
            <FeatureCard
              icon={<Lock className="w-8 h-8" />}
              title="Privacy-Preserving"
              description="Zero-Knowledge Proofs keep your data private while proving creditworthiness on-chain."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Verifiable Credentials"
              description="Credentials from trusted issuers are cryptographically verified and stored securely."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Instant Loans"
              description="Once your score is built, borrow instantly with transparent terms and no hidden fees."
            />
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Better Than Traditional DeFi
          </h2>
          
          <div className="relative rounded-3xl overflow-hidden border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-pink-950/20">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-purple-500/20">
              <div className="p-10">
                <h3 className="text-2xl font-bold mb-8 text-gray-400">Traditional DeFi</h3>
                <ul className="space-y-5">
                  <ComparisonItem negative>150% collateral required</ComparisonItem>
                  <ComparisonItem negative>Same terms for everyone</ComparisonItem>
                  <ComparisonItem negative>Capital inefficient</ComparisonItem>
                  <ComparisonItem negative>No credit history</ComparisonItem>
                </ul>
              </div>
              <div className="p-10 bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                <h3 className="text-2xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Credo Protocol
                </h3>
                <ul className="space-y-5">
                  <ComparisonItem>50-150% based on score</ComparisonItem>
                  <ComparisonItem>Personalized terms</ComparisonItem>
                  <ComparisonItem>Up to 3x more efficient</ComparisonItem>
                  <ComparisonItem>Build on-chain reputation</ComparisonItem>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24 relative">
        <div className="max-w-4xl mx-auto relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl" />
          
          <div className="relative rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-pink-950/40 p-16 text-center backdrop-blur-sm">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Connect your wallet and start building your on-chain credit score today.
            </p>
            <Link href="/dashboard">
              <Button 
                size="lg" 
                className="text-xl px-12 py-6 gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg shadow-purple-500/50"
              >
                Launch App
                <ArrowRight className="w-6 h-6" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-gray-500">
            <p className="text-lg">Built with ❤️ for the Moca Chain Hackathon</p>
            <p className="mt-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Transforming trust into capital, one credential at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component: Stat Card with gradient accent
function StatCard({ value, label, description }) {
  return (
    <div className="text-center space-y-2 p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-pink-950/20 backdrop-blur-sm hover:border-purple-500/40 transition-colors">
      <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="font-semibold text-white text-lg">{label}</div>
      <div className="text-sm text-gray-400">{description}</div>
    </div>
  );
}

// Component: Step Card with consistent purple theme
function StepCard({ number, icon, title, description }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative p-8 rounded-2xl border border-purple-500/20 bg-black/40 backdrop-blur-sm hover:border-purple-500/40 transition-all">
        <div className="absolute top-6 right-6 text-7xl font-bold text-purple-500/5 group-hover:text-purple-500/10 transition-colors">
          {number}
        </div>
        <div className="relative space-y-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white">
            {icon}
          </div>
          <h3 className="font-semibold text-xl text-white">{title}</h3>
          <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Component: Feature Card with purple gradient borders
function FeatureCard({ icon, title, description }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
      <div className="relative p-8 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 to-pink-950/30 backdrop-blur-sm hover:border-purple-500/50 transition-all">
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white">
            {icon}
          </div>
          <h3 className="font-semibold text-2xl text-white">{title}</h3>
          <p className="text-gray-400 leading-relaxed text-lg">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Component: Comparison Item with purple accents
function ComparisonItem({ children, negative = false }) {
  return (
    <li className="flex items-start gap-3 text-lg">
      {negative ? (
        <span className="text-gray-500 mt-1 text-xl">✗</span>
      ) : (
        <CheckCircle className="w-6 h-6 text-purple-400 mt-0.5 flex-shrink-0" />
      )}
      <span className={negative ? 'text-gray-500' : 'text-white'}>{children}</span>
    </li>
  );
}
