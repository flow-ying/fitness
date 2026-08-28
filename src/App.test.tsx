import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App foundation", () => {
  it("introduces the product and the three approved exercises", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "让每一次动作，都有清晰反馈",
      }),
    ).toBeInTheDocument();

    const exerciseList = screen.getByRole("list", {
      name: "首版支持动作",
    });

    expect(within(exerciseList).getAllByRole("listitem")).toHaveLength(3);
    expect(within(exerciseList).getByText("深蹲")).toBeInTheDocument();
    expect(within(exerciseList).getByText("俯卧撑")).toBeInTheDocument();
    expect(within(exerciseList).getByText("哑铃弯举")).toBeInTheDocument();
  });

  it("exposes an honest project status and a keyboard-accessible next step", () => {
    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("工程基线已就绪");
    expect(screen.getByRole("link", { name: "查看首版动作" })).toHaveAttribute(
      "href",
      "#exercises",
    );
  });

  it("opens the camera validation view on demand", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开摄像头验证" }));

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "先确认设备能稳定看见全身",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "开始摄像头验证" }),
    ).toBeInTheDocument();
  });

  it("opens the completed squat training slice from the exercise list", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "开始深蹲训练" }));

    expect(
      screen.getByRole("heading", { level: 2, name: "深蹲实时训练" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "返回动作列表" }),
    ).toBeInTheDocument();
  });

  it("opens the pushup training slice from the exercise list", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "开始俯卧撑训练" }));

    expect(
      screen.getByRole("heading", { level: 2, name: "俯卧撑实时训练" }),
    ).toBeInTheDocument();
  });

  it("opens the curl training slice from the exercise list", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "开始哑铃弯举训练" }));

    expect(
      screen.getByRole("heading", { level: 2, name: "哑铃弯举实时训练" }),
    ).toBeInTheDocument();
  });
});
