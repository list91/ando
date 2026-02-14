import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const CATALOG_URL = `${BASE_URL}/catalog`;
const OUTPUT_PATH = 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/checkout-t3-t10-fullpage.png';

async function screenshotCheckoutForm() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 2400 },  // Tall viewport to capture full page
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

    // Step 4: Click "Перейти в корзину" in the modal that appeared
    console.log('Step 4: Looking for modal with "Перейти в корзину" button...');

    // Wait for modal to appear
    await page.waitForTimeout(500);

    const goToCartButton = page.locator('button:has-text("Перейти в корзину")').first();
    if (await goToCartButton.count() > 0 && await goToCartButton.isVisible()) {
      await goToCartButton.click();
      console.log('  Clicked "Перейти в корзину" in modal');
      steps.push('modal_go_to_cart_clicked');
    } else {
      console.log('  Modal button not found, navigating directly...');
    }

    await page.waitForTimeout(2000);

    // Verify we're on checkout
    let currentUrl = page.url();
    console.log('  Current URL after modal click:', currentUrl);

    // If not on checkout, try direct navigation but wait for cart to persist
    if (!currentUrl.includes('/checkout')) {
      console.log('  Not on checkout, waiting and trying direct navigation...');
      await page.waitForTimeout(1000);
      await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      currentUrl = page.url();
      console.log('  After direct nav:', currentUrl);
    }

    steps.push('checkout_page_loaded');

    // Step 5b: Check if redirected to login, look for guest checkout option
    currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('Step 5b: On login page, looking for guest checkout option...');

      const guestCheckoutSelectors = [
        'button:has-text("Продолжить как гость")',
        'button:has-text("Гостевой заказ")',
        'button:has-text("Guest checkout")',
        'button:has-text("Continue as guest")',
        'a:has-text("Продолжить как гость")',
        'a:has-text("Гостевой")',
        '[data-testid="guest-checkout"]',
        'button:has-text("без регистрации")',
        'a:has-text("без регистрации")'
      ];

      let guestClicked = false;
      for (const selector of guestCheckoutSelectors) {
        try {
          const btn = page.locator(selector).first();
          if (await btn.count() > 0 && await btn.isVisible()) {
            await btn.click();
            guestClicked = true;
            console.log(`  Clicked guest option: ${selector}`);
            break;
          }
        } catch (e) { /* continue */ }
      }

      if (!guestClicked) {
        // Dump visible elements for debugging
        console.log('  Guest checkout not found, checking available options...');
        const buttons = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('button, a'))
            .filter(el => el.offsetParent !== null)
            .map(el => ({
              tag: el.tagName,
              text: el.textContent?.trim().substring(0, 60),
              href: el.getAttribute('href')
            }))
            .filter(el => el.text && el.text.length > 0);
        });
        console.log('  Available buttons:', JSON.stringify(buttons.slice(0, 15), null, 2));
      }

      await page.waitForTimeout(2000);
      steps.push('guest_checkout_attempted');
    }

    // Step 5c: Accept cookie banner if present
    console.log('Step 5c: Accepting cookie banner if present...');
    try {
      const acceptCookieBtn = page.locator('button:has-text("Принять")').first();
      if (await acceptCookieBtn.count() > 0 && await acceptCookieBtn.isVisible()) {
        await acceptCookieBtn.click();
        console.log('  Accepted cookies');
        await page.waitForTimeout(500);
      }
    } catch (e) { /* ignore */ }

    // Step 5d: Scroll to bottom to ensure all lazy content loads
    console.log('Step 5d: Scrolling to load all content...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Step 6: Wait for checkout form to fully load and scroll to reveal all elements
    console.log('Step 6: Waiting for checkout form elements...');

    // Wait for key form elements
    await page.waitForSelector('input, select, button', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // Check for specific checkout form elements mentioned in task
    const formElements = await page.evaluate(() => {
      const elements = {
        authPrompt: !!document.querySelector('[class*="auth"], [class*="login"], [class*="guest"]'),
        firstNameField: !!document.querySelector('input[name*="firstName"], input[placeholder*="Имя"], input[placeholder*="First"]'),
        lastNameField: !!document.querySelector('input[name*="lastName"], input[placeholder*="Фамилия"], input[placeholder*="Last"]'),
        dobField: !!document.querySelector('input[type="date"], input[name*="birth"], input[placeholder*="дата"]'),
        countryDropdown: !!document.querySelector('select[name*="country"], [class*="country"] select'),
        deliverySelector: !!document.querySelector('[class*="delivery"], [class*="shipping"]'),
        consentCheckboxes: document.querySelectorAll('input[type="checkbox"]').length,
        orderSummary: !!document.querySelector('[class*="summary"], [class*="order"], [class*="total"]'),
        payButton: !!document.querySelector('button[class*="pay"]') ||
                   Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('PAY') || b.textContent.includes('Оплатить'))
      };
      return elements;
    });

    console.log('Form elements found:', JSON.stringify(formElements, null, 2));

    // Step 7: Take full page screenshot
    console.log('Step 7: Taking full page screenshot...');
    await page.screenshot({
      path: OUTPUT_PATH,
      fullPage: true
    });

    const finalUrl = page.url();
    steps.push('screenshot_taken');

    const result = {
      Agent_Response: {
        task_id: "screenshot-t3-t10",
        status: "success",
        result: {
          screenshot_path: OUTPUT_PATH,
          final_url: finalUrl,
          steps_completed: steps,
          is_on_checkout: finalUrl.includes('/checkout'),
          form_elements_detected: formElements
        },
        metadata: {
          viewport: "1920x1080",
          headless: true,
          fullPage: true
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
        task_id: "screenshot-t3-t10",
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

screenshotCheckoutForm();
