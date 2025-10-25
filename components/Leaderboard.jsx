/**
 * Leaderboard Component (Phase 4)
 * 
 * Displays top credit scores across the network
 * Demonstrates network effects and ecosystem adoption
 * 
 * Features:
 * - Top 10 users by credit score
 * - Live ranking with trophy icons
 * - Credential count and diversity bonus display
 * - Auto-refresh every 30 seconds
 * - Event-based data aggregation from blockchain
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Trophy, Medal, Award, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACTS, CREDIT_ORACLE_ABI } from '@/lib/contracts';
import { getBestProvider, callWithTimeout } from '@/lib/rpcProvider';

export default function Leaderboard() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        fetchLeaderboard();
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchLeaderboard, 30000);
        return () => clearInterval(interval);
    }, []);
    
    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get reliable provider
            const provider = await getBestProvider(null);
            
            const oracle = new ethers.Contract(
                CONTRACTS.CREDIT_ORACLE,
                CREDIT_ORACLE_ABI,
                provider
            );
            
            // Get ScoreComputed events from last 10,000 blocks (RPC limit)
            // Moca Chain RPC has a maximum [from, to] blocks distance of 10,000
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 10000);
            
            console.log(`Fetching events from block ${fromBlock} to ${currentBlock}...`);
            
            // Query ScoreComputed events
            const filter = oracle.filters.ScoreComputed();
            const events = await oracle.queryFilter(filter, fromBlock, currentBlock);
            
            console.log(`Found ${events.length} ScoreComputed events`);
            
            // Aggregate by user (keep latest score per user)
            const userScores = {};
            
            for (const event of events) {
                const user = event.args.user;
                const score = Number(event.args.finalScore);
                const block = await event.getBlock();
                const timestamp = block.timestamp;
                
                // Only keep the most recent score for each user
                if (!userScores[user] || userScores[user].timestamp < timestamp) {
                    userScores[user] = {
                        address: user,
                        score: score,
                        credentialsCount: event.args.components ? event.args.components.length : 0,
                        diversityBonus: Number(event.args.diversityBonusPercent || 0),
                        timestamp: timestamp,
                        blockNumber: event.blockNumber
                    };
                }
            }
            
            // Sort by score (descending) and take top 10
            const sorted = Object.values(userScores)
                .filter(user => user.score > 500) // Only show users above base score
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
            
            // Fetch actual credential counts from the contract (event doesn't include components)
            const withCounts = await Promise.all(sorted.map(async (u) => {
                try {
                    const count = await callWithTimeout(
                        () => oracle.getUserCredentialCount(u.address),
                        { timeout: 10000, retries: 1 }
                    );
                    return { ...u, credentialsCount: Number(count) };
                } catch (e) {
                    console.warn('Failed fetching credential count for', u.address, e?.message);
                    return { ...u, credentialsCount: u.credentialsCount || 0 };
                }
            }));

            console.log(`Top users:`, withCounts);

            setLeaders(withCounts);
            setLastUpdate(new Date());
            setLoading(false);
            
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            setError(error.message);
            setLoading(false);
        }
    };
    
    // Get tier name based on score
    const getTierName = (score) => {
        if (score >= 900) return 'Exceptional';
        if (score >= 800) return 'Excellent';
        if (score >= 700) return 'Good';
        if (score >= 600) return 'Fair';
        if (score >= 500) return 'Average';
        if (score >= 400) return 'Below Average';
        if (score >= 300) return 'Poor';
        return 'Very Poor';
    };
    
    // Get tier color classes
    const getTierColor = (score) => {
        if (score >= 900) return 'bg-purple-100 text-purple-700 border-purple-300';
        if (score >= 800) return 'bg-blue-100 text-blue-700 border-blue-300';
        if (score >= 700) return 'bg-green-100 text-green-700 border-green-300';
        if (score >= 600) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        return 'bg-orange-100 text-orange-700 border-orange-300';
    };
    
    // Get rank icon based on position
    const getRankIcon = (index) => {
        if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
        if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
        if (index === 2) return <Award className="w-6 h-6 text-orange-600" />;
        return <span className="text-lg font-bold text-gray-400">#{index + 1}</span>;
    };
    
    // Format timestamp to relative time
    const formatTimeAgo = (timestamp) => {
        const seconds = Math.floor(Date.now() / 1000 - timestamp);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };
    
    return (
        <Card className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="w-7 h-7 text-yellow-500" />
                        Top Credit Scores
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Showing the highest-rated users on Moca Chain
                    </p>
                </div>
                <Button
                    onClick={fetchLeaderboard}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>
            
            {/* Last Update Time */}
            {lastUpdate && !loading && (
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
            )}
            
            {/* Loading State */}
            {loading && leaders.length === 0 ? (
                <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500">Fetching leaderboard data...</p>
                    <p className="text-xs text-gray-400 mt-2">Scanning blockchain events</p>
                </div>
            ) : error ? (
                /* Error State */
                <div className="text-center py-12">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                    <p className="text-red-600 mb-2">Error loading leaderboard</p>
                    <p className="text-sm text-gray-500">{error}</p>
                    <Button
                        onClick={fetchLeaderboard}
                        variant="outline"
                        className="mt-4"
                    >
                        Try Again
                    </Button>
                </div>
            ) : leaders.length === 0 ? (
                /* Empty State */
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-2">No scores yet!</p>
                    <p className="text-sm text-gray-500 mb-4">Be the first to build your credit score</p>
                    <Button
                        onClick={() => window.location.href = '/dashboard?tab=builder'}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Build Your Score
                    </Button>
                </div>
            ) : (
                /* Leaderboard List */
                <div className="space-y-3">
                    {leaders.map((leader, index) => (
                        <div
                            key={leader.address}
                            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                                index === 0 ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-md' :
                                index === 1 ? 'border-gray-300 bg-gray-50' :
                                index === 2 ? 'border-orange-300 bg-orange-50' :
                                'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {/* Left: Rank + Address Info */}
                            <div className="flex items-center gap-4">
                                <div className="w-10 flex justify-center">
                                    {getRankIcon(index)}
                                </div>
                                <div>
                                    <p className="font-mono text-sm font-medium">
                                        {leader.address.slice(0, 6)}...{leader.address.slice(-4)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            📝 {leader.credentialsCount} credential{leader.credentialsCount !== 1 ? 's' : ''}
                                        </p>
                                        {leader.diversityBonus > 0 && (
                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                                +{leader.diversityBonus}% bonus
                                            </Badge>
                                        )}
                                        {leader.timestamp && (
                                            <span className="text-xs text-gray-400">
                                                {formatTimeAgo(leader.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right: Score + Tier */}
                            <div className="text-right">
                                <p className={`text-3xl font-bold mb-1 ${
                                    index === 0 ? 'text-yellow-600' :
                                    index === 1 ? 'text-gray-600' :
                                    index === 2 ? 'text-orange-600' :
                                    'text-gray-700'
                                }`}>
                                    {leader.score}
                                </p>
                                <Badge className={getTierColor(leader.score)}>
                                    {getTierName(leader.score)}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Footer Info */}
            {leaders.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 mb-2 font-medium">
                        🎯 Want to climb the ranks?
                    </p>
                    <p className="text-xs text-blue-700">
                        Submit more credentials to increase your score. Income Range and Bank Balance credentials have the highest impact!
                    </p>
                    <Button
                        onClick={() => window.location.href = '/dashboard?tab=builder'}
                        variant="outline"
                        className="mt-3 text-xs border-blue-300 hover:bg-blue-100"
                    >
                        View Score Builder →
                    </Button>
                </div>
            )}
        </Card>
    );
}

