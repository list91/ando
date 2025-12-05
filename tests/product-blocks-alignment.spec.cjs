const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('=== ПРОТОКОЛ ТЕСТИРОВАНИЯ ВЫРАВНИВАНИЯ БЛОКОВ НА СТРАНИЦЕ ТОВАРА ===\n');

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
    // Step 1: Go to catalog and find first product
    console.log('ЭТАП 1: Навигация к каталогу и поиск товара');
    console.log('-'.repeat(70));

    await page.goto('http://localhost:8081/catalog', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Find first product card and get its link
    console.log('[INFO] Поиск карточек товаров в каталоге...');
    const productCards = await page.locator('a[href^="/product/"]').all();
    console.log(`[SUCCESS] Найдено ${productCards.length} ссылок на товары\n`);

    if (productCards.length === 0) {
      console.log('[ERROR] Товары не найдены в каталоге!');
      await browser.close();
      return;
    }

    // Click first product
    const firstProductLink = productCards[0];
    const href = await firstProductLink.getAttribute('href');
    console.log(`[INFO] Переход на товар: ${href}`);
    await firstProductLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('[SUCCESS] Страница товара загружена\n');

    // Step 2: Find and measure blocks
    console.log('ЭТАП 2: Поиск и измерение основных блоков на странице товара');
    console.log('-'.repeat(70));

    // Get the main container (flex flex-row on desktop)
    const mainContainer = await page.locator('div.flex.flex-col.lg\\:flex-row.min-h-full').first();

    if (!await mainContainer.isVisible()) {
      console.log('[ERROR] Основной контейнер товара не найден!');
      await browser.close();
      return;
    }

    console.log('[INFO] Основной контейнер найден. Анализ дочерних блоков...\n');

    // Get all direct children of main container
    const children = await mainContainer.locator('> div').all();
    console.log(`[INFO] Найдено ${children.length} прямых дочерних блоков\n`);

    const blocks = [];

    // Measure each block
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const isVisible = await child.isVisible();
      const box = await child.boundingBox();

      if (box && isVisible) {
        const classes = await child.getAttribute('class');

        // Identify block type
        let blockType = 'Unknown';
        if (classes && classes.includes('flex-1')) {
          blockType = 'Левый блок (фото)';
        } else if (classes && classes.includes('lg:w-[480px]')) {
          blockType = 'Правый блок (метаданные)';
        } else {
          blockType = `Блок ${i + 1}`;
        }

        blocks.push({
          type: blockType,
          index: i,
          y: Math.round(box.y),
          x: Math.round(box.x),
          width: Math.round(box.width),
          height: Math.round(box.height),
          classes: classes ? classes.substring(0, 80) : 'N/A'
        });
      }
    }

    // Step 3: Display alignment analysis
    console.log('ЭТАП 3: РЕЗУЛЬТАТЫ АНАЛИЗА ВЫРАВНИВАНИЯ');
    console.log('='.repeat(70));

    if (blocks.length === 0) {
      console.log('[ERROR] Не найдены видимые блоки!');
      await browser.close();
      return;
    }

    // Print all blocks
    console.log('\nОбнаруженные блоки на странице:');
    console.log('-'.repeat(70));

    for (const block of blocks) {
      console.log(`
${block.type}:
  Y координата: ${block.y}px
  X координата: ${block.x}px
  Ширина: ${block.width}px
  Высота: ${block.height}px
  CSS классы: ${block.classes}
`);
    }

    // Calculate alignment
    console.log('='.repeat(70));
    console.log('\nАНАЛИЗ ВЫРАВНИВАНИЯ:');
    console.log('-'.repeat(70));

    const leftBlock = blocks.find(b => b.type.includes('Левый'));
    const rightBlock = blocks.find(b => b.type.includes('Правый'));

    if (leftBlock && rightBlock) {
      const deltaY = Math.abs(leftBlock.y - rightBlock.y);
      const alignmentThreshold = 5; // px
      const isAligned = deltaY <= alignmentThreshold;

      console.log(`
Левый блок (фото):        Y = ${leftBlock.y}px
Правый блок (метаданные): Y = ${rightBlock.y}px
Разница (ΔY):             ${deltaY}px

Пороговое значение:       ${alignmentThreshold}px
Статус выравнивания:      ${isAligned ? '✓ ВЫРОВНЕНЫ' : '✗ НЕ ВЫРОВНЕНЫ'}
`);

      if (!isAligned) {
        console.log(`ВНИМАНИЕ: Разница в ${deltaY}px превышает допустимое значение ${alignmentThreshold}px!`);
        console.log(`Требуется корректировка CSS для выравнивания блоков по горизонтали.\n`);
      } else {
        console.log('Блоки корректно выровнены по горизонтали.\n');
      }
    } else {
      console.log('[WARNING] Не удалось найти оба основных блока (левый и правый).\n');
    }

    // Step 4: Take screenshot
    console.log('ЭТАП 4: Создание скриншота страницы');
    console.log('-'.repeat(70));

    const screenshotPath = path.join(screenshotsDir, 'product-blocks-alignment.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: false // Capture only visible viewport
    });

    console.log(`[SUCCESS] Скриншот сохранен: ${screenshotPath}\n`);

    // Step 5: Summary
    console.log('='.repeat(70));
    console.log('ИТОГОВЫЙ ОТЧЕТ');
    console.log('='.repeat(70));
    console.log(`
Дата тестирования: ${new Date().toLocaleString('ru-RU')}
Разрешение экрана: 1920x1080
Сервер: http://localhost:8081
Товар: ${href}

Скриншот: tests/screenshots/product-blocks-alignment.png

Обнаружено блоков: ${blocks.length}
Статус: ${leftBlock && rightBlock && Math.abs(leftBlock.y - rightBlock.y) <= 5 ? 'УСПЕШНО' : 'ТРЕБУЕТ ВНИМАНИЯ'}
`);

    console.log('='.repeat(70) + '\n');

    // Keep browser open for 5 seconds for visual inspection
    console.log('[INFO] Браузер остается открытым для визуального контроля (5 сек)...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('[ERROR] Ошибка при выполнении теста:', error);
    const errorScreenshot = path.join(screenshotsDir, 'error-alignment-test.png');
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
