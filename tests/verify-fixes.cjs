const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'verification');
const BASE_URL = 'http://localhost:8080';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVerification() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  const results = [];

  try {
    // ========================================
    // Правка 14.1+14: Каталог - Badge NEW и SALE
    // ========================================
    console.log('\n=== Правка 14.1+14: Проверка badge в каталоге ===');
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle' });
    await delay(2000);

    // Скриншот карточек товаров
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'verify-14-catalog-badges.png'),
      fullPage: false
    });
    console.log('Скриншот: verify-14-catalog-badges.png');

    // Проверка стилей badge
    const badgeCheck = await page.evaluate(() => {
      const allSpans = document.querySelectorAll('span');
      const result = { newBadge: null, saleBadge: null };

      allSpans.forEach(span => {
        const text = span.textContent?.trim();
        if (text === 'NEW' || text === 'SALE') {
          const style = window.getComputedStyle(span);
          const info = {
            text: text,
            backgroundColor: style.backgroundColor,
            color: style.color,
            borderRadius: style.borderRadius
          };
          if (text === 'NEW') result.newBadge = info;
          if (text === 'SALE') result.saleBadge = info;
        }
      });

      return result;
    });

    console.log('Badge NEW:', badgeCheck.newBadge);
    console.log('Badge SALE:', badgeCheck.saleBadge);

    results.push({
      fix: '14.1+14 (каталог badges)',
      screenshot: path.join(SCREENSHOT_DIR, 'verify-14-catalog-badges.png'),
      details: badgeCheck
    });

    // ========================================
    // Правка 14: Избранное
    // ========================================
    console.log('\n=== Правка 14: Проверка badge в избранном ===');

    // Добавим товар в избранное - ищем кнопку с сердечком
    try {
      // Ищем SVG иконку сердца или кнопку избранного
      const heartButton = await page.$('button:has(svg[data-lucide="heart"]), button:has(svg.lucide-heart), [class*="favorite"], [class*="wishlist"]');
      if (heartButton) {
        await heartButton.click();
        await delay(500);
        console.log('Товар добавлен в избранное через кнопку');
      } else {
        // Кликаем на первую кнопку в карточке товара
        const firstCard = await page.$('article, [class*="card"], [class*="product"]');
        if (firstCard) {
          const btn = await firstCard.$('button');
          if (btn) {
            await btn.click();
            await delay(500);
            console.log('Кликнули на кнопку в карточке');
          }
        }
      }
    } catch (e) {
      console.log('Не удалось добавить в избранное:', e.message);
    }

    await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'networkidle' });
    await delay(1000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'verify-14-favorites-badges.png'),
      fullPage: false
    });
    console.log('Скриншот: verify-14-favorites-badges.png');

    // Проверка badge в избранном
    const favoritesBadgeCheck = await page.evaluate(() => {
      const allSpans = document.querySelectorAll('span');
      const result = { newBadge: null, saleBadge: null, isEmpty: true };

      allSpans.forEach(span => {
        const text = span.textContent?.trim();
        if (text === 'NEW' || text === 'SALE') {
          result.isEmpty = false;
          const style = window.getComputedStyle(span);
          const info = {
            text: text,
            backgroundColor: style.backgroundColor,
            color: style.color,
            borderRadius: style.borderRadius
          };
          if (text === 'NEW') result.newBadge = info;
          if (text === 'SALE') result.saleBadge = info;
        }
      });

      // Проверяем есть ли товары на странице
      const pageText = document.body.textContent;
      if (pageText.includes('пусто') || pageText.includes('Пусто') || pageText.includes('нет товаров')) {
        result.isEmpty = true;
      }

      return result;
    });

    console.log('Favorites badges:', favoritesBadgeCheck);

    results.push({
      fix: '14 (избранное badges)',
      screenshot: path.join(SCREENSHOT_DIR, 'verify-14-favorites-badges.png'),
      details: favoritesBadgeCheck
    });

    // ========================================
    // Правка 18: Каталог - без кружков, размеры справа
    // ========================================
    console.log('\n=== Правка 18: Проверка layout карточки товара ===');
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle' });
    await delay(1000);

    // Найдём первую карточку товара и сделаем её скриншот
    const productCard = await page.$('article, [class*="ProductCard"], [class*="product-card"]');
    if (productCard) {
      await productCard.screenshot({
        path: path.join(SCREENSHOT_DIR, 'verify-18-catalog-layout.png')
      });
      console.log('Скриншот карточки товара');
    } else {
      // Скриншот области с карточками
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'verify-18-catalog-layout.png'),
        clip: { x: 0, y: 100, width: 600, height: 500 }
      });
      console.log('Скриншот области каталога');
    }
    console.log('Скриншот: verify-18-catalog-layout.png');

    // Проверка наличия цветовых кружков и размеров
    const layoutCheck = await page.evaluate(() => {
      // Ищем элементы с круглой формой (потенциальные цветовые кружки)
      const allElements = document.querySelectorAll('*');
      let colorCircleElements = [];

      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const borderRadius = style.borderRadius;
        const width = parseFloat(style.width);
        const height = parseFloat(style.height);

        // Круглые элементы 10-30px - вероятно цветовые кружки
        if ((borderRadius === '50%' || borderRadius === '9999px' || parseFloat(borderRadius) >= 10)
            && width > 10 && width < 40
            && Math.abs(width - height) < 2
            && style.display !== 'none') {
          colorCircleElements.push({
            tag: el.tagName,
            class: el.className,
            size: `${width}x${height}`,
            bg: style.backgroundColor
          });
        }
      });

      // Ищем размеры в карточках товаров
      const cards = document.querySelectorAll('article, [class*="card"], [class*="product"]');
      let sizesInfo = [];

      cards.forEach((card, i) => {
        if (i > 2) return; // Проверяем первые 3 карточки
        const text = card.textContent;
        const sizeMatch = text.match(/\b(XS|S|M|L|XL|XXL|XXXL|\d{2})\b/g);
        if (sizeMatch) {
          sizesInfo.push({
            cardIndex: i,
            sizes: [...new Set(sizeMatch)]
          });
        }
      });

      return {
        colorCirclesFound: colorCircleElements.length > 0,
        colorCircleCount: colorCircleElements.length,
        colorCircleDetails: colorCircleElements.slice(0, 5),
        sizesInfo: sizesInfo
      };
    });

    console.log('Проверка layout:', JSON.stringify(layoutCheck, null, 2));

    results.push({
      fix: '18 (каталог layout)',
      screenshot: path.join(SCREENSHOT_DIR, 'verify-18-catalog-layout.png'),
      details: layoutCheck
    });

    // ========================================
    // Правка 19: Навигация
    // ========================================
    console.log('\n=== Правка 19: Проверка навигации ===');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await delay(1000);

    // Скриншот шапки
    const header = await page.$('header');
    if (header) {
      await header.screenshot({
        path: path.join(SCREENSHOT_DIR, 'verify-19-navigation.png')
      });
      console.log('Скриншот header');
    } else {
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'verify-19-navigation.png'),
        clip: { x: 0, y: 0, width: 1440, height: 150 }
      });
      console.log('Скриншот верхней части страницы');
    }
    console.log('Скриншот: verify-19-navigation.png');

    // Проверка текста навигации
    const navCheck = await page.evaluate(() => {
      const header = document.querySelector('header');
      const nav = document.querySelector('nav');
      const headerText = (header?.textContent || '') + (nav?.textContent || '');

      return {
        hasZhenskoe: headerText.toUpperCase().includes('ЖЕНСКОЕ'),
        hasMuzhskoe: headerText.toUpperCase().includes('МУЖСКОЕ'),
        hasDlyaNee: headerText.toUpperCase().includes('ДЛЯ НЕЁ') || headerText.toUpperCase().includes('ДЛЯ НЕЕ'),
        hasDlyaNego: headerText.toUpperCase().includes('ДЛЯ НЕГО'),
        navLinks: Array.from(document.querySelectorAll('header a, nav a')).map(a => a.textContent.trim()).filter(t => t.length > 0 && t.length < 30)
      };
    });

    console.log('Проверка навигации:', JSON.stringify(navCheck, null, 2));

    results.push({
      fix: '19 (навигация)',
      screenshot: path.join(SCREENSHOT_DIR, 'verify-19-navigation.png'),
      details: navCheck
    });

  } catch (error) {
    console.error('Ошибка:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }

  // Итоговый отчёт
  console.log('\n\n========================================');
  console.log('ИТОГОВЫЙ ОТЧЁТ');
  console.log('========================================\n');

  results.forEach(r => {
    console.log(`\n--- ${r.fix} ---`);
    console.log(`Скриншот: ${r.screenshot}`);
    console.log('Детали:', JSON.stringify(r.details, null, 2));
  });

  return results;
}

runVerification().catch(console.error);
