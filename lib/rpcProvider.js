/**
 * RPC Provider Management
 * 
 * Provides robust RPC provider with fallback support and timeout handling
 * for better reliability in production environments like Vercel
 */

import { ethers } from 'ethers';
import { MOCA_CHAIN } from './contracts';

/**
 * Get a public fallback provider
 * This is used when AIR Kit provider is unavailable or slow
 */
export function getPublicProvider() {
  const rpcUrl = MOCA_CHAIN.rpcUrls.default.http[0];
  
  // Create a JsonRpcProvider with custom timeout settings
  const provider = new ethers.JsonRpcProvider(rpcUrl, {
    chainId: MOCA_CHAIN.id,
    name: MOCA_CHAIN.name,
  });
  
  return provider;
}

/**
 * Get a provider with fallback support
 * Tries to use the provided provider (from AIR Kit), falls back to public RPC
 * 
 * @param {Object} preferredProvider - Provider from AIR Kit (optional)
 * @returns {Object} ethers provider
 */
export function getReliableProvider(preferredProvider = null) {
  if (preferredProvider) {
    return preferredProvider;
  }
  
  // Fallback to public provider
  return getPublicProvider();
}

/**
 * Wrapper for RPC calls with timeout and retry logic
 * 
 * @param {Function} rpcCall - The RPC call function to execute
 * @param {Object} options - Options for the call
 * @param {number} options.timeout - Timeout in milliseconds (default: 30000)
 * @param {number} options.retries - Number of retries (default: 2)
 * @param {Object} options.fallbackProvider - Fallback provider to use on failure
 * @returns {Promise} Result of the RPC call
 */
export async function callWithTimeout(rpcCall, options = {}) {
  const {
    timeout = 30000, // 30 seconds for Vercel cold starts
    retries = 2,
    fallbackProvider = null,
  } = options;
  
  let lastError = null;
  
  // Try with primary provider first
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('RPC call timeout')), timeout)
      );
      
      const result = await Promise.race([
        rpcCall(),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`RPC call attempt ${attempt + 1} failed:`, error.message);
      
      // Wait before retry (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  // If we have a fallback provider, try with it
  if (fallbackProvider) {
    try {
      console.log('Trying with fallback public provider...');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Fallback RPC call timeout')), timeout)
      );
      
      const result = await Promise.race([
        rpcCall(),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      console.error('Fallback provider also failed:', error.message);
      lastError = error;
    }
  }
  
  throw lastError;
}

/**
 * Check if provider is responsive
 * 
 * @param {Object} provider - ethers provider
 * @returns {Promise<boolean>} True if provider is responsive
 */
export async function isProviderResponsive(provider) {
  try {
    const blockNumber = await Promise.race([
      provider.getBlockNumber(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
    
    return typeof blockNumber === 'number';
  } catch (error) {
    console.warn('Provider not responsive:', error.message);
    return false;
  }
}

/**
 * Get the best available provider
 * Tests AIR Kit provider first, falls back to public if needed
 * 
 * @param {Object} airKitProvider - Provider from AIR Kit
 * @returns {Promise<Object>} Best available provider
 */
export async function getBestProvider(airKitProvider = null) {
  // Try AIR Kit provider first
  if (airKitProvider) {
    const isResponsive = await isProviderResponsive(airKitProvider);
    if (isResponsive) {
      console.log('✅ Using AIR Kit provider');
      return airKitProvider;
    }
    console.warn('⚠️ AIR Kit provider not responsive, using fallback');
  }
  
  // Fallback to public provider
  const publicProvider = getPublicProvider();
  const isResponsive = await isProviderResponsive(publicProvider);
  
  if (isResponsive) {
    console.log('✅ Using public RPC provider');
    return publicProvider;
  }
  
  console.warn('⚠️ Public provider not responsive either, returning it anyway');
  return publicProvider;
}

export default {
  getPublicProvider,
  getReliableProvider,
  callWithTimeout,
  isProviderResponsive,
  getBestProvider,
};

