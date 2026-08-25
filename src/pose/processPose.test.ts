import { describe, expect, it } from "vitest";
import { processPose } from "./processPose";

const landmarks = Array.from({ length: 33 }, (_, index) => ({
  x: index / 33,
  y: index / 66,
  z: 0,
  visibility: 0.9,
}));

describe("processPose", () => {
  it("rejects frames with too few or low-visibility landmarks", () => {
    const result = processPose(landmarks.slice(0, 10), 1000, undefined, {
      minVisibility: 0.5,
      smoothingAlpha: 0.25,
    });
    expect(result.isUsable).toBe(false);
    expect(result.reason).toBe("insufficient_landmarks");
  });

  it("returns a smoothed frame and normalized timing metadata", () => {
    const result = processPose(landmarks, 1250, undefined, {
      minVisibility: 0.5,
      smoothingAlpha: 0.25,
    });
    expect(result.isUsable).toBe(true);
    expect(result.timestampMs).toBe(1250);
    expect(result.deltaMs).toBe(0);
    expect(result.averageVisibility).toBeCloseTo(0.9);
    expect(result.bodyDirection).toBe("frontal");
    expect(result.landmarks).toHaveLength(33);
  });

  it("clamps unreasonable frame gaps for stable downstream rules", () => {
    const result = processPose(
      landmarks,
      10000,
      {
        timestampMs: 0,
        landmarks,
        averageVisibility: 0.9,
        bodyDirection: "frontal",
        isUsable: true,
        reason: "ok",
        deltaMs: 0,
      },
      { minVisibility: 0.5, smoothingAlpha: 0.5, maxDeltaMs: 250 },
    );
    expect(result.deltaMs).toBe(250);
  });
});
