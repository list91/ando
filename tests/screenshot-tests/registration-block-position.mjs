// П-5: Проверка блока предложения регистрации
// Проверяет наличие, позицию и видимость блока "Зарегистрируйтесь"

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Конфигурация
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = './test-results/registration-block';

const pages = [
  { name: 'catalog', url: '/catalog', description: 'Каталог', shouldShowForGuest: true },
  { name: 'cart', url: '/cart', description: 'Корзина', shouldShowForGuest: true },
  { name: 'favorites', url: '/favorites', description: 'Избранное', shouldShowForGuest: true }
];

// Возможные селекторы блока регистрации
const selectors = [
  'text=/зарегистр/i',
  '[class*="registration"]',
  '[class*="register"]',
  '[data-testid="registration-block"]',
  'text=/создайте.*аккаунт/i',
  'text=/войдите.*сохран/i'
];

const breakpoints = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'mobile', width: 375, height: 667 }
];

const issues = [];
const results = [];

console.log('📝 П-5: Проверка блока предложения регистрации\n');
console.log('━'.repeat(60));

(async () => {
  const browser = await chromium.launch({ headless: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  let totalChecks = 0;
  let passedChecks = 0;

  for (const bp of breakpoints) {
    console.log(`\n📱 ${bp.name.toUpperCase()} (${bp.width}x${bp.height})`);
    console.log('─'.repeat(60));

    // Тест 1: Проверка БЕЗ логина (гостевой режим)
    console.log('\n👤 ГОСТЕВОЙ РЕЖИМ (без авторизации)');

    const guestContext = await browser.newContext({
      viewport: { width: bp.width, height: bp.height }
    });
    const guestPage = await guestContext.newPage();

    for (const pageInfo of pages) {
      if (!pageInfo.shouldShowForGuest) continue;

      totalChecks++;
      const testName = `${bp.name}-guest-${pageInfo.name}`;

      try {
        await guestPage.goto(BASE_URL + pageInfo.url, {
          waitUntil: 'networkidle',
          timeout: 10000
        });

        await guestPage.waitForTimeout(2000);

        // Пытаемся найти блок регистрации
        let blockFound = false;
        let foundSelector = null;
        let locator = null;

        for (const selector of selectors) {
          locator = guestPage.locator(selector).first();
          if (await locator.count() > 0) {
            blockFound = true;
            foundSelector = selector;
            break;
          }
        }

        if (blockFound) {
          const box = await locator.boundingBox();

          if (box) {
            console.log(`  ✅ ${pageInfo.name}: Блок найден (Y=${Math.round(box.y)}px)`);
            passedChecks++;

            results.push({
              breakpoint: bp.name,
              page: pageInfo.name,
              mode: 'guest',
              status: 'PASS',
              found: true,
              position: { y: Math.round(box.y), height: Math.round(box.height) },
              selector: foundSelector
            });

            // Скриншот блока
            await locator.screenshot({
              path: join(OUTPUT_DIR, `${testName}-registration-block.png`),
              timeout: 3000
            });
          } else {
            issues.push({
              severity: 'MEDIUM',
              breakpoint: bp.name,
              page: pageInfo.name,
              mode: 'guest',
              issue: 'Блок найден но невидим',
              description: 'Блок регистрации существует в DOM но не отображается'
            });
            console.log(`  ⚠️  ${pageInfo.name}: Блок невидим`);
          }
        } else {
          issues.push({
            severity: 'HIGH',
            breakpoint: bp.name,
            page: pageInfo.name,
            mode: 'guest',
            issue: 'Блок регистрации не найден',
            description: 'Для гостей должен отображаться блок предложения регистрации'
          });
          console.log(`  ❌ ${pageInfo.name}: Блок НЕ НАЙДЕН (должен быть)`);

          await guestPage.screenshot({
            path: join(OUTPUT_DIR, `${testName}-NO-BLOCK.png`),
            fullPage: false
          });
        }

      } catch (error) {
        issues.push({
          severity: 'HIGH',
          breakpoint: bp.name,
          page: pageInfo.name,
          mode: 'guest',
          issue: 'Ошибка при проверке',
          description: error.message
        });
        console.log(`  ❌ ${pageInfo.name}: ${error.message}`);
      }
    }

    await guestContext.close();

    // Тест 2: Проверка С логином (блок НЕ должен показываться)
    console.log('\n🔐 АВТОРИЗОВАННЫЙ РЕЖИМ (с логином)');
    console.log('   (Блок регистрации НЕ должен отображаться)');

    const loggedInContext = await browser.newContext({
      viewport: { width: bp.width, height: bp.height }
    });
    const loggedInPage = await loggedInContext.newPage();

    // Симулируем авторизацию через localStorage
    await loggedInPage.goto(BASE_URL);
    await loggedInPage.evaluate(() => {
      // Имитация авторизованного пользователя
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'mock-user-id' }
      }));
    });

    for (const pageInfo of pages) {
      totalChecks++;
      const testName = `${bp.name}-logged-${pageInfo.name}`;

      try {
        await loggedInPage.goto(BASE_URL + pageInfo.url, {
          waitUntil: 'networkidle',
          timeout: 10000
        });

        await loggedInPage.waitForTimeout(2000);

        // Проверяем что блок НЕ отображается
        let blockFound = false;

        for (const selector of selectors) {
          const locator = loggedInPage.locator(selector).first();
          if (await locator.count() > 0 && await locator.isVisible()) {
            blockFound = true;
            break;
          }
        }

        if (blockFound) {
          issues.push({
            severity: 'MEDIUM',
            breakpoint: bp.name,
            page: pageInfo.name,
            mode: 'logged-in',
            issue: 'Блок регистрации показывается авторизованному пользователю',
            description: 'Блок не должен отображаться для залогиненных пользователей'
          });
          console.log(`  ⚠️  ${pageInfo.name}: Блок найден (НЕ должен быть)`);

          await loggedInPage.screenshot({
            path: join(OUTPUT_DIR, `${testName}-SHOULD-NOT-SHOW.png`),
            fullPage: false
          });
        } else {
          console.log(`  ✅ ${pageInfo.name}: Блок скрыт (OK)`);
          passedChecks++;

          results.push({
            breakpoint: bp.name,
            page: pageInfo.name,
            mode: 'logged-in',
            status: 'PASS',
            found: false
          });
        }

      } catch (error) {
        console.log(`  ⚠️  ${pageInfo.name}: ${error.message}`);
      }
    }

    await loggedInContext.close();
  }

  await browser.close();

  // Генерация отчёта
  console.log('\n' + '━'.repeat(60));
  console.log('📊 ИТОГИ ТЕСТИРОВАНИЯ\n');

  const passRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(1) : '0.0';
  console.log(`Всего проверок: ${totalChecks}`);
  console.log(`Пройдено: ${passedChecks} (${passRate}%)`);
  console.log(`Проблем найдено: ${issues.length}\n`);

  if (issues.length === 0) {
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Блок регистрации работает правильно.');
  } else {
    console.log('⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ:\n');

    const high = issues.filter(i => i.severity === 'HIGH');
    const medium = issues.filter(i => i.severity === 'MEDIUM');

    if (high.length > 0) {
      console.log(`\n🔴 ВЫСОКИЙ ПРИОРИТЕТ (${high.length}):`);
      high.forEach(i => {
        console.log(`   • [${i.breakpoint}/${i.mode}] ${i.page}: ${i.issue}`);
      });
    }

    if (medium.length > 0) {
      console.log(`\n🟡 СРЕДНИЙ ПРИОРИТЕТ (${medium.length}):`);
      medium.forEach(i => {
        console.log(`   • [${i.breakpoint}/${i.mode}] ${i.page}: ${i.issue}`);
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

  let md = `# П-5: Отчёт о проверке блока регистрации

**Дата:** ${timestamp}
**Всего проверок:** ${total}
**Пройдено:** ${passed} (${total > 0 ? ((passed/total)*100).toFixed(1) : '0.0'}%)
**Проблем найдено:** ${issues.length}

---

## 📋 Требования

- ✅ Гостям: блок "Зарегистрируйтесь" ДОЛЖЕН показываться
- ❌ Авторизованным: блок НЕ должен показываться

**Проверяемые страницы:** Каталог, Корзина, Избранное

---

## 📊 Результаты

`;

  if (issues.length === 0) {
    md += `✅ **ВСЕ ТЕСТЫ ПРОЙДЕНЫ**

Блок регистрации работает правильно.

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
    md += `### Детали проверок

| Breakpoint | Страница | Режим | Статус | Блок найден |
|------------|----------|-------|--------|-------------|
`;
    results.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : '❌';
      const foundText = r.found !== undefined ? (r.found ? 'Да' : 'Нет') : '—';
      md += `| ${r.breakpoint} | ${r.page} | ${r.mode} | ${icon} | ${foundText} |\n`;
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
        md += `**[${issue.breakpoint}/${issue.mode}] ${issue.page}**
- **Проблема:** ${issue.issue}
- **Описание:** ${issue.description}

`;
      });
    });
  }

  md += `---

_Автоматически сгенерировано скриптом registration-block-position.mjs_
`;

  return md;
}
