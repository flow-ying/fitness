import { describe, expect, it, vi } from "vitest";
import { listWorkoutResults, saveWorkoutResult } from "./history";
import type { WorkoutResultInput } from "./supabase";

const input: WorkoutResultInput = {
  exerciseType: "squat",
  startedAt: "2026-08-25T06:00:00.000Z",
  endedAt: "2026-08-25T06:05:00.000Z",
  durationSeconds: 300,
  totalReps: 10,
  correctReps: 9,
  formScore: 90,
  issueCounts: { insufficient_depth: 1 },
  averageFps: 24,
};

function createClientMock() {
  const single = vi.fn();
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  const order = vi.fn();
  const selectList = vi.fn(() => ({ order }));
  const from = vi.fn(() => ({ insert, select: selectList }));
  return {
    client: { from } as never,
    from,
    insert,
    select,
    single,
    selectList,
    order,
  };
}

describe("history service", () => {
  it("saves a result with the current authenticated user id", async () => {
    const mock = createClientMock();
    const row = {
      id: "result-1",
      user_id: "user-1",
      exercise_type: "squat",
      started_at: input.startedAt,
      ended_at: input.endedAt,
      duration_seconds: input.durationSeconds,
      total_reps: input.totalReps,
      correct_reps: input.correctReps,
      form_score: input.formScore,
      issue_counts: input.issueCounts,
      average_fps: input.averageFps,
      created_at: input.startedAt,
    };
    mock.single.mockResolvedValue({ data: row, error: null });

    await saveWorkoutResult(mock.client, "user-1", input);

    expect(mock.from).toHaveBeenCalledWith("workout_results");
    expect(mock.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      exercise_type: "squat",
      started_at: input.startedAt,
      ended_at: input.endedAt,
      duration_seconds: input.durationSeconds,
      total_reps: input.totalReps,
      correct_reps: input.correctReps,
      form_score: input.formScore,
      issue_counts: input.issueCounts,
      average_fps: input.averageFps,
    });
  });

  it("lists records through the RLS-scoped session without a user filter", async () => {
    const mock = createClientMock();
    mock.order.mockResolvedValue({ data: [], error: null });

    await expect(listWorkoutResults(mock.client)).resolves.toEqual([]);

    expect(mock.selectList).toHaveBeenCalledWith("*");
    expect(mock.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });
});
