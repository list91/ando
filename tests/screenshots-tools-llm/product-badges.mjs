// СМ-1: Проверка бейджей товаров (% и НОВОЕ вместо SALE и NEW)
// Автоматическая проверка локализации бейджей на карточках товаров

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Конфигурация
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = './test-results/product-badges';

const pages = [
  { name: 'catalog-women', url: '/catalog?gender=women', description: 'Каталог женской одежды' },
  { name: 'catalog-men', url: '/catalog?gender=men', description: 'Каталог мужской одежды' },
  { name: 'sale', url: '/catalog?gender=women', category: 'SALE', description: 'Страница распродажи' }
];

const breakpoints = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'mobile', width: 375, height: 667 }
];

// Массив для сбора проблем
const issues = [];
const results = [];

console.log('🏷️  СМ-1: Проверка бейджей товаров (% и НОВОЕ)\n');
console.log('━'.repeat(60));

(async () => {
  const browser = await chromium.launch({ headless: true });
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
        await page.goto(BASE_URL + pageInfo.url, {
          waitUntil: 'networkidle',
          timeout: 10000
        });

        // Ждём загрузки товаров
        await page.waitForTimeout(2000);

        // Найти все карточки товаров
        const productCards = page.locator('[class*="product"], [data-product-id], article, .card').all();
        const cardsCount = await (await productCards).length;

        if (cardsCount === 0) {
          issues.push({
            severity: 'MEDIUM',
            breakpoint: bp.name,
            page: pageInfo.name,
            issue: 'Товары не найдены на странице',
            description: 'Не удалось найти карточки товаров для проверки бейджей'
          });
          console.log(`  ⚠️  ${pageInfo.name}: Товары не найдены`);
          continue;
        }

        console.log(`  📦 ${pageInfo.name}: Найдено ${cardsCount} товаров`);

        // Проверка бейджей SALE и NEW
        const saleBadges = page.locator('text=/^SALE$/i').all();
        const newBadges = page.locator('text=/^NEW$/i').all();
        const percentBadges = page.locator('text=/^%$/').all();
        const novoeBadges = page.locator('text=/^НОВОЕ$/i').all();

        const saleCount = await (await saleBadges).length;
        const newCount = await (await newBadges).length;
        const percentCount = await (await percentBadges).length;
        const novoeCount = await (await novoeBadges).length;

        let pageHasIssues = false;

        // Проверка: Должны быть "%" вместо "SALE"
        if (saleCount > 0) {
          issues.push({
            severity: 'HIGH',
            breakpoint: bp.name,
            page: pageInfo.name,
            issue: `Найдено ${saleCount} бейджей "SALE" (должно быть "%")`,
            description: 'Бейджи распродажи должны отображаться как "%" (красный кружок), а не "SALE"'
          });
          console.log(`  ❌ ${pageInfo.name}: ${saleCount} бейджей "SALE" (должно быть "%")`);
          pageHasIssues = true;

          // Скриншот первого бейджа SALE
          const firstSale = page.locator('text=/^SALE$/i').first();
          if (await firstSale.count() > 0) {
            await firstSale.screenshot({
              path: join(OUTPUT_DIR, `${testName}-WRONG-SALE-badge.png`),
              timeout: 3000
            });
          }
        }

        // Проверка: Должны быть "НОВОЕ" вместо "NEW"
        if (newCount > 0) {
          issues.push({
            severity: 'HIGH',
            breakpoint: bp.name,
            page: pageInfo.name,
            issue: `Найдено ${newCount} бейджей "NEW" (должно быть "НОВОЕ")`,
            description: 'Бейджи новинок должны отображаться как "НОВОЕ" (русский текст), а не "NEW"'
          });
          console.log(`  ❌ ${pageInfo.name}: ${newCount} бейджей "NEW" (должно быть "НОВОЕ")`);
          pageHasIssues = true;

          // Скриншот первого бейджа NEW
          const firstNew = page.locator('text=/^NEW$/i').first();
          if (await firstNew.count() > 0) {
            await firstNew.screenshot({
              path: join(OUTPUT_DIR, `${testName}-WRONG-NEW-badge.png`),
              timeout: 3000
            });
          }
        }

        // Позитивные проверки
        if (percentCount > 0) {
          console.log(`  ✅ ${pageInfo.name}: Найдено ${percentCount} правильных бейджей "%"`);
        }

        if (novoeCount > 0) {
          console.log(`  ✅ ${pageInfo.name}: Найдено ${novoeCount} правильных бейджей "НОВОЕ"`);
        }

        if (!pageHasIssues && (percentCount > 0 || novoeCount > 0)) {
          passedChecks++;
          results.push({
            breakpoint: bp.name,
            page: pageInfo.name,
            status: 'PASS',
            percentBadges: percentCount,
            novoeBadges: novoeCount
          });
        } else if (!pageHasIssues) {
          console.log(`  ℹ️  ${pageInfo.name}: Бейджи не найдены (товары без SALE/NEW)`);
          passedChecks++;
        }

        // Общий скриншот каталога
        await page.screenshot({
          path: join(OUTPUT_DIR, `${testName}-catalog.png`),
          fullPage: false
        });

      } catch (error) {
        issues.push({
          severity: 'HIGH',
          breakpoint: bp.name,
          page: pageInfo.name,
          issue: 'Ошибка при тестировании',
          description: error.message
        });
        console.log(`  ❌ ${pageInfo.name}: ${error.message}`);
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
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Бейджи локализованы правильно.');
  } else {
    console.log('⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ:\n');

    const high = issues.filter(i => i.severity === 'HIGH');
    const medium = issues.filter(i => i.severity === 'MEDIUM');

    if (high.length > 0) {
      console.log(`\n🔴 ВЫСОКИЙ ПРИОРИТЕТ (${high.length}):`);
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

  // Сохранить отчёт
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

  let md = `# СМ-1: Отчёт о проверке бейджей товаров

**Дата:** ${timestamp}
**Всего проверок:** ${total}
**Пройдено:** ${passed} (${((passed/total)*100).toFixed(1)}%)
**Проблем найдено:** ${issues.length}

---

## 📋 Требования

Бейджи товаров должны быть локализованы:
- ❌ **"SALE"** → ✅ **"%"** (красный кружок)
- ❌ **"NEW"** → ✅ **"НОВОЕ"** (русский текст)

---

## 📊 Результаты

`;

  if (issues.length === 0) {
    md += `✅ **ВСЕ ТЕСТЫ ПРОЙДЕНЫ**

Все бейджи локализованы правильно.

`;
  } else {
    const high = issues.filter(i => i.severity === 'HIGH').length;
    const medium = issues.filter(i => i.severity === 'MEDIUM').length;

    md += `⚠️ **ОБНАРУЖЕНЫ ПРОБЛЕМЫ**

- 🔴 Высокий приоритет: ${high}
- 🟡 Средний приоритет: ${medium}

`;
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
        md += `**[${issue.breakpoint}] ${issue.page}**
- **Проблема:** ${issue.issue}
- **Описание:** ${issue.description}

`;
      });
    });
  }

  md += `---

## 🔍 Скриншоты

Все скриншоты сохранены в директории: \`${OUTPUT_DIR}\`

- \`*-catalog.png\` — общий вид каталога
- \`*-WRONG-SALE-badge.png\` — неправильный бейдж SALE
- \`*-WRONG-NEW-badge.png\` — неправильный бейдж NEW

---

_Автоматически сгенерировано скриптом product-badges.mjs_
`;

  return md;
}
