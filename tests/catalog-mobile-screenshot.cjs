const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureScreenshot() {
  const screenshotDir = path.join(__dirname, 'screenshots');

  // Create screenshots directory if it doesn't exist
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const screenshotPath = path.join(screenshotDir, 'catalog-mobile-before.png');
  let browser;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true
    });

    // Create context with mobile viewport
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 }
    });

    const page = await context.newPage();

    console.log('Opening catalog page: http://localhost:8082/catalog');

    // Navigate to the page
    await page.goto('http://localhost:8082/catalog', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Page loaded. Waiting for content to be ready...');

    // Wait a bit more for any animations/transitions to complete
    await page.waitForTimeout(2000);

    console.log('Taking screenshot...');

    // Take fullpage screenshot
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`Screenshot saved successfully to: ${screenshotPath}`);
    console.log(`File size: ${fs.statSync(screenshotPath).size} bytes`);

    await context.close();
    await browser.close();

    return {
      success: true,
      path: screenshotPath,
      message: `Screenshot created: ${screenshotPath}`
    };
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

captureScreenshot().then(result => {
  console.log('\n=== RESULT ===');
  console.log(result.message);
  process.exit(0);
}).catch(error => {
  console.error('Failed to capture screenshot:', error.message);
  process.exit(1);
});
