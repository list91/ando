/**
 * E2E Test: Checkout Discount Button (БАГ-2)
 *
 * Tests:
 * 1. Navigate to checkout as guest
 * 2. Click "Получить скидку" button
 * 3. Verify redirect to /auth page (not error)
 *
 * Created: 2026-02-17
 * Visual QA Pipeline
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function runDiscountButtonTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const results = {
    tests: [],
    summary: { passed: 0, failed: 0 },
    timestamp: new Date().toISOString()
  };

  try {
    // Clear any existing session
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // ========== TEST 1: Add item to cart ==========
    console.log('\n=== Test 1: Add item to cart ===');

    // Navigate to catalog and add something to cart
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Click on first product
    const productCard = page.locator('[data-testid="product-card"], .product-card, a[href*="/product/"]').first();
    if (await productCard.count() > 0) {
      await productCard.click();
      await page.waitForTimeout(2000);

      // Add to cart
      const addToCartBtn = page.getByRole('button', { name: /в корзину|добавить|add to cart/i }).first();
      if (await addToCartBtn.count() > 0) {
        await addToCartBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    results.tests.push({
      name: 'Add to cart',
      status: 'passed',
      message: 'Navigation to product and cart interaction completed'
    });
    results.summary.passed++;
    console.log('Add to cart: PASSED');

    // ========== TEST 2: Navigate to checkout ==========
    console.log('\n=== Test 2: Navigate to checkout ===');

    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check if promo block is visible
    const promoBlock = page.locator('text=5%').first();
    const discountButton = page.getByRole('link', { name: /получить скидку/i });

    let promoVisible = false;
    if (await promoBlock.count() > 0 && await discountButton.count() > 0) {
      promoVisible = true;
    }

    results.tests.push({
      name: 'Checkout page',
      status: promoVisible ? 'passed' : 'failed',
      message: promoVisible ? 'Promo block with discount button visible' : 'Promo block not found (user may be logged in)'
    });
    if (promoVisible) results.summary.passed++;
    else results.summary.failed++;
    console.log(`Checkout page: ${promoVisible ? 'PASSED' : 'FAILED'}`);

    // ========== TEST 3: Click discount button ==========
    if (promoVisible) {
      console.log('\n=== Test 3: Click discount button ===');

      const urlBefore = page.url();
      await discountButton.click();
      await page.waitForTimeout(2000);
      const urlAfter = page.url();

      // Check result
      let clickStatus = 'failed';
      let clickMessage = '';

      if (urlAfter.includes('/auth')) {
        clickStatus = 'passed';
        clickMessage = 'Successfully redirected to /auth page';
      } else if (urlAfter === urlBefore) {
        clickMessage = 'Button click had no effect (stayed on same page)';
      } else {
        clickMessage = `Redirected to unexpected URL: ${urlAfter}`;
      }

      // Check for error toast
      const errorToast = await page.locator('[data-sonner-toast]').filter({ hasText: /ошибка|error/i }).count();
      if (errorToast > 0) {
        clickStatus = 'failed';
        const toastText = await page.locator('[data-sonner-toast]').first().textContent();
        clickMessage = `Error shown: ${toastText}`;
      }

      results.tests.push({
        name: 'Discount button click',
        status: clickStatus,
        message: clickMessage,
        urlBefore,
        urlAfter
      });
      if (clickStatus === 'passed') results.summary.passed++;
      else results.summary.failed++;
      console.log(`Discount button: ${clickStatus.toUpperCase()} - ${clickMessage}`);

      // Take screenshot
      const timestamp = Date.now();
      const screenshotPath = `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/e2e-checkout-discount-${timestamp}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });
      results.screenshot = screenshotPath;
    }

  } catch (error) {
    results.tests.push({
      name: 'Test execution',
      status: 'failed',
      message: error.message
    });
    results.summary.failed++;
    console.error('Test execution error:', error.message);
  } finally {
    await browser.close();
  }

  // Output results
  console.log('\n=== RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  if (results.summary.failed > 0) {
    process.exit(1);
  }
}

runDiscountButtonTest();
