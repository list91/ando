const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('=== ТЕСТ ВЫРАВНИВАНИЯ 3 БЛОКОВ (ПОСЛЕ ИСПРАВЛЕНИЯ) ===\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Create screenshots dir
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // Navigate to product page
    console.log('Навигация на страницу товара: http://localhost:8081/product/t-shirts2');
    console.log('-'.repeat(70) + '\n');

    await page.goto('http://localhost:8081/product/t-shirts2', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('[SUCCESS] Страница товара загружена\n');

    // Step 1: Find and measure Sidebar Menu (nav.sidebar-menu-adaptive or first menu item)
    console.log('ИЗМЕРЕНИЕ 1: Сайдбар меню (nav.sidebar-menu-adaptive)');
    console.log('-'.repeat(70));

    let sidebarMenuY = null;

    // Try to find nav with sidebar-menu-adaptive class
    const sidebarNav = await page.locator('nav.sidebar-menu-adaptive').first();
    const isSidebarVisible = await sidebarNav.isVisible().catch(() => false);

    if (isSidebarVisible) {
      const box = await sidebarNav.boundingBox();
      sidebarMenuY = Math.round(box.y);
      console.log(`[SUCCESS] Найден элемент nav.sidebar-menu-adaptive`);
      console.log(`Сайдбар меню:     Y = ${sidebarMenuY}px\n`);
    } else {
      // Try alternative: find first menu item (NEW, Все товары)
      const menuItems = await page.locator('nav a').first();
      const isMenuVisible = await menuItems.isVisible().catch(() => false);

      if (isMenuVisible) {
        const box = await menuItems.boundingBox();
        sidebarMenuY = Math.round(box.y);
        console.log(`[SUCCESS] Найден первый элемент меню`);
        console.log(`Сайдбар меню:     Y = ${sidebarMenuY}px\n`);
      } else {
        console.log('[WARNING] Сайдбар меню не найден. Поиск альтернативного элемента...\n');
      }
    }

    // Step 2: Find and measure Photo Block (div.flex-1.flex.items-start)
    console.log('ИЗМЕРЕНИЕ 2: Фото блок (div.flex-1.flex.items-start)');
    console.log('-'.repeat(70));

    let photoBlockY = null;

    const photoBlock = await page.locator('div.flex-1.flex.items-start').first();
    const isPhotoVisible = await photoBlock.isVisible().catch(() => false);

    if (isPhotoVisible) {
      const box = await photoBlock.boundingBox();
      photoBlockY = Math.round(box.y);
      console.log(`[SUCCESS] Найден элемент div.flex-1.flex.items-start`);
      console.log(`Фото блок:        Y = ${photoBlockY}px\n`);
    } else {
      console.log('[WARNING] Фото блок не найден. Попытка поиска альтернативного элемента...\n');
    }

    // Step 3: Find and measure Metadata Block (div.lg:w-[480px])
    console.log('ИЗМЕРЕНИЕ 3: Метаданные блок (div.lg:w-[480px])');
    console.log('-'.repeat(70));

    let metadataBlockY = null;

    const metadataBlock = await page.locator('div.lg\\:w-\\[480px\\]').first();
    const isMetadataVisible = await metadataBlock.isVisible().catch(() => false);

    if (isMetadataVisible) {
      const box = await metadataBlock.boundingBox();
      metadataBlockY = Math.round(box.y);
      console.log(`[SUCCESS] Найден элемент div.lg:w-[480px]`);
      console.log(`Метаданные блок:  Y = ${metadataBlockY}px\n`);
    } else {
      console.log('[WARNING] Метаданные блок не найден. Попытка поиска альтернативного элемента...\n');
    }

    // Step 4: Display results
    console.log('='.repeat(70));
    console.log('\n=== РЕЗУЛЬТАТЫ ИЗМЕРЕНИЙ ===\n');

    if (sidebarMenuY !== null) {
      console.log(`Сайдбар меню:     Y = ${sidebarMenuY}px`);
    } else {
      console.log('Сайдбар меню:     Y = [НЕ НАЙДЕН]');
    }

    if (photoBlockY !== null) {
      console.log(`Фото блок:        Y = ${photoBlockY}px`);
    } else {
      console.log('Фото блок:        Y = [НЕ НАЙДЕН]');
    }

    if (metadataBlockY !== null) {
      console.log(`Метаданные блок:  Y = ${metadataBlockY}px`);
    } else {
      console.log('Метаданные блок:  Y = [НЕ НАЙДЕН]');
    }

    console.log('\n' + '-'.repeat(70) + '\n');

    // Step 5: Calculate differences
    if (sidebarMenuY !== null && photoBlockY !== null) {
      const deltaYSidebarVsPhoto = Math.abs(sidebarMenuY - photoBlockY);
      console.log(`Разница сайдбар vs фото: ΔY = ${deltaYSidebarVsPhoto}px`);
    }

    if (photoBlockY !== null && metadataBlockY !== null) {
      const deltaYPhotoVsMetadata = Math.abs(photoBlockY - metadataBlockY);
      console.log(`Разница фото vs метаданные: ΔY = ${deltaYPhotoVsMetadata}px`);
    }

    console.log('\n' + '-'.repeat(70) + '\n');

    // Step 6: Determine alignment status
    let alignmentStatus = 'НЕПОЛНЫЕ ДАННЫЕ';
    const alignmentThreshold = 5; // px tolerance

    if (sidebarMenuY !== null && photoBlockY !== null && metadataBlockY !== null) {
      const deltaYSidebarVsPhoto = Math.abs(sidebarMenuY - photoBlockY);
      const deltaYPhotoVsMetadata = Math.abs(photoBlockY - metadataBlockY);

      const allAligned = deltaYSidebarVsPhoto <= alignmentThreshold &&
                         deltaYPhotoVsMetadata <= alignmentThreshold;

      alignmentStatus = allAligned ? 'ВСЕ ВЫРОВНЕНЫ' : 'НЕ ВЫРОВНЕНЫ';
    }

    console.log(`РЕЗУЛЬТАТ: ${alignmentStatus}\n`);
    console.log('='.repeat(70) + '\n');

    // Step 7: Take screenshot
    console.log('Создание скриншота страницы...');
    const screenshotPath = path.join(screenshotsDir, 'three-blocks-aligned.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: false
    });

    console.log(`[SUCCESS] Скриншот сохранен: ${screenshotPath}\n`);
    console.log('='.repeat(70) + '\n');

    // Keep browser open for inspection
    console.log('[INFO] Браузер остается открытым для визуального контроля (3 сек)...');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('[ERROR] Ошибка при выполнении теста:', error);
    const errorScreenshot = path.join(screenshotsDir, 'error-three-blocks-test.png');
    try {
      await page.screenshot({ path: errorScreenshot });
      console.log(`[INFO] Скриншот ошибки сохранен: ${errorScreenshot}`);
    } catch (e) {
      console.error('[ERROR] Не удалось сохранить скриншот ошибки:', e);
    }
  } finally {
    await browser.close();
    console.log('[INFO] Браузер закрыт. Тест завершен.\n');
  }
})();
