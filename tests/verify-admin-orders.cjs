/**
 * Verify Admin Orders page with DualScrollTable (Pravka 13)
 */

const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:8087';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'current');

async function verifyAdminOrders() {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    console.log('=== Pravka 13: Admin Orders with DualScrollTable ===\n');

    // Go to admin login
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check current URL
    console.log('Current URL:', page.url());

    // Check if we need to login
    const passwordInput = await page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      console.log('Login required, entering credentials...');

      // Check if there's an email field
      const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill('admin@ando.ru');
      }

      await passwordInput.fill('secret123');

      // Click submit
      const submitBtn = await page.locator('button[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(2000);

      console.log('After login URL:', page.url());
    }

    // Navigate to orders page
    console.log('Navigating to /admin/orders...');
    await page.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    console.log('Final URL:', page.url());

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'after-13-admin-orders.png'),
      fullPage: false
    });
    console.log('\nScreenshot saved: after-13-admin-orders.png');

    // Check for DualScrollTable
    const dualScrollCheck = await page.evaluate(() => {
      const results = {
        hasTopScrollbar: false,
        hasTable: false,
        tableScrollable: false,
        scrollContainers: []
      };

      // Look for table
      const tables = document.querySelectorAll('table');
      results.hasTable = tables.length > 0;

      // Look for scroll containers
      document.querySelectorAll('[class*="scroll"], [class*="Scroll"], .overflow-x-auto, .overflow-auto').forEach(el => {
        results.scrollContainers.push({
          className: el.className,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          isScrollable: el.scrollWidth > el.clientWidth
        });
      });

      // Check for top scrollbar specifically
      const topScroll = document.querySelector('.dual-scroll-top, [class*="top-scroll"], .scroll-sync-top');
      results.hasTopScrollbar = !!topScroll;

      // Check if any container near table is scrollable
      tables.forEach(table => {
        const parent = table.closest('.overflow-x-auto, .overflow-auto, [class*="scroll"]');
        if (parent && parent.scrollWidth > parent.clientWidth) {
          results.tableScrollable = true;
        }
      });

      return results;
    });

    console.log('\nDualScrollTable Check:');
    console.log(JSON.stringify(dualScrollCheck, null, 2));

    // Check page content
    const pageContent = await page.evaluate(() => {
      const h1 = document.querySelector('h1, h2');
      const tableHeaders = Array.from(document.querySelectorAll('th')).map(th => th.textContent?.trim());
      return {
        heading: h1?.textContent?.trim(),
        tableHeaders: tableHeaders.slice(0, 10)
      };
    });
    console.log('\nPage content:');
    console.log(JSON.stringify(pageContent, null, 2));

    await context.close();

    return {
      success: true,
      hasTable: dualScrollCheck.hasTable,
      hasTopScrollbar: dualScrollCheck.hasTopScrollbar,
      tableScrollable: dualScrollCheck.tableScrollable
    };

  } finally {
    await browser.close();
  }
}

verifyAdminOrders().catch(console.error);
