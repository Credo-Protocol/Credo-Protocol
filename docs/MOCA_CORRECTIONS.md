# Moca Network Documentation Corrections for IMPLEMENTATION.md

Based on official Moca Network documentation, the following corrections need to be made:

## 1. Moca Chain Network Configuration

### USING DEVNET (For Developers)

From official docs: https://docs.moca.network/mocachain/using-moca-chain/network-information

```javascript
const mocaDevnet = {
  id: 5151, // Official Moca Chain Devnet Chain ID (0x141F)
  name: 'Moca Chain Devnet',
  network: 'moca-devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MOCA',
    symbol: 'MOCA',
  },
  rpcUrls: {
    default: { http: ['http://devnet-rpc.mocachain.org'] },
    public: { http: ['http://devnet-rpc.mocachain.org'] },
  },
  blockExplorers: {
    default: { 
      name: 'Moca Chain Explorer', 
      url: 'https://devnet-scan.mocachain.org'
    },
  },
  testnet: true,
};
```

**Note:** Devnet is specifically for developers. Testnet is also available:
- **Testnet Chain ID:** 222888 (0x366a8)
- **Testnet RPC:** http://testnet-rpc.mocachain.org
- **Testnet Explorer:** https://testnet-scan.mocachain.org

## 2. Environment Variables

### CORRECT (Devnet - From Docs):
```bash
NEXT_PUBLIC_RPC_URL=http://devnet-rpc.mocachain.org
NEXT_PUBLIC_EXPLORER_URL=https://devnet-scan.mocachain.org
NEXT_PUBLIC_CHAIN_ID=5151
NEXT_PUBLIC_FAUCET_URL=https://devnet-scan.mocachain.org/faucet
```

## 3. AIR Kit SDK Installation & Setup

### ADD to Dependencies Section (Phase 3.1):

```bash
# Install AIR Kit SDK
npm install @mocanetwork/airkit

# For Wagmi integration
npm install @mocanetwork/airkit-connector

# Core dependencies
npm install ethers@6 wagmi viem @tanstack/react-query
```

### AIR Kit Configuration File

Create `lib/airkit.js`:

```javascript
import { AirService, BUILD_ENV } from "@mocanetwork/airkit";

// Initialize AIR Service
export const airService = new AirService({
  partnerId: process.env.NEXT_PUBLIC_PARTNER_ID,
});

// Initialize AIR Kit
export async function initializeAirKit() {
  await airService.init({
    buildEnv: BUILD_ENV.SANDBOX, // Use SANDBOX for testnet
    enableLogging: true, // Enable for development
    skipRehydration: false // Allow automatic re-login
  });
}

// Login with AIR Kit
export async function loginWithAirKit() {
  const loginResult = await airService.login();
  return loginResult; // Returns: { isLoggedIn, id, abstractAccountAddress, token, isMFASetup }
}

// Check if user is logged in
export function isUserLoggedIn() {
  return airService.isLoggedIn;
}

// Logout
export async function logout() {
  await airService.logout();
}

// Get user info
export async function getUserInfo() {
  return await airService.getUserInfo();
}
```

## 4. AIR Credential Services Integration

### For Issuing Credentials (Backend):

```javascript
// backend/src/services/CredentialService.js
import { AirService, BUILD_ENV } from "@mocanetwork/airkit";

class CredentialService {
  constructor() {
    this.airService = new AirService({
      partnerId: process.env.PARTNER_ID
    });
  }

  async init() {
    await this.airService.init({
      buildEnv: BUILD_ENV.SANDBOX
    });
  }

  async issueCredential(userAddress, credentialSubject, programId, issuerDid) {
    // Generate Partner JWT with scope=issue
    const authToken = this.generatePartnerJWT({ scope: 'issue' });

    await this.airService.issueCredential({
      authToken,
      issuerDid,
      credentialId: programId,
      credentialSubject
    });
  }

  generatePartnerJWT({ scope }) {
    const jwt = require('jsonwebtoken');
    const payload = {
      partnerId: process.env.PARTNER_ID,
      scope, // 'issue' or 'verify'
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };
    return jwt.sign(payload, process.env.PARTNER_PRIVATE_KEY);
  }
}
```

### For Verifying Credentials (Frontend):

```javascript
// In your React component
import { airService } from '@/lib/airkit';

async function verifyUserCredential(programId) {
  const authToken = await getPartnerJWT({ scope: 'verify' });
  
  const result = await airService.verifyCredential({
    authToken,
    programId, // From Developer Dashboard
    redirectUrl: window.location.href
  });

  // result contains: { status, payload }
  // status can be: "Compliant", "Non-Compliant", "Expired", "Revoked"
  return result;
}
```

## 5. Developer Dashboard & Partner ID

### Required Setup:

1. **Get Partner ID:**
   - Go to https://developers.sandbox.air3.com/
   - Connect your wallet
   - Navigate to Account → General
   - Copy your Partner ID

2. **Set up Credential Programs:**
   - **For Issuers:** Create Issuance Programs
     - Define schemas for credentials
     - Get Issuer DID
     - Get Program ID
   
   - **For Verifiers:** Create Verification Programs
     - Define verification conditions
     - Set up query logic
     - Get Program ID

