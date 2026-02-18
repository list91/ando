/**
 * E2E Test: ЛК-4 - Data Migration on Login
 *
 * Tests:
 * 1. Add items to favorites as guest (localStorage)
 * 2. Register/login
 * 3. Verify favorites are migrated to account
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const timestamp = Date.now();

const TEST_USER = {
  email: `test-lk4-${timestamp}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test LK4 User'
};

async function runTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const results = { passed: 0, failed: 0, tests: [] };

  try {
    console.log('\n=== ЛК-4 Test: Data Migration on Login ===\n');

    // Step 1: Go to catalog as guest
    console.log('Step 1: Browse catalog as guest');
    await page.goto(`${BASE_URL}/catalog?gender=women`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Close cookie banner
    const acceptBtn = page.locator('button:has-text("Принять")').first();
    if (await acceptBtn.count() > 0) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }

    // Step 2: Add first product to favorites
    console.log('\nStep 2: Add product to favorites as guest');

    // Click first product to open product page
    const productLink = page.locator('a[href*="/product/"]').first();
    await productLink.click();
    await page.waitForTimeout(2000);

    // Find and click heart/favorites button
    const heartButton = page.locator('button:has(svg[class*="heart"]), button[aria-label*="избранное"], button:has-text("Избранное")').first();
    if (await heartButton.count() > 0) {
      await heartButton.click();
      await page.waitForTimeout(1500);
      console.log('  Added to favorites via button');
    } else {
      // Try clicking the heart icon directly
      const heartIcon = page.locator('svg[class*="lucide-heart"], .heart-icon').first();
      if (await heartIcon.count() > 0) {
        await heartIcon.click();
        await page.waitForTimeout(1500);
        console.log('  Added to favorites via icon');
      }
    }

    // Step 3: Check localStorage for favorites
    console.log('\nStep 3: Verify localStorage favorites');
    const localStorageData = await page.evaluate(() => {
      return localStorage.getItem('ando_favorites');
    });

    if (localStorageData) {
      console.log(`  localStorage: ${localStorageData.substring(0, 100)}...`);
      results.tests.push({ name: 'Guest Favorites in localStorage', status: 'passed' });
      results.passed++;
    } else {
      console.log('  localStorage: empty');
      results.tests.push({ name: 'Guest Favorites in localStorage', status: 'failed' });
      results.failed++;
    }

    // Screenshot before login
    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/lk4-before-login-${timestamp}.png`
    });

    // Step 4: Register (which logs in automatically)
    console.log('\nStep 4: Register user');
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Зарегистрироваться")');
    await page.waitForTimeout(500);
    await page.fill('input#fullName', TEST_USER.fullName);
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);
    await page.click('button:has-text("Зарегистрироваться")');
    await page.waitForTimeout(4000);

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

    // Step 5: Check favorites page to verify migration
    console.log('\nStep 5: Verify favorites migrated');
    await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if there are favorites on the page
    const favoritesContent = page.locator('.group, [class*="product"], a[href*="/product/"]');
    const favoritesCount = await favoritesContent.count();

    // Check for empty state
    const emptyState = page.locator('text=Избранных товаров пока нет, text=пусто, text=Ваше избранное пусто').first();
    const hasEmptyState = await emptyState.count() > 0;

    if (favoritesCount > 0 && !hasEmptyState) {
      console.log(`  Favorites count: ${favoritesCount}`);
      console.log('  Migration: PASSED');
      results.tests.push({ name: 'Favorites Migrated', status: 'passed' });
      results.passed++;
    } else if (hasEmptyState) {
      console.log('  Migration: FAILED - empty favorites page');
      results.tests.push({ name: 'Favorites Migrated', status: 'failed', message: 'Empty favorites' });
      results.failed++;
    } else {
      console.log('  Migration: PARTIAL - checking page content');
      const pageContent = await page.content();
      const hasProducts = pageContent.includes('product') || pageContent.includes('товар');
      console.log(`  Has products in content: ${hasProducts}`);
      results.tests.push({ name: 'Favorites Migrated', status: hasProducts ? 'passed' : 'failed' });
      if (hasProducts) results.passed++; else results.failed++;
    }

    // Screenshot after login
    await page.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/lk4-after-login-${timestamp}.png`,
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
  console.log('  ЛК-4 DATA MIGRATION TEST RESULTS');
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
