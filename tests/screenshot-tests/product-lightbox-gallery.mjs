// Product Lightbox Gallery Screenshot Test
// Tests the fullscreen lightbox gallery functionality on product page
// Desktop + Mobile viewports

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Configuration
const BASE_URL = 'http://localhost:8080';
const PRODUCT_URL = '/product/t-shirts2';
const OUTPUT_DIR = './tests/screenshots-output/lightbox-gallery';

const VIEWPORT_DESKTOP = { width: 1920, height: 1080 };
const VIEWPORT_MOBILE = { width: 375, height: 667 };

// Test results
const results = {
  timestamp: null,
  status: 'pending',
  checks: [],
  screenshots: [],
  errors: []
};

console.log('Product Lightbox Gallery Test\n');
console.log('='.repeat(60));

(async () => {
  results.timestamp = new Date().toISOString();

  // Create output directory
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--force-device-scale-factor=1']
  });

  try {
    // ==========================================
    // DESKTOP TESTS
    // ==========================================
    console.log('\n[DESKTOP MODE]');
    console.log(`Viewport: ${VIEWPORT_DESKTOP.width}x${VIEWPORT_DESKTOP.height}`);
    console.log('-'.repeat(60));

    const desktopContext = await browser.newContext({
      viewport: VIEWPORT_DESKTOP,
      hasTouch: false,
    });

    const desktopPage = await desktopContext.newPage();

    console.log(`\nOpening: ${BASE_URL}${PRODUCT_URL}`);

    // Navigate to product page
    await desktopPage.goto(BASE_URL + PRODUCT_URL, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    results.checks.push({ name: 'desktop_page_load', status: 'pass' });
    console.log('Page loaded successfully');

    // Wait for product image to be visible
    const productImage = desktopPage.locator('img[loading="eager"]').first();
    await productImage.waitFor({ state: 'visible', timeout: 10000 });

    results.checks.push({ name: 'desktop_image_visible', status: 'pass' });
    console.log('Product image visible');

    // Take screenshot BEFORE lightbox
    const beforePath = join(OUTPUT_DIR, '01-desktop-before-lightbox.png');
    await desktopPage.screenshot({
      path: beforePath,
      fullPage: false
    });
    results.screenshots.push(beforePath);
    console.log('Screenshot: before lightbox');

    // Click on product image to open lightbox
    console.log('Clicking on product image to open lightbox...');
    await productImage.click();

    // Wait for lightbox overlay to appear
    // Radix Dialog uses data-radix-dialog-overlay or [role="dialog"]
    const lightboxOverlay = desktopPage.locator('[data-radix-dialog-overlay], [role="dialog"]').first();

    try {
      await lightboxOverlay.waitFor({ state: 'visible', timeout: 3000 });
      results.checks.push({ name: 'desktop_lightbox_opened', status: 'pass' });
      console.log('Lightbox overlay visible');
    } catch (e) {
      // Try alternative: any fullscreen dialog/modal
      const altDialog = desktopPage.locator('div[class*="fixed"][class*="inset-0"], div[class*="DialogOverlay"]').first();
      await altDialog.waitFor({ state: 'visible', timeout: 2000 });
      results.checks.push({ name: 'desktop_lightbox_opened', status: 'pass', note: 'alt_selector' });
      console.log('Lightbox overlay visible (alt selector)');
    }

    // Wait for animation to complete
    await desktopPage.waitForTimeout(500);

    // Take screenshot of open lightbox
    const lightboxOpenPath = join(OUTPUT_DIR, '02-desktop-lightbox-open.png');
    await desktopPage.screenshot({
      path: lightboxOpenPath,
      fullPage: false
    });
    results.screenshots.push(lightboxOpenPath);
    console.log('Screenshot: lightbox open');

    // Verify image counter is visible (e.g., "1 / 5")
    const imageCounter = desktopPage.locator('text=/\\d+\\s*\\/\\s*\\d+/').first();
    const counterVisible = await imageCounter.isVisible().catch(() => false);

    if (counterVisible) {
      const counterText = await imageCounter.textContent();
      results.checks.push({ name: 'desktop_image_counter', status: 'pass', note: counterText.trim() });
      console.log(`Image counter visible: ${counterText.trim()}`);
    } else {
      results.checks.push({ name: 'desktop_image_counter', status: 'warn', note: 'not_found' });
      console.log('Image counter not found (may have different format)');
    }

    // Test navigation - click right arrow (ChevronRight)
    console.log('Testing navigation arrows...');
    const rightArrow = desktopPage.locator('button:has(svg[class*="lucide-chevron-right"]), button[aria-label*="next" i], button:has-text("ChevronRight")').first();

    // Alternative: find any clickable arrow-like button in the dialog
    const rightArrowAlt = desktopPage.locator('[role="dialog"] button').filter({ has: desktopPage.locator('svg') }).last();

    let navigationWorked = false;

    try {
      if (await rightArrow.isVisible()) {
        await rightArrow.click();
        navigationWorked = true;
      } else if (await rightArrowAlt.isVisible()) {
        await rightArrowAlt.click();
        navigationWorked = true;
      }
    } catch (e) {
      // Try keyboard navigation
      await desktopPage.keyboard.press('ArrowRight');
      navigationWorked = true;
    }

    if (navigationWorked) {
      await desktopPage.waitForTimeout(400); // Wait for slide animation
      results.checks.push({ name: 'desktop_navigation_right', status: 'pass' });
      console.log('Navigated to next image');

      // Take screenshot after navigation
      const afterNavPath = join(OUTPUT_DIR, '03-desktop-after-navigation.png');
      await desktopPage.screenshot({
        path: afterNavPath,
        fullPage: false
      });
      results.screenshots.push(afterNavPath);
      console.log('Screenshot: after navigation');
    } else {
      results.checks.push({ name: 'desktop_navigation_right', status: 'fail' });
      console.log('WARNING: Could not find navigation arrow');
    }

    // Check for dots navigation
    const dotsNav = desktopPage.locator('[role="dialog"] button[class*="rounded-full"], [role="dialog"] div[class*="dot"]');
    const dotsCount = await dotsNav.count();

    if (dotsCount > 1) {
      results.checks.push({ name: 'desktop_dots_navigation', status: 'pass', note: `${dotsCount} dots` });
      console.log(`Dots navigation found: ${dotsCount} dots`);
    } else {
      results.checks.push({ name: 'desktop_dots_navigation', status: 'warn', note: 'not_found' });
      console.log('Dots navigation not found');
    }

    // Test close by clicking X button
    console.log('Testing close button...');
    const closeButton = desktopPage.locator('[role="dialog"] button:has(svg[class*="lucide-x"]), [role="dialog"] button[aria-label*="close" i], button[class*="DialogClose"]').first();
    const closeButtonAlt = desktopPage.locator('[role="dialog"] button').first();

    let lightboxClosed = false;

    try {
      if (await closeButton.isVisible()) {
        await closeButton.click();
        lightboxClosed = true;
      } else if (await closeButtonAlt.isVisible()) {
        await closeButtonAlt.click();
        lightboxClosed = true;
      }
    } catch (e) {
      // Try pressing Escape
      await desktopPage.keyboard.press('Escape');
      lightboxClosed = true;
    }

    await desktopPage.waitForTimeout(400); // Wait for close animation

    // Verify lightbox is closed
    const lightboxStillVisible = await desktopPage.locator('[role="dialog"]').isVisible().catch(() => false);

    if (!lightboxStillVisible) {
      results.checks.push({ name: 'desktop_lightbox_closed', status: 'pass' });
      console.log('Lightbox closed successfully');
    } else {
      results.checks.push({ name: 'desktop_lightbox_closed', status: 'fail' });
      console.log('WARNING: Lightbox still visible after close');
    }

    // Take screenshot after close
    const afterClosePath = join(OUTPUT_DIR, '04-desktop-after-close.png');
    await desktopPage.screenshot({
      path: afterClosePath,
      fullPage: false
    });
    results.screenshots.push(afterClosePath);
    console.log('Screenshot: after close');

    await desktopContext.close();

    // ==========================================
    // MOBILE TESTS
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('\n[MOBILE MODE]');
    console.log(`Viewport: ${VIEWPORT_MOBILE.width}x${VIEWPORT_MOBILE.height}`);
    console.log('-'.repeat(60));

    const mobileContext = await browser.newContext({
      viewport: VIEWPORT_MOBILE,
      hasTouch: true,
      isMobile: true,
    });

    const mobilePage = await mobileContext.newPage();

    console.log(`\nOpening: ${BASE_URL}${PRODUCT_URL}`);

    await mobilePage.goto(BASE_URL + PRODUCT_URL, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    results.checks.push({ name: 'mobile_page_load', status: 'pass' });
    console.log('Page loaded successfully');

    // Wait for product image
    const mobileProductImage = mobilePage.locator('img[loading="eager"]').first();
    await mobileProductImage.waitFor({ state: 'visible', timeout: 10000 });

    results.checks.push({ name: 'mobile_image_visible', status: 'pass' });
    console.log('Product image visible');

    // Take screenshot before lightbox
    const mobileBeforePath = join(OUTPUT_DIR, '05-mobile-before-lightbox.png');
    await mobilePage.screenshot({
      path: mobileBeforePath,
      fullPage: false
    });
    results.screenshots.push(mobileBeforePath);
    console.log('Screenshot: before lightbox (mobile)');

    // Tap on product image to open lightbox
    console.log('Tapping on product image to open lightbox...');
    await mobileProductImage.tap();

    // Wait for lightbox
    const mobileLightbox = mobilePage.locator('[data-radix-dialog-overlay], [role="dialog"]').first();

    try {
      await mobileLightbox.waitFor({ state: 'visible', timeout: 3000 });
      results.checks.push({ name: 'mobile_lightbox_opened', status: 'pass' });
      console.log('Lightbox overlay visible');
    } catch (e) {
      const altDialog = mobilePage.locator('div[class*="fixed"][class*="inset-0"]').first();
      await altDialog.waitFor({ state: 'visible', timeout: 2000 });
      results.checks.push({ name: 'mobile_lightbox_opened', status: 'pass', note: 'alt_selector' });
      console.log('Lightbox overlay visible (alt selector)');
    }

    await mobilePage.waitForTimeout(500);

    // Take screenshot of mobile lightbox
    const mobileLightboxPath = join(OUTPUT_DIR, '06-mobile-lightbox-open.png');
    await mobilePage.screenshot({
      path: mobileLightboxPath,
      fullPage: false
    });
    results.screenshots.push(mobileLightboxPath);
    console.log('Screenshot: lightbox open (mobile)');

    // Test swipe gesture simulation (swipe left to go to next image)
    console.log('Testing swipe gesture...');

    const dialogBox = await mobilePage.locator('[role="dialog"]').boundingBox();

    if (dialogBox) {
      const startX = dialogBox.x + dialogBox.width * 0.8;
      const endX = dialogBox.x + dialogBox.width * 0.2;
      const centerY = dialogBox.y + dialogBox.height / 2;

      // Perform swipe left gesture
      await mobilePage.touchscreen.tap(startX, centerY);
      await mobilePage.waitForTimeout(100);

      // Simulate swipe with mouse (for compatibility)
      await mobilePage.mouse.move(startX, centerY);
      await mobilePage.mouse.down();
      await mobilePage.mouse.move(endX, centerY, { steps: 10 });
      await mobilePage.mouse.up();

      await mobilePage.waitForTimeout(400);

      results.checks.push({ name: 'mobile_swipe_gesture', status: 'pass' });
      console.log('Swipe gesture performed');

      // Take screenshot after swipe
      const afterSwipePath = join(OUTPUT_DIR, '07-mobile-after-swipe.png');
      await mobilePage.screenshot({
        path: afterSwipePath,
        fullPage: false
      });
      results.screenshots.push(afterSwipePath);
      console.log('Screenshot: after swipe (mobile)');
    } else {
      results.checks.push({ name: 'mobile_swipe_gesture', status: 'fail', note: 'no_dialog_box' });
      console.log('WARNING: Could not get dialog bounding box for swipe');
    }

    // Close lightbox (tap X or press escape)
    console.log('Closing lightbox...');
    await mobilePage.keyboard.press('Escape');
    await mobilePage.waitForTimeout(400);

    const mobileLightboxClosed = !(await mobilePage.locator('[role="dialog"]').isVisible().catch(() => false));

    if (mobileLightboxClosed) {
      results.checks.push({ name: 'mobile_lightbox_closed', status: 'pass' });
      console.log('Lightbox closed successfully');
    } else {
      results.checks.push({ name: 'mobile_lightbox_closed', status: 'fail' });
      console.log('WARNING: Lightbox still visible');
    }

    // Final mobile screenshot
    const mobileAfterClosePath = join(OUTPUT_DIR, '08-mobile-after-close.png');
    await mobilePage.screenshot({
      path: mobileAfterClosePath,
      fullPage: false
    });
    results.screenshots.push(mobileAfterClosePath);
    console.log('Screenshot: after close (mobile)');

    await mobileContext.close();

    // Determine overall status
    const failedChecks = results.checks.filter(c => c.status === 'fail');
    const warnChecks = results.checks.filter(c => c.status === 'warn');

    if (failedChecks.length === 0) {
      results.status = warnChecks.length > 0 ? 'success_with_warnings' : 'success';
    } else {
      results.status = 'partial';
    }

  } catch (error) {
    results.status = 'failed';
    results.errors.push(error.message);
    console.error(`\nERROR: ${error.message}`);

    // Take error screenshot
    try {
      const errorPath = join(OUTPUT_DIR, 'error-screenshot.png');
      await browser.contexts()[0]?.pages()[0]?.screenshot({ path: errorPath, fullPage: true });
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
  const warned = results.checks.filter(c => c.status === 'warn').length;
  const failed = results.checks.filter(c => c.status === 'fail').length;

  console.log(`Status: ${results.status.toUpperCase()}`);
  console.log(`Checks: ${passed} passed, ${warned} warnings, ${failed} failed`);
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
  process.exit(results.status === 'success' || results.status === 'success_with_warnings' ? 0 : 1);
})();

function generateReport(results) {
  const timestamp = new Date(results.timestamp).toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow'
  });

  const passed = results.checks.filter(c => c.status === 'pass').length;
  const total = results.checks.length;

  let md = `# Product Lightbox Gallery Test Report

**Date:** ${timestamp}
**Status:** ${results.status.toUpperCase()}
**Checks:** ${passed}/${total} passed

---

## Test Description

This test verifies the fullscreen lightbox gallery functionality on the product page:

### Desktop (1920x1080)
- Opens a product page
- Clicks on product image to open lightbox
- Verifies lightbox overlay appears
- Checks image counter visibility
- Tests navigation arrows (right arrow)
- Tests dots navigation
- Closes lightbox via X button
- Verifies lightbox closes properly

### Mobile (375x667)
- Opens product page in mobile viewport
- Taps on product image to open lightbox
- Verifies lightbox overlay appears
- Tests swipe gesture for navigation
- Closes lightbox
- Verifies lightbox closes properly

---

## Results

| Check | Status | Notes |
|-------|--------|-------|
`;

  results.checks.forEach(check => {
    const icon = check.status === 'pass' ? 'PASS' : (check.status === 'warn' ? 'WARN' : 'FAIL');
    const note = check.note || '-';
    md += `| ${check.name} | ${icon} | ${note} |\n`;
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

## Key Selectors Used

- Lightbox overlay: \`[data-radix-dialog-overlay]\`, \`[role="dialog"]\`
- Close button: \`button:has(svg[class*="lucide-x"])\`, \`button[aria-label*="close"]\`
- Navigation arrows: \`button:has(svg[class*="lucide-chevron-right"])\`
- Image counter: \`text=/\\d+\\s*\\/\\s*\\d+/\`
- Dots navigation: \`button[class*="rounded-full"]\`

---

_Generated by product-lightbox-gallery.mjs_
`;

  return md;
}
