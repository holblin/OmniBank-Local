import { test, expect } from "@playwright/test";
import { seed } from "./seed.mjs";

test.beforeAll(async ({ request }) => {
  await seed(request);
});

test("refresh cannot bypass the session guard while the profile is loading", async ({
  page,
  request,
}) => {
  const profile = await (await request.get("/api/profiles/active")).json();
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/api/profiles/active", async (route) => {
    await held;
    await route.fulfill({ json: { ...profile, has_pin: true } });
  });
  await page.route("**/?view=dashboard", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Interface classique</h1>",
    }),
  );
  await page.addInitScript(() =>
    sessionStorage.setItem("omni_is_locked", "true"),
  );
  const finance = [];
  page.on("request", (req) => {
    if (/\/api\/(accounts|budgets|transactions|stats)\//.test(req.url()))
      finance.push(req.url());
  });
  await page.goto("/v2/history");
  await page.getByRole("button", { name: "Actualiser", exact: true }).click();
  release();
  await expect(page).toHaveURL(/\?view=dashboard/);
  expect(finance).toEqual([]);
});

test("all six compact themes keep the editor inside a 320px viewport without title overlap", async ({
  page,
}) => {
  await page.goto("/v2/history");
  await expect(page.getByRole("table")).toBeVisible();
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
    const compact = page.getByRole("button", { name: "Compact", exact: true });
    if ((await compact.getAttribute("aria-pressed")) === "false")
      await compact.click();
    await page.setViewportSize({ width: 320, height: 844 });
    await page
      .getByRole("button", { name: "Nouvelle opération", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    expect(box.y + box.height).toBeLessThanOrEqual(844);
    const title = await dialog.getByRole("heading").boundingBox();
    const first = await dialog
      .getByRole("textbox", { name: "Libellé", exact: true })
      .boundingBox();
    expect(first.y).toBeGreaterThan(title.y + title.height);
    await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
});

test("cached navigation deduplicates shared lists; failed background refresh retains records", async ({
  page,
}) => {
  let accountReads = 0;
  let budgetReads = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/accounts/") accountReads++;
    if (new URL(request.url()).pathname === "/api/budgets/") budgetReads++;
  });
  await page.goto("/v2/history");
  await expect(page.getByRole("table")).toContainText("Courses du marché");
  await page.getByRole("link", { name: "Budgets", exact: true }).click();
  await expect(page.getByRole("article").first()).toBeVisible();
  await page.getByRole("link", { name: "Historique", exact: true }).click();
  await expect(page.getByRole("table")).toContainText("Courses du marché");
  expect(accountReads).toBe(1);
  expect(budgetReads).toBe(1);
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/api/transactions/?*", async (route) => {
    await held;
    await route.fulfill({ status: 503, body: "{}" });
  });
  await page.getByRole("button", { name: "Actualiser", exact: true }).click();
  await expect(page.locator('p[role="status"]')).toContainText(
    "Actualisation en cours",
  );
  await expect(page.getByRole("table")).toContainText("Courses du marché");
  release();
  await expect(page.getByRole("alert")).toContainText("dernières données");
  await expect(page.getByRole("table")).toContainText("Courses du marché");
  await page.unroute("**/api/transactions/?*");
  await page.getByRole("button", { name: "Actualiser", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("optimistic reconciliation rolls back a failed write and invalidates only relevant domains", async ({
  page,
  request,
}) => {
  const accounts = await (await request.get("/api/accounts/")).json();
  const tx = {
    id: 70001,
    description: "Rapprochement optimiste",
    amount: 12.34,
    date_operation: "2026-01-01",
    type: "expense_var",
    from_account_id: accounts[0].id,
    reconciliation_date: null,
  };
  await page.route("**/api/transactions/?*", (route) =>
    route.fulfill({ json: [tx] }),
  );
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/api/transactions/70001", async (route) => {
    await held;
    await route.fulfill({ status: 503, body: "{}" });
  });
  await page.goto("/v2/history");
  const row = page.getByRole("row").filter({ hasText: tx.description });
  await expect(row).toContainText("À rapprocher");
  let sessionReads = 0,
    listReads = 0;
  page.on("request", (req) => {
    if (/\/api\/(profiles|config)\//.test(req.url())) sessionReads++;
    if (req.url().includes("/api/transactions/?")) listReads++;
  });
  await row.getByRole("button", { name: "Rapprocher", exact: true }).click();
  await expect(row).toContainText("Rapproché");
  release();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(row).toContainText("À rapprocher");
  expect(sessionReads).toBe(0);
  expect(listReads).toBe(1);
});

test("edit dialog preserves layout, supports tooltips and duplication creates a separate record", async ({
  page,
  request,
}) => {
  await page.goto("/v2/history");
  const row = page
    .getByRole("row")
    .filter({ hasText: "Courses du marché" })
    .first();
  const edit = row.getByRole("button", { name: "Modifier", exact: true });
  await edit.hover();
  await expect(page.getByRole("tooltip")).toContainText("Modifier");
  const before = await page.getByRole("table").boundingBox();
  await edit.click();
  const dialog = page.getByRole("dialog", { name: "Modifier l’opération" });
  await expect(dialog).toBeVisible();
  // Modal semantics hide the underlying table from accessibility queries.
  const after = await page.locator("table").boundingBox();
  expect(after.y).toBe(before.y);
  expect(after.height).toBe(before.height);
  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(edit).toBeFocused();
  await row.getByRole("button", { name: "Dupliquer", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName(
    "Nouvelle opération",
  );
  await page
    .getByRole("textbox", { name: "Libellé", exact: true })
    .fill("Copie indépendante V2");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const saved = await (
    await request.get("/api/transactions/?search=Copie%20indépendante%20V2")
  ).json();
  expect(saved).toHaveLength(1);
  expect(saved[0].reconciliation_date).toBeNull();
  await request.delete(`/api/transactions/${saved[0].id}`);
});

test("delete confirmation cancels without a write and stays open on server failure", async ({
  page,
}) => {
  await page.goto("/v2/history");
  const row = page
    .getByRole("row")
    .filter({ hasText: "Courses du marché" })
    .first();
  let deletes = 0;
  await page.route("**/api/transactions/*", (route) => {
    if (route.request().method() === "DELETE") {
      deletes++;
      return route.fulfill({ status: 503, body: "{}" });
    }
    return route.continue();
  });
  await row.getByRole("button", { name: "Supprimer", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByRole("button", { name: "Annuler", exact: true }),
  ).toBeFocused();
  await dialog.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(deletes).toBe(0);
  await row.getByRole("button", { name: "Supprimer", exact: true }).click();
  await dialog.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("enregistrées");
  expect(deletes).toBe(1);
  await dialog.getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(row).toBeVisible();
});
