/**
 * Large screenshot of catalog cards with colors
 */

import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/catalog', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const timestamp = Date.now();

  // Screenshot focusing on product cards area
  await page.screenshot({
    path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/catalog-colors-large-${timestamp}.png`,
    fullPage: false
  });

  console.log(JSON.stringify({
    status: 'success',
    screenshot: `catalog-colors-large-${timestamp}.png`
  }, null, 2));

  await browser.close();
}

takeScreenshot();
