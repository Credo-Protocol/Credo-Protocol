/**
 * Score Builder Wizard Component (Phase 3 Part B)
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
import { AlertCircle, CheckCircle, TrendingUp, Lock, Unlock, Sparkles } from 'lucide-react';

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
            icon: '💰',
            points: '+50-180',
            avgPoints: 140,
            description: 'Highest impact - verify income bracket',
            new: true,
            badge: 'Highest Weight',
            badgeColor: 'bg-purple-500'
        },
        {
            id: 'bank-balance',
            name: 'Bank Balance (30d avg)',
            icon: '🏦',
            points: '+40-150',
            avgPoints: 120,
            description: 'Prove financial stability',
            new: true,
            badge: 'Privacy-First',
            badgeColor: 'bg-green-500'
        },
        {
            id: 'cex-history',
            name: 'CEX Trading History',
            icon: '📊',
            points: '+80',
            avgPoints: 80,
            description: 'Show crypto experience'
        },
        {
            id: 'employment',
            name: 'Employment Proof',
            icon: '💼',
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
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Build Your Credit Score</h2>
                <p className="text-gray-600">
                    Select credentials to see how they'll improve your borrowing power
                </p>
            </div>
            
            {/* Current vs Simulated Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Score */}
                <Card className="p-6 border-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-500">Current Score</span>
                        </div>
                    </div>
                    <p className="text-5xl font-bold mb-3">{currentScore}</p>
                    <Badge className={`bg-${currentTier.color}-100 text-${currentTier.color}-700 border-${currentTier.color}-300`}>
                        {currentTier.name}
                    </Badge>
                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Collateral Required:</span>
                            <span className="font-semibold">{currentTier.collateral}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Borrow APR:</span>
                            <span className="font-semibold">{currentTier.apr}</span>
                        </div>
                    </div>
                </Card>
                
                {/* Simulated Score */}
                <Card className="p-6 border-2 border-blue-500 bg-blue-50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Unlock className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">Simulated Score</span>
                        </div>
                        {simulatedScore > currentScore && (
                            <Badge className="bg-green-500 text-white">
                                +{simulatedScore - currentScore} pts
                            </Badge>
                        )}
                    </div>
                    <p className="text-5xl font-bold mb-3 text-blue-600">{simulatedScore}</p>
                    <Badge className={`bg-${getCurrentTier(simulatedScore).color}-100 text-${getCurrentTier(simulatedScore).color}-700`}>
                        {getCurrentTier(simulatedScore).name}
                    </Badge>
                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between">
                            <span>Collateral Required:</span>
                            <span className="font-semibold">{getCurrentTier(simulatedScore).collateral}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Borrow APR:</span>
                            <span className="font-semibold">{getCurrentTier(simulatedScore).apr}</span>
                        </div>
                    </div>
                </Card>
            </div>
            
            {/* Progress to Next Tier */}
            {nextTier && (
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Progress to {nextTier.name} Tier
                        </h3>
                        <span className="text-sm font-medium text-gray-600">
                            {pointsToNextTier} points needed
                        </span>
                    </div>
                    
                    <Progress 
                        value={Math.min(((simulatedScore - currentTier.min) / (nextTier.min - currentTier.min)) * 100, 100)} 
                        className="h-4 mb-3"
                    />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Better collateral: <strong>{nextTier.collateral}</strong> vs {currentTier.collateral}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Lower APR: <strong>{nextTier.apr}</strong> vs {currentTier.apr}</span>
                        </div>
                    </div>
                    
                    {simulatedScore >= nextTier.min && (
                        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                            <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Selected credentials will unlock {nextTier.name} tier! 🎉
                            </p>
                        </div>
                    )}
                </Card>
            )}
            
            {/* Credential Selector */}
            <Card className="p-6">
                <h3 className="font-semibold text-xl mb-4">Select Credentials to Request</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableCredentials.map(cred => {
                        const isSelected = selectedCredentials.some(c => c.id === cred.id);
                        const submitted = isSubmitted(cred.id);
                        
                        return (
                            <div
                                key={cred.id}
                                className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                                    submitted 
                                        ? 'border-green-300 bg-green-50 cursor-not-allowed opacity-60'
                                        : isSelected 
                                        ? 'border-blue-500 bg-blue-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }`}
                                onClick={() => !submitted && toggleCredential(cred)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{cred.icon}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{cred.name}</p>
                                                {cred.new && <Badge className="bg-green-500 text-white text-xs">New</Badge>}
                                            </div>
                                            {cred.badge && (
                                                <Badge className={`mt-1 ${cred.badgeColor} text-white text-xs`}>
                                                    {cred.badge}
                                                </Badge>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">{cred.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-sm font-bold text-blue-600">{cred.points}</span>
                                    {submitted && (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    )}
                                    {isSelected && !submitted && (
                                        <Badge className="bg-blue-600 text-white">Selected</Badge>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
            
            {/* Action Buttons */}
            {selectedCredentials.length > 0 && (
                <Card className="p-4 bg-blue-50 border-blue-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-blue-900">
                                {selectedCredentials.length} Credential{selectedCredentials.length > 1 ? 's' : ''} Selected
                            </p>
                            <p className="text-sm text-blue-700">
                                Ready to request and improve your score
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => setSelectedCredentials([])}
                            >
                                Clear
                            </Button>
                            <Button 
                                onClick={handleRequestSelected}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Go to Build Credit →
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

