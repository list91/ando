// Smoke Critical Tests - проверка критичных компонентов продакшена
const { test, expect } = require('@playwright/test');

// URL сервера из переменной окружения
const BASE_URL = process.env.BASE_URL || 'http://83.166.246.253';

test.describe('Smoke Critical Tests', () => {

  test('Database API Health Check', async ({ request }) => {
    // Проверить что Supabase REST API отвечает
    const response = await request.get(`${BASE_URL}/rest/v1/categories`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || ''
      },
      timeout: 10000
    });

    // Ожидаем что сервер отвечает (200 OK или 401 Unauthorized - оба означают что API работает)
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);

    // Проверить что это JSON
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');

    console.log(`✅ Database API responds with status ${response.status()}`);
  });

  test('Catalog Page Loads', async ({ page }) => {
    // Отслеживаем критичные ошибки
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Открыть страницу каталога
    const response = await page.goto(`${BASE_URL}/catalog`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Подождать пока React приложение инициализируется
    await page.waitForTimeout(2000);

    // Проверить что страница загрузилась без серверных ошибок
    expect(response.status()).toBeLessThan(500);

    // Проверить что React приложение загрузилось (есть #root с контентом)
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent.length).toBeGreaterThan(0);

    // Проверить что нет критичных JS ошибок
    expect(errors.length).toBe(0);

    console.log(`✅ Catalog page loaded successfully (${response.status()})`);
  });

});
