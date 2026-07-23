// Real face recognition helpers using face-api.js.
// Models are loaded from a public CDN so nothing needs to be bundled.
import * as faceapi from "face-api.js";

const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";

// Two faces are the same person when the Euclidean distance between
// their 128-d descriptors is below this threshold. 0.5 = strict, 0.6 = lenient.
export const MATCH_THRESHOLD = 0.5;

let modelsPromise: Promise<void> | null = null;

export const loadFaceModels = () => {
  if (!modelsPromise) {
    modelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).then(() => {
      console.log("[faceApi] models loaded");
    });
  }
  return modelsPromise;
};

// Detects a single face in the video and returns its 128-number descriptor.
export const detectDescriptor = async (
  video: HTMLVideoElement,
): Promise<Float32Array | null> => {
  await loadFaceModels();
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection?.descriptor ?? null;
};

export const euclideanDistance = (a: Float32Array | number[], b: Float32Array | number[]): number => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = (a as any)[i] - (b as any)[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
};

// Finds the closest matching known descriptor. Returns null if none within threshold.
export const findBestMatch = (
  probe: Float32Array,
  known: { id: string; descriptor: number[] }[],
): { id: string; distance: number } | null => {
  let best: { id: string; distance: number } | null = null;
  for (const k of known) {
    if (!k.descriptor || k.descriptor.length !== probe.length) continue;
    const d = euclideanDistance(probe, k.descriptor);
    if (!best || d < best.distance) best = { id: k.id, distance: d };
  }
  if (best && best.distance <= MATCH_THRESHOLD) return best;
  return null;
};
