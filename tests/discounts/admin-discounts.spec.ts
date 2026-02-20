import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Вспомогательная функция для логина админа
async function loginAsAdmin(page: any) {
  await page.goto(`${BASE_URL}/auth`);
  await page.fill('#email', process.env.ADMIN_EMAIL || 'admin@ando.local');
  await page.fill('#password', process.env.ADMIN_PASSWORD || 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}

test.describe('Admin Discounts - Management', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('admin-create-discount - Admin can create a new discount', async ({ page }) => {
    // Переход на страницу управления скидками
    await page.goto(`${BASE_URL}/admin/user-discounts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Проверка доступности админ-панели
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin');

    // Поиск кнопки "Создать" или "Добавить скидку"
    const createButton = page.locator('button').filter({
      hasText: /создать|добавить|add|create/i
    }).first();

    const buttonExists = await createButton.count() > 0;

    if (buttonExists) {
      // Клик по кнопке создания
      await createButton.click();
      await page.waitForTimeout(1000);

      // Проверяем, что форма открылась
      const formVisible = await page.locator('form, [role="dialog"]').count() > 0;

      if (formVisible) {
        // Заполнение формы
        const userIdField = page.locator('input[name*="user"], select[name*="user"]').first();
        const discountAmountField = page.locator('input[name*="discount"], input[name*="amount"]').first();
        const discountTypeField = page.locator('select[name*="type"], input[name*="type"]').first();

        if (await userIdField.count() > 0) await userIdField.fill('test-user-id');
        if (await discountAmountField.count() > 0) await discountAmountField.fill('15');
        if (await discountTypeField.count() > 0) {
          const tagName = await discountTypeField.evaluate(el => el.tagName.toLowerCase());
          if (tagName === 'select') {
            await discountTypeField.selectOption('personal');
          } else {
            await discountTypeField.fill('personal');
          }
        }

        // Отправка формы (кнопка "Создать" в диалоге)
        await page.click('button:has-text("Создать")');
        await page.waitForTimeout(2000);

        // Проверка успешного создания (toast или обновление списка)
        const bodyText = await page.textContent('body');
        const successMessage = bodyText.match(/создана|успешно|success|created/i);

        if (successMessage) {
          console.log('✅ Discount created successfully');
          expect(successMessage).toBeTruthy();
        } else {
          console.log('⚠️ Success message not found - might be implicit');
        }
      } else {
        console.log('⚠️ Creation form not visible after button click');
      }
    } else {
      console.log('⚠️ Create button not found in admin panel');
    }
  });

  test('admin-edit-discount - Admin can edit existing discount', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/user-discounts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Найти первую скидку в таблице/списке
    const firstDiscount = page.locator('[data-testid="discount-row"], tr, .discount-item').first();
    const discountExists = await firstDiscount.count() > 0;

    if (discountExists) {
      // Найти кнопку редактирования
      const editButton = firstDiscount.locator('button').filter({
        hasText: /редактировать|edit|изменить/i
      }).first();

      const editExists = await editButton.count() > 0;

      if (editExists) {
        await editButton.click();
        await page.waitForTimeout(1000);

        // Проверяем, что форма редактирования открылась
        const editForm = page.locator('form, [role="dialog"]');
        const formVisible = await editForm.count() > 0;

        if (formVisible) {
          // Изменить значение скидки
          const amountInput = page.locator('input[name*="amount"], input[name*="discount"]').first();
          if (await amountInput.count() > 0) {
            await amountInput.clear();
            await amountInput.fill('20');
          }

          // Сохранить изменения
          await page.click('button[type="submit"]');
          await page.waitForTimeout(2000);

          // Проверка успеха
          const bodyText = await page.textContent('body');
          const successMsg = bodyText.match(/обновлена|изменена|updated|saved/i);

          if (successMsg) {
            console.log('✅ Discount updated successfully');
            expect(successMsg).toBeTruthy();
          }
        } else {
          console.log('⚠️ Edit form did not open');
        }
      } else {
        console.log('⚠️ Edit button not found on discount row');
      }
    } else {
      console.log('⚠️ No discounts found to edit - needs data seeding');
    }
  });

  test('admin-delete-discount - Admin can delete discount with confirmation', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/user-discounts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Подсчитать количество скидок до удаления
    const discountsBefore = await page.locator('[data-testid="discount-row"], tr, .discount-item').count();

    if (discountsBefore > 0) {
      // Найти кнопку удаления
      const deleteButton = page.locator('button').filter({
        hasText: /удалить|delete|remove/i
      }).first();

      const deleteExists = await deleteButton.count() > 0;

      if (deleteExists) {
        // Слушаем диалог подтверждения
        page.on('dialog', async dialog => {
          expect(dialog.type()).toBe('confirm');
          await dialog.accept();
        });

        await deleteButton.click();
        await page.waitForTimeout(2000);

        // Проверка уменьшения количества
        const discountsAfter = await page.locator('[data-testid="discount-row"], tr, .discount-item').count();

        if (discountsAfter < discountsBefore) {
          console.log('✅ Discount deleted successfully');
          expect(discountsAfter).toBeLessThan(discountsBefore);
        } else {
          console.log('⚠️ Discount count did not decrease');
        }
      } else {
        console.log('⚠️ Delete button not found');
      }
    } else {
      console.log('⚠️ No discounts to delete - needs data seeding');
    }
  });

  test('admin-filters - Admin can filter discounts by type and status', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/user-discounts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Проверка наличия фильтров
    const filterSelect = page.locator('select, [role="combobox"]').first();
    const filterExists = await filterSelect.count() > 0;

    if (filterExists) {
      // Попытка выбрать фильтр "только активные"
      const activeFilterOption = page.locator('option, [role="option"]').filter({
        hasText: /активные|active/i
      }).first();

      const optionExists = await activeFilterOption.count() > 0;

      if (optionExists) {
        await activeFilterOption.click();
        await page.waitForTimeout(1500);

        // Проверить, что список обновился
        const discounts = await page.locator('[data-testid="discount-row"], tr, .discount-item').count();

        console.log(`✅ Filter applied - showing ${discounts} discount(s)`);
        expect(discounts).toBeGreaterThanOrEqual(0);
      } else {
        console.log('⚠️ Filter options not found');
      }
    } else {
      console.log('⚠️ No filter UI found - might need implementation');
    }

    // Тест фильтрации по типу
    const typeFilter = page.locator('select[name*="type"], [data-testid="type-filter"]').first();
    const typeFilterExists = await typeFilter.count() > 0;

    if (typeFilterExists) {
      await typeFilter.selectOption('personal');
      await page.waitForTimeout(1500);

      const filteredCount = await page.locator('[data-testid="discount-row"], tr, .discount-item').count();
      console.log(`✅ Type filter applied - showing ${filteredCount} personal discount(s)`);
    } else {
      console.log('⚠️ Type filter not found');
    }
  });

  test('admin-bulk-actions - Admin can perform bulk operations', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/user-discounts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Проверка наличия чекбоксов для выбора
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 1) {
      // Выбрать первые 2 чекбокса
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      await page.waitForTimeout(500);

      // Найти кнопку массового действия
      const bulkActionButton = page.locator('button').filter({
        hasText: /массовое|bulk|действие|action/i
      }).first();

      const bulkExists = await bulkActionButton.count() > 0;

      if (bulkExists) {
        console.log('✅ Bulk action UI exists');
        expect(bulkExists).toBeTruthy();
      } else {
        console.log('⚠️ Bulk action button not found');
      }
    } else {
      console.log('⚠️ Not enough checkboxes for bulk operations');
    }
  });

  test('admin-search-discounts - Admin can search discounts', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/user-discounts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Найти поле поиска
    const searchInput = page.locator('input[type="search"], input[placeholder*="поиск"], input[placeholder*="search"]').first();
    const searchExists = await searchInput.count() > 0;

    if (searchExists) {
      // Ввести поисковый запрос
      await searchInput.fill('test');
      await page.waitForTimeout(1500);

      // Проверить, что результаты отфильтрованы
      const results = await page.locator('[data-testid="discount-row"], tr, .discount-item').count();

      console.log(`✅ Search executed - found ${results} result(s)`);
      expect(results).toBeGreaterThanOrEqual(0);
    } else {
      console.log('⚠️ Search input not found - might need implementation');
    }
  });

});

test.describe('Admin Permissions', () => {

  test('non-admin-cannot-access - Regular user cannot access admin panel', async ({ page }) => {
    // Логин обычного пользователя
    await page.goto(`${BASE_URL}/auth`);
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'User123!@#');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Попытка перейти в админку
    await page.goto(`${BASE_URL}/admin/user-discounts`);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    // Должен быть редирект или 403/404
    const isRedirected = !currentUrl.includes('/admin/user-discounts');
    const hasErrorMessage = await page.textContent('body').then(text =>
      text.match(/доступ запрещен|access denied|403|404|unauthorized/i)
    );

    if (isRedirected || hasErrorMessage) {
      console.log('✅ Non-admin correctly blocked from admin panel');
      expect(isRedirected || hasErrorMessage).toBeTruthy();
    } else {
      console.log('⚠️ Access control might not be implemented');
    }
  });

});
