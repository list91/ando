// E2E тест - Навигация в корзину открывает CartDrawer вместо /checkout
// Задача П-1: При нажатии "Перейти в корзину" должен открываться CartDrawer (drawer/sidebar)
// URL НЕ должен меняться на /checkout

const { test, expect } = require('@playwright/test');

const SELECTORS = {
  // Карточка товара в каталоге
  productCard: [
    '[data-testid="product-card"]',
    '.product-card',
    'a[href*="/product"]',
    '[class*="ProductCard"]',
    'article a',
    '.card a'
  ],
  // Выбор размера
  sizeButton: [
    'button:has-text("S")',
    'button:has-text("M")',
    'button:has-text("L")',
    '[data-testid="size-selector"] button',
    'button[class*="size"]'
  ],
  // Добавить в корзину
  addToCart: [
    'button:has-text("ДОБАВИТЬ В КОРЗИНУ")',
    'button:has-text("В корзину")',
    'button:has-text("Добавить в корзину")',
    'button:has-text("Add to cart")',
    '[data-testid="add-to-cart"]',
    'button[class*="cart"]'
  ],
  // Перейти в корзину (в модалке после добавления)
  goToCart: [
    '[data-testid="go-to-cart-modal"]',
    'button:has-text("Перейти в корзину")',
    'button:has-text("Go to cart")',
    'a:has-text("Перейти в корзину")',
    '[data-testid="go-to-cart"]'
  ],
  // CartDrawer (sidebar корзины)
  cartDrawer: [
    '[data-testid="cart-drawer"]',
    '[class*="CartDrawer"]',
    '[class*="cart-drawer"]',
    '[role="dialog"][class*="cart"]',
    'aside[class*="cart"]',
    'div[class*="drawer"][class*="cart"]',
    // Sheet/Drawer компонент
    '[data-state="open"][class*="Sheet"]',
    '[data-state="open"][role="dialog"]',
    // Sidebar
    'div[class*="sidebar"][class*="cart"]',
    // Generic drawer/sheet selectors (Radix UI)
    '[data-radix-dialog-content]',
    '[class*="SheetContent"]'
  ],
  // Cookie banner (для закрытия)
  cookieBanner: 'button:has-text("Принять"), button:has-text("×")'
};

/**
 * Пытается кликнуть на один из селекторов по порядку
 * @param {import('@playwright/test').Page} page
 * @param {string[]} selectors
 * @returns {Promise<{clicked: boolean, selector: string|null}>}
 */
async function tryClickFirst(page, selectors) {
  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.count() > 0 && await el.isVisible({ timeout: 1000 })) {
        await el.click();
        return { clicked: true, selector };
      }
    } catch (e) { /* continue */ }
  }
  return { clicked: false, selector: null };
}

/**
 * Проверяет что хотя бы один из селекторов виден
 * @param {import('@playwright/test').Page} page
 * @param {string[]} selectors
 * @returns {Promise<{visible: boolean, selector: string|null}>}
 */
async function isAnyVisible(page, selectors) {
  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 500 })) {
        return { visible: true, selector };
      }
    } catch (e) { /* continue */ }
  }
  return { visible: false, selector: null };
}

test.describe('Cart Navigation', () => {

  test.describe('Desktop (1920x1080)', () => {

    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
    });

    test('Кнопка "Перейти в корзину" открывает CartDrawer, а не /checkout', async ({ page }) => {
      const baseURL = process.env.BASE_URL || 'http://localhost:8080';

      // Step 1: Открываем каталог
      await page.goto(`${baseURL}/catalog`, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Закрыть cookie banner если есть
      const cookieClose = page.locator(SELECTORS.cookieBanner).first();
      if (await cookieClose.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cookieClose.click();
        await page.waitForTimeout(300);
      }

      // Ожидание загрузки товаров
      await page.waitForSelector('a[href*="/product"]', { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Step 2: Кликаем на первый товар
      const productClick = await tryClickFirst(page, SELECTORS.productCard);
      expect(productClick.clicked, 'Должен найтись товар для клика').toBe(true);

      await page.waitForURL(/\/product\//, { timeout: 10000 });
      const productPageUrl = page.url();

      // Step 3: Выбираем размер (если требуется)
      await page.waitForTimeout(500);
      await tryClickFirst(page, SELECTORS.sizeButton);
      await page.waitForTimeout(300);

      // Step 4: Добавляем в корзину
      const addToCartClick = await tryClickFirst(page, SELECTORS.addToCart);
      expect(addToCartClick.clicked, 'Должна найтись кнопка "Добавить в корзину"').toBe(true);

      await page.waitForTimeout(1000);

      // Step 5: Ищем и кликаем "Перейти в корзину" в модалке
      const goToCartClick = await tryClickFirst(page, SELECTORS.goToCart);
      expect(goToCartClick.clicked, 'Должна найтись кнопка "Перейти в корзину"').toBe(true);

      await page.waitForTimeout(1000);

      // === ПРОВЕРКИ ===

      // Проверка 1: URL НЕ должен быть /checkout
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/checkout');

      // Проверка 2: CartDrawer должен быть виден
      const drawerVisible = await isAnyVisible(page, SELECTORS.cartDrawer);
      expect(drawerVisible.visible, `CartDrawer должен быть виден (искали: ${SELECTORS.cartDrawer.join(', ')})`).toBe(true);

      console.log(`✅ Desktop: CartDrawer открыт через "${drawerVisible.selector}", URL: ${currentUrl}`);
    });

  });

  test.describe('Mobile (375x667)', () => {

    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('Кнопка "Перейти в корзину" открывает CartDrawer, а не /checkout (mobile)', async ({ page }) => {
      const baseURL = process.env.BASE_URL || 'http://localhost:8080';

      // Step 1: Открываем каталог
      await page.goto(`${baseURL}/catalog`, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Закрыть cookie banner если есть
      const cookieClose = page.locator(SELECTORS.cookieBanner).first();
      if (await cookieClose.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cookieClose.click();
        await page.waitForTimeout(300);
      }

      // Ожидание загрузки товаров
      await page.waitForSelector('a[href*="/product"]', { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Step 2: Кликаем на первый товар
      const productClick = await tryClickFirst(page, SELECTORS.productCard);
      expect(productClick.clicked, 'Должен найтись товар для клика').toBe(true);

      await page.waitForURL(/\/product\//, { timeout: 10000 });

      // Step 3: Выбираем размер (если требуется)
      await page.waitForTimeout(500);
      await tryClickFirst(page, SELECTORS.sizeButton);
      await page.waitForTimeout(300);

      // Step 4: Добавляем в корзину
      const addToCartClick = await tryClickFirst(page, SELECTORS.addToCart);
      expect(addToCartClick.clicked, 'Должна найтись кнопка "Добавить в корзину"').toBe(true);

      await page.waitForTimeout(1000);

      // Step 5: Ищем и кликаем "Перейти в корзину" в модалке
      const goToCartClick = await tryClickFirst(page, SELECTORS.goToCart);
      expect(goToCartClick.clicked, 'Должна найтись кнопка "Перейти в корзину"').toBe(true);

      await page.waitForTimeout(1000);

      // === ПРОВЕРКИ ===

      // Проверка 1: URL НЕ должен быть /checkout
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/checkout');

      // Проверка 2: CartDrawer должен быть виден
      const drawerVisible = await isAnyVisible(page, SELECTORS.cartDrawer);
      expect(drawerVisible.visible, `CartDrawer должен быть виден (mobile)`).toBe(true);

      console.log(`✅ Mobile: CartDrawer открыт через "${drawerVisible.selector}", URL: ${currentUrl}`);
    });

  });

});
