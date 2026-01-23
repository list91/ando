const { chromium } = require('playwright');

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // iPhone X dimensions
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:8080/...');
    await page.goto('http://localhost:8080/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for the page to be fully loaded
    await page.waitForTimeout(2000);

    console.log('Taking full page screenshot...');
    await page.screenshot({
      path: 'C:/sts/projects/ando/tests/screenshots/verification/verify-m6-fixed.png',
      fullPage: false, // We want viewport screenshot to see the fixed bottom nav
    });

    console.log('Screenshot saved to: C:/sts/projects/ando/tests/screenshots/verification/verify-m6-fixed.png');

    // Check for bottom navigation
    const bottomNav = await page.$('nav, [class*="bottom"], [class*="Bottom"], [class*="mobile"], [class*="Mobile"]');
    if (bottomNav) {
      console.log('Bottom navigation element found!');
      const box = await bottomNav.boundingBox();
      if (box) {
        console.log(`Position: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`);
      }
    }

    // Get page content for analysis
    const pageContent = await page.content();
    console.log('\n--- Page analysis ---');

    // Check for icons
    const icons = await page.$$('svg, [class*="icon"], [class*="Icon"]');
    console.log(`Found ${icons.length} icon elements`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
