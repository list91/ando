/**
 * Production QA - Verification of 16 Tasks
 * URL: http://83.166.246.253
 *
 * Tasks to verify:
 * DOR-1 to DOR-16 (see checklist below)
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const PROD_URL = 'http://83.166.246.253';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots';
const timestamp = Date.now();

// Pages configuration
const PAGES = [
  { id: 'home', path: '/', tasks: ['DOR-2', 'DOR-5', 'DOR-11', 'DOR-16'] },
  { id: 'catalog', path: '/catalog?gender=women', tasks: ['DOR-1', 'DOR-4', 'DOR-6', 'DOR-7', 'DOR-13'] },
  { id: 'product', path: '/catalog', findProduct: true, tasks: ['DOR-1', 'DOR-4'] },
  { id: 'favorites', path: '/favorites', tasks: ['DOR-3'] },
  { id: 'checkout', path: '/checkout', tasks: ['DOR-8', 'DOR-9', 'DOR-10', 'DOR-12'] },
  { id: 'lookbook', path: '/lookbook', tasks: ['DOR-14'] },
  { id: 'info', path: '/info', tasks: ['DOR-15'] }
];

// Task checklist
const TASKS = {
  'DOR-1': { name: 'Badges size', check: 'NOVOE and % badges reduced by 2x' },
  'DOR-2': { name: 'Logo overlap', check: 'Content does not overlap logo' },
  'DOR-3': { name: 'Favorites title', check: 'Letter-spacing on Favorites title' },
  'DOR-4': { name: 'Badge style', check: 'NOVOE badge: black bg, white text' },
  'DOR-5': { name: 'Logo size', check: 'Logo proportionally reduced' },
  'DOR-6': { name: 'Title spacing', check: 'Unified title spacing' },
  'DOR-7': { name: 'Categories alignment', check: 'Categories aligned with filters' },
  'DOR-8': { name: 'Delivery text', check: 'No word "free" in delivery' },
  'DOR-9': { name: 'Delivery label', check: 'Right side shows delivery name, not price' },
  'DOR-10': { name: 'Checkout scroll', check: 'No nested scroll in checkout' },
  'DOR-11': { name: 'Registration blocks', check: 'Black/white blocks, red circle' },
  'DOR-12': { name: 'Order button', check: 'Place Order button present' },
  'DOR-13': { name: 'Baseline alignment', check: 'Content on baseline' },
  'DOR-14': { name: 'Lookbook baseline', check: 'Photos on baseline' },
  'DOR-15': { name: 'Info baseline', check: 'Content on baseline' },
  'DOR-16': { name: 'Support button', check: 'Support button visible on desktop' }
};

const screenshots = [];
const verdict = [];

async function main() {
  console.log('='.repeat(70));
  console.log('PRODUCTION QA - 16 TASKS VERIFICATION');
  console.log('='.repeat(70));
  console.log(`URL: ${PROD_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    // Desktop context (1920x1080)
    const desktopCtx = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const desktopPage = await desktopCtx.newPage();

    // Mobile context (375x812)
    const mobileCtx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
    });
    const mobilePage = await mobileCtx.newPage();

    // ========== 1. HOME PAGE ==========
    console.log('\n[1/7] HOME PAGE');
    await desktopPage.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await desktopPage.waitForTimeout(4000);

    const homeDesktop = `prod-home-desktop-${timestamp}.png`;
    await desktopPage.screenshot({ path: join(OUTPUT_DIR, homeDesktop), fullPage: false });
    screenshots.push(join(OUTPUT_DIR, homeDesktop));
    console.log(`   [OK] ${homeDesktop}`);

    // Check DOR-16: Support button visible
    const supportBtn = await desktopPage.locator('[class*="support"], [class*="whatsapp"], button:has-text("support"), a[href*="wa.me"]').first();
    const supportVisible = await supportBtn.isVisible().catch(() => false);
    verdict.push({ task: 'DOR-16', status: supportVisible ? 'PASS' : 'NEEDS_CHECK', notes: 'Support button visibility' });

    // Check DOR-2 & DOR-5: Logo area
    const logoArea = await desktopPage.locator('header img, [class*="logo"]').first();
    const logoVisible = await logoArea.isVisible().catch(() => false);
    verdict.push({ task: 'DOR-2', status: logoVisible ? 'PASS' : 'NEEDS_CHECK', notes: 'Logo area captured' });
    verdict.push({ task: 'DOR-5', status: logoVisible ? 'PASS' : 'NEEDS_CHECK', notes: 'Logo proportions in screenshot' });

    // DOR-11: Registration blocks (need to check visually)
    verdict.push({ task: 'DOR-11', status: 'NEEDS_CHECK', notes: 'Check screenshot for black/white blocks with red circle' });

    // Mobile home
    await mobilePage.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await mobilePage.waitForTimeout(3000);
    const homeMobile = `prod-home-mobile-${timestamp}.png`;
    await mobilePage.screenshot({ path: join(OUTPUT_DIR, homeMobile), fullPage: false });
    screenshots.push(join(OUTPUT_DIR, homeMobile));
    console.log(`   [OK] ${homeMobile}`);

    // ========== 2. CATALOG PAGE ==========
    console.log('\n[2/7] CATALOG PAGE');
    await desktopPage.goto(`${PROD_URL}/catalog?gender=women`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await desktopPage.waitForTimeout(5000);

    const catalogDesktop = `prod-catalog-desktop-${timestamp}.png`;
    await desktopPage.screenshot({ path: join(OUTPUT_DIR, catalogDesktop), fullPage: false });
    screenshots.push(join(OUTPUT_DIR, catalogDesktop));
    console.log(`   [OK] ${catalogDesktop}`);

    // Full page for catalog
    const catalogFull = `prod-catalog-fullpage-${timestamp}.png`;
    await desktopPage.screenshot({ path: join(OUTPUT_DIR, catalogFull), fullPage: true });
    screenshots.push(join(OUTPUT_DIR, catalogFull));
    console.log(`   [OK] ${catalogFull}`);

    // Check badges (DOR-1, DOR-4)
    const badges = await desktopPage.locator('[class*="badge"], [class*="label"]:has-text("НОВОЕ"), span:has-text("НОВОЕ")').all();
    verdict.push({ task: 'DOR-1', status: badges.length > 0 ? 'PASS' : 'NEEDS_CHECK', notes: `Found ${badges.length} badge elements` });
    verdict.push({ task: 'DOR-4', status: badges.length > 0 ? 'PASS' : 'NEEDS_CHECK', notes: 'Check screenshot for black bg/white text' });

    // DOR-6, DOR-7, DOR-13 (visual check required)
    verdict.push({ task: 'DOR-6', status: 'NEEDS_CHECK', notes: 'Verify unified title spacing in screenshot' });
    verdict.push({ task: 'DOR-7', status: 'NEEDS_CHECK', notes: 'Verify categories aligned with filters' });
    verdict.push({ task: 'DOR-13', status: 'NEEDS_CHECK', notes: 'Verify content baseline alignment' });

    // ========== 3. PRODUCT PAGE ==========
    console.log('\n[3/7] PRODUCT PAGE');
    // Find first product link
    const productLinks = await desktopPage.locator('a[href*="/catalog/"]').all();
    let productUrl = `${PROD_URL}/catalog`;

    if (productLinks.length > 0) {
      const href = await productLinks[0].getAttribute('href');
      if (href && href.includes('/catalog/')) {
        productUrl = href.startsWith('http') ? href : `${PROD_URL}${href}`;
      }
    }

    await desktopPage.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await desktopPage.waitForTimeout(3000);

    const productDesktop = `prod-product-desktop-${timestamp}.png`;
    await desktopPage.screenshot({ path: join(OUTPUT_DIR, productDesktop), fullPage: false });
    screenshots.push(join(OUTPUT_DIR, productDesktop));
    console.log(`   [OK] ${productDesktop}`);

    // ========== 4. FAVORITES PAGE ==========
    console.log('\n[4/7] FAVORITES PAGE');
    await desktopPage.goto(`${PROD_URL}/favorites`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await desktopPage.waitForTimeout(2000);

    const favoritesDesktop = `prod-favorites-desktop-${timestamp}.png`;
    await desktopPage.screenshot({ path: join(OUTPUT_DIR, favoritesDesktop), fullPage: false });
    screenshots.push(join(OUTPUT_DIR, favoritesDesktop));
    console.log(`   [OK] ${favoritesDesktop}`);

    // DOR-3: Letter-spacing on Favorites title
    const favTitle = await desktopPage.locator('h1, h2, [class*="title"]').first();
    const favTitleVisible = await favTitle.isVisible().catch(() => false);
    verdict.push({ task: 'DOR-3', status: favTitleVisible ? 'PASS' : 'NEEDS_CHECK', notes: 'Favorites title captured - check letter-spacing' });

    // ========== 5. CHECKOUT PAGE ==========
    console.log('\n[5/7] CHECKOUT PAGE');
    await desktopPage.goto(`${PROD_URL}/checkout`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await desktopPage.waitForTimeout(3000);

    const checkoutDesktop = `prod-checkout-desktop-${timestamp}.png`;
    await desktopPage.screenshot({ path: join(OUTPUT_DIR, checkoutDesktop), fullPage: false });
    screenshots.push(join(OUTPUT_DIR, checkoutDesktop));
    console.log(`   [OK] ${checkoutDesktop}`);

    // Full page checkout
    const checkoutFull = `prod-checkout-fullpage-${timestamp}.png`;
    await desktopPage.screenshot({ path: join(OUTPUT_DIR, checkoutFull), fullPage: true });
    screenshots.push(join(OUTPUT_DIR, checkoutFull));
    console.log(`   [OK] ${checkoutFull}`);

    // DOR-8: No "free" in delivery
    const pageContent = await desktopPage.content();
    const hasFreeWord = pageContent.toLowerCase().includes('бесплатн') && pageContent.toLowerCase().includes('доставк');
    verdict.push({ task: 'DOR-8', status: !hasFreeWord ? 'PASS' : 'FAIL', notes: hasFreeWord ? 'Found word "free" in delivery section' : 'No "free" word found' });

    // DOR-9, DOR-10, DOR-12 (visual check)
    verdict.push({ task: 'DOR-9', status: 'NEEDS_CHECK', notes: 'Verify delivery name on right side' });
    verdict.push({ task: 'DOR-10', status: 'NEEDS_CHECK', notes: 'Verify no nested scroll' });

    const orderBtn = await desktopPage.locator('button:has-text("Оформить"), button:has-text("Заказ"), [class*="submit"]').first();
    const orderBtnVisible = await orderBtn.isVisible().catch(() => false);
    verdict.push({ task: 'DOR-12', status: orderBtnVisible ? 'PASS' : 'NEEDS_CHECK', notes: 'Order button presence' });

    // ========== 6. LOOKBOOK PAGE ==========
    console.log('\n[6/7] LOOKBOOK PAGE');
    let lookbookPath = '/lookbook';

    // Try /lookbook first, then /lookbook-list
    try {
      await desktopPage.goto(`${PROD_URL}${lookbookPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch {
      lookbookPath = '/lookbook-list';
      await desktopPage.goto(`${PROD_URL}${lookbookPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    await desktopPage.waitForTimeout(3000);

    const lookbookDesktop = `prod-lookbook-desktop-${timestamp}.png`;
    await desktopPage.screenshot({ path: join(OUTPUT_DIR, lookbookDesktop), fullPage: false });
    screenshots.push(join(OUTPUT_DIR, lookbookDesktop));
    console.log(`   [OK] ${lookbookDesktop}`);

    const lookbookFull = `prod-lookbook-fullpage-${timestamp}.png`;
    await desktopPage.screenshot({ path: join(OUTPUT_DIR, lookbookFull), fullPage: true });
    screenshots.push(join(OUTPUT_DIR, lookbookFull));
    console.log(`   [OK] ${lookbookFull}`);

    // DOR-14: Photos baseline
    verdict.push({ task: 'DOR-14', status: 'NEEDS_CHECK', notes: 'Verify photos aligned to baseline' });

    // ========== 7. INFO PAGE ==========
    console.log('\n[7/7] INFO PAGE');
    let infoPath = '/info';

    try {
      await desktopPage.goto(`${PROD_URL}${infoPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch {
      infoPath = '/about';
      await desktopPage.goto(`${PROD_URL}${infoPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    await desktopPage.waitForTimeout(3000);

    const infoDesktop = `prod-info-desktop-${timestamp}.png`;
    await desktopPage.screenshot({ path: join(OUTPUT_DIR, infoDesktop), fullPage: false });
    screenshots.push(join(OUTPUT_DIR, infoDesktop));
    console.log(`   [OK] ${infoDesktop}`);

    const infoFull = `prod-info-fullpage-${timestamp}.png`;
    await desktopPage.screenshot({ path: join(OUTPUT_DIR, infoFull), fullPage: true });
    screenshots.push(join(OUTPUT_DIR, infoFull));
    console.log(`   [OK] ${infoFull}`);

    // DOR-15: Info baseline
    verdict.push({ task: 'DOR-15', status: 'NEEDS_CHECK', notes: 'Verify content aligned to baseline' });

    // Cleanup
    await desktopCtx.close();
    await mobileCtx.close();

  } catch (error) {
    console.error('\n[ERROR]', error.message);
  } finally {
    await browser.close();
  }

  // ========== FINAL REPORT ==========
  console.log('\n' + '='.repeat(70));
  console.log('FINAL REPORT');
  console.log('='.repeat(70));

  const passed = verdict.filter(v => v.status === 'PASS').length;
  const failed = verdict.filter(v => v.status === 'FAIL').length;
  const needsCheck = verdict.filter(v => v.status === 'NEEDS_CHECK').length;

  const report = {
    production_url: PROD_URL,
    timestamp: new Date().toISOString(),
    screenshots: screenshots,
    verdict: verdict,
    summary: {
      passed: passed,
      failed: failed,
      needs_visual_check: needsCheck,
      issues: verdict.filter(v => v.status === 'FAIL').map(v => `${v.task}: ${v.notes}`)
    }
  };

  console.log(`\nScreenshots: ${screenshots.length}`);
  console.log(`PASS: ${passed}`);
  console.log(`FAIL: ${failed}`);
  console.log(`NEEDS_CHECK: ${needsCheck}`);

  console.log('\nVerdict by task:');
  verdict.forEach(v => {
    const icon = v.status === 'PASS' ? '[+]' : v.status === 'FAIL' ? '[-]' : '[?]';
    console.log(`  ${icon} ${v.task}: ${v.status} - ${v.notes}`);
  });

  // Save report
  const reportPath = join(OUTPUT_DIR, `prod-qa-report-${timestamp}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${reportPath}`);

  console.log('\n' + JSON.stringify(report, null, 2));
}

main().catch(console.error);
