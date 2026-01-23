const { chromium } = require('playwright');

const PROD_URL = 'https://andojv.com';
const SCREENSHOT_DIR = 'tests/screenshots/production-verify';

async function verifyProductionFixes() {
  console.log('='.repeat(60));
  console.log('ПРОВЕРКА ПРАВОК НА ПРОДАКШЕНЕ: ' + PROD_URL);
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });

  // Desktop context
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  // Mobile context
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const desktopPage = await desktopContext.newPage();
  const mobilePage = await mobileContext.newPage();

  const results = [];

  try {
    // ========================================
    // FIX 14.1 + 14: Badge colors (Catalog)
    // ========================================
    console.log('\n--- Fix 14.1 + 14: Проверка цветов бейджей ---');

    await desktopPage.goto(`${PROD_URL}/catalog?gender=women`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);

    await desktopPage.screenshot({
      path: `${SCREENSHOT_DIR}/fix14-catalog-badges.png`,
      fullPage: false
    });
    console.log('✓ Скриншот: fix14-catalog-badges.png');

    // Check for NEW badge
    const newBadge = desktopPage.locator('span:has-text("NEW")').first();
    if (await newBadge.isVisible()) {
      const bgColor = await newBadge.evaluate(el => getComputedStyle(el).backgroundColor);
      console.log(`  NEW badge background: ${bgColor}`);
      results.push({ fix: '14.1 NEW badge', status: bgColor.includes('0, 0, 0') || bgColor.includes('24, 24, 27') ? 'PASS' : 'CHECK', value: bgColor });
    }

    // Check for SALE badge
    const saleBadge = desktopPage.locator('span:has-text("SALE")').first();
    if (await saleBadge.isVisible()) {
      const bgColor = await saleBadge.evaluate(el => getComputedStyle(el).backgroundColor);
      console.log(`  SALE badge background: ${bgColor}`);
      // #C6121F = rgb(198, 18, 31)
      results.push({ fix: '14.1 SALE badge', status: bgColor.includes('198, 18, 31') ? 'PASS' : 'CHECK', value: bgColor });
    }

    // ========================================
    // FIX 14: Favorites page badges
    // ========================================
    console.log('\n--- Fix 14: Проверка бейджей в избранном ---');

    // Add item to favorites first
    const heartButton = desktopPage.locator('button[aria-label*="избранное"], button:has(svg.lucide-heart)').first();
    if (await heartButton.isVisible()) {
      await heartButton.click();
      await desktopPage.waitForTimeout(500);
    }

    await desktopPage.goto(`${PROD_URL}/favorites`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);

    await desktopPage.screenshot({
      path: `${SCREENSHOT_DIR}/fix14-favorites-badges.png`,
      fullPage: false
    });
    console.log('✓ Скриншот: fix14-favorites-badges.png');

    // ========================================
    // FIX 16: Size hover effect
    // ========================================
    console.log('\n--- Fix 16: Проверка hover эффекта размеров ---');

    // Go to a product page
    await desktopPage.goto(`${PROD_URL}/catalog?gender=women`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(500);

    const productCard = desktopPage.locator('a[href^="/product/"]').first();
    if (await productCard.isVisible()) {
      await productCard.click();
      await desktopPage.waitForTimeout(1500);
    }

    await desktopPage.screenshot({
      path: `${SCREENSHOT_DIR}/fix16-product-sizes-initial.png`,
      fullPage: false
    });
    console.log('✓ Скриншот: fix16-product-sizes-initial.png');

    // Find size button and hover
    const sizeButton = desktopPage.locator('button:has-text("S"), button:has-text("M"), button:has-text("L")').first();
    if (await sizeButton.isVisible()) {
      // Get initial style
      const initialBorder = await sizeButton.evaluate(el => getComputedStyle(el).border);
      console.log(`  Size button initial border: ${initialBorder}`);

      await sizeButton.hover();
      await desktopPage.waitForTimeout(300);

      await desktopPage.screenshot({
        path: `${SCREENSHOT_DIR}/fix16-product-sizes-hover.png`,
        fullPage: false
      });
      console.log('✓ Скриншот: fix16-product-sizes-hover.png');

      // Click to select
      await sizeButton.click();
      await desktopPage.waitForTimeout(300);

      const selectedBg = await sizeButton.evaluate(el => getComputedStyle(el).backgroundColor);
      console.log(`  Size button selected background: ${selectedBg}`);

      await desktopPage.screenshot({
        path: `${SCREENSHOT_DIR}/fix16-product-sizes-selected.png`,
        fullPage: false
      });
      console.log('✓ Скриншот: fix16-product-sizes-selected.png');

      results.push({ fix: '16 Size hover', status: 'CHECK', value: `border: ${initialBorder}, selected bg: ${selectedBg}` });
    }

    // ========================================
    // FIX 18: Sizes position, no color circles
    // ========================================
    console.log('\n--- Fix 18: Проверка расположения размеров ---');

    await desktopPage.goto(`${PROD_URL}/catalog?gender=women`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);

    await desktopPage.screenshot({
      path: `${SCREENSHOT_DIR}/fix18-catalog-layout.png`,
      fullPage: false
    });
    console.log('✓ Скриншот: fix18-catalog-layout.png');

    // Check if color circles are present (they shouldn't be)
    const colorCircles = await desktopPage.locator('.w-3.h-3.rounded-full, .w-4.h-4.rounded-full').count();
    console.log(`  Color circles found in catalog: ${colorCircles}`);
    results.push({ fix: '18 Color circles removed', status: colorCircles === 0 ? 'PASS' : 'CHECK', value: `${colorCircles} circles found` });

    // ========================================
    // FIX 19: Женское/Мужское naming
    // ========================================
    console.log('\n--- Fix 19: Проверка названий категорий ---');

    await desktopPage.goto(PROD_URL, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(500);

    await desktopPage.screenshot({
      path: `${SCREENSHOT_DIR}/fix19-navigation.png`,
      fullPage: false
    });
    console.log('✓ Скриншот: fix19-navigation.png');

    const hasZhenskoe = await desktopPage.locator('text=ЖЕНСКОЕ, text=Женское').first().isVisible().catch(() => false);
    const hasMuzhskoe = await desktopPage.locator('text=МУЖСКОЕ, text=Мужское').first().isVisible().catch(() => false);
    const hasDlyaNee = await desktopPage.locator('text="Для нее", text="ДЛЯ НЕЕ"').first().isVisible().catch(() => false);

    console.log(`  "Женское" found: ${hasZhenskoe}`);
    console.log(`  "Мужское" found: ${hasMuzhskoe}`);
    console.log(`  "Для нее" found: ${hasDlyaNee}`);

    results.push({ fix: '19 Naming', status: hasZhenskoe && !hasDlyaNee ? 'PASS' : 'CHECK', value: `Женское: ${hasZhenskoe}, Для нее: ${hasDlyaNee}` });

    // ========================================
    // FIX M6: Mobile bottom navigation
    // ========================================
    console.log('\n--- Fix M6: Проверка мобильной навигации ---');

    // Home page
    await mobilePage.goto(PROD_URL, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    await mobilePage.screenshot({
      path: `${SCREENSHOT_DIR}/fix-m6-mobile-home.png`,
      fullPage: false
    });
    console.log('✓ Скриншот: fix-m6-mobile-home.png');

    // Check bottom nav exists
    const bottomNav = mobilePage.locator('nav[aria-label="Мобильная навигация"]');
    const hasBottomNav = await bottomNav.isVisible().catch(() => false);
    console.log(`  Bottom nav visible: ${hasBottomNav}`);

    // Open menu
    const menuButton = mobilePage.locator('nav[aria-label="Мобильная навигация"] button').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await mobilePage.waitForTimeout(500);

      await mobilePage.screenshot({
        path: `${SCREENSHOT_DIR}/fix-m6-mobile-menu-home.png`,
        fullPage: false
      });
      console.log('✓ Скриншот: fix-m6-mobile-menu-home.png');

      // Close menu
      const closeBtn = mobilePage.locator('button[aria-label="Закрыть меню"]');
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await mobilePage.waitForTimeout(300);
      }
    }

    // Catalog page - contextual menu
    await mobilePage.goto(`${PROD_URL}/catalog?gender=women`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    await mobilePage.screenshot({
      path: `${SCREENSHOT_DIR}/fix-m6-mobile-catalog.png`,
      fullPage: false
    });
    console.log('✓ Скриншот: fix-m6-mobile-catalog.png');

    if (await menuButton.isVisible()) {
      await menuButton.click();
      await mobilePage.waitForTimeout(500);

      await mobilePage.screenshot({
        path: `${SCREENSHOT_DIR}/fix-m6-mobile-menu-catalog.png`,
        fullPage: false
      });
      console.log('✓ Скриншот: fix-m6-mobile-menu-catalog.png');

      // Check for categories
      const hasCategories = await mobilePage.locator('text=NEW').first().isVisible().catch(() => false);
      const hasVseTovarty = await mobilePage.locator('text="Все товары"').first().isVisible().catch(() => false);
      console.log(`  Categories in menu: NEW=${hasCategories}, Все товары=${hasVseTovarty}`);

      const closeBtn = mobilePage.locator('button[aria-label="Закрыть меню"]');
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await mobilePage.waitForTimeout(300);
      }
    }

    // Info page - contextual menu
    await mobilePage.goto(`${PROD_URL}/info`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    if (await menuButton.isVisible()) {
      await menuButton.click();
      await mobilePage.waitForTimeout(500);

      await mobilePage.screenshot({
        path: `${SCREENSHOT_DIR}/fix-m6-mobile-menu-info.png`,
        fullPage: false
      });
      console.log('✓ Скриншот: fix-m6-mobile-menu-info.png');

      const hasInfoSections = await mobilePage.locator('text="О бренде"').first().isVisible().catch(() => false);
      console.log(`  Info sections in menu: ${hasInfoSections}`);
    }

    results.push({ fix: 'M6 Bottom nav', status: hasBottomNav ? 'PASS' : 'FAIL', value: `visible: ${hasBottomNav}` });

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('ИТОГИ ПРОВЕРКИ');
    console.log('='.repeat(60));

    for (const r of results) {
      const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '🔍';
      console.log(`${icon} ${r.fix}: ${r.status} (${r.value})`);
    }

    console.log('\nСкриншоты сохранены в: ' + SCREENSHOT_DIR);

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await browser.close();
  }
}

// Create screenshot directory
const fs = require('fs');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

verifyProductionFixes().catch(console.error);
