# Phase 5.1: AIR Kit Dashboard Setup

**Day**: 3 Morning (Oct 27)  
**Duration**: 2 hours  
**Prerequisites**: Phases 1-4 Complete  
**Next**: Phase 5.2 (Backend Refactor)

---

## 🎯 Goal

Register your project as an official MOCA credential issuer and verifier in the AIR Kit Dashboard. This establishes your project's identity in the MOCA ecosystem and unlocks gas sponsorship.

**Why This Phase**: Without official Issuer DIDs and schemas, your credentials won't be recognized by the MOCA ecosystem. This is the foundation for true integration.

**What You'll Get**:
- ✅ 3 Official Issuer DIDs (Bank, Employment, CEX)
- ✅ 1 Verifier DID for credit score oracle
- ✅ 10 Published credential schemas
- ✅ 10 Verifier programs
- ✅ Gas sponsorship enabled (paymaster)
- ✅ Partner secret for backend JWT

---

## 📋 What You're Creating

By the end of this phase, you'll have:

```yaml
Issuers:
  - Bank Balance Issuer (DID: did:moca:...)
  - Employment Issuer (DID: did:moca:...)
  - CEX History Issuer (DID: did:moca:...)

Verifier:
  - Credo Protocol (DID: did:moca:...)

Schemas:
  - 4 Bank Balance schemas (High/Medium/Low/Minimal)
  - 4 Income Range schemas (High/Medium/Low/Minimal)
  - 2 Legacy schemas (CEX/Employment)

Verifier Programs:
  - 10 programs (one per schema)

Gas Sponsorship:
  - Paymaster enabled
  - Policy configured
  - Wallet funded
```

---

## 🛠️ Step-by-Step Instructions

### Step 1: Access AIR Kit Dashboard (5 min)

