import { describe, expect, it } from "vitest";
import { createExerciseState } from "../exercises/stateMachine";
import { createWorkoutResultInput } from "./result";

describe("createWorkoutResultInput", () => {
  it("maps an exercise summary into the cloud-safe result contract", () => {
    const exercise = {
      ...createExerciseState("squat"),
      totalReps: 3,
      correctReps: 2,
      issueCounts: { insufficient_depth: 1 },
    };

    expect(
      createWorkoutResultInput(
        "squat",
        exercise,
        "2026-08-28T10:00:00.000Z",
        "2026-08-28T10:02:10.000Z",
        23.6,
      ),
    ).toEqual({
      exerciseType: "squat",
      startedAt: "2026-08-28T10:00:00.000Z",
      endedAt: "2026-08-28T10:02:10.000Z",
      durationSeconds: 130,
      totalReps: 3,
      correctReps: 2,
      formScore: 67,
      issueCounts: { insufficient_depth: 1 },
      averageFps: 24,
    });
  });

  it("keeps an empty session valid without producing NaN values", () => {
    const result = createWorkoutResultInput(
      "curl",
      createExerciseState("curl"),
      "invalid",
      "invalid",
      -1,
    );

    expect(result.durationSeconds).toBe(0);
    expect(result.formScore).toBe(0);
    expect(result.averageFps).toBe(0);
  });
});
