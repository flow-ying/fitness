import type { WorkoutResultRow } from "../../services/database.types";

export type WorkoutStats = {
  totalSessions: number;
  totalReps: number;
  averageFormScore: number;
  exerciseCounts: Record<WorkoutResultRow["exercise_type"], number>;
  issueCounts: Record<string, number>;
};

export function summarizeWorkoutResults(
  rows: WorkoutResultRow[],
): WorkoutStats {
  const exerciseCounts: WorkoutStats["exerciseCounts"] = {
    squat: 0,
    pushup: 0,
    curl: 0,
  };
  const issueCounts: Record<string, number> = {};
  let totalReps = 0;
  let scoreTotal = 0;

  for (const row of rows) {
    exerciseCounts[row.exercise_type] += 1;
    totalReps += row.total_reps;
    scoreTotal += row.form_score;
    for (const [issue, count] of Object.entries(row.issue_counts)) {
      issueCounts[issue] = (issueCounts[issue] ?? 0) + count;
    }
  }

  return {
    totalSessions: rows.length,
    totalReps,
    averageFormScore: rows.length ? Math.round(scoreTotal / rows.length) : 0,
    exerciseCounts,
    issueCounts,
  };
}
