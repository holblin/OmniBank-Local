import { test, expect } from "@playwright/test";
import { seed } from "./seed.ts";

let accounts: import("../src/lib/server/models").Account[];
test.beforeAll(async ({ request }) => {
  accounts = await seed(request);
});

test("dashboard uses real local totals and no external runtime requests", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (req) => {
    if (!req.url().startsWith("http://127.0.0.1:8436/"))
      external.push(req.url());
  });
  const stats = await (await request.get("/api/stats/dashboard")).json();
  await page.goto("/v2");
  await expect(
    page.getByRole("heading", { name: "Tableau de bord", exact: true }),
  ).toBeVisible();
  const currency = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
  await expect(
    page.getByRole("article").filter({ hasText: "Patrimoine net" }),
  ).toContainText(currency.format(stats.net_worth));
  await expect(
    page.getByRole("img", { name: "Évolution quotidienne du solde du compte" }),
  ).toBeVisible();
  await expect(page.getByRole("table").first()).toContainText(
    "Courses du marché",
  );
  await expect(
    page.getByText("Assurance habitation à venir", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "90 jours", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "90 jours", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByText("Voir les données", { exact: true }).click();
  const chartTable = page.getByRole("table").first();
  await expect(chartTable).toHaveAttribute("aria-rowcount", "91");
  expect(await chartTable.locator("tbody [data-index]").count()).toBeLessThan(
    90,
  );
  await page.getByText("Voir les données", { exact: true }).click();
  await page
    .getByRole("combobox", { name: "Sélectionner un compte" })
    .selectOption(String(accounts[1].id));
  await expect(page.getByRole("table").last()).toContainText(
    "Virement épargne",
  );
  await expect(page.getByRole("table").last()).not.toContainText(
    "Courses du marché",
  );
  await page.getByRole("button", { name: "Actualiser", exact: true }).click();
  await expect(page.getByRole("table").last()).toContainText(
    "Virement épargne",
  );
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("French/English preference survives navigation and reload", async ({
  page,
}) => {
  await page.goto("/v2");
  await page
    .getByRole("button", { name: "Switch to English", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(page).toHaveURL(/\/v2\/history/);
  await expect(
    page.getByRole("heading", { name: "History", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Classic interface", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\?view=all_operations/);
  await expect(
    page.locator('button[data-view="all_operations"]').first(),
  ).toHaveClass(/active/);
  await page.locator(".ui-v2-switch").click();
  await expect(
    page.getByRole("heading", { name: "History", exact: true }),
  ).toBeVisible();
});

test("new transaction opens the V2 form", async ({ page }) => {
  await page.goto("/v2");
  await page
    .getByRole("link", { name: "Nouvelle opération", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/v2\/history\?new=1/);
  await expect(
    page.getByRole("textbox", { name: "Libellé", exact: true }),
  ).toBeVisible();
});

test("mobile sidebar, controls and content fit 390px and 320px", async ({
  page,
}) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/v2");
    await expect(
      page.getByRole("heading", { name: "Dernières opérations" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const tableBox = (await page.getByRole("table").last().boundingBox())!;
    const mainBox = (await page.locator("main").boundingBox())!;
    expect(tableBox.x + tableBox.width).toBeLessThanOrEqual(
      mainBox.x + mainBox.width,
    );
    await page
      .getByRole("button", { name: "Ouvrir le menu", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Historique", exact: true }),
    ).toBeInViewport();
    await page
      .getByRole("button", { name: "Fermer le menu", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: "Ouvrir le menu", exact: true }),
    ).toBeVisible();
  }
});

test("empty data shows useful actions without invented totals", async ({
  page,
  request,
}) => {
  const stats = await (await request.get("/api/stats/dashboard")).json();
  await page.route("**/api/stats/accounts", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/stats/dashboard", (route) =>
    route.fulfill({
      json: {
        ...stats,
        main_account_id: null,
        net_worth: 0,
        rest_to_live: 0,
        unreconciled_expenses: 0,
        next_pay_amount: 0,
        savings_summary: { balance: 0 },
      },
    }),
  );
  await page.route("**/api/budgets/status", (route) =>
    route.fulfill({ json: { budgets: [] } }),
  );
  await page.route("**/api/transactions/**", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.goto("/v2");
  await expect(
    page.getByRole("heading", { name: "Dernières opérations" }),
  ).toBeVisible();
  await expect(
    page.getByText("Aucune opération pour le moment", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Aucune paie prévue", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ajouter un compte", exact: true }),
  ).toBeVisible();
});

test("failed API load can recover and route fallback links to dashboard", async ({
  page,
}) => {
  await page.route("**/api/stats/dashboard", (route) =>
    route.fulfill({ status: 503, json: { detail: "Indisponible" } }),
  );
  await page.goto("/v2");
  await expect(
    page.getByRole("heading", { name: "Vos données sont indisponibles" }),
  ).toBeVisible();
  await page.unroute("**/api/stats/dashboard");
  await page.getByRole("button", { name: "Réessayer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dernières opérations" }),
  ).toBeVisible();
  await page.goto("/v2/unknown");
  await expect(
    page.getByRole("heading", { name: "Page introuvable" }),
  ).toBeVisible();
  await page
    .locator("main")
    .getByRole("link", { name: "Tableau de bord", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dernières opérations" }),
  ).toBeVisible();
});

test("locked profile opens V2 access screen before loading financial data", async ({
  page,
  request,
}) => {
  const profile = await (await request.get("/api/profiles/active")).json();
  const financeRequests: string[] = [];
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
  page.on("request", (req) => {
    if (req.url().includes("/api/stats/dashboard"))
      financeRequests.push(req.url());
  });
  await page.goto("/v2");
  await expect(page).toHaveURL(/\/v2\/unlock/);
  expect(financeRequests).toEqual([]);
});

test("theme selection changes Astryx and dashboard colors and survives reload", async ({
  page,
}) => {
  await page.goto("/v2");
  await expect(
    page.getByRole("heading", { name: "Dernières opérations" }),
  ).toBeVisible();
  const themes = page.getByRole("combobox", { name: "Thème", exact: true });
  await expect(themes).toHaveValue("matcha");
  await expect(page.locator("html")).toHaveAttribute(
    "data-astryx-theme",
    "matcha",
  );
  const matchaCanvas = await page
    .locator("html")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await themes.selectOption("neutral");
  await expect(page.locator("html")).toHaveAttribute(
    "data-astryx-theme",
    "neutral",
  );
  expect(
    await page
      .locator("html")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe(matchaCanvas);
  await page.reload();
  await expect(themes).toHaveValue("neutral");
  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(
    page.getByRole("combobox", { name: "Theme", exact: true }),
  ).toHaveValue("neutral");
  await page
    .getByRole("combobox", { name: "Theme", exact: true })
    .selectOption("matcha");
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(
    page.getByRole("combobox", { name: "Theme", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});

test("all six themes support compact layouts with independent saved preferences", async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (req) => {
    if (!req.url().startsWith("http://127.0.0.1:8436/"))
      external.push(req.url());
  });
  await page.goto("/v2");
  await expect(
    page.getByRole("heading", { name: "Dernières opérations" }),
  ).toBeVisible();
  const selector = page.getByRole("combobox", { name: "Thème", exact: true });
  const compact = page.getByRole("button", { name: "Compact", exact: true });
  const metric = page.getByRole("article").first();
  for (const theme of [
    "neutral",
    "stone",
    "gothic",
    "matcha",
    "y2k",
    "butter",
  ]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await selector.selectOption(theme);
    await expect(page.locator("html")).toHaveAttribute(
      "data-astryx-theme",
      theme,
    );
    await expect(compact).toHaveAttribute("aria-pressed", "false");
    const sidebarBox = (await page.getByRole("complementary").boundingBox())!;
    const mainBox = (await page.locator("main").boundingBox())!;
    expect(mainBox.x).toBeGreaterThanOrEqual(sidebarBox.x + sidebarBox.width);
    expect(mainBox.width).toBeGreaterThan(900);
    const roomyHeight = (await metric.boundingBox())!.height;
    await compact.click();
    await expect(compact).toHaveAttribute("aria-pressed", "true");
    expect((await metric.boundingBox())!.height).toBeLessThan(roomyHeight);
    await expect(
      page.getByRole("img", {
        name: "Évolution quotidienne du solde du compte",
      }),
    ).toBeVisible();
    await page.setViewportSize({ width: 320, height: 844 });
    await expect(compact).toBeVisible();
    expect((await page.locator("main").boundingBox())!.width).toBe(320);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
  }
  await page.reload();
  await expect(selector).toHaveValue("butter");
  await expect(compact).toHaveAttribute("aria-pressed", "true");
  await compact.click();
  await selector.selectOption("gothic");
  await expect(compact).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await selector.selectOption("butter");
  await expect(compact).toHaveAttribute("aria-pressed", "false");
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
