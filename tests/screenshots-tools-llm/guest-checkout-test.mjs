import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const CATALOG_URL = `${BASE_URL}/catalog`;
const CHECKOUT_URL = `${BASE_URL}/checkout`;
const OUTPUT_PATH = 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/guest-checkout.png';

async function testGuestCheckout() {
  // Launch browser in incognito mode (new context = clean session, no cookies)
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // No storage state = guest mode (not logged in)
  });
  const page = await context.newPage();

  let cartItemAdded = false;

  try {
    // Step 1: Go to catalog and add item to cart
    console.log('Step 1: Opening catalog...');
    await page.goto(CATALOG_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Find and click on a product card
    console.log('Step 2: Finding product card...');
    const productSelectors = [
      '[data-testid="product-card"]',
      '.product-card',
      '[class*="product"]',
      'article',
      '.card'
    ];

    let productClicked = false;
    for (const selector of productSelectors) {
      const products = page.locator(selector);
      const count = await products.count();
      if (count > 0) {
        console.log(`Found ${count} products with selector: ${selector}`);
        await products.first().click();
        productClicked = true;
        break;
      }
    }

    if (!productClicked) {
      // Try clicking any link that might be a product
      const links = page.locator('a[href*="/product"]');
      const linkCount = await links.count();
      if (linkCount > 0) {
        await links.first().click();
        productClicked = true;
        console.log('Clicked product link');
      }
    }

    await page.waitForTimeout(1500);

    // Step 3: Add to cart
    console.log('Step 3: Adding to cart...');
    const addToCartSelectors = [
      'button:has-text("В корзину")',
      'button:has-text("Добавить в корзину")',
      'button:has-text("Add to cart")',
      '[data-testid="add-to-cart"]',
      'button[class*="cart"]',
      '.add-to-cart'
    ];

    for (const selector of addToCartSelectors) {
      try {
        const btn = page.locator(selector).first();
        const count = await btn.count();
        if (count > 0) {
          await btn.click();
          cartItemAdded = true;
          console.log(`Clicked add to cart: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    await page.waitForTimeout(1500);

    // Step 4: Navigate to checkout
    console.log('Step 4: Going to checkout...');
    await page.goto(CHECKOUT_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Get current URL to verify if redirected
    const currentUrl = page.url();

    // Check if we're on checkout or redirected
    const isOnCheckout = currentUrl.includes('/checkout');
    const isOnCatalog = currentUrl.includes('/catalog');
    const isOnAuth = currentUrl.includes('/auth') || currentUrl.includes('/login');

    let verification = 'unknown';
    if (isOnCheckout) {
      verification = 'checkout_accessible';
    } else if (isOnCatalog) {
      verification = 'redirected_to_catalog';
    } else if (isOnAuth) {
      verification = 'redirected_to_auth';
    }

    // Take screenshot
    await page.screenshot({
      path: OUTPUT_PATH,
      fullPage: true
    });

    const result = {
      Agent_Response: {
        task_id: "screenshot-t2-retry",
        status: "success",
        result: {
          tool_used: "guest-checkout-test.mjs (Playwright)",
          screenshot_path: OUTPUT_PATH,
          verification: verification,
          current_url: currentUrl,
          cart_item_added: cartItemAdded
        },
        metadata: {
          viewport: "1920x1080",
          headless: true
        }
      }
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const result = {
      Agent_Response: {
        task_id: "screenshot-t2-retry",
        status: "failed",
        result: {
          tool_used: "guest-checkout-test.mjs",
          error: error.message
        },
        metadata: {}
      }
    };
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

testGuestCheckout();
