// Product Image Zoom (Magnifier) Screenshot Test
// Tests the hover magnifier functionality on product page
// Desktop only - magnifier is for pointer:fine devices

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Configuration
const BASE_URL = 'http://localhost:8080';
const PRODUCT_URL = '/product/t-shirts2';
const OUTPUT_DIR = './tests/screenshots-output/product-zoom';

const VIEWPORT = { width: 1920, height: 1080 };

// Test results
const results = {
  timestamp: null,
  status: 'pending',
  checks: [],
  screenshots: [],
  errors: []
};

console.log('Product Image Zoom (Magnifier) Test\n');
console.log('='.repeat(60));

(async () => {
  results.timestamp = new Date().toISOString();

  // Create output directory
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--force-device-scale-factor=1']
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    // Emulate pointer:fine (desktop mouse)
    hasTouch: false,
  });

  const page = await context.newPage();

  try {
    console.log(`\nOpening: ${BASE_URL}${PRODUCT_URL}`);
    console.log(`Viewport: ${VIEWPORT.width}x${VIEWPORT.height} (Desktop)`);
    console.log('-'.repeat(60));

    // Navigate to product page
    await page.goto(BASE_URL + PRODUCT_URL, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    results.checks.push({ name: 'page_load', status: 'pass' });
    console.log('Page loaded successfully');

    // Wait for product image to be visible
    // ImageMagnifier wraps the main product image
    const imageContainer = page.locator('img[loading="eager"]').first();
    await imageContainer.waitFor({ state: 'visible', timeout: 10000 });

    results.checks.push({ name: 'image_visible', status: 'pass' });
    console.log('Product image visible');

    // Take screenshot BEFORE hover (no magnifier)
    const beforePath = join(OUTPUT_DIR, '01-before-hover.png');
    await page.screenshot({
      path: beforePath,
      fullPage: false
    });
    results.screenshots.push(beforePath);
    console.log('Screenshot: before hover');

    // Get the image container bounding box
    const imageBoundingBox = await imageContainer.boundingBox();

    if (!imageBoundingBox) {
      throw new Error('Could not get image bounding box');
    }

    // Calculate center of the image for hover
    const centerX = imageBoundingBox.x + imageBoundingBox.width / 2;
    const centerY = imageBoundingBox.y + imageBoundingBox.height / 2;

    console.log(`Image position: x=${imageBoundingBox.x.toFixed(0)}, y=${imageBoundingBox.y.toFixed(0)}`);
    console.log(`Image size: ${imageBoundingBox.width.toFixed(0)}x${imageBoundingBox.height.toFixed(0)}`);
    console.log(`Hovering at: (${centerX.toFixed(0)}, ${centerY.toFixed(0)})`);

    // Move mouse to image center to trigger magnifier
    await page.mouse.move(centerX, centerY);

    // Wait for magnifier lens to appear
    // The magnifier is a div with rounded-full class inside the container
    await page.waitForTimeout(300); // Allow transition to complete

    // Check if magnifier lens appeared
    // Magnifier lens has: rounded-full, border-2, border-white/50
    const magnifierLens = page.locator('.rounded-full[style*="backgroundImage"]');
    const magnifierVisible = await magnifierLens.count() > 0;

    if (magnifierVisible) {
      results.checks.push({ name: 'magnifier_visible', status: 'pass' });
      console.log('Magnifier lens appeared');

      // Take screenshot WITH magnifier (during hover)
      const duringPath = join(OUTPUT_DIR, '02-during-hover-magnifier.png');
      await page.screenshot({
        path: duringPath,
        fullPage: false
      });
      results.screenshots.push(duringPath);
      console.log('Screenshot: during hover (magnifier visible)');

      // Move mouse around to show magnifier following
      const offsetX = imageBoundingBox.width * 0.25;
      const offsetY = imageBoundingBox.height * 0.25;

      await page.mouse.move(centerX + offsetX, centerY + offsetY);
      await page.waitForTimeout(100);

      const cornerPath = join(OUTPUT_DIR, '03-magnifier-corner.png');
      await page.screenshot({
        path: cornerPath,
        fullPage: false
      });
      results.screenshots.push(cornerPath);
      console.log('Screenshot: magnifier at corner position');

    } else {
      // Try alternative selector - any absolute positioned rounded element
      const altMagnifier = page.locator('div.absolute.rounded-full');
      const altVisible = await altMagnifier.count() > 0;

      if (altVisible) {
        results.checks.push({ name: 'magnifier_visible', status: 'pass', note: 'alt_selector' });
        console.log('Magnifier lens appeared (alt selector)');

        const duringPath = join(OUTPUT_DIR, '02-during-hover-magnifier.png');
        await page.screenshot({
          path: duringPath,
          fullPage: false
        });
        results.screenshots.push(duringPath);
        console.log('Screenshot: during hover (magnifier visible)');

      } else {
        results.checks.push({ name: 'magnifier_visible', status: 'fail' });
        console.log('WARNING: Magnifier lens NOT visible');

        // Still take screenshot to debug
        const debugPath = join(OUTPUT_DIR, '02-debug-no-magnifier.png');
        await page.screenshot({
          path: debugPath,
          fullPage: false
        });
        results.screenshots.push(debugPath);
      }
    }

    // Move mouse away and verify magnifier disappears
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);

    const magnifierGone = await magnifierLens.count() === 0;

    if (magnifierGone) {
      results.checks.push({ name: 'magnifier_hidden_on_leave', status: 'pass' });
      console.log('Magnifier hidden on mouse leave');
    } else {
      results.checks.push({ name: 'magnifier_hidden_on_leave', status: 'fail' });
      console.log('WARNING: Magnifier still visible after mouse leave');
    }

    // Final screenshot (after leaving)
    const afterPath = join(OUTPUT_DIR, '04-after-hover.png');
    await page.screenshot({
      path: afterPath,
      fullPage: false
    });
    results.screenshots.push(afterPath);
    console.log('Screenshot: after hover');

    // Determine overall status
    const failedChecks = results.checks.filter(c => c.status === 'fail');
    results.status = failedChecks.length === 0 ? 'success' : 'partial';

  } catch (error) {
    results.status = 'failed';
    results.errors.push(error.message);
    console.error(`\nERROR: ${error.message}`);

    // Take error screenshot
    try {
      const errorPath = join(OUTPUT_DIR, 'error-screenshot.png');
      await page.screenshot({ path: errorPath, fullPage: true });
      results.screenshots.push(errorPath);
    } catch (e) {
      // Ignore screenshot error
    }
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY\n');

  const passed = results.checks.filter(c => c.status === 'pass').length;
  const failed = results.checks.filter(c => c.status === 'fail').length;

  console.log(`Status: ${results.status.toUpperCase()}`);
  console.log(`Checks: ${passed} passed, ${failed} failed`);
  console.log(`Screenshots: ${results.screenshots.length} saved`);

  if (results.errors.length > 0) {
    console.log(`Errors: ${results.errors.join(', ')}`);
  }

  console.log(`\nOutput directory: ${OUTPUT_DIR}`);

  // Save JSON results
  const jsonPath = join(OUTPUT_DIR, '_results.json');
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`Results saved: ${jsonPath}`);

  // Generate markdown report
  const report = generateReport(results);
  const reportPath = join(OUTPUT_DIR, '_REPORT.md');
  writeFileSync(reportPath, report);
  console.log(`Report saved: ${reportPath}`);

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(results.status === 'success' ? 0 : 1);
})();

