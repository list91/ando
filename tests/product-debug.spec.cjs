const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Debugging product page images...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    console.log('FAILED REQUEST:', request.url(), request.failure()?.errorText);
  });

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  try {
    // Go directly to a product page
    console.log('1. Navigating to product page...');
    await page.goto('http://localhost:8080/product/t-shirts2', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check the carousel container
    console.log('\n2. Inspecting carousel container...');

    const container = await page.locator('.overflow-hidden.touch-pan-y').first();
    if (await container.count() > 0) {
      const box = await container.boundingBox();
      console.log('   Container bounding box:', box);

      const containerStyles = await container.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          width: styles.width,
          height: styles.height,
          overflow: styles.overflow,
          display: styles.display
        };
      });
      console.log('   Container styles:', containerStyles);
    } else {
      console.log('   Container NOT FOUND!');
    }

    // Check the carousel track (the flex container with transform)
    console.log('\n3. Inspecting carousel track...');
    const track = await page.locator('[style*="width: 300%"]').first();
    if (await track.count() > 0) {
      const trackBox = await track.boundingBox();
      console.log('   Track bounding box:', trackBox);

      const trackStyles = await track.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          width: styles.width,
          height: styles.height,
          transform: styles.transform,
          display: styles.display
        };
      });
      console.log('   Track styles:', trackStyles);
    } else {
      console.log('   Track NOT FOUND!');
    }

    // Check individual images
    console.log('\n4. Inspecting images...');
    const productImages = await page.locator('.overflow-hidden.touch-pan-y img').all();
    console.log(`   Found ${productImages.length} images in carousel`);

    for (let i = 0; i < productImages.length; i++) {
      const img = productImages[i];
      const src = await img.getAttribute('src');
      const naturalSize = await img.evaluate(el => ({
        naturalWidth: el.naturalWidth,
        naturalHeight: el.naturalHeight,
        complete: el.complete,
        currentSrc: el.currentSrc
      }));
      const computedStyles = await img.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          width: styles.width,
          height: styles.height,
          visibility: styles.visibility,
          opacity: styles.opacity,
          display: styles.display
        };
      });

      console.log(`\n   Image ${i + 1}:`);
      console.log(`   - src: ${src?.substring(0, 80)}...`);
      console.log(`   - natural size: ${naturalSize.naturalWidth}x${naturalSize.naturalHeight}`);
      console.log(`   - complete: ${naturalSize.complete}`);
      console.log(`   - computed styles:`, computedStyles);
    }

    // Check TransformWrapper
    console.log('\n5. Checking TransformWrapper...');
    const transformWrapper = await page.locator('.react-transform-wrapper').first();
    if (await transformWrapper.count() > 0) {
      const wrapperBox = await transformWrapper.boundingBox();
      console.log('   TransformWrapper bounding box:', wrapperBox);
    } else {
      console.log('   TransformWrapper NOT FOUND');
    }

    // Take a close-up screenshot of the image area
    console.log('\n6. Taking debug screenshots...');

    // Highlight the carousel area
    await page.evaluate(() => {
      const container = document.querySelector('.overflow-hidden.touch-pan-y');
      if (container) {
        container.style.border = '3px solid red';
      }
      const track = document.querySelector('[style*="width: 300%"]');
      if (track) {
        track.style.border = '2px solid blue';
      }
      const imgs = document.querySelectorAll('.overflow-hidden.touch-pan-y img');
      imgs.forEach(img => {
        img.style.border = '2px solid green';
      });
    });

    await page.screenshot({
      path: path.join(screenshotsDir, 'debug-highlighted.png'),
      fullPage: true
    });

    // Check if images load directly
    console.log('\n7. Testing direct image URL access...');
    const firstImgSrc = await productImages[0]?.getAttribute('src');
    if (firstImgSrc) {
      const imgPage = await context.newPage();
      const response = await imgPage.goto(firstImgSrc);
      console.log(`   Direct image load status: ${response?.status()}`);
      await imgPage.close();
    }

    console.log('\n========================================');
    console.log('Debug complete. Check screenshots/debug-highlighted.png');
    console.log('========================================\n');

    // Keep browser open for inspection
    console.log('Browser staying open for 15 seconds for manual inspection...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'debug-error.png') });
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
