/**
 * Avatar TTS. Preferred path: a pre-rendered static MP3 (see
 * `scripts/generate-lesson-audio.mjs`). Falls back to the backend OpenAI TTS
 * proxy, then the browser's native speechSynthesis if both fail.
 */
export type TTSHandle = {
    stop: () => void;
    done: Promise<void>;
};

export type SpeakOptions = {
    /** If set, try this MP3 URL before any network TTS. */
    audioUrl?: string;
};

export function speakText(text: string, options: SpeakOptions = {}): TTSHandle {
    let stopped = false;
    let audio: HTMLAudioElement | null = null;
    let utterance: SpeechSynthesisUtterance | null = null;

    const playUrl = async (url: string, revoke = false) => {
        audio = new Audio(url);
        try {
            await new Promise<void>((resolve, reject) => {
                if (!audio) return resolve();
                audio.onended = () => {
                    if (revoke) URL.revokeObjectURL(url);
                    resolve();
                };
                audio.onerror = () => {
                    if (revoke) URL.revokeObjectURL(url);
                    reject(new Error('audio element error'));
                };
                audio.play().catch(reject);
            });
            return true;
        } catch (err) {
            if (revoke) URL.revokeObjectURL(url);
            console.warn('[tts] audio playback failed, will fall back', err);
            return false;
        }
    };

    const done = (async () => {
        if (!text.trim() && !options.audioUrl) return;

        // 1. static pre-rendered file, if caller provided one
        if (options.audioUrl && !stopped) {
            const ok = await playUrl(options.audioUrl);
            if (ok || stopped) return;
        }

        // 2. backend OpenAI TTS proxy
        if (text.trim() && !stopped) {
            try {
                const res = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text }),
                });
                if (res.ok && !stopped) {
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const ok = await playUrl(url, true);
                    if (ok || stopped) return;
                }
            } catch (err) {
                console.warn('[tts] backend TTS failed', err);
            }
        }

        // 3. native speechSynthesis fallback
        if (stopped || typeof window === 'undefined' || !window.speechSynthesis) return;
        await ensureVoicesLoaded();
        if (stopped || !text.trim()) return;

        utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = pickPreferredVoice();
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        await new Promise<void>((resolve) => {
            if (!utterance) return resolve();
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
        });
    })();

    return {
        stop: () => {
            stopped = true;
            if (audio) {
                audio.pause();
                audio.src = '';
            }
            try {
                window.speechSynthesis?.cancel();
            } catch {
                /* noop */
            }
        },
        done,
    };
}

function pickPreferredVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    return (
        voices.find((v) => /Google.*US English/i.test(v.name)) ||
        voices.find((v) => /Google.*English/i.test(v.name)) ||
        voices.find((v) => /Microsoft.*English/i.test(v.name)) ||
        voices.find((v) => v.lang?.startsWith('en')) ||
        voices[0] ||
        null
    );
}

function ensureVoicesLoaded(timeoutMs = 1500): Promise<void> {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return resolve();
        if (window.speechSynthesis.getVoices().length > 0) return resolve();
        const handler = () => {
            window.speechSynthesis.removeEventListener?.('voiceschanged', handler);
            resolve();
        };
        window.speechSynthesis.addEventListener?.('voiceschanged', handler);
        setTimeout(resolve, timeoutMs);
    });
}
