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
    const productSelector = 'a[href*="/product/"]';
    await page.waitForSelector(productSelector, { timeout: 10000 });

    const products = await page.$$(productSelector);
    console.log(`Found ${products.length} products`);

    if (products.length === 0) {
      throw new Error('No products found on the page');
    }

    await products[0].click();
    console.log('Clicked on first product');

    await delay(3000);

    // Закрываем cookie баннер если есть
    console.log('Checking for cookie banner...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const closeButton = buttons.find(btn => {
        const text = btn.textContent.trim();
        return text === 'Принять' || text === 'Отклонить' || text === '×';
      });

      if (closeButton) {
        closeButton.click();
      }
    });
    await delay(500);

    // Раскрываем все секции (Collapsible)
    console.log('Opening all collapsible sections...');
    await page.evaluate(() => {
      // Ищем все триггеры Collapsible
      const buttons = Array.from(document.querySelectorAll('button'));

      buttons.forEach(btn => {
        const text = btn.textContent.trim().toUpperCase();
        if (text === 'ОПИСАНИЕ' || text === 'УХОД' || text === 'ДОСТАВКА' || text === 'ОПЛАТА') {
          console.log('Clicking on:', text);
          btn.click();
        }
      });
    });

    // Ждем анимации раскрытия
    await delay(2000);

    // Прокручиваем вниз чтобы показать все секции
    console.log('Scrolling down to show all sections...');
    await page.evaluate(() => {
      const descSection = document.querySelector('h3');
      if (descSection) {
        descSection.scrollIntoView({ behavior: 'smooth' });
      }
    });

    await delay(1000);

    // Прокручиваем к началу для полного скриншота
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await delay(1000);

    console.log('Taking full page screenshot...');
    await page.screenshot({
      path: 'C:/sts/projects/ando/mobile-test.png',
      fullPage: true
    });

    console.log('✓ Screenshot saved to: C:/sts/projects/ando/mobile-test.png');

    // Проверяем наличие секций
    console.log('\n=== Checking sections visibility ===');

    const sections = await page.evaluate(() => {
      const results = {
        description: false,
        care: false,
        delivery: false,
        payment: false
      };

      const bodyText = document.body.innerText.toUpperCase();

      results.description = bodyText.includes('ОПИСАНИЕ');
      results.care = bodyText.includes('УХОД');
      results.delivery = bodyText.includes('ДОСТАВКА');
      results.payment = bodyText.includes('ОПЛАТА');

      return results;
    });

    console.log('Description section:', sections.description ? '✓ Visible' : '✗ Hidden');
    console.log('Care section:', sections.care ? '✓ Visible' : '✗ Hidden');
    console.log('Delivery section:', sections.delivery ? '✓ Visible' : '✗ Hidden');
    console.log('Payment section:', sections.payment ? '✓ Visible' : '✗ Hidden');

    // Проверяем проблемы с версткой
    console.log('\n=== Checking layout issues ===');
    const layoutIssues = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const documentWidth = document.documentElement.scrollWidth;

      return {
        viewportWidth: viewportWidth,
        documentWidth: documentWidth,
        hasHorizontalScroll: documentWidth > viewportWidth
      };
    });

    console.log('Viewport width:', layoutIssues.viewportWidth + 'px');
    console.log('Document width:', layoutIssues.documentWidth + 'px');

    if (layoutIssues.hasHorizontalScroll) {
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
          if (parent) {
            const style = window.getComputedStyle(parent);
            const fontSize = parseFloat(style.fontSize);

            if (fontSize > 0) {
              texts.push(fontSize);
            }
          }
        }
      }

      if (texts.length === 0) {
        return { minFontSize: 0, maxFontSize: 0, avgFontSize: 0, totalTextElements: 0 };
      }

      const minFont = Math.min(...texts);
      const maxFont = Math.max(...texts);
      const avgFont = texts.reduce((a, b) => a + b, 0) / texts.length;

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

    if (textInfo.minFontSize > 0 && textInfo.minFontSize < 12) {
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
