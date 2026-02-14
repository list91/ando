const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173/catalog?gender=women', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for sidebar to be visible
    await page.waitForTimeout(1000);

    // Capture only the sidebar area (left 280px)
    await page.screenshot({
      path: 'C:\\sts\\projects\\ando\\tests\\screenshots-tools-llm\\test-results\\alignment\\sidebar-alignment.png',
      clip: {
        x: 0,
        y: 0,
        width: 280,
        height: 600
      }
    });

    console.log(JSON.stringify({
      status: 'success',
      screenshot_path: 'C:\\sts\\projects\\ando\\tests\\screenshots-tools-llm\\test-results\\alignment\\sidebar-alignment.png'
    }));
  } catch (error) {
    console.log(JSON.stringify({
      status: 'failed',
      error: error.message
    }));
  } finally {
    await browser.close();
  }
})();
