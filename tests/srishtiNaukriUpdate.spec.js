const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const { expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Add stealth plugin
chromium.use(stealth);

let browser, context, page;

async function setup() {
  const email = process.env.SRISHTI_NAUKRI_EMAIL;
  const password = process.env.SRISHTI_NAUKRI_PASSWORD;

  if (!email || !password) {
    throw new Error('SRISHTI_NAUKRI_EMAIL or SRISHTI_NAUKRI_PASSWORD environment variables not set');
  }

  // Launch browser with stealth mode
  browser = await chromium.launch({
    headless: true,
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
    ],
  });

  context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'Asia/Kolkata',
    permissions: ['geolocation', 'notifications'],
    geolocation: { latitude: 19.0760, longitude: 72.8777 }, // Mumbai coordinates
    colorScheme: 'light',
    bypassCSP: true,
    javaScriptEnabled: true,
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
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
  });

  page = await context.newPage();

  // Additional stealth techniques
  await page.addInitScript(() => {
    // Overwrite the `plugins` property to use a custom getter
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Overwrite the `languages` property to use a custom getter
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });

    // Overwrite the `webdriver` property
    delete Object.getPrototypeOf(navigator).webdriver;

    // Pass the Permissions Test
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters)
    );

    // Mock chrome object
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {},
    };

    // Mock plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        return [
          {
            0: { type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: Plugin },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin"
          }
        ];
      },
    });
  });

  console.log('Navigating to Naukri.com...');
  
  await page.goto('https://www.naukri.com/', { 
    waitUntil: 'domcontentloaded',
    timeout: 60000 
  });
  
  // Random delay to mimic human behavior
  await page.waitForTimeout(2000 + Math.random() * 2000);
  
  console.log('Page loaded successfully');

  // Wait for login button with retry
  await page.waitForSelector('#login_Layer', { state: 'visible', timeout: 30000 });
  await page.waitForTimeout(500 + Math.random() * 500);
  await page.click('#login_Layer');

  // Wait for login form
  await page.waitForSelector("input[placeholder='Enter your active Email ID / Username']", { 
    state: 'visible',
    timeout: 10000 
  });

  // Human-like typing with random delays
  await page.click("input[placeholder='Enter your active Email ID / Username']");
  await page.waitForTimeout(300);
  for (const char of email) {
    await page.keyboard.type(char);
    await page.waitForTimeout(50 + Math.random() * 100);
  }
  
  await page.waitForTimeout(500);
  await page.click("input[placeholder='Enter your password']");
  await page.waitForTimeout(300);
  for (const char of password) {
    await page.keyboard.type(char);
    await page.waitForTimeout(50 + Math.random() * 100);
  }
  
  await page.waitForTimeout(1000);
  
  // Click login and wait for navigation
  await Promise.all([
    page.waitForNavigation({ timeout: 60000, waitUntil: 'domcontentloaded' }),
    page.click("button.btn-primary.loginButton")
  ]);

  console.log('Login completed');

  // Wait for page to settle
  await page.waitForTimeout(3000);

  // Close chatbot if present
  try {
    const chatBot = page.locator('.chatbot_Nav').first();
    if (await chatBot.isVisible({ timeout: 2000 })) {
      await page.click("div.chatbot_Nav > div");
      await page.waitForTimeout(500);
    }
  } catch (error) {
    console.log('Chatbot not found or already closed');
  }

  // Verify we're logged in
  await page.waitForSelector("a[href='/mnjuser/profile']", { 
    state: 'visible',
    timeout: 10000 
  });
  
  console.log('Login verified successfully');
}

async function updateProfile() {
  // Navigate to profile
  await page.click("a[href='/mnjuser/profile']");
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  const resumePath = path.join(__dirname, '..', 'TestData', 'Resumes', 'Srishti_Resume.pdf');

  if (!fs.existsSync(resumePath)) {
    throw new Error(`Resume not found at: ${resumePath}`);
  }

  console.log(`Using resume from: ${resumePath}`);

  // Wait for profile page to load
  await page.waitForSelector("div#lazyResumeHead span.edit.icon", { 
    state: 'visible',
    timeout: 15000 
  });

  for (let i = 0; i < 10; i++) {
    console.log(`Starting iteration ${i + 1}`);
    
    // Click edit icon with random delay
    await page.waitForTimeout(500 + Math.random() * 500);
    await page.click("div#lazyResumeHead span.edit.icon");
    await page.waitForTimeout(1000);
    
    // Wait for form to appear
    await page.waitForSelector("form[name='resumeHeadlineForm'] button[type='submit']", { 
      state: 'visible',
      timeout: 10000 
    });

    // Click submit button
    await page.click("form[name='resumeHeadlineForm'] button[type='submit']");
    await page.waitForTimeout(500);
    
    // Wait for file input to be ready
    await page.waitForSelector('#attachCV', { 
      state: 'attached',
      timeout: 10000 
    });

    console.log(`File input ready for iteration ${i + 1}`);

    // Upload file
    const fileInput = page.locator('#attachCV');
    await fileInput.setInputFiles(resumePath);
    
    console.log(`File uploaded for iteration ${i + 1}`);
    
    // Wait for upload to complete
    try {
      await page.waitForSelector("form[name='resumeHeadlineForm']", { 
        state: 'hidden', 
        timeout: 20000 
      });
      console.log(`Upload modal closed for iteration ${i + 1}`);
    } catch (e) {
      console.log(`Waiting for edit icon to reappear for iteration ${i + 1}`);
      await page.waitForSelector("div#lazyResumeHead span.edit.icon", { 
        state: 'visible',
        timeout: 20000
      });
    }
    
    // Wait for UI to stabilize with random delay
    await page.waitForTimeout(2500 + Math.random() * 1000);
    
    console.log(`Iteration ${i + 1} completed successfully`);
  }

  console.log('Profile update completed successfully!');
}

async function cleanup() {
  if (page) await page.close();
  if (context) await context.close();
  if (browser) await browser.close();
}

// Main execution
(async () => {
  try {
    await setup();
    await updateProfile();
    console.log('Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    await page?.screenshot({ path: 'error-screenshot.png', fullPage: true });
    process.exit(1);
  } finally {
    await cleanup();
  }
})();