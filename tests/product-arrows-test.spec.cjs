const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Testing product image navigation on PRODUCTION...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  // Mobile viewport
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, 'screenshots', 'arrows-test');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // Go to production catalog
    console.log('1. Opening production catalog...');
    await page.goto('http://localhost:8080/catalog', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Find first product with multiple images (has dots)
    console.log('2. Finding a product...');
    const productLinks = await page.locator('a[href^="/product/"]').all();
    console.log(`   Found ${productLinks.length} products`);

    if (productLinks.length === 0) {
      console.log('ERROR: No products found!');
      await browser.close();
      return;
    }

    // Click first product
    await productLinks[0].click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    console.log('3. On product page, checking for arrows...');

    // Check for navigation arrows
    const prevArrow = page.locator('button[aria-label="Предыдущее фото"]');
    const nextArrow = page.locator('button[aria-label="Следующее фото"]');

    const hasPrevArrow = await prevArrow.count() > 0;
    const hasNextArrow = await nextArrow.count() > 0;

    console.log(`   Prev arrow exists: ${hasPrevArrow}`);
    console.log(`   Next arrow exists: ${hasNextArrow}`);

    // Check dots
    const dots = await page.locator('button[aria-label^="Фото"]').all();
    console.log(`   Navigation dots: ${dots.length}`);

    if (dots.length <= 1) {
      console.log('   This product has only 1 image, trying another...');
      await page.goBack();
      await page.waitForTimeout(2000);
      if (productLinks.length > 1) {
        await productLinks[2].click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
      }
    }

    // Get current image src
    const getImageSrc = async () => {
      const img = page.locator('.overflow-hidden.touch-pan-y img').first();
      if (await img.count() > 0) {
        return await img.getAttribute('src');
      }
      // Fallback: any product image
      const anyImg = page.locator('img[alt]').first();
      return await anyImg.getAttribute('src');
    };

    // Get active dot index
    const getActiveDot = async () => {
      const allDots = await page.locator('button[aria-label^="Фото"] span').all();
      for (let i = 0; i < allDots.length; i++) {
        const classes = await allDots[i].getAttribute('class');
        if (classes && classes.includes('bg-foreground')) {
          return i;
        }
      }
      return -1;
    };

    // Take initial screenshot
    console.log('\n4. Taking screenshots of arrow navigation...');

    const initialSrc = await getImageSrc();
    const initialDot = await getActiveDot();
    console.log(`   Initial image: ${initialSrc?.substring(0, 60)}...`);
    console.log(`   Initial active dot: ${initialDot}`);

    await page.screenshot({
      path: path.join(screenshotsDir, '01-initial.png'),
      fullPage: false
    });
    console.log('   Screenshot: 01-initial.png');

    // Click NEXT arrow
    if (hasNextArrow) {
      console.log('\n5. Clicking NEXT arrow...');
      await nextArrow.click();
      await page.waitForTimeout(1000);

      const afterNextSrc = await getImageSrc();
      const afterNextDot = await getActiveDot();
      console.log(`   After NEXT - Image: ${afterNextSrc?.substring(0, 60)}...`);
      console.log(`   After NEXT - Active dot: ${afterNextDot}`);
      console.log(`   Image CHANGED: ${initialSrc !== afterNextSrc}`);
      console.log(`   Dot CHANGED: ${initialDot !== afterNextDot}`);

      await page.screenshot({
        path: path.join(screenshotsDir, '02-after-next.png'),
        fullPage: false
      });
      console.log('   Screenshot: 02-after-next.png');

      // Click NEXT again
      console.log('\n6. Clicking NEXT arrow again...');
      await nextArrow.click();
      await page.waitForTimeout(1000);

      const afterNext2Src = await getImageSrc();
      const afterNext2Dot = await getActiveDot();
      console.log(`   After 2nd NEXT - Image: ${afterNext2Src?.substring(0, 60)}...`);
      console.log(`   After 2nd NEXT - Active dot: ${afterNext2Dot}`);
      console.log(`   Image CHANGED from prev: ${afterNextSrc !== afterNext2Src}`);

      await page.screenshot({
        path: path.join(screenshotsDir, '03-after-next-2.png'),
        fullPage: false
      });
      console.log('   Screenshot: 03-after-next-2.png');
    }

    // Click PREV arrow
    if (hasPrevArrow) {
      console.log('\n7. Clicking PREV arrow...');
      await prevArrow.click();
      await page.waitForTimeout(1000);

      const afterPrevSrc = await getImageSrc();
      const afterPrevDot = await getActiveDot();
      console.log(`   After PREV - Image: ${afterPrevSrc?.substring(0, 60)}...`);
      console.log(`   After PREV - Active dot: ${afterPrevDot}`);

      await page.screenshot({
        path: path.join(screenshotsDir, '04-after-prev.png'),
        fullPage: false
      });
      console.log('   Screenshot: 04-after-prev.png');
    }

    // Test clicking on dots directly
    console.log('\n8. Testing dot click navigation...');
    const dotsAfter = await page.locator('button[aria-label^="Фото"]').all();
    if (dotsAfter.length > 2) {
      const lastDotIndex = dotsAfter.length - 1;
      console.log(`   Clicking dot ${lastDotIndex + 1} (last)...`);
      await dotsAfter[lastDotIndex].click();
      await page.waitForTimeout(1000);

      const afterDotSrc = await getImageSrc();
      const afterDotActive = await getActiveDot();
      console.log(`   After dot click - Active dot: ${afterDotActive}`);
      console.log(`   Expected dot: ${lastDotIndex}, Got: ${afterDotActive}`);

      await page.screenshot({
        path: path.join(screenshotsDir, '05-after-dot-click.png'),
        fullPage: false
      });
      console.log('   Screenshot: 05-after-dot-click.png');
    }

    console.log('\n========================================');
    console.log(`Screenshots saved to: tests/screenshots/arrows-test/`);
    console.log('========================================\n');

    // Keep browser open for manual inspection
    console.log('Browser staying open for 15 seconds...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png') });
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
