const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOT_DIR = 'C:/sts/projects/ando/tests/screenshots/verification';

async function takeVerificationScreenshots() {
  const browser = await chromium.launch({ headless: true });

  console.log('=== Проверка правок ===\n');

  // =====================================
  // Правка 16: Размеры - обводка и hover
  // =====================================
  console.log('--- Правка 16: Размеры (обводка и hover) ---');

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const desktopPage = await desktopContext.newPage();

  try {
    // Открываем каталог
    await desktopPage.goto('http://localhost:8080/catalog', { waitUntil: 'networkidle', timeout: 10000 });
    await desktopPage.waitForTimeout(1000);

    // Кликаем на первый товар для открытия карточки
    const productCard = await desktopPage.locator('.product-card, [class*="product"], a[href*="/product"]').first();
    if (await productCard.count() > 0) {
      await productCard.click();
      await desktopPage.waitForTimeout(1500);
    }

    // Ищем кнопки размеров
    const sizeButtons = await desktopPage.locator('.size-option, [class*="size"], button:has-text("S"), button:has-text("M"), button:has-text("L")');

    // Скриншот начального состояния кнопок размеров
    // Пробуем найти контейнер с размерами
    const sizesContainer = await desktopPage.locator('[class*="size"], .sizes, .product-sizes').first();

    if (await sizesContainer.count() > 0) {
      await sizesContainer.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify-16-sizes-initial.png') });
      console.log('  [OK] verify-16-sizes-initial.png - скриншот размеров сохранён');
    } else {
      // Делаем скриншот всей страницы товара
      await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify-16-sizes-initial.png'), fullPage: false });
      console.log('  [OK] verify-16-sizes-initial.png - скриншот страницы товара сохранён');
    }

    // Пробуем навести мышь на кнопку размера для hover эффекта
    const sizeButton = await desktopPage.locator('.size-option, [class*="size-btn"], button:has-text("M"), button:has-text("L")').first();
    if (await sizeButton.count() > 0) {
      await sizeButton.hover();
      await desktopPage.waitForTimeout(300);

      if (await sizesContainer.count() > 0) {
        await sizesContainer.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify-16-sizes-hover.png') });
      } else {
        await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify-16-sizes-hover.png'), fullPage: false });
      }
      console.log('  [OK] verify-16-sizes-hover.png - скриншот hover состояния сохранён');
    } else {
      console.log('  [!] Кнопки размеров не найдены для hover');
    }

  } catch (err) {
    console.log('  [ERROR] Правка 16:', err.message);
    await desktopPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify-16-sizes-initial.png'), fullPage: false });
  }

  await desktopContext.close();

  // =====================================
  // Правка М6: Мобильная нижняя панель
  // =====================================
  console.log('\n--- Правка М6: Мобильная нижняя панель ---');

  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const mobilePage = await mobileContext.newPage();

  try {
    // Главная страница
    await mobilePage.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout: 10000 });
    await mobilePage.waitForTimeout(1000);

    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify-m6-bottom-nav.png'), fullPage: false });
    console.log('  [OK] verify-m6-bottom-nav.png - главная страница (мобильная)');

    // Каталог
    await mobilePage.goto('http://localhost:8080/catalog', { waitUntil: 'networkidle', timeout: 10000 });
    await mobilePage.waitForTimeout(1000);

    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify-m6-bottom-nav-catalog.png'), fullPage: false });
    console.log('  [OK] verify-m6-bottom-nav-catalog.png - каталог (мобильная)');

  } catch (err) {
    console.log('  [ERROR] Правка М6:', err.message);
  }

  await mobileContext.close();
  await browser.close();

  console.log('\n=== Скриншоты сохранены в', SCREENSHOT_DIR, '===');
}

takeVerificationScreenshots().catch(console.error);
