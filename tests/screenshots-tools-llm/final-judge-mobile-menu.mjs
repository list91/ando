// Final Judge - Mobile Menu and Additional Screenshots
// Improved version for mobile navigation capture

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/final-judge';

async function main() {
  console.log('Taking additional mobile menu screenshots...\n');
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false }); // Non-headless for better rendering

  try {
    // ============================================
    // Mobile Navigation with Menu Open
    // ============================================
    console.log('1. Mobile navigation with menu open...');
    const page = await browser.newPage();
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Take initial state
    await page.screenshot({
      path: join(OUTPUT_DIR, '05-t16-t17-mobile-view.png'),
      fullPage: false
    });

    // Dump all buttons for debugging
    const buttons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .filter(el => el.offsetParent !== null)
        .map(el => ({
          text: el.textContent?.trim().substring(0, 30),
          class: el.className,
          ariaLabel: el.getAttribute('aria-label')
        }));
    });
    console.log('Visible buttons:', JSON.stringify(buttons.slice(0, 10), null, 2));

    // Try clicking burger menu by position (top-left or top-right)
    // Usually burger is in the header area
    const headerButtons = await page.$$eval('header button, nav button, .md\\:hidden button', els =>
      els.map(el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
      })
    );
    console.log('Header buttons positions:', headerButtons);

    // Click first header button (likely burger menu)
    const firstButton = page.locator('button').first();
    if (await firstButton.count() > 0) {
      try {
        await firstButton.click();
        await page.waitForTimeout(1000);
        console.log('Clicked first button');

        await page.screenshot({
          path: join(OUTPUT_DIR, '05-t16-t17-after-first-click.png'),
          fullPage: false
        });
      } catch (e) {
        console.log('First button click failed:', e.message);
      }
    }

    // Now look for navigation links visible on screen
    const navLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .filter(el => el.offsetParent !== null)
        .map(el => ({
          text: el.textContent?.trim(),
          href: el.getAttribute('href'),
          visible: window.getComputedStyle(el).display !== 'none'
        }))
        .filter(l => l.text && l.visible);
    });
    console.log('Visible nav links:', navLinks.slice(0, 10));

    await page.close();

    // ============================================
    // Desktop with FULL sidebar visible
    // ============================================
    console.log('\n2. Desktop full page with sidebar...');
    const desktopPage = await browser.newPage();
    await desktopPage.setViewportSize({ width: 1920, height: 1080 });

    await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await desktopPage.waitForTimeout(2000);

    // Full page screenshot
    await desktopPage.screenshot({
      path: join(OUTPUT_DIR, '04-t14-t15-desktop-fullpage.png'),
      fullPage: true
    });

    // Find sidebar navigation items
    const sidebarItems = await desktopPage.evaluate(() => {
      const items = [];
      document.querySelectorAll('aside a, nav a, [class*="sidebar"] a').forEach(el => {
        if (el.offsetParent) {
          items.push({
            text: el.textContent?.trim(),
            href: el.getAttribute('href')
          });
        }
      });
      return items;
    });
    console.log('Sidebar items:', sidebarItems.filter(i => i.text).slice(0, 15));

    await desktopPage.close();

    // ============================================
    // Catalog page with visible badges
    // ============================================
    console.log('\n3. Catalog page with badges...');
    const catalogPage = await browser.newPage();
    await catalogPage.setViewportSize({ width: 1920, height: 1080 });

    await catalogPage.goto(`${BASE_URL}/catalog?gender=women`, { waitUntil: 'networkidle', timeout: 30000 });
    await catalogPage.waitForTimeout(3000);

    // Check actual badge elements
    const badgeElements = await catalogPage.evaluate(() => {
      const results = [];
      // Look for badge-like elements
      document.querySelectorAll('span, div').forEach(el => {
        const text = el.textContent?.trim();
        const style = window.getComputedStyle(el);
        if (text && text.length < 10 &&
            (text.includes('%') || text === 'НОВОЕ' || text === 'NEW' || text === 'SALE')) {
          results.push({
            text,
            bg: style.backgroundColor,
            color: style.color,
            className: el.className
          });
        }
      });
      return results;
    });
    console.log('Badge elements:', badgeElements.slice(0, 10));

    await catalogPage.screenshot({
      path: join(OUTPUT_DIR, '03-t12-t13-catalog-with-badges.png'),
      fullPage: false
    });

    // Scroll down to see more products
    await catalogPage.evaluate(() => window.scrollBy(0, 600));
    await catalogPage.waitForTimeout(500);

    await catalogPage.screenshot({
      path: join(OUTPUT_DIR, '03-t12-t13-catalog-scrolled.png'),
      fullPage: false
    });

    await catalogPage.close();

  } finally {
    await browser.close();
  }

  console.log('\nAdditional screenshots completed!');
  console.log('Output:', OUTPUT_DIR);
}

main().catch(console.error);
