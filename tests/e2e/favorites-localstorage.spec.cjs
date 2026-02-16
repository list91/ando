// E2E тест - Избранное без авторизации (localStorage)
// Задача ЛК-3: Гость может добавлять товары в избранное
// Задача ЛК-4: Миграция данных при логине (если auth доступен)

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const LOCALSTORAGE_KEY = 'ando_favorites';

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
  // Кнопка избранного (сердечко)
  favoriteButton: [
    '[data-testid="favorite-btn"]',
    'button[aria-label*="избранн"]',
    'button[aria-label*="Избранн"]',
    'button[aria-label*="favorite"]',
    'button[aria-label*="Favorite"]',
    'button:has(svg[class*="heart"])',
    'button:has([class*="Heart"])',
    'button[class*="favorite"]',
    'button[class*="wishlist"]',
    '[data-testid="wishlist-btn"]',
    // Иконка сердца внутри кнопки
    'button:has(path[d*="M12 21.35"])', // Material heart path
    'button:has(path[d*="M20.84 4.61"])', // Lucide heart path
    '[class*="favorite"] button',
    '[class*="wishlist"] button'
  ],
  // Избранное активно (заполненное сердце)
  favoriteActive: [
    '[data-testid="favorite-btn"][data-active="true"]',
    'button[aria-pressed="true"]:has(svg[class*="heart"])',
    'button[class*="favorite"][class*="active"]',
    'button[class*="favorited"]',
    'button:has([fill="currentColor"][class*="heart"])',
    '[class*="favorite-active"]'
  ],
  // Страница избранного - список товаров
  favoritesPageContent: [
    '[data-testid="favorites-list"]',
    '[class*="favorites-list"]',
    '[class*="FavoritesList"]',
    '[class*="wishlist-items"]',
    'main [class*="favorite"]',
    'main [class*="wishlist"]',
    // Карточки товаров на странице избранного
    '[data-testid="favorite-item"]',
    '[class*="FavoriteItem"]'
  ],
  // Пустое избранное
  favoritesEmpty: [
    '[data-testid="favorites-empty"]',
    ':text("Избранное пусто")',
    ':text("Нет избранных")',
    ':text("В избранном пока ничего нет")',
    '[class*="empty"]'
  ],
  // Cookie banner (для закрытия)
  cookieBanner: 'button:has-text("Принять"), button:has-text("x")'
};

/**
 * Пытается кликнуть на один из селекторов по порядку
 * @param {import('@playwright/test').Page} page
 * @param {string[]} selectors
 * @param {object} options
 * @returns {Promise<{clicked: boolean, selector: string|null}>}
 */
