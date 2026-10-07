import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1060 },
  locale: "fr-FR",
});
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
// Use the isolated synthetic preview seeded by capture.ts.
for (const [path, title] of [
  ["budgets", "Budgets"],
  ["summary", "Synthèse"],
  ["history", "Historique"],
]) {
  await page.goto(`http://127.0.0.1:8434/v2/${path}`);
  await page.getByRole("heading", { name: title, exact: true }).waitFor();
  if (path === "budgets") await page.getByRole("article").first().waitFor();
  if (path === "summary")
    await page
      .getByRole("img", {
        name: "Recettes et dépenses mensuelles",
        exact: true,
      })
      .waitFor();
  if (path === "history") await page.locator("tbody tr").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `../screenshots/ui-v2/${path}-desktop.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: `../screenshots/ui-v2/${path}-mobile.png`,
    fullPage: path !== "history",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1440, height: 1060 });
}
console.log(JSON.stringify({ errors }));
await browser.close();
