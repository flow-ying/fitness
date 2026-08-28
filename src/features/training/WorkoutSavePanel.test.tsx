import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createExerciseState } from "../../exercises/stateMachine";
import { AuthProvider } from "../auth/AuthContext";
import { WorkoutSavePanel } from "./WorkoutSavePanel";
import { saveWorkoutResult } from "../../services/history";

vi.mock("../../services/history", () => ({
  saveWorkoutResult: vi.fn(),
}));

describe("WorkoutSavePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the current session user when saving a completed result", async () => {
    const auth = {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: "user-1", email: "a@example.com" },
          },
        },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    };
    const client = { auth } as never;
    vi.mocked(saveWorkoutResult).mockResolvedValue({} as never);
    const exercise = {
      ...createExerciseState("squat"),
      totalReps: 1,
      correctReps: 1,
    };
    const user = userEvent.setup();

    render(
      <AuthProvider client={client}>
        <WorkoutSavePanel
          exerciseType="squat"
          exercise={exercise}
          startedAt="2026-08-28T10:00:00.000Z"
          averageFps={24}
        />
      </AuthProvider>,
    );

    await waitFor(() => expect(auth.getSession).toHaveBeenCalledOnce());
    await user.click(screen.getByRole("button", { name: "保存训练结果" }));

    await waitFor(() => expect(saveWorkoutResult).toHaveBeenCalledOnce());
    expect(vi.mocked(saveWorkoutResult).mock.calls[0]?.[1]).toBe("user-1");
    expect(screen.getByRole("status")).toHaveTextContent("训练结果已保存");
  });

  it("does not claim a save when no user is available", async () => {
    const user = userEvent.setup();
    render(
      <WorkoutSavePanel
        exerciseType="curl"
        exercise={{ ...createExerciseState("curl"), totalReps: 1 }}
        startedAt="2026-08-28T10:00:00.000Z"
        averageFps={24}
      />,
    );

    await user.click(screen.getByRole("button", { name: "保存训练结果" }));

    expect(screen.getByRole("status")).toHaveTextContent("请先登录");
    expect(saveWorkoutResult).not.toHaveBeenCalled();
  });
});