3. **Generate Private Key for JWT:**
   - Used to sign Partner JWTs
   - Store securely in backend environment variables

## 6. Updated Environment Variables (Complete List)

```bash
# .env.local (Frontend)
NEXT_PUBLIC_RPC_URL=http://testnet-rpc.mocachain.org
NEXT_PUBLIC_EXPLORER_URL=https://testnet-scan.mocachain.org
NEXT_PUBLIC_CHAIN_ID=222888
NEXT_PUBLIC_FAUCET_URL=https://testnet-scan.mocachain.org/faucet

NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x...
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x...

NEXT_PUBLIC_PARTNER_ID=your_partner_id_from_dashboard
NEXT_PUBLIC_ISSUER_API=http://localhost:3001

# .env (Backend)
PARTNER_ID=your_partner_id
PARTNER_PRIVATE_KEY=your_private_key_for_jwt_signing

ISSUER_DID=your_issuer_did_from_dashboard
ISSUER_PROGRAM_ID=your_program_id_from_dashboard

MOCK_EXCHANGE_PRIVATE_KEY=0x...
MOCK_EMPLOYER_PRIVATE_KEY=0x...
MOCK_BANK_PRIVATE_KEY=0x...

RPC_URL=http://devnet-rpc.mocachain.org
```

## 7. Connect Button Component (Correct Implementation)

```jsx
// components/auth/ConnectButton.js
import { useEffect, useState } from 'react';
import { airService } from '@/lib/airkit';
import { Button } from '@/components/ui/button';

export function ConnectButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize AIR Kit on mount
    initAirKit();
  }, []);

  async function initAirKit() {
    try {
      await airService.init({
        buildEnv: 'SANDBOX',
        enableLogging: true
      });
      
      // Check if user is already logged in (rehydration)
      if (airService.isLoggedIn) {
        setIsLoggedIn(true);
        const info = await airService.getUserInfo();
        setUserInfo(info);
      }
    } catch (error) {
      console.error('Failed to initialize AIR Kit:', error);
    }
  }

  async function handleLogin() {
    try {
      setLoading(true);
      const loginResult = await airService.login();
      
      if (loginResult.isLoggedIn) {
        setIsLoggedIn(true);
        const info = await airService.getUserInfo();
        setUserInfo(info);
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await airService.logout();
      setIsLoggedIn(false);
      setUserInfo(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  if (isLoggedIn && userInfo) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <div className="font-medium">{userInfo.user.email || 'User'}</div>
          <div className="text-gray-500 text-xs">
            {userInfo.user.abstractAccountAddress?.slice(0, 6)}...
            {userInfo.user.abstractAccountAddress?.slice(-4)}
          </div>
        </div>
        <Button onClick={handleLogout} variant="outline">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleLogin} disabled={loading}>
      {loading ? 'Connecting...' : 'Login with Moca ID'}
    </Button>
  );
}
```

## 8. Key Concepts from Moca Docs

### AIR Account Services:
- **Purpose:** User authentication, SSO, wallet management
- **Login Methods:** Google, Passwordless Email, Wallet Login
- **Session Management:** Automatic (30-day sessions by default)
- **Returns:** User UUID, session token, abstract account address

### AIR Credential Services:
- **Purpose:** Issue, verify, and consume zero-knowledge credentials
- **Issuance Flow:**
  1. Create program on Developer Dashboard
  2. Collect user data securely
  3. Generate Partner JWT with scope=issue
  4. Call `issueCredential()`
  
- **Verification Flow:**
  1. Create verification program on Dashboard
  2. Define query conditions
  3. Generate Partner JWT with scope=verify
  4. Call `verifyCredential()`

### Zero-Knowledge Proofs:
- User generates proof from credential
- Proof submitted to Moca Chain smart contract
- Validates without revealing personal data
- On-chain verification result

## 9. Important Notes

1. **Build Environment:**
   - Use `BUILD_ENV.SANDBOX` for testnet/development
   - Switch to production environment for mainnet

2. **Partner JWT:**
   - Must be generated on backend (never expose private key in frontend)
   - Include scope: 'issue' or 'verify'
   - Short expiration time (1 hour recommended)

3. **Credential Storage:**
   - Encrypted credentials stored in decentralized storage
   - Private keys stay client-side
   - No sensitive data exposed to Moca servers

4. **Chain Information:**
   - **Devnet Chain ID:** 5151 (0x141F) ← Using Devnet for development
   - **Testnet Chain ID:** 222888 (0x366a8) ← Also available
   - Block time: ~1 second
   - EVM compatible (Evmos-based)
   - Supports Solidity contracts

5. **Gas Tokens:**
   - Native token: $MOCA
   - Get devnet tokens from faucet: https://devnet-scan.mocachain.org/faucet

## 10. References

- **Moca Network Docs:** https://docs.moca.network/
- **AIR Kit Quickstart:** https://docs.moca.network/airkit/quickstart
- **Developer Dashboard:** https://developers.sandbox.air3.com/
- **Devnet Explorer:** https://devnet-scan.mocachain.org
- **Testnet Explorer:** https://testnet-scan.mocachain.org (alternative)
- **Example Repository:** https://github.com/MocaNetwork/air-credential-example

