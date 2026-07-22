'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import { loadFaceLandmarker, VisualAggregator, type VisualMetrics } from '@/lib/mediapipe';

interface MediaPipeCameraProps {
    isRecording: boolean;
    onAnalysisUpdate: (metrics: VisualMetrics) => void;
}

export default function MediaPipeCamera({ isRecording, onAnalysisUpdate }: MediaPipeCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const landmarkerRef = useRef<FaceLandmarker | null>(null);
    const aggregatorRef = useRef(new VisualAggregator());
    const rafRef = useRef<number | null>(null);
    const recordingRef = useRef(isRecording);

    const [isCameraReady, setIsCameraReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        recordingRef.current = isRecording;
        if (isRecording) aggregatorRef.current.reset();
    }, [isRecording]);

    useEffect(() => {
        let cancelled = false;
        let stream: MediaStream | null = null;

        const tick = () => {
            const video = videoRef.current;
            const lm = landmarkerRef.current;
            if (video && lm && video.readyState >= 2) {
                const result = lm.detectForVideo(video, performance.now());
                if (recordingRef.current) {
                    aggregatorRef.current.ingest(result);
                    onAnalysisUpdate(aggregatorRef.current.snapshot());
                }
            }
            rafRef.current = requestAnimationFrame(tick);
        };

        (async () => {
            // Step 1: camera. If this fails it's almost always a permissions
            // issue — we surface it clearly and bail.
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                });
                if (cancelled) return;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setIsCameraReady(true);
                }
            } catch (err) {
                console.error('[camera] getUserMedia failed:', err);
                const name = err instanceof Error ? err.name : '';
                setLoadError(
                    name === 'NotAllowedError' || name === 'PermissionDeniedError'
                        ? 'Camera permission denied. Click the camera icon in your address bar and allow it, then reload.'
                        : name === 'NotFoundError'
                          ? 'No camera found. Connect one and reload.'
                          : (err instanceof Error ? err.message : 'Camera unavailable'),
                );
                return;
            }

            // Step 2: MediaPipe. Video still works even if this fails — we just
            // lose body-language scoring.
            try {
                landmarkerRef.current = await loadFaceLandmarker();
                if (!cancelled) tick();
            } catch (err) {
                console.error('[mediapipe] load failed:', err);
                setLoadError(
                    'Body-language scoring is offline (MediaPipe load failed). Your session will still record and transcribe.',
                );
            }
        })();

        return () => {
            cancelled = true;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            stream?.getTracks().forEach((t) => t.stop());
            landmarkerRef.current?.close();
            landmarkerRef.current = null;
        };
    }, [onAnalysisUpdate]);

    return (
        <div className="relative w-full h-full bg-zinc-800 rounded-3xl overflow-hidden border border-zinc-700 shadow-2xl group">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover mirror"
            />

            <div className="absolute top-4 right-4 flex gap-2">
                <div
                    className={`h-2 w-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`}
                />
                <div
                    className={`h-2 w-2 rounded-full ${isCameraReady ? 'bg-green-500' : 'bg-orange-500'}`}
                />
            </div>

            {loadError && (
                <div className="absolute bottom-4 left-4 right-4 bg-red-500/20 border border-red-500/40 px-4 py-2 rounded-xl text-xs text-red-100">
                    Vision unavailable: {loadError}
                </div>
            )}

            <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">
                    Local Vision Active
                </span>
            </div>

            <style jsx>{`
                .mirror {
                    transform: scaleX(-1);
                }
            `}</style>
        </div>
    );
}
