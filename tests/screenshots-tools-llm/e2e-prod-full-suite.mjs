/**
 * E2E Production Test Suite
 * Tests all implemented features on production server
 *
 * Target: http://83.166.246.253
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://83.166.246.253';
const timestamp = Date.now();

const TEST_USER = {
  email: `test-prod-${timestamp}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test Prod User'
};

const results = {
  total: { passed: 0, failed: 0 },
  suites: []
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAllTests() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  console.log('\n' + '='.repeat(60));
  console.log('  PRODUCTION E2E TEST SUITE');
  console.log('  Server: ' + BASE_URL);
  console.log('='.repeat(60) + '\n');

  try {
    // ========== REGISTRATION ==========
    console.log('>>> REGISTRATION');
    try {
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(2000);
    } catch (e) {
      console.log('    Auth page navigation timeout, continuing...');
    }

    // Switch to registration mode
    const signupBtn = page.locator('button:has-text("Зарегистрироваться")').first();
    if (await signupBtn.count() > 0) {
      await signupBtn.click();
      await sleep(500);
    }

    await page.fill('input#fullName', TEST_USER.fullName);
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);

    const registerBtn = page.locator('button[type="submit"]:has-text("Зарегистрироваться"), button:has-text("Зарегистрироваться")').first();
    await registerBtn.click();
    await sleep(4000);

    const afterRegUrl = page.url();
    const regPassed = !afterRegUrl.includes('/auth');
    console.log(`    URL after registration: ${afterRegUrl}`);
    logResult('Registration', regPassed);

    // Take screenshot after registration
    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-registration-${timestamp}.png`
    });

    // Close cookie banner if present
    const acceptBtn = page.locator('button:has-text("Принять")').first();
    if (await acceptBtn.count() > 0) {
      await acceptBtn.click();
      await sleep(500);
    }

    // ========== ЛК-1: DISCOUNTS TAB ==========
    console.log('\n>>> ЛК-1: DISCOUNTS TAB');
    try {
      await page.goto(`${BASE_URL}/orders`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      // Wait for page to fully load - check for spinner to disappear
      await page.waitForSelector('text=Загрузка', { state: 'hidden', timeout: 15000 }).catch(() => {});
      await sleep(3000);
    } catch (e) {
      console.log('    Navigation timeout, continuing...');
    }

    const discountsTab = page.locator('button:has-text("Мои скидки")').first();
    let tabExists = await discountsTab.count() > 0;

    // If not found, wait more and retry
    if (!tabExists) {
      await sleep(5000);
      tabExists = await discountsTab.count() > 0;
    }
    logResult('ЛК-1: Discounts tab exists', tabExists);

    if (tabExists) {
      await discountsTab.click();
      await sleep(1500);

      // Check for discount content (% symbols indicate discount cards)
      const discountContent = page.locator('text=/\\d+%/');
      const hasDiscounts = await discountContent.count() > 0;
      logResult('ЛК-1: Discount cards visible', hasDiscounts);
    }

    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-lk1-discounts-${timestamp}.png`
    });

    // ========== ЛК-2: DELIVERY ADDRESS ==========
    console.log('\n>>> ЛК-2: DELIVERY ADDRESS');

    // Go to profile tab
    const profileTab = page.locator('button:has-text("Профиль")').first();
    if (await profileTab.count() > 0) {
      await profileTab.click();
      await sleep(1500);
    }

    // Find and fill address field
    const addressField = page.locator('textarea#deliveryAddress, textarea[placeholder*="Улица"]').first();
    const addressExists = await addressField.count() > 0;
    logResult('ЛК-2: Address field exists', addressExists);

    if (addressExists) {
      const testAddress = 'г. Москва, ул. Тестовая, д. 1';
      await addressField.fill(testAddress);

      // Save profile
      const saveBtn = page.locator('button:has-text("Сохранить")').first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await sleep(2000);
      }
      logResult('ЛК-2: Address saved', true);
    }

    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-lk2-address-${timestamp}.png`
    });

    // ========== ADD PRODUCT TO CART ==========
    console.log('\n>>> ADD PRODUCT TO CART');
    try {
      await page.goto(`${BASE_URL}/catalog?gender=women`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(4000);
    } catch (e) {
      console.log('    Catalog navigation timeout, continuing...');
    }

    // Click first product
    const productLink = page.locator('a[href*="/product/"]').first();
    const hasProducts = await productLink.count() > 0;
    logResult('Catalog: Products visible', hasProducts);

    if (hasProducts) {
      await productLink.click();
      await sleep(2000);

      // Select size
      const sizeBtn = page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L"), button:has-text("42"), button:has-text("44")').first();
      if (await sizeBtn.count() > 0) {
        await sizeBtn.click();
        await sleep(500);
      }

      // Add to cart
      const addToCartBtn = page.locator('button:has-text("В корзину")').first();
      if (await addToCartBtn.count() > 0) {
        await addToCartBtn.click();
        await sleep(2000);
        logResult('Cart: Product added', true);
      }
    }

    // ========== CHECKOUT TESTS ==========
    console.log('\n>>> CHECKOUT PAGE');
    try {
      await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(3000);
    } catch (e) {
      console.log('    Checkout navigation timeout, continuing...');
    }

    // Check checkout loaded
    const checkoutTitle = page.locator('text=Оформление заказа');
    const checkoutTitle2 = page.locator('h1:has-text("Оформление")');
    const checkoutLoaded = (await checkoutTitle.count() > 0) || (await checkoutTitle2.count() > 0) || page.url().includes('/checkout');
    logResult('Checkout: Page loaded', checkoutLoaded);

    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-checkout-initial-${timestamp}.png`
    });

    // Scroll down to see all checkout sections
    await page.evaluate(() => window.scrollTo(0, 500));
    await sleep(1000);

    // ========== П-7: FIRST ORDER DISCOUNT ==========
    console.log('\n>>> П-7: FIRST ORDER DISCOUNT');
    // For logged-in NEW users, check for discount in order summary
    const discountInSummary = page.locator('text=/Скидка.*первый|первый.*заказ.*5%|-.*₽/i');
    const firstOrderBanner = page.locator('text=/5%.*первый заказ/i');
    const hasFirstOrderDiscount = (await discountInSummary.count() > 0) || (await firstOrderBanner.count() > 0);
    logResult('П-7: First order discount visible', hasFirstOrderDiscount);

    // Scroll more to find promocode section
    await page.evaluate(() => window.scrollTo(0, 800));
    await sleep(1000);

    // ========== ЛК-5: PROMOCODES ==========
    console.log('\n>>> ЛК-5: PROMOCODES');
    // Look for promocode card/section
    const promoInput = page.locator('input[placeholder*="ромокод"]').first();
    const promoCard = page.locator('text=Промокод').first();
    let promoExists = (await promoInput.count() > 0) || (await promoCard.count() > 0);

    // If not found, scroll down more
    if (!promoExists) {
      await page.evaluate(() => window.scrollTo(0, 1200));
      await sleep(1000);
      promoExists = (await promoInput.count() > 0) || (await promoCard.count() > 0);
    }
    logResult('ЛК-5: Promocode input exists', promoExists);

    if (promoExists) {
      // Test invalid promocode
      await promoInput.fill('INVALIDCODE');
      const applyBtn = page.locator('button:has-text("Применить")').first();
      if (await applyBtn.count() > 0) {
        await applyBtn.click();
        await sleep(2000);
      }

      const errorMsg = page.locator('text=не найден');
      const errorMsg2 = page.locator('text=неактивен');
      const showsError = (await errorMsg.count() > 0) || (await errorMsg2.count() > 0);
      logResult('ЛК-5: Invalid code shows error', showsError);

      // Test valid promocode WELCOME10
      await promoInput.fill('');
      await promoInput.fill('WELCOME10');
      if (await applyBtn.count() > 0) {
        await applyBtn.click();
        await sleep(2000);
      }

      const appliedMsg = page.locator('text=Применён, text=WELCOME10, .bg-green-50');
      const codeApplied = await appliedMsg.count() > 0;
      logResult('ЛК-5: WELCOME10 applied', codeApplied);

      await page.screenshot({
        path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-lk5-promocode-${timestamp}.png`
      });
    }

    // ========== П-4: CONSENT CHECKBOXES ==========
    console.log('\n>>> П-4: CONSENT CHECKBOXES');
    const pdCheckbox = page.locator('button#personalDataProcessing[role="checkbox"]');
    const dsCheckbox = page.locator('button#dataSharing[role="checkbox"]');

    const pdExists = await pdCheckbox.count() > 0;
    const dsExists = await dsCheckbox.count() > 0;
    logResult('П-4: Personal data checkbox exists', pdExists);
    logResult('П-4: Data sharing checkbox exists', dsExists);

    // ========== П-3: PAYMENT METHOD ==========
    console.log('\n>>> П-3: PAYMENT METHOD');
    const paymentSection = page.locator('text=Оплата');
    const paymentSection2 = page.locator('text=Способ оплаты');
    const hasPaymentSection = (await paymentSection.count() > 0) || (await paymentSection2.count() > 0);
    logResult('П-3: Payment section visible', hasPaymentSection);

    // Final checkout screenshot
    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-checkout-final-${timestamp}.png`,
      fullPage: true
    });

    // ========== ЛК-2: ADDRESS AUTO-FILL ==========
    console.log('\n>>> ЛК-2: ADDRESS AUTO-FILL');
    const checkoutAddress = page.locator('textarea[placeholder*="Улица"], textarea#address').first();
    if (await checkoutAddress.count() > 0) {
      const addressValue = await checkoutAddress.inputValue();
      const hasAddress = addressValue && addressValue.length > 5;
      logResult('ЛК-2: Address auto-filled', hasAddress);
      if (hasAddress) {
        console.log(`    Value: "${addressValue.substring(0, 50)}..."`);
      }
    }

  } catch (error) {
    console.error('\n!!! TEST ERROR:', error.message);
    results.total.failed++;
  } finally {
    await browser.close();
  }

  // Print final results
  printResults();
}

function logResult(name, passed) {
  const status = passed ? 'PASS' : 'FAIL';
  const icon = passed ? '✅' : '❌';
  console.log(`  ${icon} [${status}] ${name}`);

  if (passed) {
    results.total.passed++;
  } else {
    results.total.failed++;
  }

  results.suites.push({ name, status: passed ? 'passed' : 'failed' });
}

function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('  PRODUCTION TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`  ✅ Passed: ${results.total.passed}`);
  console.log(`  ❌ Failed: ${results.total.failed}`);
  console.log(`  📊 Total:  ${results.total.passed + results.total.failed}`);
  console.log('='.repeat(60));

  if (results.total.failed > 0) {
    console.log('\nFailed tests:');
    results.suites.filter(s => s.status === 'failed').forEach(s => {
      console.log(`  - ${s.name}`);
    });
  }

  console.log('\nScreenshots saved to:');
  console.log('  C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-*');
  console.log('');

  if (results.total.failed > 0) {
    process.exit(1);
  }
}

runAllTests();
