/**
 * Quick auth page screenshot
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const PROD_URL = 'http://83.166.246.253';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots';
const timestamp = Date.now();

async function main() {
  console.log('=== AUTH PAGE ===\n');
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('Loading auth page...');
    await page.goto(`${PROD_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: join(OUTPUT_DIR, `prod-auth-${timestamp}.png`) });
    console.log('[OK] Auth screenshot saved');

    // Also take home bottom for support button
    console.log('\nLoading home and scrolling to bottom...');
    await page.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(OUTPUT_DIR, `prod-home-scrolled-${timestamp}.png`) });
    console.log('[OK] Home scrolled screenshot saved');

  } catch (error) {
    console.error('[ERROR]', error.message);
  } finally {
    await browser.close();
  }

  console.log('\nDone!');
}

main().catch(console.error);
