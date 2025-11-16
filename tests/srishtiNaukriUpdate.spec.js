const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Naukri Job Update', () => {

  test.beforeEach(async ({ page, context }) => {
    const email = process.env.SRISHTI_NAUKRI_EMAIL;
    const password = process.env.SRISHTI_NAUKRI_PASSWORD;

    if (!email || !password) {
      throw new Error('SRISHTI_NAUKRI_EMAIL or SRISHTI_NAUKRI_PASSWORD environment variables not set');
    }

    // Add extra headers to appear more like a real browser
    await context.addInitScript(() => {
      // Override navigator properties to avoid detection
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Add missing chrome property
      window.chrome = {
        runtime: {},
      };
      
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    // Set additional headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });

    console.log('Navigating to Naukri.com...');
    
    // Navigate and wait for page to load completely
    try {
      await page.goto('https://www.naukri.com/', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      // Wait a bit for page to fully render
      await page.waitForTimeout(3000);
      
      console.log('Page loaded successfully');
    } catch (error) {
      console.error('Failed to load Naukri.com:', error.message);
      throw error;
    }

    // Wait for login button to be visible
    await page.waitForSelector('#login_Layer', { state: 'visible', timeout: 30000 });
    await page.click('#login_Layer');

    // Wait for login form
    await page.waitForSelector("input[placeholder='Enter your active Email ID / Username']", { 
      state: 'visible',
      timeout: 10000 
    });

    // Fill login form with human-like delays
    await page.fill("input[placeholder='Enter your active Email ID / Username']", email);
    await page.waitForTimeout(500);
    await page.fill("input[placeholder='Enter your password']", password);
    await page.waitForTimeout(500);
    
    // Click login and wait for navigation
    await Promise.all([
      page.waitForNavigation({ timeout: 60000 }),
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

    for (let i = 0; i < 2; i++) {
      console.log(`Starting iteration ${i + 1}`);
      
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
      
      // Wait for UI to stabilize
      await page.waitForTimeout(3000);
      
      console.log(`Iteration ${i + 1} completed successfully`);
    }

    console.log('Profile update completed successfully!');
  });
});