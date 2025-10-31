/**
 * Score Builder Wizard Component (Phase 3 Part B)
 * Clean white/black/grey minimalist theme
 * 
 * Interactive tool that helps users understand how to improve their credit score
 * 
 * Features:
 * - Real-time score simulation based on credential selection
 * - Clear "points to next tier" progress tracking
 * - Visual comparison of current vs simulated score
 * - Shows impact on collateral factor and APR
 * - Privacy-first credential highlighting
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
    CheckCircle, 
    TrendingUp, 
    Lock, 
    Unlock, 
    Sparkles, 
    DollarSign, 
    Building2, 
    TrendingUp as ChartIcon, 
    Briefcase,
    ArrowRight 
} from 'lucide-react';

export default function ScoreBuilderWizard({ 
    currentScore = 500, 
    submittedCredentials = [],
    onRequestCredential 
}) {
    const [selectedCredentials, setSelectedCredentials] = useState([]);
    const [simulatedScore, setSimulatedScore] = useState(currentScore);
    
    // Tier definitions (must match Phase 1 on-chain tiers)
    const tiers = [
        { min: 900, max: 1000, name: 'Exceptional', collateral: '50%', color: 'purple', apr: '5%' },
        { min: 800, max: 899, name: 'Excellent', collateral: '60%', color: 'blue', apr: '6%' },
        { min: 700, max: 799, name: 'Good', collateral: '75%', color: 'green', apr: '7.5%' },
        { min: 600, max: 699, name: 'Fair', collateral: '90%', color: 'yellow', apr: '9%' },
        { min: 500, max: 599, name: 'Average', collateral: '100%', color: 'orange', apr: '11%' },
        { min: 400, max: 499, name: 'Below Average', collateral: '110%', color: 'orange', apr: '13%' },
        { min: 300, max: 399, name: 'Poor', collateral: '125%', color: 'red', apr: '15%' },
        { min: 0, max: 299, name: 'Very Poor', collateral: '150%', color: 'red', apr: '18%' }
    ];
    
    const getCurrentTier = (score) => {
        return tiers.find(t => score >= t.min && score <= t.max) || tiers[7];
    };
    
    const getNextTier = (score) => {
        const currentIndex = tiers.findIndex(t => score >= t.min && score <= t.max);
        return currentIndex > 0 ? tiers[currentIndex - 1] : null;
    };
    
    const currentTier = getCurrentTier(currentScore);
    const nextTier = getNextTier(currentScore);
    const pointsToNextTier = nextTier ? nextTier.min - currentScore : 0;
    
    // Available credentials with their potential point ranges
    const availableCredentials = [
        {
            id: 'income-range',
            name: 'Income Range',
            icon: DollarSign,
            points: '+50-180',
            avgPoints: 140,
            description: 'Highest impact - verify income bracket',
            new: true,
            badge: 'Highest Weight',
            badgeColor: 'bg-black text-white'
        },
        {
            id: 'bank-balance',
            name: 'Bank Balance (30d avg)',
            icon: Building2,
            points: '+40-150',
            avgPoints: 120,
            description: 'Prove financial stability',
            new: true,
            badge: 'Privacy-First',
            badgeColor: 'bg-black text-white'
        },
        {
            id: 'cex-history',
            name: 'CEX Trading History',
            icon: ChartIcon,
            points: '+80',
            avgPoints: 80,
            description: 'Show crypto experience'
        },
        {
            id: 'employment',
            name: 'Employment Proof',
            icon: Briefcase,
            points: '+70',
            avgPoints: 70,
            description: 'Verify job status'
        }
    ];
    
    // Check if credential already submitted
    const isSubmitted = (credId) => {
        return submittedCredentials.some(c => {
            if (!c || !c.credentialType) return false;
            const type = String(c.credentialType).toLowerCase();
            return type.includes(credId.replace('-', '_')) || 
                   type.includes(credId.replace('-history', ''));
        });
    };
    
    // Simulate score based on selected credentials
    useEffect(() => {
        let baseScore = currentScore;
        
        // Add points from selected credentials
        selectedCredentials.forEach(cred => {
            baseScore += cred.avgPoints;
        });
        
        // Apply diversity bonus (5% per credential, max 25%)
        const totalCredentials = submittedCredentials.length + selectedCredentials.length;
        const diversityBonus = Math.min(totalCredentials * 5, 25);
        baseScore = Math.floor(baseScore * (1 + diversityBonus / 100));
        
        // Cap at 1000
        setSimulatedScore(Math.min(baseScore, 1000));
    }, [selectedCredentials, currentScore, submittedCredentials]);
    
    const toggleCredential = (cred) => {
        if (isSubmitted(cred.id)) return;
        
        setSelectedCredentials(prev => {
            const exists = prev.find(c => c.id === cred.id);
            if (exists) {
                return prev.filter(c => c.id !== cred.id);
            }
            return [...prev, cred];
        });
    };
    
    const handleRequestSelected = async () => {
        // Just navigate to Build Credit tab
        // User can request credentials there using existing flow
        if (onRequestCredential) {
            await onRequestCredential({ credentials: selectedCredentials });
        }
        // Don't clear selection - user can see what they wanted
    };
    
    return (
        <div className="space-y-6">
            {/* Current vs Simulated Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Score */}
                <Card className="glass-card glass-strong hover-expand p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-black/40" />
                            <span className="text-sm font-medium text-black/50">Current Score</span>
                        </div>
                    </div>
                    <p className="text-6xl font-bold mb-4 text-black">{currentScore}</p>
                    <Badge className="bg-black/5 text-black border-black/10">
                        {currentTier.name}
                    </Badge>
                    <div className="mt-6 space-y-3 text-sm text-black/60">
                        <div className="flex justify-between items-center py-2 border-b border-black/5">
                            <span>Collateral Required:</span>
                            <span className="font-semibold text-black">{currentTier.collateral}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span>Borrow APR:</span>
                            <span className="font-semibold text-black">{currentTier.apr}</span>
                        </div>
                    </div>
                </Card>
                
                {/* Simulated Score */}
                <Card className="glass-card glass-strong hover-expand glass-card--black-border p-8 bg-neutral-50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Unlock className="w-5 h-5 text-black" />
                            <span className="text-sm font-medium text-black">Simulated Score</span>
                        </div>
                        {simulatedScore > currentScore && (
                            <Badge className="bg-green-600 text-white">
                                +{simulatedScore - currentScore} pts
                            </Badge>
                        )}
                    </div>
                    <p className={`text-6xl font-bold mb-4 ${simulatedScore > currentScore ? 'text-green-600' : 'text-black'}`}>{simulatedScore}</p>
                    <Badge className="bg-black/10 text-black border-black/20">
                        {getCurrentTier(simulatedScore).name}
                    </Badge>
                    <div className="mt-6 space-y-3 text-sm text-black/60">
                        <div className="flex justify-between items-center py-2 border-b border-black/10">
                            <span>Collateral Required:</span>
                            <span className={`font-semibold ${simulatedScore > currentScore ? 'text-green-600' : 'text-black'}`}>
                                {getCurrentTier(simulatedScore).collateral}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span>Borrow APR:</span>
                            <span className={`font-semibold ${simulatedScore > currentScore ? 'text-green-600' : 'text-black'}`}>
                                {getCurrentTier(simulatedScore).apr}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
            
            {/* Progress to Next Tier */}
            {nextTier && (
                <Card className="glass-card glass-strong hover-expand p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-xl flex items-center gap-2 text-black">
                            <TrendingUp className="w-6 h-6" />
                            Progress to {nextTier.name} Tier
                        </h3>
                        <span className="text-sm font-medium text-black/60">
                            {pointsToNextTier} points needed
                        </span>
                    </div>
                    
                    <Progress 
                        value={Math.min(((simulatedScore - currentTier.min) / (nextTier.min - currentTier.min)) * 100, 100)} 
                        className="h-3 mb-6"
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-black/70">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span>Better collateral: <strong className="text-green-600">{nextTier.collateral}</strong> vs {currentTier.collateral}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span>Lower APR: <strong className="text-green-600">{nextTier.apr}</strong> vs {currentTier.apr}</span>
                        </div>
                    </div>
                    
                    {simulatedScore >= nextTier.min && (
                        <div className="mt-6 p-4 bg-black text-white rounded-xl">
                            <p className="text-sm font-semibold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 flex-shrink-0" />
                                Selected credentials will unlock {nextTier.name} tier!
                            </p>
                        </div>
                    )}
                </Card>
            )}
            
            {/* Credential Selector */}
            <Card className="glass-card glass-strong hover-expand p-8">
                <h3 className="font-semibold text-2xl mb-6 text-black">Select Credentials to Request</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableCredentials.map(cred => {
                        const isSelected = selectedCredentials.some(c => c.id === cred.id);
                        const submitted = isSubmitted(cred.id);
                        const IconComponent = cred.icon;
                        
                        return (
                            <div
                                key={cred.id}
                                className={`p-6 border-2 rounded-xl transition-all cursor-pointer flex flex-col h-full ${
                                    submitted 
                                        ? 'border-black/20 bg-neutral-50 cursor-not-allowed opacity-60'
                                        : isSelected 
                                        ? 'border-black bg-neutral-50 shadow-md'
                                        : 'border-black/10 hover:border-black/30 hover:shadow-sm bg-white'
                                }`}
                                onClick={() => !submitted && toggleCredential(cred)}
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center text-white flex-shrink-0">
                                        <IconComponent className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <p className="font-semibold text-black">{cred.name}</p>
                                            {cred.new && <Badge className="bg-green-600 text-white text-xs">New</Badge>}
                                        </div>
                                        <div className="min-h-[24px] mb-2">
                                            {cred.badge && (
                                                <Badge className={`${cred.badgeColor} text-xs`}>
                                                    {cred.badge}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-black/60 leading-relaxed">{cred.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/10">
                                    <span className="text-sm font-bold text-black">{cred.points}</span>
                                    {submitted && (
                                        <CheckCircle className="w-5 h-5 text-black" />
                                    )}
                                    {isSelected && !submitted && (
                                        <Badge className="bg-black text-white">Selected</Badge>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
            
            {/* Action Buttons */}
            {selectedCredentials.length > 0 && (
                <Card className="glass-card glass-strong hover-expand glass-card--black-border p-6 bg-neutral-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="font-semibold text-black text-lg">
                                {selectedCredentials.length} Credential{selectedCredentials.length > 1 ? 's' : ''} Selected
                            </p>
                            <p className="text-sm text-black/60 mt-1">
                                Ready to request and improve your score
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => setSelectedCredentials([])}
                                className="border border-black/20 bg-white hover:bg-black/5 hover:border-black/30 text-black font-medium"
                            >
                                Clear
                            </Button>
                            <Button 
                                onClick={handleRequestSelected}
                                className="bg-black hover:bg-black/90 text-white transition-all duration-300 hover:scale-[1.02] flex items-center gap-2"
                            >
                                Go to Build Credit
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

