import { describe, expect, it } from "vitest";
import {
  advanceSquatState,
  createSquatState,
  measureSquatPose,
  type SquatMetrics,
} from "./squat";

const frame = (
  kneeAngle: number,
  options: Partial<SquatMetrics> = {},
): SquatMetrics => ({
  kneeAngle,
  torsoLeanDegrees: 10,
  hipAtKneeDepth: kneeAngle <= 105,
  confidence: 0.9,
  ...options,
});

function runSequence(frames: SquatMetrics[]) {
  let state = createSquatState();
  const analyses = [];
  for (const metrics of frames) {
    const result = advanceSquatState(state, metrics);
    state = result.state;
    analyses.push(result.analysis);
  }
  return { state, analyses };
}

describe("squat state machine", () => {
  it("counts one complete standing-descending-bottom-ascending-standing rep", () => {
    const result = runSequence([
      frame(172),
      frame(150),
      frame(125),
      frame(100),
      frame(128),
      frame(150),
      frame(168),
    ]);

    expect(result.state.phase).toBe("standing");
    expect(result.analyses.at(-1)).toMatchObject({
      repCompleted: true,
      issues: [],
    });
  });

  it("reports insufficient depth when the user returns upright before reaching bottom", () => {
    const result = runSequence([
      frame(172),
      frame(150),
      frame(130),
      frame(145),
      frame(168),
    ]);

    expect(result.analyses.at(-1)).toMatchObject({
      repCompleted: true,
      issues: ["insufficient_depth"],
    });
  });

  it("reports excessive torso lean once on rep completion", () => {
    const result = runSequence([
      frame(172),
      frame(145, { torsoLeanDegrees: 42 }),
      frame(100, { torsoLeanDegrees: 45 }),
      frame(130),
      frame(168),
    ]);

    expect(result.analyses.at(-1)?.issues).toContain("excessive_torso_lean");
    expect(
      result.analyses.filter((analysis) =>
        analysis.issues.includes("excessive_torso_lean"),
      ),
    ).toHaveLength(1);
  });

  it("reports incomplete stand when ascent reverses before the upright threshold", () => {
    const result = runSequence([
      frame(172),
      frame(145),
      frame(100),
      frame(130),
      frame(155),
      frame(146),
    ]);

    expect(result.analyses.at(-1)).toMatchObject({
      repCompleted: true,
      issues: ["incomplete_stand"],
    });
    expect(result.state.phase).toBe("descending");
  });

  it("ignores unusable frames without changing phase or completing a rep", () => {
    const state = createSquatState();
    const result = advanceSquatState(state, frame(100, { confidence: 0.2 }));

    expect(result.state).toEqual(state);
    expect(result.analysis).toMatchObject({
      phase: "standing",
      repCompleted: false,
      issues: [],
    });
  });

  it("counts ten deterministic standard reps without duplicate events", () => {
    const oneRep = [
      frame(172),
      frame(150),
      frame(125),
      frame(100),
      frame(128),
      frame(150),
      frame(168),
    ];
    const result = runSequence(Array.from({ length: 10 }, () => oneRep).flat());

    expect(
      result.analyses.filter((analysis) => analysis.repCompleted),
    ).toHaveLength(10);
    expect(
      result.analyses.filter((analysis) => analysis.issues.length > 0),
    ).toHaveLength(0);
  });
});

describe("squat pose measurement", () => {
  it("selects the more visible side and derives knee angle, torso lean and depth", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0,
      y: 0,
      visibility: 0.1,
    }));
    landmarks[11] = { x: 0.5, y: 0.2, visibility: 0.9 };
    landmarks[23] = { x: 0.5, y: 0.5, visibility: 0.9 };
    landmarks[25] = { x: 0.5, y: 0.7, visibility: 0.9 };
    landmarks[27] = { x: 0.7, y: 0.7, visibility: 0.9 };

    const metrics = measureSquatPose(landmarks, 1);

    expect(metrics.kneeAngle).toBeCloseTo(90);
    expect(metrics.torsoLeanDegrees).toBeCloseTo(0);
    expect(metrics.hipAtKneeDepth).toBe(false);
    expect(metrics.confidence).toBeCloseTo(0.9);
  });

  it("accounts for frame aspect ratio when measuring normalized landmarks", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0,
      y: 0,
      visibility: 0.1,
    }));
    landmarks[12] = { x: 0.4, y: 0.2, visibility: 0.9 };
    landmarks[24] = { x: 0.5, y: 0.5, visibility: 0.9 };
    landmarks[26] = { x: 0.6, y: 0.7, visibility: 0.9 };
    landmarks[28] = { x: 0.7, y: 0.8, visibility: 0.9 };

    expect(measureSquatPose(landmarks, 16 / 9).kneeAngle).not.toBeCloseTo(
      measureSquatPose(landmarks, 1).kneeAngle,
    );
  });
});
