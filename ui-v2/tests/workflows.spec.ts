import { test, expect } from "@playwright/test";
import { seed } from "./seed.ts";

test.beforeAll(async ({ request }) => { await seed(request); });

test("dashboard transaction saves in place and refreshes its recent activity", async ({ page, request }) => {
  const description = "Opération workflow UX";
  try {
    await page.goto("/v2");
    await page.getByRole("button", { name: "Nouvelle opération", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Compte source", { exact: true })).not.toHaveValue("");
    await dialog.getByLabel("Libellé", { exact: true }).fill(description);
    await dialog.getByLabel("Montant", { exact: true }).fill("12.34");
    await dialog.getByRole("button", { name: "Enregistrer", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/v2\/?$/);
    await expect(page.getByRole("row").filter({ hasText: description })).toContainText("12,34");
  } finally {
    const rows = await (await request.get("/api/transactions/?limit=100000")).json();
    for (const row of rows.filter((item: { description: string }) => item.description === description))
      await request.delete(`/api/transactions/${row.id}`);
  }
});

test("history preset requests, empty results and filter reset remain explicit", async ({ page }) => {
  const requested: URL[] = [];
  page.on("request", req => { if (req.url().includes("/api/transactions/?")) requested.push(new URL(req.url())); });
  await page.goto("/v2/history");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByLabel("Du", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "À rapprocher", exact: true }).click();
  await expect.poll(() => requested.some(url => url.searchParams.get("reconciled") === "unreconciled")).toBe(true);
  await page.getByRole("button", { name: "Ce mois-ci", exact: true }).click();
  await expect.poll(() => requested.some(url => Boolean(url.searchParams.get("date_start")) && Boolean(url.searchParams.get("date_end")))).toBe(true);
  await page.getByRole("searchbox", { name: "Rechercher", exact: true }).fill("Aucun résultat UX 123456");
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page.getByText("Aucune opération ne correspond", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Effacer les filtres", exact: true }).first().click();
  await expect(page.getByRole("searchbox", { name: "Rechercher", exact: true })).toHaveValue("");
  await expect(page.getByRole("row").nth(1)).toBeVisible();
  await page.getByRole("button", { name: "Colonnes visibles", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Fermer", exact: true })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(page.getByRole("button", { name: "Colonnes visibles", exact: true })).toBeFocused();
});

test("budget month navigation crosses years and returns to this month", async ({ page }) => {
  await page.goto("/v2/budgets");
  const month = page.getByLabel("Mois", { exact: true });
  await month.fill("2026-01");
  await page.getByRole("button", { name: "Mois précédent", exact: true }).click();
  await expect(month).toHaveValue("2025-12");
  await page.getByRole("button", { name: "Mois suivant", exact: true }).click();
  await expect(month).toHaveValue("2026-01");
  await page.getByRole("button", { name: "Ce mois-ci", exact: true }).click();
  const today = new Date();
  await expect(month).toHaveValue(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
});

test("settings focus groups preserve unrelated preferences and section reload", async ({ page, request }) => {
  const before = await (await request.get("/api/config/")).json();
  await page.goto("/v2/settings");
  await page.getByRole("button", { name: "Modifier les préférences", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Jour de paie", { exact: true })).toBeVisible();
  await expect(dialog.getByLabel("Adresse du serveur Ollama", { exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const after = await (await request.get("/api/config/")).json();
  for (const key of ["ollama_url", "ollama_model", "enable_ai", "auto_backup_enabled"])
    expect(after[key]).toEqual(before[key]);
  await page.getByRole("navigation", { name: "Paramètres", exact: true }).getByRole("button", { name: "Sauvegardes", exact: true }).click();
  await expect(page).toHaveURL(/section=backups/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Sauvegardes", exact: true })).toBeVisible();
  const profile = await (await request.get("/api/profiles/active")).json();
  await page.locator("aside").getByRole("link", { name: profile.name, exact: true }).click();
  await expect(page).toHaveURL(/section=profiles/);
  await expect(page.getByRole("heading", { name: "Profils", exact: true }).first()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("navigation", { name: "Paramètres", exact: true })).toBeHidden();
  await expect(page.getByText("Rubriques des paramètres", { exact: true })).toBeVisible();
});

test("mobile navigation contains focus, closes with Escape and reaches secondary destinations", async ({ page }) => {
  const external: string[] = [];
  page.on("request", req => { if (!['127.0.0.1', 'localhost'].includes(new URL(req.url()).hostname)) external.push(req.url()); });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/v2/history");
    const opener = page.getByRole("button", { name: "Ouvrir le menu", exact: true });
    await opener.click();
    const menu = page.getByRole("dialog");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("combobox", { name: "Thème", exact: true })).toBeVisible();
    await menu.getByRole("link", { name: "Importer et exporter", exact: true }).focus();
    await page.keyboard.press("Tab");
    expect(await menu.evaluate(node => node.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(opener).toBeFocused();
    await opener.click();
    await page.getByRole("dialog").getByRole("link", { name: "Importer et exporter", exact: true }).click();
    await expect(page).toHaveURL(/\/v2\/imports$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect((await page.locator("header").first().boundingBox())!.height).toBeLessThan(100);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(external).toEqual([]);
});

test("desktop and mobile workflow screenshots include settings, imports and pinned actions", async ({ page }) => {
  for (const [size, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844]] as const) {
    await page.setViewportSize({ width, height });
    for (const path of ["history", "settings", "imports", "budgets"]) {
      await page.goto(`/v2/${path}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `../screenshots/ui-v2/workflows/${path}-${size}.png`, animations: "disabled" });
    }
    await page.goto("/v2/history");
    await page.getByRole("button", { name: "Nouvelle opération", exact: true }).click();
    const dialog = page.getByRole("dialog");
    for (const action of ["Annuler", "Enregistrer"]) {
      const button = dialog.getByRole("button", { name: action, exact: true });
      await expect(button).toBeInViewport();
      const box = (await button.boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(height);
    }
    await page.screenshot({ path: `../screenshots/ui-v2/workflows/transaction-${size}.png`, animations: "disabled" });
  }
});

test("changing import mode clears the previous file and review state", async ({ page, request }) => {
  const accounts = await (await request.get("/api/accounts/")).json();
  await page.goto("/v2/imports");
  await page.getByLabel("Sélectionner un compte", { exact: true }).selectOption(String(accounts[0].id));
  await page.getByLabel("Relevé bancaire", { exact: true }).setInputFiles({
    name: "workflow.csv", mimeType: "text/csv",
    buffer: Buffer.from("Date;Libellé;Débit;Crédit\n01/10/2026;Achat UX;12,34;\n"),
  });
  await page.getByRole("button", { name: "Aperçu de l’import", exact: true }).click();
  await expect(page.getByRole("table").filter({ hasText: "Achat UX" })).toBeVisible();
  await page.getByLabel("Type d’import", { exact: true }).selectOption("native");
  await expect(page.getByLabel("Relevé bancaire", { exact: true })).toHaveValue("");
  await expect(page.getByRole("table").filter({ hasText: "Achat UX" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Restaurer un CSV OmniBank", exact: true })).toBeDisabled();
});
