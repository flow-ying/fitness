import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, WorkoutResultRow } from "./database.types";
import type { WorkoutResultInput } from "./supabase";

type DatabaseClient = SupabaseClient<Database>;

export async function saveWorkoutResult(
  client: DatabaseClient,
  userId: string,
  input: WorkoutResultInput,
): Promise<WorkoutResultRow> {
  const row = {
    user_id: userId,
    exercise_type: input.exerciseType,
    started_at: input.startedAt,
    ended_at: input.endedAt,
    duration_seconds: input.durationSeconds,
    total_reps: input.totalReps,
    correct_reps: input.correctReps,
    form_score: input.formScore,
    issue_counts: input.issueCounts,
    average_fps: input.averageFps,
  };
  const { data, error } = await client
    .from("workout_results")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error("训练记录保存后没有返回数据");
  return data;
}

export async function listWorkoutResults(
  client: DatabaseClient,
): Promise<WorkoutResultRow[]> {
  const { data, error } = await client
    .from("workout_results")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
