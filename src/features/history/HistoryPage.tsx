import { useEffect, useState } from "react";
import type { WorkoutResultRow } from "../../services/database.types";
import { listWorkoutResults } from "../../services/history";
import { useAuth } from "../auth/AuthContext";
import { summarizeWorkoutResults } from "./stats";
import "./HistoryPage.css";

const exerciseLabels: Record<WorkoutResultRow["exercise_type"], string> = {
  squat: "深蹲",
  pushup: "俯卧撑",
  curl: "哑铃弯举",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function HistoryPage({ onBack }: { onBack?: () => void }) {
  const { client, configured, loading: authLoading, user } = useAuth();
  const [rows, setRows] = useState<WorkoutResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRow, setSelectedRow] = useState<WorkoutResultRow | null>(null);

  useEffect(() => {
    if (!user || !client) return;
    let active = true;
    // Loading is reset for each authenticated user before the async query resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    void listWorkoutResults(client)
      .then((nextRows) => {
        if (active) setRows(nextRows);
      })
      .catch(() => {
        if (active) setError("历史记录加载失败，请稍后重试。");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client, user]);

  const stats = summarizeWorkoutResults(rows);

  return (
    <main className="history-page" aria-labelledby="history-title">
      <div className="history-heading">
        <div>
          <p className="section-index">HISTORY / CLOUD SUMMARY</p>
          <h1 id="history-title">训练历史</h1>
          <p className="history-copy">
            只展示当前登录账号的训练汇总，原始视频和逐帧关键点不会上传。
          </p>
        </div>
        {onBack && (
          <button type="button" className="history-back" onClick={onBack}>
            返回首页
          </button>
        )}
      </div>

      {authLoading && <p role="status">正在恢复登录会话…</p>}
      {!authLoading && !configured && (
        <p className="history-notice" role="status">
          尚未配置云端服务，历史记录暂不可用。
        </p>
      )}
      {!authLoading && configured && !user && (
        <p className="history-notice" role="status">
          请先登录，再查看属于自己的训练历史。
        </p>
      )}
      {error && (
        <p className="history-error" role="alert">
          {error}
        </p>
      )}
      {user && client && (
        <>
          <dl className="history-stats">
            <div>
              <dt>训练次数</dt>
              <dd>{stats.totalSessions}</dd>
            </div>
            <div>
              <dt>累计次数</dt>
              <dd>{stats.totalReps}</dd>
            </div>
            <div>
              <dt>平均规范率</dt>
              <dd>{stats.averageFormScore}%</dd>
            </div>
          </dl>
          {loading ? (
            <p role="status">正在加载历史记录…</p>
          ) : rows.length === 0 ? (
            <p className="history-empty">
              还没有训练记录，完成一次训练后会显示在这里。
            </p>
          ) : (
            <ul className="history-list" aria-label="训练记录列表">
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className="history-row-button"
                    onClick={() => setSelectedRow(row)}
                  >
                    <strong>{exerciseLabels[row.exercise_type]}</strong>
                    <span>{formatDate(row.started_at)}</span>
                  </button>
                  <dl>
                    <div>
                      <dt>次数</dt>
                      <dd>{row.total_reps}</dd>
                    </div>
                    <div>
                      <dt>规范率</dt>
                      <dd>{row.form_score}%</dd>
                    </div>
                    <div>
                      <dt>时长</dt>
                      <dd>{row.duration_seconds}s</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
          {selectedRow && (
            <section
              className="history-detail"
              aria-labelledby="history-detail-title"
            >
              <div>
                <p className="section-index">SESSION DETAIL</p>
                <h2 id="history-detail-title">
                  {exerciseLabels[selectedRow.exercise_type]} ·{" "}
                  {formatDate(selectedRow.started_at)}
                </h2>
              </div>
              <dl>
                <div>
                  <dt>总次数</dt>
                  <dd>{selectedRow.total_reps}</dd>
                </div>
                <div>
                  <dt>规范次数</dt>
                  <dd>{selectedRow.correct_reps}</dd>
                </div>
                <div>
                  <dt>平均 FPS</dt>
                  <dd>{selectedRow.average_fps}</dd>
                </div>
              </dl>
            </section>
          )}
        </>
      )}
    </main>
  );
}
