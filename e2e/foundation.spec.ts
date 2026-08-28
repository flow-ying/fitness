import { expect, test } from "@playwright/test";

test("shows the approved first-release scope", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "让每一次动作，都有清晰反馈",
    }),
  ).toBeVisible();
  const exerciseItems = page
    .getByRole("list", { name: "首版支持动作" })
    .getByRole("listitem");

  await expect(exerciseItems).toHaveCount(3);
  await expect(exerciseItems.nth(0)).toContainText("深蹲");
  await expect(exerciseItems.nth(1)).toContainText("俯卧撑");
  await expect(exerciseItems.nth(2)).toContainText("哑铃弯举");
  expect(consoleErrors).toEqual([]);
});

test("keeps primary navigation keyboard accessible", async ({ page }) => {
  await page.goto("/");
  await page.locator("body").click({ position: { x: 1, y: 1 } });

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "姿态工坊首页" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "工作方式" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "首版动作", exact: true }),
  ).toBeFocused();
});

test("exposes honest auth and history states without cloud configuration", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "登录" }).click();
  await expect(
    page.getByRole("heading", { name: "登录后保存训练历史" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "邮箱" })).toBeVisible();
  const authStatuses = page.getByRole("status");
  if ((await authStatuses.count()) > 0) {
    await expect(authStatuses).toContainText(/尚未配置 Supabase|登录成功/);
  }

  await page.getByRole("button", { name: "返回" }).click();
  await page.getByRole("button", { name: "训练历史" }).click();
  await expect(page.getByRole("heading", { name: "训练历史" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    /历史记录暂不可用|请先登录/,
  );
});
