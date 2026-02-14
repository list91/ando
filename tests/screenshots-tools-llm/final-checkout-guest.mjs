// Final Checkout Guest Flow Screenshots
import { chromium } from 'playwright';
import { join } from 'path';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/final-judge';

async function main() {
  console.log('Taking checkout guest flow screenshots...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    // Start fresh
    await page.goto(`${BASE_URL}/catalog?gender=women`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('1. Catalog loaded');

    // Click first product
    const productLink = page.locator('a[href*="/catalog/"]').first();
    await productLink.click();
    await page.waitForTimeout(1500);
    console.log('2. Product page opened');

    // Select size
    const sizeBtn = page.locator('button').filter({ hasText: /^[SML]$/ }).first();
    if (await sizeBtn.count() > 0) {
      await sizeBtn.click();
      await page.waitForTimeout(300);
      console.log('3. Size selected');
    }

    // Add to cart
    const addBtn = page.locator('button:has-text("ДОБАВИТЬ В КОРЗИНУ")').first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForTimeout(1500);
      console.log('4. Added to cart');

      // Screenshot modal with promo (t11)
      await page.screenshot({
        path: join(OUTPUT_DIR, '02-t11-cart-modal-promo.png'),
        fullPage: false
      });
      console.log('5. Cart modal screenshot taken');

      // Go to cart
      const goCartBtn = page.locator('button:has-text("Перейти в корзину")').first();
      if (await goCartBtn.count() > 0) {
        await goCartBtn.click();
        await page.waitForTimeout(2000);
        console.log('6. Navigating to cart/checkout');
      }
    }

    // Check where we are
    let url = page.url();
    console.log('Current URL:', url);

    if (url.includes('/login')) {
      // Screenshot login page
      await page.screenshot({
        path: join(OUTPUT_DIR, '02-t2-login-page.png'),
        fullPage: true
      });
      console.log('7. Login page screenshot');

      // Look for guest checkout elements
      const pageContent = await page.evaluate(() => {
        return {
          html: document.body.innerHTML.substring(0, 2000),
          buttons: Array.from(document.querySelectorAll('button, a'))
            .filter(el => el.offsetParent !== null)
            .map(el => ({ tag: el.tagName, text: el.textContent?.trim().substring(0, 50), href: el.getAttribute('href') }))
        };
      });
      console.log('Buttons on page:', pageContent.buttons.slice(0, 20));

      // Try to find guest checkout
      const guestSelectors = [
        'button:has-text("Продолжить как гость")',
        'a:has-text("Продолжить как гость")',
        'button:has-text("Гостевой")',
        'a:has-text("Гостевой")',
        '[data-testid="guest-checkout"]'
      ];

      for (const sel of guestSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.count() > 0) {
          await btn.click();
          await page.waitForTimeout(2000);
          console.log('8. Clicked guest checkout:', sel);
          break;
        }
      }
    }

    // Now take checkout form screenshots
    url = page.url();
    console.log('After guest click URL:', url);

    if (url.includes('/checkout') || url.includes('/guest')) {
      await page.waitForTimeout(1000);

      // Scroll to load all
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);

      // Full checkout form
      await page.screenshot({
        path: join(OUTPUT_DIR, '02-t2-t11-checkout-form-full.png'),
        fullPage: true
      });
      console.log('9. Checkout form full screenshot');

      // Check form elements
      const formInfo = await page.evaluate(() => {
        return {
          inputs: Array.from(document.querySelectorAll('input')).map(i => ({
            name: i.name,
            placeholder: i.placeholder,
            type: i.type
          })),
          selects: Array.from(document.querySelectorAll('select')).map(s => s.name),
          checkboxes: document.querySelectorAll('input[type="checkbox"]').length,
          buttons: Array.from(document.querySelectorAll('button'))
            .map(b => b.textContent?.trim())
            .filter(t => t && t.length > 0)
        };
      });
      console.log('Form info:', JSON.stringify(formInfo, null, 2));
    }

    // Direct checkout page access
    console.log('\n10. Direct checkout access...');
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: join(OUTPUT_DIR, '02-checkout-direct.png'),
      fullPage: true
    });

    console.log('Final URL:', page.url());

  } finally {
    await browser.close();
  }

  console.log('\nCheckout screenshots completed!');
}

main().catch(console.error);
