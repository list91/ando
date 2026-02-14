// Debug catalog with longer wait
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('Page error:', err.message);
  });

  await page.goto(`${BASE_URL}/catalog?gender=women`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Page loaded, waiting for products...');

  // Wait longer
  await page.waitForTimeout(5000);

  // Check for loading spinners
  const loading = await page.evaluate(() => {
    const spinners = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="skeleton"]');
    return spinners.length;
  });
  console.log('Loading elements:', loading);

  // Get all visible link hrefs
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]'))
      .map(a => a.getAttribute('href'))
      .filter(h => h && h.length > 5);
  });
  console.log('All links:', links);

  // Screenshot to see what's visible
  await page.screenshot({
    path: 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/final-judge/debug-catalog.png',
    fullPage: true
  });
  console.log('Screenshot saved');

  await browser.close();
}

main().catch(console.error);
