import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:8083/catalog...');
    await page.goto('http://localhost:8083/catalog', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for network to be idle...');
    await page.waitForLoadState('networkidle');

    console.log('Additional 5 second wait for full content load...');
    await page.waitForTimeout(5000);

    // Check if products are loaded (not showing loading state)
    const loadingText = await page.locator('text=Загрузка товаров').count();
    if (loadingText > 0) {
      console.log('Warning: Loading state still visible, waiting additional 3 seconds...');
      await page.waitForTimeout(3000);
    }

    // Verify filter panel is visible
    const filterPanel = await page.locator('text=Материал').count();
    console.log(`Filter panel visible: ${filterPanel > 0}`);

    // Verify product cards are loaded
    const productCards = await page.locator('[class*="product"], [class*="card"]').count();
    console.log(`Product cards found: ${productCards}`);

    console.log('Taking screenshot...');
    await page.screenshot({
      path: 'C:/Users/Дарья/qq/ando/tests/screenshots/filter-panel-mt35-port8083.png',
      fullPage: false // viewport only
    });

    console.log('Screenshot saved successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
