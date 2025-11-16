const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Naukri Job Update', () => {

  test.beforeEach(async ({ page }) => {
    // Get credentials from environment variables
    const email = process.env.VISHALA_NAUKRI_EMAIL;
    const password = process.env.VISHALA_NAUKRI_PASSWORD;

    if (!email || !password) {
      throw new Error('VISHALA_NAUKRI_EMAIL or VISHALA_NAUKRI_PASSWORD environment variables not set');
    }

    // Navigate to Naukri
    await page.goto('https://www.naukri.com/');

    // Login
    await page.click('#login_Layer');
    await page.fill("input[placeholder='Enter your active Email ID / Username']", email);
    await page.fill("input[placeholder='Enter your password']", password);
    await page.click("button.btn-primary.loginButton");

    // Try to close chatbot if present
    try {
      const chatBot = page.locator('.chatbot_Nav').first();
      if (await chatBot.isVisible({ timeout: 2000 })) {
        await page.click("div.chatbot_Nav > div");
      }
    } catch (error) {
      // Chatbot not found, continue
      console.log('Chatbot not found or already closed');
    }
  });

  test('Update Srishti Naukri Profile', async ({ page }) => {
    // Navigate to profile
    await page.click("a[href='/mnjuser/profile']");

    // Get resume path - adjust this path based on your project structure
    const resumePath = path.join(__dirname, '..', 'TestData', 'Resumes', 'Dr.Vishala_Profile.pdf');

    // Check if file exists
    if (!fs.existsSync(resumePath)) {
      throw new Error(`Resume not found at: ${resumePath}`);
    }

    console.log(`Using resume from: ${resumePath}`);

    // Update profile 50 times
    for (let i = 0; i < 10; i++) {
      // Click edit icon and wait for form to appear
      await page.click("div#lazyResumeHead span.edit.icon");
      await page.waitForSelector("form[name='resumeHeadlineForm'] button[type='submit']", { state: 'visible' });

      // Submit form
      await page.click("form[name='resumeHeadlineForm'] button[type='submit']");
      
      // Wait for file input to be ready
      await page.waitForSelector('#attachCV', { state: 'attached' });

      // Upload resume
      const fileInput = page.locator('#attachCV');
      await fileInput.setInputFiles(resumePath);
      
      // Wait for upload to complete - verify the edit icon is visible again (indicating upload finished)
      await page.waitForSelector("div#lazyResumeHead span.edit.icon", { state: 'visible' });
    }

    console.log('Profile update completed successfully!');
  });
});