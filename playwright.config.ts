import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// The Firebase web config (NEXT_PUBLIC_*) for the security rules tests
if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}

// Runs against the local dev server, started if it isn't running, or against
// E2E_BASE_URL, e.g. production with npm run test:e2e:prod once the tests
// pass locally. Either way the data is real (the dev server uses the
// production database too): the tests create and delete their own events in
// the hidden e2e team. Logins and event creation are rate limited per IP, so
// leave about 10 minutes between full runs against production.
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  // One event is shared by the steps of a run, so they run in order
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run dev', url: baseURL, reuseExistingServer: true },
  projects: [
    {
      // The app is mostly used on phones at the door
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
