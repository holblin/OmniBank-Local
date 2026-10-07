import { test, expect } from "@playwright/test";

async function emptyProfile(page: import("@playwright/test").Page) {
  await page.route("**/api/setup/status*", (route) => route.fulfill({ json: { needs_setup: true } }));
  await page.route("**/api/accounts/", (route) => route.request().method() === "GET" ? route.fulfill({ json: [] }) : route.continue());
}

test("empty profiles open a setup dialog, can dismiss it, and see it again on reload", async ({ page }) => {
  await emptyProfile(page);
  await page.goto("/v2/");
  await expect(page).toHaveURL(/\/v2\/setup$/);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveAccessibleName("Bienvenue chez vous.");
  await expect(dialog.getByRole("heading", { name: "Bienvenue chez vous." })).toBeVisible();
  await dialog.getByRole("button", { name: "Plus tard", exact: true }).click();
  await expect(page).toHaveURL(/\/v2\/?$/);
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/v2\/?$/);
});

test("configured profiles keep the dashboard and deep links remain accessible", async ({ page }) => {
  await page.route("**/api/setup/status*", (route) => route.fulfill({ json: { needs_setup: false } }));
  await page.goto("/v2/");
  await expect(page.getByRole("heading", { name: "Tableau de bord", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await emptyProfile(page);
  await page.goto("/v2/accounts");
  await expect(page.getByRole("heading", { name: "Comptes", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/v2\/accounts$/);
});

test("setup saves preferences and an account inline, retries without duplication, then opens import", async ({ page, request }) => {
  await emptyProfile(page);
  await page.goto("/v2/setup");
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Créer mon espace", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Faites comme chez vous." })).toBeFocused();
  await dialog.getByRole("textbox", { name: "Nom de votre espace" }).fill("Mon espace test");
  await dialog.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Votre premier compte." })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Créer le compte", exact: true })).toBeDisabled();
  await dialog.getByRole("textbox", { name: "Nom du compte" }).fill("Compte onboarding test");
  await dialog.getByRole("spinbutton").fill("123.45");
  let creations = 0;
  await page.route("**/api/accounts/", (route) => {
    if (route.request().method() === "POST") { creations++; return route.continue(); }
    return route.fulfill({ json: [] });
  });
  let failMain = true;
  await page.route("**/api/stats/main_account/*", (route) => {
    if (failMain && route.request().method() === "POST") { failMain = false; return route.fulfill({ status: 500, json: { detail: "Échec synthétique" } }); }
    return route.continue();
  });
  await dialog.getByRole("button", { name: "Créer le compte", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog).toContainText("Compte onboarding test");
  await dialog.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Comment souhaitez-vous commencer ?" })).toBeVisible();
  expect(creations).toBe(1);
  const saved: import("../src/lib/server/models").Account[] = await (await request.get("/api/accounts/")).json();
  expect(saved.find((account) => account.name === "Compte onboarding test")?.initial_balance).toBe(123.45);
  await dialog.getByRole("button", { name: /Importer un relevé/ }).click();
  await dialog.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Tout est prêt. À vous de jouer." })).toBeVisible();
  await dialog.getByRole("button", { name: "Importer mon relevé", exact: true }).click();
  await expect(page).toHaveURL(/\/v2\/imports$/);
});

test("onboarding stays usable on mobile across all themes and translates into English", async ({ page }) => {
  await emptyProfile(page);
  await page.setViewportSize({ width: 320, height: 650 });
  await page.goto("/v2/setup");
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Créer mon espace", exact: true }).click();
  for (const name of ["Neutre", "Stone", "Gothic", "Matcha", "Y2k", "Butter"]) {
    await dialog.getByRole("button", { name, exact: true }).click();
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(321);
    const button = dialog.getByRole("button", { name: "Continuer", exact: true });
    const action = await button.boundingBox();
    expect(action!.y + action!.height).toBeLessThanOrEqual(650);
    expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  }
  await dialog.getByRole("combobox", { name: "Langue", exact: true }).click();
  await page.getByRole("option", { name: "English", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Make yourself at home." })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
});

test("capture the welcome dialog on desktop and mobile", async ({ page }) => {
  await emptyProfile(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Bienvenue sur OmniBank !" })).toBeVisible();
  await page.screenshot({ path: "../screenshots/ui-v2/onboarding/welcome-v1.png", animations: "disabled" });
  await page.goto("/v2/setup");
  await expect(page.getByRole("dialog", { name: "Bienvenue chez vous." })).toBeVisible();
  await page.screenshot({ path: "../screenshots/ui-v2/onboarding/welcome-desktop.png", animations: "disabled" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "../screenshots/ui-v2/onboarding/welcome-mobile.png", animations: "disabled" });
});

test("demo loading requires confirmation and cancellation keeps the welcome step", async ({ page }) => {
  await emptyProfile(page);
  let writes = 0;
  page.on("request", (request) => { if (request.method() === "POST" && request.url().includes("seed-demo")) writes++; });
  await page.goto("/v2/setup");
  await page.getByRole("dialog").getByRole("button", { name: "Charger la démonstration", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Bienvenue chez vous." })).toBeVisible();
  expect(writes).toBe(0);
});
