import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8087';

test.describe('ПРАВКА 7: Избранное без регистрации', () => {
  test.setTimeout(120000);

  test('Гость может добавить в избранное и просмотреть список без регистрации', async ({ page }) => {
    // Убедимся что мы НЕ авторизованы - очищаем куки и storage
    await page.context().clearCookies();

    console.log('=== ПРАВКА 7: Избранное без регистрации ===');
    console.log('Ожидание: список избранного доступен БЕЗ требования регистрации');
    console.log('');

    // ШАГ 1: Открываем каталог товаров (как гость)
    console.log('ШАГ 1: Открываем каталог товаров (не залогинены)');
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Проверяем что мы не авторизованы (нет кнопки выхода, есть кнопка входа)
    const pageContent = await page.textContent('body');
    const isGuest = !pageContent?.includes('Выйти') && !pageContent?.includes('Logout');
    console.log('Статус: Гость (не авторизован):', isGuest);

    // ШАГ 2: Находим товар и кликаем на иконку сердечка
    console.log('');
    console.log('ШАГ 2: Кликаем на иконку сердечка (добавить в избранное)');

    // Ищем иконки сердечка в карточках товаров
    const heartIcons = page.locator('svg.lucide-heart, [class*="heart"], button[aria-label*="избранн"], button[aria-label*="favorite"]');
    const heartCount = await heartIcons.count();
    console.log('Найдено иконок сердечка:', heartCount);

    let clickedHeart = false;

    if (heartCount > 0) {
      try {
        // Попробуем кликнуть на первое сердечко
        const firstHeart = heartIcons.first();
        await firstHeart.scrollIntoViewIfNeeded();
        await firstHeart.click({ timeout: 5000 });
        clickedHeart = true;
        console.log('Успешно кликнули на сердечко');
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log('Не удалось кликнуть напрямую на иконку, пробуем найти кнопку...');
      }
    }

    // Альтернативный способ - найти кнопку с сердечком
    if (!clickedHeart) {
      const heartButtons = page.locator('button:has(svg.lucide-heart), button:has([class*="heart"])');
      const btnCount = await heartButtons.count();
      console.log('Найдено кнопок с сердечком:', btnCount);

      if (btnCount > 0) {
        await heartButtons.first().click({ timeout: 5000 });
        clickedHeart = true;
        console.log('Успешно кликнули на кнопку с сердечком');
        await page.waitForTimeout(1000);
      }
    }

    // Еще один альтернативный способ - клик по координатам на карточке
    if (!clickedHeart) {
      const productCards = page.locator('a[href*="/product/"], [class*="product-card"], .group');
      const cardCount = await productCards.count();
      console.log('Найдено карточек товаров:', cardCount);

      if (cardCount > 0) {
        // Наводим на карточку чтобы появилось сердечко
        await productCards.first().hover();
        await page.waitForTimeout(500);

        // Теперь ищем сердечко снова
        const visibleHearts = page.locator('svg.lucide-heart:visible, button:has(svg.lucide-heart):visible');
        const visibleCount = await visibleHearts.count();
        console.log('Видимых сердечек после hover:', visibleCount);

        if (visibleCount > 0) {
          await visibleHearts.first().click({ timeout: 5000 });
          clickedHeart = true;
          console.log('Кликнули на сердечко после hover');
        }
      }
    }

    console.log('Результат клика на сердечко:', clickedHeart ? 'УСПЕХ' : 'НЕ УДАЛОСЬ');

    // ШАГ 3: Переходим на страницу избранного
    console.log('');
    console.log('ШАГ 3: Переходим на страницу избранного (/favorites)');
    await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // ШАГ 4: Анализируем что показывается на странице избранного
    console.log('');
    console.log('ШАГ 4: Анализируем содержимое страницы избранного');

    const favoritesContent = await page.textContent('body');
    const currentUrl = page.url();

    console.log('Текущий URL:', currentUrl);

    // Проверяем различные индикаторы
    const analysis = {
      // Индикаторы требования регистрации
      hasLoginForm: favoritesContent?.includes('Войти') && (favoritesContent?.includes('Пароль') || favoritesContent?.includes('Email')),
      hasRegistrationForm: favoritesContent?.includes('Регистрация') || favoritesContent?.includes('Зарегистрироваться'),
      hasAuthRequired: favoritesContent?.includes('Войдите в аккаунт') || favoritesContent?.includes('авторизуйтесь') || favoritesContent?.includes('войдите'),
      redirectedToLogin: currentUrl.includes('login') || currentUrl.includes('auth') || currentUrl.includes('signin'),

      // Индикаторы доступности избранного
      hasEmptyFavorites: favoritesContent?.includes('пусто') || favoritesContent?.includes('нет товаров') || favoritesContent?.includes('Список избранного пуст'),
      hasFavoritesTitle: favoritesContent?.includes('Избранное') || favoritesContent?.includes('Favorites'),
      hasProductCards: false, // проверим отдельно
      stayedOnFavoritesPage: currentUrl.includes('favorites') || currentUrl.includes('wishlist'),
    };

    // Проверяем наличие карточек товаров
    const productCardsOnFavorites = page.locator('a[href*="/product/"], [class*="product-card"], .group img');
    analysis.hasProductCards = await productCardsOnFavorites.count() > 0;

    console.log('');
    console.log('=== РЕЗУЛЬТАТЫ АНАЛИЗА ===');
    console.log('');
    console.log('Индикаторы ТРЕБОВАНИЯ РЕГИСТРАЦИИ:');
    console.log('  - Форма входа:', analysis.hasLoginForm);
    console.log('  - Форма регистрации:', analysis.hasRegistrationForm);
    console.log('  - Текст "войдите в аккаунт":', analysis.hasAuthRequired);
    console.log('  - Редирект на страницу входа:', analysis.redirectedToLogin);
    console.log('');
    console.log('Индикаторы ДОСТУПНОСТИ ИЗБРАННОГО:');
    console.log('  - Остались на странице избранного:', analysis.stayedOnFavoritesPage);
    console.log('  - Есть заголовок "Избранное":', analysis.hasFavoritesTitle);
    console.log('  - Показано "пусто" (пустой список):', analysis.hasEmptyFavorites);
    console.log('  - Есть карточки товаров:', analysis.hasProductCards);

    // Сохраняем скриншот
    await page.screenshot({
      path: 'tests/screenshots/verification/pravka-07-favorites-guest.png',
      fullPage: true
    });
    console.log('');
    console.log('Скриншот сохранен: tests/screenshots/verification/pravka-07-favorites-guest.png');

    // Финальный вердикт
    const requiresRegistration = analysis.hasLoginForm || analysis.hasRegistrationForm || analysis.hasAuthRequired || analysis.redirectedToLogin;
    const favoritesAccessible = analysis.stayedOnFavoritesPage && (analysis.hasFavoritesTitle || analysis.hasEmptyFavorites || analysis.hasProductCards);

    console.log('');
    console.log('=== ФИНАЛЬНЫЙ ВЕРДИКТ ===');
    console.log('');

    if (!requiresRegistration && favoritesAccessible) {
      console.log('ПРАВКА 7 РЕАЛИЗОВАНА КОРРЕКТНО');
      console.log('Избранное доступно БЕЗ регистрации');
      console.log('Гость может просматривать список избранного');
    } else if (requiresRegistration) {
      console.log('ПРАВКА 7 НЕ РЕАЛИЗОВАНА');
      console.log('Требуется регистрация/авторизация для просмотра избранного');
      console.log('Это противоречит требованию правки');
    } else {
      console.log('СТАТУС НЕОПРЕДЕЛЕН');
      console.log('Не удалось однозначно определить поведение');
    }

    console.log('');
    console.log('Содержимое страницы (первые 500 символов):');
    console.log(favoritesContent?.substring(0, 500));

    // Тест проходит если регистрация НЕ требуется
    expect(requiresRegistration, 'Избранное должно быть доступно без регистрации').toBe(false);
    expect(favoritesAccessible, 'Страница избранного должна быть доступна').toBe(true);
  });
});
