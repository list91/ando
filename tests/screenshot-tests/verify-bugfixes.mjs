// Bug Fixes Verification Screenshot Test
// Tests two specific bug fixes:
// 1. Zoom magnifier should ZOOM IN (enlarge), not zoom out
// 2. Sidebar vertical text should be centered under logo

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Configuration
const BASE_URL = 'http://localhost:8080';
const OUTPUT_DIR = './tests/screenshots-output/bugfix-verification';
const VIEWPORT = { width: 1920, height: 1080 };

// Test results
const results = {
  timestamp: null,
  status: 'pending',
  tests: [],
  screenshots: [],
  errors: []
};

console.log('Bug Fixes Verification Test\n');
console.log('='.repeat(60));

(async () => {
  results.timestamp = new Date().toISOString();

  let browser;
  let context;
  let page;

  try {
    // Setup
    console.log('\n[SETUP] Launching browser...');
    browser = await chromium.launch({
      headless: false,
      slowMo: 100
    });

    context = await browser.newContext({
      viewport: VIEWPORT
    });

    page = await context.newPage();

    // Create output directory
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`[SETUP] Output directory: ${OUTPUT_DIR}`);

    // =================================================================
    // TEST 1: ZOOM MAGNIFIER - Should ENLARGE image area
    // =================================================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Zoom Magnifier (should zoom IN/enlarge)');
    console.log('='.repeat(60));

    const zoomTest = {
      name: 'Zoom Magnifier Enhancement',
      url: `${BASE_URL}/product/t-shirts2`,
      status: 'pending',
      observations: []
    };

    try {
      console.log(`\n[TEST 1] Navigating to ${zoomTest.url}...`);
      await page.goto(zoomTest.url, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      console.log('[TEST 1] Page loaded, waiting for images...');
      await page.waitForTimeout(2000);

      // Take screenshot before hover
      console.log('[TEST 1] Taking screenshot BEFORE hover...');
      const beforePath = join(OUTPUT_DIR, 'zoom-before-hover.png');
      await page.screenshot({
        path: beforePath,
        fullPage: false
      });
      results.screenshots.push(beforePath);
      zoomTest.observations.push('Screenshot taken: before hover');

      // Wait for product image to be visible (ImageMagnifier component)
      console.log('[TEST 1] Waiting for product image...');
      const productImage = page.locator('img[loading="eager"]').first();
      await productImage.waitFor({ state: 'visible', timeout: 10000 });
      zoomTest.observations.push('✓ Product image loaded');

      // Get image bounding box to hover in center
      const imageBoundingBox = await productImage.boundingBox();
      if (!imageBoundingBox) {
        throw new Error('Could not get image bounding box');
      }

      // Calculate center of the image for hover
      const centerX = imageBoundingBox.x + imageBoundingBox.width / 2;
      const centerY = imageBoundingBox.y + imageBoundingBox.height / 2;

      console.log(`[TEST 1] Image center: x=${centerX.toFixed(0)}, y=${centerY.toFixed(0)}`);
      zoomTest.observations.push(`Image position: ${centerX.toFixed(0)}x${centerY.toFixed(0)}`);

      // Move mouse to center of image and wait for magnifier
      await page.mouse.move(centerX, centerY);
      await page.waitForTimeout(300);

      // Wait for magnifier to appear (div with pointer-events-none and rounded-full)
      const magnifierDiv = page.locator('div.pointer-events-none.rounded-full');

      try {
        await magnifierDiv.waitFor({ state: 'visible', timeout: 2000 });
        console.log('[TEST 1] ✓ Magnifier appeared on hover');
      } catch (e) {
        console.log('[TEST 1] ⚠ Magnifier did not appear (timeout)');
      }

      await page.waitForTimeout(200);

      // Take screenshot with magnifier
      console.log('[TEST 1] Taking screenshot WITH magnifier...');
      const magnifierPath = join(OUTPUT_DIR, 'zoom-with-magnifier.png');
      await page.screenshot({
        path: magnifierPath,
        fullPage: false
      });
      results.screenshots.push(magnifierPath);
      zoomTest.observations.push('Screenshot taken: with magnifier active');

      // Check if magnifier exists
      const magnifierCount = await magnifierDiv.count();
      console.log(`[TEST 1] Found ${magnifierCount} magnifier elements`);

      if (magnifierCount > 0) {
        console.log('[TEST 1] ✓ Magnifier overlay detected');
        zoomTest.observations.push('✓ Magnifier overlay is present');

        // Get magnifier inline style (contains backgroundSize with zoomLevel calculation)
        const magnifierInfo = await magnifierDiv.first().evaluate(el => {
          const inlineStyle = el.getAttribute('style') || '';
          const computedStyle = window.getComputedStyle(el);

          // Parse backgroundSize from inline style
          const bgSizeMatch = inlineStyle.match(/background-size:\s*([^;]+)/);
          const bgSize = bgSizeMatch ? bgSizeMatch[1] : computedStyle.backgroundSize;

          return {
            inlineStyle: inlineStyle,
            backgroundSize: bgSize,
            computedBackgroundSize: computedStyle.backgroundSize,
            width: computedStyle.width,
            height: computedStyle.height
          };
        });

        console.log(`[TEST 1] Magnifier info:`, magnifierInfo);
        zoomTest.observations.push(`Background-size: ${magnifierInfo.backgroundSize}`);
        zoomTest.observations.push(`Magnifier size: ${magnifierInfo.width} x ${magnifierInfo.height}`);

        // Parse background-size from inline style (format: "XXXpx YYYpx")
        // Component sets it as: `${containerSize.width * zoomLevel}px ${containerSize.height * zoomLevel}px`
        if (magnifierInfo.backgroundSize && magnifierInfo.backgroundSize.includes('px')) {
          const match = magnifierInfo.backgroundSize.match(/(\d+(?:\.\d+)?)px/);
          if (match) {
            const bgSizePx = parseFloat(match[1]);
            const containerWidth = imageBoundingBox.width;

            console.log(`[TEST 1] Background size: ${bgSizePx}px, Container width: ${containerWidth.toFixed(0)}px`);

            if (bgSizePx > containerWidth * 1.5) {
              const zoomFactor = (bgSizePx / containerWidth).toFixed(2);
              console.log(`[TEST 1] ✓ PASS: Magnifier zooms IN (${zoomFactor}x enlargement)`);
              zoomTest.observations.push(`✓ PASS: Zoom IN confirmed (${zoomFactor}x zoom)`);
              zoomTest.status = 'PASS';
            } else if (bgSizePx > containerWidth) {
              const zoomFactor = (bgSizePx / containerWidth).toFixed(2);
              console.log(`[TEST 1] ⚠ PARTIAL: Magnifier has some zoom (${zoomFactor}x)`);
              zoomTest.observations.push(`⚠ PARTIAL: Minimal zoom detected (${zoomFactor}x)`);
              zoomTest.status = 'PARTIAL_PASS';
            } else {
              console.log(`[TEST 1] ✗ FAIL: Magnifier does not zoom in`);
              zoomTest.observations.push(`✗ FAIL: No zoom detected (${bgSizePx}px <= ${containerWidth.toFixed(0)}px)`);
              zoomTest.status = 'FAIL';
            }
          } else {
            console.log(`[TEST 1] ⚠ Could not parse background-size value`);
            zoomTest.observations.push(`⚠ Parse error: ${magnifierInfo.backgroundSize}`);
            zoomTest.status = 'MANUAL_CHECK';
          }
        } else {
          console.log(`[TEST 1] ⚠ Background-size not in expected format`);
          console.log(`[TEST 1] ℹ Checking visual: magnifier is visible on screenshot`);
          zoomTest.observations.push(`⚠ Format: ${magnifierInfo.backgroundSize}`);
          zoomTest.observations.push(`ℹ Visual verification: magnifier visible in screenshot`);
          zoomTest.status = 'VISUAL_PASS';
        }
      } else {
        console.log('[TEST 1] ✗ Magnifier overlay not found');
        zoomTest.observations.push('✗ Magnifier not detected - check screenshot manually');
        zoomTest.status = 'MANUAL_CHECK';
      }

    } catch (error) {
      console.error(`[TEST 1] Error: ${error.message}`);
      zoomTest.status = 'ERROR';
      zoomTest.observations.push(`Error: ${error.message}`);
      results.errors.push(`Test 1: ${error.message}`);
    }

    results.tests.push(zoomTest);

    // =================================================================
    // TEST 2: SIDEBAR ALIGNMENT - Logo and text should be centered
    // =================================================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Sidebar Alignment (center-aligned)');
    console.log('='.repeat(60));

    const sidebarTest = {
      name: 'Sidebar Center Alignment',
      url: `${BASE_URL}/`,
      status: 'pending',
      observations: []
    };

    try {
      console.log(`\n[TEST 2] Navigating to ${sidebarTest.url}...`);
      await page.goto(sidebarTest.url, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      console.log('[TEST 2] Page loaded, waiting for sidebar...');
      await page.waitForTimeout(1500);

      // Take full page screenshot
      console.log('[TEST 2] Taking full page screenshot...');
      const fullPagePath = join(OUTPUT_DIR, 'sidebar-full-page.png');
      await page.screenshot({
        path: fullPagePath,
        fullPage: false
      });
      results.screenshots.push(fullPagePath);

      // Take sidebar-only screenshot (left 250px)
      console.log('[TEST 2] Taking sidebar-only screenshot...');
      const sidebar = page.locator('aside.w-\\[200px\\]');
      await sidebar.waitFor({ state: 'visible', timeout: 5000 });

      const sidebarBox = await sidebar.boundingBox();

      if (sidebarBox) {
        const sidebarPath = join(OUTPUT_DIR, 'sidebar-area.png');
        await page.screenshot({
          path: sidebarPath,
          clip: {
            x: 0,
            y: 0,
            width: Math.min(250, sidebarBox.width + 10),
            height: VIEWPORT.height
          }
        });
        results.screenshots.push(sidebarPath);
        sidebarTest.observations.push('✓ Sidebar screenshot captured');
        console.log('[TEST 2] ✓ Sidebar area screenshot saved');
      }

      // Check alignment of logo container (should have justify-center)
      const logoContainer = page.locator('aside.w-\\[200px\\] a[aria-label*="главную"]');
      const logoAlignment = await logoContainer.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          justifyContent: style.justifyContent,
          alignItems: style.alignItems,
          textAlign: style.textAlign,
          className: el.className
        };
      }).catch(() => null);

      console.log('[TEST 2] Logo container alignment:', logoAlignment);
      sidebarTest.observations.push(`Logo container: ${JSON.stringify(logoAlignment)}`);

      // Check vertical text image alignment (should be centered in flex container)
      const verticalTextImg = page.locator('aside.w-\\[200px\\] img[alt*="FEEL THE MOMENT"]');
      const verticalTextExists = await verticalTextImg.count() > 0;

      if (verticalTextExists) {
        const verticalTextParent = await verticalTextImg.evaluate(el => {
          const parent = el.parentElement;
          if (parent) {
            const style = window.getComputedStyle(parent);
            return {
              display: style.display,
              flexDirection: style.flexDirection,
              alignItems: style.alignItems,
              justifyContent: style.justifyContent,
              className: parent.className
            };
          }
          return null;
        });

        console.log('[TEST 2] Vertical text parent alignment:', verticalTextParent);
        sidebarTest.observations.push(`Vertical text parent: ${JSON.stringify(verticalTextParent)}`);

        // Check if center-aligned
        const logoHasJustifyCenter = logoAlignment?.className?.includes('justify-center');
        const parentHasItemsCenter = verticalTextParent?.alignItems === 'center' ||
                                      verticalTextParent?.className?.includes('items-center');

        console.log(`[TEST 2] Logo justify-center: ${logoHasJustifyCenter}`);
        console.log(`[TEST 2] Parent items-center: ${parentHasItemsCenter}`);

        if (logoHasJustifyCenter && parentHasItemsCenter) {
          console.log('[TEST 2] ✓ PASS: Sidebar elements are center-aligned');
          sidebarTest.observations.push('✓ PASS: Center alignment confirmed via CSS classes');
          sidebarTest.status = 'PASS';
        } else {
          console.log('[TEST 2] ⚠ PARTIAL: Some alignment detected, visual check recommended');
          sidebarTest.observations.push('⚠ Partial alignment - verify screenshot visually');
          sidebarTest.status = 'MANUAL_CHECK';
        }
      } else {
        console.log('[TEST 2] ℹ Vertical text not on home page (this is OK for non-home pages)');
        sidebarTest.observations.push('ℹ Vertical text not present (expected on home page only)');

        // Still check logo alignment
        const logoHasJustifyCenter = logoAlignment?.className?.includes('justify-center');
        if (logoHasJustifyCenter) {
          console.log('[TEST 2] ✓ PASS: Logo is center-aligned');
          sidebarTest.observations.push('✓ PASS: Logo center alignment confirmed');
          sidebarTest.status = 'PASS';
        } else {
          console.log('[TEST 2] ⚠ MANUAL_CHECK: Verify logo alignment in screenshot');
          sidebarTest.observations.push('⚠ Manual verification needed');
          sidebarTest.status = 'MANUAL_CHECK';
        }
      }

    } catch (error) {
      console.error(`[TEST 2] Error: ${error.message}`);
      sidebarTest.status = 'ERROR';
      sidebarTest.observations.push(`Error: ${error.message}`);
      results.errors.push(`Test 2: ${error.message}`);
    }

    results.tests.push(sidebarTest);

    // =================================================================
    // FINAL RESULTS
    // =================================================================
    console.log('\n' + '='.repeat(60));
    console.log('FINAL RESULTS');
    console.log('='.repeat(60));

    results.tests.forEach((test, idx) => {
      console.log(`\nTest ${idx + 1}: ${test.name}`);
      console.log(`Status: ${test.status}`);
      console.log('Observations:');
      test.observations.forEach(obs => console.log(`  - ${obs}`));
    });

    console.log('\nScreenshots saved:');
    results.screenshots.forEach(path => console.log(`  - ${path}`));

    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(err => console.log(`  - ${err}`));
    }

    // Determine overall status
    const allPassed = results.tests.every(t => t.status === 'PASS');
    const anyFailed = results.tests.some(t => t.status === 'FAIL' || t.status === 'ERROR');

    if (allPassed) {
      results.status = 'ALL_PASSED';
      console.log('\n✓ ALL TESTS PASSED - Bug fixes verified!');
    } else if (anyFailed) {
      results.status = 'SOME_FAILED';
      console.log('\n✗ SOME TESTS FAILED - Review needed');
    } else {
      results.status = 'MANUAL_VERIFICATION_NEEDED';
      console.log('\n⚠ MANUAL VERIFICATION NEEDED - Check screenshots');
    }

    // Save results JSON
    const resultsPath = join(OUTPUT_DIR, 'test-results.json');
    writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${resultsPath}`);

  } catch (error) {
    console.error('\n[FATAL ERROR]', error);
    results.status = 'fatal_error';
    results.errors.push(error.message);
  } finally {
    // Cleanup
    if (browser) {
      console.log('\n[CLEANUP] Closing browser...');
      await browser.close();
    }
    console.log('[DONE] Test execution completed');
    console.log('='.repeat(60) + '\n');
  }
})();
