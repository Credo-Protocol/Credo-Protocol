# Signature Verification Fix - Complete Documentation

**Date**: October 26, 2025  
**Status**: ✅ RESOLVED  
**Impact**: Critical - Credential submission to smart contract now working

---

## 🎯 Problem Summary

After implementing MOCA's official AIR Kit integration (Phase 5), credential submissions to the `CreditScoreOracle` smart contract were failing with:

```
Error: missing revert data (action="estimateGas", data=null, reason=null)
```

**Root Causes Identified**:
1. **Signature Format Mismatch**: Backend signature didn't match contract's verification logic
2. **Issuer Registration**: Derived issuer address from private key wasn't registered on-chain
3. **EIP-191 Prefix Handling**: Double-prefixing signature with Ethereum signed message format

---

## 🔍 Technical Deep Dive

### Contract's Signature Verification (Solidity)

```solidity
function verifyCredentialSignature(
    bytes memory credentialData,
    bytes memory signature,
    address issuer
) internal pure returns (bool) {
    bytes32 messageHash = keccak256(credentialData);              // Step 1: Hash data
    bytes32 ethSignedHash = messageHash.toEthSignedMessageHash(); // Step 2: Add EIP-191 prefix
    address recoveredSigner = ethSignedHash.recover(signature);   // Step 3: Recover signer
    return recoveredSigner == issuer;                             // Step 4: Verify match
}
```

**Contract Flow**:
1. Hash credential data with `keccak256`
2. Add Ethereum signed message prefix: `"\x19Ethereum Signed Message:\n32" + messageHash`
3. Recover signer from signature using ECDSA
4. Verify recovered signer == claimed issuer address

### Initial Backend Implementation (WRONG ❌)

```javascript
// WRONG: wallet.signMessage() adds prefix, contract ALSO adds prefix = double prefix!
const credentialDataHash = ethers.keccak256(credentialData);
const wallet = new ethers.Wallet(issuerPrivateKey);
const signature = await wallet.signMessage(ethers.getBytes(credentialDataHash));
```

**Problem**: `wallet.signMessage()` automatically adds the EIP-191 prefix, but the contract's `toEthSignedMessageHash()` also adds it → **double prefixing** → signature verification fails.

### Fixed Backend Implementation (CORRECT ✅)

```javascript
// CORRECT: Manual prefix matching contract's flow
const credentialDataHash = ethers.keccak256(credentialData);

// Add Ethereum signed message prefix (same as contract's toEthSignedMessageHash)
const ethSignedMessageHash = ethers.hashMessage(ethers.getBytes(credentialDataHash));

// Sign the prefixed hash directly (no double prefix)
const signingKey = new ethers.SigningKey(issuerPrivateKey);
const signature = signingKey.sign(ethSignedMessageHash).serialized;
```

**Backend Flow (Now Matches Contract)**:
1. Hash credential data with `keccak256`
2. Add Ethereum signed message prefix with `hashMessage()`
3. Sign the prefixed hash with `SigningKey.sign()`
4. Return serialized signature (65 bytes: r + s + v)

---

## 🛠️ Implementation Steps

### Step 1: Configure Issuer Private Keys

**File**: `backend/.env`

```bash
# Use your sandbox deployer private key for all issuers
# This ensures the derived address matches the registered issuer
MOCK_BANK_PRIVATE_KEY=xxx
MOCK_EMPLOYER_PRIVATE_KEY=xxx
MOCK_EXCHANGE_PRIVATE_KEY=xxx
```

**Why**: The private key derives to address `0x32F91E4xxxxx47F`, which is your deployer account and is already registered as an issuer in the contract.

### Step 2: Derive Issuer Addresses from Private Keys

**File**: `backend/src/routes/credentials.js`

