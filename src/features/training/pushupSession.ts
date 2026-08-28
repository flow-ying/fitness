import {
  advancePushupState,
  createPushupState,
  type PushupMetrics,
  type PushupState,
} from "../../exercises/pushup/pushup";
import {
  applyExerciseAnalysis,
  createExerciseState,
  type ExerciseState,
} from "../../exercises/stateMachine";
import type { FormIssueCode } from "../../exercises/types";

export type PushupSession = {
  tracker: PushupState;
  exercise: ExerciseState;
  latestMetrics: PushupMetrics | null;
  lastIssues: FormIssueCode[];
};

export function createPushupSession(): PushupSession {
  return {
    tracker: createPushupState(),
    exercise: createExerciseState("pushup"),
    latestMetrics: null,
    lastIssues: [],
  };
}

export function advancePushupSessionMetrics(
  session: PushupSession,
  metrics: PushupMetrics,
  timestampMs: number,
): PushupSession {
  const { state: tracker, analysis } = advancePushupState(
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
