import { test, expect } from '@playwright/test';

const BASE_URL = 'https://andojv.com';

test.describe('Check fixes 14.1, 14, 18', () => {

  test('Fix 14.1 & 18 - Catalog page with NEW/SALE badges and product cards', async ({ page }) => {
    // Go to catalog
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take full catalog screenshot
    await page.screenshot({
      path: 'tests/screenshots/fix-check-catalog-full.png',
      fullPage: false
    });

    // Try to find product cards with NEW or SALE badges
    const productCards = page.locator('[class*="product"], [class*="card"], [class*="item"]').first();

    // Scroll to ensure products are visible
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'tests/screenshots/fix-check-catalog-products.png',
      fullPage: false
    });

    // Check for NEW/SALE badges
    const newBadges = page.locator('text=NEW, [class*="new"], [class*="badge"]:has-text("NEW")');
    const saleBadges = page.locator('text=SALE, [class*="sale"], [class*="badge"]:has-text("SALE")');

    console.log('NEW badges found:', await newBadges.count());
    console.log('SALE badges found:', await saleBadges.count());

    // Check color circles
    const colorCircles = page.locator('[class*="color"], [class*="swatch"]');
    console.log('Color circles found:', await colorCircles.count());

    // Try hovering on color to check tooltip
    if (await colorCircles.count() > 0) {
      await colorCircles.first().hover();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: 'tests/screenshots/fix-check-catalog-color-hover.png',
        fullPage: false
      });
    }
  });

  test('Fix 14 - Favorites page with NEW/SALE badges', async ({ page }) => {
    // Go to favorites
    await page.goto(`${BASE_URL}/favorites`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'tests/screenshots/fix-check-favorites.png',
      fullPage: false
    });

    // Check for badges styling
    const badges = page.locator('[class*="badge"], [class*="label"], [class*="tag"]');
    console.log('Badges in favorites:', await badges.count());
  });

  test('Detailed catalog inspection', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Get page HTML for analysis
    const html = await page.content();

    // Look for specific elements
    const styles = await page.evaluate(() => {
      const results: any = {
        newBadges: [],
        saleBadges: [],
        colorElements: [],
        sizeElements: []
      };

      // Find NEW badges
      document.querySelectorAll('*').forEach(el => {
        if (el.textContent?.trim() === 'NEW' || el.textContent?.trim() === 'New') {
          const style = window.getComputedStyle(el);
          results.newBadges.push({
            tag: el.tagName,
            class: el.className,
            color: style.color,
            backgroundColor: style.backgroundColor,
            borderRadius: style.borderRadius
          });
        }
        if (el.textContent?.trim() === 'SALE' || el.textContent?.trim() === 'Sale') {
          const style = window.getComputedStyle(el);
          results.saleBadges.push({
            tag: el.tagName,
            class: el.className,
            color: style.color,
            backgroundColor: style.backgroundColor,
            borderRadius: style.borderRadius
          });
        }
      });

      // Find color swatches
      document.querySelectorAll('[class*="color"], [class*="swatch"], [class*="Color"]').forEach(el => {
        const style = window.getComputedStyle(el);
        results.colorElements.push({
          tag: el.tagName,
          class: el.className,
          display: style.display,
          visibility: style.visibility,
          pointerEvents: style.pointerEvents
        });
      });

      // Find size elements
      document.querySelectorAll('[class*="size"], [class*="Size"]').forEach(el => {
        results.sizeElements.push({
          tag: el.tagName,
          class: el.className,
          text: el.textContent?.trim().substring(0, 50)
        });
      });

      return results;
    });

    console.log('=== CATALOG ANALYSIS ===');
    console.log('NEW badges:', JSON.stringify(styles.newBadges, null, 2));
    console.log('SALE badges:', JSON.stringify(styles.saleBadges, null, 2));
    console.log('Color elements:', JSON.stringify(styles.colorElements, null, 2));
    console.log('Size elements:', JSON.stringify(styles.sizeElements, null, 2));

    // Take screenshot with DevTools style info
    await page.screenshot({
      path: 'tests/screenshots/fix-check-catalog-detailed.png',
      fullPage: true
    });
  });

  test('Check specific product card structure', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find and analyze product card HTML
    const productCardHTML = await page.evaluate(() => {
      // Try different selectors for product cards
      const selectors = [
        '[class*="ProductCard"]',
        '[class*="product-card"]',
        '[class*="catalog"] [class*="card"]',
        '[class*="grid"] > div'
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          return {
            selector,
            outerHTML: el.outerHTML.substring(0, 2000),
            classList: el.className
          };
        }
      }
      return null;
    });

    console.log('Product card structure:', JSON.stringify(productCardHTML, null, 2));

    // Viewport clip of first product card area
    await page.screenshot({
      path: 'tests/screenshots/fix-check-product-card-area.png',
      clip: { x: 0, y: 150, width: 600, height: 500 }
    });
  });
});
