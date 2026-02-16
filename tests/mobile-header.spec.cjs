// E2E тест - динамический хедер на мобилке
// При scroll=0 - прозрачный, при scroll>10 - с фоном и границей
const { test, expect } = require('@playwright/test');

test.describe('Mobile Header: Dynamic Background', () => {

  test.beforeEach(async ({ page }) => {
    // Мобильный viewport
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('Хедер прозрачный при scroll=0, с фоном при scroll>10', async ({ page }) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:5173';

    // Идём на каталог где есть товары для скролла
    await page.goto(`${baseURL}/catalog?gender=women`, { waitUntil: 'networkidle', timeout: 15000 });

    // Закрыть cookie banner если есть
    const cookieClose = page.locator('button:has-text("Принять"), button:has-text("×")').first();
    if (await cookieClose.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieClose.click();
      await page.waitForTimeout(300);
    }

    // Найти мобильный хедер (md:hidden sticky)
    const mobileHeader = page.locator('div.md\\:hidden.sticky').first();
    await expect(mobileHeader).toBeVisible({ timeout: 10000 });

    // === ТЕСТ 1: При scroll=0 хедер должен быть прозрачным ===

    // Скроллим в самый верх (на всякий случай)
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 0;
    });
    await page.waitForTimeout(300);

    // Проверяем что фон прозрачный (bg-transparent)
    const initialClasses = await mobileHeader.getAttribute('class');
    console.log('Classes at scroll=0:', initialClasses);

    expect(initialClasses).toContain('bg-transparent');
    expect(initialClasses).toContain('border-transparent');

    // === ТЕСТ 2: При scroll>10 хедер должен получить фон ===

    // Реальный скролл через mouse wheel на первом main (Layout)
    const main = page.locator('main').first();
    await main.hover();
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(500);

    // Проверяем что появился фон
    const scrolledClasses = await mobileHeader.getAttribute('class');
    console.log('Classes at scroll=100:', scrolledClasses);

    expect(scrolledClasses).toContain('bg-background');
    expect(scrolledClasses).toContain('border-border');
    expect(scrolledClasses).toContain('shadow-sm');

    // === ТЕСТ 3: При возврате к scroll=0 хедер снова прозрачный ===

    // Скроллим обратно вверх
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(500);

    const returnedClasses = await mobileHeader.getAttribute('class');
    console.log('Classes after return to top:', returnedClasses);

    expect(returnedClasses).toContain('bg-transparent');

    console.log('✅ Dynamic mobile header works correctly');
  });

  test('Хедер имеет плавный переход (transition)', async ({ page }) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:5173';

    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 15000 });

    const mobileHeader = page.locator('div.md\\:hidden.sticky').first();
    await expect(mobileHeader).toBeVisible();

    // Проверяем наличие transition классов
    const classes = await mobileHeader.getAttribute('class');

    expect(classes).toContain('transition-all');
    expect(classes).toContain('duration-200');

    console.log('✅ Header has smooth transition');
  });

});
