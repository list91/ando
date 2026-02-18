/**
 * Final verification screenshots for all bug fixes
 * Visual QA Pipeline - Phase 2
 */

import { chromium } from 'playwright';

async function finalVerification() {
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
    console.log('1. Checking home page hero...');
    await desktopPage.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
    await desktopPage.waitForTimeout(2000);
    await desktopPage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/final-1-home-${timestamp}.png`,
      fullPage: false
    });
    results.push({ page: 'Home', status: 'captured' });

    // 2. Auth page (БАГ-1, БАГ-3)
    console.log('2. Checking auth page...');
    await desktopPage.goto('http://localhost:5173/auth', { waitUntil: 'networkidle', timeout: 30000 });
    await desktopPage.waitForTimeout(1000);
    await desktopPage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/final-2-auth-${timestamp}.png`,
      fullPage: false
    });
    results.push({ page: 'Auth', status: 'captured' });

    // 3. Catalog with colors (БАГ-5, БАГ-6)
    console.log('3. Checking catalog with colors...');
    await desktopPage.goto('http://localhost:5173/catalog', { waitUntil: 'networkidle', timeout: 30000 });
    await desktopPage.waitForTimeout(2000);
    // Open color filter
    const colorFilter = desktopPage.locator('text=Цвет').first();
    if (await colorFilter.count() > 0) {
      await colorFilter.click();
      await desktopPage.waitForTimeout(1000);
    }
    await desktopPage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/final-3-catalog-colors-${timestamp}.png`,
      fullPage: false
    });
    results.push({ page: 'Catalog Colors', status: 'captured' });

    // 4. Checkout discount button (БАГ-2)
    console.log('4. Checking checkout page...');
    // First add item to cart
    await desktopPage.goto('http://localhost:5173/catalog', { waitUntil: 'networkidle', timeout: 30000 });
    await desktopPage.waitForTimeout(1000);
    const productLink = desktopPage.locator('a[href*="/product/"]').first();
    if (await productLink.count() > 0) {
      await productLink.click();
      await desktopPage.waitForTimeout(1500);
      const sizeBtn = desktopPage.locator('button:has-text("S"), button:has-text("M")').first();
      if (await sizeBtn.count() > 0) await sizeBtn.click();
      await desktopPage.waitForTimeout(500);
      const addBtn = desktopPage.locator('button:has-text("В корзину")').first();
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await desktopPage.waitForTimeout(1000);
      }
    }
    await desktopPage.goto('http://localhost:5173/checkout', { waitUntil: 'networkidle', timeout: 30000 });
    await desktopPage.waitForTimeout(2000);
    await desktopPage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/final-4-checkout-${timestamp}.png`,
      fullPage: false
    });
    results.push({ page: 'Checkout', status: 'captured' });

    // 5. Mobile support icon (БАГ-4)
    console.log('5. Checking mobile support icon...');
    await mobilePage.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
    await mobilePage.waitForTimeout(2000);
    await mobilePage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/final-5-mobile-${timestamp}.png`,
      fullPage: false
    });
    results.push({ page: 'Mobile Home', status: 'captured' });

    console.log('\n=== FINAL VERIFICATION COMPLETE ===');
    console.log(JSON.stringify({
      status: 'success',
      timestamp: new Date().toISOString(),
      screenshots: results.map(r => `final-${results.indexOf(r) + 1}-${r.page.toLowerCase().replace(' ', '-')}-${timestamp}.png`)
    }, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

finalVerification();
