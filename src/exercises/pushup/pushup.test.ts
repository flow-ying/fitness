import { describe, expect, it } from "vitest";
import {
  advancePushupState,
  createPushupState,
  measurePushupPose,
  type PushupMetrics,
} from "./pushup";

const metrics = (
  elbowAngle: number,
  overrides: Partial<PushupMetrics> = {},
): PushupMetrics => ({
  elbowAngle,
  bodyLineDeviationDegrees: 0,
  confidence: 0.95,
  ...overrides,
});

function runFrames(frames: PushupMetrics[]) {
  let state = createPushupState();
  const analyses = frames.map((frame) => {
    const result = advancePushupState(state, frame);
    state = result.state;
    return result.analysis;
  });
  return { state, analyses };
}

describe("pushup rule", () => {
  it("counts one complete pushup", () => {
    const { analyses } = runFrames([
      metrics(170),
      metrics(140),
      metrics(95),
      metrics(125),
      metrics(170),
    ]);

    expect(analyses.at(-1)).toMatchObject({
      phase: "top",
      repCompleted: true,
      issues: [],
    });
  });

  it("reports insufficient elbow bend", () => {
    const { analyses } = runFrames([
      metrics(170),
      metrics(140),
      metrics(125),
      metrics(150),
      metrics(170),
    ]);

    expect(analyses.at(-1)?.issues).toContain("insufficient_elbow_bend");
  });

  it("reports a broken body line", () => {
    const { analyses } = runFrames([
      metrics(170),
      metrics(140, { bodyLineDeviationDegrees: 20 }),
      metrics(95, { bodyLineDeviationDegrees: 20 }),
      metrics(125),
      metrics(170),
    ]);

    expect(analyses.at(-1)?.issues).toContain("body_line_break");
  });

  it("reports incomplete extension when the user turns before the top", () => {
    const { analyses } = runFrames([
      metrics(170),
      metrics(140),
      metrics(95),
      metrics(130),
      metrics(120),
    ]);

    expect(analyses.at(-1)?.repCompleted).toBe(true);
    expect(analyses.at(-1)?.issues).toContain("incomplete_extension");
  });

  it("ignores low-confidence frames without changing phase", () => {
    const { state, analyses } = runFrames([
      metrics(170),
      metrics(140),
      metrics(95, { confidence: 0.2 }),
    ]);

    expect(state.phase).toBe("descending");
    expect(analyses.at(-1)).toMatchObject({
      phase: "descending",
      repCompleted: false,
      issues: [],
    });
  });

  it("measures elbow angle and body line with the frame aspect ratio", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0,
      y: 0,
      visibility: 0,
    }));
    Object.assign(landmarks[11], { x: 0.2, y: 0.2, visibility: 0.9 });
    Object.assign(landmarks[13], { x: 0.4, y: 0.35, visibility: 0.9 });
    Object.assign(landmarks[15], { x: 0.6, y: 0.2, visibility: 0.9 });
    Object.assign(landmarks[23], { x: 0.3, y: 0.55, visibility: 0.9 });
    Object.assign(landmarks[27], { x: 0.5, y: 0.8, visibility: 0.9 });

    const wide = measurePushupPose(landmarks, 2);
    const normal = measurePushupPose(landmarks, 1);

    expect(wide.confidence).toBeCloseTo(0.9);
    expect(wide.elbowAngle).not.toBeCloseTo(normal.elbowAngle);
    expect(wide.bodyLineDeviationDegrees).toBeGreaterThanOrEqual(0);
  });
});
