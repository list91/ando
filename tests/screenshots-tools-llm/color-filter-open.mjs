/**
 * Open color filter dropdown and screenshot (БАГ-5)
 */

import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/catalog', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Find and click color filter dropdown
  const colorTrigger = page.locator('text=Цвет').first();
  console.log('Color trigger found:', await colorTrigger.count());

  if (await colorTrigger.count() > 0) {
    await colorTrigger.click();
    await page.waitForTimeout(1500);
  }

  const timestamp = Date.now();

  // Take screenshot
  await page.screenshot({
    path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/color-filter-open-${timestamp}.png`,
    fullPage: false
  });

  // Look for color circles/swatches in the dropdown
  const dropdown = page.locator('[role="menu"], [class*="dropdown"], [class*="popover"]');
  const colorCircles = page.locator('div[style*="background-color"]');

  console.log(JSON.stringify({
    status: 'success',
    screenshot: `color-filter-open-${timestamp}.png`,
    dropdownFound: await dropdown.count(),
    colorCirclesFound: await colorCircles.count()
  }, null, 2));

  await browser.close();
}

takeScreenshot();
