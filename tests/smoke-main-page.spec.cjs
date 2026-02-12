// Smoke test - проверка что главная страница магазина работает
const { test, expect } = require('@playwright/test');

test('Main shop page loads without crashes', async ({ page }) => {
  // Перейти на главную
  await page.goto('https://andojv.com', {
    waitUntil: 'networkidle',
    timeout: 15000
  });

  // Проверить что страница загрузилась
  await expect(page).toHaveTitle(/Ando/i);

  // Проверить что нет JS ошибок (критичных)
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  // Подождать отрисовки
  await page.waitForTimeout(2000);

  // Проверить что есть основные элементы
  const logo = page.locator('img[alt*="logo"], img[alt*="Ando"], header img').first();
  await expect(logo).toBeVisible({ timeout: 5000 });

  // Проверить что нет критичных ошибок
  const criticalErrors = errors.filter(err =>
    !err.includes('favicon') &&
    !err.includes('404') &&
    !err.includes('Third-party')
  );

  expect(criticalErrors.length).toBe(0);

  console.log('✅ Main page loaded successfully, no critical errors');
});
