/**
 * Simple checkout page screenshot
 */

import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  // Clear session before starting
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Navigate to checkout
  await page.goto('http://localhost:5173/checkout', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const timestamp = Date.now();
  const path = `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/checkout-${timestamp}.png`;
  await page.screenshot({ path, fullPage: true });

  console.log(JSON.stringify({
    status: 'success',
    screenshot: path,
    url: page.url()
  }, null, 2));

  await browser.close();
}

takeScreenshot();
