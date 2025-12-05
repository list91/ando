import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Desktop viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:8081/catalog');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Скриншот полной страницы
  await page.screenshot({
    path: 'C:/Users/Дарья/qq/ando/tests/screenshots/filter-panel-35px-fix.png',
    fullPage: false
  });

  console.log('✅ Скриншот сохранён: tests/screenshots/filter-panel-35px-fix.png');

  // Измерить позицию панели фильтров
  const filterPanel = page.locator('section[aria-label="Фильтры товаров"]');
  const box = await filterPanel.boundingBox();
  console.log('Позиция панели фильтров:', JSON.stringify(box));

  await browser.close();
})();
