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
    // Updated to latest Chrome version
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'Asia/Kolkata',
    permissions: ['geolocation', 'notifications'],
    geolocation: { latitude: 19.0760, longitude: 72.8777 }, // Mumbai
    colorScheme: 'light',
    hasTouch: false,
    isMobile: false,
    javaScriptEnabled: true,
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
            '--start-maximized',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-extensions',
            '--disable-plugins-discovery',
            '--disable-translate',
            '--disable-default-apps',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-component-extensions-with-background-pages',
            '--disable-ipc-flooding-protection',
            '--enable-features=NetworkService,NetworkServiceInProcess',
            '--force-color-profile=srgb',
            '--metrics-recording-only',
            '--disable-hang-monitor',
            '--mute-audio',
          ],
          headless: true,
          // Remove 'channel: chrome' if Chrome is not installed
          // channel: 'chrome',
          slowMo: 100, // Slow down actions by 100ms
        },
        contextOptions: {
          bypassCSP: true,
          extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
          },
        },
      },
    },
  ],
});