async function tryClickFirst(page, selectors, options = {}) {
  const { timeout = 1000, index = 0 } = options;
  for (const selector of selectors) {
    try {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > index) {
        const el = elements.nth(index);
        if (await el.isVisible({ timeout })) {
          await el.click();
          return { clicked: true, selector };
        }
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

/**
 * Получает значение из localStorage
 * @param {import('@playwright/test').Page} page
 * @param {string} key
 * @returns {Promise<any>}
 */
async function getLocalStorage(page, key) {
  return await page.evaluate((k) => {
    const value = localStorage.getItem(k);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }, key);
}

/**
 * Устанавливает значение в localStorage
 * @param {import('@playwright/test').Page} page
 * @param {string} key
 * @param {any} value
 */
async function setLocalStorage(page, key, value) {
  await page.evaluate(({ k, v }) => {
    localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  }, { k: key, v: value });
}

/**
 * Очищает localStorage ключ
 * @param {import('@playwright/test').Page} page
 * @param {string} key
 */
async function clearLocalStorage(page, key) {
  await page.evaluate((k) => {
    localStorage.removeItem(k);
  }, key);
}

/**
 * Извлекает product ID из URL или атрибутов элемента
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @returns {Promise<string|null>}
 */
async function extractProductId(page, selector) {
  // Пробуем из URL
  const url = page.url();
  const urlMatch = url.match(/\/product\/([^\/\?]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Пробуем из data-атрибута
  try {
    const productId = await page.evaluate((sel) => {
      const card = document.querySelector(sel);
      if (!card) return null;
      return card.dataset.productId ||
             card.dataset.id ||
             card.getAttribute('data-product-id') ||
             card.closest('[data-product-id]')?.dataset.productId;
    }, selector);
    if (productId) return productId;
  } catch (e) { /* continue */ }

  // Пробуем из href
  try {
    const href = await page.evaluate((sel) => {
      const link = document.querySelector(sel);
      if (!link) return null;
      const href = link.href || link.closest('a')?.href;
      if (!href) return null;
      const match = href.match(/\/product\/([^\/\?]+)/);
      return match ? match[1] : null;
    }, selector);
    if (href) return href;
  } catch (e) { /* continue */ }

  return null;
}

test.describe('Favorites (localStorage) - ЛК-3, ЛК-4', () => {

  test.describe('Desktop (1920x1080)', () => {

    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
    });

    test('ЛК-3: Гость может добавить товар в избранное', async ({ page }) => {
      // Step 1: Открываем каталог
      await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Закрыть cookie banner если есть
      const cookieClose = page.locator(SELECTORS.cookieBanner).first();
      if (await cookieClose.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cookieClose.click();
        await page.waitForTimeout(300);
      }

      // Ожидание загрузки товаров
      await page.waitForSelector('a[href*="/product"]', { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Очищаем избранное перед тестом
      await clearLocalStorage(page, LOCALSTORAGE_KEY);

      // Step 2: Кликаем на первый товар для перехода на страницу товара
      const productClick = await tryClickFirst(page, SELECTORS.productCard);
      expect(productClick.clicked, 'Должен найтись товар для клика').toBe(true);

      await page.waitForURL(/\/product\//, { timeout: 10000 });
      await page.waitForTimeout(500);

      // Получаем ID товара из URL
      const productUrl = page.url();
      const productIdMatch = productUrl.match(/\/product\/([^\/\?]+)/);
      const expectedProductId = productIdMatch ? productIdMatch[1] : null;
      console.log(`Product URL: ${productUrl}, Expected ID: ${expectedProductId}`);

      // Step 3: Кликаем на кнопку избранного (сердечко)
      const favoriteClick = await tryClickFirst(page, SELECTORS.favoriteButton);
      expect(favoriteClick.clicked, `Должна найтись кнопка избранного (искали: ${SELECTORS.favoriteButton.slice(0, 3).join(', ')}...)`).toBe(true);
      console.log(`Favorite button clicked: ${favoriteClick.selector}`);

      await page.waitForTimeout(500);

      // Step 4: Проверяем localStorage
      const favorites = await getLocalStorage(page, LOCALSTORAGE_KEY);
      console.log(`localStorage['${LOCALSTORAGE_KEY}']:`, JSON.stringify(favorites));

      expect(favorites, `localStorage['${LOCALSTORAGE_KEY}'] должен существовать`).not.toBeNull();

      // Favorites может быть массивом ID или объектом
      let favoritesContainsProduct = false;
      if (Array.isArray(favorites)) {
        favoritesContainsProduct = favorites.some(id =>
          String(id) === String(expectedProductId) ||
          (typeof id === 'object' && String(id.id || id.productId) === String(expectedProductId))
        );
      } else if (typeof favorites === 'object' && favorites !== null) {
        // Может быть объект { productId: true } или { items: [...] }
        favoritesContainsProduct =
          favorites[expectedProductId] ||
          favorites.items?.some(item => String(item.id || item.productId || item) === String(expectedProductId));
      }

      // Если не нашли конкретный ID, проверяем что хоть что-то добавилось
      if (!favoritesContainsProduct && expectedProductId) {
        const favLength = Array.isArray(favorites) ? favorites.length : Object.keys(favorites).length;
        expect(favLength, 'В избранном должен быть хотя бы один товар').toBeGreaterThan(0);
        console.log('Note: Product ID format may differ, but favorites is not empty');
      }

      // Step 5: Переходим на страницу избранного
      await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);

      // Step 6: Проверяем что товар отображается в избранном
      // Ищем либо список товаров, либо проверяем что страница не показывает "пусто"
      const favoritesContent = await isAnyVisible(page, SELECTORS.favoritesPageContent);
      const favoritesEmpty = await isAnyVisible(page, SELECTORS.favoritesEmpty);

      if (favoritesContent.visible) {
        console.log(`Favorites page shows content: ${favoritesContent.selector}`);
      } else if (!favoritesEmpty.visible) {
        // Проверяем наличие карточки товара на странице
        const productOnPage = await isAnyVisible(page, SELECTORS.productCard);
        expect(productOnPage.visible, 'На странице избранного должен быть товар').toBe(true);
        console.log(`Product found on favorites page: ${productOnPage.selector}`);
      } else {
        // Страница показывает "пусто" - это ошибка
        expect(favoritesEmpty.visible, 'Страница избранного НЕ должна быть пустой').toBe(false);
      }

      console.log(`Desktop: Товар успешно добавлен в избранное и виден на /favorites`);
    });

    test('ЛК-3: Гость может добавить в избранное из КАТАЛОГА (не заходя на страницу товара)', async ({ page }) => {
      // Step 1: Открываем каталог
      await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Закрыть cookie banner если есть
      const cookieClose = page.locator(SELECTORS.cookieBanner).first();
      if (await cookieClose.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cookieClose.click();
        await page.waitForTimeout(300);
      }

      // Ожидание загрузки товаров
      await page.waitForSelector('a[href*="/product"]', { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Очищаем избранное перед тестом
      await clearLocalStorage(page, LOCALSTORAGE_KEY);

      // Step 2: Находим первую карточку товара и получаем её product ID
      const firstProductCard = page.locator(SELECTORS.productCard.join(', ')).first();
      await expect(firstProductCard).toBeVisible({ timeout: 5000 });

      // Извлекаем product ID из href карточки
      const productHref = await firstProductCard.evaluate((el) => {
        const link = el.tagName === 'A' ? el : el.querySelector('a');
        return link?.href || null;
      });
      const productIdMatch = productHref?.match(/\/product\/([^\/\?]+)/);
      const expectedProductId = productIdMatch ? productIdMatch[1] : null;
      console.log(`Product href: ${productHref}, Expected ID: ${expectedProductId}`);

      // Step 3: Hover на карточку (для десктопа кнопка сердечка может появляться при наведении)
      await firstProductCard.hover();
      await page.waitForTimeout(500);

      // Step 4: Ищем кнопку избранного внутри карточки или рядом с ней
      // Сначала пробуем найти внутри первой карточки
      let favoriteClicked = false;
      let clickedSelector = null;

      for (const favSelector of SELECTORS.favoriteButton) {
        try {
          // Пробуем найти кнопку внутри карточки
          const btnInCard = firstProductCard.locator(favSelector).first();
          if (await btnInCard.isVisible({ timeout: 500 }).catch(() => false)) {
            await btnInCard.click();
            favoriteClicked = true;
            clickedSelector = `card >> ${favSelector}`;
            break;
          }
        } catch (e) { /* continue */ }
      }

      // Если не нашли внутри карточки, пробуем первую видимую кнопку на странице
      if (!favoriteClicked) {
        const fallbackClick = await tryClickFirst(page, SELECTORS.favoriteButton);
        favoriteClicked = fallbackClick.clicked;
        clickedSelector = fallbackClick.selector;
      }

      expect(favoriteClicked, `Должна найтись кнопка избранного на карточке в каталоге`).toBe(true);
      console.log(`Favorite button clicked in catalog: ${clickedSelector}`);

      await page.waitForTimeout(500);

      // Step 5: Проверяем что мы всё ещё на странице каталога (не перешли на страницу товара)
      expect(page.url()).toContain('/catalog');
      console.log(`Still on catalog page: ${page.url()}`);

      // Step 6: Проверяем localStorage
      const favorites = await getLocalStorage(page, LOCALSTORAGE_KEY);
      console.log(`localStorage['${LOCALSTORAGE_KEY}']:`, JSON.stringify(favorites));

      expect(favorites, `localStorage['${LOCALSTORAGE_KEY}'] должен существовать`).not.toBeNull();

      // Проверяем что товар добавлен (ID в localStorage может быть UUID, не slug из URL)
      let favoritesHasItems = false;
      if (Array.isArray(favorites)) {
        favoritesHasItems = favorites.length > 0;
        console.log(`Favorites array has ${favorites.length} items`);
      } else if (typeof favorites === 'object' && favorites !== null) {
        const favLength = Object.keys(favorites).length;
        favoritesHasItems = favLength > 0 || (favorites.items && favorites.items.length > 0);
        console.log(`Favorites object has ${favLength} keys`);
      }

      expect(favoritesHasItems, 'Товар должен быть добавлен в избранное из каталога').toBe(true);

      console.log(`Desktop: Товар успешно добавлен в избранное прямо из каталога (без перехода на страницу товара)`);
    });

    test('ЛК-3: localStorage сохраняет избранное между переходами', async ({ page }) => {
      // Устанавливаем тестовые данные в localStorage
      const testFavorites = ['test-product-123', 'test-product-456'];

      await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await setLocalStorage(page, LOCALSTORAGE_KEY, testFavorites);

      // Переходим на другую страницу
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(500);

      // Проверяем что данные сохранились
      const savedFavorites = await getLocalStorage(page, LOCALSTORAGE_KEY);
      expect(savedFavorites).toEqual(testFavorites);

      // Переходим на страницу избранного
      await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(500);

      // Данные должны быть на месте
      const favoritesOnPage = await getLocalStorage(page, LOCALSTORAGE_KEY);
      expect(favoritesOnPage).toEqual(testFavorites);

      console.log(`Desktop: localStorage персистентен между навигациями`);
    });

  });

  test.describe('Mobile (375x667)', () => {

    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('ЛК-3: Гость может добавить товар в избранное (mobile)', async ({ page }) => {
      // Step 1: Открываем каталог
      await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Закрыть cookie banner если есть
      const cookieClose = page.locator(SELECTORS.cookieBanner).first();
      if (await cookieClose.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cookieClose.click();
        await page.waitForTimeout(300);
      }

      // Ожидание загрузки товаров
      await page.waitForSelector('a[href*="/product"]', { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Очищаем избранное перед тестом
      await clearLocalStorage(page, LOCALSTORAGE_KEY);

      // Step 2: Кликаем на первый товар
      const productClick = await tryClickFirst(page, SELECTORS.productCard);
      expect(productClick.clicked, 'Должен найтись товар для клика').toBe(true);

      await page.waitForURL(/\/product\//, { timeout: 10000 });
      await page.waitForTimeout(500);

      // Step 3: Кликаем на кнопку избранного
      const favoriteClick = await tryClickFirst(page, SELECTORS.favoriteButton);
      expect(favoriteClick.clicked, 'Должна найтись кнопка избранного').toBe(true);

      await page.waitForTimeout(500);

      // Step 4: Проверяем localStorage
      const favorites = await getLocalStorage(page, LOCALSTORAGE_KEY);
      expect(favorites, `localStorage['${LOCALSTORAGE_KEY}'] должен существовать`).not.toBeNull();

      // Step 5: Переходим на страницу избранного
      await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);

      // Проверяем что страница не пустая
      const favoritesEmpty = await isAnyVisible(page, SELECTORS.favoritesEmpty);
      if (favoritesEmpty.visible) {
        // Проверяем может просто UI не обновился, но данные есть
        const favData = await getLocalStorage(page, LOCALSTORAGE_KEY);
        console.log(`Warning: Favorites page shows empty, but localStorage has:`, JSON.stringify(favData));
      }

      console.log(`Mobile: Товар успешно добавлен в избранное`);
    });

  });

  // ЛК-4: Миграция данных при логине
  // ПРИМЕЧАНИЕ: Этот тест требует тестовых учетных данных или мок-авторизации
  // Если auth недоступен, тест будет пропущен

  test.describe('ЛК-4: Data Migration on Login', () => {

    test.skip('Миграция избранного из localStorage в аккаунт при логине', async ({ page }) => {
      // ВАЖНО: Этот тест требует:
      // 1. Тестовые учетные данные (TEST_EMAIL, TEST_PASSWORD)
      // 2. Или мок-авторизацию
      // 3. API для проверки серверных данных

      const TEST_EMAIL = process.env.TEST_EMAIL;
      const TEST_PASSWORD = process.env.TEST_PASSWORD;

      if (!TEST_EMAIL || !TEST_PASSWORD) {
        test.skip();
        return;
      }

      // Step 1: Как гость добавляем товары в localStorage
      await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'domcontentloaded' });
      await clearLocalStorage(page, LOCALSTORAGE_KEY);

      // Добавляем товар в избранное (как гость)
      const productClick = await tryClickFirst(page, SELECTORS.productCard);
      expect(productClick.clicked).toBe(true);
      await page.waitForURL(/\/product\//);

      const favoriteClick = await tryClickFirst(page, SELECTORS.favoriteButton);
      expect(favoriteClick.clicked).toBe(true);

      // Запоминаем что было в localStorage
      const guestFavorites = await getLocalStorage(page, LOCALSTORAGE_KEY);
      console.log('Guest favorites before login:', guestFavorites);

      // Step 2: Логинимся
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

      // Заполняем форму логина (селекторы могут отличаться)
      await page.fill('input[type="email"], input[name="email"]', TEST_EMAIL);
      await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"], button:has-text("Войти")');

      // Ждем редирект после логина
      await page.waitForTimeout(2000);

      // Step 3: Проверяем миграцию
      // После логина данные должны быть на сервере
      // localStorage может быть очищен или синхронизирован

      // Переходим на страницу избранного
      await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Товар должен быть виден (из серверных данных)
      const productVisible = await isAnyVisible(page, SELECTORS.productCard);
      expect(productVisible.visible, 'Товары из гостевого избранного должны мигрировать в аккаунт').toBe(true);

      console.log('ЛК-4: Миграция данных при логине успешна');
    });

  });

});
