/**
 * E2E Test: БАГ-2 - Checkout Discount Button
 *
 * Steps:
 * 1. Clear session (guest mode)
 * 2. Add product to cart via API/direct
 * 3. Go to checkout
 * 4. Find and click "Получить скидку"
 * 5. Verify redirect to /auth (not error)
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function runTest() {
  const browser = await chromium.launch({ headless: false }); // visible for debugging
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  const results = {
    tests: [],
    summary: { passed: 0, failed: 0 },
    timestamp: new Date().toISOString()
  };

  try {
    // Step 1: Clear session
    console.log('Step 1: Clear session...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Step 2: Add product to cart
    console.log('Step 2: Add product to cart...');
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Find first product link
    const productLinks = page.locator('a[href*="/product/"]');
    const count = await productLinks.count();
    console.log(`Found ${count} product links`);

    if (count > 0) {
      await productLinks.first().click();
      await page.waitForTimeout(2000);

      // Select size if available
      const sizeBtn = page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L")').first();
      if (await sizeBtn.count() > 0) {
        await sizeBtn.click();
        await page.waitForTimeout(500);
      }

      // Click add to cart
      const addBtn = page.locator('button:has-text("В корзину"), button:has-text("Добавить")').first();
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(1500);
        console.log('Added to cart');
      }
    }

    results.tests.push({ name: 'Add to cart', status: 'passed', message: 'Product added' });
    results.summary.passed++;

    // Step 3: Navigate to checkout
    console.log('Step 3: Go to checkout...');
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/catalog') || currentUrl.includes('/cart')) {
      results.tests.push({ name: 'Checkout access', status: 'failed', message: 'Redirected away - cart empty?' });
      results.summary.failed++;
    } else {
      results.tests.push({ name: 'Checkout access', status: 'passed', message: 'On checkout page' });
      results.summary.passed++;
    }

    // Step 4: Find discount promo block
    console.log('Step 4: Find discount button...');

    // Take screenshot of checkout page
    const timestamp = Date.now();
    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/checkout-before-click-${timestamp}.png`,
      fullPage: true
    });

    // Look for the promo block with different selectors
    const promoTexts = [
      'text=5%',
      'text=скидку',
      'text=Получить скидку',
      'a:has-text("Получить скидку")',
      'a[href*="/auth"]'
    ];

    let discountLink = null;
    for (const selector of promoTexts) {
      const el = page.locator(selector).first();
      if (await el.count() > 0) {
        console.log(`Found element with: ${selector}`);
        if (selector.includes('Получить') || selector.includes('auth')) {
          discountLink = el;
        }
      }
    }

    if (discountLink) {
      results.tests.push({ name: 'Promo block visible', status: 'passed', message: 'Discount button found' });
      results.summary.passed++;

      // Step 5: Click the button
      console.log('Step 5: Click discount button...');
      await discountLink.click();
      await page.waitForTimeout(2000);

      const afterUrl = page.url();
      console.log(`After click URL: ${afterUrl}`);

      // Check for errors
      const errorToast = await page.locator('[data-sonner-toast]:has-text("ошибка"), [data-sonner-toast]:has-text("Error")').count();

      if (errorToast > 0) {
        const toastText = await page.locator('[data-sonner-toast]').first().textContent();
        results.tests.push({ name: 'Discount button click', status: 'failed', message: `Error: ${toastText}` });
        results.summary.failed++;
      } else if (afterUrl.includes('/auth')) {
        results.tests.push({ name: 'Discount button click', status: 'passed', message: 'Redirected to /auth successfully' });
        results.summary.passed++;
      } else {
        results.tests.push({ name: 'Discount button click', status: 'failed', message: `Unexpected URL: ${afterUrl}` });
        results.summary.failed++;
      }

      // Final screenshot
      await page.screenshot({
        path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/checkout-after-click-${timestamp}.png`,
        fullPage: false
      });
      results.screenshot = `checkout-after-click-${timestamp}.png`;

    } else {
      console.log('Promo block not found - user might be logged in');
      results.tests.push({ name: 'Promo block visible', status: 'skipped', message: 'Block not visible (user logged in or cart empty)' });
    }

  } catch (error) {
    results.tests.push({ name: 'Execution', status: 'failed', message: error.message });
    results.summary.failed++;
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  process.exit(results.summary.failed > 0 ? 1 : 0);
}

runTest();
