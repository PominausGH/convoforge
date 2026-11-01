/**
 * Real-world challenges for Friends Lab. Ordered easiest → boldest so each one
 * builds on the last. Progress lives in localStorage only (no PII server-side).
 */
export type LifeStage = 'later_life' | 'starting_out';

export type FriendChallenge = {
    id: string;
    stage: LifeStage;
    title: string;
    detail: string;
    /** Optional curriculum lesson to rehearse before trying it for real. */
    practiceLessonId?: number;
};

export type ChallengeFeeling = 'easier' | 'expected' | 'harder';
export type ChallengeProgress = Record<string, { done_at: string; feeling?: ChallengeFeeling }>;

export const FRIEND_CHALLENGES: FriendChallenge[] = [
    // Later in life
    { id: 'll-find', stage: 'later_life', title: 'Find one group', detail: 'Look up one group near you and write down when it next meets.' },
    { id: 'll-neighbour', stage: 'later_life', title: 'Ask a neighbor one question', detail: 'Say hello to a neighbor or shopkeeper and ask them one real question, like how their week is going or for a recommendation.' },
    { id: 'll-go', stage: 'later_life', title: 'Just go', detail: 'Go to one session of that group. Stay at least 30 minutes, even if you hardly speak.', practiceLessonId: 180 },
    { id: 'll-organiser', stage: 'later_life', title: 'Meet the organizer', detail: 'Introduce yourself to whoever runs the group: your name, why you came, one question.', practiceLessonId: 180 },
    { id: 'll-name', stage: 'later_life', title: 'Learn one name', detail: "Learn one person's name and use it when you say goodbye." },
    { id: 'll-return', stage: 'later_life', title: 'Go back', detail: 'Go to the same group a second time. Coming back is what turns faces into friends.' },
    { id: 'll-now', stage: 'later_life', title: 'Share who you are now', detail: "When someone asks about you, talk about what you're into now, then ask about them.", practiceLessonId: 181 },
    { id: 'll-help', stage: 'later_life', title: 'Offer to help', detail: 'Offer to help with one thing at the group, like setting up, making tea, or a small job.', practiceLessonId: 182 },
    { id: 'll-generation', stage: 'later_life', title: 'Talk across generations', detail: 'Have a real conversation with someone at least 30 years younger. Ask what they think about something.', practiceLessonId: 184 },
    { id: 'll-invite', stage: 'later_life', title: 'Invite someone for coffee', detail: 'Ask someone from your group to have a coffee or go for a walk with you. Suggest a day and a place.', practiceLessonId: 185 },

    // Starting out
    { id: 'so-calendar', stage: 'starting_out', title: 'Pick a weekly group', detail: 'Choose one group that meets every week and put the next session in your calendar.' },
    { id: 'so-reco', stage: 'starting_out', title: 'Ask for a local tip', detail: 'Ask a barista, coworker, or neighbor for one local recommendation, then actually try it.' },
    { id: 'so-go', stage: 'starting_out', title: 'Show up once', detail: 'Go to that group. Arrive on time, which is when people are most open to chatting.', practiceLessonId: 186 },
    { id: 'so-new', stage: 'starting_out', title: 'Say "I\'m new here"', detail: "Tell at least one person you're new and ask them how they found the group.", practiceLessonId: 186 },
    { id: 'so-return', stage: 'starting_out', title: 'The second visit', detail: 'Go back the next week and greet someone by name with one detail from last time.', practiceLessonId: 188 },
    { id: 'so-followup', stage: 'starting_out', title: 'Follow up within a day', detail: 'Message someone you met within 24 hours. Mention one thing you talked about.' },
    { id: 'so-irl', stage: 'starting_out', title: 'Online to in person', detail: "Suggest meeting in person to someone you've only chatted with online.", practiceLessonId: 187 },
    { id: 'so-older', stage: 'starting_out', title: 'Learn from someone older', detail: 'Have a real conversation with someone at least 30 years older. Ask how they got into the activity.', practiceLessonId: 190 },
    { id: 'so-yes', stage: 'starting_out', title: 'Say yes, then return the invite', detail: 'Accept the next invitation you get, then suggest the next plan yourself.', practiceLessonId: 191 },
    { id: 'so-host', stage: 'starting_out', title: 'Host a small thing', detail: 'Invite 2–3 people to something simple, like a quiz night, picnic, or film.', practiceLessonId: 189 },
];

const STORAGE_KEY = 'cf_friend_challenges';

export function loadChallengeProgress(): ChallengeProgress {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

export function saveChallengeProgress(progress: ChallengeProgress) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
        // storage unavailable (private mode) — progress just won't persist
    }
}
