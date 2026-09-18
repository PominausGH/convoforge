import React from 'react';

export const STORY_BEATS = [
    {
        key: 'hook',
        label: 'Hook',
        time: '0–8s',
        instruction: 'Start mid-scene or with a sharp claim. No "so basically" or "a while back."',
        example: 'The email landed at 11pm on a Friday, with my name in the subject line.',
    },
    {
        key: 'context',
        label: 'Context',
        time: '~10s',
        instruction: 'One sentence: who, where, when. That’s all the setup you get.',
        example: 'I was three weeks into the job — still learning where the coffee machine was.',
    },
    {
        key: 'turn',
        label: 'The Turn',
        time: 'the heart',
        instruction: 'The complication. What went wrong, or what changed. Everything before this is throat-clearing.',
        example: 'The number in that email was wrong — and I was the only one who’d notice before Monday.',
    },
    {
        key: 'resolution',
        label: 'Resolution',
        time: 'the "therefore"',
        instruction: 'What you actually did. A specific action, not a summary.',
        example: 'So I called the client myself, at midnight, and owned the mistake before they found it.',
    },
    {
        key: 'takeaway',
        label: 'Takeaway',
        time: 'one line',
        instruction: 'The "so what." The one sentence that tells people why this mattered. Most people skip this — don’t.',
        example: 'The fix that costs you a weekend is cheaper than the one that costs you trust.',
    },
] as const;

export const DELIVERY_TIPS = [
    'Pause half a second before the turn — silence sells tension.',
    'Use concrete, sensory words over abstractions ("the email landed at 11pm," not "I received unexpected communication").',
    'Let your pace change: slow down for the turn, speed up for the action.',
    'One real emotion beats ten adjectives. Say what you felt, once, plainly.',
    'Cut every sentence that doesn’t move the story forward — that’s where "concise" comes from.',
];

/**
 * Compact reference strip shown during lesson/practice for storytelling-track
 * sessions — a glanceable reminder of the 5 beats, not a progress tracker
 * (we don't segment the live transcript by beat).
 */
export function StoryStructureStrip() {
    return (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Story structure: hook, context, turn, resolution, takeaway">
            {STORY_BEATS.map((beat, i) => (
                <React.Fragment key={beat.key}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
                        {beat.label}
                    </span>
                    {i < STORY_BEATS.length - 1 && (
                        <span className="text-zinc-600 text-xs" aria-hidden>
                            →
                        </span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

/**
 * Full teaching panel used on /story-lab — the beat-by-beat breakdown with
 * instructions and a worked example, plus delivery tips for pace/energy.
 */
export function StoryStructureGuide() {
    return (
        <div className="space-y-8">
            <div className="space-y-3">
                {STORY_BEATS.map((beat, i) => (
                    <div
                        key={beat.key}
                        className="flex gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4"
                    >
                        <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-sm flex items-center justify-center">
                            {i + 1}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{beat.label}</h3>
                                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
                                    {beat.time}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                                {beat.instruction}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 italic border-l-2 border-zinc-200 dark:border-zinc-700 pl-3">
                                &ldquo;{beat.example}&rdquo;
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300 mb-3">
                    Delivering it with passion
                </h3>
                <ul className="space-y-2">
                    {DELIVERY_TIPS.map((tip) => (
                        <li key={tip} className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed flex gap-2">
                            <span aria-hidden>&bull;</span>
                            <span>{tip}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
