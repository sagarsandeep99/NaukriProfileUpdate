const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const COOKIES_FILE = path.join(__dirname, '..', 'auth-cookies.json');

test.describe('Naukri Job Update', () => {

  test.beforeEach(async ({ page, context }) => {
    const email = process.env.SRISHTI_NAUKRI_EMAIL;
    const password = process.env.SRISHTI_NAUKRI_PASSWORD;

    if (!email || !password) {
      throw new Error('SRISHTI_NAUKRI_EMAIL or SRISHTI_NAUKRI_PASSWORD environment variables not set');
    }

    // Enhanced anti-detection script
    await context.addInitScript(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Mock chrome object more thoroughly
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {},
      };
      
      // Mock plugins with realistic values
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          return [
            {
              0: { type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format" },
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
              length: 1,
              name: "Chrome PDF Plugin"
            },
            {
              0: { type: "application/pdf", suffixes: "pdf", description: "Portable Document Format" },
              description: "Portable Document Format", 
              filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
              length: 1,
              name: "Chrome PDF Viewer"
            }
          ];
        },
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Mock media devices
      if (!navigator.mediaDevices) {
        navigator.mediaDevices = {};
      }
      navigator.mediaDevices.enumerateDevices = () => Promise.resolve([
        { kind: 'audioinput', deviceId: 'default', label: '', groupId: '' },
        { kind: 'videoinput', deviceId: 'default', label: '', groupId: '' },
        { kind: 'audiooutput', deviceId: 'default', label: '', groupId: '' }
      ]);

      // Mock connection
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: '4g',
          rtt: 100,
          downlink: 10,
          saveData: false
        })
      });

      // Override toString to hide proxy nature
      const originalToString = Function.prototype.toString;
      Function.prototype.toString = function() {
        if (this === navigator.permissions.query) {
          return 'function query() { [native code] }';
        }
        return originalToString.apply(this, arguments);
      };
    });

    // Set additional headers
    await page.setExtraHTTPHeaders({
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
    });

    // Try to load existing cookies
    let cookiesLoaded = false;
    if (fs.existsSync(COOKIES_FILE)) {
      try {
        const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8'));
        await context.addCookies(cookies);
        cookiesLoaded = true;
        console.log('Loaded existing cookies');
      } catch (error) {
        console.log('Failed to load cookies:', error.message);
      }
    }

    console.log('Navigating to Naukri.com...');
    
    // Navigate and wait for page to load completely
    try {
      await page.goto('https://www.naukri.com/', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      // Random delay to mimic human behavior
      await page.waitForTimeout(2000 + Math.random() * 2000);
      
      console.log('Page loaded successfully');
    } catch (error) {
      console.error('Failed to load Naukri.com:', error.message);
      throw error;
    }

    // Check if already logged in
    const isLoggedIn = await page.locator("a[href='/mnjuser/profile']").isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isLoggedIn) {
      console.log('Already logged in using saved cookies');
      return;
    }

    console.log('Not logged in, performing login...');

    // Wait for login button to be visible
    await page.waitForSelector('#login_Layer', { state: 'visible', timeout: 30000 });
    await page.waitForTimeout(300 + Math.random() * 300);
    await page.click('#login_Layer');

    // Wait for login form
    await page.waitForSelector("input[placeholder='Enter your active Email ID / Username']", { 
      state: 'visible',
      timeout: 10000 
    });

    // Human-like typing with random delays
    console.log('Typing email...');
    await page.click("input[placeholder='Enter your active Email ID / Username']");
    await page.waitForTimeout(200 + Math.random() * 200);
    
    for (const char of email) {
      await page.keyboard.type(char);
      await page.waitForTimeout(50 + Math.random() * 100);
    }
    
    await page.waitForTimeout(400 + Math.random() * 200);
    
    console.log('Typing password...');
    await page.click("input[placeholder='Enter your password']");
    await page.waitForTimeout(200 + Math.random() * 200);
    
    for (const char of password) {
      await page.keyboard.type(char);
      await page.waitForTimeout(50 + Math.random() * 100);
    }
    
    await page.waitForTimeout(800 + Math.random() * 400);
    
    // Click login and wait for navigation
    console.log('Clicking login button...');
    await Promise.all([
      page.waitForNavigation({ timeout: 60000, waitUntil: 'domcontentloaded' }),
      page.click("button.btn-primary.loginButton")
    ]);

    console.log('Login completed');

    // Wait for page to settle
    await page.waitForTimeout(3000);

    // Save cookies after successful login
    try {
      const cookies = await context.cookies();
      fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
      console.log('Cookies saved for future use');
    } catch (error) {
      console.log('Warning: Could not save cookies:', error.message);
    }

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

    // Verify we're logged in by checking for profile link
    await page.waitForSelector("a[href='/mnjuser/profile']", { 
      state: 'visible',
      timeout: 10000 
    });
    
    console.log('Login verified successfully');
  });

  test('Update Srishti Naukri Profile', async ({ page }) => {
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
      
      // Random delay before action to mimic human behavior
      await page.waitForTimeout(300 + Math.random() * 700);
      
      // Click edit icon
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
      await page.waitForTimeout(2500 + Math.random() * 1500);
      
      console.log(`Iteration ${i + 1} completed successfully`);
    }

    console.log('Profile update completed successfully!');
  });
});