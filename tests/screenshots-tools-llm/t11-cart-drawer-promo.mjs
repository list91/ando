// T11: Screenshot cart drawer showing registration promo block with 5% discount
// Target: Orange/amber promo banner with "5%" badge and "Получить скидку" button
// Cart is a drawer/sidebar, not a separate page

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results';

async function screenshotCartDrawerPromo() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const steps = [];
  let promoBlockInfo = null;
  const screenshots = [];

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
      'a[href*="/product"]',
      '[data-testid="product-card"]',
      '.product-card',
      '[class*="ProductCard"]'
    ];

    for (const selector of productSelectors) {
      try {
        const el = page.locator(selector).first();
        if (await el.count() > 0) {
          await el.click();
          console.log(`  Clicked: ${selector}`);
          steps.push('product_page_opened');
          break;
        }
      } catch (e) { /* continue */ }
    }

    await page.waitForTimeout(1500);

    // Step 3: Select size
    console.log('Step 3: Selecting size...');
    const sizeSelectors = [
      'button:has-text("S")',
      'button:has-text("M")',
      'button:has-text("L")'
    ];

    for (const selector of sizeSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0 && await btn.isVisible()) {
          await btn.click();
          console.log(`  Selected: ${selector}`);
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
      'button:has-text("Добавить в корзину")'
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

    // Step 5: Modal appears after adding - screenshot it
    console.log('Step 5: Checking for add-to-cart modal/popup...');
    const modalScreenshot = `${OUTPUT_DIR}/t11-add-to-cart-modal.png`;
    await page.screenshot({ path: modalScreenshot, fullPage: false });
    screenshots.push(modalScreenshot);

    // Step 6: Click "Go to cart" in popup OR click cart icon in header
    console.log('Step 6: Opening cart drawer...');

    // First try popup button
    const goToCartSelectors = [
      'button:has-text("Перейти в корзину")',
      'a:has-text("Перейти в корзину")',
      'button:has-text("Go to cart")'
    ];

    let cartOpened = false;
    for (const selector of goToCartSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.count() > 0 && await btn.isVisible()) {
          await btn.click();
          cartOpened = true;
          console.log(`  Clicked popup button: ${selector}`);
          break;
        }
      } catch (e) { /* continue */ }
    }

    // If no popup button, click cart icon in header
    if (!cartOpened) {
      console.log('  Trying cart icon in header...');
      const cartIconSelectors = [
        'header button[aria-label*="корзин"]',
        'header [class*="cart"]',
        'button[class*="cart"]',
        '[data-testid="cart-icon"]',
        'header svg[class*="cart"]',
        // Common cart icon patterns
        'header button:has(svg)',
        'a[href*="cart"]'
      ];

      for (const selector of cartIconSelectors) {
        try {
          const icon = page.locator(selector).first();
          if (await icon.count() > 0 && await icon.isVisible()) {
            await icon.click();
            cartOpened = true;
            console.log(`  Clicked cart icon: ${selector}`);
            break;
          }
        } catch (e) { /* continue */ }
      }
    }

    await page.waitForTimeout(2000);
    steps.push('cart_drawer_opened');

    // Step 7: Screenshot with cart drawer open
    console.log('Step 7: Taking screenshot with cart drawer...');
    const cartDrawerScreenshot = `${OUTPUT_DIR}/t11-cart-drawer.png`;
    await page.screenshot({ path: cartDrawerScreenshot, fullPage: false });
    screenshots.push(cartDrawerScreenshot);

    // Step 8: Look for promo block with 5% discount in drawer
    console.log('Step 8: Looking for promo block in drawer...');

    const promoSelectors = [
      // Look for 5% text
      'text=/5%/',
      'text=/5 %/',
      // Look for discount-related elements
      '[class*="promo"]',
      '[class*="Promo"]',
      '[class*="discount"]',
      '[class*="Discount"]',
      '[class*="banner"]',
      '[class*="Banner"]',
      // Registration CTA
      'text=/Получить скидку/i',
      'button:has-text("Получить скидку")',
      'a:has-text("Получить скидку")',
      // Auth related
      '[class*="register"]',
      '[class*="Register"]',
      '[class*="auth"]',
      '[class*="Auth"]',
      // Bonus
      '[class*="bonus"]',
      '[class*="Bonus"]',
      // Drawer specific
      '[class*="drawer"] [class*="promo"]',
      '[class*="Drawer"] [class*="Promo"]',
      '[class*="sidebar"] [class*="promo"]'
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
            console.log(`  Found promo: ${selector} at Y=${box.y}px`);

            // Take focused screenshot of promo block
            try {
              await el.screenshot({ path: `${OUTPUT_DIR}/t11-promo-block.png` });
              screenshots.push(`${OUTPUT_DIR}/t11-promo-block.png`);
            } catch (e) { /* ignore */ }
            break;
          }
        }
      } catch (e) { /* continue */ }
    }

    // Check page content for promo text
    const pageContent = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        has5percent: body.includes('5%') || body.includes('5 %'),
        hasGetDiscount: body.toLowerCase().includes('получить скидку'),
        hasRegister: body.toLowerCase().includes('зарегистр'),
        hasBonus: body.toLowerCase().includes('бонус')
      };
    });

    steps.push('promo_search_completed');

    // Step 9: Dump all visible text in drawer area for analysis
    const drawerContent = await page.evaluate(() => {
      // Try to find drawer/sidebar element
      const drawerSelectors = [
        '[class*="drawer"]',
        '[class*="Drawer"]',
        '[class*="sidebar"]',
        '[class*="Sidebar"]',
        '[class*="cart"]',
        '[class*="Cart"]',
        '[role="dialog"]',
        '[class*="modal"]'
      ];

      for (const sel of drawerSelectors) {
        const el = document.querySelector(sel);
        if (el && el.innerText) {
          return {
            selector: sel,
            text: el.innerText.substring(0, 1000),
            found: true
          };
        }
      }
      return { found: false, text: document.body.innerText.substring(0, 500) };
    });

    const result = {
      Agent_Response: {
        task_id: "screenshot-t11",
        status: "success",
        result: {
          screenshots: screenshots,
          current_url: page.url(),
          promo_block: {
            found: promoFound,
            info: promoBlockInfo,
            content_check: pageContent
          },
          drawer_content: drawerContent,
          steps_completed: steps
        },
        metadata: {
          viewport: "1920x1080"
        }
      }
    };

    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    try {
      await page.screenshot({
        path: `${OUTPUT_DIR}/t11-error.png`,
        fullPage: true
      });
      screenshots.push(`${OUTPUT_DIR}/t11-error.png`);
    } catch (e) { /* ignore */ }

    const result = {
      Agent_Response: {
        task_id: "screenshot-t11",
        status: "failed",
        result: {
          error: error.message,
          steps_completed: steps,
          current_url: page.url(),
          screenshots: screenshots
        }
      }
    };
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

screenshotCartDrawerPromo();
