const puppeteer = require('puppeteer');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewport({ width: 375, height: 812 });

  await page.goto('http://localhost:8081/catalog', { waitUntil: 'networkidle0' });
  await delay(2000);

  const productSelector = 'a[href*="/product/"]';
  await page.waitForSelector(productSelector);
  const products = await page.$$(productSelector);

  await products[0].click();
  await delay(3000);

  // Получаем информацию о странице
  const pageInfo = await page.evaluate(() => {
    return {
      url: window.location.href,
      bodyHeight: document.body.scrollHeight,
      windowHeight: window.innerHeight,
      html: document.body.innerHTML.substring(0, 5000) // Первые 5000 символов
    };
  });

  console.log('Current URL:', pageInfo.url);
  console.log('Body height:', pageInfo.bodyHeight);
  console.log('Window height:', pageInfo.windowHeight);
  console.log('\n=== HTML Preview (first 5000 chars) ===');
  console.log(pageInfo.html);

  await browser.close();
})();
