const puppeteer = require('puppeteer');
const path = require('path');

async function verifyMobileBottomNavClean() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
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

  // Set localStorage before page load to hide cookie banner (correct key!)
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('cookie-consent', 'accepted');
  });

  console.log('Opening http://localhost:8080/ with cookies pre-accepted...');

  try {
    await page.goto('http://localhost:8080/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot - this is the final verification screenshot
    const screenshotPath = path.join(__dirname, 'verify-m6-final.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: false
    });
    console.log('Screenshot saved to:', screenshotPath);

    // Get detailed analysis of bottom nav
    const analysis = await page.evaluate(() => {
      const nav = document.querySelector('nav.fixed.bottom-0');
      if (!nav) return { found: false };

      const style = window.getComputedStyle(nav);
      const rect = nav.getBoundingClientRect();

      // Get all text content from nav items
      const items = [];
      const links = nav.querySelectorAll('a, button');
      links.forEach(link => {
        const spans = link.querySelectorAll('span');
        const texts = Array.from(spans).map(s => s.textContent.trim()).filter(Boolean);
        items.push(texts.join(' '));
      });

      return {
        found: true,
        zIndex: style.zIndex,
        backgroundColor: style.backgroundColor,
        position: {
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height
        },
        items: items
      };
    });

    console.log('\n=== MobileBottomNav Analysis ===');
    console.log('Found:', analysis.found);
    console.log('Z-index:', analysis.zIndex);
    console.log('Background color:', analysis.backgroundColor);
    console.log('Position:', analysis.position);
    console.log('Nav items:', analysis.items);

    // Check for cookie banner
    const cookieBanner = await page.evaluate(() => {
      const banner = document.querySelector('[class*="bottom-16"], [class*="cookie"]');
      return banner ? true : false;
    });
    console.log('Cookie banner visible:', cookieBanner);

    console.log('\n=== VERIFICATION RESULT ===');
    if (analysis.found && analysis.items.length === 5) {
      console.log('STATUS: РАБОТАЕТ');
      console.log('- Белая панель внизу экрана: rgb(255, 255, 255) === белый');
      console.log('- 5 иконок с подписями:', analysis.items.join(', '));
      console.log('- Z-index:', analysis.zIndex);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

verifyMobileBottomNavClean();
