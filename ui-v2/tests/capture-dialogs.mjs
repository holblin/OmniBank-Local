import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  locale: "fr-FR",
});
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:8434/v2/history");
await page
  .getByRole("row")
  .filter({ hasText: "Courses du marché" })
  .first()
  .getByRole("button", { name: "Modifier", exact: true })
  .click();
await page.getByRole("dialog").waitFor();
await page.screenshot({
  path: "../screenshots/ui-v2/history-edit-dialog-desktop.png",
  animations: "disabled",
});
await page.setViewportSize({ width: 320, height: 844 });
await page.screenshot({
  path: "../screenshots/ui-v2/history-edit-dialog-mobile.png",
  animations: "disabled",
});
const dialog = await page.getByRole("dialog").boundingBox();
if (
  dialog.x < 0 ||
  dialog.x + dialog.width > 320 ||
  dialog.y < 0 ||
  dialog.y + dialog.height > 844
)
  throw new Error("Le dialogue dépasse la fenêtre mobile");
await page
  .getByRole("dialog")
  .getByRole("button", { name: "Annuler", exact: true })
  .click();
await page.setViewportSize({ width: 1440, height: 1000 });
await page
  .getByRole("row")
  .filter({ hasText: "Courses du marché" })
  .first()
  .getByRole("button", { name: "Supprimer", exact: true })
  .click();
await page.getByRole("alertdialog").waitFor();
await page.screenshot({
  path: "../screenshots/ui-v2/history-delete-dialog-desktop.png",
  animations: "disabled",
});
console.log(JSON.stringify({ errors, mobileDialog: dialog }));
await browser.close();
