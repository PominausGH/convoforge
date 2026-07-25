import sessions from './curriculum.json';

export type Lesson = {
    lesson_id: number;
    title: string;
    carnegie_principle: string;
    modern_context: string;
    practice_prompt: string;
    success_criteria: string[];
    tier_required: 'free' | 'pro';
    track?: string;
    /** Overrides lesson_id for sequencing, so a lesson can be slotted earlier
     * in a user's queue without renumbering existing lessons (lesson_id is
     * persisted as cf_sessions.module_id, so it must never be reassigned). */
    sort_order?: number;
};

export const curriculum = sessions as Lesson[];

export function findLesson(lessonId: number): Lesson | null {
    return curriculum.find((l) => l.lesson_id === lessonId) ?? null;
}

export function buildLessonScript(lesson: Lesson): string {
    return [
        `Today's Carnegie principle: ${lesson.carnegie_principle}`,
        lesson.modern_context,
        `Your forge challenge: ${lesson.practice_prompt}`,
    ].join(' ');
}

/**
 * Pick the next lesson the user should do: lowest lesson_id they haven't
 * completed, restricted to their tier. Returns the last lesson once everything
 * is done so the UI can show a "complete" state.
 */
export function nextLessonFor(
    completedIds: number[],
    tier: 'free' | 'pro',
): Lesson {
    const done = new Set(completedIds);
    const eligible = curriculum
        .filter((l) => tier === 'pro' || l.tier_required === 'free')
        .slice()
        .sort((a, b) => (a.sort_order ?? a.lesson_id) - (b.sort_order ?? b.lesson_id));
    const next = eligible.find((l) => !done.has(l.lesson_id));
    return next ?? eligible[eligible.length - 1] ?? curriculum[0];
}

export function totalLessonsFor(tier: 'free' | 'pro'): number {
    return curriculum.filter((l) => tier === 'pro' || l.tier_required === 'free')
        .length;
}
