export type WorkoutResultRow = {
  id: string;
  user_id: string;
  exercise_type: "squat" | "pushup" | "curl";
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  total_reps: number;
  correct_reps: number;
  form_score: number;
  issue_counts: Record<string, number>;
  average_fps: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      workout_results: {
        Row: WorkoutResultRow;
        Insert: Omit<WorkoutResultRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Omit<WorkoutResultRow, "id" | "user_id" | "created_at">
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
