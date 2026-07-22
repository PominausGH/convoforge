'use client';

import React, { useEffect, useState } from 'react';

interface LiveNudgeProps {
    message: string | null;
    duration?: number;
}

export default function LiveNudge({ message, duration = 3000 }: LiveNudgeProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration]);

    if (!visible || !message) return null;

    return (
        <div
            role="status"
            aria-live="assertive"
            aria-atomic="true"
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce"
        >
            <div className="bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/20 shadow-xl">
                <span className="text-sm font-medium uppercase tracking-wider">{message}</span>
            </div>
        </div>
    );
}
