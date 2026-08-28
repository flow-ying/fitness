import { StrictMode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CameraView } from "./CameraView";

const { createPoseLandmarkerMock, drawPoseMock } = vi.hoisted(() => ({
  createPoseLandmarkerMock: vi.fn(),
  drawPoseMock: vi.fn(),
}));

vi.mock("../../pose/mediapipe", () => ({
  createPoseLandmarker: createPoseLandmarkerMock,
}));
vi.mock("../../pose/drawPose", () => ({ drawPose: drawPoseMock }));

describe("CameraView", () => {
  let enumerateDevices: ReturnType<typeof vi.fn>;
  let getUserMedia: ReturnType<typeof vi.fn>;
  let rafCallback: FrameRequestCallback | undefined;

  beforeEach(() => {
    enumerateDevices = vi
      .fn()
      .mockResolvedValue([
        { deviceId: "camera-1", kind: "videoinput", label: "测试摄像头" },
      ]);
    getUserMedia = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { enumerateDevices, getUserMedia },
    });
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLVideoElement.prototype, "readyState", {
      configurable: true,
      get: () => HTMLMediaElement.HAVE_CURRENT_DATA,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
      configurable: true,
      get: () => 640,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
      configurable: true,
      get: () => 480,
    });
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: vi.fn(() => ({ clearRect: vi.fn() })),
    });
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        rafCallback = callback;
        return 1;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    createPoseLandmarkerMock.mockReset();
    drawPoseMock.mockReset();
  });

  it("shows a permission error when camera access is rejected", async () => {
    getUserMedia.mockRejectedValue(new Error("摄像头权限被拒绝"));
    const user = userEvent.setup();
    render(<CameraView />);

    await user.click(screen.getByRole("button", { name: "开始摄像头验证" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("摄像头权限被拒绝"),
    );
    expect(createPoseLandmarkerMock).not.toHaveBeenCalled();
  });

  it("keeps the idle status after StrictMode effect cleanup", () => {
    render(
      <StrictMode>
        <CameraView />
      </StrictMode>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "尚未请求摄像头权限",
    );
  });

  it("shows a model error and releases the stream when model loading fails", async () => {
    const stop = vi.fn();
    getUserMedia.mockResolvedValue({ getTracks: () => [{ stop }] });
    createPoseLandmarkerMock.mockRejectedValue(new Error("模型加载失败"));
    const user = userEvent.setup();
    render(<CameraView />);

    await user.click(screen.getByRole("button", { name: "开始摄像头验证" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("模型加载失败"),
    );
    expect(stop).toHaveBeenCalledOnce();
  });

  it("keeps running when the non-critical device refresh fails and releases resources on stop", async () => {
    const stop = vi.fn();
    const close = vi.fn();
    const detectForVideo = vi.fn().mockReturnValue({ landmarks: [[]] });
    enumerateDevices
      .mockResolvedValueOnce([
        { deviceId: "camera-1", kind: "videoinput", label: "测试摄像头" },
      ])
      .mockRejectedValueOnce(new Error("设备刷新失败"));
    getUserMedia.mockResolvedValue({ getTracks: () => [{ stop }] });
    createPoseLandmarkerMock.mockResolvedValue({ close, detectForVideo });
    const user = userEvent.setup();
    render(<CameraView />);
    await waitFor(() => expect(enumerateDevices).toHaveBeenCalledOnce());

    await user.click(screen.getByRole("button", { name: "开始摄像头验证" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("检测运行中"),
    );
    rafCallback?.(performance.now());
    expect(detectForVideo).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "停止验证" }));

    expect(screen.getByRole("status")).toHaveTextContent("验证已停止");
    expect(stop).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it("cleans up the stream and model when the view is unmounted", async () => {
    const stop = vi.fn();
    const close = vi.fn();
    getUserMedia.mockResolvedValue({ getTracks: () => [{ stop }] });
    createPoseLandmarkerMock.mockResolvedValue({
      close,
      detectForVideo: vi.fn().mockReturnValue({ landmarks: [[]] }),
    });
    const user = userEvent.setup();
    const view = render(<CameraView />);

    await user.click(screen.getByRole("button", { name: "开始摄像头验证" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("检测运行中"),
    );

    view.unmount();

    expect(stop).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it("explains when the initial device enumeration is unavailable", async () => {
    enumerateDevices.mockRejectedValue(new Error("设备枚举失败"));
    render(<CameraView />);

    await waitFor(() =>
      expect(screen.getByRole("note")).toHaveTextContent("设备列表不可用"),
    );
  });

  it("publishes detected pose frames to a training consumer", async () => {
    const onPoseFrame = vi.fn();
    const landmarks = [{ x: 0.5, y: 0.5, visibility: 0.9 }];
    getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] });
    createPoseLandmarkerMock.mockResolvedValue({
      close: vi.fn(),
      detectForVideo: vi.fn().mockReturnValue({ landmarks: [landmarks] }),
    });
    const user = userEvent.setup();
    render(<CameraView onPoseFrame={onPoseFrame} />);

    await user.click(screen.getByRole("button", { name: "开始摄像头验证" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("检测运行中"),
    );
    await act(() => rafCallback?.(performance.now()));

    expect(onPoseFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        landmarks,
        frameAspectRatio: 4 / 3,
      }),
    );
  });
});
