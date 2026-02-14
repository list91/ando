// С-1: Умная проверка Layout Лого на всех страницах
// Playwright скрипт для автоматического тестирования позиции и отображения лого

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Конфигурация
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = './test-results/logo-layout';

const pages = [
  { name: 'home', url: '/', description: 'Главная страница' },
  { name: 'catalog-women', url: '/catalog?gender=women', description: 'Каталог женской одежды' },
  { name: 'catalog-men', url: '/catalog?gender=men', description: 'Каталог мужской одежды' },
  { name: 'product', url: '/catalog/test-coat-1', description: 'Страница товара' },
  { name: 'cart', url: '/cart', description: 'Корзина' },
  { name: 'lookbook', url: '/lookbook', description: 'Lookbook' },
  { name: 'info', url: '/info', description: 'Информация' },
  { name: 'favorites', url: '/favorites', description: 'Избранное' }
];

const breakpoints = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 }
];

// Массив для сбора проблем
const issues = [];
const results = [];

console.log('🔍 С-1: Проверка Layout Лого на всех страницах\n');
console.log('━'.repeat(60));

(async () => {
  const browser = await chromium.launch({
    headless: true // Установи false для отладки
  });

  // Создать директорию для результатов
  mkdirSync(OUTPUT_DIR, { recursive: true });

  let totalChecks = 0;
  let passedChecks = 0;

  for (const bp of breakpoints) {
    console.log(`\n📱 ${bp.name.toUpperCase()} (${bp.width}x${bp.height})`);
    console.log('─'.repeat(60));

    const page = await browser.newPage();
    await page.setViewportSize({ width: bp.width, height: bp.height });

    for (const pageInfo of pages) {
      totalChecks++;
      const testName = `${bp.name}-${pageInfo.name}`;

      try {
        // Переход на страницу
        await page.goto(BASE_URL + pageInfo.url, {
          waitUntil: 'networkidle',
          timeout: 10000
        });

        // Найти лого
        const logo = page.locator('img[alt="ANDO JV"]').first();

        // Проверка 1: Лого существует
        const logoCount = await logo.count();
        if (logoCount === 0) {
          issues.push({
            severity: 'CRITICAL',
            breakpoint: bp.name,
            page: pageInfo.name,
            issue: 'ЛОГО НЕ НАЙДЕНО!',
            description: `На странице ${pageInfo.description} отсутствует элемент img[alt="ANDO JV"]`
          });
          console.log(`  ❌ ${pageInfo.name}: ЛОГО НЕ НАЙДЕНО`);

          // Скриншот всей страницы для отладки
          await page.screenshot({
            path: join(OUTPUT_DIR, `${testName}-NO-LOGO.png`),
            fullPage: false
          });
          continue;
        }

        // Проверка 2: Получить размеры и позицию
        const box = await logo.boundingBox();

        if (!box) {
          issues.push({
            severity: 'HIGH',
            breakpoint: bp.name,
            page: pageInfo.name,
            issue: 'Лого не имеет bounding box (невидимо)',
            description: 'Элемент существует в DOM, но не отображается'
          });
          console.log(`  ⚠️  ${pageInfo.name}: Лого невидимо`);
          continue;
        }

        // Скриншот header с лого (до скролла)
        const header = page.locator('header').first();
        await header.screenshot({
          path: join(OUTPUT_DIR, `${testName}-header.png`)
        });

        // Проверка 3: Скролл-тест (проверить что лого не "плавает")
        const initialY = box.y;
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(300);

        const boxAfterScroll = await logo.boundingBox();

        if (boxAfterScroll) {
          const deltaY = Math.abs(initialY - boxAfterScroll.y);

          if (deltaY > 5) {
            issues.push({
              severity: 'MEDIUM',
              breakpoint: bp.name,
              page: pageInfo.name,
              issue: `Лого "плавает" при скролле (сдвиг: ${Math.round(deltaY)}px)`,
              description: 'Позиция лого изменилась при прокрутке страницы'
            });

            console.log(`  ⚠️  ${pageInfo.name}: Плавает при скролле (Δ${Math.round(deltaY)}px)`);

            // Скриншот после скролла
            await header.screenshot({
              path: join(OUTPUT_DIR, `${testName}-header-SCROLL-ISSUE.png`)
            });
          } else {
            console.log(`  ✅ ${pageInfo.name}: OK (${Math.round(box.width)}x${Math.round(box.height)}px, позиция стабильна)`);
            passedChecks++;

            results.push({
              breakpoint: bp.name,
              page: pageInfo.name,
              status: 'PASS',
              width: Math.round(box.width),
              height: Math.round(box.height),
              x: Math.round(box.x),
              y: Math.round(box.y)
            });
          }
        }

        // Вернуться наверх
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(200);

      } catch (error) {
        issues.push({
          severity: 'HIGH',
          breakpoint: bp.name,
          page: pageInfo.name,
          issue: 'Ошибка при тестировании',
          description: error.message
        });
        console.log(`  ❌ ${pageInfo.name}: ${error.message}`);

        try {
          await page.screenshot({
            path: join(OUTPUT_DIR, `${testName}-ERROR.png`)
          });
        } catch (screenshotError) {
          console.log(`     (не удалось сделать скриншот ошибки)`);
        }
      }
    }

    await page.close();
  }

  await browser.close();

  // Генерация отчёта
  console.log('\n' + '━'.repeat(60));
  console.log('📊 ИТОГИ ТЕСТИРОВАНИЯ\n');

  const passRate = ((passedChecks / totalChecks) * 100).toFixed(1);
  console.log(`Всего проверок: ${totalChecks}`);
  console.log(`Пройдено: ${passedChecks} (${passRate}%)`);
  console.log(`Проблем найдено: ${issues.length}\n`);

  if (issues.length === 0) {
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Layout лого корректен на всех страницах.');
  } else {
    console.log('⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ:\n');

    // Группировка по severity
    const critical = issues.filter(i => i.severity === 'CRITICAL');
    const high = issues.filter(i => i.severity === 'HIGH');
    const medium = issues.filter(i => i.severity === 'MEDIUM');

    if (critical.length > 0) {
      console.log(`\n🔴 КРИТИЧЕСКИЕ (${critical.length}):`);
      critical.forEach(i => {
        console.log(`   • [${i.breakpoint}] ${i.page}: ${i.issue}`);
      });
    }

    if (high.length > 0) {
      console.log(`\n🟠 ВЫСОКИЙ ПРИОРИТЕТ (${high.length}):`);
      high.forEach(i => {
        console.log(`   • [${i.breakpoint}] ${i.page}: ${i.issue}`);
      });
    }

    if (medium.length > 0) {
      console.log(`\n🟡 СРЕДНИЙ ПРИОРИТЕТ (${medium.length}):`);
      medium.forEach(i => {
        console.log(`   • [${i.breakpoint}] ${i.page}: ${i.issue}`);
      });
    }
  }

  console.log('\n📸 Скриншоты сохранены: ' + OUTPUT_DIR);

  // Сохранить детальный отчёт в Markdown
  const reportContent = generateMarkdownReport(totalChecks, passedChecks, issues, results);
  const reportPath = join(OUTPUT_DIR, '_REPORT.md');
  writeFileSync(reportPath, reportContent);
  console.log('📋 Отчёт сохранён: ' + reportPath);

  // Сохранить JSON для автоматической обработки
  const jsonReport = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalChecks,
      passed: passedChecks,
      failed: totalChecks - passedChecks,
      passRate: `${passRate}%`
    },
    issues,
    results
  };

  writeFileSync(
    join(OUTPUT_DIR, '_results.json'),
    JSON.stringify(jsonReport, null, 2)
  );

  console.log('\n' + '━'.repeat(60));

  // Код возврата для CI/CD
  process.exit(issues.filter(i => i.severity === 'CRITICAL').length > 0 ? 1 : 0);
})();

