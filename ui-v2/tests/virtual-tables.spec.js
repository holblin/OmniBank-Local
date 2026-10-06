import { test, expect } from "@playwright/test";
import { seed } from "./seed.mjs";

let accounts;
test.beforeAll(async ({ request }) => {
  accounts = await seed(request);
});

async function expectPinnedHeader(region) {
  await expect
    .poll(async () => {
      const viewport = await region.boundingBox();
      const header = await region.locator("thead").boundingBox();
      return Math.abs(header.y - viewport.y);
    })
    .toBeLessThan(2);
  expect(
    await region
      .locator("thead")
      .evaluate((e) => getComputedStyle(e).backgroundColor),
  ).not.toBe("rgba(0, 0, 0, 0)");
}

test("1,000 budget rows stay bounded, scroll to the final row, and print completely", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const rows = Array.from({ length: 1000 }, (_, index) => ({
    id: index + 10000,
    date: "2026-01-01",
    description: `Ligne ${index}${index % 9 === 0 && index < 999 ? " · description longue ".repeat(16) : ""}`,
    amount: index / 100,
  }));
  await page.route("**/api/budgets/*/transactions?*", (route) =>
    route.fulfill({ json: rows }),
  );
  await page.goto("/v2/budgets");
  await page
    .getByRole("article")
    .first()
    .getByRole("button", { name: "Détails", exact: true })
    .click();
  const region = page.getByRole("region", {
    name: "Opérations associées",
    exact: true,
  });
  await expect(region).toHaveAttribute("data-virtualized", "true");
  await expect(region.getByText("Ligne 1", { exact: true })).toBeVisible();
  expect(await region.locator("tr[data-index]").count()).toBeLessThan(35);
  await region.focus();
  await region.press("End");
  await expect(region.getByText("Ligne 999", { exact: true })).toBeVisible();
  await expectPinnedHeader(region);
  expect(await region.locator("tr[data-index]").count()).toBeLessThan(35);
  await region.press("Home");
  await expect(region.getByText("Ligne 1", { exact: true })).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(region.locator("tr[data-index]")).toHaveCount(1000);
  await expect(region).toHaveAttribute("data-virtualized", "false");
  await page.emulateMedia({ media: "screen" });
  await expect(region).toHaveAttribute("data-virtualized", "true");
  expect(await region.locator("tr[data-index]").count()).toBeLessThan(35);
  expect(errors).toEqual([]);
});

test("history headers stay pinned across themes and mobile; focused row actions retain their record", async ({
  page,
}) => {
  const rows = Array.from({ length: 40 }, (_, index) => ({
    id: index + 50000,
    description: `Opération virtuelle ${index}`,
    date_operation: "2026-01-01",
    amount: index + 1,
    type: "expense_var",
    category: "Transport",
    from_account_id: accounts[0].id,
    reconciliation_date: null,
  }));
  await page.route("**/api/transactions/?*", (route) =>
    route.fulfill({ json: rows }),
  );
  await page.goto("/v2/history");
  const region = page.getByRole("region", { name: "Historique", exact: true });
  await expect(region).toHaveAttribute("data-virtualized", "true");
  const firstAction = region
    .locator('tr[data-index="0"]')
    .getByRole("button", { name: "Modifier", exact: true });
  await firstAction.focus();
  await region.evaluate((e) => {
    e.scrollTop = e.scrollHeight;
  });
  await expect(region.locator('tr[data-index="39"]')).toBeVisible();
  await expect(firstAction).toBeFocused();
  for (const theme of [
    "neutral",
    "stone",
    "gothic",
    "matcha",
    "y2k",
    "butter",
  ]) {
    await page
      .getByRole("combobox", { name: "Thème", exact: true })
      .selectOption(theme);
    await page.getByRole("button", { name: "Compact", exact: true }).click();
    await region.focus();
    await region.press("End");
    await expectPinnedHeader(region);
    await page.setViewportSize({ width: 320, height: 844 });
    await region.focus();
    await region.press("End");
    await expectPinnedHeader(region);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await region
    .locator('tr[data-index="39"]')
    .getByRole("button", { name: "Modifier", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Libellé", exact: true }),
  ).toHaveValue("Opération virtuelle 39");
  await expect(
    page.getByRole("spinbutton", { name: "Montant", exact: true }),
  ).toHaveValue("40");
});
