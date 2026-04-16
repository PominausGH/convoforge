'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import LiveNudge from '@/components/LiveNudge';
import MediaPipeCamera from '@/components/MediaPipeCamera';
import ScoreCard from '@/components/ScoreCard';

type SessionStatus = 'idle' | 'lesson' | 'practice' | 'live_coaching' | 'feedback';

export default function SessionPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [status, setStatus] = useState<SessionStatus>('idle');

    useEffect(() => {
        setUserId(localStorage.getItem('cf_user_id'));
    }, []);
    const [lessonId, setLessonId] = useState(1);
    const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
    const [visualData, setVisualData] = useState({ eye_contact_pct: 0, smile_frequency: 0 });
    const [sessionResult, setSessionResult] = useState<any>(null);

    // Transition State Machine
    useEffect(() => {
        if (status === 'idle') {
            // Auto-start session for MVP
            setStatus('lesson');
            
            // Move to Practice after 60s
            const timer = setTimeout(() => {
                setStatus('practice');
            }, 60000);
            return () => clearTimeout(timer);
        }

        if (status === 'practice') {
            // Move to Live Coaching (Feedback Phase) after 90s
            const timer = setTimeout(() => {
                setStatus('live_coaching');
            }, 90000);
            return () => clearTimeout(timer);
        }

        if (status === 'live_coaching') {
            // Complete session after 10s of processing
            const timer = setTimeout(() => {
                completeSession();
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const handleAnalysisUpdate = useCallback((data: any) => {
        setVisualData(data);
        
        // Trigger Live Nudges based on data
        if (status === 'practice') {
            if (data.eye_contact_pct < 60) {
                setNudgeMessage("Find your anchor (look at camera)");
            } else if (data.smile_frequency > 0.6) {
                setNudgeMessage("Great energy, keep it authentic");
            }
        }
    }, [status]);

    const completeSession = async () => {
        // Mock session result for MVP
        const mockResult = {
            overall_forge_score: 78,
            verbal: { filler_rate: 3.2, wpm: 135, hedging_count: 2 },
            visual: visualData,
            top_insight: "You maintained good energy! To improve, try to reduce 'um' and 'ah' fillers during complex explanations."
        };
        setSessionResult(mockResult);
        setStatus('feedback');
    };

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col gap-6">
            <LiveNudge message={nudgeMessage} />

            {/* Header / Module Progress */}
            <div className="flex justify-between items-center px-4">
                <div className="flex flex-col">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Carnegie Module {lessonId}</span>
                    <h1 className="text-xl font-black">The Power of a Name</h1>
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1.5 w-8 rounded-full ${i <= lessonId ? 'bg-white' : 'bg-zinc-800'}`} />
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
                <Avatar status={status} />
                <MediaPipeCamera 
                    isRecording={status === 'practice'} 
                    onAnalysisUpdate={handleAnalysisUpdate} 
                />
            </div>

            {/* Controls / Footer */}
            <div className="h-20 flex items-center justify-center bg-zinc-900/50 rounded-3xl border border-white/5 backdrop-blur-md">
                {status === 'lesson' && <p className="text-sm font-medium animate-pulse text-zinc-400">Listening to Avatar...</p>}
                {status === 'practice' && <p className="text-sm font-medium text-red-400">Recording Practice Response...</p>}
                {status === 'live_coaching' && <p className="text-sm font-medium animate-pulse text-blue-400">AI Analyzing Performance...</p>}
            </div>

            {/* Post-Session Overlay */}
            {status === 'feedback' && sessionResult && (
                <ScoreCard 
                    score={sessionResult.overall_forge_score}
                    verbal={sessionResult.verbal}
                    visual={sessionResult.visual}
                    insight={sessionResult.top_insight}
                    onClose={() => router.push('/')}
                />
            )}

            {/* Footer space */}
            <div className="h-8" />
        </main>
    );
}
