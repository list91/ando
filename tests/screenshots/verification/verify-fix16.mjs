import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = 'C:/sts/projects/ando/tests/screenshots/verification';

async function verifyFix16() {
  const browser = await chromium.launch({ headless: true });

  console.log('--- Правка 16: Размеры (обводка и hover) ---');

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    // Открываем каталог
    console.log('  Открываем каталог...');
    await page.goto('http://localhost:8080/catalog', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    // Получаем HTML для анализа
    const catalogHTML = await page.content();
    console.log('  Каталог загружен, ищем товары...');

    // Кликаем на первый товар
    const productLink = page.locator('a[href*="/product"], .product-card a, [class*="product"] a').first();
    if (await productLink.count() > 0) {
      const href = await productLink.getAttribute('href');
      console.log('  Найдена ссылка на товар:', href);
      await productLink.click();
      await page.waitForTimeout(2000);
    } else {
      // Пробуем открыть товар напрямую
      console.log('  Пробуем открыть товар напрямую...');
      await page.goto('http://localhost:8080/product/1', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
    }

    console.log('  Текущий URL:', page.url());

    // Делаем полный скриншот страницы товара
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'verify-16-product-page-full.png'),
      fullPage: true
    });
    console.log('  [OK] verify-16-product-page-full.png - полная страница товара');

    // Ищем кнопки размеров по тексту
    const sizesLocators = [
      page.locator('button:has-text("S")'),
      page.locator('button:has-text("M")'),
      page.locator('[class*="size"]'),
      page.locator('[data-size]'),
      page.locator('.size-btn'),
      page.locator('.size-option')
    ];

    let foundSizes = false;
    for (const loc of sizesLocators) {
      if (await loc.count() > 0) {
        console.log('  Найдены кнопки размеров');
        foundSizes = true;
        break;
      }
    }

    // Скриншот viewport (видимой области) - должен показать кнопки размеров если они есть
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'verify-16-sizes-initial.png'),
      fullPage: false
    });
    console.log('  [OK] verify-16-sizes-initial.png');

    // Пробуем найти и навести на кнопку размера
    const sizeBtn = page.locator('button:has-text("M"), button:has-text("L"), button:has-text("S")').first();
    if (await sizeBtn.count() > 0) {
      const box = await sizeBtn.boundingBox();
      if (box) {
        console.log('  Наводим мышь на кнопку размера...');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);

        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'verify-16-sizes-hover.png'),
          fullPage: false
        });
        console.log('  [OK] verify-16-sizes-hover.png - hover состояние');
      }
    } else {
      // Ищем по классам
      const altSizeBtn = page.locator('[class*="size"]:not(nav):not(header)').first();
      if (await altSizeBtn.count() > 0) {
        await altSizeBtn.hover();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'verify-16-sizes-hover.png'),
          fullPage: false
        });
        console.log('  [OK] verify-16-sizes-hover.png');
      } else {
        console.log('  [!] Кнопки размеров не найдены, делаем скриншот страницы');
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'verify-16-sizes-hover.png'),
          fullPage: false
        });
      }
    }

    // Выводим структуру страницы для анализа
    const pageContent = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const btnTexts = Array.from(buttons).map(b => b.textContent?.trim()).filter(Boolean);
      return { buttons: btnTexts.slice(0, 20) };
    });
    console.log('  Кнопки на странице:', pageContent.buttons);

  } catch (err) {
    console.log('  [ERROR]:', err.message);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'verify-16-error.png'),
      fullPage: false
    });
  }

  await context.close();
  await browser.close();
  console.log('  Готово!');
}

verifyFix16().catch(console.error);
