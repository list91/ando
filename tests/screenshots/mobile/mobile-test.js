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

        // Проверка M1: отступ сверху
        const headerPadding = await page.evaluate(() => {
            const main = document.querySelector('main') || document.querySelector('.main-content') || document.body.firstElementChild;
            if (main) {
                const style = window.getComputedStyle(main);
                const rect = main.getBoundingClientRect();
                return {
                    paddingTop: style.paddingTop,
                    marginTop: style.marginTop,
                    top: rect.top
                };
            }
            return null;
        });
        results.checks.M1_contentPadding = headerPadding;
        console.log('M1 - Отступ контента:', headerPadding);

        // Проверка M6: нижняя навигационная панель
        const bottomNav = await page.evaluate(() => {
            // Ищем нижнюю навигацию
            const navSelectors = [
                '.bottom-nav', '.mobile-nav', '.footer-nav', '.tab-bar',
                '[class*="bottom"]', '[class*="mobile-menu"]', 'nav[class*="fixed"]',
                '.mobile-bottom-nav', '.app-nav'
            ];

            for (const sel of navSelectors) {
                const el = document.querySelector(sel);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    if (rect.bottom >= window.innerHeight - 100 && style.position === 'fixed') {
                        return {
                            found: true,
                            selector: sel,
                            position: style.position,
                            bottom: rect.bottom,
                            height: rect.height
                        };
                    }
                }
            }

            // Проверяем все fixed элементы внизу
            const allFixed = Array.from(document.querySelectorAll('*')).filter(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return style.position === 'fixed' && rect.bottom >= window.innerHeight - 50;
            });

            if (allFixed.length > 0) {
                const el = allFixed[0];
                const rect = el.getBoundingClientRect();
                return {
                    found: true,
                    selector: el.className || el.tagName,
                    height: rect.height,
                    hasButtons: el.querySelectorAll('a, button').length
                };
            }

            return { found: false };
        });
        results.checks.M6_bottomNav = bottomNav;
        console.log('M6 - Нижняя навигация:', bottomNav);

        // 2. Каталог
        console.log('2. Загрузка каталога...');
        await page.goto(BASE_URL + '/catalog', { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-catalog.png'), fullPage: false });
        results.screenshots.push('02-catalog.png');

        // Получаем ссылку на товар
        const productLink = await page.evaluate(() => {
            const link = document.querySelector('a[href*="/product/"], a[href*="/catalog/"] .product-card, .product-item a');
            return link ? link.href : null;
        });

        // 3. Карточка товара
        console.log('3. Загрузка карточки товара...');
        if (productLink) {
            await page.goto(productLink, { waitUntil: 'networkidle2', timeout: 30000 });
        } else {
            // Пробуем найти и кликнуть на товар
            await page.click('.product-card, .product-item, [class*="product"]').catch(() => {});
            await delay(2000);
        }
        await delay(2000);
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
            const img = document.querySelector('.lookbook img, .lookbook-image, [class*="lookbook"] img');
            if (img) {
                const rect = img.getBoundingClientRect();
                return {
                    found: true,
                    top: rect.top,
                    marginTop: window.getComputedStyle(img).marginTop
                };
            }
            return { found: false };
        });
        results.checks.M2_lookbookPhoto = lookbookPhoto;
        console.log('M2 - Фото лукбука:', lookbookPhoto);

        // Открываем галерею лукбука и проверяем стрелки
        console.log('4b. Открытие галереи лукбука...');
        await page.click('.lookbook-item, .lookbook img, [class*="lookbook"] a').catch(() => {});
        await delay(1500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04b-lookbook-gallery.png'), fullPage: false });
        results.screenshots.push('04b-lookbook-gallery.png');

        // Проверка M3: цвет стрелок в галерее
        const arrowColors = await page.evaluate(() => {
            const arrowSelectors = [
                '.gallery-arrow', '.nav-arrow', '.swiper-button-next', '.swiper-button-prev',
                '.slick-arrow', '.carousel-arrow', '[class*="arrow"]', '.prev', '.next',
                '.gallery-nav', 'button[class*="arrow"]', '.slider-arrow'
            ];

            const arrows = [];
            for (const sel of arrowSelectors) {
                const elements = document.querySelectorAll(sel);
                elements.forEach(el => {
                    const style = window.getComputedStyle(el);
                    const svgPath = el.querySelector('path, svg');
                    arrows.push({
                        selector: sel,
                        color: style.color,
                        backgroundColor: style.backgroundColor,
                        fill: svgPath ? window.getComputedStyle(svgPath).fill : null,
                        stroke: svgPath ? window.getComputedStyle(svgPath).stroke : null
                    });
                });
            }
            return arrows;
        });
        results.checks.M3_arrowColors = arrowColors;
        console.log('M3 - Цвет стрелок:', JSON.stringify(arrowColors, null, 2));

        // Проверка M3b: иконка сердца
        const heartIcon = await page.evaluate(() => {
            const heartSelectors = [
                '.heart', '.favorite', '.wishlist', '[class*="heart"]', '[class*="favorite"]',
                '[class*="wishlist"]', 'svg[class*="heart"]', '.like-btn'
            ];

            for (const sel of heartSelectors) {
                const el = document.querySelector(sel);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    return {
                        found: true,
                        selector: sel,
                        top: rect.top,
                        isAtTop: rect.top < 100
                    };
                }
            }
            return { found: false };
        });
        results.checks.M3b_heartIcon = heartIcon;
        console.log('M3b - Иконка сердца:', heartIcon);

        // Закрываем галерею если открыта
        await page.keyboard.press('Escape');
        await delay(500);

        // 5. Избранное
        console.log('5. Проверка избранного...');
        await page.goto(BASE_URL + '/favorites', { waitUntil: 'networkidle2', timeout: 30000 }).catch(async () => {
            await page.goto(BASE_URL + '/wishlist', { waitUntil: 'networkidle2', timeout: 30000 });
        });
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-favorites.png'), fullPage: false });
        results.screenshots.push('05-favorites.png');

        // Проверка M4: требуется ли регистрация для избранного
        const favoritesAuth = await page.evaluate(() => {
            const authSelectors = [
                '.login-form', '.auth-form', '.register', '[class*="login"]', '[class*="auth"]',
                'input[type="email"]', 'input[type="password"]', '.sign-in', '.sign-up'
            ];

            for (const sel of authSelectors) {
                if (document.querySelector(sel)) {
                    return { requiresAuth: true, selector: sel };
                }
            }

            // Проверяем текст на странице
            const pageText = document.body.innerText.toLowerCase();
            if (pageText.includes('войти') || pageText.includes('регистрац') ||
                pageText.includes('авториз') || pageText.includes('login') ||
                pageText.includes('sign in')) {
                return { requiresAuth: true, textFound: true };
            }

            return { requiresAuth: false };
        });
        results.checks.M4_favoritesAuth = favoritesAuth;
        console.log('M4 - Избранное требует авторизации:', favoritesAuth);

        // 6. Корзина
        console.log('6. Проверка корзины...');
        await page.goto(BASE_URL + '/cart', { waitUntil: 'networkidle2', timeout: 30000 }).catch(async () => {
            await page.goto(BASE_URL + '/basket', { waitUntil: 'networkidle2', timeout: 30000 });
        });
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-cart.png'), fullPage: false });
        results.screenshots.push('06-cart.png');

        // Проверка M5: требуется ли регистрация для корзины
        const cartAuth = await page.evaluate(() => {
            const authSelectors = [
                '.login-form', '.auth-form', '.register', '[class*="login"]', '[class*="auth"]',
                'input[type="email"]', 'input[type="password"]', '.sign-in', '.sign-up'
            ];

            for (const sel of authSelectors) {
                if (document.querySelector(sel)) {
                    return { requiresAuth: true, selector: sel };
                }
            }

            const pageText = document.body.innerText.toLowerCase();
            if (pageText.includes('войти') || pageText.includes('регистрац') ||
                pageText.includes('авториз') || pageText.includes('login')) {
                return { requiresAuth: true, textFound: true };
            }

            return { requiresAuth: false };
        });
        results.checks.M5_cartAuth = cartAuth;
        console.log('M5 - Корзина требует авторизации:', cartAuth);

        // Делаем полный скриншот главной для анализа нижней панели
        console.log('7. Финальная проверка нижней панели...');
        await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(2000);

        // Проверяем точно нижнюю панель
        const bottomNavDetailed = await page.evaluate(() => {
            const viewportHeight = window.innerHeight;
            const allElements = document.querySelectorAll('*');
            const bottomElements = [];

            allElements.forEach(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();

                // Ищем fixed элементы внизу экрана
                if (style.position === 'fixed' && rect.bottom >= viewportHeight - 20 && rect.height > 40) {
                    const links = el.querySelectorAll('a, button');
                    const icons = el.querySelectorAll('svg, img, i, [class*="icon"]');
                    bottomElements.push({
                        tagName: el.tagName,
                        className: el.className,
                        height: rect.height,
                        bottom: rect.bottom,
                        linksCount: links.length,
                        iconsCount: icons.length,
                        innerHTML: el.innerHTML.substring(0, 200)
                    });
                }
            });

            return {
                found: bottomElements.length > 0,
                elements: bottomElements,
                viewportHeight
            };
        });
        results.checks.M6_bottomNavDetailed = bottomNavDetailed;
        console.log('M6 - Детальная проверка нижней панели:', JSON.stringify(bottomNavDetailed, null, 2));

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-home-full.png'), fullPage: true });
        results.screenshots.push('07-home-full.png');

    } catch (error) {
        console.error('Ошибка:', error.message);
        results.error = error.message;
    }

    await browser.close();

    console.log('\n=== РЕЗУЛЬТАТЫ ПРОВЕРКИ ===\n');
    console.log(JSON.stringify(results, null, 2));

    return results;
}

runMobileTests().catch(console.error);
