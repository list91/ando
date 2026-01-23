const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:8080'; // Testing on dev server first
const SCREENSHOT_DIR = 'tests/screenshots/mobile-search-test';

async function testMobileSearch() {
  console.log('='.repeat(60));
  console.log('ТЕСТ: Мобильный поиск (новая реализация)');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();
  const results = [];

  try {
    // Step 1: Open home page
    console.log('\n1. Открываю главную страницу...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Accept cookies if present
    const acceptCookies = page.locator('button:has-text("Принять")');
    if (await acceptCookies.isVisible()) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-home-initial.png`,
      fullPage: false
    });
    console.log('✓ Скриншот: 01-home-initial.png');

    // Step 2: Click search button in bottom nav
    console.log('\n2. Кликаю кнопку ПОИСК...');

    const searchButton = page.locator('button:has-text("ПОИСК")').first();
    await searchButton.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-search-overlay-open.png`,
      fullPage: false
    });
    console.log('✓ Скриншот: 02-search-overlay-open.png');

    // Step 3: Check search overlay appeared
    const searchInput = page.locator('input[placeholder*="Поиск"]');
    const isInputVisible = await searchInput.isVisible();
    console.log(`   Поле поиска появилось: ${isInputVisible}`);
    results.push({ test: 'Search overlay opens', pass: isInputVisible });

    if (isInputVisible) {
      // Step 4: Check placeholder hint
      console.log('\n3. Проверяю подсказку...');
      const hintText = page.locator('text=Введите название товара');
      const hasHint = await hintText.isVisible();
      console.log(`   Подсказка видна: ${hasHint}`);
      results.push({ test: 'Hint text visible', pass: hasHint });

      // Step 5: Type search query
      console.log('\n4. Ввожу "пальто"...');
      await searchInput.fill('пальто');
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-search-query-typed.png`,
        fullPage: false
      });
      console.log('✓ Скриншот: 03-search-query-typed.png');

      // Check search suggestion appeared
      const searchSuggestion = page.locator('button:has-text("Искать: пальто")');
      const hasSuggestion = await searchSuggestion.isVisible();
      console.log(`   Кнопка "Искать: пальто" видна: ${hasSuggestion}`);
      results.push({ test: 'Search suggestion appears', pass: hasSuggestion });

      // Step 6: Clear search
      console.log('\n5. Очищаю поиск...');
      const clearButton = page.locator('button[aria-label="Очистить"]');
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await page.waitForTimeout(300);

        const inputValue = await searchInput.inputValue();
        console.log(`   Поле очищено: ${inputValue === ''}`);
        results.push({ test: 'Clear button works', pass: inputValue === '' });

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/04-search-cleared.png`,
          fullPage: false
        });
        console.log('✓ Скриншот: 04-search-cleared.png');
      }

      // Step 7: Type again and submit
      console.log('\n6. Ввожу "брюки" и нажимаю Enter...');
      await searchInput.fill('брюки');
      await page.waitForTimeout(200);
      await searchInput.press('Enter');
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/05-search-results.png`,
        fullPage: false
      });
      console.log('✓ Скриншот: 05-search-results.png');

      // Check we're on catalog page
      const currentUrl = page.url();
      const isOnCatalog = currentUrl.includes('/catalog');
      console.log(`   Перешли на каталог: ${isOnCatalog}`);
      console.log(`   URL: ${currentUrl}`);
      results.push({ test: 'Navigate to catalog', pass: isOnCatalog });

      // Check search overlay closed
      const overlayStillOpen = await searchInput.isVisible().catch(() => false);
      console.log(`   Оверлей закрылся: ${!overlayStillOpen}`);
      results.push({ test: 'Overlay closes after submit', pass: !overlayStillOpen });

      // Step 8: Check if products are filtered
      console.log('\n7. Проверяю результаты...');
      await page.waitForTimeout(500);

      const productCards = page.locator('a[href^="/product/"]');
      const cardCount = await productCards.count();
      console.log(`   Карточек товаров: ${cardCount}`);

      // Step 9: Open search again to test close button
      console.log('\n8. Тестирую кнопку закрытия...');
      const searchButtonAgain = page.locator('button:has-text("ПОИСК")').first();
      await searchButtonAgain.click();
      await page.waitForTimeout(300);

      const closeButton = page.locator('button[aria-label="Закрыть поиск"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);

        const overlayClosed = !(await page.locator('input[placeholder*="Поиск"]').isVisible().catch(() => false));
        console.log(`   Закрытие по X работает: ${overlayClosed}`);
        results.push({ test: 'Close button works', pass: overlayClosed });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('ИТОГИ ТЕСТА МОБИЛЬНОГО ПОИСКА');
    console.log('='.repeat(60));

    let passed = 0, failed = 0;
    for (const r of results) {
      const icon = r.pass ? '✅' : '❌';
      console.log(`${icon} ${r.test}`);
      if (r.pass) passed++; else failed++;
    }

    console.log(`\nВсего: ${passed} passed, ${failed} failed`);
    console.log(`\nСкриншоты: ${SCREENSHOT_DIR}/`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/error-state.png`,
      fullPage: false
    });
  } finally {
    await browser.close();
  }
}

// Create screenshot directory
const fs = require('fs');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

testMobileSearch().catch(console.error);
