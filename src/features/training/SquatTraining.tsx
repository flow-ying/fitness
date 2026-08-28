import { useCallback, useRef, useState } from "react";
import { measureSquatPose, squatThresholds } from "../../exercises/squat/squat";
import type { ExercisePhase, FormIssueCode } from "../../exercises/types";
import { processPose, type ProcessedPose } from "../../pose/processPose";
import { CameraView, type PoseFrame } from "./CameraView";
import {
  advanceSquatSessionMetrics,
  createSquatSession,
  type SquatSession,
} from "./squatSession";
import "./SquatTraining.css";

const phaseLabels: Record<ExercisePhase, string> = {
  ready: "等待准备",
  standing: "站立准备",
  descending: "正在下蹲",
  bottom: "到达底部",
  ascending: "正在站起",
  top: "顶部",
};

const issueLabels: Record<FormIssueCode, string> = {
  insufficient_depth: "下蹲深度不足",
  excessive_torso_lean: "躯干前倾过大",
  incomplete_stand: "没有完全站起",
  insufficient_elbow_bend: "肘部弯曲不足",
  body_line_break: "身体线条异常",
  incomplete_extension: "顶部未伸直",
  insufficient_curl: "弯举幅度不足",
  upper_arm_movement: "上臂移动过大",
  body_swing: "身体摆动",
};

const poseConfig = {
  minVisibility: 0.4,
  smoothingAlpha: 0.35,
  maxDeltaMs: 250,
};

export function SquatTraining({ onBack }: { onBack?: () => void }) {
  const initialSession = createSquatSession();
  const sessionRef = useRef<SquatSession>(initialSession);
  const previousPoseRef = useRef<ProcessedPose | undefined>(undefined);
  const lastUiUpdateRef = useRef(0);
  const [session, setSession] = useState(initialSession);
  const [poseStatus, setPoseStatus] = useState("等待摄像头画面");

  const handlePoseFrame = useCallback((frame: PoseFrame) => {
    const processed = processPose(
      frame.landmarks,
      frame.timestampMs,
      previousPoseRef.current,
      poseConfig,
    );
    previousPoseRef.current = processed;
    const shouldUpdateUi = frame.timestampMs - lastUiUpdateRef.current >= 100;

    if (!processed.isUsable) {
      if (shouldUpdateUi) {
        setPoseStatus(
          processed.reason === "insufficient_landmarks"
            ? "请确保全身完整入镜"
            : "关键点可见度较低，请调整机位或光线",
        );
        lastUiUpdateRef.current = frame.timestampMs;
      }
      return;
    }

    const metrics = measureSquatPose(
      processed.landmarks,
      frame.frameAspectRatio,
    );
    const previousTotal = sessionRef.current.exercise.totalReps;
    const next = advanceSquatSessionMetrics(
      sessionRef.current,
      metrics,
      frame.timestampMs,
    );
    sessionRef.current = next;
    const repCompleted = next.exercise.totalReps > previousTotal;
    if (shouldUpdateUi || repCompleted) {
      setSession(next);
      setPoseStatus(
        metrics.confidence < squatThresholds.minimumConfidence
          ? "侧面关键关节不清晰，请调整机位"
          : "姿态可用，正在分析深蹲",
      );
      lastUiUpdateRef.current = frame.timestampMs;
    }
  }, []);

  const resetSession = () => {
    const reset = createSquatSession();
    sessionRef.current = reset;
    previousPoseRef.current = undefined;
    lastUiUpdateRef.current = 0;
    setSession(reset);
    setPoseStatus("等待摄像头画面");
  };

  const formScore = session.exercise.totalReps
    ? Math.round(
        (session.exercise.correctReps / session.exercise.totalReps) * 100,
      )
    : null;

  return (
    <CameraView
      sectionId="squat-training"
      eyebrow="04 / T05 深蹲切片"
      title="深蹲实时训练"
      description="请从身体侧面拍摄并保持全身入镜。系统依据膝角、髋部深度和躯干方向判断阶段；视频仍只在本机处理。"
      onPoseFrame={handlePoseFrame}
      feedback={
        <div className="squat-feedback">
          <p
            className="squat-pose-status"
            role="status"
            aria-label="深蹲分析状态"
          >
            {poseStatus}
          </p>
          <dl className="squat-summary">
            <div>
              <dt>当前阶段</dt>
              <dd>{phaseLabels[session.tracker.phase]}</dd>
            </div>
            <div>
              <dt>总次数</dt>
              <dd>{session.exercise.totalReps} 次</dd>
            </div>
            <div>
              <dt>规范次数</dt>
              <dd>{session.exercise.correctReps} 次</dd>
            </div>
            <div>
              <dt>规范率</dt>
              <dd>{formScore === null ? "—" : `${formScore}%`}</dd>
            </div>
          </dl>
          <div className="squat-last-feedback" aria-live="polite">
            <strong>最近一次反馈</strong>
            {session.exercise.totalReps === 0 ? (
              <p>完成一次动作后显示判定结果。</p>
            ) : session.lastIssues.length === 0 ? (
              <p>动作完整，未触发首版错误规则。</p>
            ) : (
              <ul>
                {session.lastIssues.map((issue) => (
                  <li key={issue}>{issueLabels[issue]}</li>
                ))}
              </ul>
            )}
          </div>
          <p className="squat-threshold-note">
            当前角度阈值用于技术验证，仍需用自采样例校准；结果不替代教练或医疗判断。
          </p>
          <button
            type="button"
            className="camera-button camera-button-muted"
            onClick={resetSession}
          >
            重置本次统计
          </button>
          {onBack && (
            <button
              type="button"
              className="camera-button camera-button-muted"
              onClick={onBack}
            >
              返回动作列表
            </button>
          )}
        </div>
      }
    />
  );
}
