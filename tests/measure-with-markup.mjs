import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:8083/catalog', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await page.waitForSelector('section[aria-label="Список товаров"]', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Добавляем визуальную разметку для измерения
    const measurement = await page.evaluate(() => {
      const filterPanel = document.querySelector('section[aria-label="Фильтры товаров"]');
      const gallery = document.querySelector('section[aria-label="Список товаров"]');

      if (!filterPanel || !gallery) {
        return { error: 'Elements not found' };
      }

      // Создаем линию-маркер между панелью и галереей
      const marker = document.createElement('div');
      const filterRect = filterPanel.getBoundingClientRect();
      const galleryRect = gallery.getBoundingClientRect();

      marker.style.position = 'fixed';
      marker.style.left = '0';
      marker.style.right = '0';
      marker.style.top = `${filterRect.bottom}px`;
      marker.style.height = `${galleryRect.top - filterRect.bottom}px`;
      marker.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
      marker.style.border = '2px solid red';
      marker.style.zIndex = '9999';
      marker.style.pointerEvents = 'none';

      const label = document.createElement('div');
      label.textContent = `Gap: ${Math.round(galleryRect.top - filterRect.bottom)}px | Padding-top: ${window.getComputedStyle(gallery).paddingTop}`;
      label.style.position = 'fixed';
      label.style.left = '50%';
      label.style.transform = 'translateX(-50%)';
      label.style.top = `${filterRect.bottom + 5}px`;
      label.style.backgroundColor = 'rgba(255, 0, 0, 0.9)';
      label.style.color = 'white';
      label.style.padding = '4px 8px';
      label.style.fontSize = '14px';
      label.style.fontWeight = 'bold';
      label.style.borderRadius = '4px';
      label.style.zIndex = '10000';
      label.style.pointerEvents = 'none';

      document.body.appendChild(marker);
      document.body.appendChild(label);

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

    // Ждем немного для визуальной проверки
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.screenshot({
      path: 'tests/screenshots/filter-panel-12px-gap-marked.png',
      fullPage: false
    });

    console.log('✅ Скриншот с разметкой сохранен: tests/screenshots/filter-panel-12px-gap-marked.png');
    console.log(`📐 Расстояние между панелью фильтров (нижний край) и галереей (верхний край): ${measurement.gap}px`);
    console.log(`📦 Padding-top галереи: ${measurement.paddingTop}`);
    console.log(`\n✨ Результат: Верхний отступ галереи составляет ${measurement.galleryPaddingTopPx}px (ожидаемое значение: 12px)`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await browser.close();
  }
})();
