import {
  advanceCurlState,
  createCurlState,
  type CurlMetrics,
  type CurlState,
} from "../../exercises/curl/curl";
import {
  applyExerciseAnalysis,
  createExerciseState,
  type ExerciseState,
} from "../../exercises/stateMachine";
import type { FormIssueCode } from "../../exercises/types";

export type CurlSession = {
  tracker: CurlState;
  exercise: ExerciseState;
  latestMetrics: CurlMetrics | null;
  lastIssues: FormIssueCode[];
};

export function createCurlSession(): CurlSession {
  return {
    tracker: createCurlState(),
    exercise: createExerciseState("curl"),
    latestMetrics: null,
    lastIssues: [],
  };
}

export function advanceCurlSessionMetrics(
  session: CurlSession,
  metrics: CurlMetrics,
  timestampMs: number,
): CurlSession {
  const { state: tracker, analysis } = advanceCurlState(
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
