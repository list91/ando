/**
 * Mobile screenshot for support icon (БАГ-4)
 */

import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: true });

  // Mobile viewport
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone X dimensions
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  const page = await context.newPage();

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const timestamp = Date.now();

  // Full page screenshot
  await page.screenshot({
    path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/mobile-support-${timestamp}.png`,
    fullPage: false
  });

  // Check if support icon is visible
  const supportButton = await page.locator('img[src*="support"], button:has(img[src*="support"]), [class*="support"]').count();
  const supportIcon = await page.locator('img[src="/support-icon.png"]').count();

  console.log(JSON.stringify({
    status: 'success',
    screenshot: `mobile-support-${timestamp}.png`,
    supportButtonFound: supportButton > 0,
    supportIconFound: supportIcon > 0,
    viewport: '375x812 (iPhone X)'
  }, null, 2));

  await browser.close();
}

takeScreenshot();
