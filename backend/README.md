# Credo Protocol Backend - Mock Issuer Service

Mock credential issuer service for the Credo Protocol hackathon MVP. Provides API endpoints for issuing verifiable credentials that can be submitted to the CreditScoreOracle smart contract.

## Overview

This backend simulates three types of credential issuers:

1. **Mock Exchange** - Issues "Proof of CEX History" credentials
2. **Mock Employer** - Issues "Proof of Employment" credentials  
3. **Mock Bank** - Issues "Proof of Stable Balance" credentials

Each issuer signs credentials using their private key (ethers.js), creating signatures that can be verified on-chain by the CreditScoreOracle contract.

## Setup

### Install Dependencies

```bash
npm install
```

### Configure Environment

Copy `.env.example` to `.env` and update if needed (default values work for the hackathon):

```bash
cp .env.example .env
```

The default private keys match the issuers registered in the CreditScoreOracle contract.

### Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3001`

## API Endpoints

### Health Check

```
GET /health
```

Returns server status and issuer information.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-12T...",
  "service": "Credo Protocol Mock Issuer Service",
  "issuers": [
    {
      "name": "Mock CEX",
      "address": "0x499CEB...",
      "credentialType": 2
    },
    ...
  ]
}
```

### Get Available Credential Types

```
GET /api/credentials/types
```

Returns all available credential types with metadata.

**Response:**
```json
{
  "success": true,
  "credentials": [
    {
      "id": 2,
      "name": "Mock CEX",
      "description": "Centralized Exchange Credential Issuer",
      "address": "0x499CEB...",
      "credentialType": 2,
      "credentialTypeName": "ProofOfCEXHistory",
      "scoreWeight": 80,
      "expirationDays": 180,
      "benefits": [
        "+80 points to credit score",
        "Demonstrates trading experience",
        "Valid for 6 months"
      ]
    },
    ...
  ]
}
```

### Request a Credential

```
POST /api/credentials/request
```

Issues a signed credential for a user.

**Request Body:**
```json
{
  "userAddress": "0x32F91E4E2c60A9C16cAE736D3b42152B331c147F",
  "credentialType": 2,
  "mockData": {
    "tradingVolume": "high",
    "accountAge": "2_years"
  }
}
```

**Response:**
```json
{
  "success": true,
  "credential": {
    "type": "ProofOfCEXHistory",
    "issuer": "0x499CEB...",
    "subject": "0x32F91E...",
    "credentialType": 2,
    "issuedAt": 1728973684,
    "expiresAt": 1744525684,
    "claims": {
      "tradingVolume": "high",
      "accountAge": "2_years",
      "neverLiquidated": true,
      "zkProof": "0x..."
    },
    "metadata": {
      "issuerName": "Mock CEX",
      "scoreWeight": 80,
      "expirationDays": 180
    }
  },
  "encodedData": "0x000000...",
  "signature": "0x1234...",
  "credentialHash": "0xabcd..."
}
```

### Get All Issuers

```
GET /api/credentials/issuers
```

Returns information about all registered issuers.

### Get Specific Issuer

```
GET /api/credentials/issuer/:type
```

Returns information about a specific issuer by credential type (1, 2, or 3).

## Credential Types

| Type | Name | Issuer | Points | Expiration |
|------|------|--------|--------|------------|
| 1 | Proof of Stable Balance | Mock Bank | 100 | 90 days |
| 2 | Proof of CEX History | Mock Exchange | 80 | 180 days |
| 3 | Proof of Employment | Mock Employer | 70 | 365 days |

## Architecture

### Directory Structure

```
backend/
├── src/
│   ├── issuers/           # Issuer class implementations
│   │   ├── MockExchangeIssuer.js
│   │   ├── MockEmployerIssuer.js
│   │   └── MockBankIssuer.js
│   ├── routes/            # API route handlers
│   │   └── credentials.js
│   ├── utils/             # Utility functions
│   │   └── credentialSigner.js
│   └── server.js          # Main server file
├── .env                   # Environment variables
├── .env.example           # Environment template
├── package.json
└── README.md
```

### How It Works

1. Frontend requests a credential for a user
2. Backend selects the appropriate issuer based on credential type
3. Issuer creates credential data structure
4. Credential data is encoded using ethers.js AbiCoder
5. Encoded data is hashed with keccak256
6. Hash is signed using issuer's private key (EIP-191)
7. Signed credential is returned to frontend
8. Frontend submits credential to CreditScoreOracle contract
9. Contract verifies signature and updates user's credit score

### Signature Format

The credential signature follows Ethereum's EIP-191 standard:

```
1. Encode: AbiCoder.encode(['address', 'address', 'uint256', 'uint256', 'uint256'], [...])
2. Hash: keccak256(encodedData)
3. Sign: wallet.signMessage(getBytes(hash))
```

This creates a signature that can be verified on-chain using ecrecover.

## Testing

### Manual Testing

Start the server and test with curl:

```bash
# Health check
curl http://localhost:3001/health

# Get credential types
curl http://localhost:3001/api/credentials/types

# Request a credential
curl -X POST http://localhost:3001/api/credentials/request \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x32F91E4E2c60A9C16cAE736D3b42152B331c147F",
    "credentialType": 2
  }'
```

### Integration Testing

Test with the frontend:

1. Start the backend: `npm run dev`
2. Start the frontend: `cd .. && npm run dev`
3. Open browser to `http://localhost:3000`
4. Request a credential through the UI
5. Verify the credential is signed correctly
6. Submit to the smart contract

## Production Considerations

This is a **mock implementation for hackathon purposes**. In production, you would need:

1. **Real Data Integration**
   - Connect to actual exchange APIs
   - Integrate with HR/payroll systems
   - Use Plaid or similar for banking data

2. **Authentication & Authorization**
   - User authentication (OAuth, JWT)
   - Rate limiting
   - API key management

3. **Zero-Knowledge Proofs**
   - Implement real ZK circuits
   - Prove statements without revealing data
   - Use libraries like snarkjs or circom

4. **Security**
   - Secure private key storage (KMS)
   - Input validation
   - SQL injection protection
   - HTTPS/TLS

5. **Scalability**
   - Database for credential storage
   - Caching layer
   - Load balancing
   - Monitoring and logging

## License

MIT

