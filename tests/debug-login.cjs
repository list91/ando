/**
 * Debug login page
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:8087';

async function debugLogin() {
  const browser = await chromium.launch({ headless: false }); // Show browser

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Go to admin login
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Current URL:', page.url());

    // Get all input fields
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        className: input.className
      }));
    });
    console.log('Input fields:', JSON.stringify(inputs, null, 2));

    // Get all buttons
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(btn => ({
        type: btn.type,
        text: btn.textContent?.trim(),
        className: btn.className
      }));
    });
    console.log('Buttons:', JSON.stringify(buttons, null, 2));

    // Try login
    const emailInput = await page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('admin@ando.ru');
      console.log('Filled email');
    }

    const passwordInput = await page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('secret123');
      console.log('Filled password');
    }

    await page.waitForTimeout(500);

    // Click login button
    const loginBtn = await page.locator('button[type="submit"], button:has-text("Войти")').first();
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      console.log('Clicked login button');
    }

    await page.waitForTimeout(3000);
    console.log('After login URL:', page.url());

    // Check for error messages
    const errors = await page.evaluate(() => {
      const errorEl = document.querySelector('[class*="error"], [class*="Error"], .text-red, .text-destructive');
      return errorEl?.textContent?.trim();
    });
    if (errors) {
      console.log('Error message:', errors);
    }

    await context.close();

  } finally {
    await browser.close();
  }
}

debugLogin().catch(console.error);
