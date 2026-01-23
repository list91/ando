const puppeteer = require('puppeteer');
const path = require('path');

const VIEWPORT = { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const BASE_URL = 'https://andojv.com';
const SCREENSHOT_DIR = 'C:\\sts\\projects\\ando\\tests\\screenshots\\mobile';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runMobileTests() {
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');

    const results = {
        screenshots: [],
        checks: {}
    };

    try {
        // 1. Главная страница
        console.log('1. Загрузка главной страницы...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-home.png'), fullPage: false });
        results.screenshots.push('01-home.png');

        // Проверка M1: отступ сверху - анализ первого видимого контента
        const headerPadding = await page.evaluate(() => {
            // Ищем основной контент
            const possibleContainers = [
                document.querySelector('main'),
                document.querySelector('.main-content'),
                document.querySelector('.hero'),
                document.querySelector('.banner'),
                document.querySelector('[class*="hero"]'),
                document.querySelector('[class*="slider"]'),
                document.querySelector('[class*="banner"]')
            ].filter(Boolean);

            const header = document.querySelector('header') || document.querySelector('[class*="header"]');
            const headerHeight = header ? header.getBoundingClientRect().height : 0;

            let firstContent = null;
            for (const container of possibleContainers) {
                const rect = container.getBoundingClientRect();
                if (rect.top >= 0 && rect.height > 50) {
                    firstContent = container;
                    break;
                }
            }

            if (firstContent) {
                const rect = firstContent.getBoundingClientRect();
                const style = window.getComputedStyle(firstContent);
                return {
                    contentTop: rect.top,
                    headerHeight: headerHeight,
                    gapAfterHeader: rect.top - headerHeight,
                    paddingTop: style.paddingTop,
                    marginTop: style.marginTop,
                    element: firstContent.className || firstContent.tagName
                };
            }

            return { error: 'Content not found' };
        });
        results.checks.M1_contentPadding = headerPadding;
        console.log('M1 - Отступ контента:', JSON.stringify(headerPadding));

        // Проверка M6: нижняя навигационная панель
        const bottomNav = await page.evaluate(() => {
            const viewportHeight = window.innerHeight;
            const allElements = document.querySelectorAll('*');
            const bottomElements = [];

            allElements.forEach(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();

                if (style.position === 'fixed' && rect.bottom >= viewportHeight - 20 && rect.height > 40 && rect.height < 150) {
                    const links = el.querySelectorAll('a, button');
                    const icons = el.querySelectorAll('svg, img, i, [class*="icon"]');
                    bottomElements.push({
                        tagName: el.tagName,
                        className: el.className,
                        height: rect.height,
                        bottom: rect.bottom,
                        linksCount: links.length,
                        iconsCount: icons.length
                    });
                }
            });

            // Проверяем наличие ключевых элементов навигации
            const hasMenu = document.querySelector('[class*="menu"], [class*="burger"]') !== null;
            const hasSearch = document.querySelector('[class*="search"]') !== null;
            const hasFavorite = document.querySelector('[class*="favorite"], [class*="wishlist"], [class*="heart"]') !== null;
            const hasCart = document.querySelector('[class*="cart"], [class*="basket"]') !== null;
            const hasAccount = document.querySelector('[class*="account"], [class*="profile"], [class*="user"]') !== null;

            return {
                found: bottomElements.length > 0,
                elements: bottomElements,
                navFeatures: { hasMenu, hasSearch, hasFavorite, hasCart, hasAccount }
            };
        });
        results.checks.M6_bottomNav = bottomNav;
        console.log('M6 - Нижняя навигация:', JSON.stringify(bottomNav));

        // 2. Каталог
        console.log('2. Загрузка каталога...');
        await page.goto(BASE_URL + '/catalog', { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-catalog.png'), fullPage: false });
        results.screenshots.push('02-catalog.png');

        // Получаем ссылку на первый товар
        const productLink = await page.evaluate(() => {
            const links = document.querySelectorAll('a[href*="/product"], a[href*="/catalog/"]');
            for (const link of links) {
                const href = link.getAttribute('href');
                if (href && href.length > 10 && !href.endsWith('/catalog') && !href.endsWith('/catalog/')) {
                    return link.href;
                }
            }
            // Альтернативный поиск
            const productCard = document.querySelector('.product-card a, .product-item a, [class*="product"] a');
            return productCard ? productCard.href : null;
        });
        console.log('Найдена ссылка на товар:', productLink);

        // 3. Карточка товара
        console.log('3. Загрузка карточки товара...');
        if (productLink) {
            await page.goto(productLink, { waitUntil: 'networkidle2', timeout: 30000 });
            await delay(2000);
        }
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-product.png'), fullPage: false });
        results.screenshots.push('03-product.png');

        // 4. Лукбук
        console.log('4. Загрузка лукбука...');
        await page.goto(BASE_URL + '/lookbook', { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-lookbook.png'), fullPage: false });
        results.screenshots.push('04-lookbook.png');

        // Проверка M2: позиция фото в лукбуке
        const lookbookPhoto = await page.evaluate(() => {
            const header = document.querySelector('header') || document.querySelector('[class*="header"]');
            const headerHeight = header ? header.getBoundingClientRect().height : 0;

            const images = document.querySelectorAll('img');
            let mainImage = null;
            let maxArea = 0;

            images.forEach(img => {
                const rect = img.getBoundingClientRect();
                const area = rect.width * rect.height;
                if (area > maxArea && rect.top < 500) {
                    maxArea = area;
                    mainImage = img;
                }
            });

            if (mainImage) {
                const rect = mainImage.getBoundingClientRect();
                const style = window.getComputedStyle(mainImage);
                const parent = mainImage.parentElement;
                const parentStyle = parent ? window.getComputedStyle(parent) : null;

                return {
                    found: true,
                    imageTop: rect.top,
                    headerHeight: headerHeight,
                    gapAfterHeader: rect.top - headerHeight,
                    marginTop: style.marginTop,
                    parentMarginTop: parentStyle ? parentStyle.marginTop : null,
                    parentPaddingTop: parentStyle ? parentStyle.paddingTop : null
                };
            }
            return { found: false };
        });
        results.checks.M2_lookbookPhoto = lookbookPhoto;
        console.log('M2 - Фото лукбука:', JSON.stringify(lookbookPhoto));

        // Кликаем на изображение для открытия галереи
        console.log('4b. Открытие галереи лукбука...');
        const clicked = await page.evaluate(() => {
            const clickables = document.querySelectorAll('.lookbook-item, [class*="lookbook"] img, [class*="lookbook"] a, .gallery-item');
            if (clickables.length > 0) {
                clickables[0].click();
                return true;
            }
            // Пробуем кликнуть на первое большое изображение
            const img = document.querySelector('img[src*="lookbook"], .lookbook img, main img');
            if (img) {
                img.click();
                return true;
            }
            return false;
        });
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04b-lookbook-gallery.png'), fullPage: false });
        results.screenshots.push('04b-lookbook-gallery.png');

        // Проверка M3: цвет стрелок в галерее
        const arrowColors = await page.evaluate(() => {
            const arrows = [];

            // Ищем все возможные стрелки
            const arrowSelectors = [
                '.swiper-button-next', '.swiper-button-prev',
                '.slick-next', '.slick-prev',
                '.gallery-arrow', '.nav-arrow',
                '[class*="arrow"]', '[class*="next"]', '[class*="prev"]',
                '.carousel-control', 'button[aria-label*="next"]', 'button[aria-label*="prev"]'
            ];

            for (const sel of arrowSelectors) {
                document.querySelectorAll(sel).forEach(el => {
                    const style = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();

                    // Проверяем SVG внутри
                    const svg = el.querySelector('svg');
                    const path = el.querySelector('path');

                    let svgColor = null;
                    if (svg) {
                        const svgStyle = window.getComputedStyle(svg);
                        svgColor = svgStyle.fill || svgStyle.color;
                    }
                    if (path) {
                        const pathStyle = window.getComputedStyle(path);
                        svgColor = pathStyle.fill || pathStyle.stroke || svgColor;
                    }

                    // Проверяем ::before/::after через computed style
                    const beforeStyle = window.getComputedStyle(el, '::before');
                    const afterStyle = window.getComputedStyle(el, '::after');

                    arrows.push({
                        selector: sel,
                        className: el.className,
                        color: style.color,
                        backgroundColor: style.backgroundColor,
                        svgColor: svgColor,
                        beforeColor: beforeStyle.color,
                        afterColor: afterStyle.color,
                        isVisible: rect.width > 0 && rect.height > 0
                    });
                });
            }

            return arrows;
        });
        results.checks.M3_arrowColors = arrowColors;
        console.log('M3 - Цвет стрелок:', JSON.stringify(arrowColors));

        // Проверка M3b: иконка сердца сверху
        const heartIcon = await page.evaluate(() => {
            const heartSelectors = [
                '.heart', '.favorite', '.wishlist-btn', '.like-btn',
                '[class*="heart"]', '[class*="favorite"]', '[class*="wishlist"]',
                'svg[class*="heart"]', 'button[class*="favorite"]'
            ];

            for (const sel of heartSelectors) {
                const elements = document.querySelectorAll(sel);
                for (const el of elements) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        return {
                            found: true,
                            selector: sel,
                            className: el.className,
                            top: rect.top,
                            right: window.innerWidth - rect.right,
                            isAtTop: rect.top < 150
                        };
                    }
                }
            }
            return { found: false };
        });
        results.checks.M3b_heartIcon = heartIcon;
        console.log('M3b - Иконка сердца:', JSON.stringify(heartIcon));

        // Закрываем галерею
        await page.keyboard.press('Escape');
        await delay(500);

        // 5. Избранное
        console.log('5. Проверка избранного...');
        let favoritesLoaded = false;
        try {
            await page.goto(BASE_URL + '/favorites', { waitUntil: 'networkidle2', timeout: 15000 });
            favoritesLoaded = true;
        } catch (e) {
            try {
                await page.goto(BASE_URL + '/wishlist', { waitUntil: 'networkidle2', timeout: 15000 });
                favoritesLoaded = true;
            } catch (e2) {
                console.log('Не удалось загрузить страницу избранного напрямую');
            }
        }
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-favorites.png'), fullPage: false });
        results.screenshots.push('05-favorites.png');

        // Проверка M4: требуется ли регистрация для избранного
        const favoritesAuth = await page.evaluate(() => {
            const authIndicators = [
                'input[type="email"]', 'input[type="password"]',
                '.login-form', '.auth-form', '.register-form',
                '[class*="login"]', '[class*="auth"]', '[class*="signin"]'
            ];

            for (const sel of authIndicators) {
                if (document.querySelector(sel)) {
                    return { requiresAuth: true, selector: sel };
                }
            }

            const pageText = document.body.innerText.toLowerCase();
            const authPhrases = ['войти', 'войдите', 'регистрац', 'авториз', 'login', 'sign in', 'вход', 'создать аккаунт'];

            for (const phrase of authPhrases) {
                if (pageText.includes(phrase)) {
                    return { requiresAuth: true, phrase: phrase };
                }
            }

            return { requiresAuth: false };
        });
        results.checks.M4_favoritesAuth = favoritesAuth;
        console.log('M4 - Избранное требует авторизации:', JSON.stringify(favoritesAuth));

        // 6. Корзина
        console.log('6. Проверка корзины...');
        try {
            await page.goto(BASE_URL + '/cart', { waitUntil: 'networkidle2', timeout: 15000 });
        } catch (e) {
            try {
                await page.goto(BASE_URL + '/basket', { waitUntil: 'networkidle2', timeout: 15000 });
            } catch (e2) {
                console.log('Не удалось загрузить страницу корзины напрямую');
            }
        }
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-cart.png'), fullPage: false });
        results.screenshots.push('06-cart.png');

        // Проверка M5: требуется ли регистрация для корзины
        const cartAuth = await page.evaluate(() => {
            const authIndicators = [
                'input[type="email"]', 'input[type="password"]',
                '.login-form', '.auth-form', '.register-form',
                '[class*="login"]', '[class*="auth"]', '[class*="signin"]'
            ];

            for (const sel of authIndicators) {
                if (document.querySelector(sel)) {
                    return { requiresAuth: true, selector: sel };
                }
            }

            const pageText = document.body.innerText.toLowerCase();
            const authPhrases = ['войти', 'войдите', 'регистрац', 'авториз', 'login', 'sign in', 'вход'];

            for (const phrase of authPhrases) {
                if (pageText.includes(phrase)) {
                    // Исключаем если это просто ссылка в шапке
                    const mainContent = document.querySelector('main') || document.querySelector('.content');
                    if (mainContent) {
                        const mainText = mainContent.innerText.toLowerCase();
                        if (mainText.includes(phrase)) {
                            return { requiresAuth: true, phrase: phrase, inMainContent: true };
                        }
                    }
                }
            }

            return { requiresAuth: false };
        });
        results.checks.M5_cartAuth = cartAuth;
        console.log('M5 - Корзина требует авторизации:', JSON.stringify(cartAuth));

        // Финальный скриншот с прокруткой вниз для проверки нижней панели
        console.log('7. Финальная проверка...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-home-bottom-check.png'), fullPage: false });
        results.screenshots.push('07-home-bottom-check.png');

    } catch (error) {
        console.error('Ошибка:', error.message);
        results.error = error.message;
    }

    await browser.close();

    console.log('\n========================================');
    console.log('=== ИТОГОВЫЕ РЕЗУЛЬТАТЫ ПРОВЕРКИ ===');
    console.log('========================================\n');
    console.log(JSON.stringify(results, null, 2));

    return results;
}

runMobileTests().catch(console.error);
