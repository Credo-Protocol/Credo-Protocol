// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
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
contract CreditScoreOracle is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

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
     * @dev Information about registered credential issuers
     */
    struct IssuerInfo {
        bool registered;            // Whether issuer is registered
        uint256 trustScore;         // Trust score (0-100)
        uint256 credentialCount;    // Number of credentials issued
    }

    // ============ State Variables ============

    // User credit profiles
    mapping(address => CreditProfile) public creditProfiles;
    
    // User credentials (private to prevent enumeration attacks)
    mapping(address => Credential[]) private userCredentials;
    
    // Issuer registry
    mapping(address => IssuerInfo) public issuers;
    
    // Used credential hashes (replay protection)
    mapping(bytes32 => bool) private usedCredentialHashes;

    // ============ Events ============

    event IssuerRegistered(address indexed issuer, uint256 trustScore);
    event IssuerTrustScoreUpdated(address indexed issuer, uint256 oldScore, uint256 newScore);
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
     * @notice Register a new credential issuer
     * @param issuer Address of the issuer
     * @param trustScore Trust score for the issuer (0-100)
     * @dev Only owner can register issuers
     */
    function registerIssuer(address issuer, uint256 trustScore) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        require(trustScore <= 100, "Trust score must be <= 100");
        require(!issuers[issuer].registered, "Issuer already registered");

        issuers[issuer] = IssuerInfo({
            registered: true,
            trustScore: trustScore,
            credentialCount: 0
        });

        emit IssuerRegistered(issuer, trustScore);
    }

    /**
     * @notice Update an issuer's trust score
     * @param issuer Address of the issuer
     * @param newScore New trust score (0-100)
     */
    function updateIssuerTrustScore(address issuer, uint256 newScore) external onlyOwner {
        require(issuers[issuer].registered, "Issuer not registered");
        require(newScore <= 100, "Trust score must be <= 100");

        uint256 oldScore = issuers[issuer].trustScore;
        issuers[issuer].trustScore = newScore;

        emit IssuerTrustScoreUpdated(issuer, oldScore, newScore);
    }

    /**
     * @notice Check if an issuer is registered
     * @param issuer Address to check
     * @return Whether the issuer is registered
     */
    function isIssuerRegistered(address issuer) external view returns (bool) {
        return issuers[issuer].registered;
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
        // Validate issuer
        require(issuers[issuer].registered, "Issuer not registered");
        
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
     * @notice Calculate credit score for a user based on their credentials
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

