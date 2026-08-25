import type { ExerciseType } from "./types";

export type ExerciseConfig = {
  type: ExerciseType;
  name: string;
  recommendedView: string;
  focus: string[];
};

export const exerciseCatalog: readonly ExerciseConfig[] = [
  {
    type: "squat",
    name: "深蹲",
    recommendedView: "身体侧面，全身入镜",
    focus: ["下蹲深度", "躯干角度", "完整站起"],
  },
  {
    type: "pushup",
    name: "俯卧撑",
    recommendedView: "身体侧面，全身入镜",
    focus: ["肘部幅度", "身体直线", "顶部伸展"],
  },
  {
    type: "curl",
    name: "哑铃弯举",
    recommendedView: "侧面或斜前方，上半身入镜",
    focus: ["弯举幅度", "上臂稳定", "身体摆动"],
  },
];

export function getExerciseConfig(type: ExerciseType): ExerciseConfig {
  const config = exerciseCatalog.find((item) => item.type === type);
  if (!config) throw new Error(`未知动作类型: ${type}`);
  return config;
}
