import { test, expect } from '@playwright/test';

test.describe('Проверка правок 17 и 19 - andojv.com', () => {
  
  test('Правка 17: Скролл колесом мыши на главной', async ({ page }) => {
    await page.goto('https://andojv.com', { waitUntil: 'networkidle' });
    
    // Скриншот главной страницы (начальное состояние)
    await page.screenshot({ 
      path: 'tests/screenshots/pravka17-01-homepage-initial.png',
      fullPage: false 
    });
    
    // Ждем загрузки страницы
    await page.waitForTimeout(2000);
    
    // Пробуем скролл колесом мыши
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1500);
    
    // Скриншот после скролла
    await page.screenshot({ 
      path: 'tests/screenshots/pravka17-02-after-scroll.png',
      fullPage: false 
    });
    
    // Проверяем, произошел ли переход к секции
    const currentUrl = page.url();
    const scrollY = await page.evaluate(() => window.scrollY);
    
    console.log('URL после скролла:', currentUrl);
    console.log('ScrollY после скролла:', scrollY);
    
    // Проверяем наличие секции "Женское" или "Для нее"
    const womenSection = await page.locator('text=/Женское|Для нее/i').first();
    const isWomenSectionVisible = await womenSection.isVisible().catch(() => false);
    
    console.log('Секция Женское/Для нее видна:', isWomenSectionVisible);
  });

  test('Правка 19: Названия категорий', async ({ page }) => {
    await page.goto('https://andojv.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Скриншот навигации
    await page.screenshot({ 
      path: 'tests/screenshots/pravka19-01-navigation.png',
      fullPage: false 
    });
    
    // Получаем весь текст страницы для поиска категорий
    const pageContent = await page.content();
    
    // Проверяем наличие старых названий
    const hasForHer = pageContent.includes('Для нее') || pageContent.includes('для нее');
    const hasForHim = pageContent.includes('Для него') || pageContent.includes('для него');
    
    // Проверяем наличие новых названий
    const hasWomen = pageContent.includes('Женское') || pageContent.includes('женское');
    const hasMen = pageContent.includes('Мужское') || pageContent.includes('мужское');
    
    console.log('=== Проверка названий категорий ===');
    console.log('Старые названия:');
    console.log('  "Для нее" найдено:', hasForHer);
    console.log('  "Для него" найдено:', hasForHim);
    console.log('Новые названия:');
    console.log('  "Женское" найдено:', hasWomen);
    console.log('  "Мужское" найдено:', hasMen);
    
    // Ищем навигационные элементы
    const navLinks = await page.locator('nav a, header a, .nav a, .menu a').allTextContents();
    console.log('\nТексты навигации:', navLinks.filter(t => t.trim()));
    
    // Ищем все ссылки с текстом категорий
    const categoryLinks = await page.locator('a').allTextContents();
    const relevantLinks = categoryLinks.filter(t => 
      t.includes('Женское') || t.includes('Мужское') || 
      t.includes('Для нее') || t.includes('Для него') ||
      t.includes('женское') || t.includes('мужское')
    );
    console.log('\nСсылки с категориями:', relevantLinks);
    
    // Скролл вниз для поиска категорий на странице
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'tests/screenshots/pravka19-02-categories-section.png',
      fullPage: false 
    });
    
    // Full page screenshot
    await page.goto('https://andojv.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'tests/screenshots/pravka19-03-fullpage.png',
      fullPage: true 
    });
  });

  test('Детальная проверка главной страницы', async ({ page }) => {
    await page.goto('https://andojv.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Получаем все текстовые элементы
    const allText = await page.evaluate(() => document.body.innerText);
    
    console.log('=== Весь текст страницы ===');
    console.log(allText.substring(0, 3000));
    
    // Проверяем наличие стрелки для скролла
    const scrollArrow = await page.locator('[class*="arrow"], [class*="scroll"], button[aria-label*="scroll"], .scroll-indicator').count();
    console.log('\nЭлементы скролла/стрелки найдено:', scrollArrow);
    
    // Проверяем обработчики wheel event
    const hasWheelHandler = await page.evaluate(() => {
      // Пытаемся найти признаки обработчика wheel
      return document.body.onwheel !== null || 
             window.onwheel !== null ||
             document.documentElement.onwheel !== null;
    });
    console.log('Есть обработчик wheel:', hasWheelHandler);
  });
});
