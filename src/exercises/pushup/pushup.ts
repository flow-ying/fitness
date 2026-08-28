import type { ExerciseAnalysis, ExercisePhase, FormIssueCode } from "../types";
import {
  angleAt,
  averageVisibility,
  type PosePoint,
} from "../../pose/geometry";

export type PushupMetrics = {
  elbowAngle: number;
  bodyLineDeviationDegrees: number;
  confidence: number;
};

export type PushupState = {
  phase: Extract<ExercisePhase, "top" | "descending" | "bottom" | "ascending">;
  previousElbowAngle: number | null;
  reachedBottom: boolean;
  bodyLineBroken: boolean;
};

export const pushupThresholds = {
  minimumConfidence: 0.5,
  descentElbowAngle: 150,
  bottomElbowAngle: 100,
  bottomExitElbowAngle: 115,
  topElbowAngle: 160,
  maximumBodyLineDeviationDegrees: 15,
  directionChangeDegrees: 3,
} as const;

const pushupSideIndices = [
  [11, 13, 15, 23, 27],
  [12, 14, 16, 24, 28],
] as const;

export function measurePushupPose(
  landmarks: PosePoint[],
  frameAspectRatio = 1,
): PushupMetrics {
  const indices = pushupSideIndices.reduce((best, candidate) =>
    sideVisibility(landmarks, candidate) > sideVisibility(landmarks, best)
      ? candidate
      : best,
  );
  const [shoulder, elbow, wrist, hip, ankle] = indices.map(
    (index) => landmarks[index] ?? { x: 0, y: 0, visibility: 0 },
  );
  const scaledShoulder = scaleX(shoulder, frameAspectRatio);
  const scaledElbow = scaleX(elbow, frameAspectRatio);
  const scaledWrist = scaleX(wrist, frameAspectRatio);
  const scaledHip = scaleX(hip, frameAspectRatio);
  const scaledAnkle = scaleX(ankle, frameAspectRatio);

  return {
    elbowAngle: angleAt(scaledShoulder, scaledElbow, scaledWrist),
    bodyLineDeviationDegrees: Math.abs(
      180 - angleAt(scaledShoulder, scaledHip, scaledAnkle),
    ),
    confidence: averageVisibility([shoulder, elbow, wrist, hip, ankle]),
  };
}

export function createPushupState(): PushupState {
  return {
    phase: "top",
    previousElbowAngle: null,
    reachedBottom: false,
    bodyLineBroken: false,
  };
}

export function advancePushupState(
  state: PushupState,
  metrics: PushupMetrics,
): { state: PushupState; analysis: ExerciseAnalysis } {
  if (metrics.confidence < pushupThresholds.minimumConfidence) {
    return {
      state,
      analysis: analysis(state.phase, false, [], metrics.confidence),
    };
  }

  const reachedBottom =
    state.reachedBottom ||
    metrics.elbowAngle <= pushupThresholds.bottomElbowAngle;
  const bodyLineBroken =
    state.bodyLineBroken ||
    metrics.bodyLineDeviationDegrees >
      pushupThresholds.maximumBodyLineDeviationDegrees;
  const nextBase = {
    ...state,
    previousElbowAngle: metrics.elbowAngle,
    reachedBottom,
    bodyLineBroken,
  };

  if (state.phase === "top") {
    if (metrics.elbowAngle < pushupThresholds.descentElbowAngle) {
      const next = {
        ...nextBase,
        phase: "descending" as const,
        reachedBottom: metrics.elbowAngle <= pushupThresholds.bottomElbowAngle,
        bodyLineBroken:
          metrics.bodyLineDeviationDegrees >
          pushupThresholds.maximumBodyLineDeviationDegrees,
      };
      return {
        state: next,
        analysis: analysis(next.phase, false, [], metrics.confidence),
      };
    }
    return {
      state: { ...nextBase, reachedBottom: false, bodyLineBroken: false },
      analysis: analysis("top", false, [], metrics.confidence),
    };
  }

  if (state.phase === "descending") {
    if (reachedBottom) {
      const next = { ...nextBase, phase: "bottom" as const };
      return {
        state: next,
        analysis: analysis(next.phase, false, [], metrics.confidence),
      };
    }
    if (isIncreasing(state.previousElbowAngle, metrics.elbowAngle)) {
      const next = { ...nextBase, phase: "ascending" as const };
      return {
        state: next,
        analysis: analysis(next.phase, false, [], metrics.confidence),
      };
    }
    return {
      state: nextBase,
      analysis: analysis("descending", false, [], metrics.confidence),
    };
  }

  if (state.phase === "bottom") {
    const phase =
      metrics.elbowAngle >= pushupThresholds.bottomExitElbowAngle
        ? "ascending"
        : "bottom";
    return {
      state: { ...nextBase, phase },
      analysis: analysis(phase, false, [], metrics.confidence),
    };
  }

  if (metrics.elbowAngle >= pushupThresholds.topElbowAngle) {
    const issues = completedRepIssues(nextBase, false);
    return {
      state: createPushupState(),
      analysis: analysis("top", true, issues, metrics.confidence),
    };
  }

  if (isDecreasing(state.previousElbowAngle, metrics.elbowAngle)) {
    const issues = completedRepIssues(nextBase, true);
    const next = {
      ...createPushupState(),
      phase: "descending" as const,
      previousElbowAngle: metrics.elbowAngle,
      bodyLineBroken:
        metrics.bodyLineDeviationDegrees >
        pushupThresholds.maximumBodyLineDeviationDegrees,
    };
    return {
      state: next,
      analysis: analysis("descending", true, issues, metrics.confidence),
    };
  }

  return {
    state: nextBase,
    analysis: analysis("ascending", false, [], metrics.confidence),
  };
}

function completedRepIssues(
  state: Pick<PushupState, "reachedBottom" | "bodyLineBroken">,
  incompleteExtension: boolean,
): FormIssueCode[] {
  const issues: FormIssueCode[] = [];
  if (!state.reachedBottom) issues.push("insufficient_elbow_bend");
  if (state.bodyLineBroken) issues.push("body_line_break");
  if (incompleteExtension) issues.push("incomplete_extension");
  return issues;
}

function isIncreasing(previous: number | null, current: number): boolean {
  return (
    previous !== null &&
    current - previous >= pushupThresholds.directionChangeDegrees
  );
}

function isDecreasing(previous: number | null, current: number): boolean {
  return (
    previous !== null &&
    previous - current >= pushupThresholds.directionChangeDegrees
  );
}

function analysis(
  phase: ExerciseAnalysis["phase"],
  repCompleted: boolean,
  issues: FormIssueCode[],
  confidence: number,
): ExerciseAnalysis {
  return { phase, repCompleted, issues, confidence };
}

function sideVisibility(
  landmarks: PosePoint[],
  indices: readonly number[],
): number {
  return averageVisibility(
    indices.map((index) => landmarks[index] ?? { x: 0, y: 0, visibility: 0 }),
  );
}

function scaleX(point: PosePoint, aspectRatio: number): PosePoint {
  return { ...point, x: point.x * aspectRatio };
}
