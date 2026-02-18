/**
 * Screenshot of color filter (БАГ-5)
 */

import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/catalog', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click on color filter to open it
  const colorFilter = page.locator('button:has-text("Цвет"), [class*="filter"]:has-text("Цвет")').first();
  if (await colorFilter.count() > 0) {
    await colorFilter.click();
    await page.waitForTimeout(1000);
  }

  const timestamp = Date.now();
  await page.screenshot({
    path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/color-filter-${timestamp}.png`,
    fullPage: false
  });

  // Check for color swatches
  const colorSwatches = await page.locator('[style*="background"], .color-swatch, [class*="color"]').count();

  console.log(JSON.stringify({
    status: 'success',
    screenshot: `color-filter-${timestamp}.png`,
    colorSwatchesFound: colorSwatches
  }, null, 2));

  await browser.close();
}

takeScreenshot();
