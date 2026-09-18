import React from 'react';

export const LISTENING_SKILLS = [
    {
        key: 'facts',
        label: 'Capture the facts',
        instruction: 'What actually happened — who, what, when. Get the shape of it right.',
    },
    {
        key: 'feeling',
        label: 'Name the feeling',
        instruction: 'Don’t just repeat words back — say what they seemed to feel, out loud.',
    },
    {
        key: 'validate',
        label: 'Validate, don’t just summarize',
        instruction: 'A perfectly accurate recap with zero acknowledgment of the feeling still isn’t active listening.',
    },
    {
        key: 'own_words',
        label: 'Use your own words',
        instruction: 'Paraphrase, don’t parrot — word-for-word repetition isn’t reflection.',
    },
] as const;

export const REFLECTING_TIPS = [
    'Lead with "It sounds like..." or "What I’m hearing is..." — that framing alone signals you were listening.',
    'Resist the urge to jump straight to advice, or to top it with your own similar story.',
    'Small factual misses matter less than the feeling landing — don’t stall chasing a detail you forgot.',
    'One sentence of validation beats a long, accurate summary with none.',
];

/**
 * Compact reference strip shown during lesson/practice for active-listening
 * sessions — a glanceable reminder of what a good reflection covers.
 */
export function ListeningReflectionStrip() {
    return (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Reflect back: facts, feeling, validation, your own words">
            {LISTENING_SKILLS.map((skill, i) => (
                <React.Fragment key={skill.key}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
                        {skill.label}
                    </span>
                    {i < LISTENING_SKILLS.length - 1 && (
                        <span className="text-zinc-600 text-xs" aria-hidden>
                            +
                        </span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

/**
 * Full teaching panel used on /listening-lab — what a good reflection
 * covers, plus tips for how to deliver it.
 */
export function ListeningStimulusGuide() {
    return (
        <div className="space-y-8">
            <div className="space-y-3">
                {LISTENING_SKILLS.map((skill, i) => (
                    <div
                        key={skill.key}
                        className="flex gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4"
                    >
                        <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-sm flex items-center justify-center">
                            {i + 1}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{skill.label}</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                                {skill.instruction}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300 mb-3">
                    Reflecting well
                </h3>
                <ul className="space-y-2">
                    {REFLECTING_TIPS.map((tip) => (
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
