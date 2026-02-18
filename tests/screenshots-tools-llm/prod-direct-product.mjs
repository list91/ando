/**
 * Direct product page access - try to find product URLs
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const PROD_URL = 'http://83.166.246.253';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots';
const timestamp = Date.now();

async function main() {
  console.log('=== DIRECT PRODUCT ACCESS ===\n');
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // 1. Load catalog and wait longer for products
    console.log('[1] Loading catalog with extended wait...');
    await page.goto(`${PROD_URL}/catalog?gender=women`, { waitUntil: 'networkidle', timeout: 180000 });
    await page.waitForTimeout(10000);

    // Screenshot catalog after full load
    await page.screenshot({ path: join(OUTPUT_DIR, `prod-catalog-loaded-${timestamp}.png`) });
    console.log('   [OK] Catalog loaded screenshot');

    // Get page HTML to find product links
    const html = await page.content();
    const productUrls = html.match(/href="\/catalog\/[^"]+"/g) || [];
    console.log(`   Found ${productUrls.length} product links`);

    if (productUrls.length > 0) {
      const firstUrl = productUrls[0].replace('href="', '').replace('"', '');
      console.log(`   First product: ${firstUrl}`);

      // Go to product
      await page.goto(`${PROD_URL}${firstUrl}`, { waitUntil: 'networkidle', timeout: 120000 });
      await page.waitForTimeout(5000);

      await page.screenshot({ path: join(OUTPUT_DIR, `prod-product-detail-${timestamp}.png`) });
      console.log('   [OK] Product detail screenshot');
    }

    // 2. Try auth page for registration blocks
    console.log('\n[2] Loading auth page...');
    await page.goto(`${PROD_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(OUTPUT_DIR, `prod-auth-${timestamp}.png`) });
    console.log('   [OK] Auth page screenshot');

    // 3. Load home and scroll to check support button
    console.log('\n[3] Loading home page...');
    await page.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Scroll to bottom to see support button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(OUTPUT_DIR, `prod-home-bottom-${timestamp}.png`) });
    console.log('   [OK] Home bottom screenshot');

  } catch (error) {
    console.error('[ERROR]', error.message);
  } finally {
    await browser.close();
  }

  console.log('\nDone!');
}

main().catch(console.error);