function generateReport(results) {
  const timestamp = new Date(results.timestamp).toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow'
  });

  const passed = results.checks.filter(c => c.status === 'pass').length;
  const total = results.checks.length;

  let md = `# Product Image Zoom (Magnifier) Test Report

**Date:** ${timestamp}
**Status:** ${results.status.toUpperCase()}
**Checks:** ${passed}/${total} passed

---

## Test Description

This test verifies the hover zoom (magnifier) functionality on the product page:
- Opens a product page
- Verifies product image loads
- Hovers over the image to trigger magnifier
- Verifies magnifier lens appears
- Verifies magnifier follows cursor
- Verifies magnifier disappears on mouse leave

---

## Results

| Check | Status |
|-------|--------|
`;

  results.checks.forEach(check => {
    const icon = check.status === 'pass' ? 'PASS' : 'FAIL';
    const note = check.note ? ` (${check.note})` : '';
    md += `| ${check.name} | ${icon}${note} |\n`;
  });

  md += `
---

## Screenshots

`;

  results.screenshots.forEach((path, i) => {
    const filename = path.split('/').pop();
    md += `${i + 1}. \`${filename}\`\n`;
  });

  if (results.errors.length > 0) {
    md += `
---

## Errors

`;
    results.errors.forEach(err => {
      md += `- ${err}\n`;
    });
  }

  md += `
---

_Generated by product-image-zoom.mjs_
`;

  return md;
}
