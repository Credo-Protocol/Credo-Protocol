# Phase 5.1: AIR Kit Dashboard Setup

**Day**: 3 Morning (Oct 27)  
**Duration**: 2 hours  
**Prerequisites**: Phases 1-4 Complete  
**Next**: Phase 5.2 (Backend Refactor)

---

## 🎯 Goal

Register your project as an official MOCA credential issuer and verifier in the AIR Kit Dashboard. This establishes your project's identity in the MOCA ecosystem and unlocks gas sponsorship.

**Why This Phase**: Without official Issuer DID and schemas, your credentials won't be recognized by the MOCA ecosystem. This is the foundation for true integration.

**What You'll Get**:
- ✅ 1 Official Issuer DID (Credo Protocol) - **Note**: Each partner account gets 1 Issuer DID per MOCA documentation
- ✅ 1 Verifier DID for credit score oracle
- ✅ 10 Published credential schemas (differentiated by type, not issuer)
- ✅ 10 Verifier programs
- ✅ Gas sponsorship enabled (paymaster)
- ✅ Partner secret for backend JWT

---

## 📋 What You're Creating

By the end of this phase, you'll have:

```yaml
Issuer:
  - Credo Protocol (DID: did:air:id:test:... - from General Settings)
    Issues all 10 credential types with clear schema differentiation

Verifier:
  - Credo Protocol (DID: did:key:... - from General Settings)

Schemas (all issued by Credo Protocol):
  - 4 Bank Balance schemas (High/Medium/Low/Minimal)
  - 4 Income Range schemas (High/Medium/Low/Minimal)  
  - 1 CEX History schema
  - 1 Employment Status schema

Verifier Programs:
  - 10 programs (one per schema)

Gas Sponsorship:
  - Paymaster enabled
  - Policy configured
  - Wallet funded
```

**Architecture Note**: This follows MOCA's standard model where Credo Protocol acts as a credential aggregator (like Plaid or Civic), issuing verifiable credentials for various data types under one trusted issuer identity.

---

## 🛠️ Step-by-Step Instructions

### Step 1: Access AIR Kit Dashboard (5 min)

