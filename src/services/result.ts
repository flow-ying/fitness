import type { ExerciseState } from "../exercises/stateMachine";
import type { WorkoutResultInput, WorkoutExercise } from "./supabase";

export function createWorkoutResultInput(
  exerciseType: WorkoutExercise,
  exercise: ExerciseState,
  startedAt: string,
  endedAt: string,
  averageFps: number,
): WorkoutResultInput {
  const startMs = Date.parse(startedAt);
  const endMs = Date.parse(endedAt);
  const durationSeconds =
    Number.isFinite(startMs) && Number.isFinite(endMs)
      ? Math.max(0, Math.round((endMs - startMs) / 1000))
      : 0;
  const formScore = exercise.totalReps
    ? Math.round((exercise.correctReps / exercise.totalReps) * 100)
    : 0;

  return {
    exerciseType,
    startedAt,
    endedAt,
    durationSeconds,
    totalReps: exercise.totalReps,
    correctReps: exercise.correctReps,
    formScore,
    issueCounts: { ...exercise.issueCounts },
    averageFps: Math.max(0, Math.round(averageFps)),
  };
}
