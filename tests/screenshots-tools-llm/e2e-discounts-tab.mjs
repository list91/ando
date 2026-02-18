/**
 * E2E Test: Discounts Tab Verification
 *
 * Steps:
 * 1. Login with test user credentials
 * 2. Navigate to /orders
 * 3. Click on "Мои скидки" tab
 * 4. Verify discount cards are displayed
 * 5. Take screenshot
 *
 * Created: 2026-02-18
 * Visual QA Pipeline
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

// Generate unique test user for each run
const timestamp = Date.now();
const TEST_USER = {
  email: `test-discounts-${timestamp}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test Discounts User'
};

async function runDiscountsTabTest() {
  const browser = await chromium.launch({ headless: false }); // visible for debugging
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    // Bypass cache to get fresh content
    bypassCSP: true,
  });
  // Clear all caches
  await context.clearCookies();
  const page = await context.newPage();

  // Disable cache on page level
  await page.route('**/*', route => {
    route.continue({
      headers: {
        ...route.request().headers(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  });

  const timestamp = Date.now();
  const results = {
    tests: [],
    summary: { passed: 0, failed: 0 },
    timestamp: new Date().toISOString()
  };

  try {
    // ========== STEP 1: Register new user ==========
    console.log('\n=== Step 1: Register new user ===');

    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Switch to registration mode
    const signupToggle = page.getByRole('button', { name: /зарегистрироваться/i });
    await signupToggle.click();
    await page.waitForTimeout(500);

    // Fill registration form
    await page.fill('input#fullName', TEST_USER.fullName);
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);

    // Submit registration
    const registerButton = page.getByRole('button', { name: /зарегистрироваться/i }).first();
    await registerButton.click();
    await page.waitForTimeout(3000);

    const afterRegisterUrl = page.url();
    const isRegistered = !afterRegisterUrl.includes('/auth');

    if (isRegistered) {
      results.tests.push({ name: 'Registration', status: 'passed', message: 'User registered and logged in' });
      results.summary.passed++;
      console.log('Registration: PASSED');
    } else {
      // Check for toast message
      const toastSuccess = await page.locator('[class*="toast"], [class*="sonner"]').count();
      if (toastSuccess > 0) {
        results.tests.push({ name: 'Registration', status: 'passed', message: 'Registration initiated (check email)' });
        results.summary.passed++;
        console.log('Registration: PASSED (pending email verification)');
      } else {
        results.tests.push({ name: 'Registration', status: 'failed', message: 'Registration failed' });
        results.summary.failed++;
        console.log('Registration: FAILED');
      }
    }

    // ========== STEP 2: Navigate to /orders ==========
    console.log('\n=== Step 2: Navigate to /orders ===');

    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const ordersUrl = page.url();
    if (ordersUrl.includes('/orders')) {
      results.tests.push({ name: 'Navigate to orders', status: 'passed', message: 'On /orders page' });
      results.summary.passed++;
      console.log('Navigate: PASSED');
    } else if (ordersUrl.includes('/auth')) {
      results.tests.push({ name: 'Navigate to orders', status: 'failed', message: 'Redirected to auth - not logged in' });
      results.summary.failed++;
      console.log('Navigate: FAILED - redirected to auth');
    } else {
      results.tests.push({ name: 'Navigate to orders', status: 'failed', message: `Unexpected URL: ${ordersUrl}` });
      results.summary.failed++;
    }

    // Take screenshot of orders page before clicking tab
    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/discounts-tab-before-${timestamp}.png`,
      fullPage: false
    });

    // ========== STEP 3: Click on "Мои скидки" tab ==========
    console.log('\n=== Step 3: Click "Мои скидки" tab ===');

    // Try different selectors for the tab
    const tabSelectors = [
      'button:has-text("Мои скидки")',
      'a:has-text("Мои скидки")',
      '[role="tab"]:has-text("Мои скидки")',
      'text=Мои скидки',
      '[data-value="discounts"]',
      'button:has-text("скидки")'
    ];

    let tabFound = false;
    let discountsTab = null;

    for (const selector of tabSelectors) {
      const tab = page.locator(selector).first();
      if (await tab.count() > 0) {
        console.log(`Found tab with selector: ${selector}`);
        discountsTab = tab;
        tabFound = true;
        break;
      }
    }

    if (tabFound && discountsTab) {
      await discountsTab.click();
      await page.waitForTimeout(2000);

      results.tests.push({ name: 'Click discounts tab', status: 'passed', message: 'Tab clicked successfully' });
      results.summary.passed++;
      console.log('Click tab: PASSED');
    } else {
      // Log what tabs we can see
      const allButtons = await page.locator('button, [role="tab"]').allTextContents();
      console.log('Available buttons/tabs:', allButtons.slice(0, 10));

      results.tests.push({ name: 'Click discounts tab', status: 'failed', message: 'Tab not found' });
      results.summary.failed++;
      console.log('Click tab: FAILED - tab not found');
    }

    // ========== STEP 4: Verify discount cards ==========
    console.log('\n=== Step 4: Verify discount cards ===');

    // Look for discount card elements
    const cardSelectors = [
      '[data-testid="discount-card"]',
      '.discount-card',
      '[class*="discount"]',
      '[class*="Discount"]',
      'div:has-text("%"):has-text("скидк")',
      '[class*="card"]:has-text("%")',
      'text=/\\d+%/'
    ];

    let cardsFound = false;
    let cardCount = 0;

    for (const selector of cardSelectors) {
      try {
        const cards = page.locator(selector);
        const count = await cards.count();
        if (count > 0) {
          console.log(`Found ${count} elements with selector: ${selector}`);
          cardsFound = true;
          cardCount = count;
          break;
        }
      } catch (e) {
        // Some selectors might throw, continue
      }
    }

    // Also check for empty state message
    const emptyState = page.locator('text=нет скидок, text=пусто, text=Нет активных').first();
    const hasEmptyState = await emptyState.count() > 0;

    if (cardsFound && cardCount > 0) {
      results.tests.push({
        name: 'Discount cards visible',
        status: 'passed',
        message: `Found ${cardCount} discount card(s)`
      });
      results.summary.passed++;
      console.log(`Discount cards: PASSED - found ${cardCount} cards`);
    } else if (hasEmptyState) {
      results.tests.push({
        name: 'Discount cards visible',
        status: 'passed',
        message: 'Empty state displayed (no discounts available)'
      });
      results.summary.passed++;
      console.log('Discount cards: PASSED - empty state shown');
    } else {
      results.tests.push({
        name: 'Discount cards visible',
        status: 'failed',
        message: 'No discount cards or empty state found'
      });
      results.summary.failed++;
      console.log('Discount cards: FAILED');
    }

    // ========== STEP 5: Take final screenshot ==========
    console.log('\n=== Step 5: Take screenshot ===');

    const screenshotPath = `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/discounts-tab-${timestamp}.png`;
    await page.screenshot({
      path: screenshotPath,
      fullPage: false
    });

    results.tests.push({
      name: 'Screenshot captured',
      status: 'passed',
      message: `Saved to ${screenshotPath}`
    });
    results.summary.passed++;
    results.screenshot = screenshotPath;
    console.log(`Screenshot: PASSED - ${screenshotPath}`);

  } catch (error) {
    results.tests.push({
      name: 'Test execution',
      status: 'failed',
      message: error.message,
      stack: error.stack
    });
    results.summary.failed++;
    console.error('Test execution error:', error.message);

    // Take error screenshot
    try {
      await page.screenshot({
        path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/discounts-tab-error-${timestamp}.png`,
        fullPage: false
      });
    } catch (e) {
      // Ignore screenshot error
    }
  } finally {
    await browser.close();
  }

  // ========== Output Results ==========
  console.log('\n=== RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  // Return exit code based on test results
  if (results.summary.failed > 0) {
    process.exit(1);
  }
}

runDiscountsTabTest();
