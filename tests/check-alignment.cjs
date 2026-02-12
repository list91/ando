/**
 * Playwright скрипт для проверки выравнивания layout (Правки 4, С-1)
 *
 * Использование:
 *   node check-alignment.js [url] [output-dir]
 *
 * Пример:
 *   node check-alignment.js http://83.166.246.253 ./screenshots
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DEFAULT_URL = 'http://83.166.246.253';
const DEFAULT_OUTPUT = './screenshots';

async function checkAlignment(baseUrl, outputDir) {
  const browser = await chromium.launch();

  try {
    console.log('\n=== ПРОВЕРКА ВЫРАВНИВАНИЯ С-1 ===\n');

    // Создаём директорию для скриншотов
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 }
    });

    // Страницы для проверки
    const pages = [
      { path: '/catalog?gender=women', name: 'catalog-women' },
      { path: '/', name: 'home' },
    ];

    const results = {};

    for (const p of pages) {
      const url = baseUrl + p.path;
      console.log(`Проверяю: ${p.name} (${url})`);

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Измеряем позиции элементов
      const measurements = await page.evaluate(() => {
        const result = {};

        // 1. Лого в sidebar
        const logo = document.querySelector('aside img[alt="ANDO JV"]');
        if (logo) {
          const rect = logo.getBoundingClientRect();
          result.logo = {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            bottom: Math.round(rect.bottom)
          };
        }

        // 2. Sidebar
        const sidebar = document.querySelector('aside');
        if (sidebar) {
          const rect = sidebar.getBoundingClientRect();
          result.sidebar = {
            width: Math.round(rect.width),
            left: Math.round(rect.left)
          };
        }

        // 3. Меню категорий (первый пункт)
        const menuItem = document.querySelector('aside nav a, aside nav button');
        if (menuItem) {
          const rect = menuItem.getBoundingClientRect();
          result.menuFirstItem = {
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            text: menuItem.textContent.trim().substring(0, 20)
          };
        }

        // 4. Header навигация (ЖЕНСКОЕ и т.д.)
        const headerNav = document.querySelector('header nav a');
        if (headerNav) {
          const rect = headerNav.getBoundingClientRect();
          result.headerNav = {
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            text: headerNav.textContent.trim()
          };
        }

        // 5. Вычисляем разницу выравнивания
        if (result.menuFirstItem && result.headerNav) {
          result.alignment = {
            menuTop: result.menuFirstItem.top,
            headerNavTop: result.headerNav.top,
            difference: Math.abs(result.menuFirstItem.top - result.headerNav.top),
            aligned: Math.abs(result.menuFirstItem.top - result.headerNav.top) <= 15
          };
        }

        return result;
      });

      results[p.name] = measurements;

      // Делаем скриншот
      const screenshotPath = path.join(outputDir, `${p.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`  Скриншот: ${screenshotPath}`);

      // Выводим измерения
      if (measurements.alignment) {
        const status = measurements.alignment.aligned ? '✓' : '✗';
        console.log(`  Меню top: ${measurements.alignment.menuTop}px`);
        console.log(`  Header nav top: ${measurements.alignment.headerNavTop}px`);
        console.log(`  Разница: ${measurements.alignment.difference}px ${status}`);
      }
      console.log('');
    }

    // Итоговый отчёт
    console.log('=== ИТОГ ===');
    const allAligned = Object.values(results).every(r => r.alignment?.aligned);
    console.log(`Статус: ${allAligned ? 'ВЫРОВНЕНО ✓' : 'НЕ ВЫРОВНЕНО ✗'}`);

    // Сохраняем JSON с результатами
    const jsonPath = path.join(outputDir, 'alignment-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`\nРезультаты: ${jsonPath}`);

    return results;

  } finally {
    await browser.close();
  }
}

// Запуск
const url = process.argv[2] || DEFAULT_URL;
const outputDir = process.argv[3] || DEFAULT_OUTPUT;

checkAlignment(url, outputDir)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Ошибка:', err.message);
    process.exit(1);
  });
