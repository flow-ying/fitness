import type { ExerciseAnalysis, ExercisePhase, FormIssueCode } from "../types";
import {
  angleAt,
  averageVisibility,
  type PosePoint,
} from "../../pose/geometry";

export type CurlMetrics = {
  elbowAngle: number;
  upperArmMovementDegrees: number;
  torsoSwingDegrees: number;
  confidence: number;
};

export type CurlState = {
  phase: Extract<
    ExercisePhase,
    "standing" | "descending" | "bottom" | "ascending"
  >;
  previousElbowAngle: number | null;
  reachedTop: boolean;
  upperArmMoved: boolean;
  bodySwung: boolean;
};

export const curlThresholds = {
  minimumConfidence: 0.5,
  curlStartElbowAngle: 155,
  topElbowAngle: 80,
  topExitElbowAngle: 100,
  extendedElbowAngle: 165,
  maximumUpperArmMovementDegrees: 15,
  maximumTorsoSwingDegrees: 15,
  directionChangeDegrees: 3,
} as const;

const curlSideIndices = [
  [12, 14, 16, 24],
  [11, 13, 15, 23],
] as const;

export function measureCurlPose(
  landmarks: PosePoint[],
  frameAspectRatio = 1,
): CurlMetrics {
  const indices = curlSideIndices.reduce((best, candidate) =>
    sideVisibility(landmarks, candidate) > sideVisibility(landmarks, best)
      ? candidate
      : best,
  );
  const [shoulder, elbow, wrist, hip] = indices
    .slice(0, 4)
    .map((index) => landmarks[index] ?? { x: 0, y: 0, visibility: 0 });
  const scaledShoulder = scaleX(shoulder, frameAspectRatio);
  const scaledElbow = scaleX(elbow, frameAspectRatio);
  const scaledWrist = scaleX(wrist, frameAspectRatio);
  const scaledHip = scaleX(hip, frameAspectRatio);

  return {
    elbowAngle: angleAt(scaledShoulder, scaledElbow, scaledWrist),
    upperArmMovementDegrees: angleAt(scaledShoulder, scaledElbow, {
      x: scaledElbow.x,
      y: scaledElbow.y - 1,
    }),
    torsoSwingDegrees: angleAt(scaledShoulder, scaledHip, {
      x: scaledHip.x,
      y: scaledHip.y - 1,
    }),
    confidence: averageVisibility([shoulder, elbow, wrist, hip]),
  };
}

export function createCurlState(): CurlState {
  return {
    phase: "standing",
    previousElbowAngle: null,
    reachedTop: false,
    upperArmMoved: false,
    bodySwung: false,
  };
}

export function advanceCurlState(
  state: CurlState,
  metrics: CurlMetrics,
): { state: CurlState; analysis: ExerciseAnalysis } {
  if (metrics.confidence < curlThresholds.minimumConfidence) {
    return {
      state,
      analysis: analysis(state.phase, false, [], metrics.confidence),
    };
  }

  const reachedTop =
    state.reachedTop || metrics.elbowAngle <= curlThresholds.topElbowAngle;
  const upperArmMoved =
    state.upperArmMoved ||
    metrics.upperArmMovementDegrees >
      curlThresholds.maximumUpperArmMovementDegrees;
  const bodySwung =
    state.bodySwung ||
    metrics.torsoSwingDegrees > curlThresholds.maximumTorsoSwingDegrees;
  const nextBase = {
    ...state,
    previousElbowAngle: metrics.elbowAngle,
    reachedTop,
    upperArmMoved,
    bodySwung,
  };

  if (state.phase === "standing") {
    if (metrics.elbowAngle < curlThresholds.curlStartElbowAngle) {
      const next = {
        ...nextBase,
        phase: "descending" as const,
        reachedTop: metrics.elbowAngle <= curlThresholds.topElbowAngle,
        upperArmMoved:
          metrics.upperArmMovementDegrees >
          curlThresholds.maximumUpperArmMovementDegrees,
        bodySwung:
          metrics.torsoSwingDegrees > curlThresholds.maximumTorsoSwingDegrees,
      };
      return {
        state: next,
        analysis: analysis(next.phase, false, [], metrics.confidence),
      };
    }
    return {
      state: {
        ...nextBase,
        reachedTop: false,
        upperArmMoved: false,
        bodySwung: false,
      },
      analysis: analysis("standing", false, [], metrics.confidence),
    };
  }

  if (state.phase === "descending") {
    if (reachedTop) {
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
      metrics.elbowAngle >= curlThresholds.topExitElbowAngle
        ? "ascending"
        : "bottom";
    return {
      state: { ...nextBase, phase },
      analysis: analysis(phase, false, [], metrics.confidence),
    };
  }

  if (metrics.elbowAngle >= curlThresholds.extendedElbowAngle) {
    const issues = completedRepIssues(nextBase);
    return {
      state: createCurlState(),
      analysis: analysis("standing", true, issues, metrics.confidence),
    };
  }

  if (isDecreasing(state.previousElbowAngle, metrics.elbowAngle)) {
    const issues = completedRepIssues(nextBase);
    const next = {
      ...createCurlState(),
      phase: "descending" as const,
      previousElbowAngle: metrics.elbowAngle,
      upperArmMoved:
        metrics.upperArmMovementDegrees >
        curlThresholds.maximumUpperArmMovementDegrees,
      bodySwung:
        metrics.torsoSwingDegrees > curlThresholds.maximumTorsoSwingDegrees,
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
  state: Pick<CurlState, "reachedTop" | "upperArmMoved" | "bodySwung">,
): FormIssueCode[] {
  const issues: FormIssueCode[] = [];
  if (!state.reachedTop) issues.push("insufficient_curl");
  if (state.upperArmMoved) issues.push("upper_arm_movement");
  if (state.bodySwung) issues.push("body_swing");
  return issues;
}

function isIncreasing(previous: number | null, current: number): boolean {
  return (
    previous !== null &&
    current - previous >= curlThresholds.directionChangeDegrees
  );
}

function isDecreasing(previous: number | null, current: number): boolean {
  return (
    previous !== null &&
    previous - current >= curlThresholds.directionChangeDegrees
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
