const puppeteer = require('puppeteer');
const path = require('path');

async function verifyFixes() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });

    const results = [];

    try {
        // ========== Проверка 1: Размеры в каталоге (Правка 18) ==========
        console.log('\n=== Проверка 1: Размеры в каталоге (Правка 18) ===');
        const page1 = await browser.newPage();
        await page1.setViewport({ width: 1280, height: 800 });
        await page1.goto('http://localhost:8080/catalog', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 1000));

        // Скриншот первой карточки товара
        const card = await page1.$('.product-card');

        if (card) {
            await card.screenshot({
                path: 'C:\\sts\\projects\\ando\\tests\\screenshots\\verification\\verify-18-sizes-bigger.png'
            });
            console.log('Скриншот карточки товара сохранен');
        } else {
            // Скриншот всей страницы если карточка не найдена
            await page1.screenshot({
                path: 'C:\\sts\\projects\\ando\\tests\\screenshots\\verification\\verify-18-sizes-bigger.png',
                fullPage: false
            });
            console.log('Карточка не найдена, сохранен скриншот страницы');
        }

        // Проверка размеров
        const sizesInfo = await page1.evaluate(() => {
            const sizeElements = document.querySelectorAll('.product-card .sizes span');
            const info = [];
            sizeElements.forEach(el => {
                const style = window.getComputedStyle(el);
                info.push({
                    text: el.textContent.trim(),
                    fontSize: style.fontSize,
                    marginRight: style.marginRight,
                    padding: style.padding,
                    width: style.width,
                    height: style.height
                });
            });
            return info;
        });
        console.log('Информация о размерах:', JSON.stringify(sizesInfo, null, 2));

        await page1.close();

        // ========== Проверка 2: Мобильная версия без хедера (Правка М6) ==========
        console.log('\n=== Проверка 2: Мобильная версия без хедера (Правка М6) ===');
        const page2 = await browser.newPage();
        await page2.setViewport({ width: 375, height: 812 });
        await page2.goto('http://localhost:8080/', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 1000));

        await page2.screenshot({
            path: 'C:\\sts\\projects\\ando\\tests\\screenshots\\verification\\verify-m6-no-header.png',
            fullPage: false
        });
        console.log('Скриншот мобильной версии сохранен');

        // Проверка наличия верхнего хедера
        const headerInfo = await page2.evaluate(() => {
            const header = document.querySelector('header');
            const bottomNav = document.querySelector('.bottom-nav');

            // Проверка видимости хедера
            let headerVisible = false;
            let headerHeight = 0;
            if (header) {
                const rect = header.getBoundingClientRect();
                const style = window.getComputedStyle(header);
                headerVisible = rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
                headerHeight = rect.height;
            }

            // Информация о нижней панели
            let bottomNavInfo = null;
            if (bottomNav) {
                const items = bottomNav.querySelectorAll('.nav-item');
                const icons = bottomNav.querySelectorAll('svg');
                const labels = Array.from(bottomNav.querySelectorAll('.nav-item span')).map(s => s.textContent.trim());
                bottomNavInfo = {
                    exists: true,
                    itemsCount: items.length,
                    iconsCount: icons.length,
                    labels: labels
                };
            }

            // Ищем текст "Войти" или "Аккаунт"
            const pageText = document.body.innerText;
            const hasLogin = pageText.includes('Войти');
            const hasAccount = pageText.includes('Аккаунт');

            return {
                headerExists: !!header,
                headerVisible,
                headerHeight,
                bottomNavInfo,
                hasLoginText: hasLogin,
                hasAccountText: hasAccount
            };
        });
        console.log('Информация о хедере и навигации:', JSON.stringify(headerInfo, null, 2));

        await page2.close();

        console.log('\n=== ПРОВЕРКИ ЗАВЕРШЕНЫ ===');

    } catch (error) {
        console.error('Ошибка:', error.message);
    } finally {
        await browser.close();
    }
}

verifyFixes();
