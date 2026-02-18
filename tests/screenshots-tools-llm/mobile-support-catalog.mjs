/**
 * Mobile screenshot on catalog page for support icon
 */

import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
  });

  const page = await context.newPage();

  // Test on catalog page
  await page.goto('http://localhost:5173/catalog', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const timestamp = Date.now();
  await page.screenshot({
    path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/mobile-catalog-support-${timestamp}.png`,
    fullPage: false
  });

  // Also check product page
  await page.goto('http://localhost:5173/product/1', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/mobile-product-support-${timestamp}.png`,
    fullPage: false
  });

  console.log(JSON.stringify({
    status: 'success',
    screenshots: [
      `mobile-catalog-support-${timestamp}.png`,
      `mobile-product-support-${timestamp}.png`
    ]
  }, null, 2));

  await browser.close();
}

takeScreenshot();
