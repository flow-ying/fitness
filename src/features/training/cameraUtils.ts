export function isVideoFrameStalled(
  currentTime: number,
  previousTime: number | null,
  now: number,
  lastChangedAt: number,
  thresholdMs = 1500,
): boolean {
  return (
    previousTime !== null &&
    currentTime === previousTime &&
    lastChangedAt > 0 &&
    now - lastChangedAt >= thresholdMs
  );
}
