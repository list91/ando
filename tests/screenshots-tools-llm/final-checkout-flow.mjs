// Final Checkout Flow Screenshots - Fixed selectors
import { chromium } from 'playwright';
import { join } from 'path';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/final-judge';

async function main() {
  console.log('Taking checkout flow screenshots...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    // Start fresh - go to catalog
    await page.goto(`${BASE_URL}/catalog?gender=women`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    console.log('1. Catalog loaded');

    // Click first product link - use /product/ pattern
    const productLink = page.locator('a[href^="/product/"]').first();
    if (await productLink.count() > 0) {
      await productLink.click();
      await page.waitForTimeout(2000);
      console.log('2. Product page opened');

      // Screenshot product page
      await page.screenshot({
        path: join(OUTPUT_DIR, '02-product-page.png'),
        fullPage: false
      });

      // Select size
      const sizeButtons = await page.$$('button');
      for (const btn of sizeButtons) {
        const text = await btn.textContent();
        if (text && /^[SML]$/.test(text.trim())) {
          await btn.click();
          await page.waitForTimeout(300);
          console.log('3. Size selected:', text.trim());
          break;
        }
      }

      // Add to cart
      const addBtn = page.locator('button:has-text("ДОБАВИТЬ В КОРЗИНУ")');
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(1500);
        console.log('4. Added to cart');

        // Screenshot: Cart modal with promo (t11)
        await page.screenshot({
          path: join(OUTPUT_DIR, '02-t11-cart-modal-with-promo.png'),
          fullPage: false
        });
        console.log('5. Cart modal screenshot');

        // Look for promo block in modal
        const promoBlock = await page.evaluate(() => {
          const promoElements = document.querySelectorAll('[class*="promo"], [class*="bonus"], [class*="registration"]');
          return Array.from(promoElements).map(el => ({
            class: el.className,
            text: el.textContent?.substring(0, 100)
          }));
        });
        console.log('Promo blocks found:', promoBlock);

        // Go to cart
        const goCartBtn = page.locator('button:has-text("Перейти в корзину")');
        if (await goCartBtn.count() > 0) {
          await goCartBtn.click();
          await page.waitForTimeout(2000);
          console.log('6. Going to cart');
        }
      }
    }

    // Check current URL
    let url = page.url();
    console.log('Current URL:', url);

    // If on login page
    if (url.includes('/login')) {
      await page.screenshot({
        path: join(OUTPUT_DIR, '02-t2-login-with-guest.png'),
        fullPage: true
      });
      console.log('7. Login page screenshot');

      // Find guest checkout button
      const buttons = await page.$$eval('button, a', els =>
        els.filter(el => el.offsetParent !== null)
           .map(el => ({ text: el.textContent?.trim(), tag: el.tagName }))
      );
      console.log('Available buttons:', buttons.slice(0, 15));

      // Try guest checkout
      const guestBtn = page.locator('button:has-text("Продолжить как гость"), a:has-text("Продолжить как гость")').first();
      if (await guestBtn.count() > 0) {
        await guestBtn.click();
        await page.waitForTimeout(2000);
        console.log('8. Guest checkout clicked');
      }
    }

    // Take checkout form screenshot
    url = page.url();
    console.log('After guest URL:', url);

    // Scroll to load all content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Full page checkout
    await page.screenshot({
      path: join(OUTPUT_DIR, '02-t2-t11-checkout-complete.png'),
      fullPage: true
    });
    console.log('9. Checkout form screenshot');

    // Analyze form fields
    const formFields = await page.evaluate(() => {
      return {
        inputs: Array.from(document.querySelectorAll('input:not([type="hidden"])')).map(i => ({
          name: i.name || i.placeholder,
          type: i.type
        })),
        selects: Array.from(document.querySelectorAll('select')).map(s => s.name),
        checkboxes: document.querySelectorAll('input[type="checkbox"]').length
      };
    });
    console.log('Form fields:', JSON.stringify(formFields, null, 2));

  } finally {
    await browser.close();
  }

  console.log('\nCheckout flow screenshots completed!');
}

main().catch(console.error);
