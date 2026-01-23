import { test, expect } from '@playwright/test';

test('Глубокая проверка скролла и навигации', async ({ page }) => {
  await page.goto('https://andojv.com', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Закрываем cookie banner если есть
  const acceptBtn = page.locator('button:has-text("Принять")');
  if (await acceptBtn.isVisible()) {
    await acceptBtn.click();
    await page.waitForTimeout(500);
  }
  
  // Проверяем размеры страницы
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  
  console.log('=== Размеры страницы ===');
  console.log('Высота страницы:', pageHeight);
  console.log('Высота viewport:', viewportHeight);
  console.log('Есть контент ниже viewport:', pageHeight > viewportHeight);
  
  // Скриншот до скролла
  await page.screenshot({ 
    path: 'tests/screenshots/scroll-test-01-before.png',
    fullPage: false 
  });
  
  // Пробуем разные методы скролла
  console.log('\n=== Тесты скролла ===');
  
  // 1. wheel event
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1500);
  let scrollY1 = await page.evaluate(() => window.scrollY);
  console.log('После wheel(0, 500):', scrollY1);
  
  await page.screenshot({ 
    path: 'tests/screenshots/scroll-test-02-after-wheel.png',
    fullPage: false 
  });
  
  // 2. Keyboard scroll
  await page.keyboard.press('PageDown');
  await page.waitForTimeout(1500);
  let scrollY2 = await page.evaluate(() => window.scrollY);
  console.log('После PageDown:', scrollY2);
  
  await page.screenshot({ 
    path: 'tests/screenshots/scroll-test-03-after-pagedown.png',
    fullPage: false 
  });
  
  // 3. Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  let scrollY3 = await page.evaluate(() => window.scrollY);
  console.log('После scrollTo bottom:', scrollY3);
  
  await page.screenshot({ 
    path: 'tests/screenshots/scroll-test-04-scrolled-bottom.png',
    fullPage: false 
  });
  
  // Проверяем наличие секций на странице
  console.log('\n=== Структура страницы ===');
  const sections = await page.evaluate(() => {
    const els = document.querySelectorAll('section, [class*="section"], [class*="hero"], [class*="category"]');
    return Array.from(els).map(el => ({
      tag: el.tagName,
      class: el.className,
      id: el.id
    }));
  });
  console.log('Найденные секции:', JSON.stringify(sections, null, 2));
  
  // Проверяем CSS стили scroll
  const hasScrollSnap = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    return {
      htmlOverflow: getComputedStyle(html).overflow,
      bodyOverflow: getComputedStyle(body).overflow,
      htmlScrollSnap: getComputedStyle(html).scrollSnapType,
      bodyScrollSnap: getComputedStyle(body).scrollSnapType
    };
  });
  console.log('\nCSS scroll стили:', hasScrollSnap);
  
  // Проверяем ссылки навигации
  console.log('\n=== Навигация ===');
  const navLinks = await page.locator('header a, nav a').all();
  for (const link of navLinks) {
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    console.log(`  "${text?.trim()}" -> ${href}`);
  }
  
  // Кликаем на "ДЛЯ НЕЁ" и смотрим что происходит
  console.log('\n=== Клик на "ДЛЯ НЕЁ" ===');
  await page.goto('https://andojv.com', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const forHerLink = page.locator('a:has-text("ДЛЯ НЕЁ")').first();
  if (await forHerLink.isVisible()) {
    await forHerLink.click();
    await page.waitForTimeout(2000);
    console.log('URL после клика:', page.url());
    
    await page.screenshot({ 
      path: 'tests/screenshots/scroll-test-05-after-click-for-her.png',
      fullPage: false 
    });
  }
});
