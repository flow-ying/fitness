import { describe, expect, it } from "vitest";
import {
  advanceCurlState,
  createCurlState,
  measureCurlPose,
  type CurlMetrics,
} from "./curl";

const metrics = (
  elbowAngle: number,
  overrides: Partial<CurlMetrics> = {},
): CurlMetrics => ({
  elbowAngle,
  upperArmMovementDegrees: 0,
  torsoSwingDegrees: 0,
  confidence: 0.95,
  ...overrides,
});

function runFrames(frames: CurlMetrics[]) {
  let state = createCurlState();
  const analyses = frames.map((frame) => {
    const result = advanceCurlState(state, frame);
    state = result.state;
    return result.analysis;
  });
  return { state, analyses };
}

describe("curl rule", () => {
  it("counts one complete curl", () => {
    const { analyses } = runFrames([
      metrics(170),
      metrics(140),
      metrics(70),
      metrics(110),
      metrics(170),
    ]);

    expect(analyses.at(-1)).toMatchObject({
      phase: "standing",
      repCompleted: true,
      issues: [],
    });
  });

  it("reports insufficient curl and upper arm movement", () => {
    const { analyses } = runFrames([
      metrics(170),
      metrics(140, { upperArmMovementDegrees: 20 }),
      metrics(115, { upperArmMovementDegrees: 20 }),
      metrics(150),
      metrics(170),
    ]);

    expect(analyses.at(-1)?.issues).toEqual(
      expect.arrayContaining(["insufficient_curl", "upper_arm_movement"]),
    );
  });

  it("reports body swing", () => {
    const { analyses } = runFrames([
      metrics(170),
      metrics(140, { torsoSwingDegrees: 18 }),
      metrics(70, { torsoSwingDegrees: 18 }),
      metrics(110),
      metrics(170),
    ]);

    expect(analyses.at(-1)?.issues).toContain("body_swing");
  });

  it("ignores low-confidence frames", () => {
    const { state, analyses } = runFrames([
      metrics(170),
      metrics(70, { confidence: 0.2 }),
    ]);

    expect(state.phase).toBe("standing");
    expect(analyses.at(-1)).toMatchObject({
      phase: "standing",
      repCompleted: false,
      issues: [],
    });
  });

  it("measures the selected arm and aspect-ratio corrected angles", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0,
      y: 0,
      visibility: 0,
    }));
    Object.assign(landmarks[12], { x: 0.2, y: 0.25, visibility: 0.9 });
    Object.assign(landmarks[14], { x: 0.4, y: 0.4, visibility: 0.9 });
    Object.assign(landmarks[16], { x: 0.55, y: 0.25, visibility: 0.9 });
    Object.assign(landmarks[24], { x: 0.3, y: 0.55, visibility: 0.9 });
    Object.assign(landmarks[11], { x: 0.1, y: 0.1, visibility: 0.2 });

    const measured = measureCurlPose(landmarks, 16 / 9);

    expect(measured.confidence).toBeCloseTo(0.9);
    expect(measured.elbowAngle).toBeGreaterThan(0);
    expect(measured.upperArmMovementDegrees).toBeGreaterThanOrEqual(0);
  });

  it("does not flag a vertical arm and upright torso as form errors", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0,
      y: 0,
      visibility: 0,
    }));
    Object.assign(landmarks[12], { x: 0.5, y: 0.2, visibility: 0.9 });
    Object.assign(landmarks[14], { x: 0.5, y: 0.4, visibility: 0.9 });
    Object.assign(landmarks[16], { x: 0.5, y: 0.6, visibility: 0.9 });
    Object.assign(landmarks[24], { x: 0.5, y: 0.6, visibility: 0.9 });

    const measured = measureCurlPose(landmarks);

    expect(measured.upperArmMovementDegrees).toBeCloseTo(0);
    expect(measured.torsoSwingDegrees).toBeCloseTo(0);
  });
});
