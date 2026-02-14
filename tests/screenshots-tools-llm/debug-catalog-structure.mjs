// Debug catalog structure
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  await page.goto(`${BASE_URL}/catalog?gender=women`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Dump links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .filter(el => el.offsetParent !== null)
      .map(el => ({
        href: el.getAttribute('href'),
        text: el.textContent?.trim().substring(0, 50)
      }))
      .filter(l => l.href && l.href.includes('/catalog'));
  });
  console.log('Product links:', JSON.stringify(links.slice(0, 10), null, 2));

  // Dump product cards
  const cards = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('article, [class*="product"], [class*="card"]'))
      .filter(el => el.offsetParent !== null)
      .map(el => ({
        tag: el.tagName,
        class: el.className.substring(0, 100),
        links: Array.from(el.querySelectorAll('a')).map(a => a.getAttribute('href'))
      }))
      .slice(0, 5);
  });
  console.log('Product cards:', JSON.stringify(cards, null, 2));

  await browser.close();
}

main().catch(console.error);
