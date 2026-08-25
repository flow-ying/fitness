import { describe, expect, it, vi } from "vitest";
import { drawPose } from "./drawPose";

function createContext() {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    strokeStyle: "",
    lineWidth: 0,
    fillStyle: "",
  } as unknown as CanvasRenderingContext2D;
}

describe("drawPose", () => {
  it("clears the overlay when no pose is available", () => {
    const context = createContext();

    drawPose(context, undefined, 640, 480);

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 640, 480);
    expect(context.stroke).not.toHaveBeenCalled();
  });

  it("draws visible landmarks and connections in canvas coordinates", () => {
    const context = createContext();
    const landmarks = Array.from({ length: 33 }, (_, index) => ({
      x: index === 11 ? 0.25 : index === 12 ? 0.75 : 0.5,
      y: index === 11 ? 0.2 : index === 12 ? 0.2 : 0.5,
      z: 0,
      visibility: 0.9,
    }));

    drawPose(context, landmarks, 640, 480);

    expect(context.moveTo).toHaveBeenCalledWith(160, 96);
    expect(context.lineTo).toHaveBeenCalledWith(480, 96);
    expect(context.arc).toHaveBeenCalled();
  });
});
