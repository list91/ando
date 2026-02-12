// Smoke test - проверка что главная страница магазина работает
const { test, expect } = require('@playwright/test');

test('Main shop page loads without crashes', async ({ page }) => {
  // Отслеживаем критичные ошибки
  const errors = [];
  const consoleErrors = [];

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Перейти на главную (в CI тестируем локальный билд, иначе production)
  const baseURL = process.env.CI ? 'http://localhost:3000' : 'http://83.166.246.253';
  const response = await page.goto(baseURL, {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  });

  // Проверить что НЕТ ошибки сервера (502, 500, etc)
  expect(response.status()).toBeLessThan(500);

  // Подождать немного для загрузки
  await page.waitForTimeout(3000);

  // Проверить что есть хоть какой-то контент (body не пустой)
  const bodyText = await page.locator('body').textContent();
  expect(bodyText.length).toBeGreaterThan(0);

  // Проверить что нет критичных JS ошибок (фильтруем network errors)
  const criticalConsoleErrors = consoleErrors.filter(err =>
    !err.includes('ERR_CONNECTION_REFUSED') &&
    !err.includes('net::') &&
    !err.includes('Failed to load resource')
  );

  if (errors.length > 0) {
    console.error('❌ Page errors detected:', errors);
  }
  if (criticalConsoleErrors.length > 0) {
    console.error('❌ Console errors detected:', criticalConsoleErrors);
  }

  expect(errors.length).toBe(0);
  expect(criticalConsoleErrors.length).toBe(0);

  console.log('✅ Main page loaded successfully, no critical errors');
});
