/**
 * Debug color circles in catalog
 */

import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser error:', msg.text());
    }
  });

  await page.goto('http://localhost:5173/catalog', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Check for color circles
  const colorCircles = await page.locator('.rounded-full[style*="background"]').count();
  console.log('Color circles found:', colorCircles);

  // Get all product card elements
  const productCards = await page.locator('a[href*="/product/"]').count();
  console.log('Product cards found:', productCards);

  // Try to find color circles with different selectors
  const selectors = [
    'div.rounded-full',
    '[class*="rounded-full"]',
    'div[style*="backgroundColor"]',
    'div[style*="background-color"]'
  ];

  for (const sel of selectors) {
    const count = await page.locator(sel).count();
    console.log(`Selector "${sel}": ${count} elements`);
  }

  // Get innerHTML of first product card
  const firstCard = page.locator('a[href*="/product/"]').first();
  if (await firstCard.count() > 0) {
    const html = await firstCard.innerHTML();
    console.log('\nFirst product card HTML (truncated):');
    console.log(html.substring(0, 1500));
  }

  const timestamp = Date.now();
  await page.screenshot({
    path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/debug-colors-${timestamp}.png`,
    fullPage: false
  });

  await browser.close();
}

debug();
