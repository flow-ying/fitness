import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

export type WorkoutExercise = "squat" | "pushup" | "curl";

export type WorkoutResultInput = {
  exerciseType: WorkoutExercise;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  totalReps: number;
  correctReps: number;
  formScore: number;
  issueCounts: Record<string, number>;
  averageFps: number;
};

export function readSupabaseConfig(
  env: Record<string, string | undefined> = import.meta.env,
): SupabaseConfig | null {
  const url = env.VITE_SUPABASE_URL?.trim();
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey || publishableKey === "your-publishable-key") {
    return null;
  }
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:") return null;
  } catch {
    return null;
  }
  return { url, publishableKey };
}

export function createSupabaseBrowserClient(
  config = readSupabaseConfig(),
): SupabaseClient<Database> | null {
  return config ? createClient(config.url, config.publishableKey) : null;
}
