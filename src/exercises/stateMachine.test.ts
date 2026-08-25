import { describe, expect, it } from "vitest";
import { applyExerciseAnalysis, createExerciseState } from "./stateMachine";

describe("exercise state machine boundary", () => {
  it("starts a clean state for every selected exercise", () => {
    expect(createExerciseState("squat")).toEqual({
      exerciseType: "squat",
      phase: "ready",
      totalReps: 0,
      correctReps: 0,
      issueCounts: {},
      lastTimestampMs: null,
    });
  });

  it("counts a completed clean rep and records a faulty rep separately", () => {
    const state = createExerciseState("squat");
    const clean = applyExerciseAnalysis(
      state,
      { phase: "ascending", repCompleted: true, issues: [], confidence: 0.9 },
      1000,
    );
    const faulty = applyExerciseAnalysis(
      clean,
      {
        phase: "ascending",
        repCompleted: true,
        issues: ["insufficient_depth"],
        confidence: 0.8,
      },
      1100,
    );
    expect(faulty.totalReps).toBe(2);
    expect(faulty.correctReps).toBe(1);
    expect(faulty.issueCounts.insufficient_depth).toBe(1);
  });

  it("does not increment for a phase update without a rep event", () => {
    const state = applyExerciseAnalysis(
      createExerciseState("pushup"),
      { phase: "descending", repCompleted: false, issues: [], confidence: 0.7 },
      500,
    );
    expect(state.totalReps).toBe(0);
    expect(state.phase).toBe("descending");
  });
});
