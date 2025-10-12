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
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, User, Copy, Check, Mail, Wallet } from 'lucide-react';
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

export default function ConnectButton({ onConnectionChange, size = 'default', variant = 'default' }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

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
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please try again.');
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

      // Notify parent component
      if (onConnectionChange) {
        onConnectionChange({
          connected: false,
          address: null,
          userInfo: null,
        });
      }

      console.log('Logout successful');
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

  // Loading state
  if (loading) {
    return (
      <Button disabled size={size} variant={variant}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Initializing...
      </Button>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-red-500">{error}</p>
        <Button onClick={initAirKit} size="sm" variant="outline">
          Retry
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size} className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <User className="h-4 w-4" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium">{displayName}</div>
              <div className="text-xs text-muted-foreground font-mono">
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
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    {userInfo.user.id}
                  </p>
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
    <Button
      onClick={handleLogin}
      disabled={loggingIn}
      size={size}
      variant={variant}
    >
      {loggingIn ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        'Login with Moca ID'
      )}
    </Button>
  );
}

