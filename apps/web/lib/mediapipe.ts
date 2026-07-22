/**
 * MediaPipe FaceLandmarker (WASM, on-device). Computes per-frame metrics.
 *
 *   eye_contact_pct  — heuristic from face transformation matrix yaw/pitch
 *   smile_frequency  — fraction of frames where mouthSmile blendshape > 0.4
 *   posture          — 'open' | 'closed', based on absolute head tilt
 */
import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from '@mediapipe/tasks-vision';

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL =
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export type VisualMetrics = {
    eye_contact_pct: number;
    smile_frequency: number;
    posture: 'open' | 'closed';
    frame_count: number;
};

export async function loadFaceLandmarker(): Promise<FaceLandmarker> {
    const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
    return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
    });
}

export class VisualAggregator {
    private frameCount = 0;
    private eyeContactFrames = 0;
    private smileFrames = 0;
    private openPostureFrames = 0;

    ingest(result: FaceLandmarkerResult) {
        if (!result.faceLandmarks || result.faceLandmarks.length === 0) return;
        this.frameCount += 1;

        // Eye contact: derive yaw + pitch from the 4x4 transformation matrix.
        // Matrix is column-major flat array; we look at rotation entries.
        const matrix = result.facialTransformationMatrixes?.[0]?.data;
        if (matrix) {
            // row, col indexing (column-major): m[r + c*4]
            const m02 = matrix[0 + 2 * 4];
            const m12 = matrix[1 + 2 * 4];
            const m22 = matrix[2 + 2 * 4];
            const yaw = Math.atan2(m02, m22);
            const pitch = Math.atan2(-m12, Math.hypot(m02, m22));
            const yawDeg = (yaw * 180) / Math.PI;
            const pitchDeg = (pitch * 180) / Math.PI;
            if (Math.abs(yawDeg) < 18 && Math.abs(pitchDeg) < 14) {
                this.eyeContactFrames += 1;
            }
            if (Math.abs(yawDeg) < 25) this.openPostureFrames += 1;
        }

        // Smile: average mouthSmileLeft + mouthSmileRight blendshapes
        const blends = result.faceBlendshapes?.[0]?.categories;
        if (blends) {
            const left = blends.find((c) => c.categoryName === 'mouthSmileLeft')?.score ?? 0;
            const right = blends.find((c) => c.categoryName === 'mouthSmileRight')?.score ?? 0;
            if ((left + right) / 2 > 0.4) this.smileFrames += 1;
        }
    }

    snapshot(): VisualMetrics {
        const n = Math.max(this.frameCount, 1);
        return {
            eye_contact_pct: Math.round((this.eyeContactFrames / n) * 100),
            smile_frequency: Math.round((this.smileFrames / n) * 100) / 100,
            posture: this.openPostureFrames / n > 0.6 ? 'open' : 'closed',
            frame_count: this.frameCount,
        };
    }

    reset() {
        this.frameCount = 0;
        this.eyeContactFrames = 0;
        this.smileFrames = 0;
        this.openPostureFrames = 0;
    }
}
