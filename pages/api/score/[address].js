/**
 * Public Credit Score API Endpoint (Phase 4)
 * 
 * Provides composable credit score data for any dApp to query
 * 
 * Usage:
 *   GET /api/score/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
 * 
 * Features:
 * - CORS enabled for cross-origin access
 * - Returns score, tier, borrowing power, and use cases
 * - Cached for 60 seconds to reduce RPC load
 * - Integration guide included in response
 */

import { ethers } from 'ethers';

// Contract addresses and RPC from environment
const CREDIT_ORACLE_ADDRESS = process.env.NEXT_PUBLIC_CREDIT_ORACLE_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet-rpc.mocachain.org';

// Minimal Oracle ABI for score queries
// IMPORTANT: Must match actual contract function signatures exactly!
const ORACLE_ABI = [
    "function getCreditScore(address user) view returns (uint256)",
    "function getScoreDetails(address user) view returns (uint256 score, uint256 credentialCount, uint256 lastUpdated, bool initialized)",
    "function getUserCredentialCount(address user) view returns (uint256)",
    "function getTierForScore(uint16 score) view returns (tuple(uint16 minScore, uint16 maxScore, uint16 collateralFactor, string tierName))"
];

export default async function handler(req, res) {
    // CORS headers - allow any origin to access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            allowedMethods: ['GET'],
            example: 'GET /api/score/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
        });
    }
    
    const { address } = req.query;
    
    // Validate address parameter exists
    if (!address) {
        return res.status(400).json({ 
            error: 'Address parameter required',
            example: '/api/score/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            usage: 'GET /api/score/:ethereumAddress'
        });
    }
    
    // Validate address format
    if (!ethers.isAddress(address)) {
        return res.status(400).json({ 
            error: 'Invalid Ethereum address format',
            provided: address,
            expected: '0x followed by 40 hexadecimal characters'
        });
    }
    
    try {
        // Connect to Moca Chain
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const oracle = new ethers.Contract(CREDIT_ORACLE_ADDRESS, ORACLE_ABI, provider);
        
        // Fetch on-chain credit data
        let score;
        try {
            score = await oracle.getCreditScore(address);
        } catch (contractError) {
            // Handle contract revert (user has no credentials)
            if (contractError.message.includes('execution reverted') || 
                contractError.message.includes('require(false)') ||
                contractError.code === 'CALL_EXCEPTION') {
                return res.status(404).json({
                    error: 'User has not submitted any credentials yet',
                    address: address,
                    baseScore: 500,
                    message: 'Users start with base score 500 after first credential submission',
                    suggestedAction: 'Visit dashboard to build credit score',
                    links: {
                        dashboard: `https://${req.headers.host}/dashboard`,
                        buildScore: `https://${req.headers.host}/dashboard?tab=builder`,
                        docs: 'https://github.com/Credo-Protocol/Credo-Protocol#readme'
                    }
                });
            }
            // If it's a different contract error, throw it
            throw contractError;
        }
        
        const scoreNumber = Number(score);
        
        // Check if user has any credentials (score = 0 means no credentials)
        if (scoreNumber === 0) {
            return res.status(404).json({
                error: 'User has not submitted any credentials yet',
                address: address,
                baseScore: 500,
                message: 'Users start with base score 500 after first credential submission',
                suggestedAction: 'Visit dashboard to build credit score',
                links: {
                    dashboard: `https://${req.headers.host}/dashboard`,
                    buildScore: `https://${req.headers.host}/dashboard?tab=builder`,
                    docs: 'https://github.com/Credo-Protocol/Credo-Protocol#readme'
                }
            });
        }
        
        // Fetch details and tier
        const [details, tier] = await Promise.all([
            oracle.getScoreDetails(address),
            oracle.getTierForScore(Number(score))
        ]);
        
        // Calculate borrowing power metrics
        const collateralPercent = Number(tier.collateralFactor) / 100; // percent value from tier
        const borrowPerDollar = (100 / collateralPercent).toFixed(2);
        const exampleSupply = 1000;
        const exampleBorrow = Math.floor(exampleSupply * 100 / collateralPercent);
        
        // Get tier APR (hardcoded based on our contract)
        const getTierAPR = (score) => {
            if (score >= 900) return '5%';
            if (score >= 800) return '6%';
            if (score >= 700) return '7.5%';
            if (score >= 600) return '9%';
            if (score >= 500) return '11%';
            if (score >= 400) return '13%';
            if (score >= 300) return '15%';
            return '18%';
        };
        
        // Build comprehensive response
        const response = {
            success: true,
            data: {
                address: address,
                creditScore: scoreNumber,
                tier: {
                    name: tier.tierName,
                    minScore: Number(tier.minScore),
                    maxScore: Number(tier.maxScore),
                    collateralRequired: `${collateralPercent}%`,
                    borrowAPR: getTierAPR(scoreNumber)
                },
                borrowingPower: {
                    collateralFactor: collateralPercent,
                    borrowPerDollar: `$${borrowPerDollar}`,
                    example: {
                        supply: `$${exampleSupply}`,
                        canBorrow: `$${exampleBorrow}`,
                        description: `With ${tier.tierName} tier, supplying $${exampleSupply} allows borrowing up to $${exampleBorrow}`
                    }
                },
                credentials: {
                    count: Number(details[1] ?? 0),
                    types: [] // Types not exposed in v2 view; can be derived from events if needed
                },
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    network: 'Moca Devnet',
                    chainId: 5151,
                    cached: '60 seconds'
                }
            },
            composability: {
                description: "This credit score can be used by any dApp on Moca Chain",
                useCases: [
                    "🎮 GameFi: Gate premium features to users with score > 700",
                    "🏛️ DAOs: Adjust governance weights by creditworthiness",
                    "🛒 Commerce: Offer 'buy now, pay later' to high-score users",
                    "💰 DeFi: Dynamic pricing and interest rates based on user trust",
                    "🎨 NFTs: Exclusive mints or airdrops for established users"
                ],
                integration: {
                    rest: {
                        endpoint: `GET https://${req.headers.host}/api/score/:address`,
                        example: `curl https://${req.headers.host}/api/score/${address}`,
                        rateLimit: "60 requests/minute (cached)",
                        cors: "Enabled for all origins"
                    },
                    onChain: {
                        interface: "ICreditScoreOracle",
                        address: CREDIT_ORACLE_ADDRESS,
                        method: `oracle.getCreditScore(userAddress)`,
                        solidity: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICreditScoreOracle {
    function getCreditScore(address user) external view returns (uint256);
}

contract YourDApp {
    ICreditScoreOracle oracle = ICreditScoreOracle(${CREDIT_ORACLE_ADDRESS});
    
    function checkUserAccess(address user) public view returns (bool) {
        uint256 score = oracle.getCreditScore(user);
        return score >= 700; // Require "Good" tier or better
    }
}`.trim()
                    }
                }
            },
            links: {
                dashboard: `https://${req.headers.host}/dashboard`,
                buildScore: `https://${req.headers.host}/dashboard?tab=builder`,
                explorer: `https://devnet-scan.mocachain.org/address/${CREDIT_ORACLE_ADDRESS}`,
                github: 'https://github.com/Credo-Protocol/Credo-Protocol',
                docs: 'https://github.com/Credo-Protocol/Credo-Protocol/tree/main/documents'
            }
        };
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Error fetching credit score:', error);
        
        // Handle specific RPC errors
        if (error.message.includes('network') || error.message.includes('timeout')) {
            return res.status(503).json({
                error: 'RPC connection error',
                message: 'Unable to connect to Moca Chain. Please try again.',
                address: address,
                troubleshooting: 'Check RPC status at https://devnet-scan.mocachain.org'
            });
        }
        
        // Handle contract revert errors (already handled above, but just in case)
        if (error.message.includes('execution reverted') || 
            error.message.includes('call revert') ||
            error.code === 'CALL_EXCEPTION') {
            return res.status(404).json({
                error: 'User has not submitted any credentials yet',
                address: address,
                message: 'This address has no credit score on-chain',
                suggestedAction: 'Submit credentials to build your credit score',
                links: {
                    dashboard: `https://${req.headers.host}/dashboard`,
                    buildScore: `https://${req.headers.host}/dashboard?tab=builder`
                }
            });
        }
        
        // Generic error
        res.status(500).json({ 
            error: 'Failed to fetch credit score',
            message: error.message,
            address: address,
            support: 'Please report this issue on GitHub'
        });
    }
}

