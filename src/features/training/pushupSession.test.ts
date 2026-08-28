import { describe, expect, it } from "vitest";
import {
  advancePushupSessionMetrics,
  createPushupSession,
} from "./pushupSession";
import { type PushupMetrics } from "../../exercises/pushup/pushup";

const metrics = (elbowAngle: number): PushupMetrics => ({
  elbowAngle,
  bodyLineDeviationDegrees: 0,
  confidence: 0.95,
});

describe("pushup session", () => {
  it("aggregates reps, correct reps and issue counts", () => {
    let session = createPushupSession();
    for (const frame of [
      metrics(170),
      metrics(140),
      metrics(95),
      metrics(125),
      metrics(170),
    ]) {
      session = advancePushupSessionMetrics(session, frame, 1000);
    }

    expect(session.exercise.totalReps).toBe(1);
    expect(session.exercise.correctReps).toBe(1);
    expect(session.lastIssues).toEqual([]);
  });
});
