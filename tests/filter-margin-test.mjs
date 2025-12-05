import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testFilterMargin() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Navigate to catalog page
    await page.goto('http://localhost:8082/catalog', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for filter panel to be visible
    await page.waitForSelector('section[aria-label="Фильтры товаров"]', {
      timeout: 10000
    });

    // Get Y-position of filter panel
    const filterPosition = await page.evaluate(() => {
      const filterPanel = document.querySelector('section[aria-label="Фильтры товаров"]');
      if (!filterPanel) return null;

      const rect = filterPanel.getBoundingClientRect();
      const styles = window.getComputedStyle(filterPanel);

      return {
        top: rect.top,
        y: rect.y,
        marginTop: styles.marginTop,
        paddingTop: styles.paddingTop,
        offsetTop: filterPanel.offsetTop
      };
    });

    console.log('Filter panel position info:');
    console.log(JSON.stringify(filterPosition, null, 2));

    // Take screenshot
    const screenshotDir = join(__dirname, 'screenshots');
    const screenshotPath = join(screenshotDir, 'filter-panel-margin-35px.png');

    await page.screenshot({
      path: screenshotPath,
      fullPage: false
    });

    console.log(`\nScreenshot saved to: ${screenshotPath}`);
    console.log(`\nFilter panel Y-position: ${filterPosition.y}px`);
    console.log(`Filter panel margin-top: ${filterPosition.marginTop}`);
    console.log(`Filter panel padding-top: ${filterPosition.paddingTop}`);

  } catch (error) {
    console.error('Error during test:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

testFilterMargin().catch(console.error);
