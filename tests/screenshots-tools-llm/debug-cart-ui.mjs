import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const CATALOG_URL = `${BASE_URL}/catalog`;

async function debugCartUI() {
  const browser = await chromium.launch({ headless: false }); // visible for debugging
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Go to catalog
    await page.goto(CATALOG_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click product
    await page.locator('a[href*="/product"]').first().click();
    await page.waitForTimeout(1500);

    // Add to cart
    await page.locator('button:has-text("В корзину")').first().click();
    await page.waitForTimeout(1500);

    // Screenshot before opening cart
    await page.screenshot({
      path: 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/debug-1-after-add.png',
      fullPage: true
    });

    // Dump all buttons on page
    console.log('\n=== ALL BUTTONS ON PAGE ===');
    const allButtons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, a[href]')).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 60),
        className: el.className?.substring(0, 80),
        href: el.getAttribute('href'),
        visible: el.offsetParent !== null
      }));
    });
    console.log(JSON.stringify(allButtons.filter(b => b.visible), null, 2));

    // Try to open cart sidebar
    const cartIcon = page.locator('header [class*="cart"]').first();
    if (await cartIcon.count() > 0) {
      await cartIcon.click();
      console.log('\n=== CLICKED CART ICON ===');
      await page.waitForTimeout(1500);

      // Screenshot after opening cart
      await page.screenshot({
        path: 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/debug-2-cart-open.png',
        fullPage: true
      });

      // Now check for any new elements
      console.log('\n=== BUTTONS AFTER CART OPEN ===');
      const buttonsAfterCart = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button, a[href]')).map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 60),
          className: el.className?.substring(0, 80),
          href: el.getAttribute('href'),
          visible: el.offsetParent !== null
        }));
      });
      console.log(JSON.stringify(buttonsAfterCart.filter(b => b.visible && (
        b.text?.includes('Оформ') ||
        b.text?.includes('заказ') ||
        b.text?.includes('checkout') ||
        b.href?.includes('checkout') ||
        b.className?.includes('checkout')
      )), null, 2));

      // Check for sidebar/drawer/modal
      console.log('\n=== SIDEBAR/DRAWER/MODAL ELEMENTS ===');
      const sidebarInfo = await page.evaluate(() => {
        const selectors = ['[class*="Sidebar"]', '[class*="sidebar"]', '[class*="Drawer"]', '[class*="drawer"]', '[class*="Modal"]', '[class*="modal"]', '[class*="Cart"]'];
        const results = [];
        for (const sel of selectors) {
          const els = document.querySelectorAll(sel);
          els.forEach(el => {
            results.push({
              selector: sel,
              className: el.className?.substring(0, 100),
              innerHTML: el.innerHTML?.substring(0, 200)
            });
          });
        }
        return results;
      });
      console.log(JSON.stringify(sidebarInfo.slice(0, 10), null, 2));
    }

    console.log('\n=== DEBUG COMPLETE ===');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugCartUI();
