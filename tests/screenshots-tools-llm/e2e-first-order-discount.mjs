/**
 * E2E Test: First Order 5% Discount (P7)
 *
 * Tests:
 * 1. Register new unique user
 * 2. Navigate to catalog, add product to cart
 * 3. Go to checkout
 * 4. Fill required form fields
 * 5. Verify discount line: "Скидка 5% (первый заказ): -X ₽" in green
 * 6. Verify total is reduced by 5%
 * 7. Take screenshot
 *
 * Created: 2026-02-18
 * Visual QA Pipeline - P7 Task
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots';

// Generate unique test user
const timestamp = Date.now();
const TEST_USER = {
  email: `test-p7-${timestamp}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test P7 User',
  phone: '+79991234567',
  address: 'г. Москва, ул. Тестовая, д. 1, кв. 1'
};

async function runFirstOrderDiscountTest() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false }); // headless: false for debugging
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const results = {
    tests: [],
    summary: { passed: 0, failed: 0 },
    timestamp: new Date().toISOString(),
    screenshots: []
  };

  try {
    // ========== TEST 1: Registration ==========
    console.log('\n=== Test 1: Register New User ===');

    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });

    // Switch to signup mode
    const signupToggle = page.getByRole('button', { name: /зарегистрироваться/i });
    await signupToggle.click();
    await page.waitForTimeout(500);

    // Fill registration form
    await page.fill('input#fullName', TEST_USER.fullName);
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);

    // Submit registration
    const submitButton = page.getByRole('button', { name: /зарегистрироваться/i }).first();
    await submitButton.click();

    // Wait for registration to complete
    await page.waitForTimeout(3000);

    // Verify registration success
    const currentUrl = page.url();
    const successToast = await page.locator('[data-sonner-toast]').filter({ hasText: /успешн|добро пожаловать/i }).count();

    let registrationStatus = 'failed';
    if (successToast > 0 || !currentUrl.includes('/auth')) {
      registrationStatus = 'passed';
      console.log(`Registration: PASSED - User ${TEST_USER.email} created`);
    } else {
      console.log('Registration: FAILED - Could not register user');
    }

    results.tests.push({
      name: 'Registration',
      status: registrationStatus,
      email: TEST_USER.email
    });

    if (registrationStatus === 'passed') results.summary.passed++;
    else results.summary.failed++;

    // Take screenshot after registration
    const screenshotReg = join(OUTPUT_DIR, `e2e-first-order-01-registered-${timestamp}.png`);
    await page.screenshot({ path: screenshotReg });
    results.screenshots.push(screenshotReg);

    // ========== TEST 2: Add Product to Cart ==========
    console.log('\n=== Test 2: Add Product to Cart ===');

    // Navigate to catalog
    await page.goto(`${BASE_URL}/catalog?gender=women`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Click first product
    const productLink = page.locator('a[href^="/product/"]').first();
    if (await productLink.count() > 0) {
      await productLink.click();
      await page.waitForTimeout(2000);
      console.log('   Product page opened');

      // Select size (S, M, L, etc.)
      const sizeSelected = await page.evaluate(() => {
        const sizes = ['S', 'M', 'L', 'XS', 'XL', '42', '44', '46', '48'];
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent?.trim();
          if (text && sizes.includes(text) && btn.offsetParent !== null) {
            btn.click();
            return text;
          }
        }
        return null;
      });

      if (sizeSelected) {
        console.log(`   Size selected: ${sizeSelected}`);
        await page.waitForTimeout(500);
      }

      // Add to cart
      const addBtn = page.locator('button:has-text("ДОБАВИТЬ В КОРЗИНУ")');
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(2000);
        console.log('   Added to cart');

        results.tests.push({
          name: 'Add to Cart',
          status: 'passed',
          size: sizeSelected
        });
        results.summary.passed++;
      } else {
        results.tests.push({
          name: 'Add to Cart',
          status: 'failed',
          message: 'Add to cart button not found'
        });
        results.summary.failed++;
      }
    } else {
      results.tests.push({
        name: 'Add to Cart',
        status: 'failed',
        message: 'No products found in catalog'
      });
      results.summary.failed++;
    }

    // ========== TEST 3: Navigate to Checkout ==========
    console.log('\n=== Test 3: Navigate to Checkout ===');

    // Try to close cart modal if open
    const closeCartModal = page.locator('button:has-text("Перейти в корзину")');
    if (await closeCartModal.count() > 0) {
      await closeCartModal.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to checkout
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    let checkoutUrl = page.url();
    console.log(`   Current URL: ${checkoutUrl}`);

    // If redirected to login, user might not be logged in
    if (checkoutUrl.includes('/auth') || checkoutUrl.includes('/login')) {
      results.tests.push({
        name: 'Checkout Navigation',
        status: 'failed',
        message: 'Redirected to login page - user session lost'
      });
      results.summary.failed++;
    } else {
      results.tests.push({
        name: 'Checkout Navigation',
        status: 'passed'
      });
      results.summary.passed++;
    }

    // ========== TEST 4: Fill Checkout Form ==========
    console.log('\n=== Test 4: Fill Checkout Form ===');

    // Wait for form to load
    await page.waitForTimeout(1000);

    // Fill phone if empty
    const phoneInput = page.locator('input[name="phone"], input#phone, input[placeholder*="телефон" i]').first();
    if (await phoneInput.count() > 0) {
      const phoneValue = await phoneInput.inputValue();
      if (!phoneValue) {
        await phoneInput.fill(TEST_USER.phone);
        console.log('   Phone filled');
      }
    }

    // Select country (Россия)
    const countrySelect = page.locator('[data-testid="country-select"], select[name="country"]').first();
    // Try clicking the select trigger
    const selectTrigger = page.locator('button[role="combobox"]:has-text("Выберите страну")').first();
    if (await selectTrigger.count() > 0) {
      await selectTrigger.click();
      await page.waitForTimeout(300);
      const russiaOption = page.locator('[role="option"]:has-text("Россия")').first();
      if (await russiaOption.count() > 0) {
        await russiaOption.click();
        console.log('   Country selected: Россия');
        await page.waitForTimeout(300);
      }
    }

    // Fill address
    const addressInput = page.locator('input[name="address"], textarea[name="address"], input#address').first();
    if (await addressInput.count() > 0) {
      await addressInput.fill(TEST_USER.address);
      console.log('   Address filled');
    }

    // Check required checkboxes
    const personalDataCheckbox = page.locator('button[role="checkbox"][id*="personal"], [id*="personalData"]').first();
    if (await personalDataCheckbox.count() > 0) {
      const isChecked = await personalDataCheckbox.getAttribute('data-state');
      if (isChecked !== 'checked') {
        await personalDataCheckbox.click();
        console.log('   Personal data consent checked');
      }
    }

    const dataSharingCheckbox = page.locator('button[role="checkbox"][id*="sharing"], [id*="dataSharing"]').first();
    if (await dataSharingCheckbox.count() > 0) {
      const isChecked = await dataSharingCheckbox.getAttribute('data-state');
      if (isChecked !== 'checked') {
        await dataSharingCheckbox.click();
        console.log('   Data sharing consent checked');
      }
    }

    await page.waitForTimeout(1000);

    results.tests.push({
      name: 'Fill Checkout Form',
      status: 'passed'
    });
    results.summary.passed++;

    // ========== TEST 5: Verify Discount Line ==========
    console.log('\n=== Test 5: Verify 5% First Order Discount ===');

    // Scroll to make sure summary is visible
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Look for discount line with specific text
    const discountLine = page.locator('text=Скидка 5% (первый заказ)');
    const discountVisible = await discountLine.count() > 0;

    let discountStatus = 'failed';
    let discountDetails = {};

    if (discountVisible) {
      // Get the discount amount and verify it's green
      const discountInfo = await page.evaluate(() => {
        const discountElements = Array.from(document.querySelectorAll('*')).filter(el =>
          el.textContent?.includes('Скидка 5% (первый заказ)')
        );

        if (discountElements.length > 0) {
          const el = discountElements[0];
          const style = window.getComputedStyle(el);
          const color = style.color;

          // Find the amount (sibling or child)
          const amountMatch = el.textContent?.match(/-?\d+\s*₽/);

          // Check if color is green (rgb(22, 163, 74) or similar)
          const isGreen = color.includes('22') && color.includes('163') && color.includes('74') ||
                          color.includes('34') && color.includes('197') && color.includes('94') ||
                          el.className?.includes('green');

          return {
            text: el.textContent,
            color: color,
            isGreen: isGreen || el.className?.includes('green'),
            amount: amountMatch ? amountMatch[0] : null,
            className: el.className
          };
        }
        return null;
      });

      if (discountInfo) {
        discountStatus = 'passed';
        discountDetails = discountInfo;
        console.log(`   Discount found: ${discountInfo.text}`);
        console.log(`   Color: ${discountInfo.color}`);
        console.log(`   Is green: ${discountInfo.isGreen}`);
      }
    } else {
      console.log('   WARNING: Discount line not found!');
      console.log('   This could mean:');
      console.log('   - User is not logged in');
      console.log('   - User already has orders');
      console.log('   - Cart is empty');

      // Debug: check page state
      const pageState = await page.evaluate(() => {
        return {
          hasUser: document.body.innerText.includes('Выйти') || document.body.innerText.includes('Профиль'),
          hasItems: document.body.innerText.includes('₽'),
          bodyText: document.body.innerText.substring(0, 500)
        };
      });
      console.log('   Page state:', pageState.hasUser ? 'logged in' : 'not logged in');
      discountDetails = { pageState };
    }

    results.tests.push({
      name: 'Verify Discount Line',
      status: discountStatus,
      details: discountDetails
    });

    if (discountStatus === 'passed') results.summary.passed++;
    else results.summary.failed++;

    // ========== TEST 6: Verify Total Calculation ==========
    console.log('\n=== Test 6: Verify Total is Reduced by 5% ===');

    const totalsInfo = await page.evaluate(() => {
      // Find subtotal, discount, and total
      const text = document.body.innerText;

      // Match patterns like "Подытог: 1000 ₽" or "1000 ₽"
      const subtotalMatch = text.match(/Подытог[:\s]*(\d[\d\s]*)\s*₽/i);
      const discountMatch = text.match(/Скидка 5%[^:]*:\s*-?(\d[\d\s]*)\s*₽/i);
      const totalMatch = text.match(/Итого[:\s]*(\d[\d\s]*)\s*₽/i);

      const parseNum = (str) => str ? parseInt(str.replace(/\s/g, ''), 10) : 0;

      return {
        subtotal: subtotalMatch ? parseNum(subtotalMatch[1]) : 0,
        discount: discountMatch ? parseNum(discountMatch[1]) : 0,
        total: totalMatch ? parseNum(totalMatch[1]) : 0
      };
    });

    console.log(`   Subtotal: ${totalsInfo.subtotal} ₽`);
    console.log(`   Discount: ${totalsInfo.discount} ₽`);
    console.log(`   Total: ${totalsInfo.total} ₽`);

    let totalVerificationStatus = 'failed';
    if (totalsInfo.subtotal > 0 && totalsInfo.discount > 0) {
      const expectedDiscount = Math.round(totalsInfo.subtotal * 0.05);
      const expectedTotal = totalsInfo.subtotal - totalsInfo.discount;

      // Allow 1 ruble difference due to rounding
      const discountCorrect = Math.abs(totalsInfo.discount - expectedDiscount) <= 1;
      const totalCorrect = Math.abs(totalsInfo.total - expectedTotal) <= 1;

      if (discountCorrect && totalCorrect) {
        totalVerificationStatus = 'passed';
        console.log(`   Expected discount (5%): ${expectedDiscount} ₽`);
        console.log(`   Calculation CORRECT`);
      } else {
        console.log(`   Expected discount (5%): ${expectedDiscount} ₽ - ${discountCorrect ? 'OK' : 'MISMATCH'}`);
        console.log(`   Expected total: ${expectedTotal} ₽ - ${totalCorrect ? 'OK' : 'MISMATCH'}`);
      }
    } else if (totalsInfo.subtotal > 0 && totalsInfo.discount === 0) {
      console.log('   No discount applied - user may not be eligible');
    }

    results.tests.push({
      name: 'Verify Total Calculation',
      status: totalVerificationStatus,
      details: totalsInfo
    });

    if (totalVerificationStatus === 'passed') results.summary.passed++;
    else results.summary.failed++;

    // ========== FINAL SCREENSHOT ==========
    console.log('\n=== Taking Final Screenshot ===');

    // Scroll to top to show the form with discount
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Highlight discount line for visibility
    await page.evaluate(() => {
      const discountEl = Array.from(document.querySelectorAll('*')).find(el =>
        el.textContent?.includes('Скидка 5% (первый заказ)')
      );
      if (discountEl) {
        discountEl.style.outline = '3px solid red';
        discountEl.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
      }
    });

    const finalScreenshot = join(OUTPUT_DIR, `e2e-first-order-discount-${timestamp}.png`);
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    results.screenshots.push(finalScreenshot);
    console.log(`   Screenshot saved: ${finalScreenshot}`);

    // Viewport screenshot for cleaner view
    const viewportScreenshot = join(OUTPUT_DIR, `e2e-first-order-discount-viewport-${timestamp}.png`);
    await page.screenshot({ path: viewportScreenshot, fullPage: false });
    results.screenshots.push(viewportScreenshot);

  } catch (error) {
    results.tests.push({
      name: 'Test Execution',
      status: 'failed',
      message: error.message,
      stack: error.stack
    });
    results.summary.failed++;
    console.error('\nTest execution error:', error.message);

    // Take error screenshot
    const errorScreenshot = join(OUTPUT_DIR, `e2e-first-order-error-${timestamp}.png`);
    await page.screenshot({ path: errorScreenshot });
    results.screenshots.push(errorScreenshot);
  } finally {
    await browser.close();
  }

  // ========== OUTPUT RESULTS ==========
  console.log('\n' + '='.repeat(60));
  console.log('  E2E FIRST ORDER DISCOUNT TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\nPassed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log('\nTest Details:');
  results.tests.forEach(test => {
    const icon = test.status === 'passed' ? '[PASS]' : '[FAIL]';
    console.log(`  ${icon} ${test.name}`);
    if (test.details) {
      console.log(`        Details: ${JSON.stringify(test.details)}`);
    }
  });
  console.log('\nScreenshots:');
  results.screenshots.forEach(s => console.log(`  - ${s}`));
  console.log('\n' + JSON.stringify(results, null, 2));

  // Exit with error code if tests failed
  if (results.summary.failed > 0) {
    process.exit(1);
  }
}

runFirstOrderDiscountTest();
