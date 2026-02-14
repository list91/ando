// T11: Screenshot checkout page showing registration promo block with 5% discount
// Target: Orange/amber promo banner at top with "5%" badge and "Получить скидку" button

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_PATH = 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/t11-registration-promo.png';

async function screenshotRegistrationPromo() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const steps = [];
  let promoBlockInfo = null;

  try {
    // Step 1: Go to catalog (clean session - guest mode)
    console.log('Step 1: Opening catalog (guest mode)...');
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    steps.push('catalog_loaded_as_guest');

    // Step 2: Click on first product
    console.log('Step 2: Clicking on product...');
    const productSelectors = [
      '[data-testid="product-card"]',
      '.product-card',
      'a[href*="/product"]',
      '[class*="ProductCard"]',
      'article a',
      '.card a'
    ];

    let productClicked = false;
    for (const selector of productSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.count() > 0) {
          await el.click();
          productClicked = true;
          console.log(`  Clicked: ${selector}`);
          break;
        }
      } catch (e) { /* continue */ }
    }

    if (!productClicked) {
      throw new Error('Could not find product to click');
    }

    await page.waitForTimeout(1500);
    steps.push('product_page_opened');

    // Step 3: Select size
    console.log('Step 3: Selecting size...');
    const sizeSelectors = [
      'button:has-text("S")',
      'button:has-text("M")',
      'button:has-text("L")',
      '[data-testid="size-selector"] button',
      'button[class*="size"]'
    ];

    for (const selector of sizeSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0 && await btn.isVisible()) {
          await btn.click();
          console.log(`  Selected size: ${selector}`);
          steps.push('size_selected');
          break;
        }
      } catch (e) { /* continue */ }
    }

    await page.waitForTimeout(500);

    // Step 4: Add to cart
    console.log('Step 4: Adding to cart...');
    const addToCartSelectors = [
      'button:has-text("ДОБАВИТЬ В КОРЗИНУ")',
      'button:has-text("В корзину")',
      'button:has-text("Добавить в корзину")',
      'button:has-text("Add to cart")',
      '[data-testid="add-to-cart"]'
    ];

    for (const selector of addToCartSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0 && await btn.isVisible()) {
          await btn.click();
          console.log(`  Clicked: ${selector}`);
          steps.push('added_to_cart');
          break;
        }
      } catch (e) { /* continue */ }
    }

    await page.waitForTimeout(1500);

    // Step 5: Go to cart (via popup or direct navigation)
    console.log('Step 5: Going to cart...');
    const goToCartSelectors = [
      'button:has-text("Перейти в корзину")',
      'a:has-text("Перейти в корзину")',
      'button:has-text("В корзину")'
    ];

    let wentToCart = false;
    for (const selector of goToCartSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0 && await btn.isVisible()) {
          await btn.click();
          wentToCart = true;
          console.log(`  Clicked: ${selector}`);
          break;
        }
      } catch (e) { /* continue */ }
    }

    if (!wentToCart) {
      await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });
    }

    await page.waitForTimeout(1500);
    steps.push('cart_opened');

    // Step 6: Click checkout button
    console.log('Step 6: Going to checkout...');
    const checkoutSelectors = [
      'button:has-text("Оформить заказ")',
      'button:has-text("Перейти к оформлению")',
      'button:has-text("К оформлению")',
      'a:has-text("Оформить заказ")',
      'a[href*="checkout"]',
      '[data-testid="checkout-button"]'
    ];

    let checkoutClicked = false;
    for (const selector of checkoutSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0 && await btn.isVisible()) {
          await btn.click();
          checkoutClicked = true;
          console.log(`  Clicked: ${selector}`);
          break;
        }
      } catch (e) { /* continue */ }
    }

    if (!checkoutClicked) {
      await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
    }

    await page.waitForTimeout(2000);
    steps.push('checkout_page_loaded');

    // Step 7: Look for promo block with 5% discount
    console.log('Step 7: Looking for registration promo block...');

    const promoSelectors = [
      // Look for 5% text
      'text=/5%/',
      'text=/5 %/',
      // Look for discount-related elements
      '[class*="promo"]',
      '[class*="discount"]',
      '[class*="banner"]',
      // Look for registration CTA
      'text=/Получить скидку/i',
      'button:has-text("Получить скидку")',
      'a:has-text("Получить скидку")',
      // Orange/amber colored elements (registration banner)
      '[class*="register"]',
      '[class*="Registration"]',
      // Generic promo containers
      '[class*="offer"]',
      '[class*="bonus"]'
    ];

    let promoFound = false;
    for (const selector of promoSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.count() > 0 && await el.isVisible()) {
          const box = await el.boundingBox();
          if (box) {
            promoFound = true;
            promoBlockInfo = {
              selector: selector,
              position: { x: Math.round(box.x), y: Math.round(box.y) },
              size: { width: Math.round(box.width), height: Math.round(box.height) }
            };
            console.log(`  Found promo element: ${selector}`);
            console.log(`  Position: Y=${box.y}px, Height=${box.height}px`);
            break;
          }
        }
      } catch (e) { /* continue */ }
    }

    // Also check for specific text content
    const pageContent = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        has5percent: body.includes('5%') || body.includes('5 %'),
        hasGetDiscount: body.toLowerCase().includes('получить скидку'),
        hasRegister: body.toLowerCase().includes('зарегистр')
      };
    });

    steps.push('promo_block_checked');

    // Step 8: Take screenshot
    console.log('Step 8: Taking screenshot...');
    await page.screenshot({
      path: OUTPUT_PATH,
      fullPage: true
    });
    steps.push('screenshot_taken');

    const finalUrl = page.url();

    const result = {
      Agent_Response: {
        task_id: "screenshot-t11",
        status: "success",
        result: {
          screenshot_path: OUTPUT_PATH,
          final_url: finalUrl,
          is_on_checkout: finalUrl.includes('/checkout'),
          steps_completed: steps,
          promo_block: {
            found: promoFound,
            info: promoBlockInfo,
            content_check: pageContent
          }
        },
        metadata: {
          viewport: "1920x1080",
          headless: true,
          response_chars: 800
        }
      }
    };

    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    try {
      await page.screenshot({
        path: OUTPUT_PATH.replace('.png', '-error.png'),
        fullPage: true
      });
    } catch (e) { /* ignore */ }

    const result = {
      Agent_Response: {
        task_id: "screenshot-t11",
        status: "failed",
        result: {
          error: error.message,
          steps_completed: steps,
          current_url: page.url()
        },
        metadata: {}
      }
    };
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

screenshotRegistrationPromo();
