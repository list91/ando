import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    // Переходим на страницу каталога
    await page.goto('http://localhost:8083/catalog', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Ждем загрузки элементов
    await page.waitForSelector('section[aria-label="Список товаров"]', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Измеряем расстояние между панелью фильтров и галереей
    const measurement = await page.evaluate(() => {
      const filterPanel = document.querySelector('section[aria-label="Фильтры товаров"]');
      const gallery = document.querySelector('section[aria-label="Список товаров"]');

      if (!filterPanel || !gallery) {
        return { error: 'Elements not found', filterPanel: !!filterPanel, gallery: !!gallery };
      }

      const filterRect = filterPanel.getBoundingClientRect();
      const galleryRect = gallery.getBoundingClientRect();

      const gap = galleryRect.top - filterRect.bottom;
      const galleryPaddingTop = window.getComputedStyle(gallery).paddingTop;

      return {
        filterBottom: filterRect.bottom,
        galleryTop: galleryRect.top,
        gap: Math.round(gap),
        paddingTop: galleryPaddingTop,
        galleryPaddingTopPx: parseInt(galleryPaddingTop)
      };
    });

    console.log('📏 Измерения:', JSON.stringify(measurement, null, 2));

    // Делаем скриншот
    await page.screenshot({
      path: 'tests/screenshots/filter-panel-12px-gap.png',
      fullPage: false
    });

    console.log('✅ Скриншот сохранен: tests/screenshots/filter-panel-12px-gap.png');
    console.log(`📐 Расстояние между панелью и карточками: ${measurement.gap}px`);
    console.log(`📦 Padding-top галереи: ${measurement.paddingTop}`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await browser.close();
  }
})();
