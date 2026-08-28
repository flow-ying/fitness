import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HistoryPage } from "./HistoryPage";
import { AuthProvider } from "../auth/AuthContext";

vi.mock("../../services/history", () => ({
  listWorkoutResults: vi.fn().mockResolvedValue([
    {
      id: "result-1",
      user_id: "user-1",
      exercise_type: "squat",
      started_at: "2026-08-28T10:00:00.000Z",
      ended_at: "2026-08-28T10:01:00.000Z",
      duration_seconds: 60,
      total_reps: 10,
      correct_reps: 9,
      form_score: 90,
      issue_counts: { insufficient_depth: 1 },
      average_fps: 24,
      created_at: "2026-08-28T10:01:00.000Z",
    },
  ]),
}));

describe("HistoryPage", () => {
  it("shows a clear state when the cloud service is not configured", () => {
    render(
      <AuthProvider client={null}>
        <HistoryPage />
      </AuthProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "训练历史" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("历史记录暂不可用");
  });

  it("loads the current user's rows and opens a session detail", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user-1", email: "a@example.com" } } },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    };

    render(
      <AuthProvider client={{ auth } as never}>
        <HistoryPage />
      </AuthProvider>,
    );

    await screen.findByRole("button", { name: /^深蹲/ });
    expect(screen.getByText("训练次数")).toBeInTheDocument();
    await screen.getByRole("button", { name: /^深蹲/ }).click();
    expect(screen.getByRole("heading", { name: /深蹲 ·/ })).toBeInTheDocument();
  });
});
