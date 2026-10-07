import { test, expect } from "@playwright/test";
import { seed } from "./seed.ts";

test.beforeAll(async ({ request }) => { await seed(request); });
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1517, height: 1153 });
  await page.addInitScript(() => {
    localStorage.setItem("omni_v2_theme", "matcha");
    localStorage.setItem("omni_v2_compact_themes", '{"matcha":true}');
  });
  await page.goto("/v2/accounts");
  await expect(page.getByRole("table")).toBeVisible();
});

test("account editor separates its title, form labels and footer", async ({ page }) => {
  await page.getByRole("button", { name: "Modifier", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  const title = (await dialog.getByRole("heading").boundingBox())!;
  const label = (await dialog.locator("label").filter({ hasText: /^Nom$/ }).boundingBox())!;
  const form = (await dialog.locator("form").boundingBox())!;
  const footer = (await dialog.locator(".astryx-layout-footer").boundingBox())!;
  expect.soft(label.y - title.y - title.height, "space below title").toBeGreaterThanOrEqual(12);
  expect.soft(footer.y - form.y - form.height, "space above footer").toBeGreaterThanOrEqual(12);
});

test("account closed checkbox sits beside its label at the form's left edge", async ({ page }) => {
  await page.getByRole("button", { name: "Modifier", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  const checkbox = (await dialog.getByRole("checkbox", { name: "Clôturé", exact: true }).boundingBox())!;
  const label = (await dialog.getByText("Clôturé", { exact: true }).boundingBox())!;
  const form = (await dialog.locator("form").boundingBox())!;
  expect.soft(Math.abs(checkbox.y + checkbox.height / 2 - label.y - label.height / 2), "control and label share a row").toBeLessThanOrEqual(4);
  expect.soft(Math.abs(checkbox.x - form.x), "control aligns with fields").toBeLessThanOrEqual(4);
});

test("account import and bank links have visible icons and discoverable tooltips", async ({ page }) => {
  const row = page.getByRole("row").filter({ hasText: "Compte courant" }).first();
  for (const name of ["Importer et exporter", "Synchronisation bancaire"]) {
    const link = row.getByRole("link", { name, exact: true });
    await expect.soft(link.locator("svg")).toBeVisible();
    await link.hover();
    await expect.soft(page.getByRole("tooltip")).toContainText(name, { timeout: 1500 });
  }
  await expect(row.getByRole("link", { name: "Importer et exporter", exact: true })).toHaveAttribute("href", /\/v2\/imports\?account=\d+$/);
  await expect(row.getByRole("link", { name: "Synchronisation bancaire", exact: true })).toHaveAttribute("href", "/v2/bank-sync");
});

test("closed checkbox retains its initial value and saves both boolean states", async ({ page, request }) => {
  const created = await request.post("/api/accounts/", { data: {
    name: "Compte de contrôle", type: "Courant", currency: "EUR", initial_balance: 0, is_closed: true,
  } });
  expect(created.ok()).toBe(true);
  const account: { id: number } = await created.json();
  try {
    await page.reload();
    const row = page.getByRole("row").filter({ hasText: "Compte de contrôle" });
    for (const closed of [false, true]) {
      await row.getByRole("button", { name: "Modifier", exact: true }).click();
      const dialog = page.getByRole("dialog");
      const checkbox = dialog.getByRole("checkbox", { name: "Clôturé", exact: true });
      await expect(checkbox).toBeChecked({ checked: !closed });
      await checkbox.setChecked(closed);
      await dialog.getByRole("button", { name: "Enregistrer", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      const saved: { id: number; is_closed: boolean }[] = await (await request.get("/api/accounts/")).json();
      expect(saved.find((item) => item.id === account.id)?.is_closed).toBe(closed);
    }
  } finally { await request.delete(`/api/accounts/${account.id}`); }
});
