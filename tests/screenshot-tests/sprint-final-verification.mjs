// Sprint Final Verification - Comprehensive Screenshot Tests
// Verifies all sprint features on localhost:8080

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:8080';
const OUTPUT_DIR = join(__dirname, '..', 'screenshots-output', 'sprint-final');

// Results tracking
const screenshots = [];
const issues = [];

console.log('Sprint Final Verification');
console.log('='.repeat(60));
console.log(`Base URL: ${BASE_URL}`);
console.log(`Output: ${OUTPUT_DIR}`);
console.log('='.repeat(60) + '\n');

async function takeScreenshot(page, filename, description) {
  const filepath = join(OUTPUT_DIR, filename);
  try {
    await page.screenshot({ path: filepath, fullPage: false });
    screenshots.push({ filename, description, status: 'success', filepath });
    console.log(`  [OK] ${filename} - ${description}`);
    return true;
  } catch (error) {
    issues.push({ filename, description, error: error.message });
    console.log(`  [FAIL] ${filename} - ${error.message}`);
    return false;
  }
}

(async () => {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    // ============================================
    // 1. CATALOG PAGE (Desktop 1920x1080)
    // ============================================
    console.log('\n[1/9] Catalog Page (Desktop)');
    console.log('-'.repeat(40));

    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    let page = await desktopContext.newPage();

    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check for heart icons (Heart from lucide-react)
    const heartIcons = await page.locator('svg.lucide-heart, [class*="Heart"], button:has(svg)').count();
    if (heartIcons === 0) {
      issues.push({ test: 'catalog-desktop', issue: 'Heart/favorite icons not found on product cards' });
    }

    await takeScreenshot(page, '01-catalog-desktop.png', 'Catalog page with product cards and heart icons');

    // ============================================
    // 2. CATALOG - ADD TO FAVORITES (Desktop)
    // ============================================
    console.log('\n[2/9] Catalog - Favorites Click');
    console.log('-'.repeat(40));

    // The heart button is on product cards
    const heartButton = page.locator('button:has(svg.lucide-heart)').first();
    const heartExists = await heartButton.count() > 0;

    if (heartExists) {
      await heartButton.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '02-catalog-favorites-click.png', 'Heart icon clicked - active/filled state');
    } else {
      issues.push({ test: 'favorites-click', issue: 'Heart button not found' });
      await takeScreenshot(page, '02-catalog-favorites-click.png', 'Catalog page (heart button not found)');
    }

    // ============================================
    // 3. PRODUCT PAGE (Desktop)
    // ============================================
    console.log('\n[3/9] Product Page (Desktop)');
    console.log('-'.repeat(40));

    // Find first product link
    const productLink = page.locator('a[href*="/product/"]').first();
    if (await productLink.count() > 0) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    await takeScreenshot(page, '03-product-page.png', 'Product page with image');

    // ============================================
    // 4. PRODUCT - ZOOM MAGNIFIER (Desktop)
    // ============================================
    console.log('\n[4/9] Product Zoom Magnifier');
    console.log('-'.repeat(40));

    // ImageMagnifier wraps the main product image - it's a div with relative class containing img
    // The magnifier shows on hover (only on pointer: fine devices)
    const mainImageContainer = page.locator('.aspect-\\[3\\/4\\] img, [class*="aspect"] img').first();

    if (await mainImageContainer.count() > 0) {
      const box = await mainImageContainer.boundingBox();
      if (box) {
        // Move mouse to center of image to trigger magnifier
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);

        // The magnifier lens appears as a rounded div with background-image
        const magnifierVisible = await page.locator('.rounded-full[style*="background-image"]').count() > 0;

        if (magnifierVisible) {
          await takeScreenshot(page, '04-product-zoom-hover.png', 'Product image with zoom magnifier lens');
        } else {
          // Magnifier might not show in headless due to pointer: fine check
          issues.push({ test: 'zoom-magnifier', issue: 'Magnifier lens not visible (headless mode may not trigger pointer:fine)' });
          await takeScreenshot(page, '04-product-zoom-hover.png', 'Product page with hover (magnifier may not show in headless)');
        }
      } else {
        issues.push({ test: 'zoom-magnifier', issue: 'Could not get image bounding box' });
        await takeScreenshot(page, '04-product-zoom-hover.png', 'Product page');
      }
    } else {
      issues.push({ test: 'zoom-magnifier', issue: 'Main product image not found' });
      await takeScreenshot(page, '04-product-zoom-hover.png', 'Product page (no main image)');
    }

    // ============================================
    // 5. PRODUCT - LIGHTBOX (Desktop)
    // ============================================
    console.log('\n[5/9] Product Lightbox');
    console.log('-'.repeat(40));

    // Click on product image to open lightbox (ImageLightbox uses Dialog from radix)
    const clickableImage = page.locator('.cursor-pointer img, [class*="aspect"] img').first();

    if (await clickableImage.count() > 0) {
      await clickableImage.click();
      await page.waitForTimeout(1000);

      // Check if lightbox opened - Dialog with bg-black/95 overlay
      const lightboxOverlay = page.locator('[data-state="open"], [role="dialog"], .bg-black\\/95');
      const lightboxOpen = await lightboxOverlay.count() > 0;

      if (lightboxOpen) {
        await takeScreenshot(page, '05-product-lightbox.png', 'Fullscreen lightbox gallery');

        // Close lightbox with Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        issues.push({ test: 'lightbox', issue: 'Lightbox did not open after click' });
        await takeScreenshot(page, '05-product-lightbox.png', 'Product page (lightbox not opened)');
      }
    } else {
      issues.push({ test: 'lightbox', issue: 'Clickable product image not found' });
      await takeScreenshot(page, '05-product-lightbox.png', 'Product page');
    }

    // ============================================
    // 6. CART DRAWER (Desktop)
    // ============================================
    console.log('\n[6/9] Cart Drawer');
    console.log('-'.repeat(40));

    // Scroll to product details area to ensure elements are visible and not blocked by sidebar
    await page.evaluate(() => {
      const productInfo = document.querySelector('[class*="product-info"], .flex-1');
      if (productInfo) productInfo.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(500);

    // Find and click "Add to Cart" button - button with text containing "корзин"
    const addToCartBtn = page.locator('button:has-text("корзин"), button:has-text("В корзину")').first();

    if (await addToCartBtn.count() > 0) {
      // First select a size if required - use force:true to bypass overlay issues
      const sizeButtons = page.locator('button').filter({ hasText: /^(XS|S|M|L|XL|XXL|ONE SIZE|\d{2})$/ });
      const sizeCount = await sizeButtons.count();

      if (sizeCount > 0) {
        // Click the first available size with force to bypass any overlapping elements
        await sizeButtons.first().click({ force: true, timeout: 5000 });
        await page.waitForTimeout(300);
      }

      await addToCartBtn.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(1500);

      // CartDrawer should open automatically or via "Перейти в корзину"
      const goToCartBtn = page.locator('button:has-text("Перейти в корзину"), a:has-text("Перейти в корзину")').first();

      if (await goToCartBtn.count() > 0) {
        await goToCartBtn.click({ force: true });
        await page.waitForTimeout(1000);
      }

      // Check for CartDrawer or cart content
      const cartContent = page.locator('[class*="drawer"], [class*="Drawer"], aside, [role="dialog"]');
      if (await cartContent.count() > 0) {
        await takeScreenshot(page, '06-cart-drawer-open.png', 'CartDrawer open with product');
      } else {
        await takeScreenshot(page, '06-cart-drawer-open.png', 'Cart view after adding product');
        issues.push({ test: 'cart-drawer', issue: 'CartDrawer element not clearly identified' });
      }
    } else {
      issues.push({ test: 'cart-drawer', issue: 'Add to Cart button not found' });
      await takeScreenshot(page, '06-cart-drawer-open.png', 'Product page (no add-to-cart button)');
    }

    await desktopContext.close();

    // ============================================
    // 7. MOBILE - SUPPORT BUTTON (375x667)
    // ============================================
    console.log('\n[7/9] Mobile Support Button');
    console.log('-'.repeat(40));

    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true
    });
    page = await mobileContext.newPage();

    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // SupportChat button: fixed bottom-20 right-6, shows on md:hidden (mobile only)
    // Has img with src="/support-icon.png" and aria-label="Открыть чат поддержки"
    const supportButton = page.locator('button[aria-label*="чат"], button[aria-label*="поддержки"], img[src*="support"]');
    const supportExists = await supportButton.count() > 0;

    if (!supportExists) {
      issues.push({ test: 'mobile-support', issue: 'Support button not visible on mobile' });
    } else {
      console.log('  Support button found');
    }

    await takeScreenshot(page, '07-mobile-support-button.png', 'Mobile view with support button above navbar');

    // ============================================
    // 8. MOBILE - CATALOG WITH FAVORITES (375x667)
    // ============================================
    console.log('\n[8/9] Mobile Catalog');
    console.log('-'.repeat(40));

    // Scroll down slightly to show product cards better
    await page.evaluate(() => window.scrollBy(0, 150));
    await page.waitForTimeout(500);

    await takeScreenshot(page, '08-mobile-catalog.png', 'Mobile catalog view with product cards');

    await mobileContext.close();

    // ============================================
    // 9. FAVORITES PAGE (Desktop)
    // ============================================
    console.log('\n[9/9] Favorites Page');
    console.log('-'.repeat(40));

    const desktopContext2 = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    page = await desktopContext2.newPage();

    // First add something to favorites
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const heartBtn2 = page.locator('button:has(svg.lucide-heart)').first();
    if (await heartBtn2.count() > 0) {
      await heartBtn2.click();
      await page.waitForTimeout(500);
    }

    // Navigate to favorites page
    await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    await takeScreenshot(page, '09-favorites-page.png', 'Favorites page with saved items');

    await desktopContext2.close();

  } catch (error) {
    issues.push({ test: 'general', issue: error.message, stack: error.stack });
    console.error('\n[ERROR]', error.message);
  }

  await browser.close();

  // ============================================
  // GENERATE REPORT
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  console.log(`\nScreenshots taken: ${screenshots.length}/9`);
  console.log(`Issues found: ${issues.length}`);

  if (issues.length > 0) {
    console.log('\nIssues:');
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. [${issue.test || issue.filename}] ${issue.issue || issue.error}`);
    });
  }

  console.log(`\nOutput directory: ${OUTPUT_DIR}`);

  // Save JSON report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    outputDir: OUTPUT_DIR,
    summary: {
      screenshotsTaken: screenshots.length,
      screenshotsExpected: 9,
      issuesFound: issues.length
    },
    screenshots,
    issues
  };

  const reportPath = join(OUTPUT_DIR, '_report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${reportPath}`);

  // Output final JSON for automated processing
  console.log('\n' + '='.repeat(60));
  console.log('JSON RESULT:');
  console.log(JSON.stringify(report, null, 2));

  process.exit(issues.length > 0 ? 1 : 0);
})();
