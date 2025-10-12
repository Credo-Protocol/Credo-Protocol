/**
 * useAirKit Hook
 * 
 * Custom React hook for managing AIR Kit state and operations
 * Provides easy access to user info, connection status, and AIR Kit functions
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  initializeAirKit,
  loginWithAirKit,
  logout,
  getUserInfo,
  getProvider,
  isUserLoggedIn,
  getSmartAccountAddress
} from '@/lib/airkit';

export function useAirKit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialize AIR Kit on mount
   */
  useEffect(() => {
    initialize();
  }, []);

  /**
   * Initialize AIR Kit and check for existing session
   */
  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize AIR Kit
      await initializeAirKit({
        skipRehydration: false,
        enableLogging: true,
      });

      setIsInitialized(true);

      // Check if user is already logged in
      if (isUserLoggedIn()) {
        await updateUserState();
      }
    } catch (err) {
      console.error('Failed to initialize AIR Kit:', err);
      setError(err.message || 'Initialization failed');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user state after login
   */
  const updateUserState = useCallback(async () => {
    try {
      const info = await getUserInfo();
      const address = info.user.abstractAccountAddress;

      setUserInfo(info);
      setUserAddress(address);
      setIsConnected(true);

      // Get AIR Kit provider for contract interactions
      const airProvider = getProvider();
      const ethersProvider = new ethers.BrowserProvider(airProvider);
      const ethersSigner = await ethersProvider.getSigner();

      setProvider(ethersProvider);
      setSigner(ethersSigner);

      return { info, address, provider: ethersProvider, signer: ethersSigner };
    } catch (err) {
      console.error('Failed to update user state:', err);
      throw err;
    }
  }, []);

  /**
   * Connect with AIR Kit (trigger login)
   */
  const connect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const loginResult = await loginWithAirKit();

      if (loginResult.isLoggedIn) {
        await updateUserState();
        return true;
      }

      return false;
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err.message || 'Connection failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateUserState]);

  /**
   * Disconnect from AIR Kit (logout)
   */
  const disconnect = useCallback(async () => {
    try {
      await logout();
      
      setIsConnected(false);
      setUserAddress(null);
      setUserInfo(null);
      setProvider(null);
      setSigner(null);
    } catch (err) {
      console.error('Disconnect failed:', err);
      setError(err.message || 'Disconnect failed');
    }
  }, []);

  /**
   * Get contract instance with signer
   */
  const getContract = useCallback((address, abi) => {
    if (!signer) {
      throw new Error('Not connected. Please log in first.');
    }
    return new ethers.Contract(address, abi, signer);
  }, [signer]);

  /**
   * Get contract instance with provider (read-only)
   */
  const getReadOnlyContract = useCallback((address, abi) => {
    if (!provider) {
      throw new Error('Provider not available');
    }
    return new ethers.Contract(address, abi, provider);
  }, [provider]);

  return {
    // State
    isInitialized,
    isConnected,
    userAddress,
    userInfo,
    provider,
    signer,
    loading,
    error,

    // Functions
    connect,
    disconnect,
    getContract,
    getReadOnlyContract,
    refreshUserInfo: updateUserState,

    // Computed values
    isReady: isInitialized && !loading,
    userEmail: userInfo?.user?.email,
    userId: userInfo?.user?.id,
  };
}

