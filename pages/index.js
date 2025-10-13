/**
 * Landing Page - Credo Protocol
 * Clean white/black/grey minimalist theme
 */

import Link from 'next/link';
import { ArrowRight, Shield, TrendingUp, CheckCircle, Lock, BarChart3, Sparkles, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HyperText } from '@/components/ui/hyper-text';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { RetroGrid } from '@/components/ui/retro-grid';
import { MagicCard } from '@/components/ui/magic-card';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Marquee } from '@/components/ui/marquee';
import { BorderBeam } from '@/components/ui/border-beam';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Retro Grid Background */}
        <RetroGrid className="opacity-50" />
        
        <div className="container mx-auto px-4 py-32 relative z-10">
          <div className="max-w-6xl mx-auto text-center space-y-12">
            {/* Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 bg-white/50 backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Built on Moca Chain</span>
              </div>
            </div>
            
            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
                Borrow Based on
              </h1>
              <div className="flex justify-center">
                <HyperText
                  text="Who You Are"
                  className="text-5xl md:text-7xl lg:text-8xl font-bold"
                  duration={1000}
                />
              </div>
            </div>
            
            {/* Shiny Subheading */}
            <AnimatedShinyText className="text-lg md:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed">
              Identity-backed DeFi lending with undercollateralized loans. 
              Build your on-chain credit score and unlock better terms.
            </AnimatedShinyText>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 items-center">
              <Link href="/dashboard">
                <button className="group relative text-lg px-10 py-3 bg-black text-white rounded-full flex items-center gap-2 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  {/* Animated gradient border on hover */}
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-black via-neutral-700 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-x" />
                  <span className="absolute inset-[2px] rounded-full bg-black" />
                  <span className="relative z-10 flex items-center gap-2">
                    Launch App
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              </Link>
              <Link href="/faucet">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-10 h-12 border-2 border-black/20 hover:bg-black/5 hover:border-black/30 rounded-full text-black bg-white transition-all hover:scale-105"
                >
                  Get Test Tokens
                </Button>
              </Link>
            </div>

            {/* Stats with Number Ticker */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 max-w-5xl mx-auto">
              <StatCard
                value={50}
                suffix="%"
                label="Min Collateral"
                description="vs 150% in traditional DeFi"
              />
              <StatCard
                value={1000}
                label="Max Credit Score"
                description="Transparent on-chain scoring"
              />
              <StatCard
                value={3}
                label="Credential Types"
                description="Build your reputation"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof / Marquee */}
      <div className="py-16 border-y border-black/10">
        <p className="text-center text-sm text-black/50 mb-8 uppercase tracking-wide">Trusted Credential Issuers</p>
        <Marquee pauseOnHover className="[--duration:30s]">
          <MarqueeItem text="Banks" />
          <MarqueeItem text="Employers" />
          <MarqueeItem text="Exchanges" />
          <MarqueeItem text="DeFi Protocols" />
          <MarqueeItem text="Identity Providers" />
          <MarqueeItem text="Credit Bureaus" />
        </Marquee>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-4 py-32">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-center mb-20">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StepCard
              number="01"
              icon={<Shield className="w-6 h-6" />}
              title="Login with Moca ID"
              description="Connect via Google, Email, or Wallet. No complex setup required."
            />
            <StepCard
              number="02"
              icon={<CheckCircle className="w-6 h-6" />}
              title="Get Credentials"
              description="Request verifiable credentials from trusted issuers."
            />
            <StepCard
              number="03"
              icon={<BarChart3 className="w-6 h-6" />}
              title="Build Score"
              description="Your credit score updates on-chain based on credentials."
            />
            <StepCard
              number="04"
              icon={<TrendingUp className="w-6 h-6" />}
              title="Borrow More"
              description="Higher scores unlock lower collateral requirements."
            />
          </div>
        </div>
      </div>

      {/* Features Section with Magic Cards */}
      <div className="container mx-auto px-4 py-32">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-center mb-20">
            Key Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard
              icon={<TrendingUp className="w-10 h-10" />}
              title="Dynamic Collateral"
              description="Collateral requirements from 50-150% based on your credit score. High scores mean better terms and more capital efficiency."
            />
            <FeatureCard
              icon={<Lock className="w-10 h-10" />}
              title="Privacy-Preserving"
              description="Zero-Knowledge Proofs keep your data private while proving creditworthiness on-chain."
            />
            <FeatureCard
              icon={<Shield className="w-10 h-10" />}
              title="Verifiable Credentials"
              description="Credentials from trusted issuers are cryptographically verified and stored securely."
            />
            <FeatureCard
              icon={<Zap className="w-10 h-10" />}
              title="Instant Loans"
              description="Once your score is built, borrow instantly with transparent terms and no hidden fees."
            />
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="container mx-auto px-4 py-32">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-center mb-20">
            Better Than Traditional DeFi
          </h2>
          
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-stretch">
            {/* Traditional DeFi Card - Faded */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-12 rounded-3xl border-2 border-black/10 bg-neutral-50/50 backdrop-blur-sm hover:bg-neutral-100/50 transition-all duration-300">
                <h3 className="text-3xl font-bold mb-10 text-black/40 group-hover:text-black/50 transition-colors">
                  Traditional DeFi
                </h3>
                <ul className="space-y-6">
                  <li className="flex items-start gap-3 text-lg">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-black/50">150% collateral required</span>
                  </li>
                  <li className="flex items-start gap-3 text-lg">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-black/50">Same terms for everyone</span>
                  </li>
                  <li className="flex items-start gap-3 text-lg">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-black/50">Capital inefficient</span>
                  </li>
                  <li className="flex items-start gap-3 text-lg">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-black/50">No credit history</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* VS Badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-black/20 blur-xl rounded-full" />
                <div className="relative bg-black text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold shadow-2xl border-4 border-white">
                  VS
                </div>
              </div>
            </div>

            {/* Credo Protocol Card - Highlighted with Border Beam */}
            <div className="relative z-10">
              <div className="relative p-12 rounded-3xl border-2 border-black bg-white shadow-2xl overflow-hidden">
                {/* Border Beam Animation */}
                <BorderBeam size={250} duration={10} borderWidth={2} />
                
                <h3 className="relative text-3xl font-bold mb-10 text-black flex items-center gap-3">
                  Credo Protocol
                  <Sparkles className="w-6 h-6" />
                </h3>
                <ul className="relative space-y-6">
                  <li className="flex items-start gap-3 text-lg">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5 flex-shrink-0 shadow-lg shadow-green-200">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-black font-medium">50-150% based on score</span>
                  </li>
                  <li className="flex items-start gap-3 text-lg">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5 flex-shrink-0 shadow-lg shadow-green-200">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-black font-medium">Personalized terms</span>
                  </li>
                  <li className="flex items-start gap-3 text-lg">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5 flex-shrink-0 shadow-lg shadow-green-200">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-black font-medium">Up to 3x more efficient</span>
                  </li>
                  <li className="flex items-start gap-3 text-lg">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5 flex-shrink-0 shadow-lg shadow-green-200">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-black font-medium">Build on-chain reputation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-32 relative">
        <div className="max-w-5xl mx-auto">
          <MagicCard 
            className="rounded-3xl border border-black/10 p-16 text-center"
            gradientColor="#000000" 
            gradientOpacity={0.06}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-black/60 mb-10 max-w-2xl mx-auto">
              Connect your wallet and start building your on-chain credit score today.
            </p>
            <Link href="/dashboard">
              <Button 
                size="lg" 
                className="text-xl px-16 py-7 gap-3 bg-black hover:bg-black/90 text-white border-0 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                Launch App
                <ArrowRight className="w-6 h-6" />
              </Button>
            </Link>
          </MagicCard>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-black/10 mt-16 bg-neutral-50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-black/50">
            <p className="text-lg">Built for the Moca Chain Hackathon</p>
            <p className="mt-2 text-black font-medium">
              Transforming trust into capital, one credential at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component: Stat Card with Number Ticker
function StatCard({ value, suffix = "", label, description }) {
  return (
    <MagicCard className="p-8 text-center space-y-3 border border-black/10" gradientColor="#000000" gradientOpacity={0.05}>
      <div className="text-6xl font-bold flex items-center justify-center gap-1">
        <NumberTicker value={value} />
        {suffix && <span>{suffix}</span>}
      </div>
      <div className="font-semibold text-xl">{label}</div>
      <div className="text-sm text-black/60">{description}</div>
    </MagicCard>
  );
}

// Component: Marquee Item
function MarqueeItem({ text }) {
  return (
    <div className="mx-8 text-2xl font-semibold text-black/30">
      {text}
    </div>
  );
}

// Component: Step Card
function StepCard({ number, icon, title, description }) {
  return (
    <MagicCard className="p-8 relative" gradientColor="#000000" gradientOpacity={0.05}>
      <div className="absolute top-6 right-6 text-7xl font-bold text-black/5">
        {number}
      </div>
      <div className="relative space-y-4">
        <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center text-white">
          {icon}
        </div>
        <h3 className="font-semibold text-xl">{title}</h3>
        <p className="text-black/60 leading-relaxed">{description}</p>
      </div>
    </MagicCard>
  );
}

// Component: Feature Card
function FeatureCard({ icon, title, description }) {
  return (
    <div className="group relative p-10 rounded-2xl bg-white border border-black/5 hover:border-black/10 transition-all duration-300 hover:shadow-lg">
      <div className="space-y-6">
        <div className="w-16 h-16 rounded-xl bg-black flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="font-semibold text-2xl">{title}</h3>
        <p className="text-black/60 leading-relaxed text-lg">{description}</p>
      </div>
    </div>
  );
}
