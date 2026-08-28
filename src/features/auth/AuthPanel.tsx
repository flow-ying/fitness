import { useState, type FormEvent } from "react";
import { useAuth } from "./AuthContext";
import "./AuthPanel.css";

export function AuthPanel({ onClose }: { onClose?: () => void }) {
  const { configured, error, loading, signIn, signUp, signOut, user } =
    useAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    if (!email.includes("@") || password.length < 6) {
      setMessage("请输入有效邮箱，密码至少 6 位。");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signIn") {
        await signIn(email, password);
        setMessage("登录成功。");
      } else {
        const signedIn = await signUp(email, password);
        setMessage(
          signedIn ? "注册成功。" : "注册成功，请查收邮箱完成确认后再登录。",
        );
      }
    } catch {
      // AuthContext exposes a safe user-facing message.
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-panel-heading">
          <p className="section-index">ACCOUNT</p>
          <h2 id="auth-title">已登录</h2>
        </div>
        <p className="auth-copy">当前账号：{user.email ?? "未提供邮箱"}</p>
        <div className="auth-actions">
          <button
            type="button"
            className="auth-button"
            onClick={() => void signOut()}
          >
            退出登录
          </button>
        </div>
        {onClose && (
          <button type="button" className="auth-text-button" onClick={onClose}>
            返回
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-panel-heading">
        <p className="section-index">ACCOUNT / LIGHT AUTH</p>
        <h2 id="auth-title">登录后保存训练历史</h2>
      </div>
      <p className="auth-copy">
        账号只用于隔离训练汇总；系统不会上传摄像头视频或逐帧关键点。
      </p>
      {!configured && (
        <p className="auth-notice" role="status">
          尚未配置 Supabase，当前只能继续本地训练，云端登录暂不可用。
        </p>
      )}
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label>
          邮箱
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          密码
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={
              mode === "signIn" ? "current-password" : "new-password"
            }
            minLength={6}
            required
          />
        </label>
        {(error || message) && (
          <p className="auth-message" role="status">
            {error || message}
          </p>
        )}
        <button
          type="submit"
          className="auth-button"
          disabled={!configured || loading || submitting}
        >
          {submitting ? "处理中…" : mode === "signIn" ? "登录" : "注册"}
        </button>
      </form>
      <button
        type="button"
        className="auth-text-button"
        onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
      >
        {mode === "signIn" ? "还没有账号？注册" : "已有账号？返回登录"}
      </button>
      {onClose && (
        <button type="button" className="auth-text-button" onClick={onClose}>
          返回
        </button>
      )}
    </section>
  );
}
