/**
 * Screenshot of product card colors (БАГ-6)
 */

import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  // Go to catalog
  await page.goto('http://localhost:5173/catalog', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const timestamp = Date.now();

  // Screenshot of catalog with product cards
  await page.screenshot({
    path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/catalog-cards-${timestamp}.png`,
    fullPage: false
  });

  // Click on first product to go to product page
  const productLink = page.locator('a[href*="/product/"]').first();
  if (await productLink.count() > 0) {
    await productLink.click();
    await page.waitForTimeout(2000);

    // Screenshot of product page
    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/product-page-${timestamp}.png`,
      fullPage: false
    });

    // Look for color swatches
    const colorSwatches = await page.locator('[class*="color"], div[style*="background"]').count();
    console.log('Color swatches on product page:', colorSwatches);
  }

  console.log(JSON.stringify({
    status: 'success',
    screenshots: [
      `catalog-cards-${timestamp}.png`,
      `product-page-${timestamp}.png`
    ]
  }, null, 2));

  await browser.close();
}

takeScreenshot();
