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

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "姿态工坊首页" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "工作方式" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "首版动作", exact: true }),
  ).toBeFocused();
});
