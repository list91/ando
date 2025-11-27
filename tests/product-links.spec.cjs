const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  // Создаем директорию для скриншотов
  const screenshotsDir = path.join(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Запускаем браузер с headless=false
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100, // Небольшая задержка для визуализации
    args: ['--start-maximized'] // Запускаем на весь экран
  });

  const context = await browser.newContext({
    viewport: null, // Null для использования размера окна браузера
    screen: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    console.log('=== ТЕСТ: Проверка ссылок в карточке товара ===\n');

    // 1. Открываем каталог, чтобы найти товар
    console.log('1. Открываем каталог...');
    await page.goto('https://andojv.com/catalog', {
      waitUntil: 'networkidle',
      timeout: 60000  // Увеличиваем таймаут до 60 секунд
    });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotsDir, 'product-01-catalog.png'),
      fullPage: true
    });
    console.log('✓ Скриншот каталога сохранен');

    // Закрываем cookie banner если он есть
    const cookieBanner = await page.locator('text=Принять').first();
    if (await cookieBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✓ Закрываем cookie banner...');
      await cookieBanner.click();
      await page.waitForTimeout(300);
    }
    console.log();

    // 2. Кликаем на первый товар
    console.log('2. Открываем первый товар...');
    const firstProduct = await page.locator('a[href^="/product/"]').first();
    await firstProduct.click();
    await page.waitForTimeout(500);

    const productUrl = page.url();
    console.log(`   Открыт товар: ${productUrl}`);

    await page.screenshot({
      path: path.join(screenshotsDir, 'product-02-product-page.png'),
      fullPage: true
    });
    console.log('✓ Скриншот страницы товара сохранен\n');

    // 3. Проверяем ссылку "Информация о размерах товара"
    console.log('3. Проверяем ссылку "Информация о размерах"...');
    const sizeInfoLink = await page.locator('text=Информация о размерах товара');

    if (await sizeInfoLink.isVisible()) {
      console.log('✓ Ссылка "Информация о размерах" найдена');

      // Скриншот ссылки
      await sizeInfoLink.screenshot({
        path: path.join(screenshotsDir, 'product-03-size-info-link.png')
      });

      // Кликаем и проверяем URL
      await sizeInfoLink.click();
      await page.waitForTimeout(500);

      const currentUrl = page.url();
      console.log(`   Текущий URL: ${currentUrl}`);

      await page.screenshot({
        path: path.join(screenshotsDir, 'product-04-size-guide-page.png'),
        fullPage: true
      });

      // Проверяем URL и содержимое
      if (currentUrl.includes('/info') && currentUrl.includes('section=size-guide')) {
        console.log('✓ URL содержит /info?section=size-guide');
        testsPassed++;
      } else {
        console.log('✗ URL НЕ содержит /info?section=size-guide');
        console.log(`   Ожидалось: /info?section=size-guide`);
        console.log(`   Получено: ${currentUrl}`);
        testsFailed++;
      }

      const pageContent = await page.textContent('body');
      if (pageContent.includes('Гид по размерам') || pageContent.includes('РАЗМЕРЫ')) {
        console.log('✓ Страница содержит "Гид по размерам"\n');
        testsPassed++;
      } else {
        console.log('✗ Страница НЕ содержит "Гид по размерам"\n');
        testsFailed++;
      }

      // Возвращаемся на страницу товара
      await page.goBack();
      await page.waitForTimeout(500);

      // Закрываем cookie banner если появился
      const cookieBanner2 = await page.locator('text=Принять').first();
      if (await cookieBanner2.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cookieBanner2.click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log('✗ Ссылка "Информация о размерах" НЕ найдена\n');
      testsFailed++;
    }

    // 4. Раскрываем секцию ДОСТАВКА и проверяем ссылку
    console.log('4. Проверяем ссылку в секции ДОСТАВКА...');
    const deliverySection = await page.locator('text=ДОСТАВКА').first();

    if (await deliverySection.isVisible()) {
      console.log('✓ Секция ДОСТАВКА найдена');

      // Кликаем для раскрытия
      await deliverySection.click();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: path.join(screenshotsDir, 'product-05-delivery-section-open.png'),
        fullPage: true
      });

      // Ищем ссылку "Подробнее на странице Оплата и доставка"
      const deliveryLink = await page.locator('text=Подробнее на странице Оплата и доставка').first();

      if (await deliveryLink.isVisible()) {
        console.log('✓ Ссылка "Подробнее на странице Оплата и доставка" найдена в секции ДОСТАВКА');

        await deliveryLink.click();
        await page.waitForTimeout(500);

        const currentUrl = page.url();
        console.log(`   Текущий URL: ${currentUrl}`);

        await page.screenshot({
          path: path.join(screenshotsDir, 'product-06-delivery-page.png'),
          fullPage: true
        });

        if (currentUrl.includes('/info') && currentUrl.includes('section=delivery')) {
          console.log('✓ URL содержит /info?section=delivery');
          testsPassed++;
        } else {
          console.log('✗ URL НЕ содержит /info?section=delivery');
          console.log(`   Ожидалось: /info?section=delivery`);
          console.log(`   Получено: ${currentUrl}`);
          testsFailed++;
        }

        const pageContent = await page.textContent('body');
        const lowerContent = pageContent.toLowerCase();
        if (lowerContent.includes('доставка') && (lowerContent.includes('оплата') || lowerContent.includes('покупател'))) {
          console.log('✓ Страница содержит информацию о доставке и оплате\n');
          testsPassed++;
        } else {
          console.log('✗ Страница НЕ содержит ожидаемый раздел\n');
          testsFailed++;
        }

        // Возвращаемся на страницу товара
        await page.goBack();
        await page.waitForTimeout(500);

        // Закрываем cookie banner если появился
        const cookieBanner3 = await page.locator('text=Принять').first();
        if (await cookieBanner3.isVisible({ timeout: 1000 }).catch(() => false)) {
          await cookieBanner3.click();
          await page.waitForTimeout(500);
        }
      } else {
        console.log('✗ Ссылка НЕ найдена в секции ДОСТАВКА\n');
        testsFailed++;
      }
    } else {
      console.log('✗ Секция ДОСТАВКА НЕ найдена\n');
      testsFailed++;
    }

    // 5. Раскрываем секцию ОПЛАТА и проверяем ссылку
    console.log('5. Проверяем ссылку в секции ОПЛАТА...');
    const paymentSection = await page.locator('text=ОПЛАТА').first();

    if (await paymentSection.isVisible()) {
      console.log('✓ Секция ОПЛАТА найдена');

      // Кликаем для раскрытия
      await paymentSection.click();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: path.join(screenshotsDir, 'product-07-payment-section-open.png'),
        fullPage: true
      });

      // Ищем ссылку "Подробнее на странице Оплата и доставка" внутри открытой секции ОПЛАТА
      // Используем более специфичный селектор для поиска видимой ссылки
      const paymentLink = await page.locator('text=Подробнее на странице Оплата и доставка').last();

      if (await paymentLink.isVisible()) {
        console.log('✓ Ссылка "Подробнее на странице Оплата и доставка" найдена в секции ОПЛАТА');

        // Кликаем на ссылку
        await paymentLink.click();
        await page.waitForTimeout(500);

        const currentUrl = page.url();
        console.log(`   Текущий URL: ${currentUrl}`);

        await page.screenshot({
          path: path.join(screenshotsDir, 'product-08-payment-page.png'),
          fullPage: true
        });

        if (currentUrl.includes('/info') && currentUrl.includes('section=delivery')) {
          console.log('✓ URL содержит /info?section=delivery');
          testsPassed++;
        } else {
          console.log('✗ URL НЕ содержит /info?section=delivery');
          console.log(`   Ожидалось: /info?section=delivery`);
          console.log(`   Получено: ${currentUrl}`);
          testsFailed++;
        }

        const pageContent = await page.textContent('body');
        const lowerContent = pageContent.toLowerCase();
        if (lowerContent.includes('доставка') && (lowerContent.includes('оплата') || lowerContent.includes('покупател'))) {
          console.log('✓ Страница содержит информацию о доставке и оплате\n');
          testsPassed++;
        } else {
          console.log('✗ Страница НЕ содержит ожидаемый раздел\n');
          testsFailed++;
        }
      } else {
        console.log('✗ Ссылка НЕ найдена в секции ОПЛАТА\n');
        testsFailed++;
      }
    } else {
      console.log('✗ Секция ОПЛАТА НЕ найдена\n');
      testsFailed++;
    }

    // Итоговый результат
    console.log('\n=== РЕЗУЛЬТАТ ТЕСТА ===');
    console.log(`Пройдено тестов: ${testsPassed}`);
    console.log(`Провалено тестов: ${testsFailed}`);
    console.log(`Общий результат: ${testsFailed === 0 ? '✓ УСПЕШНО' : '✗ ЕСТЬ ОШИБКИ'}`);
    console.log('\nВсе скриншоты сохранены в папку:', screenshotsDir);
    console.log('Проверьте скриншоты для детальной оценки результата.');

  } catch (error) {
    console.error('\n✗ Ошибка во время теста:', error);
    await page.screenshot({
      path: path.join(screenshotsDir, 'product-error-screenshot.png'),
      fullPage: true
    });
    testsFailed++;
  }

  console.log('\nТест завершен. Браузер закроется через 3 секунды...');
  await page.waitForTimeout(3000);
  await browser.close();

  // Выход с кодом ошибки если тесты провалились
  process.exit(testsFailed > 0 ? 1 : 0);
})();
