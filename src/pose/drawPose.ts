import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export function drawPose(
  context: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[] | undefined,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);
  if (!landmarks) return;

  context.strokeStyle = "#f3a712";
  context.lineWidth = 2;
  context.fillStyle = "#b54a24";

  for (const connection of connections) {
    const start = landmarks[connection[0]];
    const end = landmarks[connection[1]];
    if (
      !start ||
      !end ||
      (start.visibility ?? 0) < 0.35 ||
      (end.visibility ?? 0) < 0.35
    ) {
      continue;
    }
    context.beginPath();
    context.moveTo(start.x * width, start.y * height);
    context.lineTo(end.x * width, end.y * height);
    context.stroke();
  }

  for (const landmark of landmarks) {
    if ((landmark.visibility ?? 0) < 0.35) continue;
    context.beginPath();
    context.arc(landmark.x * width, landmark.y * height, 3, 0, Math.PI * 2);
    context.fill();
  }
}

const connections: ReadonlyArray<readonly [number, number]> = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [27, 29],
  [28, 30],
  [29, 31],
  [30, 32],
];
