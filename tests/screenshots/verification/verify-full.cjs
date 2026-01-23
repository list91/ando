const puppeteer = require('puppeteer');

async function verifyFixes() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });

    try {
        // ========== Проверка 1: Размеры в каталоге (Правка 18) ==========
        console.log('\n=== Проверка 1: Размеры в каталоге (Правка 18) ===');
        const page1 = await browser.newPage();
        await page1.setViewport({ width: 1280, height: 800 });
        await page1.goto('http://localhost:8080/catalog', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        // Скриншот страницы каталога целиком
        await page1.screenshot({
            path: 'C:\\sts\\projects\\ando\\tests\\screenshots\\verification\\verify-18-sizes-bigger.png',
            fullPage: false
        });
        console.log('Скриншот каталога сохранен');

        // Найти все элементы с размерами
        const sizesInfo = await page1.evaluate(() => {
            // Ищем все текстовые элементы содержащие S, M, L
            const allElements = document.querySelectorAll('*');
            const sizeContainers = [];

            for (const el of allElements) {
                const text = el.textContent.trim();
                // Проверяем что это контейнер с размерами
                if (/^[SMLX\s,]+$/.test(text) && text.length < 20 && text.includes('S')) {
                    const style = window.getComputedStyle(el);
                    sizeContainers.push({
                        text: text,
                        tag: el.tagName,
                        className: el.className,
                        fontSize: style.fontSize,
                        parent: el.parentElement?.className || ''
                    });
                }
            }

            // Также ищем размеры по классу
            const sizeDivs = document.querySelectorAll('[class*="size"]');
            sizeDivs.forEach(el => {
                const style = window.getComputedStyle(el);
                sizeContainers.push({
                    text: el.textContent.trim().substring(0, 50),
                    tag: el.tagName,
                    className: el.className,
                    fontSize: style.fontSize,
                    marginRight: style.marginRight,
                    gap: style.gap
                });
            });

            return sizeContainers.slice(0, 15);
        });
        console.log('Информация о размерах:', JSON.stringify(sizesInfo, null, 2));

        await page1.close();

        // ========== Проверка 2: Мобильная версия без хедера (Правка М6) ==========
        console.log('\n=== Проверка 2: Мобильная версия без хедера (Правка М6) ===');
        const page2 = await browser.newPage();
        await page2.setViewport({ width: 375, height: 812 });
        await page2.goto('http://localhost:8080/', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        await page2.screenshot({
            path: 'C:\\sts\\projects\\ando\\tests\\screenshots\\verification\\verify-m6-no-header.png',
            fullPage: false
        });
        console.log('Скриншот мобильной версии сохранен');

        // Проверка структуры мобильной версии
        const mobileInfo = await page2.evaluate(() => {
            // Ищем элементы навигации
            const header = document.querySelector('header, [class*="header"], [class*="Header"]');
            const bottomNav = document.querySelector('[class*="bottom-nav"], [class*="BottomNav"], [class*="mobile-nav"], [class*="MobileNav"], nav[class*="fixed"]');

            // Проверяем видимость header
            let headerInfo = null;
            if (header) {
                const rect = header.getBoundingClientRect();
                const style = window.getComputedStyle(header);
                headerInfo = {
                    exists: true,
                    visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.height > 0,
                    height: rect.height,
                    display: style.display
                };
            }

            // Ищем нижнюю навигацию по позиции
            const fixedElements = document.querySelectorAll('[class*="fixed"]');
            let bottomElement = null;
            fixedElements.forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.bottom === '0px' || el.className.includes('bottom')) {
                    const icons = el.querySelectorAll('svg').length;
                    bottomElement = {
                        className: el.className,
                        iconsCount: icons,
                        text: el.innerText.trim().replace(/\n/g, ', ')
                    };
                }
            });

            // Ищем текст Войти/Аккаунт
            const bodyText = document.body.innerText;

            return {
                headerInfo,
                bottomNavFound: bottomElement,
                hasLoginText: bodyText.includes('Войти'),
                hasAccountText: bodyText.includes('Аккаунт'),
                pageTitle: document.title
            };
        });
        console.log('Информация о мобильной версии:', JSON.stringify(mobileInfo, null, 2));

        await page2.close();

        console.log('\n=== ПРОВЕРКИ ЗАВЕРШЕНЫ ===');

    } catch (error) {
        console.error('Ошибка:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
    }
}

verifyFixes();
