'use client';

import React from 'react';

const SILHOUETTES = [
    { top: '8%', left: '6%', size: 44 },
    { top: '14%', right: '8%', size: 52 },
    { top: '62%', left: '10%', size: 38 },
    { top: '58%', right: '6%', size: 46 },
];

function Silhouette({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size * 1.3}
            viewBox="0 0 40 52"
            fill="none"
            aria-hidden="true"
        >
            <circle cx="20" cy="12" r="12" className="fill-zinc-600/40" />
            <path
                d="M2 52c0-12 8-20 18-20s18 8 18 20"
                className="fill-zinc-600/40"
            />
        </svg>
    );
}

/**
 * Silent silhouette figures around the avatar, so practice feels like a
 * small group is present rather than one bot in an empty room. Purely
 * visual — no audio, no interaction. Opt-in ("Group mode") since it adds
 * pressure some users specifically want and others don't.
 */
export default function GroupBackground() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {SILHOUETTES.map((pos, i) => (
                <div key={i} className="absolute" style={pos}>
                    <Silhouette size={pos.size} />
                </div>
            ))}
        </div>
    );
}
