/**
 * Production verification v2 - with relaxed timeouts
 */

import { chromium } from 'playwright';

const PROD_URL = 'http://83.166.246.253';

async function prodVerification() {
  const browser = await chromium.launch({ headless: true });
  const timestamp = Date.now();
  const results = [];

  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const desktopPage = await desktopContext.newPage();

  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
  });
  const mobilePage = await mobileContext.newPage();

  try {
    // 1. Home page hero (БАГ-7)
    console.log('1. [PROD] Home page hero...');
    await desktopPage.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await desktopPage.waitForTimeout(5000);
    await desktopPage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-1-home-${timestamp}.png`
    });
    results.push({ bug: 'БАГ-7', page: 'Home', status: 'captured' });

    // 2. Auth page (БАГ-1, БАГ-3)
    console.log('2. [PROD] Auth page...');
    await desktopPage.goto(`${PROD_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await desktopPage.waitForTimeout(3000);
    await desktopPage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-2-auth-${timestamp}.png`
    });
    results.push({ bug: 'БАГ-1,3', page: 'Auth', status: 'captured' });

    // 3. Catalog (БАГ-5, БАГ-6)
    console.log('3. [PROD] Catalog colors...');
    await desktopPage.goto(`${PROD_URL}/catalog?gender=women`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await desktopPage.waitForTimeout(5000);

    // Try color filter
    try {
      const colorFilter = desktopPage.locator('button:has-text("Цвет"), text=Цвет').first();
      if (await colorFilter.isVisible()) {
        await colorFilter.click();
        await desktopPage.waitForTimeout(1500);
      }
    } catch (e) { console.log('Color filter not clickable'); }

    await desktopPage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-3-catalog-${timestamp}.png`
    });
    results.push({ bug: 'БАГ-5,6', page: 'Catalog', status: 'captured' });

    // 4. Checkout (БАГ-2)
    console.log('4. [PROD] Checkout...');
    await desktopPage.goto(`${PROD_URL}/checkout`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await desktopPage.waitForTimeout(3000);
    await desktopPage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-4-checkout-${timestamp}.png`
    });
    results.push({ bug: 'БАГ-2', page: 'Checkout', status: 'captured' });

    // 5. Mobile home (БАГ-4)
    console.log('5. [PROD] Mobile home...');
    await mobilePage.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobilePage.waitForTimeout(5000);
    await mobilePage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-5-mobile-${timestamp}.png`
    });
    results.push({ bug: 'БАГ-4', page: 'Mobile', status: 'captured' });

    // 6. Mobile catalog
    console.log('6. [PROD] Mobile catalog...');
    await mobilePage.goto(`${PROD_URL}/catalog?gender=women`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await mobilePage.waitForTimeout(5000);
    await mobilePage.screenshot({
      path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/prod-6-mobile-catalog-${timestamp}.png`
    });
    results.push({ bug: 'БАГ-5,6', page: 'Mobile Catalog', status: 'captured' });

    console.log('\n=== PROD VERIFICATION COMPLETE ===');
    console.log(JSON.stringify({ status: 'success', timestamp: new Date().toISOString(), results }, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

prodVerification();
