// Smoke Critical Tests - проверка критичных компонентов продакшена
//
// Эти тесты проверяют основные функции интернет-магазина:
// 1. Database API Health Check - доступность базы данных через Supabase REST API
// 2. Catalog Page Loads - загрузка каталога товаров и отображение продуктов
//
// Запуск: npm run test:smoke-critical
// ENV: BASE_URL (default: http://83.166.246.253), SUPABASE_ANON_KEY
const { test, expect } = require('@playwright/test');

// URL сервера из переменной окружения
const BASE_URL = process.env.BASE_URL || 'http://83.166.246.253';

describe('Smoke Critical Tests', () => {

  test('Database API Health Check', async ({ request }) => {
    // Проверить что Supabase REST API отвечает
    const response = await request.get(`${BASE_URL}/rest/v1/categories`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || ''
      },
      timeout: 10000
    });

    // Ожидаем успешный ответ
    expect(response.status()).toBe(200);

    // Проверить что это JSON
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');

    // Проверить что есть данные
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    console.log(`✅ Database API: ${data.length} categories found`);
  });

  test('Catalog Page Loads', async ({ page }) => {
    // Отслеживаем ошибки
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Открыть страницу каталога
    const response = await page.goto(`${BASE_URL}/catalog`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Проверить что страница загрузилась
    expect(response.status()).toBeLessThan(500);

    // Подождать загрузки товаров
    await page.waitForTimeout(3000);

    // Проверить что есть товары на странице
    // Пробуем разные селекторы (точная структура может отличаться)
    const productSelectors = [
      '[data-testid="product-card"]',
      '.product-card',
      'article[class*="product"]',
      'div[class*="product"]'
    ];

    let productsFound = false;
    for (const selector of productSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        productsFound = true;
        console.log(`✅ Catalog: ${count} products found with selector "${selector}"`);
        break;
      }
    }

    // Проверить что товары загрузились
    expect(productsFound).toBeTruthy();

    // Проверить что нет критичных JS ошибок
    expect(errors.length).toBe(0);
  });

});
