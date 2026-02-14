// П-2: Проверка формы checkout (как у seebyme.ru)
// Проверяет структуру, порядок полей и отступы в форме оформления заказа

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Конфигурация
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = './test-results/checkout-form';

// Ожидаемая структура формы (как референс)
const expectedFields = [
  { type: 'input', label: /имя|name/i, order: 1 },
  { type: 'input', label: /телефон|phone/i, order: 2 },
  { type: 'input', label: /email|почта/i, order: 3 },
  { type: 'input', label: /адрес|address/i, order: 4 }
];

const breakpoints = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'mobile', width: 375, height: 667 }
];

const issues = [];
const results = [];

console.log('🛒 П-2: Проверка формы checkout\n');
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

    try {
      // Попытка перейти на страницу checkout
      await page.goto(BASE_URL + '/checkout', {
        waitUntil: 'networkidle',
        timeout: 10000
      });

      await page.waitForTimeout(2000);

      // Поиск формы
      const formSelectors = [
        'form',
        '[class*="checkout"]',
        '[class*="order"]',
        '[data-testid="checkout-form"]'
      ];

      let formFound = false;
      let formLocator = null;

      for (const selector of formSelectors) {
        formLocator = page.locator(selector).first();
        if (await formLocator.count() > 0) {
          formFound = true;
          console.log(`  📋 Форма найдена: ${selector}`);
          break;
        }
      }

      if (!formFound) {
        issues.push({
          severity: 'CRITICAL',
          breakpoint: bp.name,
          page: 'checkout',
          issue: 'Форма checkout не найдена',
          description: 'Не удалось найти форму оформления заказа на странице /checkout'
        });
        console.log(`  ❌ Форма НЕ НАЙДЕНА`);

        await page.screenshot({
          path: join(OUTPUT_DIR, `${bp.name}-NO-FORM.png`),
          fullPage: true
        });
        continue;
      }

      // Найти все поля формы
      const inputs = await formLocator.locator('input, select, textarea').all();
      console.log(`  📝 Найдено полей: ${inputs.length}`);

      if (inputs.length === 0) {
        issues.push({
          severity: 'CRITICAL',
          breakpoint: bp.name,
          page: 'checkout',
          issue: 'Форма пустая (нет полей)',
          description: 'Форма найдена, но не содержит input/select/textarea элементов'
        });
        console.log(`  ❌ Форма пустая`);
        continue;
      }

      // Проверка 1: Количество полей
      totalChecks++;
      if (inputs.length >= expectedFields.length) {
        console.log(`  ✅ Количество полей: ${inputs.length} (достаточно)`);
        passedChecks++;
      } else {
        issues.push({
          severity: 'HIGH',
          breakpoint: bp.name,
          page: 'checkout',
          issue: `Недостаточно полей (${inputs.length}, ожидалось ≥${expectedFields.length})`,
          description: 'Форма должна содержать минимум: имя, телефон, email, адрес'
        });
        console.log(`  ❌ Мало полей: ${inputs.length} (должно быть ≥${expectedFields.length})`);
      }

      // Проверка 2: Получить позиции всех полей
      const fieldsData = [];

      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const box = await input.boundingBox();

        if (box) {
          const placeholder = await input.getAttribute('placeholder');
          const name = await input.getAttribute('name');
          const type = await input.getAttribute('type');

          fieldsData.push({
            index: i,
            y: Math.round(box.y),
            height: Math.round(box.height),
            placeholder: placeholder || '',
            name: name || '',
            type: type || 'unknown'
          });
        }
      }

      console.log(`\n  📊 Позиции полей:`);
      fieldsData.forEach(f => {
        console.log(`     ${f.index + 1}. Y=${f.y}px (${f.placeholder || f.name || f.type})`);
      });

      // Проверка 3: Gaps (отступы между полями)
      totalChecks++;
      const gaps = [];

      for (let i = 0; i < fieldsData.length - 1; i++) {
        const current = fieldsData[i];
        const next = fieldsData[i + 1];
        const gap = next.y - (current.y + current.height);
        gaps.push(gap);
      }

      const minGap = 8; // Минимальный допустимый gap
      const maxGap = 50; // Максимальный разумный gap

      let gapsOk = true;
      gaps.forEach((gap, i) => {
        if (gap < minGap || gap > maxGap) {
          issues.push({
            severity: 'MEDIUM',
            breakpoint: bp.name,
            page: 'checkout',
            issue: `Неправильный gap между полями ${i + 1}-${i + 2}: ${gap}px`,
            description: `Gap должен быть в пределах ${minGap}-${maxGap}px`
          });
          console.log(`  ⚠️  Gap ${i + 1}→${i + 2}: ${gap}px (должно ${minGap}-${maxGap}px)`);
          gapsOk = false;
        }
      });

      if (gapsOk) {
        console.log(`  ✅ Отступы между полями: OK`);
        passedChecks++;
      }

      // Проверка 4: Кнопка отправки
      totalChecks++;
      const submitButton = formLocator.locator('button[type="submit"], button:has-text("Оформить"), button:has-text("Отправить")').first();

      if (await submitButton.count() > 0) {
        console.log(`  ✅ Кнопка отправки: найдена`);
        passedChecks++;

        const btnBox = await submitButton.boundingBox();
        if (btnBox) {
          fieldsData.push({
            index: fieldsData.length,
            y: Math.round(btnBox.y),
            height: Math.round(btnBox.height),
            placeholder: '',
            name: 'submit-button',
            type: 'button'
          });
        }
      } else {
        issues.push({
          severity: 'HIGH',
          breakpoint: bp.name,
          page: 'checkout',
          issue: 'Кнопка отправки не найдена',
          description: 'Форма должна содержать кнопку submit'
        });
        console.log(`  ❌ Кнопка отправки: НЕ НАЙДЕНА`);
      }

      // Скриншот формы
      await formLocator.screenshot({
        path: join(OUTPUT_DIR, `${bp.name}-form.png`),
        timeout: 5000
      });

      // Полный скриншот страницы
      await page.screenshot({
        path: join(OUTPUT_DIR, `${bp.name}-full.png`),
        fullPage: true
      });

      results.push({
        breakpoint: bp.name,
        status: issues.filter(i => i.breakpoint === bp.name && i.severity === 'CRITICAL').length === 0 ? 'PASS' : 'FAIL',
        fieldsCount: inputs.length,
        fieldsData
      });

    } catch (error) {
      issues.push({
        severity: 'CRITICAL',
        breakpoint: bp.name,
        page: 'checkout',
        issue: 'Ошибка при загрузке страницы',
        description: error.message
      });
      console.log(`  ❌ Ошибка: ${error.message}`);

      try {
        await page.screenshot({
          path: join(OUTPUT_DIR, `${bp.name}-ERROR.png`),
          fullPage: false
        });
      } catch (e) {
        console.log(`     (не удалось сделать скриншот)`);
      }
    }

    await page.close();
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
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Форма checkout корректна.');
  } else {
    console.log('⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ:\n');

    const critical = issues.filter(i => i.severity === 'CRITICAL');
    const high = issues.filter(i => i.severity === 'HIGH');
    const medium = issues.filter(i => i.severity === 'MEDIUM');

    if (critical.length > 0) {
      console.log(`\n🔴 КРИТИЧЕСКИЕ (${critical.length}):`);
      critical.forEach(i => {
        console.log(`   • [${i.breakpoint}] ${i.issue}`);
      });
    }

    if (high.length > 0) {
      console.log(`\n🟠 ВЫСОКИЙ ПРИОРИТЕТ (${high.length}):`);
      high.forEach(i => {
        console.log(`   • [${i.breakpoint}] ${i.issue}`);
      });
    }

    if (medium.length > 0) {
      console.log(`\n🟡 СРЕДНИЙ ПРИОРИТЕТ (${medium.length}):`);
      medium.forEach(i => {
        console.log(`   • [${i.breakpoint}] ${i.issue}`);
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

  process.exit(issues.filter(i => i.severity === 'CRITICAL').length > 0 ? 1 : 0);
})();

function generateMarkdownReport(total, passed, issues, results) {
  const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

  let md = `# П-2: Отчёт о проверке формы checkout

**Дата:** ${timestamp}
**Всего проверок:** ${total}
**Пройдено:** ${passed} (${total > 0 ? ((passed/total)*100).toFixed(1) : '0.0'}%)
**Проблем найдено:** ${issues.length}

---

## 📋 Требования

Форма checkout должна:
- Содержать минимум 4 поля: имя, телефон, email, адрес
- Иметь корректные отступы между полями (8-50px)
- Иметь кнопку отправки (submit)

---

## 📊 Результаты

`;

  if (issues.length === 0) {
    md += `✅ **ВСЕ ТЕСТЫ ПРОЙДЕНЫ**

Форма checkout соответствует требованиям.

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

  if (results.length > 0) {
    md += `### Детали формы

`;
    results.forEach(r => {
      md += `#### ${r.breakpoint.toUpperCase()}

- **Статус:** ${r.status === 'PASS' ? '✅' : '❌'}
- **Полей найдено:** ${r.fieldsCount}

`;
      if (r.fieldsData && r.fieldsData.length > 0) {
        md += `| № | Позиция Y | Высота | Тип | Описание |\n`;
        md += `|---|-----------|--------|-----|----------|\n`;
        r.fieldsData.forEach(f => {
          md += `| ${f.index + 1} | ${f.y}px | ${f.height}px | ${f.type} | ${f.placeholder || f.name || '—'} |\n`;
        });
        md += `\n`;
      }
    });
  }

  if (issues.length > 0) {
    md += `### Обнаруженные проблемы

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

`;
      });
    });
  }

  md += `---

_Автоматически сгенерировано скриптом checkout-form-layout.mjs_
`;

  return md;
}
