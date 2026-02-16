import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '..', 'screenshots-output', 'mobile-support-button');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

// Expected selector for support button
const SUPPORT_BUTTON_SELECTOR = 'button.fixed.bottom-20.right-6, [class*="fixed"][class*="bottom-20"][class*="right-6"], button[aria-label*="поддержк"], button[aria-label*="чат"]';

async function testMobileSupportButton() {
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const results = {
    test_file: path.join(__dirname, 'mobile-support-button.mjs'),
    checks: [],
    ready: false,
    screenshots: [],
    errors: []
  };

  try {
    // ========== TEST 1: MOBILE VIEW - Button should be VISIBLE ==========
    console.log('1. Testing mobile view (375x667) - button should be VISIBLE...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobilePage.waitForTimeout(2000);

    // Check if button exists and is visible
    const mobileButton = await mobilePage.$(SUPPORT_BUTTON_SELECTOR);
    const isMobileVisible = mobileButton ? await mobileButton.isVisible() : false;

    if (isMobileVisible) {
      console.log('  ✓ Mobile button is VISIBLE');
      results.checks.push('mobile_visible');

      // Take screenshot
      const mobileScreenshotPath = path.join(outputDir, 'mobile-support-button-visible.png');
      await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: false });
      console.log(`  Screenshot saved: ${mobileScreenshotPath}`);
      results.screenshots.push({
        viewport: 'mobile_375x667',
        path: mobileScreenshotPath,
        button_visible: true
      });
    } else {
      console.log('  ✗ Mobile button is NOT visible (FAILED)');
      results.errors.push('Mobile button not visible at 375x667');

      // Take screenshot anyway for debugging
      const mobileScreenshotPath = path.join(outputDir, 'mobile-support-button-missing.png');
      await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: false });
      results.screenshots.push({
        viewport: 'mobile_375x667',
        path: mobileScreenshotPath,
        button_visible: false
      });
    }

    await mobileContext.close();

    // ========== TEST 2: DESKTOP VIEW - Button should be HIDDEN ==========
    console.log('2. Testing desktop view (1920x1080) - button should be HIDDEN...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const desktopPage = await desktopContext.newPage();

    await desktopPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await desktopPage.waitForTimeout(2000);

    // Check if button exists and is hidden
    const desktopButton = await desktopPage.$(SUPPORT_BUTTON_SELECTOR);
    const isDesktopVisible = desktopButton ? await desktopButton.isVisible() : false;

    if (!isDesktopVisible) {
      console.log('  ✓ Desktop button is HIDDEN');
      results.checks.push('desktop_hidden');

      // Take screenshot
      const desktopScreenshotPath = path.join(outputDir, 'desktop-support-button-hidden.png');
      await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: false });
      console.log(`  Screenshot saved: ${desktopScreenshotPath}`);
      results.screenshots.push({
        viewport: 'desktop_1920x1080',
        path: desktopScreenshotPath,
        button_visible: false
      });
    } else {
      console.log('  ✗ Desktop button is VISIBLE (FAILED - should be hidden)');
      results.errors.push('Desktop button visible at 1920x1080 (should be hidden)');

      // Take screenshot for debugging
      const desktopScreenshotPath = path.join(outputDir, 'desktop-support-button-wrong.png');
      await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: false });
      results.screenshots.push({
        viewport: 'desktop_1920x1080',
        path: desktopScreenshotPath,
        button_visible: true
      });
    }

    await desktopContext.close();

    // ========== TEST 3: BUTTON POSITION (Bottom-Right Corner) ==========
    if (mobileButton && isMobileVisible) {
      console.log('3. Testing button position (bottom-right corner)...');

      // Re-open mobile context for position check
      const positionContext = await browser.newContext({
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true
      });
      const positionPage = await positionContext.newPage();
      await positionPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await positionPage.waitForTimeout(2000);

      const button = await positionPage.$(SUPPORT_BUTTON_SELECTOR);
      if (button) {
        const boundingBox = await button.boundingBox();
        const viewport = positionPage.viewportSize();

        // Check if button is in bottom-right corner
        // Button should be close to right edge and bottom edge
        const isRightAligned = boundingBox.x + boundingBox.width > viewport.width * 0.8;
        const isBottomAligned = boundingBox.y + boundingBox.height > viewport.height * 0.8;

        if (isRightAligned && isBottomAligned) {
          console.log(`  ✓ Button position correct: x=${boundingBox.x.toFixed(0)}, y=${boundingBox.y.toFixed(0)}`);
          results.checks.push('position_correct');
        } else {
          console.log(`  ✗ Button position incorrect: x=${boundingBox.x.toFixed(0)}, y=${boundingBox.y.toFixed(0)}`);
          results.errors.push(`Button position wrong: x=${boundingBox.x.toFixed(0)}, y=${boundingBox.y.toFixed(0)}`);
        }
      }

      await positionContext.close();
    } else {
      console.log('3. Skipping position check (button not visible on mobile)');
    }

    // ========== TEST 4: Z-INDEX CHECK ==========
    if (mobileButton && isMobileVisible) {
      console.log('4. Testing z-index (should be above other elements)...');

      const zIndexContext = await browser.newContext({
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true
      });
      const zIndexPage = await zIndexContext.newPage();
      await zIndexPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await zIndexPage.waitForTimeout(2000);

      const button = await zIndexPage.$(SUPPORT_BUTTON_SELECTOR);
      if (button) {
        const zIndex = await button.evaluate(el => window.getComputedStyle(el).zIndex);
        const zIndexNum = parseInt(zIndex);

        // Z-index should be reasonably high (e.g., > 100 for overlay elements)
        if (!isNaN(zIndexNum) && zIndexNum > 100) {
          console.log(`  ✓ Z-index is high enough: ${zIndexNum}`);
          results.checks.push('zindex_correct');
        } else {
          console.log(`  ✗ Z-index might be too low: ${zIndex}`);
          results.errors.push(`Z-index low: ${zIndex}`);
        }
      }

      await zIndexContext.close();
    } else {
      console.log('4. Skipping z-index check (button not visible on mobile)');
    }

    // Determine if test is ready (all checks passed)
    results.ready = results.checks.includes('mobile_visible') &&
                    results.checks.includes('desktop_hidden') &&
                    results.checks.includes('position_correct');

  } catch (error) {
    console.error('Error during testing:', error);
    results.errors.push(error.message);
    results.ready = false;
  } finally {
    await browser.close();
  }

  // Output final result
  console.log('\n========== FINAL RESULT ==========');
  console.log(JSON.stringify(results, null, 2));

  return results;
}

testMobileSupportButton();
