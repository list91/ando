import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const CATALOG_URL = `${BASE_URL}/catalog`;
const OUTPUT_PATH = 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/guest-checkout-flow.png';

async function testGuestCheckoutFlow() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const steps = [];

  try {
    // Step 1: Clear localStorage and go to catalog
    console.log('Step 1: Opening catalog (clean session)...');
    await page.goto(CATALOG_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    steps.push('catalog_loaded');

    // Step 2: Find and click on first product
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

    // Step 3a: Select size first (required before adding to cart)
    console.log('Step 3a: Selecting size...');
    const sizeSelectors = [
      'button:has-text("S")',
      'button:has-text("M")',
      'button:has-text("L")',
      '[data-testid="size-selector"] button',
      'button[class*="size"]'
    ];

    let sizeSelected = false;
    for (const selector of sizeSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0 && await btn.isVisible()) {
          await btn.click();
          sizeSelected = true;
          console.log(`  Selected size: ${selector}`);
          break;
        }
      } catch (e) { /* continue */ }
    }

    if (sizeSelected) {
      steps.push('size_selected');
      await page.waitForTimeout(500);
    } else {
      console.log('  No size selection needed or not found');
    }

    // Step 3b: Click "Add to cart" button
    console.log('Step 3b: Adding to cart...');
    const addToCartSelectors = [
      'button:has-text("ДОБАВИТЬ В КОРЗИНУ")',
      'button:has-text("В корзину")',
      'button:has-text("Добавить в корзину")',
      'button:has-text("Add to cart")',
      '[data-testid="add-to-cart"]',
      'button[class*="cart"]'
    ];

    let addedToCart = false;
    for (const selector of addToCartSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0 && await btn.isVisible()) {
          await btn.click();
          addedToCart = true;
          console.log(`  Clicked add to cart: ${selector}`);
          break;
        }
      } catch (e) { /* continue */ }
    }

    if (!addedToCart) {
      throw new Error('Could not find add-to-cart button');
    }

    await page.waitForTimeout(1500);
    steps.push('item_added_to_cart');

    // Step 4: After adding to cart, a modal/popup appears with "Перейти в корзину"
    console.log('Step 4: Looking for "Go to cart" button in popup...');

    const goToCartSelectors = [
      'button:has-text("Перейти в корзину")',
      'button:has-text("В корзину")',
      'button:has-text("Go to cart")',
      'a:has-text("Перейти в корзину")',
      '[data-testid="go-to-cart"]'
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

    if (wentToCart) {
      steps.push('went_to_cart');
      await page.waitForTimeout(2000);
    } else {
      // Fallback: click cart icon in header
      console.log('  "Go to cart" not found, trying cart icon...');
      const cartIconSelectors = [
        'header [class*="cart"]',
        '[data-testid="cart-icon"]',
        'button[aria-label*="корзин"]'
      ];

      for (const selector of cartIconSelectors) {
        try {
          const icon = page.locator(selector).first();
          if (await icon.count() > 0 && await icon.isVisible()) {
            await icon.click();
            console.log(`  Opened cart via: ${selector}`);
            await page.waitForTimeout(1500);
            break;
          }
        } catch (e) { /* continue */ }
      }
    }

    // Step 5: Now in cart view, look for checkout button
    console.log('Step 5: Looking for checkout button in cart...');

    const checkoutButtonSelectors = [
      // Checkout buttons
      'button:has-text("Оформить заказ")',
      'button:has-text("Перейти к оформлению")',
      'button:has-text("К оформлению")',
      'button:has-text("Оформить")',
      'button:has-text("Checkout")',
      'a:has-text("Оформить заказ")',
      'a:has-text("К оформлению")',
      'a[href*="checkout"]',
      '[data-testid="checkout-button"]',
      '[data-testid="proceed-to-checkout"]'
    ];

    let checkoutClicked = false;

    for (const selector of checkoutButtonSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0 && await btn.isVisible()) {
          await btn.click();
          checkoutClicked = true;
          console.log(`  Clicked checkout: ${selector}`);
          break;
        }
      } catch (e) { /* continue */ }
    }

    // If still not found, print what we have
    if (!checkoutClicked) {
      console.log('  Checkout button not found, dumping visible buttons...');
      const visibleButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a[href]'));
        return buttons.filter(b => b.offsetParent !== null).map(b => ({
          tag: b.tagName,
          text: b.textContent?.trim().substring(0, 50),
          className: b.className?.substring(0, 50),
          href: b.getAttribute('href')
        })).filter(b =>
          b.text?.includes('Оформ') ||
          b.text?.includes('оформ') ||
          b.text?.includes('Checkout') ||
          b.text?.includes('checkout') ||
          b.href?.includes('checkout')
        );
      });
      console.log('  Relevant buttons found:', JSON.stringify(visibleButtons, null, 2));
    }

    // Wait for navigation
    await page.waitForTimeout(2000);

    if (checkoutClicked) {
      steps.push('checkout_button_clicked');
    } else {
      // Fallback: navigate directly but log warning
      console.log('  WARNING: Could not find checkout button, navigating directly');
      steps.push('checkout_button_not_found_fallback');
    }

    // Step 5: Capture final state
    console.log('Step 5: Capturing final state...');
    const finalUrl = page.url();

    // Check localStorage for cart data
    const cartData = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter(k =>
        k.includes('cart') || k.includes('Cart') || k.includes('basket')
      );
      const data = {};
      keys.forEach(k => {
        try {
          data[k] = JSON.parse(localStorage.getItem(k));
        } catch {
          data[k] = localStorage.getItem(k);
        }
      });
      return { keys, data, allKeys: Object.keys(localStorage) };
    });

    steps.push('final_state_captured');

    // Take screenshot
    await page.screenshot({
      path: OUTPUT_PATH,
      fullPage: true
    });

    const result = {
      Agent_Response: {
        task_id: "screenshot-t2-final",
        status: "success",
        result: {
          screenshot_path: OUTPUT_PATH,
          final_url: finalUrl,
          steps_completed: steps,
          is_on_checkout: finalUrl.includes('/checkout'),
          is_on_catalog: finalUrl.includes('/catalog'),
          is_on_auth: finalUrl.includes('/auth') || finalUrl.includes('/login'),
          localStorage_cart_keys: cartData.keys,
          localStorage_all_keys: cartData.allKeys
        },
        metadata: {
          viewport: "1920x1080",
          headless: true,
          checkout_via_button: checkoutClicked
        }
      }
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    // Take screenshot on error too
    try {
      await page.screenshot({
        path: OUTPUT_PATH.replace('.png', '-error.png'),
        fullPage: true
      });
    } catch (e) { /* ignore */ }

    const result = {
      Agent_Response: {
        task_id: "screenshot-t2-final",
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

testGuestCheckoutFlow();
