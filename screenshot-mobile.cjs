const puppeteer = require('puppeteer');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Установка размера viewport для iPhone
    await page.setViewport({
      width: 375,
      height: 812,
      deviceScaleFactor: 2
    });

    console.log('Opening catalog page...');
    await page.goto('http://localhost:8081/catalog', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await delay(2000);

    console.log('Looking for first product...');
    // Ищем первый товар и кликаем на него
    const productSelector = 'a[href*="/product/"], .product-card, [class*="product"]';
    await page.waitForSelector(productSelector, { timeout: 10000 });

    // Получаем список всех товаров
    const products = await page.$$(productSelector);
    console.log(`Found ${products.length} products`);

    if (products.length === 0) {
      throw new Error('No products found on the page');
    }

    // Кликаем на первый товар
    await products[0].click();
    console.log('Clicked on first product');

    // Ждем загрузки страницы товара
    await delay(3000);

    // Закрываем cookie баннер если есть
    console.log('Checking for cookie banner...');
    await page.evaluate(() => {
      // Ищем кнопки с текстом Принять, Отклонить, X
      const buttons = Array.from(document.querySelectorAll('button'));
      const closeButton = buttons.find(btn => {
        const text = btn.textContent.trim();
        return text === 'Принять' || text === 'Отклонить' || text === '×' || text.toLowerCase() === 'accept' || text.toLowerCase() === 'decline';
      });

      if (closeButton) {
        closeButton.click();
        console.log('Cookie banner closed');
      }
    });
    await delay(500);

    console.log('Scrolling to show all sections...');
    // Прокручиваем страницу постепенно вниз
    await page.evaluate(async () => {
      const distance = 150;
      const delay = 150;
      const maxScrolls = 100;

      for (let i = 0; i < maxScrolls; i++) {
        window.scrollBy(0, distance);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Проверяем, достигли ли мы конца страницы
        if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight) {
          // Прокрутим еще немного для загрузки lazy content
          await new Promise(resolve => setTimeout(resolve, 500));
          window.scrollBy(0, 50);
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
        }
      }
    });

    await delay(2000);

    // Проверяем и раскрываем секции ПЕРЕД скриншотом
    console.log('Looking for accordion/tab sections...');
    const sectionInfo = await page.evaluate(() => {
      const clicked = [];
      const allButtons = [];

      // Ищем кнопки или заголовки с текстом ОПИСАНИЕ, УХОД, ДОСТАВКА, ОПЛАТА
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], .accordion, .tab, h2, h3, summary, [class*="accord"], [class*="tab"]'));

      buttons.forEach(btn => {
        const text = btn.textContent.trim().toUpperCase();
        allButtons.push(text.substring(0, 50));

        if (text === 'ОПИСАНИЕ' || text === 'УХОД' || text === 'ДОСТАВКА' || text === 'ОПЛАТА' ||
            text === 'DESCRIPTION' || text === 'CARE' || text === 'DELIVERY' || text === 'PAYMENT') {
          clicked.push(text);
          // Пытаемся кликнуть
          try {
            btn.click();
          } catch (e) {
            // ignore
          }
        }
      });

      return { clicked, allButtons: allButtons.slice(0, 20) };
    });

    console.log('Clicked on sections:', sectionInfo.clicked);
    console.log('Sample of all buttons found:', sectionInfo.allButtons);
    await delay(2000);

    // Прокручиваем к началу страницы для полного скриншота
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await delay(1000);

    console.log('Taking full page screenshot...');
    // Делаем полностраничный скриншот
    await page.screenshot({
      path: 'C:/sts/projects/ando/mobile-test.png',
      fullPage: true
    });

    console.log('Screenshot saved to: C:/sts/projects/ando/mobile-test.png');

    // Также делаем скриншот секций внизу страницы
    console.log('Scrolling to bottom sections...');
    await page.evaluate(() => {
      // Ищем секцию ОПИСАНИЕ
      const elements = Array.from(document.querySelectorAll('*'));
      const descSection = elements.find(el => {
        const text = el.textContent;
        return text && (text.includes('ОПИСАНИЕ') || text.includes('УХОД'));
      });

      if (descSection) {
        descSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Если не нашли, просто прокрутим вниз
        window.scrollTo(0, document.body.scrollHeight * 0.6);
      }
    });

    await delay(2000);

    console.log('Taking bottom sections screenshot...');
    await page.screenshot({
      path: 'C:/sts/projects/ando/mobile-test-bottom.png',
      fullPage: false
    });

    console.log('Bottom screenshot saved to: C:/sts/projects/ando/mobile-test-bottom.png');

    // Проверяем наличие секций
    console.log('\n=== Checking sections visibility ===');

    const sections = await page.evaluate(() => {
      const results = {
        description: false,
        care: false,
        delivery: false,
        payment: false,
        allText: []
      };

      // Ищем текст секций (регистронезависимый поиск)
      const bodyText = document.body.innerText.toUpperCase();

      results.description = bodyText.includes('ОПИСАНИЕ') || bodyText.includes('DESCRIPTION');
      results.care = bodyText.includes('УХОД') || bodyText.includes('CARE');
      results.delivery = bodyText.includes('ДОСТАВКА') || bodyText.includes('DELIVERY');
      results.payment = bodyText.includes('ОПЛАТА') || bodyText.includes('PAYMENT');

      // Получаем все видимые тексты для анализа
      const elements = Array.from(document.querySelectorAll('*'));
      elements.forEach(el => {
        const text = el.innerText;
        if (text && text.length < 100 && text.length > 2) {
          results.allText.push(text.trim());
        }
      });

      return results;
    });

    console.log('Description section visible:', sections.description ? '✓' : '✗');
    console.log('Care section visible:', sections.care ? '✓' : '✗');
    console.log('Delivery section visible:', sections.delivery ? '✓' : '✗');
    console.log('Payment section visible:', sections.payment ? '✓' : '✗');

    // Проверяем проблемы с версткой
    console.log('\n=== Checking layout issues ===');
    const layoutIssues = await page.evaluate(() => {
      const issues = [];
      const viewportWidth = window.innerWidth;

      // Проверяем элементы, выходящие за границы viewport
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > viewportWidth) {
          const computedStyle = window.getComputedStyle(el);
          issues.push({
            tag: el.tagName,
            class: el.className,
            width: rect.width,
            overflow: computedStyle.overflow
          });
        }
      });

      return {
        overflowingElements: issues.length,
        viewportWidth: viewportWidth,
        documentWidth: document.documentElement.scrollWidth
      };
    });

    console.log('Viewport width:', layoutIssues.viewportWidth);
    console.log('Document width:', layoutIssues.documentWidth);
    console.log('Elements overflowing viewport:', layoutIssues.overflowingElements);

    if (layoutIssues.documentWidth > layoutIssues.viewportWidth) {
      console.log('⚠ Warning: Horizontal scrolling detected');
    } else {
      console.log('✓ No horizontal scrolling');
    }

    // Проверяем размеры шрифтов
    console.log('\n=== Checking text readability ===');
    const textInfo = await page.evaluate(() => {
      const texts = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text.length > 0 && text.length < 200) {
          const parent = node.parentElement;
          const style = window.getComputedStyle(parent);
          const fontSize = parseFloat(style.fontSize);

          if (fontSize > 0) {
            texts.push({
              fontSize: fontSize,
              color: style.color,
              text: text.substring(0, 50)
            });
          }
        }
      }

      const fontSizes = texts.map(t => t.fontSize);
      const minFont = Math.min(...fontSizes);
      const maxFont = Math.max(...fontSizes);
      const avgFont = fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length;

      return {
        minFontSize: minFont,
        maxFontSize: maxFont,
        avgFontSize: avgFont.toFixed(1),
        totalTextElements: texts.length
      };
    });

    console.log('Min font size:', textInfo.minFontSize + 'px');
    console.log('Max font size:', textInfo.maxFontSize + 'px');
    console.log('Avg font size:', textInfo.avgFontSize + 'px');
    console.log('Total text elements:', textInfo.totalTextElements);

    if (textInfo.minFontSize < 12) {
      console.log('⚠ Warning: Some text is too small (< 12px)');
    } else {
      console.log('✓ Text sizes are readable');
    }

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
})();