```javascript
function getIssuerCredentials(credentialType) {
  // Derive issuer addresses from configured private keys to guarantee match
  const bankKey = process.env.MOCK_BANK_PRIVATE_KEY;
  const employerKey = process.env.MOCK_EMPLOYER_PRIVATE_KEY;
  const exchangeKey = process.env.MOCK_EXCHANGE_PRIVATE_KEY;

  const bankWallet = bankKey ? new ethers.Wallet(bankKey) : null;
  const employerWallet = employerKey ? new ethers.Wallet(employerKey) : null;
  const exchangeWallet = exchangeKey ? new ethers.Wallet(exchangeKey) : null;

  const issuerMap = {
    mockBank: {
      address: bankWallet?.address,  // Derived from private key
      privateKey: bankKey
    },
    mockEmployer: {
      address: employerWallet?.address,  // Derived from private key
      privateKey: employerKey
    },
    mockExchange: {
      address: exchangeWallet?.address,  // Derived from private key
      privateKey: exchangeKey
    }
  };
  
  // Map credential types to appropriate issuer
  if (credentialType.includes('bank')) return issuerMap.mockBank;
  if (credentialType.includes('income') || credentialType === 'employment') return issuerMap.mockEmployer;
  if (credentialType.includes('cex')) return issuerMap.mockExchange;
  return issuerMap.mockBank;
}
```

**Why**: Ensures the issuer address returned to the frontend exactly matches the address derived from the signing key, so signature verification succeeds.

### Step 3: Fix Signature Generation

**File**: `backend/src/routes/credentials.js` (in `/prepare` endpoint)

```javascript
// Encode credential data (same format as contract expects)
const credentialData = ethers.AbiCoder.defaultAbiCoder().encode(
  ['string', 'address', 'uint256', 'uint256'],
  [bucketValue, userAddress, issuanceDate, credentialMeta.weight]
);

// Hash and sign the credential data
// Contract: keccak256(credentialData) → toEthSignedMessageHash() → recover(signature)
// Backend must match: keccak256(credentialData) → add prefix → sign

const credentialDataHash = ethers.keccak256(credentialData);

// Add Ethereum signed message prefix (same as contract's toEthSignedMessageHash)
const ethSignedMessageHash = ethers.hashMessage(ethers.getBytes(credentialDataHash));

// Sign the prefixed hash
const signingKey = new ethers.SigningKey(issuerCreds.privateKey);
const signature = signingKey.sign(ethSignedMessageHash).serialized;

console.log(`[Credentials] Prepared ${credentialType} for ${userAddress}`);
console.log(`  Issuer: ${issuerCreds.address}`);
console.log(`  Bucket: ${bucketValue}`);
console.log(`  Signature: ${signature.substring(0, 20)}...`);
```

**Key Points**:
- Use `ethers.hashMessage()` to add EIP-191 prefix
- Sign with `SigningKey.sign()` directly (not `wallet.signMessage()`)
- Return `.serialized` to get proper 65-byte signature format

### Step 4: Verify Issuer is Registered

The contract requires:
```solidity
require(issuers[issuer].registered, "Issuer not registered");
require(issuers[issuer].isActive, "Issuer not active");
```

**Verification Script**: `contracts/scripts/check-issuers.ts`

```typescript
const oracle = await ethers.getContractAt("CreditScoreOracle", oracleAddress);
const isRegistered = await oracle.isIssuerRegistered(issuerAddress);
console.log(`Issuer ${issuerAddress}: ${isRegistered ? '✅ Registered' : '❌ NOT registered'}`);
```

**If not registered**, use the deployer account to register:

```typescript
await oracle.registerIssuer(
  issuerAddress,
  100,  // Full trust score
  "Issuer Name"
);
```

---

## ✅ Verification Checklist

Before credential submission works, verify:

- [ ] **Backend env configured**: All `MOCK_*_PRIVATE_KEY` vars set in `backend/.env`
- [ ] **Issuer addresses derived**: Backend derives addresses from private keys
- [ ] **Issuer registered on-chain**: Run `check-issuers.ts` to verify
- [ ] **Signature format correct**: 65 bytes (130 hex chars + '0x' = 132 total)
- [ ] **EIP-191 prefix added**: Using `ethers.hashMessage()` before signing
- [ ] **Credential type active**: EMPLOYMENT and other types registered in contract
- [ ] **Expiration in future**: `expirationTimestamp > block.timestamp`
- [ ] **Backend restarted**: After any env changes

---

## 🧪 Testing

### Test Credential Submission

1. **Start backend**: `cd backend && npm run dev`
2. **Start frontend**: `npm run dev`
3. **Login**: Use AIR Kit SSO (Google/Email/Wallet)
4. **Request credential**: Click "Connect & Verify" on any credential
5. **Check logs**:
   - Backend: `Prepared employment for 0x...`
   - Frontend: `Credential issued via AIR Kit`
   - Console: `Signature length: 132` ✅

### Expected Flow

