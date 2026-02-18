// Smoke Test - проверка доступности localhost
const { test, expect } = require('@playwright/test');

// Используем baseURL из playwright.config.ts (http://localhost:5173)

test.describe('Localhost Smoke Tests', () => {

  test('Homepage loads', async ({ page }) => {
    const response = await page.goto('/', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    expect(response.status()).toBe(200);

    // React app loaded
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    console.log('✅ Homepage loaded successfully');
  });

  test('Catalog page loads', async ({ page }) => {
    const response = await page.goto('/catalog', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    expect(response.status()).toBe(200);

    // Check for product grid or loading state
    const content = await page.locator('#root').innerHTML();
    expect(content.length).toBeGreaterThan(100);

    console.log('✅ Catalog page loaded successfully');
  });

  test('Product page loads', async ({ page }) => {
    // First go to catalog to find a product
    await page.goto('/catalog', { waitUntil: 'networkidle', timeout: 20000 });

    // Find first product link
    const productLink = page.locator('a[href*="/product"]').first();

    if (await productLink.isVisible()) {
      await productLink.click();
      await page.waitForURL(/\/product\//, { timeout: 10000 });

      expect(page.url()).toContain('/product/');
      console.log('✅ Product page navigation works');
    } else {
      console.log('⚠️ No products found in catalog (empty database?)');
      test.skip();
    }
  });

  test('Auth page loads', async ({ page }) => {
    const response = await page.goto('/auth', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    expect(response.status()).toBe(200);

    // Should have login form
    const form = page.locator('form, input[type="email"], input[type="password"]');
    await expect(form.first()).toBeVisible({ timeout: 5000 });

    console.log('✅ Auth page loaded successfully');
  });

  test('Favorites page loads', async ({ page }) => {
    const response = await page.goto('/favorites', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    expect(response.status()).toBe(200);

    const content = await page.locator('#root').innerHTML();
    expect(content.length).toBeGreaterThan(50);

    console.log('✅ Favorites page loaded successfully');
  });

  test('No critical JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Visit main pages
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await page.goto('/catalog', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Script error') &&
      !e.includes('Loading chunk')
    );

    expect(criticalErrors).toHaveLength(0);
    console.log(`✅ No critical JS errors (${errors.length} non-critical warnings)`);
  });

});
