import { test, expect } from '@playwright/test';

/**
 * ПРАВКИ 4-5: ЛУКБУК фото и стрелка
 * - ПРАВКА 4: Проверка отступа между заголовком и фото
 * - ПРАВКА 5: Проверка цвета стрелки при клике (должна становиться красной)
 */

test.describe('ПРАВКИ 4-5: ЛУКБУК', () => {
  test.use({ baseURL: 'http://localhost:8087' });

  test('ПРАВКА 4-5: Отступ заголовок-фото и цвет стрелки при клике', async ({ page }) => {
    // 1. Открываем раздел ЛУКБУК
    await page.goto('/lookbook');
    await page.waitForLoadState('networkidle');

    // Ждем загрузки лукбуков
    await page.waitForTimeout(2000);

    // 2. Выбираем первый доступный лукбук
    const lookbookLink = page.locator('a[href^="/lookbook/"]').first();
    await expect(lookbookLink).toBeVisible({ timeout: 10000 });
    await lookbookLink.click();

    // Ждем загрузки страницы лукбука
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // ===== ПРАВКА 4: Отступ между заголовком и фото =====
    console.log('\n=== ПРАВКА 4: Проверка отступа между заголовком и фото ===');

    // Находим заголовок (h1)
    const titleElement = page.locator('h1').first();
    const hasTitleVisible = await titleElement.isVisible().catch(() => false);

    let spacingInfo = '';

    if (hasTitleVisible) {
      // Получаем координаты заголовка
      const titleBox = await titleElement.boundingBox();

      // Находим контейнер с фото
      const photoContainer = page.locator('.grid.grid-cols-2').first();
      const hasPhotoContainer = await photoContainer.isVisible().catch(() => false);

      if (hasPhotoContainer && titleBox) {
        const photoBox = await photoContainer.boundingBox();

        if (photoBox) {
          // Вычисляем отступ между низом заголовка и верхом фото
          const spacing = photoBox.y - (titleBox.y + titleBox.height);
          spacingInfo = `Отступ между заголовком и фото: ${spacing.toFixed(0)}px`;
          console.log(spacingInfo);
          console.log(`  - Заголовок: y=${titleBox.y}, height=${titleBox.height}`);
          console.log(`  - Фото контейнер: y=${photoBox.y}`);
        }
      }
    } else {
      spacingInfo = 'Заголовок не найден на странице';
      console.log(spacingInfo);
    }

    // Делаем скриншот области с заголовком и фото
    await page.screenshot({
      path: 'tests/screenshots/verification/pravka-04-lookbook-spacing.png',
      fullPage: false
    });
    console.log('Скриншот сохранен: pravka-04-lookbook-spacing.png');

    // ===== ПРАВКА 5: Цвет стрелки при клике =====
    console.log('\n=== ПРАВКА 5: Проверка цвета стрелки при клике ===');

    // Находим стрелку вправо (для навигации по фото)
    const rightArrow = page.locator('button').filter({ has: page.locator('svg.lucide-arrow-right') });
    const hasRightArrow = await rightArrow.isVisible().catch(() => false);

    let arrowColorInfo = '';

    if (hasRightArrow) {
      // Получаем начальный цвет стрелки
      const initialStyles = await rightArrow.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        const svg = el.querySelector('svg');
        const svgColor = svg ? window.getComputedStyle(svg).color : 'N/A';
        return {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          color: computed.color,
          svgColor: svgColor
        };
      });
      console.log('Начальные стили стрелки:', JSON.stringify(initialStyles, null, 2));

      // Кликаем на стрелку
      await rightArrow.click();
      await page.waitForTimeout(500);

      // Получаем цвет после клика (в состоянии active/focus)
      const afterClickStyles = await rightArrow.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        const svg = el.querySelector('svg');
        const svgColor = svg ? window.getComputedStyle(svg).color : 'N/A';
        return {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          color: computed.color,
          svgColor: svgColor
        };
      });
      console.log('Стили стрелки после клика:', JSON.stringify(afterClickStyles, null, 2));

      // Проверяем, есть ли красный цвет в каком-либо из стилей
      const isRed = (color: string) => {
        return color.includes('255, 0, 0') ||
               color.includes('rgb(255,') ||
               color.includes('red') ||
               color.includes('220, 38, 38') || // Tailwind red-600
               color.includes('239, 68, 68') ||  // Tailwind red-500
               color.includes('185, 28, 28');    // Tailwind red-700
      };

      const hasRedColor = isRed(afterClickStyles.backgroundColor) ||
                          isRed(afterClickStyles.borderColor) ||
                          isRed(afterClickStyles.color) ||
                          isRed(afterClickStyles.svgColor);

      arrowColorInfo = hasRedColor
        ? 'Стрелка СТАНОВИТСЯ КРАСНОЙ при клике'
        : `Стрелка НЕ становится красной. Цвет: ${afterClickStyles.color}, фон: ${afterClickStyles.backgroundColor}`;
      console.log(arrowColorInfo);

    } else {
      // Пробуем найти любую кнопку с ArrowRight
      const anyArrowButton = page.locator('button:has(svg[class*="arrow"])').first();
      const hasAnyArrow = await anyArrowButton.isVisible().catch(() => false);

      if (hasAnyArrow) {
        arrowColorInfo = 'Найдена стрелка, но с другим селектором';
        console.log(arrowColorInfo);

        await anyArrowButton.click();
        await page.waitForTimeout(500);
      } else {
        arrowColorInfo = 'Стрелка навигации не найдена (возможно, только одна страница фото)';
        console.log(arrowColorInfo);
      }
    }

    // Делаем скриншот с активной стрелкой
    await page.screenshot({
      path: 'tests/screenshots/verification/pravka-05-lookbook-arrow-active.png',
      fullPage: false
    });
    console.log('Скриншот сохранен: pravka-05-lookbook-arrow-active.png');

    // Итоговый вывод
    console.log('\n========================================');
    console.log('ИТОГОВЫЙ АНАЛИЗ:');
    console.log('========================================');
    console.log('ПРАВКА 4 (отступ):', spacingInfo);
    console.log('ПРАВКА 5 (стрелка):', arrowColorInfo);
    console.log('========================================\n');
  });
});
