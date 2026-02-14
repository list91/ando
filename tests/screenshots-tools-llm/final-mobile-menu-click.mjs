// Final Mobile Menu Click - Using correct aria-label selector
import { chromium } from 'playwright';
import { join } from 'path';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/final-judge';

async function main() {
  console.log('Taking mobile menu screenshots with correct selector...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 667 });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Screenshot before clicking menu
    await page.screenshot({
      path: join(OUTPUT_DIR, '05-t16-t17-mobile-before-menu.png'),
      fullPage: false
    });
    console.log('1. Before menu click - done');

    // Click the burger menu using aria-label
    const menuButton = page.locator('button[aria-label="Открыть меню"]');
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(800);
      console.log('2. Clicked menu button');

      // Screenshot with menu open
      await page.screenshot({
        path: join(OUTPUT_DIR, '05-t16-t17-mobile-menu-opened.png'),
        fullPage: false
      });
      console.log('3. Menu opened screenshot - done');

      // Check visible menu items
      const menuItems = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a, button'))
          .filter(el => {
            const style = window.getComputedStyle(el);
            return el.offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden';
          })
          .map(el => el.textContent?.trim())
          .filter(t => t && t.length > 0 && t.length < 30);
      });
      console.log('Menu items visible:', menuItems);

      // Full page with menu
      await page.screenshot({
        path: join(OUTPUT_DIR, '05-t16-t17-mobile-fullpage-menu.png'),
        fullPage: true
      });
      console.log('4. Full page with menu - done');
    } else {
      console.log('Menu button not found with aria-label');

      // Try alternative - click by position in mobile header area
      await page.click('body', { position: { x: 30, y: 30 } });
      await page.waitForTimeout(500);
    }

    // Also capture catalog mobile view
    console.log('\n5. Capturing catalog mobile view...');
    await page.goto(`${BASE_URL}/catalog?gender=women`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: join(OUTPUT_DIR, '03-t12-t13-catalog-mobile.png'),
      fullPage: false
    });
    console.log('6. Catalog mobile - done');

    // Scroll down to see badges
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(300);
    await page.screenshot({
      path: join(OUTPUT_DIR, '03-t12-t13-catalog-mobile-scrolled.png'),
      fullPage: false
    });
    console.log('7. Catalog mobile scrolled - done');

  } finally {
    await browser.close();
  }

  console.log('\nAll mobile screenshots completed!');
  console.log('Output:', OUTPUT_DIR);
}

main().catch(console.error);
