import { useState } from "react";
import { CameraView } from "./features/training/CameraView";
import { PushupTraining } from "./features/training/PushupTraining";
import { SquatTraining } from "./features/training/SquatTraining";
import "./App.css";

const exercises = [
  {
    name: "深蹲",
    code: "SQ",
    focus: "下蹲深度 · 躯干角度 · 完整站起",
    view: "侧面全身机位",
  },
  {
    name: "俯卧撑",
    code: "PU",
    focus: "肘部幅度 · 身体直线 · 顶部伸展",
    view: "侧面全身机位",
  },
  {
    name: "哑铃弯举",
    code: "BC",
    focus: "弯举幅度 · 上臂稳定 · 身体摆动",
    view: "侧面上身机位",
  },
];

function App() {
  const [showCameraValidation, setShowCameraValidation] = useState(false);
  const [activeExercise, setActiveExercise] = useState<
    "squat" | "pushup" | null
  >(null);

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="姿态工坊首页">
          <span className="brand-mark" aria-hidden="true">
            F/
          </span>
          <span>姿态工坊</span>
        </a>
        <nav aria-label="主导航">
          <a href="#workflow">工作方式</a>
          <a href="#exercises">首版动作</a>
        </nav>
      </header>

      <main id="top">
        {activeExercise === "squat" ? (
          <SquatTraining onBack={() => setActiveExercise(null)} />
        ) : activeExercise === "pushup" ? (
          <PushupTraining onBack={() => setActiveExercise(null)} />
        ) : (
          <>
            <section className="hero-section" aria-labelledby="hero-title">
              <div className="hero-copy">
                <p className="eyebrow">AI FITNESS FORM COACH / BUILD 01</p>
                <h1 id="hero-title">让每一次动作，都有清晰反馈</h1>
                <p className="hero-description">
                  通过浏览器摄像头识别人体关键点，实时完成动作计数与规范性提示。
                  视频只在设备本地处理，训练结果由用户决定是否保存。
                </p>
                <div className="hero-actions">
                  <button
                    className="primary-link"
                    type="button"
                    onClick={() =>
                      setShowCameraValidation((current) => !current)
                    }
                    aria-expanded={showCameraValidation}
                    aria-controls="camera-validation"
                  >
                    {showCameraValidation ? "收起技术验证" : "打开摄像头验证"}
                    <span aria-hidden="true">↘</span>
                  </button>
                  <a className="secondary-link" href="#exercises">
                    查看首版动作
                  </a>
                  <p className="build-status" role="status">
                    <span aria-hidden="true" />
                    工程基线已就绪
                  </p>
                </div>
              </div>

              <div
                className="pose-panel"
                role="img"
                aria-label="姿态识别界面示意图"
              >
                <div className="pose-panel-head">
                  <span>CAMERA / 01</span>
                  <span>LOCAL PROCESSING</span>
                </div>
                <div className="pose-stage" aria-hidden="true">
                  <div className="scan-line" />
                  <div className="pose-head" />
                  <div className="pose-torso" />
                  <div className="pose-arm pose-arm-left" />
                  <div className="pose-arm pose-arm-right" />
                  <div className="pose-leg pose-leg-left" />
                  <div className="pose-leg pose-leg-right" />
                  <span className="joint joint-shoulder-left" />
                  <span className="joint joint-shoulder-right" />
                  <span className="joint joint-hip-left" />
                  <span className="joint joint-hip-right" />
                  <span className="joint joint-knee-left" />
                  <span className="joint joint-knee-right" />
                </div>
                <div className="pose-panel-foot">
                  <span>33 LANDMARKS</span>
                  <span className="signal">READY</span>
                </div>
              </div>
            </section>

            {showCameraValidation && <CameraView />}

            <section
              className="workflow-section"
              id="workflow"
              aria-labelledby="workflow-title"
            >
              <div className="section-heading">
                <p className="section-index">01 / 工作方式</p>
                <h2 id="workflow-title">从摄像头到可解释反馈</h2>
              </div>
              <ol className="workflow-list">
                <li>
                  <strong>选择动作</strong>
                  <span>先确定检测规则，避免自动分类带来的额外误差。</span>
                </li>
                <li>
                  <strong>识别姿态</strong>
                  <span>MediaPipe 在浏览器本地提取人体关键点。</span>
                </li>
                <li>
                  <strong>获得反馈</strong>
                  <span>角度与状态机共同判断次数、阶段和动作问题。</span>
                </li>
              </ol>
            </section>

            <section
              className="exercise-section"
              id="exercises"
              aria-labelledby="exercise-title"
            >
              <div className="section-heading">
                <p className="section-index">02 / 首版范围</p>
                <h2 id="exercise-title">三种动作，先把判断做扎实</h2>
              </div>
              <ul className="exercise-list" aria-label="首版支持动作">
                {exercises.map((exercise, index) => (
                  <li key={exercise.code}>
                    <div className="exercise-number">0{index + 1}</div>
                    <div className="exercise-title-row">
                      <span className="exercise-code">{exercise.code}</span>
                      <h3>{exercise.name}</h3>
                    </div>
                    <p>{exercise.focus}</p>
                    <span className="camera-view">推荐：{exercise.view}</span>
                    {exercise.code === "SQ" ? (
                      <button
                        type="button"
                        className="exercise-start-button"
                        onClick={() => setActiveExercise("squat")}
                      >
                        开始深蹲训练 <span aria-hidden="true">→</span>
                      </button>
                    ) : exercise.code === "PU" ? (
                      <button
                        type="button"
                        className="exercise-start-button"
                        onClick={() => setActiveExercise("pushup")}
                      >
                        开始俯卧撑训练 <span aria-hidden="true">→</span>
                      </button>
                    ) : (
                      <span className="exercise-unavailable">
                        训练切片开发中
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>

      <footer>
        <p>基于人体姿态估计的健身动作规范检测系统</p>
        <p>课程项目 · 2026</p>
      </footer>
    </div>
  );
}

export default App;
