import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1279, height: 1111 },
  locale: "fr-FR",
});
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:8434/v2/history");
await page.getByRole("table").waitFor();
await page
  .getByRole("combobox", { name: "Thème", exact: true })
  .selectOption("neutral");
await page.getByRole("button", { name: "Compact", exact: true }).click();
await page.screenshot({
  path: "../screenshots/ui-v2/history-fill-desktop.png",
  animations: "disabled",
});
const rows = await (
  await page.request.get("http://127.0.0.1:8434/api/transactions/?limit=1")
).json();
let empty = false;
await page.route("**/api/transactions/?*", (route) =>
  route.fulfill({ json: empty ? [] : rows }),
);
await page.getByRole("button", { name: "Actualiser", exact: true }).click();
await page.waitForFunction(
  () => document.querySelectorAll("tbody tr[data-index]").length === 1,
);
await page.screenshot({
  path: "../screenshots/ui-v2/history-fill-short.png",
  animations: "disabled",
});
empty = true;
await page.getByRole("button", { name: "Actualiser", exact: true }).click();
await page
  .getByText("Aucune opération pour le moment", { exact: true })
  .waitFor();
await page.screenshot({
  path: "../screenshots/ui-v2/history-fill-empty.png",
  animations: "disabled",
});
const footer = (await page.locator("[data-app-footer]").boundingBox())!;
console.log(
  JSON.stringify({
    errors,
    footerBottom: footer.y + footer.height,
    viewportHeight: 1111,
  }),
);
await browser.close();
