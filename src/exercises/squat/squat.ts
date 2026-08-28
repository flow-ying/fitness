import type { ExerciseAnalysis, ExercisePhase, FormIssueCode } from "../types";
import {
  angleAt,
  averageVisibility,
  type PosePoint,
} from "../../pose/geometry";

export type SquatMetrics = {
  kneeAngle: number;
  torsoLeanDegrees: number;
  hipAtKneeDepth: boolean;
  confidence: number;
};

export type SquatState = {
  phase: Extract<
    ExercisePhase,
    "standing" | "descending" | "bottom" | "ascending"
  >;
  previousKneeAngle: number | null;
  reachedDepth: boolean;
  excessiveTorsoLean: boolean;
};

export const squatThresholds = {
  minimumConfidence: 0.5,
  descentKneeAngle: 160,
  bottomKneeAngle: 110,
  bottomExitKneeAngle: 120,
  standingKneeAngle: 165,
  maximumTorsoLeanDegrees: 35,
  directionChangeDegrees: 3,
  hipDepthTolerance: 0.02,
} as const;

const squatSideIndices = [
  [11, 23, 25, 27],
  [12, 24, 26, 28],
] as const;

export function measureSquatPose(
  landmarks: PosePoint[],
  frameAspectRatio = 1,
): SquatMetrics {
  const indices = squatSideIndices.reduce((best, candidate) =>
    sideVisibility(landmarks, candidate) > sideVisibility(landmarks, best)
      ? candidate
      : best,
  );
  const [shoulder, hip, knee, ankle] = indices.map(
    (index) => landmarks[index] ?? { x: 0, y: 0, visibility: 0 },
  );
  const scaledShoulder = scaleX(shoulder, frameAspectRatio);
  const scaledHip = scaleX(hip, frameAspectRatio);
  const scaledKnee = scaleX(knee, frameAspectRatio);
  const scaledAnkle = scaleX(ankle, frameAspectRatio);

  return {
    kneeAngle: angleAt(scaledHip, scaledKnee, scaledAnkle),
    torsoLeanDegrees: angleAt(scaledShoulder, scaledHip, {
      x: scaledHip.x,
      y: scaledHip.y - 1,
    }),
    hipAtKneeDepth: hip.y >= knee.y - squatThresholds.hipDepthTolerance,
    confidence: averageVisibility([shoulder, hip, knee, ankle]),
  };
}

export function createSquatState(): SquatState {
  return {
    phase: "standing",
    previousKneeAngle: null,
    reachedDepth: false,
    excessiveTorsoLean: false,
  };
}

export function advanceSquatState(
  state: SquatState,
  metrics: SquatMetrics,
): { state: SquatState; analysis: ExerciseAnalysis } {
  if (metrics.confidence < squatThresholds.minimumConfidence) {
    return {
      state,
      analysis: analysis(state.phase, false, [], metrics.confidence),
    };
  }

  const reachedDepth =
    state.reachedDepth ||
    (metrics.kneeAngle <= squatThresholds.bottomKneeAngle &&
      metrics.hipAtKneeDepth);
  const excessiveTorsoLean =
    state.excessiveTorsoLean ||
    metrics.torsoLeanDegrees > squatThresholds.maximumTorsoLeanDegrees;
  const nextBase = {
    ...state,
    previousKneeAngle: metrics.kneeAngle,
    reachedDepth,
    excessiveTorsoLean,
  };

  if (state.phase === "standing") {
    if (metrics.kneeAngle < squatThresholds.descentKneeAngle) {
      const next = {
        ...nextBase,
        phase: "descending" as const,
        reachedDepth:
          metrics.kneeAngle <= squatThresholds.bottomKneeAngle &&
          metrics.hipAtKneeDepth,
        excessiveTorsoLean:
          metrics.torsoLeanDegrees > squatThresholds.maximumTorsoLeanDegrees,
      };
      return {
        state: next,
        analysis: analysis(next.phase, false, [], metrics.confidence),
      };
    }
    return {
      state: { ...nextBase, reachedDepth: false, excessiveTorsoLean: false },
      analysis: analysis("standing", false, [], metrics.confidence),
    };
  }

  if (state.phase === "descending") {
    if (reachedDepth) {
      const next = { ...nextBase, phase: "bottom" as const };
      return {
        state: next,
        analysis: analysis(next.phase, false, [], metrics.confidence),
      };
    }
    if (isIncreasing(state.previousKneeAngle, metrics.kneeAngle)) {
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
      metrics.kneeAngle >= squatThresholds.bottomExitKneeAngle
        ? "ascending"
        : "bottom";
    return {
      state: { ...nextBase, phase },
      analysis: analysis(phase, false, [], metrics.confidence),
    };
  }

  if (metrics.kneeAngle >= squatThresholds.standingKneeAngle) {
    const issues = completedRepIssues(nextBase, false);
    return {
      state: createSquatState(),
      analysis: analysis("standing", true, issues, metrics.confidence),
    };
  }

  if (isDecreasing(state.previousKneeAngle, metrics.kneeAngle)) {
    const issues = completedRepIssues(nextBase, true);
    const next = {
      ...createSquatState(),
      phase: "descending" as const,
      previousKneeAngle: metrics.kneeAngle,
      excessiveTorsoLean:
        metrics.torsoLeanDegrees > squatThresholds.maximumTorsoLeanDegrees,
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
  state: Pick<SquatState, "reachedDepth" | "excessiveTorsoLean">,
  incompleteStand: boolean,
): FormIssueCode[] {
  const issues: FormIssueCode[] = [];
  if (!state.reachedDepth) issues.push("insufficient_depth");
  if (state.excessiveTorsoLean) issues.push("excessive_torso_lean");
  if (incompleteStand) issues.push("incomplete_stand");
  return issues;
}

function isIncreasing(previous: number | null, current: number): boolean {
  return (
    previous !== null &&
    current - previous >= squatThresholds.directionChangeDegrees
  );
}

function isDecreasing(previous: number | null, current: number): boolean {
  return (
    previous !== null &&
    previous - current >= squatThresholds.directionChangeDegrees
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
