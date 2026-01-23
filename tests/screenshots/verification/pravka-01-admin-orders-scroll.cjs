/**
 * ПРАВКА 1: Проверка горизонтального скролла СВЕРХУ таблицы заказов в админке
 *
 * Задачи:
 * 1. Открыть страницу админки заказов
 * 2. Сделать скриншот таблицы заказов
 * 3. Проверить есть ли горизонтальный скроллбар СВЕРХУ таблицы (а не только снизу)
 * 4. Сохранить скриншот в tests/screenshots/verification/pravka-01-admin-orders.png
 */

const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'http://localhost:8087';

// Учетные данные админа
const ADMIN_EMAIL = 'khalezov89@gmail.com';
const ADMIN_PASSWORD = '123456';

async function verifyPravka01() {
    console.log('\n========================================');
    console.log('ПРАВКА 1: Горизонтальный скролл СВЕРХУ');
    console.log('Админка заказов');
    console.log('========================================\n');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 900 });

        // ==========================================
        // ШАГ 1: Авторизация в системе
        // ==========================================
        console.log('1. Выполняю авторизацию...');
        await page.goto(`${BASE_URL}/auth`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        await new Promise(r => setTimeout(r, 1000));

        // Вводим email
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', ADMIN_EMAIL);

        // Вводим пароль
        await page.waitForSelector('input[type="password"]');
        await page.type('input[type="password"]', ADMIN_PASSWORD);

        // Нажимаем кнопку входа
        await page.click('button[type="submit"]');
        await new Promise(r => setTimeout(r, 3000));

        const currentUrl = page.url();
        console.log(`   URL после входа: ${currentUrl}`);

        if (currentUrl.includes('/auth')) {
            console.log('   ПРЕДУПРЕЖДЕНИЕ: Возможно авторизация не удалась');
        } else {
            console.log('   Авторизация успешна!');
        }

        // ==========================================
        // ШАГ 2: Переход на страницу админки заказов
        // ==========================================
        console.log('\n2. Открываю страницу админки заказов...');
        const adminOrdersUrl = `${BASE_URL}/admin/orders`;
        console.log(`   URL: ${adminOrdersUrl}`);

        await page.goto(adminOrdersUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Ждем загрузки страницы
        await new Promise(r => setTimeout(r, 2000));

        // Делаем скриншот всей страницы
        console.log('\n3. Делаю скриншот страницы админки заказов...');
        const screenshotPath = path.join(__dirname, 'pravka-01-admin-orders.png');
        await page.screenshot({
            path: screenshotPath,
            fullPage: false
        });
        console.log(`   Скриншот сохранен: ${screenshotPath}`);

        // Анализ наличия горизонтального скролла
        console.log('\n4. Анализирую структуру таблицы и скроллбаров...');

        const scrollAnalysis = await page.evaluate(() => {
            const results = {
                pageTitle: document.title,
                hasOrdersTable: false,
                tableInfo: null,
                scrollContainers: [],
                topScrollbar: null,
                bottomScrollbar: null,
                analysis: ''
            };

            // Ищем таблицу заказов
            const table = document.querySelector('table');
            if (table) {
                results.hasOrdersTable = true;
                const tableRect = table.getBoundingClientRect();
                results.tableInfo = {
                    width: tableRect.width,
                    height: tableRect.height,
                    scrollWidth: table.scrollWidth,
                    clientWidth: table.clientWidth,
                    hasHorizontalOverflow: table.scrollWidth > table.clientWidth
                };
            }

            // Ищем контейнеры со скроллом
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const style = window.getComputedStyle(el);
                const hasOverflowX = style.overflowX === 'auto' || style.overflowX === 'scroll';
                const hasOverflowY = style.overflowY === 'auto' || style.overflowY === 'scroll';

                if (hasOverflowX || hasOverflowY) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 100 && rect.height > 50) {
                        results.scrollContainers.push({
                            tagName: el.tagName,
                            className: el.className.toString().substring(0, 100),
                            overflowX: style.overflowX,
                            overflowY: style.overflowY,
                            scrollWidth: el.scrollWidth,
                            clientWidth: el.clientWidth,
                            hasHorizontalScroll: el.scrollWidth > el.clientWidth,
                            rect: {
                                top: Math.round(rect.top),
                                left: Math.round(rect.left),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height)
                            }
                        });
                    }
                }
            });

            // Ищем специальный элемент скроллбара сверху
            const topScrollElements = document.querySelectorAll(
                '[class*="top-scroll"], [class*="scroll-top"], [class*="scrollbar-top"], ' +
                '[class*="dual-scroll"], [class*="sync-scroll"], [data-scroll="top"]'
            );

            if (topScrollElements.length > 0) {
                results.topScrollbar = {
                    found: true,
                    count: topScrollElements.length,
                    elements: Array.from(topScrollElements).map(el => ({
                        tagName: el.tagName,
                        className: el.className.toString().substring(0, 100)
                    }))
                };
            }

            // Проверяем структуру контейнера таблицы
            const tableContainer = table?.closest('[class*="scroll"], [class*="container"], [class*="wrapper"]');
            if (tableContainer) {
                const containerStyle = window.getComputedStyle(tableContainer);
                results.tableContainer = {
                    tagName: tableContainer.tagName,
                    className: tableContainer.className.toString().substring(0, 150),
                    overflowX: containerStyle.overflowX,
                    position: containerStyle.position
                };
            }

            // Финальный анализ
            if (results.topScrollbar?.found) {
                results.analysis = 'НАЙДЕН верхний скроллбар! Правка выполнена.';
            } else if (results.scrollContainers.length > 1) {
                const hasTopContainer = results.scrollContainers.some(c => c.rect.top < 300 && c.hasHorizontalScroll);
                if (hasTopContainer) {
                    results.analysis = 'Возможно есть верхний скролл-контейнер. Требуется визуальная проверка.';
                } else {
                    results.analysis = 'Верхний скроллбар НЕ найден. Только стандартный скролл внизу.';
                }
            } else {
                results.analysis = 'Верхний скроллбар НЕ обнаружен. Рекомендуется добавить dual-scrollbar.';
            }

            return results;
        });

        // Вывод результатов анализа
        console.log('\n========================================');
        console.log('РЕЗУЛЬТАТЫ АНАЛИЗА:');
        console.log('========================================');
        console.log(`Заголовок страницы: ${scrollAnalysis.pageTitle}`);
        console.log(`Таблица заказов найдена: ${scrollAnalysis.hasOrdersTable ? 'ДА' : 'НЕТ'}`);

        if (scrollAnalysis.tableInfo) {
            console.log('\nИнформация о таблице:');
            console.log(`  - Ширина: ${scrollAnalysis.tableInfo.width}px`);
            console.log(`  - scrollWidth: ${scrollAnalysis.tableInfo.scrollWidth}px`);
            console.log(`  - clientWidth: ${scrollAnalysis.tableInfo.clientWidth}px`);
            console.log(`  - Горизонтальный overflow: ${scrollAnalysis.tableInfo.hasHorizontalOverflow ? 'ДА' : 'НЕТ'}`);
        }

        console.log(`\nНайдено контейнеров со скроллом: ${scrollAnalysis.scrollContainers.length}`);
        scrollAnalysis.scrollContainers.forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.tagName} (top: ${c.rect.top}px)`);
            console.log(`     overflowX: ${c.overflowX}, hasHScroll: ${c.hasHorizontalScroll}`);
            console.log(`     class: ${c.className.substring(0, 60)}...`);
        });

        if (scrollAnalysis.topScrollbar) {
            console.log('\nВерхний скроллбар:');
            console.log(`  Найден: ${scrollAnalysis.topScrollbar.found ? 'ДА' : 'НЕТ'}`);
            console.log(`  Количество элементов: ${scrollAnalysis.topScrollbar.count}`);
        }

        if (scrollAnalysis.tableContainer) {
            console.log('\nКонтейнер таблицы:');
            console.log(`  Класс: ${scrollAnalysis.tableContainer.className}`);
            console.log(`  overflowX: ${scrollAnalysis.tableContainer.overflowX}`);
        }

        console.log('\n========================================');
        console.log('ВЫВОД:', scrollAnalysis.analysis);
        console.log('========================================\n');

        // Дополнительный скриншот только области таблицы
        const tableElement = await page.$('table');
        if (tableElement) {
            const tableBox = await tableElement.boundingBox();
            if (tableBox) {
                const tableScreenshotPath = path.join(__dirname, 'pravka-01-admin-orders-table.png');
                await page.screenshot({
                    path: tableScreenshotPath,
                    clip: {
                        x: Math.max(0, tableBox.x - 20),
                        y: Math.max(0, tableBox.y - 60),
                        width: Math.min(tableBox.width + 40, 1280),
                        height: Math.min(tableBox.height + 80, 600)
                    }
                });
                console.log(`Скриншот таблицы: ${tableScreenshotPath}`);
            }
        }

        // ==========================================
        // ШАГ 5: Проверка скролла при узком viewport
        // ==========================================
        console.log('\n5. Проверяю скролл при узком viewport (900px)...');
        await page.setViewport({ width: 900, height: 800 });
        await new Promise(r => setTimeout(r, 1000));

        const narrowScreenshotPath = path.join(__dirname, 'pravka-01-admin-orders-narrow.png');
        await page.screenshot({
            path: narrowScreenshotPath,
            fullPage: false
        });
        console.log(`   Скриншот узкого viewport: ${narrowScreenshotPath}`);

        // Повторный анализ при узком viewport
        const narrowAnalysis = await page.evaluate(() => {
            const table = document.querySelector('table');
            const scrollContainer = table?.closest('[class*="overflow"]');

            const info = {
                tableWidth: table?.scrollWidth || 0,
                containerWidth: scrollContainer?.clientWidth || 0,
                hasHScroll: false,
                scrollContainerClass: scrollContainer?.className || 'not found',
                topScrollbarElements: []
            };

            if (scrollContainer) {
                info.hasHScroll = scrollContainer.scrollWidth > scrollContainer.clientWidth;
            }

            // Ищем элементы, которые могут быть верхним скроллбаром
            const potentialTopScrollbars = document.querySelectorAll(
                '[class*="top-scroll"], [class*="scroll-top"], [class*="dual"], ' +
                '[class*="sync"], [style*="overflow-x"][style*="position: sticky"]'
            );

            potentialTopScrollbars.forEach(el => {
                const rect = el.getBoundingClientRect();
                info.topScrollbarElements.push({
                    tag: el.tagName,
                    class: el.className.toString().substring(0, 80),
                    top: rect.top,
                    height: rect.height
                });
            });

            return info;
        });

        console.log('\n   Анализ при узком viewport:');
        console.log(`   - Ширина таблицы: ${narrowAnalysis.tableWidth}px`);
        console.log(`   - Ширина контейнера: ${narrowAnalysis.containerWidth}px`);
        console.log(`   - Горизонтальный скролл: ${narrowAnalysis.hasHScroll ? 'ЕСТЬ' : 'НЕТ'}`);
        console.log(`   - Контейнер: ${narrowAnalysis.scrollContainerClass.substring(0, 60)}...`);

        if (narrowAnalysis.topScrollbarElements.length > 0) {
            console.log('\n   Потенциальные верхние скроллбары:');
            narrowAnalysis.topScrollbarElements.forEach((el, i) => {
                console.log(`   ${i + 1}. ${el.tag} (top: ${el.top}px, height: ${el.height}px)`);
            });
        } else {
            console.log('\n   Верхний скроллбар НЕ обнаружен при узком viewport.');
        }

        return { scrollAnalysis, narrowAnalysis };

    } catch (error) {
        console.error('ОШИБКА:', error.message);

        // Делаем скриншот ошибки
        const page = (await browser.pages())[0];
        if (page) {
            const errorScreenshotPath = path.join(__dirname, 'pravka-01-admin-orders-error.png');
            await page.screenshot({
                path: errorScreenshotPath,
                fullPage: true
            });
            console.log(`Скриншот ошибки: ${errorScreenshotPath}`);
        }

        throw error;
    } finally {
        await browser.close();
    }
}

// Запуск
verifyPravka01()
    .then(result => {
        console.log('\nТест завершен успешно.');
        process.exit(0);
    })
    .catch(error => {
        console.error('\nТест завершен с ошибкой:', error.message);
        process.exit(1);
    });
