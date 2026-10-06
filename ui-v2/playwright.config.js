import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const python = existsSync('../venv/Scripts/python.exe') ? '../venv/Scripts/python.exe' : '../venv/bin/python';
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:8436',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chromium',
    viewport: { width: 1440, height: 1000 },
    locale: 'fr-FR',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `"${resolve(python)}" "${resolve('../scripts/run_ui_v2_tests.py')}"`,
    url: 'http://127.0.0.1:8436/api/health',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
