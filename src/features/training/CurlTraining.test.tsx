import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CurlTraining } from "./CurlTraining";

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

describe("CurlTraining", () => {
  it("shows setup, live summary and provisional threshold notice", () => {
    render(<CurlTraining />);

    expect(
      screen.getByRole("heading", { level: 2, name: "哑铃弯举实时训练" }),
    ).toBeInTheDocument();
    expect(screen.getByText("手臂伸展")).toBeInTheDocument();
    expect(screen.getAllByText("0 次")).toHaveLength(2);
    expect(screen.getByText(/仍需用自采样例校准/)).toBeInTheDocument();
  });

  it("lets the user reset the current summary", async () => {
    const user = userEvent.setup();
    render(<CurlTraining />);

    await user.click(screen.getByRole("button", { name: "重置本次统计" }));

    expect(
      screen.getByRole("status", { name: "哑铃弯举分析状态" }),
    ).toHaveTextContent("等待摄像头画面");
  });
});
