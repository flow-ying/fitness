import {
  advanceSquatState,
  createSquatState,
  type SquatMetrics,
  type SquatState,
} from "../../exercises/squat/squat";
import {
  applyExerciseAnalysis,
  createExerciseState,
  type ExerciseState,
} from "../../exercises/stateMachine";
import type { FormIssueCode } from "../../exercises/types";

export type SquatSession = {
  tracker: SquatState;
  exercise: ExerciseState;
  latestMetrics: SquatMetrics | null;
  lastIssues: FormIssueCode[];
};

export function createSquatSession(): SquatSession {
  return {
    tracker: createSquatState(),
    exercise: createExerciseState("squat"),
    latestMetrics: null,
    lastIssues: [],
  };
}

export function advanceSquatSessionMetrics(
  session: SquatSession,
  metrics: SquatMetrics,
  timestampMs: number,
): SquatSession {
  const { state: tracker, analysis } = advanceSquatState(
    session.tracker,
    metrics,
  );
  return {
    tracker,
    exercise: applyExerciseAnalysis(session.exercise, analysis, timestampMs),
    latestMetrics: metrics,
    lastIssues: analysis.repCompleted ? analysis.issues : session.lastIssues,
  };
}
