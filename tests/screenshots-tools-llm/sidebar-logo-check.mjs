// Проверка логотипа в сайдбаре (AppSidebar)
// Playwright скрипт для скриншота и измерения логотипа в боковой панели

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Конфигурация
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = './test-results/sidebar-logo';

const result = {
  status: 'failed',
  tool_created: 'sidebar-logo-check.mjs',
  screenshot_path: null,
  logo_width_px: null,
  errors: []
};

console.log('Проверка логотипа в сайдбаре (AppSidebar)\n');
console.log('='.repeat(50));

(async () => {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true
    });

    // Создать директорию для результатов
    mkdirSync(OUTPUT_DIR, { recursive: true });

    const page = await browser.newPage();

    // Desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    console.log('\nViewport: 1920x1080 (desktop)');

    // Переход на главную
    console.log('Открываю ' + BASE_URL + '...');
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    console.log('Страница загружена');

    // Поиск сайдбара - пробуем разные селекторы
    const sidebarSelectors = [
      'aside',
      '[data-sidebar]',
      '.sidebar',
      '[class*="sidebar"]',
      '[class*="Sidebar"]',
      'nav:has(img[alt="ANDO JV"])'
    ];

    let sidebar = null;
    let usedSelector = null;

    for (const selector of sidebarSelectors) {
      const element = page.locator(selector).first();
      const count = await element.count();
      if (count > 0) {
        const box = await element.boundingBox();
        if (box && box.width > 50) {
          sidebar = element;
          usedSelector = selector;
          console.log(`Найден сайдбар: ${selector} (${Math.round(box.width)}x${Math.round(box.height)}px)`);
          break;
        }
      }
    }

    if (!sidebar) {
      result.errors.push('Сайдбар не найден ни по одному из селекторов');
      console.log('ОШИБКА: Сайдбар не найден');

      // Скриншот всей страницы для отладки
      const debugPath = join(OUTPUT_DIR, 'debug-fullpage.png');
      await page.screenshot({ path: debugPath, fullPage: false });
      console.log('Сохранен debug скриншот: ' + debugPath);

      writeFileSync(join(OUTPUT_DIR, '_result.json'), JSON.stringify(result, null, 2));
      console.log('\nРезультат:\n' + JSON.stringify(result, null, 2));
      await browser.close();
      return;
    }

    // Поиск логотипа внутри сайдбара
    const logo = sidebar.locator('img[alt="ANDO JV"]').first();
    const logoCount = await logo.count();

    if (logoCount === 0) {
      // Попробуем найти логотип на всей странице
      const globalLogo = page.locator('img[alt="ANDO JV"]').first();
      const globalLogoCount = await globalLogo.count();

      if (globalLogoCount > 0) {
        result.errors.push('Логотип найден, но не внутри сайдбара');
        console.log('Логотип найден на странице, но не в сайдбаре');

        // Снимаем скриншот найденного логотипа
        const logoBox = await globalLogo.boundingBox();
        if (logoBox) {
          const screenshotPath = join(OUTPUT_DIR, 'logo-outside-sidebar.png');
          await globalLogo.screenshot({ path: screenshotPath });
          result.screenshot_path = screenshotPath;
          result.logo_width_px = Math.round(logoBox.width);
          result.status = 'success';
          console.log(`Логотип: ${Math.round(logoBox.width)}x${Math.round(logoBox.height)}px`);
        }
      } else {
        result.errors.push('Логотип img[alt="ANDO JV"] не найден на странице');
        console.log('ОШИБКА: Логотип не найден');
      }
    } else {
      // Логотип найден в сайдбаре
      const logoBox = await logo.boundingBox();

      if (!logoBox) {
        result.errors.push('Логотип существует но невидим (нет boundingBox)');
        console.log('ОШИБКА: Логотип невидим');
      } else {
        // Скриншот логотипа
        const logoScreenshotPath = join(OUTPUT_DIR, 'sidebar-logo.png');
        await logo.screenshot({ path: logoScreenshotPath });

        // Скриншот всего сайдбара
        const sidebarScreenshotPath = join(OUTPUT_DIR, 'sidebar-full.png');
        await sidebar.screenshot({ path: sidebarScreenshotPath });

        result.status = 'success';
        result.screenshot_path = logoScreenshotPath;
        result.logo_width_px = Math.round(logoBox.width);

        console.log(`\nЛоготип найден в сайдбаре!`);
        console.log(`Размер: ${Math.round(logoBox.width)}x${Math.round(logoBox.height)}px`);
        console.log(`Позиция: (${Math.round(logoBox.x)}, ${Math.round(logoBox.y)})`);
        console.log(`Селектор сайдбара: ${usedSelector}`);
        console.log(`\nСкриншот логотипа: ${logoScreenshotPath}`);
        console.log(`Скриншот сайдбара: ${sidebarScreenshotPath}`);
      }
    }

    await page.close();

  } catch (error) {
    result.errors.push(error.message);
    console.log('\nОШИБКА: ' + error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Сохранить результат
  writeFileSync(join(OUTPUT_DIR, '_result.json'), JSON.stringify(result, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log('Результат:\n' + JSON.stringify(result, null, 2));
  console.log('\nФайлы сохранены в: ' + OUTPUT_DIR);

  process.exit(result.status === 'success' ? 0 : 1);
})();
