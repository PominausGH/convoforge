/**
 * Umami wrapper. No-ops when the Umami script isn't loaded, so it's safe to
 * call unconditionally from components. Event names are snake_case.
 */

type UmamiPayload = Record<string, string | number | boolean | null | undefined>;

type UmamiAPI = {
    track: {
        (eventName: string, data?: UmamiPayload): void;
        (payload: UmamiPayload): void;
    };
    identify?: (payload: UmamiPayload) => void;
};

declare global {
    interface Window {
        umami?: UmamiAPI;
    }
}

export function trackEvent(name: string, data?: UmamiPayload): void {
    if (typeof window === 'undefined') return;
    try {
        window.umami?.track(name, data);
    } catch {
        /* never let analytics crash a flow */
    }
}

export const ANALYTICS_EVENTS = {
    signup: 'signup',
    lessonStart: 'lesson_start',
    lessonComplete: 'lesson_complete',
    lessonSpeakFailed: 'lesson_speak_failed',
    upgradeClick: 'upgrade_click',
    practiceSkip: 'practice_skip',
} as const;
