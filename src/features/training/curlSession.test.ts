import { describe, expect, it } from "vitest";
import { type CurlMetrics } from "../../exercises/curl/curl";
import { advanceCurlSessionMetrics, createCurlSession } from "./curlSession";

const metrics = (elbowAngle: number): CurlMetrics => ({
  elbowAngle,
  upperArmMovementDegrees: 0,
  torsoSwingDegrees: 0,
  confidence: 0.95,
});

describe("curl session", () => {
  it("aggregates reps and issue counts", () => {
    let session = createCurlSession();
    for (const frame of [
      metrics(170),
      metrics(140),
      metrics(70),
      metrics(110),
      metrics(170),
    ]) {
      session = advanceCurlSessionMetrics(session, frame, 1000);
    }

    expect(session.exercise.totalReps).toBe(1);
    expect(session.exercise.correctReps).toBe(1);
    expect(session.lastIssues).toEqual([]);
  });
});
