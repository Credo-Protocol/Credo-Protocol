/**
 * Transaction Error Handler Utility
 * 
 * Provides user-friendly error messages for common blockchain transaction errors.
 * Handles user rejections, gas issues, network problems, and contract reverts gracefully.
 */

/**
 * Get a user-friendly error message from a transaction error
 * 
 * @param {Error} error - The error object from ethers.js or viem
 * @returns {string} - A user-friendly error message
 */
export function getTransactionErrorMessage(error) {
  // Default fallback message
  let errorMessage = 'Transaction failed. Please try again.';
  
  // User rejected the transaction
  if (error.code === 'ACTION_REJECTED' || 
      error.code === 4001 || 
      error.message?.includes('user rejected') ||
      error.message?.includes('User rejected') ||
      error.message?.includes('rejected the request') ||
      error.message?.includes('User denied')) {
    return 'Transaction cancelled - you rejected it in your wallet.';
  }
  
  // Insufficient gas or funds
  if (error.message?.includes('insufficient funds')) {
    return '⛽ Insufficient funds. You need more MOCA tokens to pay for gas fees.';
  }
  
  if (error.message?.includes('gas required exceeds allowance') ||
      error.message?.includes('gas')) {
    return '⛽ Gas estimation failed. Try increasing the gas limit or check your balance.';
  }
  
  // Network issues
  if (error.message?.includes('network') ||
      error.message?.includes('timeout') ||
      error.message?.includes('connection') ||
      error.message?.includes('fetch failed')) {
    return '🌐 Network error. Please check your connection to Moca Chain Devnet and try again.';
  }
  
  // Contract execution reverted
  if (error.message?.includes('execution reverted')) {
    // Try to extract the revert reason
    if (error.reason) {
      return `⚠️ Transaction reverted: ${error.reason}`;
    }
    return '⚠️ Transaction reverted. The contract rejected this transaction. Check the requirements and try again.';
  }
  
  // Missing revert data (common when pool has insufficient liquidity or other contract issues)
  if (error.code === 'CALL_EXCEPTION' || 
      error.message?.includes('missing revert data') ||
      error.message?.includes('CALL_EXCEPTION')) {
    // Check if it's likely an insufficient liquidity issue
    if (error.message?.includes('estimateGas')) {
      return '💧 Transaction would fail. This is likely due to:\n• Insufficient pool liquidity - try borrowing less\n• Insufficient collateral for your credit score\n• No credit score registered - submit credentials first';
    }
    return '⚠️ Transaction cannot be completed. Please check:\n• Pool has enough liquidity\n• You have sufficient collateral\n• Your credit score is registered';
  }
  
  // Nonce issues
  if (error.message?.includes('nonce') ||
      error.message?.includes('replacement transaction')) {
    return '🔄 Transaction conflict. A similar transaction is pending. Please wait or cancel the pending transaction.';
  }
  
  // Unauthorized/Permission denied
  if (error.message?.includes('unauthorized') ||
      error.message?.includes('not authorized') ||
      error.message?.includes('permission denied')) {
    return '🚫 Unauthorized. You don\'t have permission to perform this action.';
  }
  
  // Invalid parameters
  if (error.message?.includes('invalid') && 
      error.message?.includes('parameter')) {
    return '📝 Invalid input. Please check your values and try again.';
  }
  
  // Wallet not connected
  if (error.message?.includes('no provider') ||
      error.message?.includes('wallet not connected')) {
    return '💼 Wallet not connected. Please connect your wallet and try again.';
  }
  
  // Generic contract error with specific reason
  if (error.reason && error.reason.length < 100) {
    return `Error: ${error.reason}`;
  }
  
  // If we have a short, readable error message, use it
  if (error.message && !error.message.includes('ethers-user-denied')) {
    // Clean up the message - take first line only
    const cleanMessage = error.message.split('\n')[0];
    
    // If it's reasonably short, use it
    if (cleanMessage.length < 150) {
      // Remove technical prefixes
      const userFriendlyMessage = cleanMessage
        .replace(/^Error: /, '')
        .replace(/^ethers-/, '');
      
      if (userFriendlyMessage.length > 0) {
        return userFriendlyMessage;
      }
    }
  }
  
  return errorMessage;
}

/**
 * Log transaction error with context
 * 
 * @param {string} context - Context of the transaction (e.g., "Faucet Request", "Token Approval")
 * @param {Error} error - The error object
 */
export function logTransactionError(context, error) {
  // Check if this is a user rejection (not a real error)
  const isUserRejection = error.code === 'ACTION_REJECTED' || 
                          error.code === 4001 || 
                          error.message?.includes('user rejected') ||
                          error.message?.includes('User rejected') ||
                          error.message?.includes('rejected the request') ||
                          error.message?.includes('User denied');
  
  if (isUserRejection) {
    // Log user rejections as info, not errors
    console.log(`ℹ️ ${context} - Transaction cancelled by user`);
    return;
  }
  
  // Log actual errors
  console.group(`❌ ${context} Error`);
  console.error('Error object:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  console.error('Error reason:', error.reason);
  console.groupEnd();
}

/**
 * Handle transaction error - logs and returns user-friendly message
 * 
 * @param {string} context - Context of the transaction
 * @param {Error} error - The error object
 * @returns {string} - User-friendly error message
 */
export function handleTransactionError(context, error) {
  logTransactionError(context, error);
  return getTransactionErrorMessage(error);
}

