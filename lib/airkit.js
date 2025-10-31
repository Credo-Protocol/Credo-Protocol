/**
 * AIR Kit Integration - Phase 5.3
 * 
 * Moca Network's AIR Kit provides:
 * - Web3 SSO (Google, Email, Wallet login)
 * - Smart Account (embedded wallet)
 * - Session management (30-day sessions)
 * - Credential services (official MOCA credentials)
 * - Gas sponsorship (paymaster) for credential issuance
 * 
 * Based on official Moca documentation:
 * https://docs.moca.network/airkit/quickstart
 * https://docs.moca.network/airkit/usage/account/paymaster
 */

import { AirService, BUILD_ENV } from '@mocanetwork/airkit';

// Initialize AIR Service
// Partner ID must be obtained from https://developers.sandbox.air3.com/
export const airService = new AirService({
  partnerId: process.env.NEXT_PUBLIC_PARTNER_ID || 'YOUR_PARTNER_ID_HERE',
  env: BUILD_ENV.SANDBOX, // Use SANDBOX for testnet/development
});

// Idempotent initialization guards (persist across module usage)
let __airkitInitialized = false;
let __airkitInitPromise = null;
let __cachedUserInfo = null;

/**
 * Initialize AIR Kit with Gas Sponsorship (Phase 5.3)
 * 
 * GAS FEE MECHANISM:
 * 
 * SANDBOX/DEVNET (Current Environment):
 *    - AIR Kit sponsors ALL transactions by default for development
 *    - Users can transact with 0 balance (development convenience)
 *    - Smart account deployment is always free
 * 
 * PRODUCTION/MAINNET - Two payment options:
 * 
 * 1. ERC-20 Paymaster (DEFAULT on mainnet):
 *    - Users pay gas fees using ERC-20 tokens (USDC, MOCA, USDT, etc.)
 *    - Automatically deducted from smart account balance
 *    - No native MOCA gas tokens needed!
 *    - Works without NEXT_PUBLIC_PAYMASTER_POLICY_ID
 * 
 * 2. Sponsored Paymaster (OPTIONAL - Requires Policy ID):
 *    - You pay all gas fees for your users (completely free for them)
 *    - Set NEXT_PUBLIC_PAYMASTER_POLICY_ID to enable
 *    - Configure spending limits and allowlists in AIR Kit Dashboard
 *    - Contact Moca to set up sponsorship policies
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
    // Fast-path: already initialized (module or window global)
    if (__airkitInitialized || (typeof window !== 'undefined' && window.__airkitInitialized === true)) {
      __airkitInitialized = true;
      return true;
    }

    // If an init is in-flight, reuse it
    if (__airkitInitPromise) {
      return __airkitInitPromise;
    }

    // Base config
    const config = {
      buildEnv: BUILD_ENV.SANDBOX,
      enableLogging,
      skipRehydration,
    };
    
    // Add paymaster config if policy ID is provided
    const paymasterPolicyId = process.env.NEXT_PUBLIC_PAYMASTER_POLICY_ID;
    if (paymasterPolicyId && paymasterPolicyId.trim() !== '') {
      config.paymasterConfig = {
        enabled: true,
        policyId: paymasterPolicyId,
      };
      console.log('✅ SPONSORED Gas Mode: You pay all gas fees for users (completely free)');
    } else {
      console.log('🔧 SANDBOX/DEVNET Mode: AIR Kit sponsors all transactions for development');
      console.log('   (On mainnet: users will pay gas with USDC/MOCA via ERC-20 Paymaster)');
      console.log('   To enable SPONSORED mode on mainnet: Set NEXT_PUBLIC_PAYMASTER_POLICY_ID');
    }
    
    __airkitInitPromise = (async () => {
      await airService.init(config);
      __airkitInitialized = true;
      if (typeof window !== 'undefined') {
        window.__airkitInitialized = true;
      }
      console.log('✅ AIR Kit initialized successfully');
      return true;
    })();

    // Ensure subsequent calls during init share the same promise
    const result = await __airkitInitPromise;
    // After resolution, keep the initialized flag but clear the promise
    __airkitInitPromise = null;
    return result;
  } catch (error) {
    console.error('❌ Failed to initialize AIR Kit:', error);
    // If paymaster fails, log warning but don't throw (graceful degradation)
    if (error.message && error.message.includes('paymaster')) {
      console.warn('⚠️ Paymaster initialization failed - continuing without gas sponsorship');
      console.warn('   Users will need MOCA tokens for transactions');
    }
    // Clear in-flight promise on failure so future attempts can retry
    __airkitInitPromise = null;
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
    
    // Cache user info after successful login to avoid UI flicker on route changes
    try {
      const info = await airService.getUserInfo();
      __cachedUserInfo = info;
    } catch {}

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
    __cachedUserInfo = null;
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
    __cachedUserInfo = userInfo;
    
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
  return __airkitInitialized === true || (typeof window !== 'undefined' && window.__airkitInitialized === true);
}

/**
 * Get cached user info if previously fetched
 * Helps avoid UI flashes on route changes by hydrating synchronously
 */
export function getCachedUserInfo() {
  return __cachedUserInfo;
}

// Export the service instance for advanced usage
export default airService;

