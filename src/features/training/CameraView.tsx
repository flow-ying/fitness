import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  NormalizedLandmark,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import { createPoseLandmarker } from "../../pose/mediapipe";
import { drawPose } from "../../pose/drawPose";
import "./CameraView.css";

type CameraStatus = "idle" | "loading" | "running" | "stopped" | "error";

export type PoseFrame = {
  landmarks: NormalizedLandmark[];
  timestampMs: number;
  frameAspectRatio: number;
  fps: number;
};

type CameraViewProps = {
  sectionId?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  feedback?: ReactNode;
  onPoseFrame?: (frame: PoseFrame) => void;
};

export function CameraView({
  sectionId = "camera-validation",
  eyebrow = "03 / T02 技术验证",
  title = "先确认设备能稳定看见全身",
  description = "这是开发验证页，不会上传视频。授权后，Pose Landmarker Lite 在浏览器本地推理，Canvas 只叠加当前帧的骨架。",
  feedback,
  onPoseFrame,
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const runDetectionRef = useRef<() => void>(() => undefined);
  const onPoseFrameRef = useRef(onPoseFrame);
  const operationIdRef = useRef(0);
  const frameCountRef = useRef(0);
  const fpsStartedAtRef = useRef(0);
  const fpsRef = useRef(0);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [deviceNotice, setDeviceNotice] = useState("");
  const [fps, setFps] = useState(0);
  const [landmarkCount, setLandmarkCount] = useState(0);
  const [visibility, setVisibility] = useState(0);

  const stopCamera = useCallback((updateStatus = true) => {
    operationIdRef.current += 1;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    const context = canvasRef.current?.getContext("2d");
    if (context && canvasRef.current) {
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height,
      );
    }
    if (updateStatus) {
      setStatus((current) => (current === "error" ? current : "stopped"));
    }
  }, []);

  useEffect(() => {
    let active = true;
    void navigator.mediaDevices?.enumerateDevices().then(
      (allDevices) => {
        if (!active) return;
        const cameras = allDevices.filter(
          (device) => device.kind === "videoinput",
        );
        setDevices(cameras);
        setSelectedDeviceId((current) => current || cameras[0]?.deviceId || "");
      },
      () => {
        if (active) setDeviceNotice("设备列表不可用，将尝试使用默认摄像头");
      },
    );
    return () => {
      active = false;
      stopCamera(false);
    };
  }, [stopCamera]);

  const runDetection = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (
      !video ||
      !canvas ||
      !landmarker ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      animationFrameRef.current = requestAnimationFrame(() =>
        runDetectionRef.current(),
      );
      return;
    }

    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const context = canvas.getContext("2d");
    if (!context) return;
    const timestampMs = performance.now();
    const result = landmarker.detectForVideo(video, timestampMs);
    const pose = result.landmarks[0];
    drawPose(context, pose, canvas.width, canvas.height);
    setLandmarkCount(pose?.length ?? 0);
    setVisibility(
      pose && pose.length > 0
        ? pose.reduce((sum, landmark) => sum + (landmark.visibility ?? 0), 0) /
            pose.length
        : 0,
    );
    frameCountRef.current += 1;
    const now = performance.now();
    if (now - fpsStartedAtRef.current >= 1000) {
      setFps(
        (fpsRef.current = Math.round(
          (frameCountRef.current * 1000) / (now - fpsStartedAtRef.current),
        )),
      );
      frameCountRef.current = 0;
      fpsStartedAtRef.current = now;
    }
    onPoseFrameRef.current?.({
      landmarks: pose ?? [],
      timestampMs,
      frameAspectRatio:
        video.videoHeight > 0 ? video.videoWidth / video.videoHeight : 1,
      fps: fpsRef.current,
    });
    animationFrameRef.current = requestAnimationFrame(() =>
      runDetectionRef.current(),
    );
  }, []);

  useEffect(() => {
    runDetectionRef.current = runDetection;
  }, [runDetection]);

  useEffect(() => {
    onPoseFrameRef.current = onPoseFrame;
  }, [onPoseFrame]);

  const startCamera = async () => {
    stopCamera();
    const operationId = operationIdRef.current;
    setStatus("loading");
    setErrorMessage("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "当前浏览器不支持摄像头 API，请使用 HTTPS 或 localhost 访问。",
        );
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : true,
      });
      if (operationId !== operationIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("视频元素未准备好。");
      video.srcObject = stream;
      await video.play();
      const landmarker = await createPoseLandmarker();
      if (operationId !== operationIdRef.current) {
        landmarker.close();
        return;
      }
      landmarkerRef.current = landmarker;
      frameCountRef.current = 0;
      fpsStartedAtRef.current = performance.now();
      setStatus("running");
      animationFrameRef.current = requestAnimationFrame(() =>
        runDetectionRef.current(),
      );
      try {
        const refreshed = await navigator.mediaDevices.enumerateDevices();
        setDevices(refreshed.filter((device) => device.kind === "videoinput"));
        setDeviceNotice("");
      } catch {
        setDeviceNotice("设备列表刷新失败，当前验证仍在运行");
      }
    } catch (error) {
      if (operationId !== operationIdRef.current) return;
      stopCamera();
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "摄像头或模型初始化失败。",
      );
    }
  };

  return (
    <section
      id={sectionId}
      className="camera-validation"
      aria-labelledby={`${sectionId}-title`}
    >
      <div className="camera-copy">
        <p className="section-index">{eyebrow}</p>
        <h2 id={`${sectionId}-title`}>{title}</h2>
        <p>{description}</p>
        <div className="camera-controls">
          <label>
            摄像头
            <select
              value={selectedDeviceId}
              onChange={(event) => setSelectedDeviceId(event.target.value)}
              disabled={status === "loading" || status === "running"}
            >
              {devices.length === 0 && <option value="">默认设备</option>}
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `摄像头 ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
          {deviceNotice && (
            <p className="camera-device-notice" role="note">
              {deviceNotice}
            </p>
          )}
          {status === "running" ? (
            <button
              type="button"
              className="camera-button camera-button-muted"
              onClick={() => stopCamera()}
            >
              停止验证
            </button>
          ) : (
            <button
              type="button"
              className="camera-button"
              onClick={() => void startCamera()}
              disabled={status === "loading"}
            >
              {status === "loading" ? "正在加载模型…" : "开始摄像头验证"}
            </button>
          )}
        </div>
        <p className="camera-status" role="status">
          {status === "idle" && "尚未请求摄像头权限"}
          {status === "loading" && "正在请求权限并加载 Lite 模型"}
          {status === "running" && "检测运行中，可站到画面中测试全身入镜"}
          {status === "stopped" && "验证已停止，摄像头轨道已释放"}
          {status === "error" && errorMessage}
        </p>
        {feedback}
      </div>

      <div className="camera-stage-wrap">
        <div className="camera-stage">
          <video ref={videoRef} muted playsInline aria-label="摄像头画面" />
          <canvas ref={canvasRef} aria-label="人体姿态骨架叠加层" />
          {status !== "running" && (
            <span className="camera-placeholder">等待摄像头画面</span>
          )}
        </div>
        <dl className="camera-metrics">
          <div>
            <dt>平均 FPS</dt>
            <dd>{fps || "—"}</dd>
          </div>
          <div>
            <dt>关键点</dt>
            <dd>{landmarkCount || "—"}/33</dd>
          </div>
          <div>
            <dt>可见度</dt>
            <dd>{landmarkCount ? `${Math.round(visibility * 100)}%` : "—"}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
