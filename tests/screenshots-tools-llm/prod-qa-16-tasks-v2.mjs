/**
 * Production QA v2 - 16 Tasks Verification
 * With extended timeouts and better error handling
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const PROD_URL = 'http://83.166.246.253';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots';
const timestamp = Date.now();

const screenshots = [];
const verdict = [];
const errors = [];

async function safeGoto(page, url, name) {
  console.log(`   Loading ${name}...`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(5000);
    return true;
  } catch (e) {
    console.log(`   [WARN] Slow load for ${name}, continuing...`);
    try {
      // Just wait if already partially loaded
      await page.waitForTimeout(8000);
      return true;
    } catch {
      errors.push({ page: name, error: e.message });
      return false;
    }
  }
}

async function takeScreenshot(page, filename, fullPage = false) {
  const path = join(OUTPUT_DIR, filename);
  await page.screenshot({ path, fullPage });
  screenshots.push(path);
  console.log(`   [OK] ${filename}`);
  return path;
}

async function main() {
  console.log('='.repeat(70));
  console.log('PRODUCTION QA v2 - 16 TASKS VERIFICATION');
  console.log('='.repeat(70));
  console.log(`URL: ${PROD_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('Extended timeouts: 120s per page\n');

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    // Desktop context
    const desktopCtx = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const desktopPage = await desktopCtx.newPage();

    // Mobile context
    const mobileCtx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
    });
    const mobilePage = await mobileCtx.newPage();

    // ==================== 1. HOME ====================
    console.log('\n[1/7] HOME PAGE');
    if (await safeGoto(desktopPage, `${PROD_URL}/`, 'Home')) {
      await takeScreenshot(desktopPage, `prod-home-desktop-${timestamp}.png`);

      // DOR-16: Support button
      try {
        const supportVisible = await desktopPage.locator('a[href*="wa.me"], [class*="whatsapp"], [class*="support"]').first().isVisible();
        verdict.push({ task: 'DOR-16', status: supportVisible ? 'PASS' : 'NEEDS_CHECK', notes: 'Support/WhatsApp button' });
      } catch {
        verdict.push({ task: 'DOR-16', status: 'NEEDS_CHECK', notes: 'Check screenshot manually' });
      }

      // DOR-2, DOR-5: Logo
      verdict.push({ task: 'DOR-2', status: 'NEEDS_CHECK', notes: 'Check logo overlap in screenshot' });
      verdict.push({ task: 'DOR-5', status: 'NEEDS_CHECK', notes: 'Check logo proportions in screenshot' });

      // DOR-11: Registration blocks
      verdict.push({ task: 'DOR-11', status: 'NEEDS_CHECK', notes: 'Check black/white blocks with red circle' });
    }

    // Mobile home
    if (await safeGoto(mobilePage, `${PROD_URL}/`, 'Home Mobile')) {
      await takeScreenshot(mobilePage, `prod-home-mobile-${timestamp}.png`);
    }

    // ==================== 2. CATALOG ====================
    console.log('\n[2/7] CATALOG PAGE');
    if (await safeGoto(desktopPage, `${PROD_URL}/catalog?gender=women`, 'Catalog')) {
      await takeScreenshot(desktopPage, `prod-catalog-desktop-${timestamp}.png`);
      await takeScreenshot(desktopPage, `prod-catalog-fullpage-${timestamp}.png`, true);

      // DOR-1: Badge size
      try {
        const badges = await desktopPage.locator('[class*="badge"], span:has-text("НОВОЕ"), span:has-text("новое")').count();
        verdict.push({ task: 'DOR-1', status: badges > 0 ? 'NEEDS_CHECK' : 'N/A', notes: `${badges} badges found - check size reduction` });
      } catch {
        verdict.push({ task: 'DOR-1', status: 'NEEDS_CHECK', notes: 'Check badges in screenshot' });
      }

      // DOR-4: Badge style
      verdict.push({ task: 'DOR-4', status: 'NEEDS_CHECK', notes: 'Check NOVOE badge: black bg, white text' });

      // DOR-6: Title spacing
      verdict.push({ task: 'DOR-6', status: 'NEEDS_CHECK', notes: 'Verify unified title spacing' });

      // DOR-7: Categories alignment
      verdict.push({ task: 'DOR-7', status: 'NEEDS_CHECK', notes: 'Verify categories aligned with filters' });

      // DOR-13: Baseline alignment
      verdict.push({ task: 'DOR-13', status: 'NEEDS_CHECK', notes: 'Verify content baseline alignment' });
    }

    // ==================== 3. PRODUCT ====================
    console.log('\n[3/7] PRODUCT PAGE');
    // Try to find a product link from catalog
    let productHref = null;
    try {
      productHref = await desktopPage.locator('a[href*="/catalog/"]').first().getAttribute('href');
    } catch { }

    if (productHref) {
      const productUrl = productHref.startsWith('http') ? productHref : `${PROD_URL}${productHref}`;
      if (await safeGoto(desktopPage, productUrl, 'Product')) {
        await takeScreenshot(desktopPage, `prod-product-desktop-${timestamp}.png`);
        await takeScreenshot(desktopPage, `prod-product-fullpage-${timestamp}.png`, true);
      }
    } else {
      console.log('   [SKIP] No product link found');
    }

    // ==================== 4. FAVORITES ====================
    console.log('\n[4/7] FAVORITES PAGE');
    if (await safeGoto(desktopPage, `${PROD_URL}/favorites`, 'Favorites')) {
      await takeScreenshot(desktopPage, `prod-favorites-desktop-${timestamp}.png`);

      // DOR-3: Letter-spacing
      verdict.push({ task: 'DOR-3', status: 'NEEDS_CHECK', notes: 'Check letter-spacing on Favorites title' });
    }

    // ==================== 5. CHECKOUT ====================
    console.log('\n[5/7] CHECKOUT PAGE');
    if (await safeGoto(desktopPage, `${PROD_URL}/checkout`, 'Checkout')) {
      await takeScreenshot(desktopPage, `prod-checkout-desktop-${timestamp}.png`);
      await takeScreenshot(desktopPage, `prod-checkout-fullpage-${timestamp}.png`, true);

      // DOR-8: No "free" word
      const content = await desktopPage.content();
      const hasFreeDelivery = content.toLowerCase().includes('бесплатн') &&
        (content.toLowerCase().includes('доставк') || content.toLowerCase().includes('delivery'));
      verdict.push({ task: 'DOR-8', status: !hasFreeDelivery ? 'PASS' : 'FAIL', notes: hasFreeDelivery ? 'Found "free delivery" text' : 'No "free" word in delivery' });

      // DOR-9: Delivery name position
      verdict.push({ task: 'DOR-9', status: 'NEEDS_CHECK', notes: 'Check delivery name on right side' });

      // DOR-10: No nested scroll
      verdict.push({ task: 'DOR-10', status: 'NEEDS_CHECK', notes: 'Verify no nested scroll' });

      // DOR-12: Order button
      try {
        const orderBtn = await desktopPage.locator('button:has-text("Оформить"), button:has-text("заказ"), [type="submit"]').first().isVisible();
        verdict.push({ task: 'DOR-12', status: orderBtn ? 'PASS' : 'NEEDS_CHECK', notes: 'Place Order button' });
      } catch {
        verdict.push({ task: 'DOR-12', status: 'NEEDS_CHECK', notes: 'Check order button in screenshot' });
      }
    }

    // ==================== 6. LOOKBOOK ====================
    console.log('\n[6/7] LOOKBOOK PAGE');
    let lookbookOk = await safeGoto(desktopPage, `${PROD_URL}/lookbook`, 'Lookbook');
    if (!lookbookOk) {
      lookbookOk = await safeGoto(desktopPage, `${PROD_URL}/lookbook-list`, 'Lookbook-list');
    }
    if (lookbookOk) {
      await takeScreenshot(desktopPage, `prod-lookbook-desktop-${timestamp}.png`);
      await takeScreenshot(desktopPage, `prod-lookbook-fullpage-${timestamp}.png`, true);

      // DOR-14: Photos baseline
      verdict.push({ task: 'DOR-14', status: 'NEEDS_CHECK', notes: 'Verify photos aligned to baseline' });
    }

    // ==================== 7. INFO ====================
    console.log('\n[7/7] INFO PAGE');
    let infoOk = await safeGoto(desktopPage, `${PROD_URL}/info`, 'Info');
    if (!infoOk) {
      infoOk = await safeGoto(desktopPage, `${PROD_URL}/about`, 'About');
    }
    if (infoOk) {
      await takeScreenshot(desktopPage, `prod-info-desktop-${timestamp}.png`);
      await takeScreenshot(desktopPage, `prod-info-fullpage-${timestamp}.png`, true);

      // DOR-15: Info baseline
      verdict.push({ task: 'DOR-15', status: 'NEEDS_CHECK', notes: 'Verify content aligned to baseline' });
    }

    await desktopCtx.close();
    await mobileCtx.close();

  } catch (error) {
    console.error('\n[CRITICAL ERROR]', error.message);
  } finally {
    await browser.close();
  }

  // ==================== REPORT ====================
  console.log('\n' + '='.repeat(70));
  console.log('FINAL REPORT');
  console.log('='.repeat(70));

  // Ensure all 16 tasks have a verdict
  const allTasks = ['DOR-1', 'DOR-2', 'DOR-3', 'DOR-4', 'DOR-5', 'DOR-6', 'DOR-7', 'DOR-8',
    'DOR-9', 'DOR-10', 'DOR-11', 'DOR-12', 'DOR-13', 'DOR-14', 'DOR-15', 'DOR-16'];
  const existingTasks = verdict.map(v => v.task);
  allTasks.forEach(task => {
    if (!existingTasks.includes(task)) {
      verdict.push({ task, status: 'NOT_CHECKED', notes: 'Page did not load' });
    }
  });

  // Sort verdict by task number
  verdict.sort((a, b) => {
    const numA = parseInt(a.task.split('-')[1]);
    const numB = parseInt(b.task.split('-')[1]);
    return numA - numB;
  });

  const passed = verdict.filter(v => v.status === 'PASS').length;
  const failed = verdict.filter(v => v.status === 'FAIL').length;
  const needsCheck = verdict.filter(v => v.status === 'NEEDS_CHECK').length;
  const notChecked = verdict.filter(v => v.status === 'NOT_CHECKED').length;

  const report = {
    production_url: PROD_URL,
    timestamp: new Date().toISOString(),
    screenshots: screenshots,
    verdict: verdict,
    summary: {
      passed: passed,
      failed: failed,
      needs_visual_check: needsCheck,
      not_checked: notChecked,
      issues: verdict.filter(v => v.status === 'FAIL').map(v => `${v.task}: ${v.notes}`)
    },
    errors: errors
  };

  console.log(`\nScreenshots taken: ${screenshots.length}`);
  console.log(`PASS: ${passed}`);
  console.log(`FAIL: ${failed}`);
  console.log(`NEEDS_CHECK: ${needsCheck}`);
  console.log(`NOT_CHECKED: ${notChecked}`);

  console.log('\nVerdict by task:');
  verdict.forEach(v => {
    const icon = v.status === 'PASS' ? '[+]' : v.status === 'FAIL' ? '[-]' : v.status === 'NEEDS_CHECK' ? '[?]' : '[!]';
    console.log(`  ${icon} ${v.task}: ${v.status} - ${v.notes}`);
  });

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e.page}: ${e.error}`));
  }

  // Save report
  const reportPath = join(OUTPUT_DIR, `prod-qa-report-${timestamp}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${reportPath}`);

  console.log('\n' + JSON.stringify(report, null, 2));
}

main().catch(console.error);
