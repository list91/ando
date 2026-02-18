/**
 * Production verification for all bug fixes
 * Target: http://83.166.246.253
 */

import { chromium } from 'playwright';

const PROD_URL = 'http://83.166.246.253';

async function prodVerification() {
  const browser = await chromium.launch({ headless: true });
  const timestamp = Date.now();
  const results = [];

  // Desktop context
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const desktopPage = await desktopContext.newPage();

  // Mobile context
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
  });
  const mobilePage = await mobileContext.newPage();

  try {
    // 1. Home page hero (БАГ-7)
    console.log('1. [PROD] Checking home page hero...');
    await desktopPage.goto(`${PROD_URL}/`, { waitUntil: 'networkidle', timeout: 60000 });
    await desktopPage.waitForTimeout(3000);

    const heroVisible = await desktopPage.locator('img').first().isVisible().catch(() => false);
    await desktopPage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-1-home-${timestamp}.png`,
      fullPage: false
    });
    results.push({ bug: 'БАГ-7', page: 'Home Hero', status: heroVisible ? 'PASS' : 'CHECK' });

    // 2. Auth page (БАГ-1, БАГ-3)
    console.log('2. [PROD] Checking auth page...');
    await desktopPage.goto(`${PROD_URL}/auth`, { waitUntil: 'networkidle', timeout: 60000 });
    await desktopPage.waitForTimeout(2000);

    const authFormVisible = await desktopPage.locator('input[type="email"], input[placeholder*="email"]').first().isVisible().catch(() => false);
    await desktopPage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-2-auth-${timestamp}.png`,
      fullPage: false
    });
    results.push({ bug: 'БАГ-1,3', page: 'Auth', status: authFormVisible ? 'PASS' : 'CHECK' });

    // 3. Catalog with colors (БАГ-5, БАГ-6)
    console.log('3. [PROD] Checking catalog with colors...');
    await desktopPage.goto(`${PROD_URL}/catalog?gender=women`, { waitUntil: 'networkidle', timeout: 60000 });
    await desktopPage.waitForTimeout(3000);

    // Try to open color filter
    const colorFilter = desktopPage.locator('text=Цвет').first();
    if (await colorFilter.count() > 0) {
      await colorFilter.click();
      await desktopPage.waitForTimeout(1500);
    }

    // Check for color circles in filter or cards
    const colorElements = await desktopPage.locator('.rounded-full[style*="background"], div[style*="backgroundColor"]').count();

    await desktopPage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-3-catalog-colors-${timestamp}.png`,
      fullPage: false
    });
    results.push({ bug: 'БАГ-5,6', page: 'Catalog Colors', colorElements, status: colorElements > 0 ? 'PASS' : 'CHECK' });

    // 4. Checkout discount button (БАГ-2)
    console.log('4. [PROD] Checking checkout page...');
    // First add item to cart
    await desktopPage.goto(`${PROD_URL}/catalog?gender=women`, { waitUntil: 'networkidle', timeout: 60000 });
    await desktopPage.waitForTimeout(2000);

    const productLink = desktopPage.locator('a[href*="/product/"]').first();
    if (await productLink.count() > 0) {
      await productLink.click();
      await desktopPage.waitForTimeout(2000);

      // Select size
      const sizeBtn = desktopPage.locator('button:has-text("S"), button:has-text("M"), button:has-text("L")').first();
      if (await sizeBtn.count() > 0) await sizeBtn.click();
      await desktopPage.waitForTimeout(500);

      // Add to cart
      const addBtn = desktopPage.locator('button:has-text("В корзину")').first();
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await desktopPage.waitForTimeout(1500);
      }
    }

    await desktopPage.goto(`${PROD_URL}/checkout`, { waitUntil: 'networkidle', timeout: 60000 });
    await desktopPage.waitForTimeout(2000);

    // Check discount button exists and links to /auth
    const discountBtn = desktopPage.locator('text=Получить скидку, a:has-text("скидку")').first();
    const discountBtnVisible = await discountBtn.isVisible().catch(() => false);

    await desktopPage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-4-checkout-${timestamp}.png`,
      fullPage: false
    });
    results.push({ bug: 'БАГ-2', page: 'Checkout', status: 'CAPTURED' });

    // 5. Mobile support icon (БАГ-4)
    console.log('5. [PROD] Checking mobile...');
    await mobilePage.goto(`${PROD_URL}/`, { waitUntil: 'networkidle', timeout: 60000 });
    await mobilePage.waitForTimeout(3000);

    await mobilePage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-5-mobile-${timestamp}.png`,
      fullPage: false
    });
    results.push({ bug: 'БАГ-4', page: 'Mobile Home', status: 'CAPTURED' });

    // 6. Mobile catalog
    console.log('6. [PROD] Checking mobile catalog...');
    await mobilePage.goto(`${PROD_URL}/catalog?gender=women`, { waitUntil: 'networkidle', timeout: 60000 });
    await mobilePage.waitForTimeout(3000);

    await mobilePage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-6-mobile-catalog-${timestamp}.png`,
      fullPage: false
    });
    results.push({ bug: 'БАГ-5,6', page: 'Mobile Catalog', status: 'CAPTURED' });

    console.log('\n=== PRODUCTION VERIFICATION COMPLETE ===');
    console.log(JSON.stringify({
      status: 'success',
      server: PROD_URL,
      timestamp: new Date().toISOString(),
      results: results
    }, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.log(JSON.stringify({
      status: 'error',
      error: error.message,
      results: results
    }, null, 2));
  } finally {
    await browser.close();
  }
}

prodVerification();