function generateMarkdownReport(total, passed, issues, results) {
  const timestamp = new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  let md = `# С-1: Отчёт о проверке Layout Лого

**Дата:** ${timestamp}
**Всего проверок:** ${total}
**Пройдено:** ${passed} (${((passed/total)*100).toFixed(1)}%)
**Проблем найдено:** ${issues.length}

---

## 📋 Краткая сводка

`;

  if (issues.length === 0) {
    md += `✅ **ВСЕ ТЕСТЫ ПРОЙДЕНЫ**

Layout лого корректен на всех страницах и всех breakpoints.

`;
  } else {
    const critical = issues.filter(i => i.severity === 'CRITICAL').length;
    const high = issues.filter(i => i.severity === 'HIGH').length;
    const medium = issues.filter(i => i.severity === 'MEDIUM').length;

    md += `⚠️ **ОБНАРУЖЕНЫ ПРОБЛЕМЫ**

- 🔴 Критические: ${critical}
- 🟠 Высокий приоритет: ${high}
- 🟡 Средний приоритет: ${medium}

`;
  }

  md += `---

## 📊 Детальные результаты

### Успешные проверки

`;

  if (results.length > 0) {
    md += `| Breakpoint | Страница | Размер лого | Позиция (x, y) |
|------------|----------|-------------|----------------|
`;
    results.forEach(r => {
      md += `| ${r.breakpoint} | ${r.page} | ${r.width}×${r.height}px | (${r.x}, ${r.y}) |\n`;
    });
  } else {
    md += `_Успешных проверок нет._\n`;
  }

  if (issues.length > 0) {
    md += `\n### Обнаруженные проблемы

`;

    ['CRITICAL', 'HIGH', 'MEDIUM'].forEach(severity => {
      const filtered = issues.filter(i => i.severity === severity);
      if (filtered.length === 0) return;

      const icon = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : '🟡';
      md += `#### ${icon} ${severity}\n\n`;

      filtered.forEach(issue => {
        md += `**[${issue.breakpoint}] ${issue.page}**
- **Проблема:** ${issue.issue}
- **Описание:** ${issue.description}
- **Скриншот:** \`${issue.breakpoint}-${issue.page}-*.png\`

`;
      });
    });
  }

  md += `---

## 🔍 Скриншоты

Все скриншоты сохранены в директории: \`${OUTPUT_DIR}\`

### Формат имён файлов:

- \`{breakpoint}-{page}-header.png\` — нормальное состояние
- \`{breakpoint}-{page}-SCROLL-ISSUE.png\` — проблема при скролле
- \`{breakpoint}-{page}-NO-LOGO.png\` — лого отсутствует
- \`{breakpoint}-{page}-ERROR.png\` — ошибка тестирования

---

## ✅ Следующие шаги

`;

  if (issues.length === 0) {
    md += `1. ✅ Все проверки пройдены
2. Сохранить текущие скриншоты как референсы
3. Настроить автоматическую pixel-diff проверку в CI/CD
`;
  } else {
    md += `1. Исправить критические и высокоприоритетные проблемы
2. Повторить тестирование: \`node smart-logo-check.mjs\`
3. После исправления — сохранить скриншоты как референсы
`;
  }

  md += `
---

_Автоматически сгенерировано скриптом smart-logo-check.mjs_
`;

  return md;
}
