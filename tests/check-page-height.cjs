/**
 * Check actual page content height
 */

const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:8087';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'current');

async function checkPageHeight() {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check various height measurements
    const heights = await page.evaluate(() => {
      return {
        documentScrollHeight: document.documentElement.scrollHeight,
        documentClientHeight: document.documentElement.clientHeight,
        documentOffsetHeight: document.documentElement.offsetHeight,
        bodyScrollHeight: document.body.scrollHeight,
        bodyClientHeight: document.body.clientHeight,
        bodyOffsetHeight: document.body.offsetHeight,
        windowInnerHeight: window.innerHeight,
        // Check for overflow styles on all parent elements
        bodyStyle: {
          overflow: window.getComputedStyle(document.body).overflow,
          overflowY: window.getComputedStyle(document.body).overflowY,
          height: window.getComputedStyle(document.body).height,
          maxHeight: window.getComputedStyle(document.body).maxHeight
        },
        htmlStyle: {
          overflow: window.getComputedStyle(document.documentElement).overflow,
          overflowY: window.getComputedStyle(document.documentElement).overflowY,
          height: window.getComputedStyle(document.documentElement).height,
          maxHeight: window.getComputedStyle(document.documentElement).maxHeight
        },
        // Count sections
        sections: document.querySelectorAll('section').length,
        divs: document.querySelectorAll('main > div, main > section').length,
        // Check main element
        mainHeight: document.querySelector('main')?.scrollHeight || 0
      };
    });

    console.log('Page heights:', JSON.stringify(heights, null, 2));

    // Try fullPage screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'fullpage-check.png'),
      fullPage: true
    });

    console.log('\nFullPage screenshot saved');

    // Check if there's a scroll container
    const scrollContainers = await page.evaluate(() => {
      const containers = [];
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.overflow === 'auto' || style.overflow === 'scroll' ||
            style.overflowY === 'auto' || style.overflowY === 'scroll') {
          if (el.scrollHeight > el.clientHeight) {
            containers.push({
              tag: el.tagName,
              id: el.id,
              className: el.className?.substring(0, 80),
              scrollHeight: el.scrollHeight,
              clientHeight: el.clientHeight
            });
          }
        }
      });
      return containers;
    });

    console.log('\nScrollable containers:', JSON.stringify(scrollContainers, null, 2));

    await context.close();

  } finally {
    await browser.close();
  }
}

checkPageHeight().catch(console.error);
