import { describe, expect, it } from "vitest";
import { readSupabaseConfig } from "./supabase";

describe("readSupabaseConfig", () => {
  it("returns null when the environment still contains placeholders", () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: "https://your-project.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "your-publishable-key",
      }),
    ).toBeNull();
  });

  it("accepts an HTTPS project URL and publishable key", () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: "https://fitness.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toEqual({
      url: "https://fitness.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it("rejects insecure or malformed URLs", () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: "http://fitness.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toBeNull();
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: "not-a-url",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toBeNull();
  });
});
