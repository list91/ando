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

    const productSelector = 'a[href*="/product/"]';
    await page.waitForSelector(productSelector, { timeout: 10000 });

    const products = await page.$$(productSelector);
    await products[0].click();
    console.log('Clicked on first product');

    await delay(3000);

    // Закрываем cookie баннер
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const closeButton = buttons.find(btn => {
        const text = btn.textContent.trim();
        return text === 'Принять' || text === 'Отклонить' || text === '×';
      });
      if (closeButton) closeButton.click();
    });
    await delay(500);

    // Раскрываем все секции
    console.log('Opening all sections...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      buttons.forEach(btn => {
        const text = btn.textContent.trim().toUpperCase();
        if (text === 'ОПИСАНИЕ' || text === 'УХОД' || text === 'ДОСТАВКА' || text === 'ОПЛАТА') {
          btn.click();
        }
      });
    });

    await delay(2000);

    // Получаем высоту прокручиваемого контента
    const scrollInfo = await page.evaluate(() => {
      const main = document.querySelector('main');
      return {
        scrollHeight: main ? main.scrollHeight : 0,
        clientHeight: main ? main.clientHeight : 0
      };
    });

    console.log('Main scroll height:', scrollInfo.scrollHeight);
    console.log('Main client height:', scrollInfo.clientHeight);

    // Делаем полный скриншот, прокручивая main элемент
    console.log('Taking screenshots...');

    // Скриншот 1: Верхняя часть (изображение и информация о товаре)
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 0;
    });
    await delay(500);

    await page.screenshot({
      path: 'C:/sts/projects/ando/mobile-test.png',
      fullPage: false
    });
    console.log('✓ Screenshot saved: mobile-test.png');

    // Прокручиваем вниз к секциям
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        // Прокручиваем на половину высоты
        main.scrollTop = main.scrollHeight * 0.4;
      }
    });
    await delay(1000);

    await page.screenshot({
      path: 'C:/sts/projects/ando/mobile-test-middle.png',
      fullPage: false
    });
    console.log('✓ Screenshot saved: mobile-test-middle.png');

    // Прокручиваем до конца
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        main.scrollTop = main.scrollHeight;
      }
    });
    await delay(1000);

    await page.screenshot({
      path: 'C:/sts/projects/ando/mobile-test-bottom.png',
      fullPage: false
    });
    console.log('✓ Screenshot saved: mobile-test-bottom.png');

    // Создаем длинный скриншот с помощью стежков
    console.log('\nCreating stitched long screenshot...');

    const screenshots = [];
    const main = await page.$('main');

    if (main) {
      await page.evaluate(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTop = 0;
      });
      await delay(500);

      const scrollHeight = scrollInfo.scrollHeight;
      const viewportHeight = scrollInfo.clientHeight;
      const numScreenshots = Math.ceil(scrollHeight / viewportHeight);

      console.log(`Taking ${numScreenshots} screenshots to stitch...`);

      for (let i = 0; i < numScreenshots; i++) {
        const scrollPos = i * viewportHeight;
        await page.evaluate((pos) => {
          const main = document.querySelector('main');
          if (main) main.scrollTop = pos;
        }, scrollPos);
        await delay(300);

        const screenshot = await page.screenshot({ encoding: 'binary' });
        screenshots.push(screenshot);
      }
    }

    console.log(`\n=== Summary ===`);
    console.log('Path to screenshots:');
    console.log('  - C:/sts/projects/ando/mobile-test.png (top)');
    console.log('  - C:/sts/projects/ando/mobile-test-middle.png (middle)');
    console.log('  - C:/sts/projects/ando/mobile-test-bottom.png (bottom)');

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
})();
