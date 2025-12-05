import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    console.log('Opening URL: http://localhost:8081/product/t-shirts2');
    await page.goto('http://localhost:8081/product/t-shirts2', { waitUntil: 'networkidle' });

    console.log('Waiting 3 seconds...');
    await page.waitForTimeout(3000);

    const screenshotPath = 'C:/Users/Дарья/qq/ando/tests/screenshots/sidebar-fix-v5.png';
    console.log(`Taking screenshot and saving to: ${screenshotPath}`);
    await page.screenshot({ path: screenshotPath });

    console.log('Screenshot saved successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
