/**
 * Application Navigation Component
 * 
 * Shared header/navigation for all app pages.
 * Provides consistent navigation between Dashboard, Credentials, Lending, and Score Builder.
 */

import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import ConnectButton from '@/components/auth/ConnectButton';
import CredentialNotifications from '@/components/CredentialNotifications';
import { Home, Wallet, TrendingUp, BarChart3, Droplets, Coins } from 'lucide-react';

export function AppNav({ onConnectionChange }) {
  const router = useRouter();
  
  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: Home },
    { href: '/credentials', label: 'Credentials', icon: Wallet },
    { href: '/lending', label: 'Lending', icon: Coins },
  ];
  
  return (
    <>
      {/* Credential Notifications (Fixed Position) */}
      <CredentialNotifications />
      
      <header className="border-b border-black/10 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between relative">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center gap-1 group">
            <img 
              src="/credo.jpg" 
              alt="Credo Protocol" 
              className="w-8 h-8 rounded-lg object-cover transition-transform group-hover:scale-105" 
            />
            <span className="text-xl font-bold text-black">Credo Protocol</span>
          </Link>
          
          {/* Navigation Links - Centered */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={`h-[44px] w-[140px] flex items-center justify-center gap-2 ${
                      isActive 
                        ? 'bg-black text-white hover:bg-black/90' 
                        : 'text-black/70 hover:text-black hover:bg-black/5'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Link href="/score">
                <Button 
                  variant="outline" 
                  className={`h-[44px] w-[44px] p-0 flex items-center justify-center border-black/20 hover:bg-black/5 hover:border-black/30 text-black bg-white ${
                    router.pathname === '/score' ? 'bg-black/5 border-black/30' : ''
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/faucet">
                <Button 
                  variant="outline" 
                  className="h-[44px] w-[44px] p-0 flex items-center justify-center border-black/20 hover:bg-black/5 hover:border-black/30 text-black bg-white"
                >
                  <Droplets className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <ConnectButton onConnectionChange={onConnectionChange} />
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center justify-between gap-1 mt-3 overflow-x-auto pb-1">
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={`flex items-center gap-2 whitespace-nowrap ${
                      isActive 
                        ? 'bg-black text-white' 
                        : 'text-black/70 hover:text-black'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-1">
            <Link href="/score">
              <Button
                variant={router.pathname === '/score' ? 'default' : 'ghost'}
                size="sm"
                className={`w-[36px] h-[36px] p-0 flex items-center justify-center ${
                  router.pathname === '/score'
                    ? 'bg-black text-white'
                    : 'text-black/70 hover:text-black'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/faucet">
              <Button
                variant="ghost"
                size="sm"
                className="w-[36px] h-[36px] p-0 flex items-center justify-center text-black/70 hover:text-black"
              >
                <Droplets className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
    </>
  );
}

export default AppNav;

