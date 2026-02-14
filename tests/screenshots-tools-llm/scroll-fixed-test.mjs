// Scroll Fixed Elements Test
// Проверка фиксации элементов (header, logo) при скролле на всех страницах

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Конфигурация
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = './test-results/scroll-test';
const SCROLL_AMOUNT = 500;
const MAX_POSITION_DELTA = 5; // Максимально допустимое изменение позиции в px

const pages = [
  { name: 'home', url: '/', description: 'Главная страница' },
  { name: 'catalog-women', url: '/catalog?gender=women', description: 'Каталог женское' },
  { name: 'catalog-men', url: '/catalog?gender=men', description: 'Каталог мужское' },
  { name: 'lookbook', url: '/lookbook', description: 'Лукбук' },
  { name: 'info', url: '/info', description: 'Информация' }
];

const results = [];
const screenshots = [];

console.log('Scroll Fixed Elements Test');
console.log('='.repeat(60));
console.log(`Base URL: ${BASE_URL}`);
console.log(`Scroll amount: ${SCROLL_AMOUNT}px`);
console.log(`Max allowed delta: ${MAX_POSITION_DELTA}px`);
console.log('='.repeat(60));

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  // Создать директорию для результатов
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  for (const pageInfo of pages) {
    console.log(`\nTesting: ${pageInfo.name} (${pageInfo.url})`);
    console.log('-'.repeat(40));

    const result = {
      page: pageInfo.name,
      url: BASE_URL + pageInfo.url,
      logo_before: null,
      logo_after: null,
      delta: null,
      fixed: false,
      error: null
    };

    try {
      // Переход на страницу
      await page.goto(BASE_URL + pageInfo.url, {
        waitUntil: 'networkidle',
        timeout: 15000
      });

      // Убедиться что страница загрузилась
      await page.waitForTimeout(500);

      // Найти лого
      const logo = page.locator('img[alt="ANDO JV"]').first();
      const logoCount = await logo.count();

      if (logoCount === 0) {
        console.log('  ERROR: Logo not found!');
        result.error = 'Logo not found';
        results.push(result);
        continue;
      }

      // Скриншот ДО скролла
      const screenshotBefore = `${pageInfo.name}-before-scroll.png`;
      await page.screenshot({
        path: join(OUTPUT_DIR, screenshotBefore),
        fullPage: false
      });
      screenshots.push(join(OUTPUT_DIR, screenshotBefore));
      console.log(`  Screenshot BEFORE: ${screenshotBefore}`);

      // Получить позицию лого ДО скролла
      const boxBefore = await logo.boundingBox();
      if (!boxBefore) {
        console.log('  ERROR: Logo has no bounding box');
        result.error = 'Logo not visible';
        results.push(result);
        continue;
      }

      result.logo_before = {
        x: Math.round(boxBefore.x),
        y: Math.round(boxBefore.y)
      };
      console.log(`  Logo BEFORE: x=${result.logo_before.x}, y=${result.logo_before.y}`);

      // Скролл вниз
      await page.evaluate((amount) => window.scrollBy(0, amount), SCROLL_AMOUNT);
      await page.waitForTimeout(300);

      // Скриншот ПОСЛЕ скролла
      const screenshotAfter = `${pageInfo.name}-after-scroll.png`;
      await page.screenshot({
        path: join(OUTPUT_DIR, screenshotAfter),
        fullPage: false
      });
      screenshots.push(join(OUTPUT_DIR, screenshotAfter));
      console.log(`  Screenshot AFTER: ${screenshotAfter}`);

      // Получить позицию лого ПОСЛЕ скролла
      const boxAfter = await logo.boundingBox();
      if (!boxAfter) {
        console.log('  ERROR: Logo disappeared after scroll');
        result.error = 'Logo disappeared after scroll';
        results.push(result);
        continue;
      }

      result.logo_after = {
        x: Math.round(boxAfter.x),
        y: Math.round(boxAfter.y)
      };
      console.log(`  Logo AFTER: x=${result.logo_after.x}, y=${result.logo_after.y}`);

      // Вычислить дельту
      const deltaX = Math.abs(result.logo_after.x - result.logo_before.x);
      const deltaY = Math.abs(result.logo_after.y - result.logo_before.y);
      result.delta = Math.max(deltaX, deltaY);
      console.log(`  Delta: ${result.delta}px (X: ${deltaX}, Y: ${deltaY})`);

      // Проверить фиксацию
      result.fixed = result.delta <= MAX_POSITION_DELTA;

      if (result.fixed) {
        console.log(`  RESULT: FIXED (delta ${result.delta}px <= ${MAX_POSITION_DELTA}px)`);
      } else {
        console.log(`  RESULT: NOT FIXED (delta ${result.delta}px > ${MAX_POSITION_DELTA}px)`);
      }

      // Вернуться наверх для следующего теста
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);

    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
      result.error = error.message;
    }

    results.push(result);
  }

  await browser.close();

  // Формирование итогового отчета
  const allFixed = results.every(r => r.fixed === true);
  const pagesWithErrors = results.filter(r => r.error !== null).length;
  const pagesTested = results.length;

  const report = {
    status: pagesWithErrors === 0 && allFixed ? 'success' : 'failed',
    pages_tested: pagesTested,
    results: results,
    all_fixed: allFixed,
    screenshots: screenshots
  };

  // Вывод итогов
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Pages tested: ${pagesTested}`);
  console.log(`All fixed: ${allFixed}`);
  console.log(`Status: ${report.status}`);
  console.log(`Screenshots saved: ${screenshots.length}`);
  console.log('\n');

  // Вывести JSON результат
  console.log('JSON REPORT:');
  console.log(JSON.stringify(report, null, 2));

  // Сохранить отчет в файл
  writeFileSync(
    join(OUTPUT_DIR, '_scroll-test-results.json'),
    JSON.stringify(report, null, 2)
  );
  console.log(`\nReport saved: ${join(OUTPUT_DIR, '_scroll-test-results.json')}`);

  // Exit code
  process.exit(report.status === 'success' ? 0 : 1);
})();
