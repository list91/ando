import { test, expect } from '@playwright/test';

/**
 * ПРАВКА 2: Проверка скролла вниз на главной странице
 *
 * Требования:
 * - Главная страница должна иметь возможность скролла к каталогу "для неё"
 * - Стрелочка вниз должна работать (клик ведёт в каталог)
 * - Проверка на desktop и mobile (375px)
 */

const BASE_URL = 'http://localhost:8087';

test.describe('ПРАВКА 2: Скролл на главной странице', () => {

  test('Desktop: Проверка скролла и стрелки вниз', async ({ page }) => {
    // Устанавливаем desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Закрываем cookie banner если есть
    const acceptBtn = page.locator('button:has-text("Принять")');
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }

    console.log('=== DESKTOP: Проверка главной страницы ===');

    // Проверяем размеры страницы
    const pageInfo = await page.evaluate(() => ({
      pageHeight: document.body.scrollHeight,
      viewportHeight: window.innerHeight,
      scrollY: window.scrollY
    }));

    console.log('Высота страницы:', pageInfo.pageHeight);
    console.log('Высота viewport:', pageInfo.viewportHeight);
    console.log('Текущий scrollY:', pageInfo.scrollY);

    // Проверяем наличие стрелки вниз (ChevronDown)
    const scrollArrow = page.locator('button[aria-label="Прокрутить вниз"], button:has(svg.lucide-chevron-down)');
    const arrowVisible = await scrollArrow.first().isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Стрелка вниз видна:', arrowVisible);

    // Скриншот до клика
    await page.screenshot({
      path: 'tests/screenshots/verification/pravka-02-homepage-scroll-desktop.png',
      fullPage: false
    });

    // Проверяем что стрелка кликабельна
    if (arrowVisible) {
      const arrow = scrollArrow.first();
      await expect(arrow).toBeEnabled();

      // Кликаем на стрелку (force: true т.к. есть анимация bounce)
      await arrow.click({ force: true });
      await page.waitForTimeout(1500);

      // Проверяем URL после клика - должен перейти в каталог
      const currentUrl = page.url();
      console.log('URL после клика на стрелку:', currentUrl);

      // Ожидаем переход в каталог
      expect(currentUrl).toContain('/catalog');
      console.log('Стрелка ведёт в каталог: ДА');
    }

    // Проверяем свободный скролл на главной
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Пробуем скролл колесом мыши
    const initialScrollY = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);
    const afterWheelScrollY = await page.evaluate(() => window.scrollY);

    console.log('\n=== Проверка свободного скролла ===');
    console.log('ScrollY до wheel:', initialScrollY);
    console.log('ScrollY после wheel:', afterWheelScrollY);
    console.log('Свободный скролл работает:', afterWheelScrollY !== initialScrollY);

    // Проверяем CSS свойства скролла
    const scrollStyles = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const main = document.querySelector('main');
      return {
        htmlOverflow: getComputedStyle(html).overflow,
        bodyOverflow: getComputedStyle(body).overflow,
        mainOverflow: main ? getComputedStyle(main).overflow : 'N/A',
        htmlHeight: getComputedStyle(html).height,
        bodyHeight: getComputedStyle(body).height,
        mainHeight: main ? getComputedStyle(main).height : 'N/A'
      };
    });
    console.log('\nCSS стили:', JSON.stringify(scrollStyles, null, 2));
  });

  test('Mobile (375px): Проверка скролла и стрелки вниз', async ({ page }) => {
    // Устанавливаем mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Закрываем cookie banner если есть
    const acceptBtn = page.locator('button:has-text("Принять")');
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }

    console.log('=== MOBILE (375px): Проверка главной страницы ===');

    // Проверяем размеры страницы
    const pageInfo = await page.evaluate(() => ({
      pageHeight: document.body.scrollHeight,
      viewportHeight: window.innerHeight,
      scrollY: window.scrollY
    }));

    console.log('Высота страницы:', pageInfo.pageHeight);
    console.log('Высота viewport:', pageInfo.viewportHeight);
    console.log('Текущий scrollY:', pageInfo.scrollY);

    // Проверяем наличие стрелки вниз
    const scrollArrow = page.locator('button[aria-label="Прокрутить вниз"], button:has(svg.lucide-chevron-down)');
    const arrowVisible = await scrollArrow.first().isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Стрелка вниз видна:', arrowVisible);

    // Скриншот до клика
    await page.screenshot({
      path: 'tests/screenshots/verification/pravka-02-homepage-scroll-mobile.png',
      fullPage: false
    });

    // Проверяем что стрелка кликабельна на мобильной версии
    if (arrowVisible) {
      const arrow = scrollArrow.first();

      // Проверяем размер кнопки (должен быть минимум 44x44 для touch)
      const arrowBox = await arrow.boundingBox();
      if (arrowBox) {
        console.log('Размер кнопки стрелки:', arrowBox.width, 'x', arrowBox.height);
        const touchFriendly = arrowBox.width >= 44 && arrowBox.height >= 44;
        console.log('Touch-friendly (>= 44x44):', touchFriendly);
      }

      // Кликаем на стрелку (force: true т.к. есть анимация bounce)
      await arrow.click({ force: true });
      await page.waitForTimeout(1500);

      // Проверяем URL после клика
      const currentUrl = page.url();
      console.log('URL после клика на стрелку:', currentUrl);
      expect(currentUrl).toContain('/catalog');
      console.log('Стрелка ведёт в каталог: ДА');
    }

    // Проверяем touch-скролл (эмуляция)
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Эмулируем touch scroll
    const initialScrollY = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => {
      window.scrollBy(0, 300);
    });
    await page.waitForTimeout(500);
    const afterTouchScrollY = await page.evaluate(() => window.scrollY);

    console.log('\n=== Проверка touch-скролла ===');
    console.log('ScrollY до:', initialScrollY);
    console.log('ScrollY после:', afterTouchScrollY);
    console.log('Touch-скролл работает:', afterTouchScrollY !== initialScrollY);
  });

  test('Проверка навигации к каталогу "Для неё"', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('=== Проверка навигации к каталогу "Для неё" ===');

    // Ищем ссылку "Для неё" в навигации
    const forHerLink = page.locator('a:has-text("Для неё"), a:has-text("ДЛЯ НЕЁ")').first();
    const linkVisible = await forHerLink.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Ссылка "Для неё" видна:', linkVisible);

    if (linkVisible) {
      const href = await forHerLink.getAttribute('href');
      console.log('href ссылки:', href);

      await forHerLink.click();
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log('URL после клика:', currentUrl);

      // Проверяем что перешли на страницу каталога для женщин
      const isWomenCatalog = currentUrl.includes('catalog') &&
        (currentUrl.includes('women') || currentUrl.includes('female') || currentUrl.includes('category'));
      console.log('Открылся каталог:', isWomenCatalog || currentUrl.includes('catalog'));
    }
  });
});
