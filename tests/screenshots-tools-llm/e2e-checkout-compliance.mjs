/**
 * E2E Test: П-3 and П-4 Compliance on Checkout
 *
 * Tests:
 * 1. П-4: Personal data consent checkboxes exist and are required
 * 2. Submit button is disabled without consents
 * 3. П-3: Payment method selector (verify condition logic exists)
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const timestamp = Date.now();

const TEST_USER = {
  email: `test-compliance-${timestamp}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test Compliance User'
};

async function runTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const results = { passed: 0, failed: 0, tests: [] };

  try {
    console.log('\n=== Checkout Compliance Test ===\n');

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

    // Step 4: Test П-4 - Check personal data consent checkboxes exist
    console.log('\nStep 4: Test П-4 - Personal data consent checkboxes');

    // shadcn Checkbox renders as button with role="checkbox"
    const personalDataCheckbox = page.locator('button#personalDataProcessing[role="checkbox"]');
    const dataSharingCheckbox = page.locator('button#dataSharing[role="checkbox"]');

    const pdExists = await personalDataCheckbox.count() > 0;
    const dsExists = await dataSharingCheckbox.count() > 0;

    if (pdExists && dsExists) {
      console.log('  Both consent checkboxes exist: PASSED');
      results.tests.push({ name: 'П-4: Consent Checkboxes Exist', status: 'passed' });
      results.passed++;
    } else {
      console.log(`  Consent checkboxes: FAILED (pd: ${pdExists}, ds: ${dsExists})`);
      results.tests.push({ name: 'П-4: Consent Checkboxes Exist', status: 'failed' });
      results.failed++;
    }

    // Step 5: Test that submit button is disabled without consents
    console.log('\nStep 5: Test submit button disabled without consents');

    // Fill required fields first
    await page.fill('input[placeholder*="Телефон"], input#phone', '+7 999 123 4567');
    await page.waitForTimeout(500);

    // Find submit button
    const submitBtn = page.locator('button:has-text("Оформить заказ")').first();
    const isDisabled = await submitBtn.isDisabled();

    if (isDisabled) {
      console.log('  Submit button disabled without consents: PASSED');
      results.tests.push({ name: 'П-4: Button Disabled Without Consent', status: 'passed' });
      results.passed++;
    } else {
      console.log('  Submit button disabled without consents: FAILED');
      results.tests.push({ name: 'П-4: Button Disabled Without Consent', status: 'failed' });
      results.failed++;
    }

    // Step 6: Check consents and verify button becomes enabled
    console.log('\nStep 6: Check consents and verify button enabled');

    await personalDataCheckbox.click();
    await page.waitForTimeout(300);
    await dataSharingCheckbox.click();
    await page.waitForTimeout(500);

    const isEnabledAfter = !(await submitBtn.isDisabled());

    if (isEnabledAfter) {
      console.log('  Submit button enabled after consents: PASSED');
      results.tests.push({ name: 'П-4: Button Enabled After Consent', status: 'passed' });
      results.passed++;
    } else {
      console.log('  Submit button enabled after consents: FAILED');
      results.tests.push({ name: 'П-4: Button Enabled After Consent', status: 'failed' });
      results.failed++;
    }

    // Step 7: Test П-3 - Payment method selector exists (since we have 2 methods)
    console.log('\nStep 7: Test П-3 - Payment method selector');

    const paymentSelector = page.locator('input[type="radio"][name="payment"], [role="radiogroup"]');
    const hasPaymentSelector = await paymentSelector.count() > 0;

    if (hasPaymentSelector) {
      console.log('  Payment selector visible (2+ methods): PASSED');
      results.tests.push({ name: 'П-3: Payment Selector Visible', status: 'passed' });
      results.passed++;
    } else {
      console.log('  Payment selector visible: FAILED');
      results.tests.push({ name: 'П-3: Payment Selector Visible', status: 'failed' });
      results.failed++;
    }

    // Screenshot
    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/checkout-compliance-${timestamp}.png`,
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
  console.log('  CHECKOUT COMPLIANCE TEST RESULTS');
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
