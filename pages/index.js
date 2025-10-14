/**
 * Landing Page - Credo Protocol
 * Clean white/black/grey minimalist theme
 */

import Link from 'next/link';
import { ArrowRight, Shield, TrendingUp, CheckCircle, Lock, BarChart3, Sparkles, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { RetroGrid } from '@/components/ui/retro-grid';
import { MagicCard } from '@/components/ui/magic-card';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Marquee } from '@/components/ui/marquee';
import { BorderBeam } from '@/components/ui/border-beam';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header/Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <Link href="/" className="flex items-center gap-1 group">
              <img 
                src="/credo.jpg" 
                alt="Credo Protocol" 
                className="w-8 h-8 rounded-lg object-cover transition-transform group-hover:scale-105" 
              />
              <span className="text-xl font-bold text-black">Credo Protocol</span>
            </Link>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/dashboard" className="text-black/70 hover:text-black transition-colors font-medium">
                Dashboard
              </Link>
              <Link href="/faucet" className="text-black/70 hover:text-black transition-colors font-medium">
                Faucet
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Retro Grid Background */}
        <RetroGrid className="opacity-50" />
        
        <div className="container mx-auto px-4 py-32 relative z-10">
          <div className="max-w-6xl mx-auto text-center space-y-12">
            {/* Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 bg-white/50 backdrop-blur-sm">
                <img src="/moca.jpg" alt="Moca Chain" className="w-4 h-4 rounded-sm object-cover" />
                <span className="text-sm font-medium">Built on Moca Chain</span>
              </div>
            </div>
            
            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
                Borrow Based on
              </h1>
              <div className="flex justify-center">
                <TextGenerateEffect
                  words="WHO YOU ARE"
                  className="text-5xl md:text-7xl lg:text-8xl font-bold"
                  duration={1}
                  filter={true}
                  auroraLastWord={true}
                />
              </div>
            </div>
            
            {/* Shiny Subheading */}
            <AnimatedShinyText className="text-lg md:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed">
              Identity-backed DeFi lending with undercollateralized loans. 
              Build your on-chain credit score and unlock better terms.
            </AnimatedShinyText>

            {/* CTA Button */}
            <div className="flex justify-center pt-4">
              <Link href="/dashboard">
                <div className="relative inline-block">
                  {/* Moca-themed gradient border effect */}
                  <div 
                    className="absolute -inset-[2px] rounded-full opacity-75 blur-sm"
                    style={{
                      background: 'linear-gradient(90deg, #d946ef, #ec4899, #a855f7, #d946ef)',
                      backgroundSize: '200% 100%',
                      animation: 'rainbow-slide 3s linear infinite',
                    }}
                  />
                  
                  {/* Black button on top */}
                  <button className="relative text-lg px-10 h-12 bg-black text-white rounded-full flex items-center gap-2 transition-all duration-300 hover:scale-105 cursor-pointer">
                    <span className="flex items-center gap-2">
                      Get Started
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                </div>
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
          <motion.h2 
            className="text-5xl md:text-6xl font-bold text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            How It Works
          </motion.h2>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
          >
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
          </motion.div>
        </div>
      </div>

      {/* Features Section with Magic Cards */}
      <div className="container mx-auto px-4 py-32">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            className="text-5xl md:text-6xl font-bold text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Key Features
          </motion.h2>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
          >
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
          </motion.div>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="container mx-auto px-4 py-32">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            className="text-5xl md:text-6xl font-bold text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Better Than Traditional DeFi
          </motion.h2>
          
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-stretch">
            {/* Traditional DeFi Card - Faded */}
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
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
          </motion.div>

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
            <motion.div 
              className="relative z-10"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
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
          </motion.div>
        </div>
      </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-32 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <MagicCard 
              className="rounded-3xl border border-black/10 p-16 text-center"
              gradientColor="#000000" 
              gradientOpacity={0.06}
            >
              <motion.h2 
                className="text-5xl md:text-6xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Ready to Get Started?
              </motion.h2>
              <motion.p 
                className="text-xl text-black/60 mb-10 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Connect your wallet and start building your on-chain credit score today.
              </motion.p>
              <motion.div 
                className="flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link href="/dashboard">
                  <div className="relative inline-block">
                    {/* Moca-themed gradient border effect */}
                    <div 
                      className="absolute -inset-[2px] rounded-full opacity-75 blur-sm"
                      style={{
                        background: 'linear-gradient(90deg, #d946ef, #ec4899, #a855f7, #d946ef)',
                        backgroundSize: '200% 100%',
                        animation: 'rainbow-slide 3s linear infinite',
                      }}
                    />
                    
                    {/* Black button on top */}
                    <button className="relative text-xl px-16 h-14 bg-black text-white rounded-full flex items-center gap-3 transition-all duration-300 hover:scale-105 cursor-pointer">
                      <span className="flex items-center gap-3">
                        Get Started
                        <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                      </span>
                    </button>
                  </div>
                </Link>
              </motion.div>
            </MagicCard>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              {/* Brand Section */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/credo.jpg" alt="Credo Protocol" className="w-8 h-8 rounded-lg object-cover" />
                  <h3 className="text-2xl font-bold">Credo Protocol</h3>
                </div>
                <p className="text-white/70 text-lg leading-relaxed max-w-md">
                  Identity-backed DeFi lending with undercollateralized loans. 
                  Build your on-chain credit score and unlock better terms.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold text-lg mb-4">Platform</h4>
                <ul className="space-y-3">
                  <li><Link href="/dashboard" className="text-white/70 hover:text-white transition-colors">Dashboard</Link></li>
                  <li><Link href="/faucet" className="text-white/70 hover:text-white transition-colors">Get Test Tokens</Link></li>
                  <li><a href="#" className="text-white/70 hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="text-white/70 hover:text-white transition-colors">API</a></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="font-semibold text-lg mb-4">Resources</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-white/70 hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#" className="text-white/70 hover:text-white transition-colors">Security</a></li>
                  <li><a href="#" className="text-white/70 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-white/70 hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-white/10 pt-8">
              <div className="text-center">
                <p className="text-white/60">
                  © 2024 Credo Protocol. Built on Moca Chain.
                </p>
                <p className="text-white/40 text-sm mt-1">
                  Transforming trust into capital, one credential at a time.
                </p>
              </div>
            </div>
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

// Component: Step Card with animation
function StepCard({ number, icon, title, description }) {
  return (
    <motion.div
      className="h-full"
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.5,
            ease: "easeOut"
          }
        }
      }}
    >
      <MagicCard className="p-8 relative h-full flex flex-col" gradientColor="#000000" gradientOpacity={0.05}>
        <div className="absolute top-6 right-6 text-7xl font-bold text-black/5">
          {number}
        </div>
        <div className="relative space-y-4 flex-1 flex flex-col">
          <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center text-white">
            {icon}
          </div>
          <h3 className="font-semibold text-xl">{title}</h3>
          <p className="text-black/60 leading-relaxed flex-1">{description}</p>
        </div>
      </MagicCard>
    </motion.div>
  );
}

// Component: Feature Card with animation
function FeatureCard({ icon, title, description }) {
  return (
    <motion.div 
      className="group relative p-10 rounded-2xl bg-white border border-black/5 hover:border-black/10 transition-all duration-300 hover:shadow-lg"
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.5,
            ease: "easeOut"
          }
        }
      }}
    >
      <div className="space-y-6">
        <div className="w-16 h-16 rounded-xl bg-black flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="font-semibold text-2xl">{title}</h3>
        <p className="text-black/60 leading-relaxed text-lg">{description}</p>
      </div>
    </motion.div>
  );
}