**URL**: [https://developers.sandbox.air3.com/](https://developers.sandbox.air3.com/)

1. Open the dashboard in your browser
2. Click "Login with Moca ID"
3. Use your existing Google/Email account (same as your app)
4. You should see your existing partner account

**Verify Your Partner ID**:
- Go to **Account → General**
- You should see your Partner ID (already in `.env.local`)

**Save for Reference**:
```bash
PARTNER_ID=[your-existing-partner-id]
```

**Status Check**: ✅ Dashboard accessed, Partner ID confirmed

---

### Step 2: Verify Your Issuer DID & Verifier DID (5 min)

**Dashboard Path**: Account → General

According to [MOCA's official documentation](https://docs.moca.network/airkit/airkit-dashboard), each partner account automatically gets **1 Issuer DID** and **1 Verifier DID** upon account creation.

#### Locate Your DIDs

On the **General Settings** page, you'll see:

```yaml
Partner ID: 954fe820-050d-49fb-b22e-884922aa6cef
Issuer DID: did:air:id:test:4P3gyKQFs7SYu1XBDirLU7WhJqRgDl
Verifier DID: did:key:81eGFbL7uQQFjvbTMAyQv4XtzTv7wJJLpe
Name: AIR Partner e6ada70dcb524d9ba15c9f5080c0cf6f
Website URL: https://air3.com
```

**Copy both DIDs to your notes**:
```bash
# From General Settings
ISSUER_DID=did:air:id:test:4P3gyKQFs7SYu1XBDirLU7WhJqRgDl
VERIFIER_DID=did:key:81eGFbL7uQQFjvbTMAyQv4XtzTv7wJJLpe
```

**Important**: You'll use this **ONE Issuer DID** for all 10 credential schemas. Each schema will have a unique name and structure to differentiate credential types (Bank Balance, Income, Employment, CEX History).

#### Top Up Fee Wallet (Issuer)

1. Navigate to **Issuer → Fee Wallet** in the left sidebar
2. Copy the wallet address displayed
3. Open [Moca Devnet Faucet](https://devnet-scan.mocachain.org/faucet)
4. Paste wallet address
5. Request **100 test MOCA**
6. Confirm transaction
7. Return to dashboard - balance should update to ~100 MOCA

#### Top Up Fee Wallet (Verifier)

1. Navigate to **Verifier → Fee Wallet** in the left sidebar
2. Copy the wallet address displayed
3. Use faucet to send **100 test MOCA**
4. Confirm balance updated to ~100 MOCA

**Status Check**: ✅ Issuer DID and Verifier DID confirmed and wallets funded

---

### Step 3: Update General Settings (Optional, 5 min)

**Dashboard Path**: Account → General

You can optionally update your partner account information to better reflect Credo Protocol:

```yaml
Name: Credo Protocol
Website URL: https://credo-protocol.vercel.app
Logo URL: [your-logo-url if you have one]
JWKS URL: [leave empty for now - we'll handle JWT in backend]
```

Click **"Save"** to update.

**Status Check**: ✅ General settings updated (optional)

---

### Step 4: Create Credential Schemas (45 min)

**Dashboard Path**: Issuer → Schemas (in left sidebar)

**⚠️ IMPORTANT**: According to [official MOCA documentation](https://docs.moca.network/airkit/usage/credential/schema-creation), schemas are created using the **Schema Builder UI**, NOT by pasting JSON. The dashboard provides a visual form builder.

You need to create **10 schemas total**. All schemas will automatically use your **Issuer DID** from General Settings.

---

#### Schema 1: Bank Balance - High

**Using the Schema Builder UI**:

1. Click **"Create New Schema"** button
2. Fill in **Basic Information**:
   ```
   Title: Credo Bank Balance - High
   Type: BankBalance
   Description: Proves 30-day average bank balance of $10,000 or more without revealing exact amount. Privacy-preserving bucketed credential issued by Credo Protocol.
   ```

3. Click **"Continue"** or **"Next"**

4. **Add Attributes** (Click "+" for each):

   **Attribute 1:**
   ```
   Name: balanceBucket
   Type: String
   Title: Balance Bucket
   Description: Balance bucket classification
   Required: ✅ Yes
   ```

   **Attribute 2:**
   ```
   Name: bucketRange
   Type: String
   Title: Bucket Range
   Description: Human-readable range (e.g., $10,000+)
   Required: ✅ Yes
   ```

   **Attribute 3:**
   ```
   Name: weight
   Type: Number
   Title: Credit Score Weight
   Description: Weight value for credit scoring (150)
   Required: ✅ Yes
   ```

   **Attribute 4:**
   ```
   Name: verifiedAt
   Type: Number
   Title: Verification Timestamp
   Description: Unix timestamp of verification
   Required: ✅ Yes
   ```

   **Attribute 5:**
   ```
   Name: dataSource
   Type: String
   Title: Data Source
   Description: Source of financial data (Plaid API)
   Required: No
   ```

   **Attribute 6:**
   ```
   Name: period
   Type: String
   Title: Period
   Description: Averaging period (30 days)
   Required: No
   ```

5. Click **"Publish"** to make schema available
6. **Copy the generated Schema ID** (shown after publishing)

**Save to Notes**:
```bash
SCHEMA_BANK_HIGH=schema:air:...[generated-id]
```

---

**✅ Schema Builder Tips** (from [official docs](https://docs.moca.network/airkit/usage/credential/schema-creation)):
- Use camelCase for attribute names (e.g., `balanceBucket` not `balance_bucket`)
- Choose appropriate data types: String, Number, Boolean, Date
- Provide clear descriptions for each attribute
- Mark fields as Required if they must always be present

---

#### Schema 2: Bank Balance - Medium

**Quick Config** (using Schema Builder):

```
Title: Credo Bank Balance - Medium
Type: BankBalance
Description: Proves 30-day average bank balance of $5,000-$10,000 without revealing exact amount. Issued by Credo Protocol.

Attributes (same structure as Schema 1):
- balanceBucket (String, Required)
- bucketRange (String, Required) - value: "$5,000 - $10,000"
- weight (Number, Required) - value: 120
- verifiedAt (Number, Required)
- dataSource (String, Optional) - "Plaid API"
- period (String, Optional) - "30 days"
```

**Save as**: `SCHEMA_BANK_MEDIUM`

---

#### Schema 3: Bank Balance - Low

**Quick Config**:

```
Title: Credo Bank Balance - Low
Type: BankBalance
Description: Proves 30-day average bank balance of $1,000-$5,000 without revealing exact amount.

Attributes:
- balanceBucket (String, Required)
- bucketRange (String, Required) - "$1,000 - $5,000"
- weight (Number, Required) - 80
- verifiedAt (Number, Required)
- dataSource (String, Optional) - "Plaid API"
- period (String, Optional) - "30 days"
```

**Save as**: `SCHEMA_BANK_LOW`

---

#### Schema 4: Bank Balance - Minimal

**Quick Config**:

```
Title: Credo Bank Balance - Minimal
Type: BankBalance
Description: Proves 30-day average bank balance under $1,000.

Attributes:
- balanceBucket (String, Required)
- bucketRange (String, Required) - "Under $1,000"
- weight (Number, Required) - 40
- verifiedAt (Number, Required)
- dataSource (String, Optional) - "Plaid API"
- period (String, Optional) - "30 days"
```

**Save as**: `SCHEMA_BANK_MINIMAL`

---

#### Schemas 5-8: Income Range

Follow the same Schema Builder UI process as Bank Balance schemas. **Quick reference table**:

| # | Title | Type | Range | Weight | Attributes |
|---|-------|------|-------|--------|------------|
| 5 | Credo Income Range - High | IncomeRange | $8,000+/month | 180 | incomeBucket, bucketRange, weight, verifiedAt, dataSource, period |
| 6 | Credo Income Range - Medium | IncomeRange | $5,000-$8,000/month | 140 | (same attributes) |
| 7 | Credo Income Range - Low | IncomeRange | $3,000-$5,000/month | 100 | (same attributes) |
| 8 | Credo Income Range - Minimal | IncomeRange | Under $3,000/month | 50 | (same attributes) |

**Attribute Structure** (for all 4 Income schemas):
```
- incomeBucket (String, Required)
- bucketRange (String, Required) - [use range from table above]
- weight (Number, Required) - [use weight from table above]
- verifiedAt (Number, Required)
- dataSource (String, Optional) - "Mock Employer"
- period (String, Optional) - "Monthly"
```

**Save as**: `SCHEMA_INCOME_HIGH`, `SCHEMA_INCOME_MEDIUM`, `SCHEMA_INCOME_LOW`, `SCHEMA_INCOME_MINIMAL`

---

#### Schema 9: CEX Trading History

**Quick Config**:

```
Title: Credo CEX Trading History
Type: ExchangeHistory
Description: Proves active trading history on centralized exchanges. Issued by Credo Protocol.

Attributes:
- credentialType (String, Required) - "CEX_HISTORY"
- weight (Number, Required) - 80
- verifiedAt (Number, Required)
- dataSource (String, Optional) - "Mock Exchange"
```

**Save as**: `SCHEMA_CEX_HISTORY`

---

#### Schema 10: Proof of Employment

**Quick Config**:

```
Title: Credo Proof of Employment
Type: Employment
Description: Proves current employment status without revealing employer details. Issued by Credo Protocol.

Attributes:
- credentialType (String, Required) - "EMPLOYMENT"
- weight (Number, Required) - 70
- verifiedAt (Number, Required)
- dataSource (String, Optional) - "Mock Employer"
```

**Save as**: `SCHEMA_EMPLOYMENT`

---

**Schema Creation Checklist**:

```markdown
All schemas use your single ISSUER_DID (did:air:id:test:4P3gyKQFs7SYu1XBDirLU7WhJqRgDl)

Bank Balance Schemas:
- [ ] SCHEMA_BANK_HIGH ($10k+, weight: 150)
- [ ] SCHEMA_BANK_MEDIUM ($5k-$10k, weight: 120)
- [ ] SCHEMA_BANK_LOW ($1k-$5k, weight: 80)
- [ ] SCHEMA_BANK_MINIMAL (<$1k, weight: 40)

Income Range Schemas:
- [ ] SCHEMA_INCOME_HIGH ($8k+/mo, weight: 180)
- [ ] SCHEMA_INCOME_MEDIUM ($5k-$8k/mo, weight: 140)
- [ ] SCHEMA_INCOME_LOW ($3k-$5k/mo, weight: 100)
- [ ] SCHEMA_INCOME_MINIMAL (<$3k/mo, weight: 50)

Other Schemas:
- [ ] SCHEMA_CEX_HISTORY (weight: 80)
- [ ] SCHEMA_EMPLOYMENT (weight: 70)
```

**Status Check**: ✅ All 10 schemas created and Schema IDs saved

---

### Step 4.5: About Issuance Programs (IMPORTANT NOTE - 5 min)

**⚠️ Read This Before Continuing!**

According to [MOCA Documentation](https://docs.moca.network/airkit/airkit-dashboard#_2-issuance-program), there are **Issuance Programs** (also called "Credentials" in the dashboard) that configure how credentials are issued:

- **Accessible Until**: Date range for validity
- **Maximum Issuance**: Cap on total credentials
- **Expiration Duration**: Credential lifespan

**For Credo Protocol's use case**, you have two options:

#### **Option A: Skip Manual Creation** (Recommended ✅)
Since you'll issue credentials **programmatically via the SDK** (`airService.issueCredential()`), you can skip manually creating issuance programs in the dashboard. The SDK can handle issuance directly with your schemas.

**Pros**: Faster setup, more flexibility
**Cons**: No dashboard-configured limits/expiration

#### **Option B: Create Issuance Programs in Dashboard**
Navigate to **Issuer → Credentials** and manually create 10 issuance programs (one per schema) with specific rules.

**Pros**: Dashboard management, built-in limits
**Cons**: More setup time, less flexible

**Recommendation**: Proceed with Option A for now. You can add issuance programs later if needed.

---

### Step 5: Create Verifier Programs (30 min)

**Dashboard Path**: Verifier → Programs (in left sidebar)

**⚠️ IMPORTANT**: According to [official MOCA documentation](https://docs.moca.network/airkit/airkit-dashboard#_1-verification-program-management), Verifier Programs define the logic for checking credential attributes using operators and values.

For each of your 10 schemas, you'll create a matching verification program.

---

#### How to Create a Verifier Program (Official Process)

According to [MOCA's Verification Documentation](https://docs.moca.network/airkit/quickstart/verify-credentials#step-6-setup-verification-program):

1. Navigate to **Verifier → Programs** in dashboard sidebar
2. Click **"Create Program"** or **"+ New Program"**
3. Fill in basic info:
   ```
   Program Name: Verify [Credential Name]
   Description: Verify [credential type] for credit score calculation
   ```
4. **Select Schema**: Choose the schema this program will verify (from dropdown)
5. **Define Verification Logic**: Add operators and attribute conditions
   - Example: attribute "weight" operator "greater than" value "0"
6. **Data Recovery**: Choose whether to allow data access (default: No)
7. Click **"Apply"** to deploy the program
8. **Copy the Program ID** (shown after deployment)

---

#### Program #1: Verify Bank Balance - High

**Configuration**:
```
Program Name: Verify Bank Balance - High
Description: Verify high bank balance credential for credit score oracle
Schema: Credo Bank Balance - High (select from dropdown)

Verification Logic:
- Attribute: weight
- Operator: greater than or equal to
- Value: 0

Data Recovery: No
```

**After creating, save**: `VERIFIER_PROGRAM_BANK_HIGH=[program-id]`

---

#### Quick Creation Guide for Remaining 9 Programs

**Follow the same process** for each schema. Here's your checklist:

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

### Step 6: Enable Gas Sponsorship (20 min)

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

### Step 7: Generate Partner Secret (10 min)

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

### Issuer & Verifier
- [ ] Issuer DID confirmed (from General Settings)
- [ ] Verifier DID confirmed (from General Settings)
- [ ] Issuer fee wallet funded (100 MOCA)
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
PARTNER_ID=[from-step-1]
PARTNER_SECRET=[from-step-7]

# Issuer & Verifier DIDs (from General Settings - Step 2)
ISSUER_DID=did:air:id:test:...[from-step-2]
VERIFIER_DID=did:key:...[from-step-2]

# Schema IDs - Bank Balance (from Step 4)
SCHEMA_BANK_HIGH=schema:moca:...[from-step-4]
SCHEMA_BANK_MEDIUM=schema:moca:...[from-step-4]
SCHEMA_BANK_LOW=schema:moca:...[from-step-4]
SCHEMA_BANK_MINIMAL=schema:moca:...[from-step-4]

# Schema IDs - Income (from Step 4)
SCHEMA_INCOME_HIGH=schema:moca:...[from-step-4]
SCHEMA_INCOME_MEDIUM=schema:moca:...[from-step-4]
SCHEMA_INCOME_LOW=schema:moca:...[from-step-4]
SCHEMA_INCOME_MINIMAL=schema:moca:...[from-step-4]

# Schema IDs - Other (from Step 4)
SCHEMA_CEX_HISTORY=schema:moca:...[from-step-4]
SCHEMA_EMPLOYMENT=schema:moca:...[from-step-4]

# Verifier Program IDs (from Step 5)
VERIFIER_PROGRAM_BANK_HIGH=[from-step-5]
VERIFIER_PROGRAM_BANK_MEDIUM=[from-step-5]
VERIFIER_PROGRAM_BANK_LOW=[from-step-5]
VERIFIER_PROGRAM_BANK_MINIMAL=[from-step-5]
VERIFIER_PROGRAM_INCOME_HIGH=[from-step-5]
VERIFIER_PROGRAM_INCOME_MEDIUM=[from-step-5]
VERIFIER_PROGRAM_INCOME_LOW=[from-step-5]
VERIFIER_PROGRAM_INCOME_MINIMAL=[from-step-5]
VERIFIER_PROGRAM_CEX_HISTORY=[from-step-5]
VERIFIER_PROGRAM_EMPLOYMENT=[from-step-5]

# Gas Sponsorship (from Step 6)
PAYMASTER_POLICY_ID=[from-step-6]
```

**Note**: All 10 schemas use the **same Issuer DID** (Credo Protocol). Schemas are differentiated by their names, types, and credential subject properties.

---

## 🎉 What You've Accomplished

After Phase 5.1, you now have:

✅ **Official MOCA Identity**: 1 Issuer DID (Credo Protocol) + 1 Verifier DID  
✅ **Public Schema Registry**: 10 published, discoverable schemas (all issued by Credo Protocol)  
✅ **Verification Infrastructure**: 10 verifier programs  
✅ **Gas Sponsorship**: Paymaster enabled and funded  
✅ **Backend Authentication**: Partner secret for JWT generation  

**Your project is now officially registered in the MOCA ecosystem!** 🎊

**Architecture**: Credo Protocol acts as a trusted credential aggregator (similar to Plaid or Civic), issuing verifiable credentials for various financial and identity data types under one unified issuer identity. This is the standard MOCA model and aligns with official documentation.

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

## ✅ Alignment with Official MOCA Documentation

**This document has been verified against official MOCA documentation:**

| Section | Official Doc Reference | Verified |
|---------|----------------------|----------|
| General Settings | [Developer Dashboard](https://docs.moca.network/airkit/airkit-dashboard#_1-general-settings) | ✅ |
| Schema Creation | [Schema Creation Guide](https://docs.moca.network/airkit/usage/credential/schema-creation) | ✅ |
| Schema Builder UI | [Quickstart: Issue Credentials](https://docs.moca.network/airkit/quickstart/issue-credentials#step-4-create-schema-for-credential-issuance) | ✅ |
| Verifier Programs | [Verification Program Management](https://docs.moca.network/airkit/airkit-dashboard#_1-verification-program-management) | ✅ |
| Issuance Programs | [Issuance Program](https://docs.moca.network/airkit/airkit-dashboard#_2-issuance-program) | ✅ |
| Gas Sponsorship | [Gas Sponsorship (Paymaster)](https://docs.moca.network/airkit/usage/account/paymaster) | ✅ |
| Partner JWT | [SDK Authentication (Partner JWT)](https://docs.moca.network/airkit/usage/partner-authentication) | ✅ |

**Key Changes Made for Compliance**:
- ✅ Replaced JSON-based schema creation with UI-based Schema Builder approach
- ✅ Updated dashboard navigation paths to match official structure
- ✅ Added clarification about 1 Issuer DID per partner account (official MOCA model)
- ✅ Simplified verifier program creation to match dashboard process
- ✅ Added note about issuance programs (optional for programmatic issuance)

**Last Verified**: Oct 26, 2025 using marcus-mcp-server MCP

---

## 🐛 Troubleshooting

### "Can't find Schema Builder / Shows JSON editor"
- Make sure you're in **Issuer → Schemas** section
- Look for "Create New Schema" button (not "Create Schema")
- The UI should show a visual form builder, not a code editor
- If you see JSON editor, contact MOCA support - dashboard may have changed

### "Schema validation failed"
- Ensure all required attributes are marked correctly
- Use descriptive names in camelCase format
- Check that attribute types match (String, Number, Boolean, Date)
- Review official docs: https://docs.moca.network/airkit/usage/credential/schema-creation

### "Can't find Verifier Programs section"
- Navigate to **Verifier** (not Issuer) in left sidebar
- Click on **Programs** subsection
- Should see list of existing programs and "Create Program" button

### "Paymaster not available"
- Access may need to be granted by MOCA team
- Contact MOCA Discord #dev-chat with your Partner ID
- Can proceed without for testing (users pay gas)
- Reference: https://docs.moca.network/airkit/usage/account/paymaster

### "Can't top up wallet from faucet"
- Faucet URL: https://devnet-scan.mocachain.org/faucet
- May have rate limits - try again in 5 minutes
- Ensure you're copying the correct wallet address from dashboard
- Use different browser if blocked

### "Issuer DID not showing in General Settings"
- You should have one automatically generated on account creation
- Refresh the dashboard page
- Check **Account → General** section carefully
- If still missing, contact MOCA support - this should be automatic

---

**Phase 5.1 Status**: ✅ Complete & Verified Against Official MOCA Docs  
**Next Phase**: Phase 5.2 - Backend Refactor  
**Time to Next**: Ready to proceed immediately

