import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, 'test-results', 'final-judge');

const BASE_URL = 'http://localhost:5173';

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    // ========== DESKTOP: Catalog page sidebar ==========
    console.log('1. Desktop catalog sidebar screenshot...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const desktopPage = await desktopContext.newPage();

    // Navigate to catalog page
    await desktopPage.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle', timeout: 30000 });
    await desktopPage.waitForTimeout(2000);

    // Wait for sidebar to be visible
    await desktopPage.waitForSelector('aside', { timeout: 10000 }).catch(() => {});

    // Take full page screenshot
    const desktopFullPath = path.join(outputDir, 'desktop-catalog-sidebar-full.png');
    await desktopPage.screenshot({ path: desktopFullPath, fullPage: false });
    console.log(`  Saved: ${desktopFullPath}`);
    results.push({ name: 'desktop-catalog-sidebar-full', path: desktopFullPath });

    // Try to find sidebar element for focused screenshot
    const sidebar = await desktopPage.$('aside');
    if (sidebar) {
      const sidebarPath = path.join(outputDir, 'desktop-catalog-sidebar-element.png');
      await sidebar.screenshot({ path: sidebarPath });
      console.log(`  Saved: ${sidebarPath}`);
      results.push({ name: 'desktop-catalog-sidebar-element', path: sidebarPath });
    }

    // Check for РАСПРОДАЖА and НОВОЕ links
    const saleLink = await desktopPage.$('a[href*="sale"], a:has-text("РАСПРОДАЖА")');
    const newLink = await desktopPage.$('a[href*="new"], a:has-text("НОВОЕ")');
    console.log(`  РАСПРОДАЖА link found: ${!!saleLink}`);
    console.log(`  НОВОЕ link found: ${!!newLink}`);

    await desktopContext.close();

    // ========== MOBILE: Catalog page with hamburger menu ==========
    console.log('\n2. Mobile catalog hamburger menu screenshot...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();

    // Navigate to catalog page
    await mobilePage.goto(`${BASE_URL}/catalog`, { waitUntil: 'networkidle', timeout: 30000 });
    await mobilePage.waitForTimeout(2000);

    // Take screenshot before opening menu
    const mobileBeforePath = path.join(outputDir, 'mobile-catalog-before-menu.png');
    await mobilePage.screenshot({ path: mobileBeforePath });
    console.log(`  Saved: ${mobileBeforePath}`);
    results.push({ name: 'mobile-catalog-before-menu', path: mobileBeforePath });

    // Try to find and click hamburger menu button - using known working selector
    const menuButton = mobilePage.locator('button[aria-label="Открыть меню"]');
    let menuOpened = false;

    if (await menuButton.count() > 0) {
      console.log('  Found hamburger with aria-label="Открыть меню"');
      await menuButton.click();
      await mobilePage.waitForTimeout(800);
      menuOpened = true;
    }

    if (menuOpened) {
      // Wait for menu animation
      await mobilePage.waitForTimeout(500);

      // Take screenshot with menu open
      const mobileMenuPath = path.join(outputDir, 'mobile-catalog-menu-open.png');
      await mobilePage.screenshot({ path: mobileMenuPath });
      console.log(`  Saved: ${mobileMenuPath}`);
      results.push({ name: 'mobile-catalog-menu-open', path: mobileMenuPath });

      // Check for navigation items
      const pageContent = await mobilePage.content();
      const hasSale = pageContent.includes('РАСПРОДАЖА') || pageContent.includes('sale');
      const hasNew = pageContent.includes('НОВОЕ') || pageContent.includes('new');
      console.log(`  РАСПРОДАЖА in menu: ${hasSale}`);
      console.log(`  НОВОЕ in menu: ${hasNew}`);
    } else {
      console.log('  Warning: Could not find hamburger menu button');

      // Take screenshot anyway
      const mobileFallbackPath = path.join(outputDir, 'mobile-catalog-no-menu.png');
      await mobilePage.screenshot({ path: mobileFallbackPath });
      console.log(`  Saved fallback: ${mobileFallbackPath}`);
      results.push({ name: 'mobile-catalog-no-menu', path: mobileFallbackPath });
    }

    await mobileContext.close();

    console.log('\n=== Screenshots completed ===');
    console.log(JSON.stringify({ status: 'success', screenshots: results }, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.log(JSON.stringify({ status: 'failed', error: error.message }, null, 2));
  } finally {
    await browser.close();
  }
}

takeScreenshots();
