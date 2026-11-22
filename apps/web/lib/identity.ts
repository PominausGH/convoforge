/**
 * Device identity. Everyone starts with an anonymous ID in localStorage;
 * signing in (email link) swaps it for the account tied to their email.
 */
const ID_KEY = 'cf_user_id';
const SIGNED_IN_KEY = 'cf_signed_in';
const EMAIL_KEY = 'cf_email';
const DEVICE_ONLY_KEYS = ['cf_friend_challenges', 'cf_group_finder', 'cf_custom_story_prompt'];

export function getUserId(): string | null {
    try {
        return localStorage.getItem(ID_KEY);
    } catch {
        return null;
    }
}

export function isSignedIn(): boolean {
    try {
        return localStorage.getItem(SIGNED_IN_KEY) === '1';
    } catch {
        return false;
    }
}

export function signedInEmail(): string | null {
    try {
        return isSignedIn() ? localStorage.getItem(EMAIL_KEY) : null;
    } catch {
        return null;
    }
}

export function adoptAccount(userId: string, email: string) {
    try {
        localStorage.setItem(ID_KEY, userId);
        localStorage.setItem(SIGNED_IN_KEY, '1');
        localStorage.setItem(EMAIL_KEY, email);
    } catch {
        /* storage blocked: sign-in won't stick on this browser */
    }
}

/** Forget the account on this device and start a fresh anonymous ID. */
export function signOut() {
    try {
        localStorage.setItem(ID_KEY, crypto.randomUUID());
        localStorage.removeItem(SIGNED_IN_KEY);
        localStorage.removeItem(EMAIL_KEY);
        for (const k of DEVICE_ONLY_KEYS) localStorage.removeItem(k);
    } catch {
        /* ignore */
    }
}
