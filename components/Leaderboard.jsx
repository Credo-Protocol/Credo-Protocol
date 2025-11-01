/**
 * Leaderboard Component (Phase 4)
 * Clean white/black/grey minimalist theme
 * 
 * Displays top credit scores across the network
 * Demonstrates network effects and ecosystem adoption
 * 
 * Features:
 * - Top 10 users by credit score
 * - Live ranking with trophy icons
 * - Credential count and diversity bonus display
 * - Manual refresh via button
 * - Event-based data aggregation from blockchain
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Trophy, RefreshCw, TrendingUp, AlertCircle, FileCheck, Clock } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACTS, CREDIT_ORACLE_ABI } from '@/lib/contracts';
import { getBestProvider, callWithTimeout } from '@/lib/rpcProvider';

export default function Leaderboard() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState(null);
    
    const fetchLeaderboard = useCallback(async () => {
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
    }, []); // Empty dependency array - function never changes
    
    useEffect(() => {
        // Fetch leaderboard once on component mount only
        fetchLeaderboard();
    }, [fetchLeaderboard]);
    
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
    
    // Get tier color classes - minimalist black/white/grey theme
    const getTierColor = (score) => {
        return 'bg-black text-white';
    };
    
    // Get rank icon based on position - minimalist theme
    const getRankIcon = (index) => {
        if (index === 0) return <Trophy className="w-6 h-6 text-black" />;
        if (index === 1) return <Trophy className="w-5 h-5 text-black/60" />;
        if (index === 2) return <Trophy className="w-5 h-5 text-black/40" />;
        return <span className="text-lg font-bold text-black/30">#{index + 1}</span>;
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
        <Card className="glass-card glass-strong hover-expand p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-black">
                        <Trophy className="w-7 h-7" />
                        Top Credit Scores
                    </h2>
                    <p className="text-sm text-black/60 mt-2">
                        Showing the highest-rated users on Moca Chain
                    </p>
                </div>
                <Button
                    onClick={fetchLeaderboard}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center gap-2 border border-black/20 bg-white hover:bg-black/5 hover:border-black/30 text-black font-medium disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </Button>
            </div>
            
            {/* Last Update Time */}
            {lastUpdate && !loading && (
                <p className="text-xs text-black/50 mb-6 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Last updated: {lastUpdate.toLocaleTimeString()}
                </p>
            )}
            
            {/* Loading State */}
            {loading && leaders.length === 0 ? (
                <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-black/40 animate-spin mx-auto mb-3" />
                    <p className="text-black/60">Fetching leaderboard data...</p>
                    <p className="text-xs text-black/40 mt-2">Scanning blockchain events</p>
                </div>
            ) : error ? (
                /* Error State */
                <div className="text-center py-12">
                    <AlertCircle className="w-8 h-8 text-black/40 mx-auto mb-3" />
                    <p className="text-black font-semibold mb-2">Error loading leaderboard</p>
                    <p className="text-sm text-black/60">{error}</p>
                    <Button
                        onClick={fetchLeaderboard}
                        variant="outline"
                        className="mt-4 border border-black/20 bg-white hover:bg-black/5 hover:border-black/30 text-black font-medium"
                    >
                        Try Again
                    </Button>
                </div>
            ) : leaders.length === 0 ? (
                /* Empty State */
                <div className="text-center py-12 bg-neutral-50 rounded-xl border-2 border-dashed border-black/10">
                    <Trophy className="w-12 h-12 text-black/20 mx-auto mb-3" />
                    <p className="text-black font-semibold mb-2">No scores yet!</p>
                    <p className="text-sm text-black/60 mb-6">Be the first to build your credit score</p>
                    <Button
                        onClick={() => window.location.href = '/dashboard?tab=builder'}
                        className="bg-black hover:bg-black/90 text-white transition-all duration-300 hover:scale-[1.02]"
                    >
                        Build Your Score
                    </Button>
                </div>
            ) : (
                /* Leaderboard List */
                <div className="space-y-4">
                    {leaders.map((leader, index) => (
                        <div
                            key={leader.address}
                            className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all hover:shadow-md ${
                                index === 0 ? 'border-black bg-neutral-50 shadow-md' :
                                index === 1 ? 'border-black/30 bg-white' :
                                index === 2 ? 'border-black/20 bg-white' :
                                'border-black/10 hover:border-black/20 bg-white'
                            }`}
                        >
                            {/* Left: Rank + Address Info */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 flex justify-center">
                                    {getRankIcon(index)}
                                </div>
                                <div>
                                    <p className="font-mono text-sm font-medium text-black">
                                        {leader.address.slice(0, 6)}...{leader.address.slice(-4)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <p className="text-xs text-black/60 flex items-center gap-1">
                                            <FileCheck className="w-3 h-3" />
                                            {leader.credentialsCount} credential{leader.credentialsCount !== 1 ? 's' : ''}
                                        </p>
                                        {leader.diversityBonus > 0 && (
                                            <Badge variant="outline" className="text-xs bg-black text-white border-black">
                                                +{leader.diversityBonus}% bonus
                                            </Badge>
                                        )}
                                        {leader.timestamp && (
                                            <span className="text-xs text-black/40 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTimeAgo(leader.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right: Score + Tier */}
                            <div className="text-right">
                                <p className="text-4xl font-bold mb-2 text-black">
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
        </Card>
    );
}

