/**
 * Production Checkout with Cart - add product and capture checkout
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const PROD_URL = 'http://83.166.246.253';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots';
const timestamp = Date.now();

async function main() {
  console.log('=== CHECKOUT WITH CART TEST ===\n');
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // 1. Go to catalog
    console.log('[1] Loading catalog...');
    await page.goto(`${PROD_URL}/catalog?gender=women`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(5000);

    // 2. Click first product
    console.log('[2] Clicking first product...');
    const productLink = page.locator('a[href*="/catalog/"]').first();
    if (await productLink.count() > 0) {
      await productLink.click();
      await page.waitForTimeout(5000);

      // Screenshot product page
      await page.screenshot({ path: join(OUTPUT_DIR, `prod-product-page-${timestamp}.png`) });
      console.log('   [OK] Product page screenshot');

      // 3. Try to add to cart
      console.log('[3] Looking for Add to Cart button...');

      // Try different selectors for add to cart
      const addToCartSelectors = [
        'button:has-text("В корзину")',
        'button:has-text("Добавить")',
        'button:has-text("Add")',
        '[class*="add-to-cart"]',
        '[class*="addToCart"]'
      ];

      let addedToCart = false;
      for (const selector of addToCartSelectors) {
        try {
          const btn = page.locator(selector).first();
          if (await btn.isVisible({ timeout: 2000 })) {
            // First, select a size if needed
            const sizeBtn = page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L"), [class*="size"]').first();
            if (await sizeBtn.isVisible({ timeout: 1000 })) {
              await sizeBtn.click();
              await page.waitForTimeout(500);
            }

            await btn.click();
            await page.waitForTimeout(2000);
            addedToCart = true;
            console.log(`   [OK] Added to cart via: ${selector}`);
            break;
          }
        } catch { }
      }

      if (!addedToCart) {
        console.log('   [WARN] Could not find Add to Cart button');
      }

      // 4. Go to checkout
      console.log('[4] Going to checkout...');
      await page.goto(`${PROD_URL}/checkout`, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForTimeout(5000);

      // Screenshot checkout
      await page.screenshot({ path: join(OUTPUT_DIR, `prod-checkout-real-${timestamp}.png`) });
      console.log('   [OK] Checkout screenshot');

      await page.screenshot({ path: join(OUTPUT_DIR, `prod-checkout-real-fullpage-${timestamp}.png`), fullPage: true });
      console.log('   [OK] Checkout fullpage screenshot');

    } else {
      console.log('   [FAIL] No products found');
    }

  } catch (error) {
    console.error('[ERROR]', error.message);
  } finally {
    await browser.close();
  }

  console.log('\nDone!');
}

main().catch(console.error);
