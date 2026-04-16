'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MediaPipeCameraProps {
    isRecording: boolean;
    onAnalysisUpdate: (data: any) => void;
}

export default function MediaPipeCamera({ isRecording, onAnalysisUpdate }: MediaPipeCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: "user"
                    } 
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsCameraReady(true);
                }
            } catch (err) {
                console.error("Camera access error:", err);
            }
        };

        startCamera();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (isRecording && isCameraReady) {
            // In a real app, you'd load MediaPipe's FaceMesh here.
            // Placeholder for real-time analysis loop:
            const interval = setInterval(() => {
                // Simulating analysis data for eye contact and smile
                onAnalysisUpdate({
                    eye_contact_pct: Math.floor(Math.random() * 20) + 70, // Random between 70-90
                    smile_frequency: Math.random() * 0.5 + 0.2 // Random between 0.2-0.7
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isRecording, isCameraReady, onAnalysisUpdate]);

    return (
        <div className="relative w-full h-full bg-zinc-800 rounded-3xl overflow-hidden border border-zinc-700 shadow-2xl group">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover mirror"
            />
            
            {/* Overlay indicators */}
            <div className="absolute top-4 right-4 flex gap-2">
                <div className={`h-2 w-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`} />
                <div className={`h-2 w-2 rounded-full ${isCameraReady ? 'bg-green-500' : 'bg-orange-500'}`} />
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">Local Vision Active</span>
            </div>
            
            <style jsx>{`
                .mirror {
                    transform: scaleX(-1);
                }
            `}</style>
        </div>
    );
}
