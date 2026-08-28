import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SquatTraining } from "./SquatTraining";

vi.mock("./CameraView", () => ({
  CameraView: ({
    title,
    feedback,
  }: {
    title: string;
    feedback: React.ReactNode;
  }) => (
    <section>
      <h2>{title}</h2>
      {feedback}
    </section>
  ),
}));

describe("SquatTraining", () => {
  it("shows the squat setup, live summary and provisional threshold notice", () => {
    render(<SquatTraining />);

    expect(
      screen.getByRole("heading", { level: 2, name: "深蹲实时训练" }),
    ).toBeInTheDocument();
    expect(screen.getByText("站立准备")).toBeInTheDocument();
    expect(screen.getAllByText("0 次")).toHaveLength(2);
    expect(screen.getByText(/仍需用自采样例校准/)).toBeInTheDocument();
  });

  it("lets the user reset the current summary", async () => {
    const user = userEvent.setup();
    render(<SquatTraining />);

    await user.click(screen.getByRole("button", { name: "重置本次统计" }));

    expect(
      screen.getByRole("status", { name: "深蹲分析状态" }),
    ).toHaveTextContent("等待摄像头画面");
  });
});
