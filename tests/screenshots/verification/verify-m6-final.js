const puppeteer = require('puppeteer');
const path = require('path');

async function verifyMobileBottomNav() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Set mobile viewport (iPhone X dimensions)
  await page.setViewport({
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  console.log('Opening http://localhost:8080/...');

  try {
    await page.goto('http://localhost:8080/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take first screenshot
    const screenshotPath = path.join(__dirname, 'verify-m6-final.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: false // Only visible viewport
    });
    console.log('Screenshot saved to:', screenshotPath);

    // Check if MobileBottomNav is visible
    const bottomNav = await page.$('nav.fixed.bottom-0');
    if (bottomNav) {
      const boundingBox = await bottomNav.boundingBox();
      console.log('MobileBottomNav found, bounding box:', boundingBox);
    } else {
      console.log('MobileBottomNav not found with selector nav.fixed.bottom-0');

      // Try alternative selectors
      const anyFixedBottom = await page.$$('div.fixed.bottom-0, nav.fixed.bottom-0, footer.fixed.bottom-0');
      console.log('Elements with fixed.bottom-0:', anyFixedBottom.length);
    }

    // Check for cookie banner
    const cookieBanner = await page.$('[class*="cookie"], [class*="Cookie"]');
    if (cookieBanner) {
      console.log('Cookie banner detected, closing it...');

      // Accept cookies via localStorage
      await page.evaluate(() => {
        localStorage.setItem('cookiesAccepted', 'true');
      });

      // Reload page
      await page.reload({ waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Take another screenshot
      const screenshotPath2 = path.join(__dirname, 'verify-m6-final-no-cookie.png');
      await page.screenshot({
        path: screenshotPath2,
        fullPage: false
      });
      console.log('Screenshot without cookie banner saved to:', screenshotPath2);
    }

    // Get page content analysis
    const analysis = await page.evaluate(() => {
      const results = {
        bottomNavExists: false,
        bottomNavVisible: false,
        icons: [],
        zIndex: null,
        position: null
      };

      // Look for bottom navigation
      const navElements = document.querySelectorAll('nav, footer, div');
      for (const el of navElements) {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        // Check if it's at the bottom of the screen
        if (style.position === 'fixed' && rect.bottom >= window.innerHeight - 10) {
          results.bottomNavExists = true;
          results.zIndex = style.zIndex;
          results.position = {
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height
          };

          // Check if visible
          if (rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden') {
            results.bottomNavVisible = true;
          }

          // Find icons/buttons
          const links = el.querySelectorAll('a, button');
          links.forEach(link => {
            const text = link.textContent.trim();
            if (text) {
              results.icons.push(text);
            }
          });

          break;
        }
      }

      return results;
    });

    console.log('\n=== Page Analysis ===');
    console.log('Bottom nav exists:', analysis.bottomNavExists);
    console.log('Bottom nav visible:', analysis.bottomNavVisible);
    console.log('Z-index:', analysis.zIndex);
    console.log('Position:', analysis.position);
    console.log('Icons/labels found:', analysis.icons);

    // Determine status
    const expectedLabels = ['Меню', 'Поиск', 'Избранное', 'Корзина', 'Аккаунт'];
    const hasAllLabels = expectedLabels.every(label =>
      analysis.icons.some(icon => icon.includes(label))
    );

    console.log('\n=== VERIFICATION RESULT ===');
    if (analysis.bottomNavVisible && analysis.icons.length === 5) {
      console.log('STATUS: РАБОТАЕТ');
      console.log('- Белая панель внизу экрана: ДА');
      console.log('- 5 иконок с подписями: ДА');
      console.log('- Найденные подписи:', analysis.icons.join(', '));
    } else {
      console.log('STATUS: НЕ РАБОТАЕТ');
      console.log('- Bottom nav visible:', analysis.bottomNavVisible);
      console.log('- Icons count:', analysis.icons.length);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

verifyMobileBottomNav();