```
1. User clicks "Connect & Verify"
2. Backend:
   - Encodes credential data
   - Hashes with keccak256
   - Adds EIP-191 prefix
   - Signs with issuer private key
   - Returns signature + metadata
3. AIR Kit:
   - Issues credential
   - Stores on MCSP
   - Adds to user's AIR wallet
4. Frontend:
   - Receives signed credential
   - Submits to CreditScoreOracle contract
5. Contract:
   - Validates issuer registered ✅
   - Validates credential type active ✅
   - Validates expiration future ✅
   - Verifies signature ✅
   - Stores credential
   - Updates credit score
6. Success! 🎉
```

---

## 🐛 Troubleshooting

### "Issuer not registered" Error

**Symptom**: Transaction reverts with no data during `estimateGas`

**Solution**:
```bash
cd contracts
npx hardhat run scripts/check-issuers.ts --network moca-devnet
# If not registered, register with deployer account
```

### "Invalid signature" Error

**Symptom**: Contract reverts with "Invalid signature"

**Causes**:
1. **Double prefixing**: Using `wallet.signMessage()` instead of `SigningKey.sign()`
2. **Wrong hash**: Not using `ethers.hashMessage()` to add prefix
3. **Mismatched issuer**: Derived address doesn't match claimed issuer

**Solution**: Use the correct signing flow shown in Step 3 above

### Signature Length Issues

**Symptom**: Signature is not 132 characters (65 bytes)

**Valid signature format**:
- 65 bytes = 130 hex characters
- Prefixed with '0x' = 132 total characters
- Format: `0x` + 64 chars (r) + 64 chars (s) + 2 chars (v)

**Example**: `0xaf2ac9b759b16daf4f2ac86be3a1bf8820f0624372bd7ef77c7eae6f5bd4b4d1598f88ac92f7651807a0341711a184c6bd040cc7d84bc191cfccc173051cf7231b`

---

## 📚 Related Documentation

- **EIP-191**: Signed Data Standard - https://eips.ethereum.org/EIPS/eip-191
- **ECDSA Signature Recovery**: OpenZeppelin ECDSA.sol
- **ethers.js Signing**: https://docs.ethers.org/v6/api/crypto/#Signature
- **Phase 5.2**: `PHASE5.2-BACKEND-REFACTOR.md` - Backend credential preparation
- **Phase 5.3**: `PHASE5.3-FRONTEND-INTEGRATION.md` - Frontend submission flow

---

## 🎓 Key Learnings

1. **Signature verification is exact**: Contract and backend must use identical hashing and prefix steps
2. **EIP-191 prefix is crucial**: Ethereum's standard for signed messages requires specific format
3. **Issuer registration is mandatory**: Contract enforces on-chain issuer registry
4. **Derived addresses must match**: Private key → address derivation must be consistent
5. **ethers.js helpers can mislead**: `wallet.signMessage()` adds prefix automatically, but contract also adds it

---

## ✨ Success Indicators

When working correctly, you'll see:

**Backend logs**:
```
[Credentials] Prepared employment for 0x24df9DD8b51B1C7137A656596C66784F72fbb5fc
  Issuer: 0x32F91E4E2c60A9C16cAE736D3b42152B331c147F
  Bucket: EMPLOYMENT
  Signature: 0xaf2ac9b759b16daf...
```

**Frontend logs**:
```
✅ Credential issued via AIR Kit
  - Stored on MCSP (decentralized storage)
  - Added to user's AIR wallet
  - Gas sponsored: false
  - View in Dashboard: https://developers.sandbox.air3.com/
```

**Smart Contract**:
```
✅ Transaction sent: 0x8a7ed23957ebab99...
✅ Transaction confirmed
📝 Credit score updated: 500 → 570 (+70 points)
```

---

## 🚀 Next Steps

Now that credential submission works:

1. ✅ Test all 10 credential types (bank, income, CEX, employment)
2. ✅ Verify credentials appear in AIR Kit Dashboard
3. ✅ Test credit score calculation with multiple credentials
4. ✅ Enable gas sponsorship (paymaster) for better UX
5. ✅ Test lending pool integration with updated scores
6. ✅ Prepare for Phase 6: Documentation & Demo

---

**Status**: ✅ COMPLETE - Credential submission fully operational!

**Last Updated**: October 26, 2025  
**Tested By**: Marcus  
**Environment**: MOCA Chain Devnet (Chain ID: 5151)

