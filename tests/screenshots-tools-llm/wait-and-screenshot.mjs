import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173/catalog?gender=women';
const outputPath = process.argv[3] || 'catalog-loaded.png';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  // Wait for products to load (wait for loading text to disappear)
  try {
    await page.waitForSelector('text=Загрузка товаров', { state: 'hidden', timeout: 30000 });
  } catch (e) {
    console.log('Loading text not found or already hidden');
  }

  // Extra wait for any animations
  await page.waitForTimeout(2000);

  await page.screenshot({ path: outputPath, fullPage: false });
  console.log(`Screenshot saved to ${outputPath}`);

  await browser.close();
})();
