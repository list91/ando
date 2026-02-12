const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://83.166.246.253';
const ADMIN_EMAIL = 'admin@ando.local';
const ADMIN_PASSWORD = 'Admin123';

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  base_url: BASE_URL,
  tests: [],
  errors: [],
  console_logs: [],
  network_errors: [],
  fixes_applied: []
};

function addTestResult(name, status, details = {}) {
  testResults.tests.push({
    name,
    status,
    ...details,
    timestamp: new Date().toISOString()
  });
  console.log(`[${status.toUpperCase()}] ${name}`);
  if (details.error) {
    console.log(`  Error: ${details.error}`);
  }
}

(async () => {
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots', 'e2e-admin-login');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('=== E2E ADMIN LOGIN TEST ===');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Screenshots: ${screenshotsDir}`);
  console.log('');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    const logEntry = { type: msg.type(), text: msg.text() };
    testResults.console_logs.push(logEntry);
    if (msg.type() === 'error') {
      console.log(`  [Console Error] ${msg.text()}`);
    }
  });

  // Capture network errors
  page.on('requestfailed', request => {
    const error = {
      url: request.url(),
      failure: request.failure()?.errorText || 'Unknown error',
      method: request.method()
    };
    testResults.network_errors.push(error);
    console.log(`  [Network Error] ${request.method()} ${request.url()} - ${error.failure}`);
  });

  try {
    // ==========================================
    // TEST 1: Homepage Test
    // ==========================================
    console.log('\n--- TEST 1: Homepage ---');
    try {
      await page.goto(BASE_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      await page.waitForTimeout(2000);

      // Check if page loaded
      const pageTitle = await page.title();
      const pageContent = await page.content();

      // Look for main content indicators
      const hasMainContent = pageContent.includes('ando') ||
                            pageContent.includes('ANDO') ||
                            pageContent.includes('catalog') ||
                            pageContent.includes('product');

      await page.screenshot({
        path: path.join(screenshotsDir, '01-homepage.png'),
        fullPage: false
      });

      // Check for products
      const productSelectors = [
        '[data-product]',
        '.product-card',
        '.product',
        'a[href*="/product"]',
        'img[alt*="product"]',
        '.catalog-item',
        '[class*="product"]',
        '[class*="Product"]'
      ];

      let productsFound = 0;
      for (const selector of productSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          productsFound = count;
          console.log(`  Found ${count} elements with selector: ${selector}`);
          break;
        }
      }

      addTestResult('Homepage Load', 'success', {
        title: pageTitle,
        hasMainContent,
        productsFound,
        url: page.url()
      });

    } catch (error) {
      await page.screenshot({
        path: path.join(screenshotsDir, '01-homepage-error.png'),
        fullPage: false
      });
      addTestResult('Homepage Load', 'failed', { error: error.message });
    }

    // ==========================================
    // TEST 2: Product Page Test
    // ==========================================
    console.log('\n--- TEST 2: Product Page ---');
    try {
      // First navigate back to homepage
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Try to find and click on a product
      const productLinkSelectors = [
        'a[href*="/product/"]',
        'a[href*="/products/"]',
        '.product-card a',
        '[data-product] a',
        'a[href*="catalog"]',
        '.catalog a:first-child'
      ];

      let productClicked = false;
      for (const selector of productLinkSelectors) {
        const link = page.locator(selector).first();
        if (await link.count() > 0) {
          const href = await link.getAttribute('href');
          console.log(`  Found product link: ${href}`);
          await link.click();
          await page.waitForTimeout(2000);
          productClicked = true;
          break;
        }
      }

      if (!productClicked) {
        // Try navigating directly to a product URL
        console.log('  No product links found, trying direct navigation...');
        await page.goto(`${BASE_URL}/product/1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
      }

      await page.screenshot({
        path: path.join(screenshotsDir, '02-product-page.png'),
        fullPage: false
      });

      const productUrl = page.url();
      const hasProductDetails = await page.locator('[class*="product"], [class*="detail"], img').count() > 0;

      addTestResult('Product Page', hasProductDetails ? 'success' : 'partial', {
        url: productUrl,
        hasProductDetails,
        productClicked
      });

    } catch (error) {
      await page.screenshot({
        path: path.join(screenshotsDir, '02-product-error.png'),
        fullPage: false
      });
      addTestResult('Product Page', 'failed', { error: error.message });
    }

    // ==========================================
    // TEST 3: Admin Login Test (CRITICAL)
    // ==========================================
    console.log('\n--- TEST 3: Admin Login (CRITICAL) ---');

    // Try different admin/login URLs
    const adminUrls = [
      `${BASE_URL}/admin`,
      `${BASE_URL}/login`,
      `${BASE_URL}/auth`,
      `${BASE_URL}/admin/login`,
      `${BASE_URL}/signin`
    ];

    let loginPageFound = false;
    let loginUrl = '';

    for (const url of adminUrls) {
      try {
        console.log(`  Trying: ${url}`);
        const response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        await page.waitForTimeout(1000);

        // Check if this is a login page
        const hasEmailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').count() > 0;
        const hasPasswordInput = await page.locator('input[type="password"]').count() > 0;
        const hasLoginForm = await page.locator('form, [class*="login"], [class*="auth"]').count() > 0;

        if (hasEmailInput && hasPasswordInput) {
          loginPageFound = true;
          loginUrl = url;
          console.log(`  ✓ Found login page at: ${url}`);
          break;
        } else if (hasLoginForm) {
          loginPageFound = true;
          loginUrl = url;
          console.log(`  ✓ Found login form at: ${url}`);
          break;
        }
      } catch (e) {
        console.log(`    Failed: ${e.message.substring(0, 50)}`);
      }
    }

    await page.screenshot({
      path: path.join(screenshotsDir, '03-login-page.png'),
      fullPage: false
    });

    if (!loginPageFound) {
      addTestResult('Admin Login - Find Page', 'failed', {
        error: 'Could not find login page',
        triedUrls: adminUrls
      });
    } else {
      addTestResult('Admin Login - Find Page', 'success', { url: loginUrl });

      // Attempt login
      try {
        console.log(`  Attempting login with: ${ADMIN_EMAIL}`);

        // Find and fill email field
        const emailSelectors = [
          'input[type="email"]',
          'input[name="email"]',
          'input[placeholder*="email" i]',
          'input[id*="email" i]'
        ];

        let emailFilled = false;
        for (const selector of emailSelectors) {
          const emailInput = page.locator(selector).first();
          if (await emailInput.count() > 0) {
            await emailInput.fill(ADMIN_EMAIL);
            emailFilled = true;
            console.log(`  ✓ Filled email using: ${selector}`);
            break;
          }
        }

        // Find and fill password field
        const passwordInput = page.locator('input[type="password"]').first();
        if (await passwordInput.count() > 0) {
          await passwordInput.fill(ADMIN_PASSWORD);
          console.log(`  ✓ Filled password`);
        }

        await page.screenshot({
          path: path.join(screenshotsDir, '04-login-filled.png'),
          fullPage: false
        });

        // Find and click submit button
        const submitSelectors = [
          'button[type="submit"]',
          'button:has-text("Login")',
          'button:has-text("Sign in")',
          'button:has-text("Войти")',
          'button:has-text("Log in")',
          'input[type="submit"]',
          'form button'
        ];

        let submitClicked = false;
        for (const selector of submitSelectors) {
          const submitBtn = page.locator(selector).first();
          if (await submitBtn.count() > 0 && await submitBtn.isVisible()) {
            await submitBtn.click();
            submitClicked = true;
            console.log(`  ✓ Clicked submit using: ${selector}`);
            break;
          }
        }

        // Wait for navigation/response
        await page.waitForTimeout(3000);

        await page.screenshot({
          path: path.join(screenshotsDir, '05-after-login.png'),
          fullPage: false
        });

        // Check login result
        const currentUrl = page.url();
        const pageContent = await page.content();

        // Check for success indicators
        const isOnDashboard = currentUrl.includes('admin') ||
                             currentUrl.includes('dashboard') ||
                             !currentUrl.includes('login') && !currentUrl.includes('auth');

        const hasAdminContent = pageContent.includes('Dashboard') ||
                               pageContent.includes('Admin') ||
                               pageContent.includes('Products') ||
                               pageContent.includes('Settings') ||
                               pageContent.includes('Выход') ||
                               pageContent.includes('Logout');

        // Check for error messages
        const hasError = await page.locator('.error, [class*="error"], [role="alert"]').count() > 0;
        let errorMessage = '';
        if (hasError) {
          errorMessage = await page.locator('.error, [class*="error"], [role="alert"]').first().textContent() || '';
          console.log(`  ⚠ Error message found: ${errorMessage}`);
        }

        // Check if still on login page
        const stillOnLogin = currentUrl.includes('login') || currentUrl.includes('auth');

        if (hasAdminContent || (isOnDashboard && !stillOnLogin)) {
          addTestResult('Admin Login - Authentication', 'success', {
            finalUrl: currentUrl,
            hasAdminContent
          });
        } else if (stillOnLogin) {
          addTestResult('Admin Login - Authentication', 'failed', {
            error: errorMessage || 'Still on login page after submit',
            finalUrl: currentUrl
          });
        } else {
          addTestResult('Admin Login - Authentication', 'partial', {
            finalUrl: currentUrl,
            hasAdminContent,
            note: 'Unknown state - check screenshots'
          });
        }

      } catch (error) {
        await page.screenshot({
          path: path.join(screenshotsDir, '05-login-error.png'),
          fullPage: false
        });
        addTestResult('Admin Login - Authentication', 'failed', { error: error.message });
      }
    }

    // ==========================================
    // TEST 4: Admin Dashboard (if logged in)
    // ==========================================
    console.log('\n--- TEST 4: Admin Dashboard ---');
    try {
      // Navigate to admin dashboard
      await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(screenshotsDir, '06-admin-dashboard.png'),
        fullPage: false
      });

      const dashboardUrl = page.url();
      const dashboardContent = await page.content();

      // Check for admin dashboard indicators
      const dashboardIndicators = [
        'dashboard',
        'products',
        'orders',
        'users',
        'settings',
        'admin',
        'Товары',
        'Заказы',
        'Пользователи'
      ];

      let foundIndicators = [];
      for (const indicator of dashboardIndicators) {
        if (dashboardContent.toLowerCase().includes(indicator.toLowerCase())) {
          foundIndicators.push(indicator);
        }
      }

      const isDashboardLoaded = foundIndicators.length > 0 && !dashboardUrl.includes('login');

      addTestResult('Admin Dashboard', isDashboardLoaded ? 'success' : 'failed', {
        url: dashboardUrl,
        foundIndicators,
        redirectedToLogin: dashboardUrl.includes('login')
      });

    } catch (error) {
      await page.screenshot({
        path: path.join(screenshotsDir, '06-dashboard-error.png'),
        fullPage: false
      });
      addTestResult('Admin Dashboard', 'failed', { error: error.message });
    }

  } catch (error) {
    testResults.errors.push({
      type: 'critical',
      message: error.message,
      stack: error.stack
    });
    console.error('\n✗ CRITICAL ERROR:', error.message);
  }

  await browser.close();

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n=== TEST RESULTS SUMMARY ===');
  console.log(JSON.stringify(testResults, null, 2));

  // Write results to file
  const resultsPath = path.join(screenshotsDir, 'test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`\nResults saved to: ${resultsPath}`);

  // Exit with appropriate code
  const failedTests = testResults.tests.filter(t => t.status === 'failed');
  if (failedTests.length > 0) {
    console.log(`\n✗ ${failedTests.length} test(s) failed`);
    process.exit(1);
  } else {
    console.log('\n✓ All tests passed');
    process.exit(0);
  }
})();
