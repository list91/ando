/**
 * E2E Test: ЛК-2 - Delivery Address in Profile
 *
 * Tests:
 * 1. Save delivery address in profile
 * 2. Verify auto-fill on checkout page
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const timestamp = Date.now();

const TEST_USER = {
  email: `test-lk2-${timestamp}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test LK2 User'
};

const TEST_ADDRESS = 'г. Москва, ул. Тверская, д. 1, кв. 100';

async function runTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const results = { passed: 0, failed: 0, tests: [] };

  try {
    console.log('\n=== ЛК-2 Test: Delivery Address in Profile ===\n');

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

    const afterRegUrl = page.url();
    if (!afterRegUrl.includes('/auth')) {
      console.log('  Registration: PASSED');
      results.tests.push({ name: 'Registration', status: 'passed' });
      results.passed++;
    } else {
      console.log('  Registration: FAILED');
      results.tests.push({ name: 'Registration', status: 'failed' });
      results.failed++;
    }

    // Step 2: Go to profile and save address
    console.log('\nStep 2: Save address in profile');
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Close cookie banner if present
    const acceptCookieBtn = page.locator('button:has-text("Принять")').first();
    if (await acceptCookieBtn.count() > 0) {
      await acceptCookieBtn.click();
      await page.waitForTimeout(500);
      console.log('  Cookie banner closed');
    }

    // Click on Profile tab
    await page.click('button:has-text("Профиль")');
    await page.waitForTimeout(1000);

    // Fill delivery address
    const addressField = page.locator('textarea#deliveryAddress, textarea[placeholder*="Улица"]').first();
    const addressFieldExists = await addressField.count() > 0;

    if (addressFieldExists) {
      await addressField.fill(TEST_ADDRESS);
      console.log('  Address field found and filled');

      // Save profile
      await page.click('button:has-text("Сохранить изменения")');
      await page.waitForTimeout(2000);

      results.tests.push({ name: 'Profile Address Field', status: 'passed' });
      results.passed++;
    } else {
      console.log('  ERROR: Address field not found!');
      results.tests.push({ name: 'Profile Address Field', status: 'failed', message: 'Field not found' });
      results.failed++;
    }

    // Screenshot of profile
    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/lk2-profile-address-${timestamp}.png`
    });
    console.log('  Profile screenshot saved');

    // Step 3: Add product to cart
    console.log('\nStep 3: Add product to cart');
    await page.goto(`${BASE_URL}/catalog?gender=women`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Try multiple selectors for product card
    const productSelectors = [
      'a[href*="/product/"]',
      '[class*="product"] a',
      '.group a[href*="product"]',
      'div[class*="grid"] a'
    ];

    let productFound = false;
    for (const selector of productSelectors) {
      const card = page.locator(selector).first();
      if (await card.count() > 0) {
        await card.click();
        productFound = true;
        console.log(`  Product found with selector: ${selector}`);
        break;
      }
    }

    if (!productFound) {
      // Try clicking any clickable product image
      await page.locator('img[src*="product"], img[alt*="пальто"], img[alt*="Тест"]').first().click();
    }

    await page.waitForTimeout(2000);

    // Select size
    const sizeButton = page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L"), button:has-text("42"), button:has-text("44")').first();
    if (await sizeButton.count() > 0) {
      await sizeButton.click();
      await page.waitForTimeout(500);
    }

    // Add to cart
    const addToCartBtn = page.locator('button:has-text("В корзину"), button:has-text("Добавить")').first();
    await addToCartBtn.click();
    await page.waitForTimeout(1500);
    console.log('  Product added to cart');
    results.tests.push({ name: 'Add to Cart', status: 'passed' });
    results.passed++;

    // Step 4: Go to checkout and verify address is auto-filled
    console.log('\nStep 4: Verify address auto-fill on checkout');
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Find address field and check its value
    const checkoutAddress = page.locator('textarea[placeholder*="Улица"], textarea#address').first();
    let addressValue = '';

    try {
      addressValue = await checkoutAddress.inputValue();
    } catch (e) {
      console.log('  Could not get address value');
    }

    if (addressValue && (addressValue.includes('Тверская') || addressValue.includes('Москва'))) {
      console.log('  Auto-fill: PASSED');
      console.log(`  Address value: "${addressValue}"`);
      results.tests.push({ name: 'Checkout Auto-fill', status: 'passed', value: addressValue });
      results.passed++;
    } else {
      console.log('  Auto-fill: FAILED');
      console.log(`  Address value: "${addressValue || '(empty)'}"`);
      results.tests.push({ name: 'Checkout Auto-fill', status: 'failed', value: addressValue });
      results.failed++;
    }

    // Screenshot of checkout
    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/lk2-checkout-autofill-${timestamp}.png`
    });
    console.log('  Checkout screenshot saved');

  } catch (error) {
    console.error('\nTest error:', error.message);
    results.tests.push({ name: 'Test Execution', status: 'failed', message: error.message });
    results.failed++;
  } finally {
    await browser.close();
  }

  // Print results
  console.log('\n===========================================');
  console.log('  ЛК-2 TEST RESULTS');
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
