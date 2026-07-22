/**
 * Streams browser mic audio to FastAPI's /api/deepgram/stream WebSocket.
 * The Deepgram API key stays server-side; the browser only sees this proxy.
 */
export type TranscriptCallback = (segment: string, isFinal: boolean) => void;
export type StatusCallback = (status: string) => void;

export type DeepgramSession = {
    stop: () => Promise<void>;
};

function resolveWsUrl(): string {
    const explicit = process.env.NEXT_PUBLIC_API_WS_URL;
    if (explicit) return explicit.replace(/\/$/, '');
    if (typeof window === 'undefined') {
        throw new Error('NEXT_PUBLIC_API_WS_URL not set');
    }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}`;
}

export async function startDeepgramStream(
    onTranscript: TranscriptCallback,
    onStatus?: StatusCallback,
): Promise<DeepgramSession> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    onStatus?.('mic acquired');

    const mimeCandidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
    const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
    if (!mimeType) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error('No supported MediaRecorder mime type for Deepgram.');
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    const ws = new WebSocket(`${resolveWsUrl()}/api/deepgram/stream`);
    ws.binaryType = 'arraybuffer';

    let opened = false;
    const queue: ArrayBuffer[] = [];

    ws.onopen = () => {
        opened = true;
        onStatus?.('connected to Deepgram');
        for (const buf of queue) ws.send(buf);
        queue.length = 0;
        recorder.start(250);
    };

    ws.onmessage = (evt) => {
        if (typeof evt.data !== 'string') return;
        try {
            const msg = JSON.parse(evt.data);
            if (msg?.type === 'error') {
                console.error('Deepgram proxy error:', msg.message);
                onStatus?.(`error: ${msg.message}`);
                return;
            }
            const alt = msg.channel?.alternatives?.[0];
            const text = alt?.transcript;
            if (text) {
                onTranscript(text, !!msg.is_final);
            } else if (msg.type === 'Metadata') {
                console.debug('Deepgram metadata:', msg);
            }
        } catch {
            // ignore non-JSON keepalive frames
        }
    };

    ws.onerror = (err) => {
        console.error('Deepgram proxy ws error:', err);
        onStatus?.('websocket error');
    };
    ws.onclose = (evt) => {
        if (evt.code !== 1000) onStatus?.(`disconnected (${evt.code})`);
    };

    recorder.ondataavailable = async (e) => {
        if (!e.data || e.data.size === 0) return;
        const buf = await e.data.arrayBuffer();
        if (opened && ws.readyState === WebSocket.OPEN) ws.send(buf);
        else queue.push(buf);
    };

    return {
        stop: async () => {
            try {
                if (recorder.state !== 'inactive') recorder.stop();
                stream.getTracks().forEach((t) => t.stop());
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'CloseStream' }));
                    ws.close();
                }
            } catch (err) {
                console.error('Deepgram stop error:', err);
            }
        },
    };
}
