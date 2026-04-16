'use client';

import React from 'react';

interface ScoreCardProps {
    score: number;
    verbal: { filler_rate: number; wpm: number; hedging_count: number };
    visual: { eye_contact_pct: number; smile_frequency: number };
    insight: string;
    onClose: () => void;
}

export default function ScoreCard({ score, verbal, visual, insight, onClose }: ScoreCardProps) {
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100] flex items-center justify-center p-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-zinc-500 text-sm font-bold uppercase tracking-[0.2em] mb-2">Forge Score</h2>
                    <div className="text-7xl font-black text-white">{score}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
                        <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Fillers</div>
                        <div className="text-xl font-bold text-white">{verbal.filler_rate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
                        <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Eye Contact</div>
                        <div className="text-xl font-bold text-white">{visual.eye_contact_pct}%</div>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
                        <div className="text-zinc-500 text-xs font-bold uppercase mb-1">WPM</div>
                        <div className="text-xl font-bold text-white">{verbal.wpm}</div>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
                        <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Smile Rate</div>
                        <div className="text-xl font-bold text-white">{visual.smile_frequency.toFixed(2)}</div>
                    </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mb-8">
                    <div className="text-blue-400 text-xs font-bold uppercase mb-1">Top Insight</div>
                    <p className="text-blue-100 text-sm leading-relaxed">{insight}</p>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-colors"
                >
                    Continue Journey
                </button>
            </div>
        </div>
    );
}
