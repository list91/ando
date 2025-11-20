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
    slowMo: 500 // Замедляем выполнение для наглядности
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log('1. Открываем главную страницу...');
    await page.goto('http://andojv.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Скриншот главной страницы с cookie banner
    await page.screenshot({
      path: path.join(screenshotsDir, '01-homepage-with-cookie-banner.png'),
      fullPage: true
    });
    console.log('✓ Скриншот главной страницы сохранен');

    console.log('2. Ищем cookie banner...');
    const cookieBanner = await page.locator('text=Мы используем файлы cookie');
    if (await cookieBanner.isVisible()) {
      console.log('✓ Cookie banner найден');

      // Скриншот cookie banner
      await cookieBanner.screenshot({
        path: path.join(screenshotsDir, '02-cookie-banner-closeup.png')
      });
      console.log('✓ Скриншот cookie banner сохранен');

      console.log('3. Кликаем на ссылку "политикой конфиденциальности"...');
      await page.click('text=политикой конфиденциальности');
      await page.waitForTimeout(2000);

      // Проверяем URL
      const currentUrl = page.url();
      console.log(`   Текущий URL: ${currentUrl}`);

      // Скриншот страницы после клика
      await page.screenshot({
        path: path.join(screenshotsDir, '03-after-privacy-link-click.png'),
        fullPage: true
      });
      console.log('✓ Скриншот страницы после клика сохранен');

      // Проверяем содержимое страницы
      console.log('4. Проверяем содержимое страницы...');
      const pageContent = await page.textContent('body');

      if (currentUrl.includes('/info') && currentUrl.includes('section=privacy')) {
        console.log('✓ URL содержит /info?section=privacy');
      } else {
        console.log('✗ URL НЕ содержит /info?section=privacy');
        console.log(`   Текущий URL: ${currentUrl}`);
      }

      if (pageContent.includes('Пользовательское соглашение')) {
        console.log('✓ Найден текст "Пользовательское соглашение"');
      } else {
        console.log('✗ НЕ найден текст "Пользовательское соглашение"');
      }

      if (pageContent.includes('Конфиденциальность')) {
        console.log('✓ Найден раздел о конфиденциальности');
      } else {
        console.log('✗ НЕ найден раздел о конфиденциальности');
      }

      // Скриншот раздела с соглашением
      const agreementSection = await page.locator('text=Пользовательское соглашение').first();
      if (await agreementSection.isVisible()) {
        await agreementSection.screenshot({
          path: path.join(screenshotsDir, '04-agreement-section-closeup.png')
        });
        console.log('✓ Скриншот раздела соглашения сохранен');
      }

      console.log('\n=== РЕЗУЛЬТАТ ТЕСТА ===');
      console.log('Все скриншоты сохранены в папку:', screenshotsDir);
      console.log('Проверьте скриншоты для оценки результата.');

    } else {
      console.log('✗ Cookie banner НЕ найден!');
      console.log('   Возможно, согласие уже было дано ранее.');
      console.log('   Очистите localStorage и попробуйте снова.');
    }

  } catch (error) {
    console.error('Ошибка во время теста:', error);
    await page.screenshot({
      path: path.join(screenshotsDir, 'error-screenshot.png'),
      fullPage: true
    });
  }

  console.log('\nТест завершен. Браузер закроется через 5 секунд...');
  await page.waitForTimeout(5000);
  await browser.close();
})();
