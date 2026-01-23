const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8087';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'baseline');

async function captureBaselineScreenshots() {
  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  let browser;
  const results = [];

  try {
    console.log('Launching browser...');
    browser = await chromium.launch({ headless: true });

    // ========================================
    // Screenshot 1: Admin Orders (Правка 13)
    // ========================================
    console.log('\n=== Правка 13: Admin Orders ===');
    {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/admin/orders`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        await page.waitForTimeout(2000);

        const screenshotPath = path.join(SCREENSHOT_DIR, 'baseline-13-admin-orders.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Created: ${screenshotPath}`);
        results.push({ name: 'baseline-13-admin-orders.png', path: screenshotPath, success: true });
      } catch (error) {
        console.error('Error with admin/orders:', error.message);
        results.push({ name: 'baseline-13-admin-orders.png', success: false, error: error.message });
      }

      await context.close();
    }

    // ========================================
    // Screenshot 2: Home Desktop (Правка 17)
    // ========================================
    console.log('\n=== Правка 17: Home Desktop ===');
    {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        await page.waitForTimeout(2000);

        const screenshotPath = path.join(SCREENSHOT_DIR, 'baseline-17-home-desktop.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Created: ${screenshotPath}`);
        results.push({ name: 'baseline-17-home-desktop.png', path: screenshotPath, success: true });
      } catch (error) {
        console.error('Error with home desktop:', error.message);
        results.push({ name: 'baseline-17-home-desktop.png', success: false, error: error.message });
      }

      await context.close();
    }

    // ========================================
    // Screenshot 3: Home Mobile (Правка 17)
    // ========================================
    console.log('\n=== Правка 17: Home Mobile ===');
    {
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 }
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        await page.waitForTimeout(2000);

        const screenshotPath = path.join(SCREENSHOT_DIR, 'baseline-17-home-mobile.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Created: ${screenshotPath}`);
        results.push({ name: 'baseline-17-home-mobile.png', path: screenshotPath, success: true });
      } catch (error) {
        console.error('Error with home mobile:', error.message);
        results.push({ name: 'baseline-17-home-mobile.png', success: false, error: error.message });
      }

      await context.close();
    }

    // ========================================
    // Screenshot 4: Product Colors (Правка 20)
    // ========================================
    console.log('\n=== Правка 20: Product Colors ===');
    {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });
      const page = await context.newPage();

      try {
        // First go to catalog to find a product
        await page.goto(`${BASE_URL}/catalog`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        await page.waitForTimeout(2000);

        // Find first product link
        const productLink = await page.locator('a[href*="/product/"]').first();
        const href = await productLink.getAttribute('href');

        if (href) {
          console.log(`Found product: ${href}`);
          await page.goto(`${BASE_URL}${href}`, {
            waitUntil: 'networkidle',
            timeout: 30000
          });
          await page.waitForTimeout(2000);

          const screenshotPath = path.join(SCREENSHOT_DIR, 'baseline-20-product-colors.png');
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`Created: ${screenshotPath}`);
          results.push({ name: 'baseline-20-product-colors.png', path: screenshotPath, success: true });
        } else {
          throw new Error('No product links found on catalog page');
        }
      } catch (error) {
        console.error('Error with product colors:', error.message);
        results.push({ name: 'baseline-20-product-colors.png', success: false, error: error.message });
      }

      await context.close();
    }

    await browser.close();

    // Print summary
    console.log('\n========================================');
    console.log('BASELINE SCREENSHOTS SUMMARY');
    console.log('========================================');
    results.forEach(r => {
      if (r.success) {
        console.log(`[OK] ${r.name}`);
        console.log(`     ${r.path}`);
      } else {
        console.log(`[FAIL] ${r.name}: ${r.error}`);
      }
    });
    console.log('========================================\n');

    return results;
  } catch (error) {
    console.error('Fatal error:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

captureBaselineScreenshots()
  .then(results => {
    const successCount = results.filter(r => r.success).length;
    console.log(`Done: ${successCount}/${results.length} screenshots created`);
    process.exit(successCount === results.length ? 0 : 1);
  })
  .catch(error => {
    console.error('Script failed:', error.message);
    process.exit(1);
  });
