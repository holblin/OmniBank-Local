import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Run only against the isolated synthetic preview used by capture.mjs.
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1060 }, locale: 'fr-FR' });
await page.goto('http://127.0.0.1:8434/v2');
await page.getByRole('heading', { name: 'Dernières opérations' }).waitFor();
await page.getByRole('img', { name: 'Évolution quotidienne du solde du compte' }).waitFor();
await page.evaluate(() => document.fonts.ready);
await mkdir('../screenshots/ui-v2/themes', { recursive: true });
for (const theme of ['neutral', 'stone', 'gothic', 'matcha', 'y2k', 'butter']) {
  await page.getByRole('combobox', { name: 'Thème', exact: true }).selectOption(theme);
  await page.getByRole('button', { name: 'Compact', exact: true }).click();
  await page.screenshot({ path: `../screenshots/ui-v2/themes/${theme}-compact.png`, fullPage: true, animations: 'disabled' });
}
await page.getByRole('combobox', { name: 'Thème', exact: true }).selectOption('gothic');
await page.setViewportSize({ width: 320, height: 844 });
await page.screenshot({ path: '../screenshots/ui-v2/themes/gothic-compact-mobile.png', fullPage: true, animations: 'disabled' });
await browser.close();
