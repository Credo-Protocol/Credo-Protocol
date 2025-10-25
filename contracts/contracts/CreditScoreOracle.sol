// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title CreditScoreOracle
 * @notice On-chain credit score oracle that verifies credentials and calculates credit scores
 * @dev Verifies signed credentials from registered issuers and maintains user credit profiles
 * 
 * Scoring Algorithm:
 * - Base score: 500 points
 * - Credential types have different weights:
 *   * Proof of Income: 150 points
 *   * Proof of Stable Balance: 100 points
 *   * Proof of CEX History: 80 points
 *   * Proof of Employment: 70 points
 *   * Proof of On-Chain Activity: 50 points
 * - Issuer trust score multiplier: 0-100% (affects points earned)
 * - Recency decay: Fresh (100%) to Old (70%)
 * - Diversity bonus: +5% per credential type (max 25%)
 * - Maximum score: 1000 points
 */
contract CreditScoreOracle is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ Constants ============
    
    // Maximum credentials per user to prevent gas limit issues
    uint256 public constant MAX_CREDENTIALS_PER_USER = 20;

    // ============ Structs ============

    /**
     * @dev User's credit profile with score and metadata
     */
    struct CreditProfile {
        uint256 score;              // Current credit score (0-1000)
        uint256 lastUpdated;        // Timestamp of last score update
        uint256 credentialCount;    // Number of valid credentials
        bool initialized;           // Whether profile has been initialized
    }

    /**
     * @dev Individual credential submitted by a user
     */
    struct Credential {
        uint256 credentialType;     // Type of credential (0-4)
        address issuer;             // Address of the issuer
        uint256 issuedAt;           // Timestamp when issued
        uint256 expiresAt;          // Expiration timestamp
        bytes32 credentialHash;     // Hash of credential data (for replay protection)
    }

    /**
     * @dev Information about registered credential issuers (Enhanced for v2)
     */
    struct IssuerInfo {
        bool registered;            // Whether issuer is registered
        bool isActive;              // Whether issuer is currently active
        uint8 trustScore;           // Trust score (0-100)
        string name;                // Display name of issuer
        uint256 registeredAt;       // Timestamp when registered
        uint256 credentialCount;    // Number of credentials issued
    }
    
    /**
     * @dev Credential Type Configuration for weighted scoring
     */
    struct CredentialTypeConfig {
        uint16 baseWeight;          // Base points for this credential (e.g., 150)
        uint8 decayDays;            // Days until decay to 70% (e.g., 90)
        bool isActive;              // Whether this type is currently active
        string displayName;         // Human-readable name
    }
    
    /**
     * @dev Tier Configuration for collateral requirements
     */
    struct TierConfig {
        uint16 minScore;            // Minimum score for this tier
        uint16 maxScore;            // Maximum score for this tier
        uint16 collateralFactor;    // Collateral factor in basis points (5000 = 50%)
        string tierName;            // Display name (e.g., "Exceptional")
    }
    
    /**
     * @dev Score component for transparency and auditing
     */
    struct ScoreComponent {
        bytes32 credentialType;     // Hash of credential type
        uint16 baseWeight;          // Base weight from config
        uint8 trustScore;           // Issuer trust score applied
        uint8 recencyPercent;       // Recency multiplier (70-100)
        uint16 finalPoints;         // Final points contributed
    }

    // ============ State Variables ============

    // User credit profiles
    mapping(address => CreditProfile) public creditProfiles;
    
    // User credentials (private to prevent enumeration attacks)
    mapping(address => Credential[]) private userCredentials;
    
    // Issuer registry (Enhanced for v2)
    mapping(address => IssuerInfo) public issuers;
    
    // Credential type configurations (bytes32 typeHash => config)
    mapping(bytes32 => CredentialTypeConfig) public credentialTypes;
    
    // Tier configurations (8 tiers indexed 0-7)
    TierConfig[8] public tiers;
    
    // Used credential hashes (replay protection)
    mapping(bytes32 => bool) private usedCredentialHashes;

    // ============ Events ============

    // Issuer Registry Events
    event IssuerRegistered(address indexed issuer, uint8 trustScore, string name);
    event IssuerTrustUpdated(address indexed issuer, uint8 oldScore, uint8 newScore);
    event IssuerDeactivated(address indexed issuer);
    
    // Credential Type Registry Events
    event CredentialTypeRegistered(bytes32 indexed typeHash, uint16 baseWeight, string displayName);
    event CredentialTypeUpdated(bytes32 indexed typeHash, uint16 newWeight);
    
    // Score Computation Events
    event ScoreComputed(
        address indexed user,
        uint16 baseScore,
        uint8 diversityBonusPercent,
        uint16 finalScore,
        bytes32 scoreRoot
    );
    
    event ScoreComponentAdded(
        address indexed user,
        bytes32 indexed credentialType,
        uint16 pointsAdded,
        uint8 trustScore,
        uint8 recencyPercent
    );
    
    // Legacy Events (keeping for backward compatibility)
    event CredentialSubmitted(
        address indexed user,
        address indexed issuer,
        uint256 credentialType,
        uint256 newScore
    );
    event ScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore);

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ Issuer Management Functions ============

    /**
     * @notice Register a new credential issuer (v2 Enhanced)
     * @param issuer Address of the issuer
     * @param trustScore Trust score for the issuer (0-100)
     * @param name Display name of the issuer
     * @dev Only owner can register issuers
     */
    function registerIssuer(
        address issuer,
        uint8 trustScore,
        string memory name
    ) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        require(trustScore <= 100, "Trust score must be 0-100");
        require(bytes(name).length > 0, "Name required");
        require(!issuers[issuer].registered, "Issuer already registered");

        issuers[issuer] = IssuerInfo({
            registered: true,
            isActive: true,
            trustScore: trustScore,
            name: name,
            registeredAt: block.timestamp,
            credentialCount: 0
        });

        emit IssuerRegistered(issuer, trustScore, name);
    }

    /**
     * @notice Update an issuer's trust score
     * @param issuer Address of the issuer
     * @param newTrustScore New trust score (0-100)
     */
    function updateIssuerTrust(address issuer, uint8 newTrustScore) external onlyOwner {
        require(issuers[issuer].registered, "Issuer not registered");
        require(issuers[issuer].isActive, "Issuer not active");
        require(newTrustScore <= 100, "Trust score must be 0-100");

        uint8 oldScore = issuers[issuer].trustScore;
        issuers[issuer].trustScore = newTrustScore;

        emit IssuerTrustUpdated(issuer, oldScore, newTrustScore);
    }

    /**
     * @notice Deactivate an issuer (prevents new credentials)
     * @param issuer Address of the issuer
     */
    function deactivateIssuer(address issuer) external onlyOwner {
        require(issuers[issuer].registered, "Issuer not registered");
        require(issuers[issuer].isActive, "Issuer already inactive");

        issuers[issuer].isActive = false;

        emit IssuerDeactivated(issuer);
    }

    /**
     * @notice Check if an issuer is registered and active
     * @param issuer Address to check
     * @return Whether the issuer is registered and active
     */
    function isIssuerRegistered(address issuer) external view returns (bool) {
        return issuers[issuer].registered && issuers[issuer].isActive;
    }

    // ============ Credential Type Registry Functions ============

    /**
     * @notice Register a new credential type with scoring parameters
     * @param typeHash Unique hash identifier for this credential type
     * @param baseWeight Base points awarded for this credential
     * @param decayDays Days until credential decays to 70% value
     * @param displayName Human-readable name for this credential
     */
    function registerCredentialType(
        bytes32 typeHash,
        uint16 baseWeight,
        uint8 decayDays,
        string memory displayName
    ) external onlyOwner {
        require(baseWeight > 0, "Weight must be positive");
        require(decayDays > 0, "Decay days must be positive");
        require(bytes(displayName).length > 0, "Display name required");
        require(!credentialTypes[typeHash].isActive, "Type already registered");

        credentialTypes[typeHash] = CredentialTypeConfig({
            baseWeight: baseWeight,
            decayDays: decayDays,
            isActive: true,
            displayName: displayName
        });

        emit CredentialTypeRegistered(typeHash, baseWeight, displayName);
    }

    /**
     * @notice Update the weight of a credential type
     * @param typeHash Hash of the credential type
     * @param newWeight New base weight for this credential
     */
    function updateCredentialTypeWeight(bytes32 typeHash, uint16 newWeight) external onlyOwner {
        require(credentialTypes[typeHash].isActive, "Credential type not registered");
        require(newWeight > 0, "Weight must be positive");

        credentialTypes[typeHash].baseWeight = newWeight;

        emit CredentialTypeUpdated(typeHash, newWeight);
    }

    // ============ Tier Configuration Functions ============

    /**
     * @notice Initialize tier configurations (call once after deployment)
     * @dev Sets up 8 tiers with their score ranges and collateral factors
     */
    function initializeTiers() external onlyOwner {
        tiers[0] = TierConfig(900, 1000, 5000, "Exceptional");   // 50% collateral
        tiers[1] = TierConfig(800, 899, 6000, "Excellent");      // 60% collateral
        tiers[2] = TierConfig(700, 799, 7500, "Good");           // 75% collateral
        tiers[3] = TierConfig(600, 699, 9000, "Fair");           // 90% collateral
        tiers[4] = TierConfig(500, 599, 10000, "Average");       // 100% collateral
        tiers[5] = TierConfig(400, 499, 11000, "Below Average"); // 110% collateral
        tiers[6] = TierConfig(300, 399, 12500, "Poor");          // 125% collateral
        tiers[7] = TierConfig(0, 299, 15000, "Very Poor");       // 150% collateral
    }

    /**
     * @notice Get tier configuration for a given score
     * @param score Credit score to look up
     * @return Tier configuration for this score
     */
    function getTierForScore(uint16 score) public view returns (TierConfig memory) {
        // Find matching tier
        for (uint8 i = 0; i < 8; i++) {
            if (score >= tiers[i].minScore && score <= tiers[i].maxScore) {
                return tiers[i];
            }
        }
        // Default to lowest tier if no match
        return tiers[7];
    }

    // ============ Credential Submission ============

    /**
     * @notice Submit a verified credential to update credit score
     * @param credentialData ABI-encoded credential data
     * @param signature Signature from the issuer
     * @param issuer Address of the issuer
     * @param credentialType Type of credential (0-4)
     * @param expirationTimestamp When the credential expires
     * @return newScore The updated credit score
     */
    function submitCredential(
        bytes memory credentialData,
        bytes memory signature,
        address issuer,
        uint256 credentialType,
        uint256 expirationTimestamp
    ) external returns (uint256 newScore) {
        // Validate issuer (v2: also check isActive)
        require(issuers[issuer].registered, "Issuer not registered");
        require(issuers[issuer].isActive, "Issuer not active");
        
        // Validate credential type
        require(credentialType <= 4, "Invalid credential type");
        
        // Validate expiration
        require(expirationTimestamp > block.timestamp, "Credential already expired");
        
        // Generate credential hash for replay protection
        bytes32 credentialHash = keccak256(abi.encodePacked(
            credentialData,
            msg.sender,
            issuer,
            credentialType
        ));
        
        // Check replay protection
        require(!usedCredentialHashes[credentialHash], "Credential already used");
        
        // Verify signature
        require(
            verifyCredentialSignature(credentialData, signature, issuer),
            "Invalid signature"
        );
        
        // Mark credential as used
        usedCredentialHashes[credentialHash] = true;
        
        // Store credential
        userCredentials[msg.sender].push(Credential({
            credentialType: credentialType,
            issuer: issuer,
            issuedAt: block.timestamp,
            expiresAt: expirationTimestamp,
            credentialHash: credentialHash
        }));
        
        // Update issuer stats
        issuers[issuer].credentialCount++;
        
        // Calculate new score
        uint256 oldScore = creditProfiles[msg.sender].score;
        newScore = calculateScore(msg.sender);
        
        // Update credit profile
        creditProfiles[msg.sender] = CreditProfile({
            score: newScore,
            lastUpdated: block.timestamp,
            credentialCount: userCredentials[msg.sender].length,
            initialized: true
        });
        
        emit CredentialSubmitted(msg.sender, issuer, credentialType, newScore);
        emit ScoreUpdated(msg.sender, oldScore, newScore);
        
        return newScore;
    }

    // ============ Score Calculation ============

    /**
     * @notice Compute credit score with full transparency (v2 Enhanced)
     * @param user Address of the user to compute score for
     * @return Final credit score (0-1000)
     * @dev Uses on-chain registries, emits detailed breakdown events
     */
    function computeCreditScore(address user) 
        external 
        nonReentrant 
        returns (uint16) 
    {
        require(user != address(0), "Invalid user address");
        
        Credential[] memory credentials = userCredentials[user];
        require(credentials.length <= MAX_CREDENTIALS_PER_USER, "Too many credentials");
        
        // Base score for users with no credentials
        if (credentials.length == 0) {
            return 500;
        }
        
        uint16 baseScore = 500;
        uint256 totalPoints = baseScore;
        
        // Track unique credential types for diversity bonus
        bytes32[] memory uniqueTypes = new bytes32[](credentials.length);
        uint8 uniqueCount = 0;
        
        // Process each credential
        for (uint256 i = 0; i < credentials.length; i++) {
            Credential memory cred = credentials[i];
            
            // Skip expired credentials
            if (block.timestamp > cred.expiresAt) continue;
            
            // Verify issuer is still active
            require(issuers[cred.issuer].isActive, "Inactive issuer");
            
            // Get credential type hash (for v1 compatibility, use credentialType as-is)
            bytes32 typeHash = bytes32(cred.credentialType);
            
            // Get credential type config
            CredentialTypeConfig memory typeConfig = credentialTypes[typeHash];
            
            // If type not registered, skip (backward compatibility)
            if (!typeConfig.isActive) continue;
            
            // Get issuer trust score
            uint8 issuerTrust = issuers[cred.issuer].trustScore;
            
            // Calculate recency decay
            uint256 age = block.timestamp - cred.issuedAt;
            uint256 ageDays = age / (24 * 60 * 60);
            uint8 recencyPercent = 100;
            
            if (ageDays > typeConfig.decayDays) {
                recencyPercent = 70; // Minimum 70% after decay period
            } else if (ageDays > 0) {
                // Linear decay from 100% to 70% over decay period
                recencyPercent = uint8(100 - (30 * ageDays / typeConfig.decayDays));
            }
            
            // Calculate final points for this credential
            uint256 points = typeConfig.baseWeight;
            points = (points * issuerTrust) / 100;      // Apply trust multiplier
            points = (points * recencyPercent) / 100;   // Apply recency decay
            
            totalPoints += points;
            
            // Track unique types for diversity bonus
            bool isUnique = true;
            for (uint8 j = 0; j < uniqueCount; j++) {
                if (uniqueTypes[j] == typeHash) {
                    isUnique = false;
                    break;
                }
            }
            if (isUnique && uniqueCount < uniqueTypes.length) {
                uniqueTypes[uniqueCount] = typeHash;
                uniqueCount++;
            }
            
            // Emit component event for transparency
            emit ScoreComponentAdded(user, typeHash, uint16(points), issuerTrust, recencyPercent);
        }
        
        // Apply diversity bonus (5% per unique type, max 25%)
        uint8 diversityBonus = uniqueCount * 5;
        if (diversityBonus > 25) diversityBonus = 25;
        
        totalPoints = (totalPoints * (100 + diversityBonus)) / 100;
        
        // Cap at maximum score of 1000
        if (totalPoints > 1000) totalPoints = 1000;
        
        uint16 finalScore = uint16(totalPoints);
        
        // Update stored score
        uint256 oldScore = creditProfiles[user].score;
        creditProfiles[user].score = finalScore;
        creditProfiles[user].lastUpdated = block.timestamp;
        
        // Create audit hash for off-chain verification
        bytes32 scoreRoot = keccak256(abi.encode(user, finalScore, block.timestamp));
        
        // Emit comprehensive score computed event
        emit ScoreComputed(
            user,
            baseScore,
            diversityBonus,
            finalScore,
            scoreRoot
        );
        
        // Also emit legacy event for backward compatibility
        emit ScoreUpdated(user, oldScore, finalScore);
        
        return finalScore;
    }

    /**
     * @notice Calculate credit score for a user based on their credentials (Legacy v1)
     * @param user Address of the user
     * @return Final calculated score (0-1000)
     * @dev Implements weighted scoring with issuer trust, recency decay, and diversity bonus
     */
    function calculateScore(address user) internal view returns (uint256) {
        Credential[] memory creds = userCredentials[user];
        
        // Base score for no credentials
        if (creds.length == 0) return 500;
        
        uint256 totalPoints = 500; // Starting base
        uint256 uniqueCredentialTypes = 0;
        bool[5] memory seenTypes; // Track unique credential types
        
        // Calculate points from each valid credential
        for (uint i = 0; i < creds.length; i++) {
            Credential memory cred = creds[i];
            
            // Skip expired credentials
            if (block.timestamp > cred.expiresAt) continue;
            
            // Track unique types for diversity bonus
            if (!seenTypes[cred.credentialType]) {
                seenTypes[cred.credentialType] = true;
                uniqueCredentialTypes++;
            }
            
            // Get base points for credential type
            uint256 basePoints = getCredentialTypeWeight(cred.credentialType);
            
            // Apply issuer trust multiplier (0-100%)
            uint256 issuerMultiplier = issuers[cred.issuer].trustScore;
            uint256 adjustedPoints = (basePoints * issuerMultiplier) / 100;
            
            // Apply recency decay
            uint256 age = block.timestamp - cred.issuedAt;
            uint256 decayFactor = calculateDecayFactor(age);
            adjustedPoints = (adjustedPoints * decayFactor) / 100;
            
            totalPoints += adjustedPoints;
        }
        
        // Apply diversity bonus: 5% per unique credential type (capped at 25%)
        uint256 diversityBonus = uniqueCredentialTypes * 5;
        if (diversityBonus > 25) diversityBonus = 25;
        totalPoints = (totalPoints * (100 + diversityBonus)) / 100;
        
        // Cap at maximum score of 1000
        if (totalPoints > 1000) totalPoints = 1000;
        
        return totalPoints;
    }

    /**
     * @notice Get point weight for a credential type
     * @param credType Credential type (0-4)
     * @return Points awarded for this credential type
     */
    function getCredentialTypeWeight(uint256 credType) internal pure returns (uint256) {
        // 0: Proof of Income -> 150 points
        // 1: Proof of Stable Balance -> 100 points
        // 2: Proof of CEX History -> 80 points
        // 3: Proof of Employment -> 70 points
        // 4: Proof of On-Chain Activity -> 50 points
        if (credType == 0) return 150;
        if (credType == 1) return 100;
        if (credType == 2) return 80;
        if (credType == 3) return 70;
        if (credType == 4) return 50;
        return 30; // Default for unknown types
    }

    /**
     * @notice Calculate decay factor based on credential age
     * @param age Age of credential in seconds
     * @return Decay factor as percentage (70-100)
     */
    function calculateDecayFactor(uint256 age) internal pure returns (uint256) {
        // Fresh (< 30 days): 100%
        // 30-90 days: 95%
        // 90-180 days: 85%
        // 180+ days: 70%
        if (age < 30 days) return 100;
        if (age < 90 days) return 95;
        if (age < 180 days) return 85;
        return 70;
    }

    // ============ Signature Verification ============

    /**
     * @notice Verify that a credential was signed by the claimed issuer
     * @param credentialData The credential data
     * @param signature The signature to verify
     * @param issuer Expected signer address
     * @return Whether signature is valid
     */
    function verifyCredentialSignature(
        bytes memory credentialData,
        bytes memory signature,
        address issuer
    ) internal pure returns (bool) {
        bytes32 messageHash = keccak256(credentialData);
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedHash.recover(signature);
        return recoveredSigner == issuer;
    }

    // ============ View Functions ============

    /**
     * @notice Get a user's current credit score
     * @param user Address of the user
     * @return The user's credit score (0-1000)
     */
    function getCreditScore(address user) external view returns (uint256) {
        if (!creditProfiles[user].initialized) {
            return 500; // Default base score
        }
        return creditProfiles[user].score;
    }

    /**
     * @notice Get detailed score information for a user
     * @param user Address of the user
     * @return score Current credit score
     * @return credentialCount Number of credentials
     * @return lastUpdated Timestamp of last update
     * @return initialized Whether profile exists
     */
    function getScoreDetails(address user) external view returns (
        uint256 score,
        uint256 credentialCount,
        uint256 lastUpdated,
        bool initialized
    ) {
        CreditProfile memory profile = creditProfiles[user];
        if (!profile.initialized) {
            return (500, 0, 0, false);
        }
        return (
            profile.score,
            profile.credentialCount,
            profile.lastUpdated,
            profile.initialized
        );
    }

    /**
     * @notice Check if a user's score is above a threshold
     * @param user Address of the user
     * @param threshold Minimum score required
     * @return Whether user's score >= threshold
     */
    function isScoreAboveThreshold(address user, uint256 threshold) external view returns (bool) {
        uint256 score = creditProfiles[user].initialized 
            ? creditProfiles[user].score 
            : 500;
        return score >= threshold;
    }

    /**
     * @notice Get count of user's credentials
     * @param user Address of the user
     * @return Number of credentials
     */
    function getUserCredentialCount(address user) external view returns (uint256) {
        return userCredentials[user].length;
    }
}

