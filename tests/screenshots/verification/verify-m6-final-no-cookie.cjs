const puppeteer = require('puppeteer');
const path = require('path');

async function verifyMobileBottomNavNoCookie() {
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

  // Set localStorage before page load to hide cookie banner
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('cookiesAccepted', 'true');
  });

  console.log('Opening http://localhost:8080/ with cookies pre-accepted...');

  try {
    await page.goto('http://localhost:8080/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot
    const screenshotPath = path.join(__dirname, 'verify-m6-final-no-cookie.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: false
    });
    console.log('Screenshot saved to:', screenshotPath);

    // Check if MobileBottomNav is visible
    const bottomNav = await page.$('nav.fixed.bottom-0');
    if (bottomNav) {
      const boundingBox = await bottomNav.boundingBox();
      console.log('MobileBottomNav found, bounding box:', boundingBox);
    }

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

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

verifyMobileBottomNavNoCookie();
