/**
 * AIR Kit Integration
 * 
 * Moca Network's AIR Kit provides:
 * - Web3 SSO (Google, Email, Wallet login)
 * - Smart Account (embedded wallet)
 * - Session management (30-day sessions)
 * - Credential services (for future use)
 * 
 * Based on official Moca documentation:
 * https://docs.moca.network/airkit/quickstart
 */

import { AirService, BUILD_ENV } from '@mocanetwork/airkit';

// Initialize AIR Service
// Partner ID must be obtained from https://developers.sandbox.air3.com/
export const airService = new AirService({
  partnerId: process.env.NEXT_PUBLIC_PARTNER_ID || 'YOUR_PARTNER_ID_HERE',
  env: BUILD_ENV.SANDBOX, // Use SANDBOX for testnet/development
});

/**
 * Initialize AIR Kit
 * Must be called before any other AIR Kit operations
 * 
 * @param {Object} options - Initialization options
 * @param {boolean} options.skipRehydration - If true, require login every time (default: false)
 * @param {boolean} options.enableLogging - Enable console logging for debugging (default: true)
 */
export async function initializeAirKit(options = {}) {
  const {
    skipRehydration = false,
    enableLogging = true
  } = options;

  try {
    await airService.init({
      buildEnv: BUILD_ENV.SANDBOX,
      enableLogging,
      skipRehydration, // Set to false for automatic re-login (30-day sessions)
    });
    
    console.log('AIR Kit initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize AIR Kit:', error);
    throw error;
  }
}

/**
 * Login with AIR Kit (SSO)
 * 
 * Triggers the AIR Kit login dialog with built-in methods:
 * - Google Login
 * - Passwordless Email Login
 * - Wallet Login (coming soon)
 * 
 * @param {Object} options - Login options
 * @param {string} options.authToken - Optional Partner JWT for custom auth
 * @returns {Promise<Object>} Login result with user info and session token
 */
export async function loginWithAirKit(options = {}) {
  try {
    const loginResult = await airService.login(options);
    
    console.log('AIR Kit login successful:', {
      isLoggedIn: loginResult.isLoggedIn,
      id: loginResult.id,
      address: loginResult.abstractAccountAddress,
    });
    
    // Returns: { 
    //   isLoggedIn: boolean,
    //   id: string, 
    //   abstractAccountAddress: string,
    //   token: string,
    //   isMFASetup: boolean
    // }
    return loginResult;
  } catch (error) {
    console.error('AIR Kit login failed:', error);
    throw error;
  }
}

/**
 * Check if user is logged in
 * 
 * @returns {boolean} True if user has an active session
 */
export function isUserLoggedIn() {
  return airService.isLoggedIn;
}

/**
 * Logout from AIR Kit
 * Clears the current session
 */
export async function logout() {
  try {
    await airService.logout();
    console.log('AIR Kit logout successful');
  } catch (error) {
    console.error('AIR Kit logout failed:', error);
    throw error;
  }
}

/**
 * Get current user information
 * 
 * @returns {Promise<Object>} User info object
 */
export async function getUserInfo() {
  try {
    const userInfo = await airService.getUserInfo();
    
    // Returns: {
    //   partnerId: string,
    //   partnerUserId: string,
    //   airId: string,
    //   user: {
    //     id: string,
    //     abstractAccountAddress: string,
    //     email: string,
    //     isMFASetup: boolean
    //   }
    // }
    return userInfo;
  } catch (error) {
    console.error('Failed to get user info:', error);
    throw error;
  }
}

/**
 * Get EIP-1193 provider for contract interactions
 * This provider can be used with ethers.js, wagmi, or other Web3 libraries
 * 
 * @returns {Object} EIP-1193 compatible provider
 */
export function getProvider() {
  const provider = airService.getProvider();
  
  if (!provider) {
    throw new Error('AIR Kit provider not available. User may not be logged in.');
  }
  
  return provider;
}

/**
 * Get the smart account address
 * This is the user's embedded wallet address on Moca Chain
 * 
 * @returns {string|null} Smart account address or null if not logged in
 */
export function getSmartAccountAddress() {
  try {
    const userInfo = airService.getUserInfo();
    return userInfo?.user?.abstractAccountAddress || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if AIR Kit is initialized
 * 
 * @returns {boolean} True if AIR Kit has been initialized
 */
export function isInitialized() {
  return airService.isLoggedIn !== undefined;
}

// Export the service instance for advanced usage
export default airService;

