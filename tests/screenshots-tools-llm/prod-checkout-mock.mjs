/**
 * Checkout with mocked cart data
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const PROD_URL = 'http://83.166.246.253';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots';
const timestamp = Date.now();

async function main() {
  console.log('=== CHECKOUT WITH MOCK CART ===\n');
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // First load home to set up localStorage
    console.log('[1] Loading home page first...');
    await page.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Try to inject mock cart data
    console.log('[2] Injecting mock cart data...');
    await page.evaluate(() => {
      // Try different cart storage keys commonly used
      const mockCart = {
        items: [{
          id: 'mock-1',
          productId: '1',
          name: 'Test Product',
          price: 5000,
          quantity: 1,
          size: 'M'
        }],
        total: 5000
      };

      // Common cart storage keys
      localStorage.setItem('cart', JSON.stringify(mockCart));
      localStorage.setItem('cart-items', JSON.stringify(mockCart.items));
      localStorage.setItem('cartItems', JSON.stringify(mockCart.items));
      localStorage.setItem('shopping-cart', JSON.stringify(mockCart));

      // Zustand-style storage (common in React apps)
      const zustandCart = {
        state: {
          items: mockCart.items,
          total: mockCart.total
        },
        version: 0
      };
      localStorage.setItem('cart-storage', JSON.stringify(zustandCart));
    });

    // Navigate to checkout
    console.log('[3] Navigating to checkout...');
    await page.goto(`${PROD_URL}/checkout`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Check current URL
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    await page.screenshot({ path: join(OUTPUT_DIR, `prod-checkout-mock-${timestamp}.png`) });
    console.log('[OK] Checkout mock screenshot');

    // Also try cart drawer/modal
    console.log('\n[4] Trying to open cart drawer...');
    await page.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Click cart icon
    const cartIcon = page.locator('[class*="cart"], a[href*="cart"], button:has-text("cart")').first();
    if (await cartIcon.isVisible()) {
      await cartIcon.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: join(OUTPUT_DIR, `prod-cart-drawer-${timestamp}.png`) });
      console.log('[OK] Cart drawer screenshot');
    }

  } catch (error) {
    console.error('[ERROR]', error.message);
  } finally {
    await browser.close();
  }

  console.log('\nDone!');
}

main().catch(console.error);
