export type PosePoint = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type BodyDirection = "frontal" | "side" | "unknown";

export function angleAt(a: PosePoint, vertex: PosePoint, b: PosePoint): number {
  const ax = a.x - vertex.x;
  const ay = a.y - vertex.y;
  const bx = b.x - vertex.x;
  const by = b.y - vertex.y;
  const magnitude = Math.hypot(ax, ay) * Math.hypot(bx, by);
  if (magnitude === 0) return 0;
  const cosine = Math.min(1, Math.max(-1, (ax * bx + ay * by) / magnitude));
  return (Math.acos(cosine) * 180) / Math.PI;
}

export function averageVisibility(landmarks: PosePoint[]): number {
  if (landmarks.length === 0) return 0;
  return (
    landmarks.reduce((sum, landmark) => sum + (landmark.visibility ?? 0), 0) /
    landmarks.length
  );
}

export function estimateBodyDirection(
  landmarks: PosePoint[],
  visibilityThreshold = 0.5,
): BodyDirection {
  const left = [landmarks[11], landmarks[23]];
  const right = [landmarks[12], landmarks[24]];
  if (left.some((point) => !point) || right.some((point) => !point)) {
    return "unknown";
  }
  const leftVisibility = averageVisibility(left as PosePoint[]);
  const rightVisibility = averageVisibility(right as PosePoint[]);
  if (
    leftVisibility < visibilityThreshold &&
    rightVisibility < visibilityThreshold
  ) {
    return "unknown";
  }
  return Math.abs(leftVisibility - rightVisibility) >= 0.2 ? "side" : "frontal";
}

export function smoothLandmarks(
  previous: PosePoint[] | undefined,
  current: PosePoint[],
  alpha: number,
): PosePoint[] {
  const weight = Math.min(1, Math.max(0, alpha));
  if (!previous || previous.length !== current.length)
    return current.map((point) => ({ ...point }));
  return current.map((point, index) => {
    const previousPoint = previous[index];
    return {
      ...point,
      x: previousPoint.x + (point.x - previousPoint.x) * weight,
      y: previousPoint.y + (point.y - previousPoint.y) * weight,
      z:
        point.z === undefined || previousPoint.z === undefined
          ? point.z
          : previousPoint.z + (point.z - previousPoint.z) * weight,
      visibility:
        previousPoint.visibility === undefined || point.visibility === undefined
          ? point.visibility
          : previousPoint.visibility +
            (point.visibility - previousPoint.visibility) * weight,
    };
  });
}
