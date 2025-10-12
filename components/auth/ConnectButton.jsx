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
import { Loader2, LogOut } from 'lucide-react';
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

  // Logged in state
  if (isLoggedIn && userInfo) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <div className="font-medium">
            {userInfo.user.email || 'Moca User'}
          </div>
          <div className="text-muted-foreground text-xs font-mono">
            {userInfo.user.abstractAccountAddress?.slice(0, 6)}...
            {userInfo.user.abstractAccountAddress?.slice(-4)}
          </div>
        </div>
        <Button onClick={handleLogout} variant="outline" size={size}>
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </Button>
      </div>
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

