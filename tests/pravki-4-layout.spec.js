import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ТРЕБОВАНИЯ из ТЗ С-1:
// - Лого: уменьшить
// - Серая полоска (sidebar): уменьшить ширину пропорционально
// - Лого: отцентровать относительно серой полосы
// - Левый и правый блоки: по одной линии
// - Элементы НЕ должны плавать

const EXPECTED = {
  logo: {
    maxWidth: 280, // уменьшенный лого
    minWidth: 200,
  },
  sidebar: {
    maxWidth: 280, // уменьшенная серая полоска
    minWidth: 220,
  },
  alignment: {
    tolerance: 10, // допустимое отклонение в px
  }
};

async function runLayoutTest() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  const results = {
    passed: [],
    failed: [],
    measurements: {}
  };

  try {
    console.log('\n=== ТЕСТ: Правки 4 - Layout (С-1) ===\n');

    // Тестируем все страницы
    const pages = [
      { url: 'http://localhost/catalog?gender=women', name: 'Женское' },
      { url: 'http://localhost/catalog?gender=men', name: 'Мужское' },
      { url: 'http://localhost/lookbook', name: 'Лукбук' },
      { url: 'http://localhost/info', name: 'Инфо' },
      { url: 'http://localhost/', name: 'Главная' },
    ];

    for (const p of pages) {
      console.log(`\nПроверка страницы: ${p.name}`);
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Измеряем элементы
      const measurements = await page.evaluate(() => {
        const result = {};
        
        // 1. Лого
        const logo = document.querySelector('aside img[alt*="ANDO"], aside img[src*="logo"]');
        if (logo) {
          const rect = logo.getBoundingClientRect();
          result.logo = {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            left: Math.round(rect.left),
            top: Math.round(rect.top)
          };
        }
        
        // 2. Sidebar (серая полоска)
        const sidebar = document.querySelector('aside');
        if (sidebar) {
          const rect = sidebar.getBoundingClientRect();
          result.sidebar = {
            width: Math.round(rect.width),
            left: Math.round(rect.left)
          };
        }
        
        // 3. Главный контент (правый блок)
        const main = document.querySelector('main, [role="main"], .flex-1');
        if (main) {
          const rect = main.getBoundingClientRect();
          result.mainContent = {
            left: Math.round(rect.left),
            top: Math.round(rect.top)
          };
        }
        
        // 4. Header (левый блок с навигацией)
        const header = document.querySelector('header');
        if (header) {
          const rect = header.getBoundingClientRect();
          result.header = {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            height: Math.round(rect.height)
          };
        }
        
        // 5. Центрирование лого относительно sidebar
        if (result.logo && result.sidebar) {
          const sidebarCenter = result.sidebar.left + result.sidebar.width / 2;
          const logoCenter = result.logo.left + result.logo.width / 2;
          result.logoCentering = {
            sidebarCenter: Math.round(sidebarCenter),
            logoCenter: Math.round(logoCenter),
            offset: Math.round(Math.abs(sidebarCenter - logoCenter))
          };
        }
        
        return result;
      });

      results.measurements[p.name] = measurements;
      
      // Проверки
      if (measurements.logo) {
        const logoOk = measurements.logo.width <= EXPECTED.logo.maxWidth;
        if (logoOk) {
          results.passed.push(`[${p.name}] Лого: ${measurements.logo.width}px <= ${EXPECTED.logo.maxWidth}px ✓`);
        } else {
          results.failed.push(`[${p.name}] Лого: ${measurements.logo.width}px > ${EXPECTED.logo.maxWidth}px ✗`);
        }
      }
      
      if (measurements.sidebar) {
        const sidebarOk = measurements.sidebar.width <= EXPECTED.sidebar.maxWidth;
        if (sidebarOk) {
          results.passed.push(`[${p.name}] Sidebar: ${measurements.sidebar.width}px <= ${EXPECTED.sidebar.maxWidth}px ✓`);
        } else {
          results.failed.push(`[${p.name}] Sidebar: ${measurements.sidebar.width}px > ${EXPECTED.sidebar.maxWidth}px ✗`);
        }
      }
      
      if (measurements.logoCentering) {
        const centerOk = measurements.logoCentering.offset <= EXPECTED.alignment.tolerance;
        if (centerOk) {
          results.passed.push(`[${p.name}] Центрирование лого: offset ${measurements.logoCentering.offset}px ✓`);
        } else {
          results.failed.push(`[${p.name}] Центрирование лого: offset ${measurements.logoCentering.offset}px > ${EXPECTED.alignment.tolerance}px ✗`);
        }
      }

      // Скриншот
      const screenshotDir = '/opt/ando/tests/screenshots/pravki-4';
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      await page.screenshot({ 
        path: `${screenshotDir}/${p.name.toLowerCase().replace(/ /g, '-')}.png`, 
        fullPage: false 
      });
    }

    // Итог
    console.log('\n=== РЕЗУЛЬТАТЫ ===');
    console.log(`\nПройдено: ${results.passed.length}`);
    results.passed.forEach(r => console.log(`  ${r}`));
    
    console.log(`\nНе пройдено: ${results.failed.length}`);
    results.failed.forEach(r => console.log(`  ${r}`));
    
    console.log('\n=== ИЗМЕРЕНИЯ (JSON) ===');
    console.log(JSON.stringify(results.measurements, null, 2));
    
    return results.failed.length === 0;
    
  } catch (error) {
    console.error('Ошибка теста:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

runLayoutTest().then(passed => {
  process.exit(passed ? 0 : 1);
});
