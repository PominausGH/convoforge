'use client';

import React from 'react';

interface AvatarProps {
    status: 'idle' | 'lesson' | 'practice' | 'live_coaching' | 'feedback';
    persona?: string;
}

export default function Avatar({ status, persona = 'global_pro' }: AvatarProps) {
    return (
        <div className="relative w-full h-full bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center p-4 md:p-8 text-center group">

            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent opacity-50" />

            <div className="z-10 flex flex-col items-center">
                {/* Visual indicator for "Avatar" */}
                <div className="w-20 h-20 md:w-40 md:h-40 bg-zinc-800 rounded-full mb-3 md:mb-6 border-2 md:border-4 border-zinc-700 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <div className="text-2xl md:text-4xl">🤖</div>
                </div>

                <div className="space-y-1 md:space-y-2">
                    <h3 className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Persona: {persona}</h3>
                    <div className="text-lg md:text-2xl font-black text-white capitalize leading-tight">
                        {status.replace('_', ' ')} Mode
                    </div>
                </div>

                {status === 'lesson' && (
                    <div className="mt-4 md:mt-8 flex gap-2">
                        <div className="h-1 w-20 md:w-24 bg-blue-500/30 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 animate-[progress_60s_linear]" />
                        </div>
                    </div>
                )}
            </div>

            {/* Glowing borders based on status */}
            <div className={`absolute inset-0 border-2 rounded-3xl transition-colors duration-1000 ${
                status === 'practice' ? 'border-red-500/30 shadow-[inset_0_0_50px_rgba(239,68,68,0.1)]' : 
                status === 'lesson' ? 'border-blue-500/30 shadow-[inset_0_0_50px_rgba(59,130,246,0.1)]' :
                'border-transparent'
            }`} />

            <style jsx>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </div>
    );
}
