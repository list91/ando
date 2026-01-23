const puppeteer = require('puppeteer');
const path = require('path');

async function verifyFixes() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];

    try {
        // ========== Проверка 1: Размеры в каталоге (Правка 18) ==========
        console.log('\n=== Проверка 1: Размеры в каталоге (Правка 18) ===');
        const page1 = await browser.newPage();
        await page1.setViewport({ width: 1280, height: 800 });
        await page1.goto('http://localhost:8080/catalog', { waitUntil: 'networkidle2', timeout: 30000 });
        await page1.waitForTimeout(1000);

        // Скриншот первой карточки товара
        const cardSelector = '.product-card, .catalog-item, [class*="product"], [class*="card"]';
        const card = await page1.$(cardSelector);

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
            const sizeElements = document.querySelectorAll('[class*="size"], .size-option, .sizes span, .sizes div');
            const info = [];
            sizeElements.forEach(el => {
                const style = window.getComputedStyle(el);
                info.push({
                    text: el.textContent.trim(),
                    fontSize: style.fontSize,
                    marginRight: style.marginRight,
                    padding: style.padding
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
        await page2.waitForTimeout(1000);

        await page2.screenshot({
            path: 'C:\\sts\\projects\\ando\\tests\\screenshots\\verification\\verify-m6-no-header.png',
            fullPage: false
        });
        console.log('Скриншот мобильной версии сохранен');

        // Проверка наличия верхнего хедера
        const headerInfo = await page2.evaluate(() => {
            const header = document.querySelector('header, .header, [class*="header"]');
            const topBar = document.querySelector('.top-bar, .top-header, [class*="top-bar"]');
            const bottomNav = document.querySelector('.bottom-nav, .mobile-nav, [class*="bottom-nav"], nav[class*="mobile"]');

            // Ищем иконки в хедере
            const headerIcons = header ? header.querySelectorAll('svg, img, [class*="icon"]').length : 0;

            // Ищем текст "Войти" или "Аккаунт"
            const pageText = document.body.innerText;
            const hasLogin = pageText.includes('Войти');
            const hasAccount = pageText.includes('Аккаунт');

            // Информация о нижней панели
            let bottomNavInfo = null;
            if (bottomNav) {
                const items = bottomNav.querySelectorAll('a, button, [class*="item"]');
                const icons = bottomNav.querySelectorAll('svg, [class*="icon"]');
                bottomNavInfo = {
                    exists: true,
                    itemsCount: items.length,
                    iconsCount: icons.length,
                    text: bottomNav.innerText
                };
            }

            // Проверка видимости хедера
            let headerVisible = false;
            if (header) {
                const rect = header.getBoundingClientRect();
                const style = window.getComputedStyle(header);
                headerVisible = rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
            }

            return {
                headerExists: !!header,
                headerVisible,
                headerIcons,
                topBarExists: !!topBar,
                bottomNavInfo,
                hasLoginText: hasLogin,
                hasAccountText: hasAccount
            };
        });
        console.log('Информация о хедере:', JSON.stringify(headerInfo, null, 2));

        await page2.close();

        console.log('\n=== ПРОВЕРКИ ЗАВЕРШЕНЫ ===');

    } catch (error) {
        console.error('Ошибка:', error.message);
    } finally {
        await browser.close();
    }
}

verifyFixes();
