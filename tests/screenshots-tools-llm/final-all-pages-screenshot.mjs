// Final All Pages Screenshot - Captures all key pages
// Playwright script for final snapshot

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots';

// Pages to capture
const PAGES = [
  { name: 'home', path: '/', description: 'Home page' },
  { name: 'catalog', path: '/catalog', description: 'Catalog page' },
  { name: 'catalog-women', path: '/catalog?gender=women', description: 'Catalog Women' },
  { name: 'product', path: '/catalog', description: 'Product detail page', findProduct: true },
  { name: 'favorites', path: '/favorites', description: 'Favorites page' },
  { name: 'checkout', path: '/checkout', description: 'Checkout page' },
  { name: 'lookbook', path: '/lookbook', description: 'Lookbook page' },
  { name: 'info', path: '/info', description: 'Info/About page' }
];

const screenshots = [];
const errors = [];
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

async function main() {
  console.log('Starting Final All Pages Screenshot...\n');
  console.log('Timestamp:', timestamp);
  console.log('Base URL:', BASE_URL);
  console.log('Output:', OUTPUT_DIR);
  console.log('='.repeat(60));

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    for (const pageConfig of PAGES) {
      console.log(`\n[${pageConfig.name.toUpperCase()}] ${pageConfig.description}...`);

      const page = await browser.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });

      try {
        let targetUrl = BASE_URL + pageConfig.path;

        // Special handling for product page - need to find a product first
        if (pageConfig.findProduct) {
          await page.goto(BASE_URL + '/catalog', { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(2000);

          // Find first product link
          const productLink = page.locator('a[href*="/catalog/"]').first();
          if (await productLink.count() > 0) {
            const href = await productLink.getAttribute('href');
            if (href) {
              targetUrl = BASE_URL + href;
            }
          }
        }

        await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        const filename = `final-${pageConfig.name}-${timestamp}.png`;
        const filepath = join(OUTPUT_DIR, filename);

        // Take viewport screenshot
        await page.screenshot({
          path: filepath,
          fullPage: false
        });

        screenshots.push({
          page: pageConfig.name,
          filename: filename,
          path: filepath,
          url: targetUrl
        });

        console.log(`   [OK] Saved: ${filename}`);

        // Also take fullpage for some pages
        if (['catalog', 'lookbook', 'info'].includes(pageConfig.name)) {
          const fullFilename = `final-${pageConfig.name}-fullpage-${timestamp}.png`;
          const fullFilepath = join(OUTPUT_DIR, fullFilename);

          await page.screenshot({
            path: fullFilepath,
            fullPage: true
          });

          screenshots.push({
            page: pageConfig.name + '-fullpage',
            filename: fullFilename,
            path: fullFilepath,
            url: targetUrl
          });
          console.log(`   [OK] Saved fullpage: ${fullFilename}`);
        }

      } catch (e) {
        errors.push({
          page: pageConfig.name,
          error: e.message
        });
        console.log(`   [FAIL] ${e.message}`);
      } finally {
        await page.close();
      }
    }

  } finally {
    await browser.close();
  }

  // Generate final report
  console.log('\n' + '='.repeat(60));
  console.log('FINAL REPORT');
  console.log('='.repeat(60));

  const pagesCovered = screenshots.map(s => s.page).filter(p => !p.includes('-fullpage'));

  const result = {
    status: errors.length === 0 ? 'success' : (screenshots.length > 0 ? 'partial' : 'failed'),
    screenshots_taken: screenshots.map(s => s.path),
    pages_covered: [...new Set(pagesCovered)],
    errors: errors.map(e => `${e.page}: ${e.error}`),
    tool_used: 'final-all-pages-screenshot.mjs'
  };

  console.log(`\nStatus: ${result.status}`);
  console.log(`Screenshots: ${screenshots.length}`);
  console.log(`Pages covered: ${result.pages_covered.join(', ')}`);

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    errors.forEach(e => console.log(`  - ${e.page}: ${e.error}`));
  }

  console.log('\n' + JSON.stringify(result, null, 2));
}

main().catch(console.error);
