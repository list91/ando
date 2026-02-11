import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const MOBILE_VIEWPORT = { width: 390, height: 844 };

async function runMobileTest() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: MOBILE_VIEWPORT
  });

  try {
    console.log('\n=== ТЕСТ: Правки 4 - Мобильная версия (М-1) ===\n');

    await page.goto('http://localhost/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const measurements = await page.evaluate(() => {
      const result = {};
      
      // Лого
      const logo = document.querySelector('img[alt="ANDO JV"]');
      if (logo) {
        const rect = logo.getBoundingClientRect();
        result.logo = {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top)
        };
      }
      
      // Mobile header - ищем sticky div внутри flex контейнера
      const stickyDivs = document.querySelectorAll('div.sticky');
      for (const div of stickyDivs) {
        if (div.querySelector('img[alt="ANDO JV"]')) {
          const rect = div.getBoundingClientRect();
          const style = window.getComputedStyle(div);
          result.mobileHeader = {
            height: Math.round(rect.height),
            paddingTop: style.paddingTop,
            paddingBottom: style.paddingBottom
          };
          break;
        }
      }
      
      // Main content
      const main = document.querySelector('main');
      if (main) {
        const rect = main.getBoundingClientRect();
        result.mainContent = {
          top: Math.round(rect.top)
        };
      }
      
      // Bottom nav
      const bottomNav = document.querySelector('nav.fixed');
      if (bottomNav) {
        const rect = bottomNav.getBoundingClientRect();
        result.bottomNav = {
          height: Math.round(rect.height)
        };
      }
      
      return result;
    });

    console.log('Измерения:');
    console.log(JSON.stringify(measurements, null, 2));
    
    const screenshotDir = '/opt/ando/tests/screenshots/pravki-4';
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    await page.screenshot({ 
      path: screenshotDir + '/mobile-home.png', 
      fullPage: false 
    });
    
    console.log('Скриншот сохранён');
    return true;
    
  } catch (error) {
    console.error('Ошибка:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

runMobileTest().then(passed => {
  process.exit(passed ? 0 : 1);
});
