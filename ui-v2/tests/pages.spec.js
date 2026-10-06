import { test, expect } from "@playwright/test";
import { seed } from "./seed.mjs";
let accounts;
test.beforeAll(async ({ request }) => {
  const seeded = await seed(request);
  accounts = {
    current: seeded.find((a) => a.name === "Compte courant"),
    savings: seeded.find((a) => a.name === "Livret A"),
  };
});

test("budget creation, amount editing, archive and savings funding use local APIs", async ({
  page,
  request,
}) => {
  await page.goto("/v2/budgets");
  await expect(
    page.getByRole("heading", { name: "Budgets", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Nouvelle enveloppe", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Nom", exact: true })
    .fill("Enveloppe V2 test");
  await page
    .getByRole("spinbutton", { name: "Montant prévu / objectif" })
    .fill("123.45");
  await page
    .getByRole("textbox", { name: "Catégories (séparées par des virgules)" })
    .fill("Transport");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  let card = page.getByRole("article").filter({ hasText: "Enveloppe V2 test" });
  await expect(card).toContainText("123,45");
  await card.getByRole("button", { name: "Modifier", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "Montant prévu / objectif" })
    .fill("234.56");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(card).toContainText("234,56");
  await card.getByRole("button", { name: "Détails", exact: true }).click();
  await expect(
    page.getByRole("table", { name: "Opérations associées" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await card.getByRole("button", { name: "Archiver", exact: true }).click();
  await expect(card).toHaveCount(0);
  await page.getByRole("combobox", { name: "Afficher" }).selectOption("closed");
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Réouvrir", exact: true }).click();
  await page.getByRole("combobox", { name: "Afficher" }).selectOption("active");
  await expect(card).toBeVisible();
  page.on("dialog", (dialog) => dialog.accept());
  await card.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(card).toHaveCount(0);
  await page
    .getByRole("button", { name: "Nouvelle enveloppe", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Nom", exact: true })
    .fill("Épargne V2 test");
  await page
    .getByRole("spinbutton", { name: "Montant prévu / objectif" })
    .fill("500");
  await page
    .getByRole("combobox", { name: "Type d’enveloppe" })
    .selectOption("savings");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  card = page.getByRole("article").filter({ hasText: "Épargne V2 test" });
  await card.getByRole("button", { name: "Détails", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "Montant", exact: true })
    .fill("50.25");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(card).toContainText("50,25");
  const budgets = await (await request.get("/api/budgets/")).json();
  const saved = budgets.find((b) => b.name === "Épargne V2 test");
  const allocations = await (
    await request.get(`/api/budgets/${saved.id}/allocations`)
  ).json();
  expect(allocations[0].amount).toBe(50.25);
  await page
    .getByRole("button", { name: "Supprimer l’ajustement", exact: true })
    .click();
  await expect(card.locator("strong").first()).toContainText("0,00");
  await page.getByRole("button", { name: "Annuler", exact: true }).click();
  await request.delete(`/api/budgets/${saved.id}`);
});

test("summary totals match backend, filters update and CSV exports locally", async ({
  page,
  request,
}) => {
  const year = new Date().getFullYear();
  const summary = await (
    await request.get(`/api/stats/categories_by_month?year=${year}`)
  ).json();
  await page.goto("/v2/summary");
  await expect(
    page.getByRole("heading", { name: "Synthèse", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "Recettes et dépenses mensuelles",
      exact: true,
    }),
  ).toBeVisible();
  const expectedIncome = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(summary.by_type.income.grand_total);
  await expect(
    page.getByRole("article").filter({ hasText: "Recettes" }),
  ).toContainText(expectedIncome);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter CSV", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("synthese.csv");
  await page
    .getByRole("combobox", { name: "Statut", exact: true })
    .selectOption("unreconciled");
  await expect(
    page.getByRole("article").filter({ hasText: "Recettes" }),
  ).toContainText("0,00");
  await page
    .getByRole("combobox", { name: "Sélectionner un compte" })
    .selectOption(String(accounts.savings.id));
  await expect(
    page.getByRole("heading", { name: "Synthèse", exact: true }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: "Période personnalisée" }).check();
  await expect(page.getByLabel("Du", { exact: true })).toBeVisible();
});

test("summary print layout hides controls and uses the full page", async ({ page }) => {
  await page.goto("/v2/summary");
  await expect(page.getByRole("table").first()).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("complementary")).toBeHidden();
  await expect(page.getByRole("button", { name: "Exporter CSV", exact: true })).toBeHidden();
  await expect(page.getByRole("combobox", { name: "Année", exact: true })).toBeHidden();
  const box = await page.locator("main").boundingBox();
  expect(box.x).toBe(0);
  expect(box.width).toBe(await page.evaluate(() => innerWidth));
});

test("history filters and pagination then transaction create edit reconcile delete", async ({
  page,
  request,
}) => {
  await page.goto("/v2/history");
  await expect(
    page.getByRole("heading", { name: "Historique", exact: true }),
  ).toBeVisible();
  const count = await page.locator("tbody tr").count();
  expect(count).toBeGreaterThan(6);
  await page
    .getByRole("combobox", { name: "Sélectionner un compte" })
    .selectOption(String(accounts.savings.id));
  await expect(page.getByRole("table")).toContainText("Épargne");
  await page
    .getByRole("combobox", { name: "Sélectionner un compte" })
    .selectOption("");
  await page
    .getByRole("button", { name: "Nouvelle opération", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Libellé", exact: true })
    .fill("Opération V2 test");
  await page
    .getByRole("spinbutton", { name: "Montant", exact: true })
    .fill("12.34");
  await page
    .getByRole("combobox", { name: "Compte source" })
    .selectOption(String(accounts.current.id));
  await page
    .getByRole("textbox", { name: "Catégorie", exact: true })
    .fill("Transport");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  let row = page.getByRole("row").filter({ hasText: "Opération V2 test" });
  await expect(row).toContainText("12,34");
  await row.getByRole("button", { name: "Modifier", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "Montant", exact: true })
    .fill("23.45");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(row).toContainText("23,45");
  await row.getByRole("button", { name: "Rapprocher", exact: true }).click();
  await expect(row).toContainText("Rapproché");
  await page
    .getByRole("searchbox", { name: "Rechercher", exact: true })
    .fill("Opération V2 test");
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  const saved = (
    await (
      await request.get("/api/transactions/?search=Opération%20V2%20test")
    ).json()
  )[0];
  expect(saved.amount).toBe(23.45);
  expect(saved.reconciliation_date).toBeTruthy();
  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(0);
});

test("new routes reload, support compact Gothic on mobile and fail safely", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [path, title] of [
    ["budgets", "Budgets"],
    ["summary", "Synthèse"],
    ["history", "Historique"],
  ]) {
    await page.goto(`/v2/${path}`);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Thème", exact: true })
      .selectOption("gothic");
    const compact = page.getByRole("button", { name: "Compact", exact: true });
    if ((await compact.getAttribute("aria-pressed")) === "false")
      await compact.click();
    await page.setViewportSize({ width: 320, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  expect(errors).toEqual([]);
  await page.route("**/api/budgets/status?*", (route) =>
    route.fulfill({ status: 503, body: "{}" }),
  );
  await page.goto("/v2/budgets");
  await expect(page.getByRole("alert")).toBeVisible();
  await page.unroute("**/api/budgets/status?*");
  await page.getByRole("button", { name: "Réessayer" }).click();
  await expect(page.getByRole("article").first()).toBeVisible();
});

test("history date/type/status filters apply before pagination without skipped rows", async ({
  page,
  request,
}) => {
  const ids = [];
  try {
    for (let i = 0; i < 45; i++) {
      const response = await request.post("/api/transactions/", {
        data: {
          description: `Pagination V2 ${i}`,
          amount: 1.01,
          type: "income",
          date_operation: "2020-02-15",
          to_account_id: accounts.current.id,
          reconciliation_date: i === 44 ? null : "2020-02-16",
        },
      });
      expect(response.ok()).toBeTruthy();
      ids.push((await response.json()).id);
    }
    const query =
      "/api/transactions/?date_start=2020-02-15&date_end=2020-02-15&transaction_type=income&reconciled=reconciled";
    const first = await (await request.get(query + "&limit=40")).json();
    const next = await (await request.get(query + "&skip=40&limit=40")).json();
    expect(
      (await request.get("/api/budgets/999999/transactions")).status(),
    ).toBe(404);
    expect(first).toHaveLength(40);
    expect(next).toHaveLength(4);
    expect(new Set([...first, ...next].map((tx) => tx.id)).size).toBe(44);
    expect(
      await (await request.get(query + "&date_start=2020-02-16")).json(),
    ).toHaveLength(0);
    await page.goto("/v2/history");
    await page
      .getByRole("searchbox", { name: "Rechercher", exact: true })
      .fill("Pagination V2");
    await page.getByRole("button", { name: "Rechercher", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(40);
    await page.getByRole("button", { name: "Suivant", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(5);
    await page
      .getByRole("combobox", { name: "Statut", exact: true })
      .selectOption("unreconciled");
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
  } finally {
    for (const id of ids) await request.delete(`/api/transactions/${id}`);
  }
});

test("new pages return locked profiles before requesting financial data", async ({
  page,
  request,
}) => {
  const profile = await (await request.get("/api/profiles/active")).json();
  await page.route("**/api/profiles/active", (route) =>
    route.fulfill({ json: { ...profile, has_pin: true } }),
  );
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
  for (const path of ["budgets", "summary", "history"]) {
    await page.goto(`/v2/${path}`);
    await expect(page).toHaveURL(/\?view=dashboard/);
  }
  expect(finance).toEqual([]);
});

test("failed transaction save preserves editor and original amount", async ({
  page,
  request,
}) => {
  await page.goto("/v2/history");
  const row = page
    .getByRole("row")
    .filter({ hasText: "Courses du marché" })
    .first();
  await row.getByRole("button", { name: "Modifier", exact: true }).click();
  const original = (
    await (
      await request.get("/api/transactions/?search=Courses%20du%20marché")
    ).json()
  )[0];
  await page
    .getByRole("spinbutton", { name: "Montant", exact: true })
    .fill("99.99");
  await page.route(`**/api/transactions/${original.id}`, (route) =>
    route.request().method() === "PUT"
      ? route.fulfill({ status: 503, body: "{}" })
      : route.continue(),
  );
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("spinbutton", { name: "Montant", exact: true }),
  ).toHaveValue("99.99");
  const unchanged = await (
    await request.get(`/api/transactions/${original.id}`)
  ).json();
  expect(unchanged.amount).toBe(original.amount);
});
