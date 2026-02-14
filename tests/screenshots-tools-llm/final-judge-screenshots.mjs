// Final Judge Screenshots - Phase 3 Verification
// Takes screenshots of ALL changed areas for judge review

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/final-judge';

const screenshots = [];
const errors = [];

async function main() {
  console.log('Starting Final Judge Screenshots...\n');

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    // ============================================
    // 1. Mobile Header (t1) - viewport 375x667
    // ============================================
    console.log('1. Taking mobile header screenshot (t1)...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewportSize({ width: 375, height: 667 });

    try {
      await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await mobilePage.waitForTimeout(1000);

      // Full mobile homepage
      await mobilePage.screenshot({
        path: join(OUTPUT_DIR, '01-t1-mobile-header-homepage.png'),
        fullPage: false // viewport only to show header
      });
      screenshots.push({ id: 't1', name: 'mobile-header-homepage', path: '01-t1-mobile-header-homepage.png' });

      // Header element only
      const mobileHeader = mobilePage.locator('header, nav, div.md\\:hidden').first();
      if (await mobileHeader.count() > 0) {
        await mobileHeader.screenshot({
          path: join(OUTPUT_DIR, '01-t1-mobile-header-element.png')
        });
        screenshots.push({ id: 't1', name: 'mobile-header-element', path: '01-t1-mobile-header-element.png' });
      }
      console.log('   [OK] Mobile header captured');
    } catch (e) {
      errors.push({ task: 't1', error: e.message });
      console.log('   [FAIL]', e.message);
    }
    await mobilePage.close();

    // ============================================
    // 2. Guest Checkout Form (t2-t11)
    // ============================================
    console.log('\n2. Taking guest checkout form screenshots (t2-t11)...');
    const checkoutPage = await browser.newPage();
    await checkoutPage.setViewportSize({ width: 1920, height: 1080 });

    try {
      // Go to catalog first
      await checkoutPage.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle', timeout: 30000 });
      await checkoutPage.evaluate(() => localStorage.clear());
      await checkoutPage.reload({ waitUntil: 'networkidle' });
      await checkoutPage.waitForTimeout(1000);

      // Click on first product
      const productLink = checkoutPage.locator('a[href*="/catalog/"]').first();
      if (await productLink.count() > 0) {
        await productLink.click();
        await checkoutPage.waitForTimeout(1500);

        // Select size
        const sizeBtn = checkoutPage.locator('button:has-text("S"), button:has-text("M"), button:has-text("L")').first();
        if (await sizeBtn.count() > 0) {
          await sizeBtn.click();
          await checkoutPage.waitForTimeout(500);
        }

        // Add to cart
        const addToCartBtn = checkoutPage.locator('button:has-text("ДОБАВИТЬ В КОРЗИНУ"), button:has-text("В корзину")').first();
        if (await addToCartBtn.count() > 0) {
          await addToCartBtn.click();
          await checkoutPage.waitForTimeout(1500);

          // Screenshot: Add to cart modal with promo (t11)
          await checkoutPage.screenshot({
            path: join(OUTPUT_DIR, '02-t11-add-to-cart-modal.png'),
            fullPage: false
          });
          screenshots.push({ id: 't11', name: 'add-to-cart-modal', path: '02-t11-add-to-cart-modal.png' });

          // Click go to cart
          const goToCartBtn = checkoutPage.locator('button:has-text("Перейти в корзину")').first();
          if (await goToCartBtn.count() > 0) {
            await goToCartBtn.click();
            await checkoutPage.waitForTimeout(2000);
          } else {
            await checkoutPage.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
            await checkoutPage.waitForTimeout(2000);
          }
        }
      }

      // Handle login redirect - look for guest checkout
      const currentUrl = checkoutPage.url();
      if (currentUrl.includes('/login')) {
        console.log('   On login page, looking for guest checkout...');
        const guestBtn = checkoutPage.locator('button:has-text("Продолжить как гость"), a:has-text("Продолжить как гость")').first();
        if (await guestBtn.count() > 0) {
          await guestBtn.click();
          await checkoutPage.waitForTimeout(2000);
        }
      }

      // Scroll page to load all elements
      await checkoutPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await checkoutPage.waitForTimeout(500);
      await checkoutPage.evaluate(() => window.scrollTo(0, 0));
      await checkoutPage.waitForTimeout(500);

      // Take full page checkout screenshot
      await checkoutPage.screenshot({
        path: join(OUTPUT_DIR, '02-t2-t11-checkout-fullpage.png'),
        fullPage: true
      });
      screenshots.push({ id: 't2-t11', name: 'checkout-fullpage', path: '02-t2-t11-checkout-fullpage.png' });

      // Check form elements
      const formElements = await checkoutPage.evaluate(() => {
        return {
          authPrompt: !!document.querySelector('[class*="auth"], [class*="login"], [class*="guest"]'),
          firstNameField: !!document.querySelector('input[name*="firstName"], input[placeholder*="Имя"]'),
          lastNameField: !!document.querySelector('input[name*="lastName"], input[placeholder*="Фамилия"]'),
          dobField: !!document.querySelector('input[type="date"], input[name*="birth"]'),
          countryDropdown: !!document.querySelector('select[name*="country"]'),
          checkboxes: document.querySelectorAll('input[type="checkbox"]').length
        };
      });
      console.log('   Form elements:', JSON.stringify(formElements));
      console.log('   [OK] Checkout form captured');

    } catch (e) {
      errors.push({ task: 't2-t11', error: e.message });
      console.log('   [FAIL]', e.message);
      // Take error screenshot
      await checkoutPage.screenshot({
        path: join(OUTPUT_DIR, '02-checkout-error.png'),
        fullPage: true
      });
    }
    await checkoutPage.close();

    // ============================================
    // 3. Catalog Page with Badges (t12-t13)
    // ============================================
    console.log('\n3. Taking catalog badges screenshots (t12-t13)...');
    const catalogPage = await browser.newPage();
    await catalogPage.setViewportSize({ width: 1920, height: 1080 });

    try {
      await catalogPage.goto(`${BASE_URL}/catalog?gender=women`, { waitUntil: 'networkidle', timeout: 30000 });
      await catalogPage.waitForTimeout(2000);

      // Desktop catalog
      await catalogPage.screenshot({
        path: join(OUTPUT_DIR, '03-t12-t13-catalog-desktop.png'),
        fullPage: false
      });
      screenshots.push({ id: 't12-t13', name: 'catalog-desktop', path: '03-t12-t13-catalog-desktop.png' });

      // Check for badges
      const badges = await catalogPage.evaluate(() => {
        const percentBadges = document.querySelectorAll('span:not(:empty)');
        const badgeTexts = Array.from(percentBadges)
          .map(el => el.textContent?.trim())
          .filter(t => t === '%' || t === 'НОВОЕ' || t === 'SALE' || t === 'NEW');
        return badgeTexts.reduce((acc, t) => {
          acc[t] = (acc[t] || 0) + 1;
          return acc;
        }, {});
      });
      console.log('   Badges found:', JSON.stringify(badges));

      // Full page for badge verification
      await catalogPage.screenshot({
        path: join(OUTPUT_DIR, '03-t12-t13-catalog-fullpage.png'),
        fullPage: true
      });
      screenshots.push({ id: 't12-t13', name: 'catalog-fullpage', path: '03-t12-t13-catalog-fullpage.png' });
      console.log('   [OK] Catalog badges captured');

    } catch (e) {
      errors.push({ task: 't12-t13', error: e.message });
      console.log('   [FAIL]', e.message);
    }
    await catalogPage.close();

    // ============================================
    // 4. Desktop Sidebar (t14-t15)
    // ============================================
    console.log('\n4. Taking desktop sidebar screenshots (t14-t15)...');
    const sidebarPage = await browser.newPage();
    await sidebarPage.setViewportSize({ width: 1920, height: 1080 });

    try {
      await sidebarPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await sidebarPage.waitForTimeout(1000);

      // Full homepage showing sidebar
      await sidebarPage.screenshot({
        path: join(OUTPUT_DIR, '04-t14-t15-desktop-sidebar.png'),
        fullPage: false
      });
      screenshots.push({ id: 't14-t15', name: 'desktop-sidebar', path: '04-t14-t15-desktop-sidebar.png' });

      // Check for menu items
      const menuItems = await sidebarPage.evaluate(() => {
        const items = [];
        const links = document.querySelectorAll('a, button');
        links.forEach(el => {
          const text = el.textContent?.trim();
          if (text && (text.includes('РАСПРОДАЖА') || text.includes('НОВОЕ') || text.includes('SALE') || text.includes('NEW'))) {
            items.push(text);
          }
        });
        return items;
      });
      console.log('   Menu items found:', menuItems.join(', '));

      // Try to capture sidebar element
      const sidebar = sidebarPage.locator('aside, [class*="sidebar"], nav.hidden.md\\:block').first();
      if (await sidebar.count() > 0) {
        await sidebar.screenshot({
          path: join(OUTPUT_DIR, '04-t14-t15-sidebar-element.png')
        });
        screenshots.push({ id: 't14-t15', name: 'sidebar-element', path: '04-t14-t15-sidebar-element.png' });
      }
      console.log('   [OK] Desktop sidebar captured');

    } catch (e) {
      errors.push({ task: 't14-t15', error: e.message });
      console.log('   [FAIL]', e.message);
    }
    await sidebarPage.close();

    // ============================================
    // 5. Mobile Navigation (t16-t17)
    // ============================================
    console.log('\n5. Taking mobile navigation screenshots (t16-t17)...');
    const mobileNavPage = await browser.newPage();
    await mobileNavPage.setViewportSize({ width: 375, height: 667 });

    try {
      await mobileNavPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await mobileNavPage.waitForTimeout(1000);

      // Initial mobile view
      await mobileNavPage.screenshot({
        path: join(OUTPUT_DIR, '05-t16-t17-mobile-initial.png'),
        fullPage: false
      });
      screenshots.push({ id: 't16-t17', name: 'mobile-initial', path: '05-t16-t17-mobile-initial.png' });

      // Try to open mobile menu (burger icon)
      const burgerSelectors = [
        'button[aria-label*="menu"]',
        'button[aria-label*="Menu"]',
        'button svg[class*="menu"]',
        'button:has(svg)',
        '[class*="hamburger"]',
        '[class*="burger"]',
        'button.md\\:hidden'
      ];

      let menuOpened = false;
      for (const selector of burgerSelectors) {
        try {
          const burger = mobileNavPage.locator(selector).first();
          if (await burger.count() > 0 && await burger.isVisible()) {
            await burger.click();
            await mobileNavPage.waitForTimeout(500);
            menuOpened = true;
            console.log(`   Clicked menu: ${selector}`);
            break;
          }
        } catch (e) { /* continue */ }
      }

      if (menuOpened) {
        await mobileNavPage.waitForTimeout(500);
        await mobileNavPage.screenshot({
          path: join(OUTPUT_DIR, '05-t16-t17-mobile-menu-open.png'),
          fullPage: false
        });
        screenshots.push({ id: 't16-t17', name: 'mobile-menu-open', path: '05-t16-t17-mobile-menu-open.png' });
      }

      // Check for localized menu items
      const mobileMenuItems = await mobileNavPage.evaluate(() => {
        const items = [];
        const links = document.querySelectorAll('a, button');
        links.forEach(el => {
          const text = el.textContent?.trim();
          if (text && (text.includes('РАСПРОДАЖА') || text.includes('НОВОЕ') ||
                       text.includes('SALE') || text.includes('NEW') ||
                       text === 'ЖЕНСКОЕ' || text === 'МУЖСКОЕ')) {
            items.push(text);
          }
        });
        return items;
      });
      console.log('   Mobile menu items:', mobileMenuItems.join(', '));
      console.log('   [OK] Mobile navigation captured');

    } catch (e) {
      errors.push({ task: 't16-t17', error: e.message });
      console.log('   [FAIL]', e.message);
    }
    await mobileNavPage.close();

    // ============================================
    // 6. Additional: Production comparison
    // ============================================
    console.log('\n6. Taking production comparison screenshots...');
    const prodPage = await browser.newPage();
    await prodPage.setViewportSize({ width: 1920, height: 1080 });

    try {
      await prodPage.goto('https://andojv.com/catalog?gender=women', { waitUntil: 'networkidle', timeout: 60000 });
      await prodPage.waitForTimeout(2000);

      await prodPage.screenshot({
        path: join(OUTPUT_DIR, '06-production-catalog.png'),
        fullPage: false
      });
      screenshots.push({ id: 'prod', name: 'production-catalog', path: '06-production-catalog.png' });
      console.log('   [OK] Production comparison captured');

    } catch (e) {
      errors.push({ task: 'production', error: e.message });
      console.log('   [FAIL]', e.message);
    }
    await prodPage.close();

  } finally {
    await browser.close();
  }

  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('FINAL JUDGE SCREENSHOTS REPORT');
  console.log('='.repeat(60));

  const result = {
    Agent_Response: {
      task_id: 'final-screenshots',
      status: errors.length === 0 ? 'success' : 'partial',
      result: {
        total_screenshots: screenshots.length,
        output_directory: OUTPUT_DIR,
        screenshots: screenshots,
        errors: errors
      },
      metadata: {
        timestamp: new Date().toISOString(),
        base_url: BASE_URL
      }
    }
  };

  console.log(`\nTotal screenshots: ${screenshots.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log('\nScreenshots:');
  screenshots.forEach(s => console.log(`  - [${s.id}] ${s.path}`));

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - [${e.task}] ${e.error}`));
  }

  console.log('\n' + JSON.stringify(result, null, 2));
}

main().catch(console.error);
