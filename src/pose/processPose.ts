import {
  averageVisibility,
  estimateBodyDirection,
  smoothLandmarks,
  type BodyDirection,
  type PosePoint,
} from "./geometry";

export type ProcessedPose = {
  timestampMs: number;
  deltaMs: number;
  landmarks: PosePoint[];
  averageVisibility: number;
  bodyDirection: BodyDirection;
  isUsable: boolean;
  reason: "ok" | "insufficient_landmarks" | "low_visibility";
};

export type PoseProcessingConfig = {
  minVisibility: number;
  smoothingAlpha: number;
  maxDeltaMs?: number;
};

export function processPose(
  rawLandmarks: PosePoint[],
  timestampMs: number,
  previous: ProcessedPose | undefined,
  config: PoseProcessingConfig,
): ProcessedPose {
  const maxDeltaMs = config.maxDeltaMs ?? 1000;
  const deltaMs = previous
    ? Math.min(maxDeltaMs, Math.max(0, timestampMs - previous.timestampMs))
    : 0;
  const landmarks = smoothLandmarks(
    previous?.landmarks,
    rawLandmarks,
    config.smoothingAlpha,
  );
  const visibility = averageVisibility(landmarks);
  const reason =
    landmarks.length < 33
      ? "insufficient_landmarks"
      : visibility < config.minVisibility
        ? "low_visibility"
        : "ok";
  return {
    timestampMs,
    deltaMs,
    landmarks,
    averageVisibility: visibility,
    bodyDirection: estimateBodyDirection(landmarks),
    isUsable: reason === "ok",
    reason,
  };
}
