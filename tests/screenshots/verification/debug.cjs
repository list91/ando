const puppeteer = require('puppeteer');

async function debug() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });

    try {
        // Debug каталога
        console.log('\n=== DEBUG: Каталог ===');
        const page1 = await browser.newPage();
        await page1.setViewport({ width: 1280, height: 800 });
        await page1.goto('http://localhost:8080/catalog', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 1000));

        const catalogHTML = await page1.evaluate(() => {
            return document.body.innerHTML.substring(0, 5000);
        });
        console.log('HTML каталога (первые 5000 символов):\n', catalogHTML);

        await page1.close();

        // Debug мобильной главной
        console.log('\n=== DEBUG: Мобильная главная ===');
        const page2 = await browser.newPage();
        await page2.setViewport({ width: 375, height: 812 });
        await page2.goto('http://localhost:8080/', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 1000));

        const mobileHTML = await page2.evaluate(() => {
            return document.body.innerHTML.substring(0, 5000);
        });
        console.log('HTML мобильной версии (первые 5000 символов):\n', mobileHTML);

        await page2.close();

    } catch (error) {
        console.error('Ошибка:', error.message);
    } finally {
        await browser.close();
    }
}

debug();
