const { test, expect } = require('@playwright/test');

/**
 * E2E: Базовая механика для гостя (без авторизации)
 * Покрывает: Главная → Каталог → Карточка товара → Корзина (drawer)
 */

test.describe('Guest User: Basic Site Navigation', () => {

  test('Главная страница загружается корректно', async ({ page }) => {
    await page.goto('/');

    // Проверяем заголовок
    await expect(page).toHaveTitle(/ando/i);

    // Проверяем header
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Проверяем навигацию — "ЖЕНСКОЕ" ведёт в каталог
    const womenLink = page.locator('a[href*="/catalog?gender=women"], a:has-text("ЖЕНСКОЕ")');
    await expect(womenLink.first()).toBeVisible();
  });

  test('Каталог отображает товары', async ({ page }) => {
    // Переходим в женский каталог
    await page.goto('/catalog?gender=women');

    // Ждём загрузки товаров (ссылки на /product/slug)
    const products = page.locator('a[href^="/product/"]');
    await expect(products.first()).toBeVisible({ timeout: 15000 });

    // Проверяем что товаров больше одного
    const count = await products.count();
    expect(count).toBeGreaterThan(0);
    console.log(`Найдено товаров: ${count}`);
  });

  test('Карточка товара открывается и содержит информацию', async ({ page }) => {
    await page.goto('/catalog?gender=women');

    // Ждём загрузки товаров
    const products = page.locator('a[href^="/product/"]');
    await expect(products.first()).toBeVisible({ timeout: 15000 });

    // Кликаем на первый товар
    await products.first().click();

    // Проверяем URL
    await expect(page).toHaveURL(/\/product\//);

    // Проверяем наличие заголовка товара
    const title = page.locator('h1');
    await expect(title).toBeVisible({ timeout: 10000 });

    // Проверяем кнопку "В корзину"
    const addToCartBtn = page.locator(
      'button:has-text("В корзину"), ' +
      'button:has-text("Добавить"), ' +
      'button:has-text("Add")'
    );
    await expect(addToCartBtn.first()).toBeVisible();
  });

  test('Товар добавляется в корзину (модалка/drawer открывается)', async ({ page }) => {
    await page.goto('/catalog?gender=women');

    // Ждём и кликаем на товар
    const products = page.locator('a[href^="/product/"]');
    await expect(products.first()).toBeVisible({ timeout: 15000 });
    await products.first().click();
    await page.waitForURL(/\/product\//);

    // Ждём загрузки страницы товара
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Выбираем размер если есть кнопки размеров
    const sizeBtn = page.locator('button[data-size], button:has-text("S"), button:has-text("M"), button:has-text("L")');
    const sizeCount = await sizeBtn.count();
    if (sizeCount > 0) {
      // Кликаем на первый доступный размер
      await sizeBtn.first().click();
    }

    // Добавляем в корзину
    const addBtn = page.locator('button:has-text("В корзину"), button:has-text("Добавить")');
    await addBtn.first().click();

    // Проверяем появление модалки, drawer или toast
    const cartUI = page.locator('[role="dialog"], [data-sonner-toast], .toast, [data-state="open"]');
    await expect(cartUI.first()).toBeVisible({ timeout: 5000 });
  });

  test('Lookbook страница загружается', async ({ page }) => {
    await page.goto('/lookbook');

    // Проверяем что страница загрузилась
    await expect(page).toHaveURL(/lookbook/);

    // Проверяем наличие контента
    const content = page.locator('main, [role="main"], article, .content, img');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('Info страница загружается', async ({ page }) => {
    // Пробуем info-страницу доставки
    await page.goto('/info/delivery');

    // Проверяем наличие контента
    const content = page.locator('main, article, .content, p, h1, h2');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
    console.log('✓ /info/delivery загружена');
  });

});
