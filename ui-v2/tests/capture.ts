import { chromium, request } from "@playwright/test";
import { seed } from "./seed.ts";
import { mkdir } from "node:fs/promises";

const api = await request.newContext({ baseURL: "http://127.0.0.1:8434" });
await seed(api);
await api.dispose();
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1060 },
  locale: "fr-FR",
});
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:8434/v2");
await page.getByRole("heading", { name: "Dernières opérations" }).waitFor();
await page
  .getByRole("img", { name: "Évolution quotidienne du solde du compte" })
  .waitFor();
await page.getByText("Courses du marché", { exact: true }).waitFor();
await page.evaluate(() => document.fonts.ready);
await mkdir("../screenshots/ui-v2", { recursive: true });
await page.screenshot({
  path: "../screenshots/ui-v2/dashboard-desktop.png",
  fullPage: true,
  animations: "disabled",
});
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: "../screenshots/ui-v2/dashboard-mobile.png",
  fullPage: true,
  animations: "disabled",
});
console.log(
  JSON.stringify({
    errors,
    horizontalOverflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  }),
);
await browser.close();
