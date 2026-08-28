import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AuthPanel } from "./AuthPanel";
import { AuthProvider } from "./AuthContext";

function renderPanel() {
  return render(
    <AuthProvider client={null}>
      <AuthPanel />
    </AuthProvider>,
  );
}

describe("AuthPanel", () => {
  it("explains when cloud authentication is not configured", () => {
    renderPanel();

    expect(
      screen.getByRole("heading", { name: "登录后保存训练历史" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("尚未配置 Supabase");
    expect(screen.getByRole("button", { name: "登录" })).toBeDisabled();
  });

  it("switches between login and registration modes", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "还没有账号？注册" }));

    expect(screen.getByRole("button", { name: "注册" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "已有账号？返回登录" }),
    ).toBeInTheDocument();
  });
});