**URL**: [https://developers.sandbox.air3.com/](https://developers.sandbox.air3.com/)

1. Open the dashboard in your browser
2. Click "Login with Moca ID"
3. Use your existing Google/Email account (same as your app)
4. You should see your existing partner account

**Verify Your Partner ID**:
- Go to Settings → API Keys
- You should see your Partner ID (already in `.env.local`)
- If you don't have one, click "Create Partner Account"

**Save for Reference**:
```bash
PARTNER_ID=[your-existing-partner-id]
```

---

### Step 2: Register Issuer #1 - Bank Balance (15 min)

**Dashboard Path**: Credentials → Issuers → Create New Issuer

#### Configuration

```yaml
Issuer Name: Credo Bank Balance Issuer
Description: Issues privacy-preserving bank balance credentials in 4 bucketed ranges (High: $10k+, Medium: $5k-$10k, Low: $1k-$5k, Minimal: <$1k). Credentials prove financial stability without revealing exact amounts.
Category: Financial Services
Type: Automated Issuer
Trust Level: Sandbox (request Verified after testing)
Contact Email: [your-email]
Website: https://credo-protocol.vercel.app
Logo URL: [optional - can add later]
```

#### Steps

1. Click **"Create New Issuer"** button
2. Fill in all fields (copy from configuration above)
3. Click **"Submit"**
4. Wait for DID generation (5-10 seconds)
5. **IMPORTANT**: Copy the generated DID immediately

**Save to Notes** (you'll add to backend `.env` later):
```bash
BANK_ISSUER_DID=did:moca:...[your-generated-did]
```

#### Top Up Fee Wallet

1. On the issuer details page, find "Fee Wallet"
2. Copy the wallet address
3. Open [Moca Devnet Faucet](https://devnet-scan.mocachain.org/faucet)
4. Paste wallet address
5. Request 100 test MOCA
6. Confirm transaction
7. Return to dashboard - balance should update

**Status Check**: ✅ Bank Issuer DID created and funded

---

### Step 3: Register Issuer #2 - Employment/Income (15 min)

**Dashboard Path**: Credentials → Issuers → Create New Issuer

#### Configuration

```yaml
Issuer Name: Credo Employment Issuer
Description: Issues income range credentials without revealing exact salary (High: $8k+/mo, Medium: $5k-$8k/mo, Low: $3k-$5k/mo, Minimal: <$3k/mo). Also issues proof of employment credentials.
Category: Employment & Identity
Type: Automated Issuer
Trust Level: Sandbox
Contact Email: [your-email]
Website: https://credo-protocol.vercel.app
Logo URL: [optional]
```

#### Steps

1. Click **"Create New Issuer"**
2. Fill in all fields
3. Submit and wait for DID
4. **Copy the DID**

**Save to Notes**:
```bash
EMPLOYMENT_ISSUER_DID=did:moca:...[your-generated-did]
```

#### Top Up Fee Wallet

1. Copy fee wallet address from issuer page
2. Use faucet to send 100 test MOCA
3. Confirm balance updated

**Status Check**: ✅ Employment Issuer DID created and funded

---

### Step 4: Register Issuer #3 - CEX History (15 min)

**Dashboard Path**: Credentials → Issuers → Create New Issuer

#### Configuration

```yaml
Issuer Name: Credo CEX History Issuer
Description: Issues exchange trading history credentials proving active participation in cryptocurrency markets. Verifies user has trading history on centralized exchanges.
Category: Financial Services
Type: Automated Issuer
Trust Level: Sandbox
Contact Email: [your-email]
Website: https://credo-protocol.vercel.app
Logo URL: [optional]
```

#### Steps

1. Click **"Create New Issuer"**
2. Fill in all fields
3. Submit and wait for DID
4. **Copy the DID**

**Save to Notes**:
```bash
CEX_ISSUER_DID=did:moca:...[your-generated-did]
```

#### Top Up Fee Wallet

1. Copy fee wallet address
2. Use faucet to send 100 test MOCA
3. Confirm balance updated

**Status Check**: ✅ CEX Issuer DID created and funded

---

### Step 5: Register Verifier (15 min)

**Dashboard Path**: Credentials → Verifiers → Create New Verifier

#### Configuration

```yaml
Verifier Name: Credo Protocol
Description: Verifies credentials for credit score calculation in undercollateralized lending. Automated on-chain verification via CreditScoreOracle smart contract.
Purpose: Credit Scoring & DeFi Lending
Verification Method: On-Chain Smart Contract
Smart Contract: [Your CreditScoreOracle address]
Contact Email: [your-email]
Website: https://credo-protocol.vercel.app
Logo URL: [optional]
```

#### Steps

1. Click **"Create New Verifier"**
2. Fill in all fields
3. For "Smart Contract" field, use your deployed oracle address:
   ```
   0x82Adc3540672eA15C2B9fF9dFCf01BF8d81F2Cd2
   ```
4. Submit and wait for DID
5. **Copy the Verifier DID**

**Save to Notes**:
```bash
VERIFIER_DID=did:moca:...[your-generated-did]
```

#### Top Up Verifier Fee Wallet

1. Copy verifier fee wallet address
2. Use faucet to send 100 test MOCA
3. Confirm balance updated

**Status Check**: ✅ Verifier DID created and funded

---

### Step 6: Create Credential Schemas (45 min)

**Dashboard Path**: Credentials → Schemas → Create Schema

You need to create **10 schemas total**. I'll provide detailed templates for the first few, then a checklist for the rest.

---

#### Schema 1: Bank Balance - High

**Configuration**:

```json
{
  "schemaName": "Credo Bank Balance - High",
  "schemaVersion": "1.0.0",
  "schemaDescription": "Proves 30-day average bank balance of $10,000 or more without revealing exact amount. Privacy-preserving bucketed credential.",
  "schemaType": "BankBalance",
  "category": "Financial",
  "privacyLevel": "Bucketed",
  "issuerDid": "[PASTE YOUR BANK_ISSUER_DID HERE]",
  "credentialSubject": {
    "type": "object",
    "properties": {
      "balanceBucket": {
        "type": "string",
        "enum": ["BANK_BALANCE_HIGH"],
        "description": "Balance bucket classification"
      },
      "bucketRange": {
        "type": "string",
        "const": "$10,000+",
        "description": "Human-readable range (exact amount not disclosed)"
      },
      "weight": {
        "type": "integer",
        "const": 150,
        "description": "Credit score weight for this credential"
      },
      "verifiedAt": {
        "type": "integer",
        "description": "Unix timestamp of verification"
      },
      "dataSource": {
        "type": "string",
        "const": "Plaid API",
        "description": "Source of financial data"
      },
      "period": {
        "type": "string",
        "const": "30 days",
        "description": "Averaging period for balance calculation"
      }
    },
    "required": ["balanceBucket", "bucketRange", "weight", "verifiedAt"]
  }
}
```

**Steps**:
1. Click **"Create Schema"**
2. Copy the JSON above
3. Replace `[PASTE YOUR BANK_ISSUER_DID HERE]` with your actual Bank Issuer DID
4. Paste into schema editor
5. Click **"Validate"** to check JSON syntax
6. Click **"Submit"**
7. **Copy the generated Schema ID**

**Save to Notes**:
```bash
SCHEMA_BANK_HIGH=schema:moca:...[generated-id]
```

---

#### Schema 2: Bank Balance - Medium

```json
{
  "schemaName": "Credo Bank Balance - Medium",
  "schemaVersion": "1.0.0",
  "schemaDescription": "Proves 30-day average bank balance of $5,000-$10,000 without revealing exact amount.",
  "schemaType": "BankBalance",
  "category": "Financial",
  "privacyLevel": "Bucketed",
  "issuerDid": "[PASTE YOUR BANK_ISSUER_DID HERE]",
  "credentialSubject": {
    "type": "object",
    "properties": {
      "balanceBucket": {
        "type": "string",
        "enum": ["BANK_BALANCE_MEDIUM"]
      },
      "bucketRange": {
        "type": "string",
        "const": "$5,000 - $10,000"
      },
      "weight": {
        "type": "integer",
        "const": 120
      },
      "verifiedAt": {
        "type": "integer"
      },
      "dataSource": {
        "type": "string",
        "const": "Plaid API"
      },
      "period": {
        "type": "string",
        "const": "30 days"
      }
    },
    "required": ["balanceBucket", "bucketRange", "weight", "verifiedAt"]
  }
}
```

**Steps**: Same as Schema 1, save as `SCHEMA_BANK_MEDIUM`

---

#### Schema 3: Bank Balance - Low

```json
{
  "schemaName": "Credo Bank Balance - Low",
  "schemaVersion": "1.0.0",
  "schemaDescription": "Proves 30-day average bank balance of $1,000-$5,000 without revealing exact amount.",
  "schemaType": "BankBalance",
  "category": "Financial",
  "privacyLevel": "Bucketed",
  "issuerDid": "[PASTE YOUR BANK_ISSUER_DID HERE]",
  "credentialSubject": {
    "type": "object",
    "properties": {
      "balanceBucket": {"type": "string", "enum": ["BANK_BALANCE_LOW"]},
      "bucketRange": {"type": "string", "const": "$1,000 - $5,000"},
      "weight": {"type": "integer", "const": 80},
      "verifiedAt": {"type": "integer"},
      "dataSource": {"type": "string", "const": "Plaid API"},
      "period": {"type": "string", "const": "30 days"}
    },
    "required": ["balanceBucket", "bucketRange", "weight", "verifiedAt"]
  }
}
```

**Steps**: Same process, save as `SCHEMA_BANK_LOW`

---

#### Schema 4: Bank Balance - Minimal

```json
{
  "schemaName": "Credo Bank Balance - Minimal",
  "schemaVersion": "1.0.0",
  "schemaDescription": "Proves 30-day average bank balance under $1,000.",
  "schemaType": "BankBalance",
  "category": "Financial",
  "privacyLevel": "Bucketed",
  "issuerDid": "[PASTE YOUR BANK_ISSUER_DID HERE]",
  "credentialSubject": {
    "type": "object",
    "properties": {
      "balanceBucket": {"type": "string", "enum": ["BANK_BALANCE_MINIMAL"]},
      "bucketRange": {"type": "string", "const": "Under $1,000"},
      "weight": {"type": "integer", "const": 40},
      "verifiedAt": {"type": "integer"},
      "dataSource": {"type": "string", "const": "Plaid API"},
      "period": {"type": "string", "const": "30 days"}
    },
    "required": ["balanceBucket", "bucketRange", "weight", "verifiedAt"]
  }
}
```

**Steps**: Same process, save as `SCHEMA_BANK_MINIMAL`

---

#### Schemas 5-8: Income Range

Follow the same pattern, but replace:
- `issuerDid`: Use `EMPLOYMENT_ISSUER_DID`
- `balanceBucket` → `incomeBucket`
- `bucketRange`: Use income ranges
- `dataSource`: Use "Mock Employer"
- `period`: Use "Monthly"

**Quick Reference**:

| Schema | Bucket Name | Range | Weight | Save As |
|--------|-------------|-------|--------|---------|
| 5 | INCOME_HIGH | $8,000+/month | 180 | SCHEMA_INCOME_HIGH |
| 6 | INCOME_MEDIUM | $5,000-$8,000/month | 140 | SCHEMA_INCOME_MEDIUM |
| 7 | INCOME_LOW | $3,000-$5,000/month | 100 | SCHEMA_INCOME_LOW |
| 8 | INCOME_MINIMAL | Under $3,000/month | 50 | SCHEMA_INCOME_MINIMAL |

---

#### Schema 9: CEX History

```json
{
  "schemaName": "Credo CEX Trading History",
  "schemaVersion": "1.0.0",
  "schemaDescription": "Proves active trading history on centralized exchanges.",
  "schemaType": "ExchangeHistory",
  "category": "Financial",
  "privacyLevel": "Metadata",
  "issuerDid": "[PASTE YOUR CEX_ISSUER_DID HERE]",
  "credentialSubject": {
    "type": "object",
    "properties": {
      "credentialType": {"type": "string", "const": "CEX_HISTORY"},
      "weight": {"type": "integer", "const": 80},
      "verifiedAt": {"type": "integer"},
      "dataSource": {"type": "string", "const": "Mock Exchange"}
    },
    "required": ["credentialType", "weight", "verifiedAt"]
  }
}
```

**Steps**: Use CEX_ISSUER_DID, save as `SCHEMA_CEX_HISTORY`

---

#### Schema 10: Proof of Employment

```json
{
  "schemaName": "Credo Proof of Employment",
  "schemaVersion": "1.0.0",
  "schemaDescription": "Proves current employment status without revealing employer details.",
  "schemaType": "Employment",
  "category": "Employment",
  "privacyLevel": "Basic",
  "issuerDid": "[PASTE YOUR EMPLOYMENT_ISSUER_DID HERE]",
  "credentialSubject": {
    "type": "object",
    "properties": {
      "credentialType": {"type": "string", "const": "EMPLOYMENT"},
      "weight": {"type": "integer", "const": 70},
      "verifiedAt": {"type": "integer"},
      "dataSource": {"type": "string", "const": "Mock Employer"}
    },
    "required": ["credentialType", "weight", "verifiedAt"]
  }
}
```

**Steps**: Use EMPLOYMENT_ISSUER_DID, save as `SCHEMA_EMPLOYMENT`

---

**Schema Creation Checklist**:

```markdown
Bank Balance Schemas (Use BANK_ISSUER_DID):
- [ ] SCHEMA_BANK_HIGH ($10k+, weight: 150)
- [ ] SCHEMA_BANK_MEDIUM ($5k-$10k, weight: 120)
- [ ] SCHEMA_BANK_LOW ($1k-$5k, weight: 80)
- [ ] SCHEMA_BANK_MINIMAL (<$1k, weight: 40)

Income Range Schemas (Use EMPLOYMENT_ISSUER_DID):
- [ ] SCHEMA_INCOME_HIGH ($8k+/mo, weight: 180)
- [ ] SCHEMA_INCOME_MEDIUM ($5k-$8k/mo, weight: 140)
- [ ] SCHEMA_INCOME_LOW ($3k-$5k/mo, weight: 100)
- [ ] SCHEMA_INCOME_MINIMAL (<$3k/mo, weight: 50)

Legacy Schemas:
- [ ] SCHEMA_CEX_HISTORY (Use CEX_ISSUER_DID, weight: 80)
- [ ] SCHEMA_EMPLOYMENT (Use EMPLOYMENT_ISSUER_DID, weight: 70)
```

**Status Check**: ✅ All 10 schemas created and Schema IDs saved

---

### Step 7: Create Verifier Programs (30 min)

**Dashboard Path**: Credentials → Verifier Programs → Create Program

For each of your 10 schemas, you need to create a matching verifier program.

#### Template for All Programs

```yaml
Program Name: Verify [Schema Name]
Description: Verify [schema description] for credit score calculation
Verifier DID: [YOUR_VERIFIER_DID]
Associated Schema: [SELECT FROM DROPDOWN]
Verification Rules:
  - Credential must be valid and not expired
  - Issuer must be trusted (in your issuer list)
  - Credential must not be revoked
  - Subject must match the requester address
Acceptance Criteria:
  - Issuer reputation score > 0
  - Credential age < 1 year
  - No revocation on record
Auto-Accept: Yes (for testing)
```

#### Create All 10 Programs

**Quick Creation Process**:

1. Click **"Create Verifier Program"**
2. Fill in:
   - Program Name: `Verify Bank Balance - High`
   - Description: `Verify high bank balance credential for credit scoring`
   - Verifier DID: Select your verifier
   - Associated Schema: Select `SCHEMA_BANK_HIGH` from dropdown
3. Set verification rules (use template above)
4. Enable "Auto-Accept" for testing
5. Click **"Submit"**
6. **Copy the Program ID**

**Repeat for all 10 schemas**.

**Save to Notes**:
```bash
VERIFIER_PROGRAM_BANK_HIGH=[program-id]
VERIFIER_PROGRAM_BANK_MEDIUM=[program-id]
VERIFIER_PROGRAM_BANK_LOW=[program-id]
VERIFIER_PROGRAM_BANK_MINIMAL=[program-id]
VERIFIER_PROGRAM_INCOME_HIGH=[program-id]
VERIFIER_PROGRAM_INCOME_MEDIUM=[program-id]
VERIFIER_PROGRAM_INCOME_LOW=[program-id]
VERIFIER_PROGRAM_INCOME_MINIMAL=[program-id]
VERIFIER_PROGRAM_CEX_HISTORY=[program-id]
VERIFIER_PROGRAM_EMPLOYMENT=[program-id]
```

**Verifier Programs Checklist**:
```markdown
- [ ] Verify Bank Balance - High
- [ ] Verify Bank Balance - Medium
- [ ] Verify Bank Balance - Low
- [ ] Verify Bank Balance - Minimal
- [ ] Verify Income Range - High
- [ ] Verify Income Range - Medium
- [ ] Verify Income Range - Low
- [ ] Verify Income Range - Minimal
- [ ] Verify CEX History
- [ ] Verify Proof of Employment
```

**Status Check**: ✅ All 10 verifier programs created

---

### Step 8: Enable Gas Sponsorship (20 min)

**Dashboard Path**: Settings → Gas Sponsorship → Configure Paymaster

#### Request Paymaster Access

**IMPORTANT**: Gas sponsorship may need to be enabled by MOCA team.

1. Go to Settings → Gas Sponsorship
2. If you see "Request Access" button:
   - Click it
   - Fill in the form:
     ```
     Project Name: Credo Protocol
     Use Case: Sponsor credential issuance transactions for lending protocol
     Expected Monthly Users: 100-500
     Expected Transactions/User: 5-10
     Reason: Improve UX by removing need for users to have MOCA tokens
     ```
   - Submit request
   - **Contact MOCA Discord** #dev-chat: "Requesting paymaster access for Credo Protocol (Partner ID: [your-id])"

3. If already enabled, proceed to configuration

#### Configure Paymaster Policy

```yaml
Policy Name: Credo Credential Sponsorship
Status: Enabled

Sponsorship Rules:
  Sponsor Credential Issuance: YES
  Sponsor Credential Verification: YES
  Sponsor First Transaction: YES
  
Spending Limits:
  Global Monthly Limit: 1000 MOCA
  Per-User Monthly Limit: 10 MOCA
  Per-Transaction Limit: 0.5 MOCA
  
Reset Period: Monthly (1st of each month)

Allowlist:
  Contract Functions:
    - All AIR Kit credential functions (auto-included)
    - submitCredential() [0x82Adc3540672eA15C2B9fF9dFCf01BF8d81F2Cd2]
  
  Transaction Types:
    - Credential issuance
    - Credential submission to oracle
    
Time Schedule:
  Start: Immediately
  End: No end date (continuous)
  
Priority: Normal
```

#### Steps

1. Click **"Create Policy"**
2. Fill in configuration (copy from above)
3. For contract allowlist:
   - Add your CreditScoreOracle address: `0x82Adc3540672eA15C2B9fF9dFCf01BF8d81F2Cd2`
   - Select function: `submitCredential`
4. Click **"Save Policy"**
5. Copy the Policy ID

**Save to Notes**:
```bash
PAYMASTER_POLICY_ID=[policy-id]
```

#### Fund Paymaster Wallet

1. On paymaster page, find "Paymaster Wallet"
2. Copy wallet address
3. Use faucet to send **500 test MOCA** (more than others because it sponsors user transactions)
4. Confirm balance shows ~500 MOCA

**Status Check**: ✅ Gas sponsorship enabled and funded

---

### Step 9: Generate Partner Secret (10 min)

**Dashboard Path**: Settings → API Keys → Create Secret

#### Configuration

```yaml
Secret Name: Backend JWT Signing Key
Description: Used by backend to generate Partner JWTs for credential issuance
Scopes:
  - issue (credential issuance)
  - verify (credential verification)
Expiration: No expiration
IP Whitelist: [leave empty for development]
Environments: Sandbox
```

#### Steps

1. Click **"Generate New Secret"**
2. Fill in configuration
3. Click **"Generate"**
4. **CRITICAL**: Copy the secret **IMMEDIATELY** (shown only once!)
5. Save to secure location

**Save to Notes**:
```bash
PARTNER_SECRET=[long-generated-secret-key]
```

**⚠️ WARNING**: If you lose this secret, you'll need to regenerate and update backend.

**Status Check**: ✅ Partner secret generated and saved

---

## ✅ Phase 5.1 Completion Checklist

Before proceeding to Phase 5.2, verify:

### Dashboard Setup
- [ ] Accessed AIR Kit Dashboard successfully
- [ ] Partner ID confirmed

### Issuers
- [ ] Bank Balance Issuer DID created
- [ ] Employment Issuer DID created
- [ ] CEX History Issuer DID created
- [ ] All 3 issuer fee wallets funded (100 MOCA each)

### Verifier
- [ ] Verifier DID created
- [ ] Verifier fee wallet funded (100 MOCA)

### Schemas
- [ ] 4 Bank Balance schemas created
- [ ] 4 Income Range schemas created
- [ ] 2 Legacy schemas created
- [ ] All 10 Schema IDs saved to notes

### Verifier Programs
- [ ] 10 Verifier programs created (one per schema)
- [ ] All program IDs saved to notes

### Gas Sponsorship
- [ ] Paymaster access requested/granted
- [ ] Sponsorship policy configured
- [ ] Paymaster wallet funded (500 MOCA)
- [ ] Policy ID saved

### Credentials
- [ ] Partner secret generated
- [ ] Partner secret saved securely

---

## 📝 Consolidated Environment Variables

**Save all of these for Phase 5.2** (Backend Refactor):

```bash
# Partner Authentication
PARTNER_ID=[from-dashboard]
PARTNER_SECRET=[generated-secret]

# Issuer DIDs
BANK_ISSUER_DID=did:moca:...[from-step-2]
EMPLOYMENT_ISSUER_DID=did:moca:...[from-step-3]
CEX_ISSUER_DID=did:moca:...[from-step-4]

# Verifier
VERIFIER_DID=did:moca:...[from-step-5]

# Schema IDs - Bank Balance
SCHEMA_BANK_HIGH=schema:moca:...[from-step-6]
SCHEMA_BANK_MEDIUM=schema:moca:...[from-step-6]
SCHEMA_BANK_LOW=schema:moca:...[from-step-6]
SCHEMA_BANK_MINIMAL=schema:moca:...[from-step-6]

# Schema IDs - Income
SCHEMA_INCOME_HIGH=schema:moca:...[from-step-6]
SCHEMA_INCOME_MEDIUM=schema:moca:...[from-step-6]
SCHEMA_INCOME_LOW=schema:moca:...[from-step-6]
SCHEMA_INCOME_MINIMAL=schema:moca:...[from-step-6]

# Schema IDs - Legacy
SCHEMA_CEX_HISTORY=schema:moca:...[from-step-6]
SCHEMA_EMPLOYMENT=schema:moca:...[from-step-6]

# Verifier Program IDs
VERIFIER_PROGRAM_BANK_HIGH=[from-step-7]
VERIFIER_PROGRAM_BANK_MEDIUM=[from-step-7]
VERIFIER_PROGRAM_BANK_LOW=[from-step-7]
VERIFIER_PROGRAM_BANK_MINIMAL=[from-step-7]
VERIFIER_PROGRAM_INCOME_HIGH=[from-step-7]
VERIFIER_PROGRAM_INCOME_MEDIUM=[from-step-7]
VERIFIER_PROGRAM_INCOME_LOW=[from-step-7]
VERIFIER_PROGRAM_INCOME_MINIMAL=[from-step-7]
VERIFIER_PROGRAM_CEX_HISTORY=[from-step-7]
VERIFIER_PROGRAM_EMPLOYMENT=[from-step-7]

# Gas Sponsorship
PAYMASTER_POLICY_ID=[from-step-8]
```

---

## 🎉 What You've Accomplished

After Phase 5.1, you now have:

✅ **Official MOCA Identity**: 3 Issuer DIDs + 1 Verifier DID  
✅ **Public Schema Registry**: 10 published, discoverable schemas  
✅ **Verification Infrastructure**: 10 verifier programs  
✅ **Gas Sponsorship**: Paymaster enabled and funded  
✅ **Backend Authentication**: Partner secret for JWT generation  

**Your project is now officially registered in the MOCA ecosystem!** 🎊

---

## 🚀 Next Steps

**Proceed to Phase 5.2**: Backend Refactor

In Phase 5.2, you'll:
1. Add Partner JWT generation module
2. Refactor credential API routes
3. Update environment variables
4. Delete old mock issuer files
5. Test backend endpoints

**Estimated Time**: 2-3 hours

---

## 🐛 Troubleshooting

### "Can't create issuer - missing fields"
- Ensure all required fields filled
- Description must be at least 50 characters
- Email must be valid format

### "DID generation failed"
- Check internet connection
- Try refreshing dashboard
- Contact MOCA support if persists

### "Schema validation failed"
- Check JSON syntax (use JSONLint.com)
- Ensure issuerDid is valid format
- All required fields must be present

### "Paymaster not available"
- Access may not be instant
- Contact MOCA Discord #dev-chat
- Can proceed without for testing (users pay gas)

### "Can't top up wallet from faucet"
- Faucet may have rate limits
- Try again in 5 minutes
- Use different browser if blocked

---

**Phase 5.1 Status**: ✅ Complete  
**Next Phase**: Phase 5.2 - Backend Refactor  
**Time to Next**: Ready to proceed immediately

