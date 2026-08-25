export type ExerciseType = "squat" | "pushup" | "curl";

export type ExercisePhase =
  "ready" | "descending" | "bottom" | "ascending" | "top";

export type FormIssueCode =
  | "insufficient_depth"
  | "excessive_torso_lean"
  | "incomplete_stand"
  | "insufficient_elbow_bend"
  | "body_line_break"
  | "incomplete_extension"
  | "insufficient_curl"
  | "upper_arm_movement"
  | "body_swing";

export type ExerciseAnalysis = {
  phase: ExercisePhase;
  repCompleted: boolean;
  issues: FormIssueCode[];
  confidence: number;
};

export type ExerciseFrameInput = {
  pose: import("../pose/processPose").ProcessedPose;
  previousPhase: ExercisePhase;
};

export type ExerciseRule = (input: ExerciseFrameInput) => ExerciseAnalysis;

export type ExerciseDefinition = {
  type: ExerciseType;
  name: string;
  recommendedView: string;
  rule: ExerciseRule;
};
