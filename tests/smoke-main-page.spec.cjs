// Smoke test - проверка что главная страница магазина работает
const { test, expect } = require('@playwright/test');

test('Main shop page loads without crashes', async ({ page }) => {
  // Отслеживаем критичные ошибки
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  // Перейти на главную
  const response = await page.goto('https://andojv.com', {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  });

  // Проверить что ответ успешный
  expect(response.status()).toBeLessThan(400);

  // Подождать немного для загрузки
  await page.waitForTimeout(3000);

  // Проверить что есть хоть какой-то контент (body не пустой)
  const bodyText = await page.locator('body').textContent();
  expect(bodyText.length).toBeGreaterThan(0);

  // Проверить что нет критичных JS ошибок
  const criticalErrors = errors.filter(err =>
    !err.includes('favicon') &&
    !err.includes('404') &&
    !err.includes('Third-party') &&
    !err.includes('net::ERR')
  );

  expect(criticalErrors.length).toBe(0);

  console.log('✅ Main page loaded successfully, no critical errors');
});
