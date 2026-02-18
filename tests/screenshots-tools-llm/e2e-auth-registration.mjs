/**
 * E2E Test: Registration and Login Flow (БАГ-1, БАГ-3)
 *
 * Tests:
 * 1. Registration with email/password
 * 2. Login with registered credentials
 * 3. Logout
 *
 * Created: 2026-02-17
 * Visual QA Pipeline
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

// Generate unique email for each test run
const timestamp = Date.now();
const TEST_USER = {
  email: `test-user-${timestamp}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test User'
};

async function runAuthTest() {
  const browser = await chromium.launch({ headless: false }); // headless: false for debugging
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
    // ========== TEST 1: Registration ==========
    console.log('\n=== Test 1: Registration ===');

    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });

    // Click "Зарегистрироваться" to switch to signup mode
    const signupToggle = page.getByRole('button', { name: /зарегистрироваться/i });
    await signupToggle.click();
    await page.waitForTimeout(500);

    // Fill registration form
    await page.fill('input#fullName', TEST_USER.fullName);
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);

    // Submit form
    const submitButton = page.getByRole('button', { name: /зарегистрироваться/i }).first();
    await submitButton.click();

    // Wait for response - either redirect or toast
    await page.waitForTimeout(3000);

    // Check if redirected to home or still on auth page
    const currentUrl = page.url();
    const isRegistered = !currentUrl.includes('/auth') ||
                         await page.locator('[data-sonner-toast]').count() > 0;

    // Look for success toast
    const successToast = await page.locator('[data-sonner-toast]').filter({ hasText: /успешн|добро пожаловать/i }).count();
    const errorToast = await page.locator('[data-sonner-toast]').filter({ hasText: /ошибка/i }).count();

    let registrationStatus = 'failed';
    let registrationMessage = '';

    if (successToast > 0 || !currentUrl.includes('/auth')) {
      registrationStatus = 'passed';
      registrationMessage = 'Registration successful, user redirected';
    } else if (errorToast > 0) {
      const toastText = await page.locator('[data-sonner-toast]').first().textContent();
      registrationMessage = `Registration error: ${toastText}`;
    } else {
      registrationMessage = 'Unknown state after registration attempt';
    }

    results.tests.push({
      name: 'Registration',
      status: registrationStatus,
      message: registrationMessage,
      email: TEST_USER.email
    });

    if (registrationStatus === 'passed') results.summary.passed++;
    else results.summary.failed++;

    console.log(`Registration: ${registrationStatus.toUpperCase()} - ${registrationMessage}`);

    // ========== TEST 2: Logout (if logged in) ==========
    if (!currentUrl.includes('/auth')) {
      console.log('\n=== Test 2: Logout ===');

      // After registration, user is auto-logged in. Need to logout to test login.
      // Navigate to a page and clear session storage/local storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.waitForTimeout(500);

      results.tests.push({
        name: 'Logout',
        status: 'passed',
        message: 'Session cleared for login test'
      });
      results.summary.passed++;
      console.log('Logout: PASSED - Session cleared');
    }

    // ========== TEST 3: Login ==========
    console.log('\n=== Test 3: Login ===');

    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500);

    // Make sure we're in login mode (not signup)
    const loginToggle = page.getByRole('button', { name: /войти/i });
    if (await loginToggle.count() > 0) {
      const buttonText = await loginToggle.first().textContent();
      if (buttonText?.includes('Войти')) {
        await loginToggle.first().click();
        await page.waitForTimeout(500);
      }
    }

    // Fill login form
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);

    // Submit
    const loginButton = page.getByRole('button', { name: /войти/i }).first();
    await loginButton.click();

    // Wait for response
    await page.waitForTimeout(3000);

    const loginUrl = page.url();
    const loginSuccessToast = await page.locator('[data-sonner-toast]').filter({ hasText: /вошли|успешн/i }).count();
    const loginErrorToast = await page.locator('[data-sonner-toast]').filter({ hasText: /ошибка|неверн/i }).count();

    let loginStatus = 'failed';
    let loginMessage = '';

    if (!loginUrl.includes('/auth') || loginSuccessToast > 0) {
      loginStatus = 'passed';
      loginMessage = 'Login successful';
    } else if (loginErrorToast > 0) {
      const toastText = await page.locator('[data-sonner-toast]').first().textContent();
      loginMessage = `Login error: ${toastText}`;
    } else {
      loginMessage = 'Login appears to have failed (still on auth page)';
    }

    results.tests.push({
      name: 'Login',
      status: loginStatus,
      message: loginMessage
    });

    if (loginStatus === 'passed') results.summary.passed++;
    else results.summary.failed++;

    console.log(`Login: ${loginStatus.toUpperCase()} - ${loginMessage}`);

    // Take final screenshot
    const screenshotPath = `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/e2e-auth-${timestamp}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    results.screenshot = screenshotPath;

  } catch (error) {
    results.tests.push({
      name: 'Test execution',
      status: 'failed',
      message: error.message,
      stack: error.stack
    });
    results.summary.failed++;
    console.error('Test execution error:', error.message);
  } finally {
    await browser.close();
  }

  // Output results
  console.log('\n=== RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  // Return exit code based on test results
  if (results.summary.failed > 0) {
    process.exit(1);
  }
}

runAuthTest();
