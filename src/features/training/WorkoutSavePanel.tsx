import { useState } from "react";
import type { ExerciseState } from "../../exercises/stateMachine";
import { saveWorkoutResult } from "../../services/history";
import type { WorkoutExercise } from "../../services/supabase";
import { createWorkoutResultInput } from "../../services/result";
import { useOptionalAuth } from "../auth/AuthContext";
import "./WorkoutSavePanel.css";

const labels: Record<WorkoutExercise, string> = {
  squat: "深蹲",
  pushup: "俯卧撑",
  curl: "哑铃弯举",
};

export function WorkoutSavePanel({
  exerciseType,
  exercise,
  startedAt,
  averageFps,
}: {
  exerciseType: WorkoutExercise;
  exercise: ExerciseState;
  startedAt: string | null;
  averageFps: number;
}) {
  const { client, user } = useOptionalAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const handleSave = async () => {
    if (!client || !user || !startedAt || exercise.totalReps === 0) {
      setMessage(
        !user
          ? "请先登录后再保存训练结果。"
          : !client
            ? "尚未配置云端服务，结果暂只能保留在当前页面。"
            : "完成至少一次动作后才能保存。",
      );
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await saveWorkoutResult(
        client,
        user.id,
        createWorkoutResultInput(
          exerciseType,
          exercise,
          startedAt,
          new Date().toISOString(),
          averageFps,
        ),
      );
      setMessage(`${labels[exerciseType]}训练结果已保存。`);
    } catch {
      setMessage("训练结果保存失败，请检查网络后重试。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workout-save-panel">
      <button
        type="button"
        className="camera-button"
        onClick={() => void handleSave()}
        disabled={saving}
      >
        {saving ? "正在保存…" : "保存训练结果"}
      </button>
      {!user && <p>登录后可将本次汇总保存到云端历史。</p>}
      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
