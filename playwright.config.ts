import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, timeout: 30000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:43871', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chromium', viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chromium' } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 1000 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: { command: 'npm run preview -- --port 43871 --strictPort', url: 'http://127.0.0.1:43871', reuseExistingServer: false },
});
