const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Определяем базовый URL (можно передать через переменную окружения)
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

(async () => {
  // Создаем директорию для скриншотов
  const screenshotsDir = path.join(__dirname, 'screenshots', 'admin-info-pages');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Запускаем браузер с headless=false для наглядности
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Замедляем выполнение для наглядности
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('1. Переходим на страницу авторизации...');
    console.log(`   Используем BASE_URL: ${BASE_URL}`);
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('2. Вводим email администратора...');
    await page.fill('input[type="email"]', 'khalezov89@gmail.com');
    await page.waitForTimeout(500);

    console.log('3. Вводим пароль...');
    await page.fill('input[type="password"]', '123456');
    await page.waitForTimeout(500);

    console.log('4. Нажимаем кнопку входа...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Проверяем успешный вход
    const currentUrl = page.url();
    console.log(`   Текущий URL после входа: ${currentUrl}`);

    if (currentUrl.includes('/admin') || !currentUrl.includes('/auth')) {
      console.log('✓ Успешный вход в систему');
    } else {
      console.log('✗ Ошибка входа - все еще на странице авторизации');
      throw new Error('Не удалось войти в систему');
    }

    console.log('5. Переходим на страницу управления информационными страницами...');
    await page.goto(`${BASE_URL}/admin/info-pages`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('6. Делаем скриншот списка информационных страниц...');
    await page.screenshot({
      path: path.join(screenshotsDir, '01-info-pages-list.png'),
      fullPage: true
    });
    console.log('✓ Скриншот списка сохранен');

    console.log('7. Проверяем количество информационных страниц...');
    // Пытаемся найти элементы списка различными способами
    const selectors = [
      'table tbody tr',
      '[data-page-item]',
      '.info-page-item',
      'div[role="row"]',
      'li[data-page]',
      'button:has-text("Редактировать")',
      'button:has-text("О Бренде"), button:has-text("Сотрудничество"), button:has-text("Оплата")'
    ];

    let pageItems = 0;
    let usedSelector = '';

    for (const selector of selectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          pageItems = count;
          usedSelector = selector;
          console.log(`   Найдено элементов (${selector}): ${count}`);
          break;
        }
      } catch (e) {
        // Пробуем следующий селектор
      }
    }

    console.log(`   Итого найдено страниц: ${pageItems}`);

    if (pageItems === 14) {
      console.log('✓ Найдено ровно 14 информационных страниц');
    } else if (pageItems > 0) {
      console.log(`⚠ Найдено ${pageItems} страниц (ожидалось 14)`);
      console.log(`   Использован селектор: ${usedSelector}`);
    } else {
      console.log('⚠ Не удалось подсчитать страницы автоматически, проверьте скриншот');
      console.log('   Попробуйте визуально посчитать элементы на скриншоте');
    }

    console.log('8. Ищем страницу "О Бренде" для редактирования...');
    // Пытаемся найти кнопку редактирования для "О Бренде"
    const editButtonSelectors = [
      'button:has-text("О Бренде") ~ button:has-text("Редактировать")',
      'tr:has-text("О Бренде") button:has-text("Редактировать")',
      'tr:has-text("О Бренде") button[aria-label*="dit"]',
      'tr:has-text("О Бренде") button:has(svg)',
      '[data-page-item]:has-text("О Бренде") button',
      'text=О Бренде >> .. >> button'
    ];

    let editButton = null;
    for (const selector of editButtonSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          editButton = btn;
          console.log(`   ✓ Найдена кнопка редактирования (селектор: ${selector})`);
          break;
        }
      } catch (e) {
        // Продолжаем поиск
      }
    }

    if (!editButton) {
      console.log('   ⚠ Не удалось найти кнопку редактирования автоматически');
      console.log('   Попробуем найти любую кнопку редактирования...');

      // Пытаемся найти хотя бы одну кнопку редактирования
      const anyEditButton = page.locator('button:has-text("Редактировать"), button[aria-label*="dit"]').first();
      if (await anyEditButton.isVisible({ timeout: 1000 })) {
        editButton = anyEditButton;
        console.log('   ✓ Найдена первая доступная кнопка редактирования');
      }
    }

    if (editButton) {
      console.log('9. Кликаем на кнопку редактирования...');
      await editButton.click();
      await page.waitForTimeout(2000);

      console.log('10. Делаем скриншот диалога редактирования...');
      await page.screenshot({
        path: path.join(screenshotsDir, '02-edit-dialog.png'),
        fullPage: true
      });
      console.log('✓ Скриншот диалога редактирования сохранен');

      // Дополнительно пытаемся сделать скриншот только диалога
      const dialog = page.locator('dialog, [role="dialog"], .dialog, [data-dialog]').first();
      if (await dialog.isVisible({ timeout: 1000 })) {
        await dialog.screenshot({
          path: path.join(screenshotsDir, '03-edit-dialog-closeup.png')
        });
        console.log('✓ Скриншот крупного плана диалога сохранен');
      }
    } else {
      console.log('⚠ Не удалось найти кнопку редактирования, пропускаем шаги 9-10');
    }

    console.log('\n=== РЕЗУЛЬТАТ ТЕСТА ===');
    console.log('✓ Авторизация в админ панели успешна');
    console.log('✓ Переход на страницу управления информационными страницами выполнен');
    console.log('✓ Скриншоты сохранены в:', screenshotsDir);
    console.log('\nПроверьте скриншоты для оценки результата:');
    console.log('- 01-info-pages-list.png - список всех информационных страниц');
    console.log('- 02-edit-dialog.png - диалог редактирования страницы');
    console.log('- 03-edit-dialog-closeup.png - крупный план диалога (если доступен)');

  } catch (error) {
    console.error('\n✗ ОШИБКА ВО ВРЕМЯ ТЕСТА:', error.message);
    await page.screenshot({
      path: path.join(screenshotsDir, 'error-screenshot.png'),
      fullPage: true
    });
    console.log('Скриншот ошибки сохранен в:', path.join(screenshotsDir, 'error-screenshot.png'));
  }

  console.log('\nТест завершен. Браузер закроется через 5 секунд...');
  await page.waitForTimeout(5000);
  await browser.close();
})();
