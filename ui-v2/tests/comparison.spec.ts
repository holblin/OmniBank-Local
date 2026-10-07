import { test, expect } from "@playwright/test";
import { seed } from "./seed.ts";

// Both interfaces use the same temporary backend and synthetic records.
test("capture V1 and V2 side by side with identical financial records", async ({
  page,
  request,
}) => {
  test.setTimeout(120000);
  await seed(request);
  await request.post("/api/config/", {
    data: { enable_overview: "true", enable_simulator: "true" },
  });
  const views = [
    ["overview", "overview", "Vue d’ensemble"],
    ["accounts", "accounts", "Comptes"],
    ["budgets", "budgets", "Budgets"],
    ["history", "all_operations", "Historique"],
    ["trends", "trends", "Tendances"],
    ["simulator", "simulator", "Simulateur"],
  ] as const;
  for (const [v2, v1, title] of views) {
    await page.goto(`/?view=${v1}`);
    await expect(page.locator("#appInitLoader")).toBeHidden();
    await expect(page.locator("#mainContent")).not.toBeEmpty();
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `../screenshots/ui-v2/comparison/${v2}-v1.png`,
      animations: "disabled",
    });
    await page.goto(`/v2/${v2}`);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `../screenshots/ui-v2/comparison/${v2}-v2.png`,
      animations: "disabled",
    });
  }
});
