import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 600000,
  expect: {
    timeout: 30000
  },
  testDir: './tests',
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',

  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 30000,
    navigationTimeout: 60000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--allow-running-insecure-content',
            '--disable-infobars',
            '--window-size=1920,1080',
          ],
          headless: true,
          channel: 'chrome',
        },
        contextOptions: {
          bypassCSP: true,
        },
      },
    },
  ],
});