import { test, expect } from "@playwright/test";
import { seed } from "./seed.mjs";
test.beforeAll(async ({ request }) => {
  await seed(request);
});

test("short and empty history results fill the table and keep the footer at the viewport bottom", async ({
  page,
  request,
}) => {
  const rows = await (await request.get("/api/transactions/?limit=1")).json();
  let empty = false;
  await page.route("**/api/transactions/?*", (route) =>
    route.fulfill({ json: empty ? [] : rows }),
  );
  await page.goto("/v2/history");
  await expect(page.getByRole("table")).toBeVisible();
  for (const [width, height] of [
    [1279, 1111],
    [1583, 1111],
    [1279, 1400],
  ]) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(async () => {
        const footer = await page
          .locator("footer[data-app-footer]")
          .boundingBox();
        return Math.abs(footer.y + footer.height - height);
      })
      .toBeLessThan(3);
    const region = page.getByRole("region", {
      name: "Historique",
      exact: true,
    });
    const table = page.getByRole("table");
    await expect
      .poll(
        async () =>
          (await region.boundingBox()).height -
          (await table.boundingBox()).height,
      )
      .toBeGreaterThan(200);
  }
  empty = true;
  await page.getByRole("button", { name: "Actualiser", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Historique", exact: true }),
  ).toContainText("Aucune opération");
  await expect(page.locator("tbody tr[data-index]")).toHaveCount(0);
  const footer = await page.locator("footer[data-app-footer]").boundingBox();
  expect(Math.abs(footer.y + footer.height - 1400)).toBeLessThan(3);
});

test("summary shading follows relative amounts, keeps zero neutral and can be disabled across themes", async ({
  page,
}) => {
  const months = ["2026-01", "2026-02", "2026-03"];
  const group = {
    categories: {
      "Catégorie test": { "2026-01": 0, "2026-02": 10, "2026-03": 100 },
    },
    totals_per_cat: { "Catégorie test": 110 },
    totals_per_month: { "2026-01": 0, "2026-02": 10, "2026-03": 100 },
    grand_total: 110,
  };
  await page.route("**/api/stats/categories_by_month?*", (route) =>
    route.fulfill({
      json: { months, by_type: { income: group, expense_var: group } },
    }),
  );
  await page.goto("/v2/summary");
  const table = page.getByRole("table", { name: /Dépenses variables ·/ });
  await expect(table).toBeVisible();
  const colors = () =>
    table
      .locator("tbody tr")
      .first()
      .locator("td")
      .evaluateAll((cells) =>
        cells.slice(0, 3).map((cell) => getComputedStyle(cell).backgroundColor),
      );
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
    const [zero, small, peak] = await colors();
    expect(new Set([zero, small, peak]).size).toBe(3);
  }
  await page.getByRole("slider", { name: "Intensité des couleurs" }).fill("0");
  const disabled = await colors();
  expect(disabled[1]).toBe(disabled[2]);
  await expect(table).toContainText("100,00");
});

test("migrated navigation stays in V2 and short pages anchor the footer", async ({
  page,
}) => {
  await page.goto("/v2/budgets");
  for (const [name,path] of [
    ['Comptes','accounts'],
    ['Récurrences','recurrences'],
    ['Assistant IA','assistant'],
    ['Paramètres','settings'],
  ]) {
    const link = page.locator('aside').getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute('href',`/v2/${path}`);
  }
  await expect(
    page.getByRole("link", { name: "Budgets", exact: true }),
  ).toHaveAttribute("href", "/v2/budgets");
  await page.setViewportSize({ width: 1279, height: 1400 });
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect
    .poll(async () => {
      const box = await page.locator("footer[data-app-footer]").boundingBox();
      return Math.abs(box.y + box.height - 1400);
    })
    .toBeLessThan(3);
});
