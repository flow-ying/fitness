import type {
  ExerciseAnalysis,
  ExercisePhase,
  ExerciseType,
  FormIssueCode,
} from "./types";

export type ExerciseState = {
  exerciseType: ExerciseType;
  phase: ExercisePhase;
  totalReps: number;
  correctReps: number;
  issueCounts: Partial<Record<FormIssueCode, number>>;
  lastTimestampMs: number | null;
};

export function createExerciseState(exerciseType: ExerciseType): ExerciseState {
  return {
    exerciseType,
    phase: "ready",
    totalReps: 0,
    correctReps: 0,
    issueCounts: {},
    lastTimestampMs: null,
  };
}

export function applyExerciseAnalysis(
  state: ExerciseState,
  analysis: ExerciseAnalysis,
  timestampMs: number,
): ExerciseState {
  const issueCounts = { ...state.issueCounts };
  for (const issue of analysis.issues) {
    issueCounts[issue] = (issueCounts[issue] ?? 0) + 1;
  }
  if (!analysis.repCompleted) {
    return {
      ...state,
      phase: analysis.phase,
      issueCounts,
      lastTimestampMs: timestampMs,
    };
  }
  return {
    ...state,
    phase: analysis.phase,
    totalReps: state.totalReps + 1,
    correctReps: state.correctReps + (analysis.issues.length === 0 ? 1 : 0),
    issueCounts,
    lastTimestampMs: timestampMs,
  };
}
