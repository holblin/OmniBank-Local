import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  locale: "fr-FR",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: 1000 });
  for (const path of [
    "accounts",
    "categories",
    "recurrences",
    "trends",
    "simulator",
    "assistant",
    "settings",
    "bank-sync",
    "journal",
    "imports",
    "notifications",
    "setup",
    "overview",
    "unlock",
  ]) {
    await page.goto(`http://127.0.0.1:8434/v2/${path}`);
    await page
      .waitForFunction(
        () =>
          !document.querySelector("main")?.textContent.includes("Chargement"),
        null,
        { timeout: 10000 },
      )
      .catch(async () => {
        console.log(
          JSON.stringify({
            path,
            errors,
            text: await page.locator("main").innerText(),
          }),
        );
      });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `../screenshots/ui-v2/${path}-${width === 390 ? "mobile" : "desktop"}.png`,
      animations: "disabled",
    });
  }
}
console.log(JSON.stringify({ errors }));
await browser.close();
