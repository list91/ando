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

    // Полный скриншот всей страницы
    console.log('Taking full page screenshot...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(500);

    await page.screenshot({
      path: 'C:/sts/projects/ando/mobile-test.png',
      fullPage: true
    });

    console.log('✓ Full screenshot saved to: C:/sts/projects/ando/mobile-test.png');

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
})();
