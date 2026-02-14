import { chromium } from 'playwright';
import path from 'path';

const URL = 'https://andojv.com/catalog?gender=women';
const OUTPUT_PATH = 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/compare/production-catalog-women.png';

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for content to load
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: OUTPUT_PATH,
      fullPage: true
    });

    const result = {
      status: 'success',
      screenshot_path: OUTPUT_PATH,
      viewport: '1920x1080',
      url: URL
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const result = {
      status: 'failed',
      error: error.message,
      viewport: '1920x1080',
      url: URL
    };
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

takeScreenshot();
