import { render, screen, within } from "@testing-library/react";
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
});
