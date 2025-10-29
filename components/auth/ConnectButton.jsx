/**
 * Connect Button Component
 * 
 * Uses Moca Network's AIR Kit for authentication
 * Provides SSO login with:
 * - Google Login
 * - Passwordless Email
 * - Wallet Login (coming soon)
 * 
 * Manages user sessions automatically (30-day expiry)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, User, Copy, Check, Mail, Wallet, Coins, DollarSign, Gift } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  airService,
  initializeAirKit,
  loginWithAirKit,
  logout,
  getUserInfo,
  isUserLoggedIn
} from '@/lib/airkit';
import { CONTRACTS, ERC20_ABI } from '@/lib/contracts';
import { getBestProvider, callWithTimeout } from '@/lib/rpcProvider';

export default function ConnectButton({ onConnectionChange, size = 'default', variant = 'default' }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [airIdCopied, setAirIdCopied] = useState(false);
  
  // Balance states
  const [mocaBalance, setMocaBalance] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [balancesLoading, setBalancesLoading] = useState(false);

  // Initialize AIR Kit on mount
  useEffect(() => {
    initAirKit();
  }, []);

  /**
   * Initialize AIR Kit and check for existing session
   */
  async function initAirKit() {
    try {
      setLoading(true);
      setError(null);

      // Initialize AIR Kit
      await initializeAirKit({
        skipRehydration: false, // Enable automatic re-login (30-day sessions)
        enableLogging: true, // Enable for development
      });

      // Check if user is already logged in (session rehydration)
      if (isUserLoggedIn()) {
        const info = await getUserInfo();
        setUserInfo(info);
        setIsLoggedIn(true);

        // Notify parent component
        if (onConnectionChange) {
          onConnectionChange({
            connected: true,
            address: info.user.abstractAccountAddress,
            userInfo: info,
          });
        }

        console.log('User already logged in:', info.user.abstractAccountAddress);

        // Don't auto-redirect - allow users to stay on their current page
        // They can navigate manually if needed
      }
    } catch (error) {
      console.error('Failed to initialize AIR Kit:', error);
      setError('Failed to initialize. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handle login button click
   * Triggers AIR Kit SSO login dialog
   */
  async function handleLogin() {
    try {
      setLoggingIn(true);
      setError(null);

      // Trigger AIR Kit login dialog
      // User can choose: Google, Email, or Wallet
      const loginResult = await loginWithAirKit();

      if (loginResult.isLoggedIn) {
        const info = await getUserInfo();
        setUserInfo(info);
        setIsLoggedIn(true);

        // Notify parent component
        if (onConnectionChange) {
          onConnectionChange({
            connected: true,
            address: info.user.abstractAccountAddress,
            userInfo: info,
          });
        }

        console.log('Login successful:', info.user.abstractAccountAddress);

        // Only redirect to dashboard if user is on the landing page
        // Allow staying on other pages (like faucet) after login
        try {
          if (router && router.pathname === '/') {
            router.replace('/dashboard');
          }
        } catch {}
      }
    } catch (error) {
      // Handle user closing the modal gracefully
      // Check if error message indicates user cancelled/closed the modal
      const errorMessage = error.message || error.toString();
      const isUserCancelled = 
        errorMessage.includes('User closed') || 
        errorMessage.includes('user closed') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('canceled') ||
        errorMessage.includes('User rejected') ||
        errorMessage.includes('dismissed');
      
      if (isUserCancelled) {
        // User intentionally closed the modal - this is not an error
        console.log('Login cancelled by user');
      } else {
        // Actual error occurred
        console.error('Login failed:', error);
        setError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoggingIn(false);
    }
  }

  /**
   * Handle logout button click
   * Clears AIR Kit session
   */
  async function handleLogout() {
    try {
      await logout();
      setIsLoggedIn(false);
      setUserInfo(null);
      
      // Clear balance states immediately
      setMocaBalance(null);
      setUsdcBalance(null);
      setBalancesLoading(false);

      // Notify parent component
      if (onConnectionChange) {
        onConnectionChange({
          connected: false,
          address: null,
          userInfo: null,
        });
      }

      console.log('Logout successful');

      // Redirect to landing page after logout
      try {
        if (router && router.pathname !== '/') {
          router.replace('/');
        }
      } catch {}
    } catch (error) {
      console.error('Logout failed:', error);
      setError('Logout failed. Please try again.');
    }
  }

  /**
   * Copy wallet address to clipboard
   */
  function copyAddress() {
    if (userInfo?.user?.abstractAccountAddress) {
      navigator.clipboard.writeText(userInfo.user.abstractAccountAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  /**
   * Copy AIR ID to clipboard
   */
  function copyAirId() {
    if (userInfo?.user?.id) {
      navigator.clipboard.writeText(userInfo.user.id);
      setAirIdCopied(true);
      setTimeout(() => setAirIdCopied(false), 2000);
    }
  }

  /**
   * Fetch user's balances (MOCA and USDC)
   * Called when dropdown opens
   */
  async function fetchBalances() {
    // Early return if not logged in or no user info
    if (!isLoggedIn || !userInfo?.user?.abstractAccountAddress) {
      console.log('Not logged in, skipping balance fetch');
      return;
    }
    
    try {
      setBalancesLoading(true);
      
      // Get provider from AIR Kit
      const provider = airService.getProvider();
      if (!provider) {
        console.warn('Provider not available');
        setMocaBalance('0');
        setUsdcBalance('0');
        return;
      }

      // Double check we're still logged in before proceeding
      if (!isLoggedIn || !userInfo) {
        console.log('User logged out during fetch, aborting');
        return;
      }

      const address = userInfo.user.abstractAccountAddress;

      // Get reliable provider with fallback support
      const reliableProvider = await getBestProvider(provider);

      // Fetch MOCA balance (native token) with timeout and retry
      const mocaBalanceWei = await callWithTimeout(
        () => reliableProvider.getBalance(address),
        { timeout: 30000, retries: 2 }
      );
      
      // Check again if still logged in after async operation
      if (!isLoggedIn || !userInfo) {
        console.log('User logged out during balance fetch, aborting');
        return;
      }
      
      const mocaBalanceFormatted = ethers.formatEther(mocaBalanceWei);
      setMocaBalance(parseFloat(mocaBalanceFormatted).toFixed(4));

      // Fetch MockUSDC balance with timeout and retry
      const usdcContract = new ethers.Contract(
        CONTRACTS.MOCK_USDC,
        ERC20_ABI,
        reliableProvider
      );
      
      const usdcBalanceRaw = await callWithTimeout(
        () => usdcContract.balanceOf(address),
        { timeout: 30000, retries: 2 }
      );
      
      // Final check if still logged in
      if (!isLoggedIn || !userInfo) {
        console.log('User logged out during USDC fetch, aborting');
        return;
      }
      
      const usdcBalanceFormatted = ethers.formatUnits(usdcBalanceRaw, 6); // USDC has 6 decimals
      setUsdcBalance(parseFloat(usdcBalanceFormatted).toFixed(2));

    } catch (error) {
      console.error('Error fetching balances:', error);
      // Only set to 0 if we're still logged in, otherwise ignore the error
      if (isLoggedIn && userInfo) {
        setMocaBalance('0');
        setUsdcBalance('0');
      }
    } finally {
      // Only clear loading if still logged in
      if (isLoggedIn) {
        setBalancesLoading(false);
      }
    }
  }

  // Loading state
  if (loading) {
    return (
      <Button disabled className="h-[44px] px-4">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span className="text-sm">Initializing...</span>
      </Button>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-red-500">{error}</p>
        <Button onClick={initAirKit} variant="outline" className="h-[44px] px-4">
          <span className="text-sm">Retry</span>
        </Button>
      </div>
    );
  }

  // Logged in state with profile dropdown
  if (isLoggedIn && userInfo) {
    const address = userInfo.user.abstractAccountAddress;
    const email = userInfo.user.email;
    const displayName = email || 'Moca User';

    return (
      <DropdownMenu onOpenChange={(open) => {
        if (open) {
          // Fetch balances when dropdown opens
          fetchBalances();
        }
      }}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-3 h-[44px] px-3 min-w-[200px] bg-white text-black border-black/20 hover:bg-black/5 hover:border-black/30">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/10">
              <User className="h-4 w-4" />
            </div>
            <div className="text-left hidden sm:flex flex-col gap-1 flex-1 min-w-0">
              <div className="text-sm font-medium leading-none truncate">{displayName}</div>
              <div className="text-xs text-black/50 font-mono leading-none">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">My Account</p>
              <p className="text-xs leading-none text-muted-foreground">
                Powered by AIR Kit
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Balances Section */}
          <div className="px-2 py-3 space-y-3">
            {/* MOCA Balance */}
            <div className="flex items-center gap-2">
              <img 
                src="/moca.jpg" 
                alt="MOCA" 
                className="h-4 w-4 rounded-sm object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">MOCA Balance</p>
                <p className="text-sm font-medium">
                  {balancesLoading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    <span>{mocaBalance || '0.0000'} MOCA</span>
                  )}
                </p>
              </div>
            </div>
            
            {/* USDC Balance */}
            <div className="flex items-center gap-2">
              <img 
                src="/usd-coin-usdc-logo.png" 
                alt="USDC" 
                className="h-4 w-4 rounded-sm object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">MockUSDC Balance</p>
                <p className="text-sm font-medium">
                  {balancesLoading ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    <span>{usdcBalance || '0.00'} USDC</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Rewards Hub Link */}
          <DropdownMenuItem
            onClick={() => router.push('/rewards')}
            className="cursor-pointer text-muted-foreground"
          >
            <Gift className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Rewards Hub</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Email Section */}
          {email && (
            <div className="px-2 py-2">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm font-medium truncate">{email}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Wallet Address Section */}
          <div className="px-2 py-2">
            <div className="flex items-start gap-2">
              <Wallet className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono truncate flex-1">
                    {address}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={copyAddress}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* AIR ID Section */}
          {userInfo.user.id && (
            <div className="px-2 py-2">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">AIR ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-muted-foreground truncate flex-1">
                      {userInfo.user.id}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={copyAirId}
                    >
                      {airIdCopied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Logout Button */}
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Not logged in state
  return (
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
      <button
        onClick={handleLogin}
        disabled={loggingIn}
        className="relative h-[50px] px-8 rounded-full bg-black text-white font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
      >
        <span className="flex items-center justify-center gap-2">
          {loggingIn ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span className="text-sm text-white">Connecting...</span>
            </>
          ) : (
            <span className="text-sm text-white font-medium">Login with Moca ID</span>
          )}
        </span>
      </button>
    </div>
  );
}

