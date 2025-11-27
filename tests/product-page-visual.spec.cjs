const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Starting product page visual test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  // Create screenshots dir
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  try {
    // Go to catalog first
    console.log('1. Navigating to catalog...');
    await page.goto('http://localhost:8080/catalog', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Find first product card and get its link
    console.log('2. Finding product cards...');
    const productCards = await page.locator('a[href^="/product/"]').all();
    console.log(`   Found ${productCards.length} product links`);

    if (productCards.length === 0) {
      console.log('ERROR: No product cards found!');
      await page.screenshot({ path: path.join(screenshotsDir, 'no-products.png') });
      await browser.close();
      return;
    }

    // Click first product
    const firstProductLink = productCards[0];
    const href = await firstProductLink.getAttribute('href');
    console.log(`3. Clicking on product: ${href}`);
    await firstProductLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Take screenshot of product page
    console.log('4. Taking screenshot of product page...');
    await page.screenshot({
      path: path.join(screenshotsDir, 'product-page-desktop.png'),
      fullPage: true
    });

    // Check for images
    console.log('5. Checking images on the page...');
    const images = await page.locator('img').all();
    console.log(`   Found ${images.length} images total`);

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = await img.getAttribute('src');
      const isVisible = await img.isVisible();
      const box = await img.boundingBox();
      console.log(`   Image ${i + 1}: visible=${isVisible}, src=${src?.substring(0, 60)}...`);
      if (box) {
        console.log(`            size: ${box.width}x${box.height}`);
      }
    }

    // Check carousel structure
    console.log('\n6. Checking carousel structure...');
    const carouselTrack = await page.locator('.flex.transition-transform, .flex[style*="transform"]').first();
    if (await carouselTrack.isVisible()) {
      console.log('   Carousel track found');
      const style = await carouselTrack.getAttribute('style');
      console.log(`   Style: ${style}`);
    }

    // Check dots
    const dots = await page.locator('button[aria-label^="Фото"]').all();
    console.log(`   Found ${dots.length} navigation dots`);

    // Check for TransformWrapper (zoom container)
    const zoomContainer = await page.locator('[class*="react-transform"]').all();
    console.log(`   Zoom containers: ${zoomContainer.length}`);

    // Mobile viewport test
    console.log('\n7. Testing mobile viewport...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotsDir, 'product-page-mobile.png'),
      fullPage: true
    });

    // Check if hint text is visible
    const hint = await page.locator('text=Двойной тап').first();
    if (await hint.isVisible()) {
      console.log('   Mobile hint is visible: OK');
    }

    // Log any console errors
    console.log('\n8. Checking console for errors...');

    console.log('\n========================================');
    console.log('Screenshots saved to tests/screenshots/');
    console.log('========================================\n');

    // Keep browser open for 10 seconds for inspection
    console.log('Browser will stay open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png') });
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
