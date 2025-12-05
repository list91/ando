import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 375, height: 812 }
  });

  try {
    console.log('Opening catalog to find product with badges...');
    await page.goto('http://localhost:8080/catalog', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Screenshot catalog to show badges on cards
    await page.screenshot({
      path: 'C:/Users/Дарья/qq/ando/tests/screenshots/group-a-catalog.png',
      fullPage: false
    });
    console.log('Catalog screenshot saved');

    // Go to a product page to check arrows
    console.log('Opening product page...');
    await page.goto('http://localhost:8080/product/t-shirts2', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Screenshot product page to show arrows position
    await page.screenshot({
      path: 'C:/Users/Дарья/qq/ando/tests/screenshots/group-a-product.png',
      fullPage: false
    });
    console.log('Product page screenshot saved');

    console.log('All screenshots saved successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
