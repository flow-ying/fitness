import { describe, expect, it } from "vitest";
import {
  angleAt,
  averageVisibility,
  estimateBodyDirection,
  smoothLandmarks,
} from "./geometry";

describe("pose geometry", () => {
  it("calculates a right angle at the middle point", () => {
    expect(angleAt({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(
      90,
    );
  });

  it("averages visibility across landmarks", () => {
    expect(
      averageVisibility([
        { x: 0, y: 0, visibility: 0.8 },
        { x: 0, y: 0, visibility: 0.4 },
      ]),
    ).toBeCloseTo(0.6);
  });

  it("smooths coordinates with an alpha weight", () => {
    const smoothed = smoothLandmarks(
      [{ x: 0, y: 0, visibility: 1 }],
      [{ x: 1, y: 1, visibility: 0.5 }],
      0.25,
    );
    expect(smoothed[0]).toEqual({ x: 0.25, y: 0.25, visibility: 0.875 });
  });

  it("uses shoulder and hip visibility as a conservative body-direction hint", () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0,
      y: 0,
      visibility: 0.9,
    }));
    landmarks[11].visibility = 0.2;
    landmarks[23].visibility = 0.2;
    expect(estimateBodyDirection(landmarks)).toBe("side");
    landmarks[11].visibility = 0.9;
    landmarks[23].visibility = 0.9;
    expect(estimateBodyDirection(landmarks)).toBe("frontal");
  });
});
