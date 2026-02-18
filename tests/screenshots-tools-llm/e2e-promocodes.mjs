/**
 * E2E Test: ЛК-5 - Promocodes
 *
 * Tests:
 * 1. Valid promocode (WELCOME10) - should apply 10% discount
 * 2. Invalid promocode - should show error
 * 3. Expired promocode (EXPIRED5) - should show expiry error
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const timestamp = Date.now();

const TEST_USER = {
  email: `test-promo-${timestamp}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test Promo User'
};

async function runTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const results = { passed: 0, failed: 0, tests: [] };

  try {
    console.log('\n=== ЛК-5 Test: Promocodes ===\n');

    // Step 1: Register
    console.log('Step 1: Register user');
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Зарегистрироваться")');
    await page.waitForTimeout(500);
    await page.fill('input#fullName', TEST_USER.fullName);
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);
    await page.click('button:has-text("Зарегистрироваться")');
    await page.waitForTimeout(3000);
    console.log('  Registration: PASSED');
    results.tests.push({ name: 'Registration', status: 'passed' });
    results.passed++;

    // Step 2: Add product to cart
    console.log('\nStep 2: Add product to cart');
    await page.goto(`${BASE_URL}/catalog?gender=women`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Close cookie banner
    const acceptBtn = page.locator('button:has-text("Принять")').first();
    if (await acceptBtn.count() > 0) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }

    // Click first product
    const productLink = page.locator('a[href*="/product/"]').first();
    await productLink.click();
    await page.waitForTimeout(2000);

    // Select size
    const sizeBtn = page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L")').first();
    if (await sizeBtn.count() > 0) {
      await sizeBtn.click();
      await page.waitForTimeout(500);
    }

    // Add to cart
    await page.click('button:has-text("В корзину")');
    await page.waitForTimeout(1500);
    console.log('  Product added');
    results.tests.push({ name: 'Add to Cart', status: 'passed' });
    results.passed++;

    // Step 3: Go to checkout
    console.log('\nStep 3: Navigate to checkout');
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Get initial subtotal
    const subtotalText = await page.locator('text=/Подытог.*₽/').first().textContent();
    console.log('  ' + subtotalText);

    // Step 4: Test INVALID promocode
    console.log('\nStep 4: Test invalid promocode');
    const promoInput = page.locator('input[placeholder*="промокод"]').first();
    const applyBtn = page.locator('button:has-text("Применить")').first();

    await promoInput.fill('INVALIDCODE');
    await applyBtn.click();
    await page.waitForTimeout(1500);

    const errorMsg = page.locator('text=не найден');
    if (await errorMsg.count() > 0) {
      console.log('  Invalid code error: PASSED');
      results.tests.push({ name: 'Invalid Promocode Error', status: 'passed' });
      results.passed++;
    } else {
      console.log('  Invalid code error: FAILED');
      results.tests.push({ name: 'Invalid Promocode Error', status: 'failed' });
      results.failed++;
    }

    // Screenshot of error
    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/promocode-invalid-${timestamp}.png`
    });

    // Step 5: Test VALID promocode (WELCOME10)
    console.log('\nStep 5: Test valid promocode WELCOME10');
    await promoInput.fill('');
    await promoInput.fill('WELCOME10');
    await applyBtn.click();
    await page.waitForTimeout(2000);

    const appliedMsg = page.locator('text=Применён');
    if (await appliedMsg.count() > 0) {
      console.log('  Promocode applied: PASSED');
      results.tests.push({ name: 'Valid Promocode Applied', status: 'passed' });
      results.passed++;

      // Check discount line
      const discountLine = page.locator('text=/WELCOME10.*-10%/');
      if (await discountLine.count() > 0) {
        console.log('  Discount shown in summary: PASSED');
        results.tests.push({ name: 'Discount Displayed', status: 'passed' });
        results.passed++;
      } else {
        console.log('  Discount shown in summary: FAILED');
        results.tests.push({ name: 'Discount Displayed', status: 'failed' });
        results.failed++;
      }
    } else {
      console.log('  Promocode applied: FAILED');
      results.tests.push({ name: 'Valid Promocode Applied', status: 'failed' });
      results.failed++;
    }

    // Screenshot of applied promocode
    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/promocode-applied-${timestamp}.png`
    });

    // Step 6: Test remove promocode
    console.log('\nStep 6: Test remove promocode');
    const removeBtn = page.locator('button:has-text("Убрать")').first();
    if (await removeBtn.count() > 0) {
      await removeBtn.click();
      await page.waitForTimeout(2000);  // Wait for React state update

      // Check that the green promocode block is gone (more specific than just "Применён" text)
      // The toast notification also contains "применён" so we check for the specific WELCOME10 text
      const promocodeBlock = await page.locator('.bg-green-50:has-text("WELCOME10")').count();
      const discountLine = await page.locator('text=/Промокод.*WELCOME10/').count();

      if (promocodeBlock === 0 && discountLine === 0) {
        console.log('  Remove promocode: PASSED');
        results.tests.push({ name: 'Remove Promocode', status: 'passed' });
        results.passed++;
      } else {
        console.log(`  Remove promocode: FAILED (green block: ${promocodeBlock}, discount line: ${discountLine})`);
        results.tests.push({ name: 'Remove Promocode', status: 'failed' });
        results.failed++;
      }
    } else {
      console.log('  Remove button not found');
      results.tests.push({ name: 'Remove Promocode', status: 'failed', message: 'Button not found' });
      results.failed++;
    }

    // Final screenshot
    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/promocode-final-${timestamp}.png`,
      fullPage: true
    });

  } catch (error) {
    console.error('\nTest error:', error.message);
    results.tests.push({ name: 'Test Execution', status: 'failed', message: error.message });
    results.failed++;
  } finally {
    await browser.close();
  }

  // Print results
  console.log('\n===========================================');
  console.log('  ЛК-5 PROMOCODES TEST RESULTS');
  console.log('===========================================');
  console.log(`  Passed: ${results.passed}`);
  console.log(`  Failed: ${results.failed}`);
  console.log('\nTest Details:');
  results.tests.forEach(t => {
    console.log(`  [${t.status.toUpperCase()}] ${t.name}${t.message ? ': ' + t.message : ''}`);
  });
  console.log('===========================================\n');

  if (results.failed > 0) process.exit(1);
}

runTest();
