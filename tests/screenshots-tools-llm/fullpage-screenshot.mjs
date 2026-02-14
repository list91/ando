// Полноэкранный скриншот страницы для финального артефакта
// Playwright скрипт

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';

// Конфигурация
const BASE_URL = 'http://localhost:5173';
const OUTPUT_PATH = 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/final/C-1-1-final.png';

const result = {
  status: 'failed',
  screenshot_path: null,
  viewport: '1920x1080',
  sidebar_visible: false
};

console.log('Fullpage Screenshot for C-1.1 Final\n');
console.log('='.repeat(50));

(async () => {
  let browser;

  try {
    browser = await chromium.launch({ headless: true });

    // Создать директорию
    mkdirSync('C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/final', { recursive: true });

    const page = await browser.newPage();

    // Desktop viewport 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 });
    console.log('Viewport: 1920x1080');

    // Переход на страницу
    console.log('Opening ' + BASE_URL + '...');
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    console.log('Page loaded');

    // Проверка наличия сайдбара
    const sidebarSelectors = ['aside', '[data-sidebar]', '.sidebar', '[class*="sidebar"]'];
    let sidebarVisible = false;

    for (const selector of sidebarSelectors) {
      const element = page.locator(selector).first();
      const count = await element.count();
      if (count > 0) {
        const box = await element.boundingBox();
        if (box && box.width > 50) {
          sidebarVisible = true;
          console.log(`Sidebar found: ${selector} (${Math.round(box.width)}x${Math.round(box.height)}px)`);
          break;
        }
      }
    }

    result.sidebar_visible = sidebarVisible;

    // Полноэкранный скриншот
    await page.screenshot({
      path: OUTPUT_PATH,
      fullPage: true
    });

    result.status = 'success';
    result.screenshot_path = OUTPUT_PATH;

    console.log('\nScreenshot saved: ' + OUTPUT_PATH);

  } catch (error) {
    console.error('ERROR: ' + error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(JSON.stringify(result, null, 2));

  process.exit(result.status === 'success' ? 0 : 1);
})();
