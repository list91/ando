/**
 * Interactive scroll verification using Playwright actions
 */

const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:8087';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'current');

async function verifyScroll() {
  const browser = await chromium.launch({ headless: true });

  try {
    // Desktop test
    console.log('=== Desktop Scroll Test ===\n');

    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const desktopPage = await desktopContext.newPage();

    await desktopPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);

    // Get initial scroll position
    const initialScrollDesktop = await desktopPage.evaluate(() => window.scrollY);
    console.log('Initial scroll Y:', initialScrollDesktop);

    // Take before screenshot
    await desktopPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'scroll-before-desktop.png'),
      fullPage: false
    });

    // Use Playwright mouse wheel
    await desktopPage.mouse.wheel(0, 500);
    await desktopPage.waitForTimeout(800);

    // Get after scroll position
    const afterWheelScrollDesktop = await desktopPage.evaluate(() => window.scrollY);
    console.log('After wheel scroll Y:', afterWheelScrollDesktop);

    // Try keyboard scroll
    await desktopPage.keyboard.press('PageDown');
    await desktopPage.waitForTimeout(500);

    const afterKeyboardScrollDesktop = await desktopPage.evaluate(() => window.scrollY);
    console.log('After keyboard scroll Y:', afterKeyboardScrollDesktop);

    // Take after screenshot
    await desktopPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'scroll-after-desktop.png'),
      fullPage: false
    });

    const desktopScrollWorked = afterWheelScrollDesktop > initialScrollDesktop ||
                               afterKeyboardScrollDesktop > initialScrollDesktop;
    console.log(`Desktop scroll worked: ${desktopScrollWorked}`);

    // Check page height and scrollability
    const pageMetrics = await desktopPage.evaluate(() => {
      return {
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        bodyOverflow: window.getComputedStyle(document.body).overflow,
        htmlOverflow: window.getComputedStyle(document.documentElement).overflow,
        isScrollable: document.documentElement.scrollHeight > window.innerHeight
      };
    });
    console.log('Page metrics:', pageMetrics);

    await desktopContext.close();

    // Mobile test
    console.log('\n=== Mobile Scroll Test ===\n');

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    const initialScrollMobile = await mobilePage.evaluate(() => window.scrollY);
    console.log('Initial scroll Y:', initialScrollMobile);

    // Take before screenshot
    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'scroll-before-mobile.png'),
      fullPage: false
    });

    // Use touch scroll (swipe up = scroll down)
    await mobilePage.touchscreen.tap(195, 600);
    await mobilePage.waitForTimeout(100);

    // Swipe gesture
    await mobilePage.evaluate(async () => {
      // Simulate scroll via touch
      const startY = 600;
      const endY = 200;

      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 1, target: document.body, clientX: 195, clientY: startY })]
      });

      const touchMove = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 1, target: document.body, clientX: 195, clientY: endY })]
      });

      const touchEnd = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        touches: []
      });

      document.dispatchEvent(touchStart);
      await new Promise(r => setTimeout(r, 50));
      document.dispatchEvent(touchMove);
      await new Promise(r => setTimeout(r, 50));
      document.dispatchEvent(touchEnd);
    });

    await mobilePage.waitForTimeout(500);

    // Also try wheel on mobile
    await mobilePage.mouse.wheel(0, 400);
    await mobilePage.waitForTimeout(500);

    const afterScrollMobile = await mobilePage.evaluate(() => window.scrollY);
    console.log('After scroll Y:', afterScrollMobile);

    // Take after screenshot
    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'scroll-after-mobile.png'),
      fullPage: false
    });

    const mobileScrollWorked = afterScrollMobile > initialScrollMobile;
    console.log(`Mobile scroll worked: ${mobileScrollWorked}`);

    const mobileMetrics = await mobilePage.evaluate(() => {
      return {
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        bodyOverflow: window.getComputedStyle(document.body).overflow,
        htmlOverflow: window.getComputedStyle(document.documentElement).overflow,
        isScrollable: document.documentElement.scrollHeight > window.innerHeight
      };
    });
    console.log('Mobile metrics:', mobileMetrics);

    await mobileContext.close();

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Desktop scroll: ${desktopScrollWorked ? 'PASS' : 'FAIL'}`);
    console.log(`Mobile scroll: ${mobileScrollWorked ? 'PASS' : 'FAIL'}`);

    return {
      desktop: desktopScrollWorked,
      mobile: mobileScrollWorked
    };

  } finally {
    await browser.close();
  }
}

verifyScroll().catch(console.error);
