import { describe, expect, it } from "vitest";
import type { SquatMetrics } from "../../exercises/squat/squat";
import { advanceSquatSessionMetrics, createSquatSession } from "./squatSession";

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

describe("squat session", () => {
  it("aggregates a clean completed rep into the session summary", () => {
    let session = createSquatSession();
    const frames = [172, 150, 125, 100, 128, 150, 168];
    frames.forEach((angle, index) => {
      session = advanceSquatSessionMetrics(session, frame(angle), index * 100);
    });

    expect(session.exercise.totalReps).toBe(1);
    expect(session.exercise.correctReps).toBe(1);
    expect(session.lastIssues).toEqual([]);
  });

  it("keeps issue totals from a faulty completed rep", () => {
    let session = createSquatSession();
    [
      frame(172),
      frame(150, { torsoLeanDegrees: 42 }),
      frame(130),
      frame(145),
      frame(168),
    ].forEach((metrics, index) => {
      session = advanceSquatSessionMetrics(session, metrics, index * 100);
    });

    expect(session.exercise.totalReps).toBe(1);
    expect(session.exercise.correctReps).toBe(0);
    expect(session.exercise.issueCounts).toEqual({
      insufficient_depth: 1,
      excessive_torso_lean: 1,
    });
    expect(session.lastIssues).toEqual([
      "insufficient_depth",
      "excessive_torso_lean",
    ]);
  });
});
