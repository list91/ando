const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 });
  await page.goto('http://localhost:8081/catalog', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  const products = await page.$$('a[href*="/product/"]');
  await products[0].click();
  await new Promise(r => setTimeout(r, 3000));

  // Закрываем cookie
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const closeButton = buttons.find(btn => btn.textContent.trim() === 'Принять' || btn.textContent.trim() === 'Отклонить');
    if (closeButton) closeButton.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Раскрываем секции
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    buttons.forEach(btn => {
      const text = btn.textContent.trim().toUpperCase();
      if (text === 'ОПИСАНИЕ' || text === 'УХОД' || text === 'ДОСТАВКА' || text === 'ОПЛАТА') {
        btn.click();
      }
    });
  });
  await new Promise(r => setTimeout(r, 2000));

  const info = await page.evaluate(() => {
    return {
      bodyHeight: document.body.scrollHeight,
      windowHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      bodyOverflow: window.getComputedStyle(document.body).overflow
    };
  });

  console.log('Body height:', info.bodyHeight);
  console.log('Window height:', info.windowHeight);
  console.log('Document height:', info.documentHeight);
  console.log('Body overflow:', info.bodyOverflow);

  await browser.close();
})();
