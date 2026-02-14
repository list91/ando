// М-1: Проверка позиции элементов в мобильной версии
// Проверяет что ключевые элементы "подняты" (находятся в верхней части экрана)

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Конфигурация
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = './test-results/mobile-elements-position';

const pages = [
  { name: 'home', url: '/', description: 'Главная страница' },
  { name: 'catalog', url: '/catalog', description: 'Каталог' },
  { name: 'product', url: '/catalog/test-coat-1', description: 'Страница товара' }
];

// Элементы для проверки (селектор + макс. допустимая Y-позиция)
const elementsToCheck = [
  {
    name: 'Mobile Header',
    selector: 'div.md\\:hidden:has(img[alt="ANDO JV"])', // Мобильный header с лого
    maxY: 80, // Должен быть в пределах 80px от верха
    description: 'Мобильный header с лого'
  },
  {
    name: 'Mobile Logo',
    selector: 'div.md\\:hidden img[alt="ANDO JV"]',
    maxY: 60,
    description: 'Лого в мобильном header'
  }
];

const issues = [];
const results = [];

console.log('📱 М-1: Проверка позиции элементов в мобильной версии\n');
console.log('━'.repeat(60));

(async () => {
  const browser = await chromium.launch({ headless: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Только mobile viewport
  const viewport = { width: 375, height: 667 };
  const page = await browser.newPage();
  await page.setViewportSize(viewport);

  let totalChecks = 0;
  let passedChecks = 0;

  console.log(`\n📱 MOBILE (${viewport.width}x${viewport.height})`);
  console.log('─'.repeat(60));

  for (const pageInfo of pages) {
    try {
      await page.goto(BASE_URL + pageInfo.url, {
        waitUntil: 'networkidle',
        timeout: 10000
      });

      console.log(`\n📄 ${pageInfo.description} (${pageInfo.url})`);

      for (const element of elementsToCheck) {
        totalChecks++;
        const testName = `mobile-${pageInfo.name}-${element.name.toLowerCase().replace(/\s+/g, '-')}`;

        try {
          const locator = page.locator(element.selector).first();
          const count = await locator.count();

          if (count === 0) {
            issues.push({
              severity: 'MEDIUM',
              page: pageInfo.name,
              element: element.name,
              issue: 'Элемент не найден',
              description: `Селектор ${element.selector} не вернул результатов`
            });
            console.log(`  ❌ ${element.name}: НЕ НАЙДЕН`);
            continue;
          }

          const box = await locator.boundingBox();

          if (!box) {
            issues.push({
              severity: 'MEDIUM',
              page: pageInfo.name,
              element: element.name,
              issue: 'Элемент невидим',
              description: 'Элемент существует но не имеет bounding box'
            });
            console.log(`  ⚠️  ${element.name}: Невидим`);
            continue;
          }

          // Проверка позиции
          if (box.y > element.maxY) {
            issues.push({
              severity: 'HIGH',
              page: pageInfo.name,
              element: element.name,
              issue: `Элемент слишком низко (Y=${Math.round(box.y)}px)`,
              description: `Элемент должен быть на Y ≤ ${element.maxY}px, но находится на ${Math.round(box.y)}px`
            });
            console.log(`  ❌ ${element.name}: Y=${Math.round(box.y)}px (должно быть ≤${element.maxY}px)`);

            // Скриншот проблемного места
            await page.screenshot({
              path: join(OUTPUT_DIR, `${testName}-TOO-LOW.png`),
              fullPage: false
            });
          } else {
            console.log(`  ✅ ${element.name}: Y=${Math.round(box.y)}px (OK, в пределах ${element.maxY}px)`);
            passedChecks++;

            results.push({
              page: pageInfo.name,
              element: element.name,
              status: 'PASS',
              actualY: Math.round(box.y),
              maxY: element.maxY
            });
          }

          // Скриншот элемента
          await locator.screenshot({
            path: join(OUTPUT_DIR, `${testName}-element.png`),
            timeout: 3000
          });

        } catch (error) {
          issues.push({
            severity: 'HIGH',
            page: pageInfo.name,
            element: element.name,
            issue: 'Ошибка при проверке',
            description: error.message
          });
          console.log(`  ❌ ${element.name}: ${error.message}`);
        }
      }

      // Общий скриншот страницы
      await page.screenshot({
        path: join(OUTPUT_DIR, `mobile-${pageInfo.name}-full.png`),
        fullPage: false
      });

    } catch (error) {
      console.log(`  ❌ ${pageInfo.name}: Ошибка загрузки - ${error.message}`);
    }
  }

  await page.close();
  await browser.close();

  // Генерация отчёта
  console.log('\n' + '━'.repeat(60));
  console.log('📊 ИТОГИ ТЕСТИРОВАНИЯ\n');

  const passRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(1) : '0.0';
  console.log(`Всего проверок: ${totalChecks}`);
  console.log(`Пройдено: ${passedChecks} (${passRate}%)`);
  console.log(`Проблем найдено: ${issues.length}\n`);

  if (issues.length === 0) {
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Элементы на правильных позициях.');
  } else {
    console.log('⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ:\n');

    const high = issues.filter(i => i.severity === 'HIGH');
    const medium = issues.filter(i => i.severity === 'MEDIUM');

    if (high.length > 0) {
      console.log(`\n🔴 ВЫСОКИЙ ПРИОРИТЕТ (${high.length}):`);
      high.forEach(i => {
        console.log(`   • [${i.page}] ${i.element}: ${i.issue}`);
      });
    }

    if (medium.length > 0) {
      console.log(`\n🟡 СРЕДНИЙ ПРИОРИТЕТ (${medium.length}):`);
      medium.forEach(i => {
        console.log(`   • [${i.page}] ${i.element}: ${i.issue}`);
      });
    }
  }

  console.log('\n📸 Скриншоты сохранены: ' + OUTPUT_DIR);

  // Сохранить отчёты
  const reportContent = generateMarkdownReport(totalChecks, passedChecks, issues, results);
  writeFileSync(join(OUTPUT_DIR, '_REPORT.md'), reportContent);
  console.log('📋 Отчёт сохранён: ' + join(OUTPUT_DIR, '_REPORT.md'));

  const jsonReport = {
    timestamp: new Date().toISOString(),
    summary: { total: totalChecks, passed: passedChecks, failed: totalChecks - passedChecks, passRate: `${passRate}%` },
    issues,
    results
  };
  writeFileSync(join(OUTPUT_DIR, '_results.json'), JSON.stringify(jsonReport, null, 2));

  console.log('\n' + '━'.repeat(60));

  process.exit(issues.filter(i => i.severity === 'HIGH').length > 0 ? 1 : 0);
})();

function generateMarkdownReport(total, passed, issues, results) {
  const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

  let md = `# М-1: Отчёт о проверке позиции элементов (Mobile)

**Дата:** ${timestamp}
**Всего проверок:** ${total}
**Пройдено:** ${passed} (${total > 0 ? ((passed/total)*100).toFixed(1) : '0.0'}%)
**Проблем найдено:** ${issues.length}

---

## 📋 Проверяемые элементы

`;

  elementsToCheck.forEach(el => {
    md += `- **${el.name}**: должен быть на Y ≤ ${el.maxY}px\n`;
  });

  md += `
---

## 📊 Результаты

`;

  if (issues.length === 0) {
    md += `✅ **ВСЕ ТЕСТЫ ПРОЙДЕНЫ**

Все элементы находятся на правильных позициях.

`;
  } else {
    const high = issues.filter(i => i.severity === 'HIGH').length;
    const medium = issues.filter(i => i.severity === 'MEDIUM').length;

    md += `⚠️ **ОБНАРУЖЕНЫ ПРОБЛЕМЫ**

- 🔴 Высокий приоритет: ${high}
- 🟡 Средний приоритет: ${medium}

`;
  }

  if (results.length > 0) {
    md += `### Успешные проверки

| Страница | Элемент | Позиция Y | Лимит |
|----------|---------|-----------|-------|
`;
    results.forEach(r => {
      md += `| ${r.page} | ${r.element} | ${r.actualY}px | ≤${r.maxY}px |\n`;
    });
    md += `\n`;
  }

  if (issues.length > 0) {
    md += `### Обнаруженные проблемы

`;

    ['HIGH', 'MEDIUM'].forEach(severity => {
      const filtered = issues.filter(i => i.severity === severity);
      if (filtered.length === 0) return;

      const icon = severity === 'HIGH' ? '🔴' : '🟡';
      md += `#### ${icon} ${severity}\n\n`;

      filtered.forEach(issue => {
        md += `**[${issue.page}] ${issue.element}**
- **Проблема:** ${issue.issue}
- **Описание:** ${issue.description}

`;
      });
    });
  }

  md += `---

_Автоматически сгенерировано скриптом mobile-elements-position.mjs_
`;

  return md;
}
