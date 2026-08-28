import { describe, expect, it } from "vitest";
import { summarizeWorkoutResults } from "./stats";
import type { WorkoutResultRow } from "../../services/database.types";

const row = (overrides: Partial<WorkoutResultRow>): WorkoutResultRow => ({
  id: "result-1",
  user_id: "user-1",
  exercise_type: "squat",
  started_at: "2026-08-28T10:00:00.000Z",
  ended_at: "2026-08-28T10:01:00.000Z",
  duration_seconds: 60,
  total_reps: 10,
  correct_reps: 9,
  form_score: 90,
  issue_counts: { insufficient_depth: 1 },
  average_fps: 24,
  created_at: "2026-08-28T10:01:00.000Z",
  ...overrides,
});

describe("summarizeWorkoutResults", () => {
  it("aggregates sessions, reps, exercise distribution and issues", () => {
    expect(
      summarizeWorkoutResults([
        row({}),
        row({
          id: "result-2",
          exercise_type: "pushup",
          total_reps: 8,
          form_score: 75,
          issue_counts: { incomplete_extension: 2 },
        }),
      ]),
    ).toEqual({
      totalSessions: 2,
      totalReps: 18,
      averageFormScore: 83,
      exerciseCounts: { squat: 1, pushup: 1, curl: 0 },
      issueCounts: { insufficient_depth: 1, incomplete_extension: 2 },
    });
  });

  it("returns stable empty statistics", () => {
    expect(summarizeWorkoutResults([])).toEqual({
      totalSessions: 0,
      totalReps: 0,
      averageFormScore: 0,
      exerciseCounts: { squat: 0, pushup: 0, curl: 0 },
      issueCounts: {},
    });
  });
});
