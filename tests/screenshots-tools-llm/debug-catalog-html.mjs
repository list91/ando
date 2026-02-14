// Debug catalog HTML
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  await page.goto(`${BASE_URL}/catalog?gender=women`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Get main content area
  const mainContent = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    // Get first 3000 chars of main content
    return main.innerHTML.substring(0, 3000);
  });
  console.log('Main content:\n', mainContent);

  // Count all links
  const allLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .map(el => el.getAttribute('href'))
      .filter(h => h);
  });
  console.log('\nAll links:', allLinks.length);
  console.log('Product links (starting with /catalog/):', allLinks.filter(h => h.startsWith('/catalog/') && h.length > 15));

  await browser.close();
}

main().catch(console.error);
