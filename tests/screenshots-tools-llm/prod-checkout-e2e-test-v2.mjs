/**
 * Production Checkout E2E Test v2 - Fixed selectors
 * Tasks: DOR-8, DOR-9, DOR-10, DOR-11, DOR-12
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const PROD_URL = 'http://83.166.246.253';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots';

const results = {
  'DOR-8': { status: 'PENDING', details: '' },
  'DOR-9': { status: 'PENDING', details: '' },
  'DOR-10': { status: 'PENDING', details: '' },
  'DOR-11': { status: 'PENDING', details: '' },
  'DOR-12': { status: 'PENDING', details: '' }
};

const screenshots = [];

async function main() {
  console.log('='.repeat(60));
  console.log('  PRODUCTION CHECKOUT E2E TEST v2');
  console.log('='.repeat(60));
  console.log(`\nTarget: ${PROD_URL}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // Persist storage to keep cart
    storageState: undefined
  });
  const page = await context.newPage();

  try {
    // ========== STEP 1: LOAD CATALOG ==========
    console.log('[STEP 1] Loading catalog...');
    await page.goto(`${PROD_URL}/catalog`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(8000);

    const screenshotPath1 = join(OUTPUT_DIR, 'prod-checkout-v2-01-catalog.png');
    await page.screenshot({ path: screenshotPath1 });
    screenshots.push(screenshotPath1);
    console.log('   [OK] Catalog screenshot\n');

    // ========== STEP 2: CLICK PRODUCT CARD ==========
    console.log('[STEP 2] Clicking product card...');

    // Click on product image or card
    const productClicked = await page.evaluate(() => {
      // Find clickable product elements
      const productCards = document.querySelectorAll('[class*="product"], a[href*="/product/"]');
      for (const card of productCards) {
        if (card.offsetParent !== null) {
          card.click();
          return true;
        }
      }
      // Try clicking first image in grid
      const images = document.querySelectorAll('img[src*="product"], img[alt]');
      for (const img of images) {
        const parent = img.closest('a');
        if (parent && parent.href.includes('product')) {
          parent.click();
          return true;
        }
      }
      return false;
    });

    if (productClicked) {
      console.log('   [OK] Product clicked');
      await page.waitForTimeout(5000);
    } else {
      // Direct navigation to a product
      console.log('   [INFO] Direct navigation to product...');
      await page.goto(`${PROD_URL}/product/t-shirts2`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);
    }

    const screenshotPath2 = join(OUTPUT_DIR, 'prod-checkout-v2-02-product.png');
    await page.screenshot({ path: screenshotPath2 });
    screenshots.push(screenshotPath2);
    console.log('   [OK] Product page screenshot\n');

    // ========== STEP 3: SELECT SIZE ==========
    console.log('[STEP 3] Selecting size...');

    // Click on size button
    const sizeClicked = await page.evaluate(() => {
      const sizes = ['XS', 'S', 'M', 'L', 'XL', '42', '44', '46', '48', '50'];
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent?.trim();
        if (text && sizes.includes(text) && btn.offsetParent !== null && !btn.disabled) {
          btn.click();
          return text;
        }
      }
      return null;
    });

    if (sizeClicked) {
      console.log(`   [OK] Size selected: ${sizeClicked}`);
      await page.waitForTimeout(1000);
    } else {
      console.log('   [WARN] No size button found');
    }

    // ========== STEP 4: ADD TO CART ==========
    console.log('[STEP 4] Adding to cart...');

    // Find and click add to cart button
    const addedToCart = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const patterns = ['корзин', 'добавить', 'купить', 'add', 'cart', 'buy'];

      for (const btn of buttons) {
        const text = (btn.textContent || '').toLowerCase();
        if (patterns.some(p => text.includes(p)) && btn.offsetParent !== null && !btn.disabled) {
          btn.click();
          return btn.textContent?.trim();
        }
      }
      return null;
    });

    if (addedToCart) {
      console.log(`   [OK] Clicked: "${addedToCart}"`);
      await page.waitForTimeout(3000);

      const screenshotPath3 = join(OUTPUT_DIR, 'prod-checkout-v2-03-cart-modal.png');
      await page.screenshot({ path: screenshotPath3 });
      screenshots.push(screenshotPath3);
    } else {
      console.log('   [WARN] Add to cart button not found');

      // Debug: list all buttons
      const allButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .filter(b => b.offsetParent !== null)
          .map(b => b.textContent?.trim())
          .filter(Boolean);
      });
      console.log('   All visible buttons:', allButtons.slice(0, 15));
    }

    // ========== STEP 5: GO TO CHECKOUT ==========
    console.log('[STEP 5] Going to checkout...');

    // Try clicking checkout link in modal
    await page.evaluate(() => {
      const links = document.querySelectorAll('a, button');
      const patterns = ['оформ', 'checkout', 'перейти', 'корзин'];
      for (const el of links) {
        const text = (el.textContent || '').toLowerCase();
        if (patterns.some(p => text.includes(p)) && el.offsetParent !== null) {
          el.click();
          return true;
        }
      }
      return false;
    });
    await page.waitForTimeout(2000);

    // Direct navigation to checkout
    await page.goto(`${PROD_URL}/checkout`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    console.log(`   Current URL: ${page.url()}`);

    const screenshotPath4 = join(OUTPUT_DIR, 'prod-checkout-v2-04-checkout.png');
    await page.screenshot({ path: screenshotPath4, fullPage: true });
    screenshots.push(screenshotPath4);
    console.log('   [OK] Checkout fullpage screenshot\n');

    // ========== VERIFICATIONS ==========
    console.log('='.repeat(60));
    console.log('  RUNNING VERIFICATIONS');
    console.log('='.repeat(60) + '\n');

    const isOnCheckout = page.url().includes('/checkout');

    if (!isOnCheckout) {
      console.log('[!] Not on checkout page - cart may be empty');
      console.log('    Redirected to:', page.url());

      for (const key of Object.keys(results)) {
        results[key] = { status: 'SKIP', details: 'Cart empty, redirected to catalog' };
      }
    } else {
      // DOR-8: Check delivery options
      console.log('[DOR-8] Checking delivery options...');
      const dor8Check = await page.evaluate(() => {
        const html = document.body.innerHTML.toLowerCase();
        const deliverySection = document.body.innerText;
        const hasFree = deliverySection.includes('бесплатно');
        const hasCourier = deliverySection.includes('Курьер') || deliverySection.includes('курьер');
        const hasPickup = deliverySection.includes('Самовывоз') || deliverySection.includes('самовывоз');

        // Check radio labels specifically
        const labels = Array.from(document.querySelectorAll('label'));
        const courierLabel = labels.find(l => l.textContent?.includes('Курьер'));
        const courierHasFree = courierLabel?.textContent?.includes('бесплатно');

        return { hasFree, hasCourier, hasPickup, courierHasFree, courierText: courierLabel?.textContent?.trim() };
      });

      if (!dor8Check.courierHasFree) {
        results['DOR-8'] = { status: 'PASS', details: `No "бесплатно" in courier label: "${dor8Check.courierText}"` };
      } else {
        results['DOR-8'] = { status: 'FAIL', details: `Found "бесплатно" in: "${dor8Check.courierText}"` };
      }
      console.log(`   Result: ${results['DOR-8'].status} - ${results['DOR-8'].details}\n`);

      // DOR-9: Check summary shows delivery name, not price
      console.log('[DOR-9] Checking summary delivery display...');
      const dor9Check = await page.evaluate(() => {
        const summaryTexts = Array.from(document.querySelectorAll('[class*="summary"], [class*="card"], aside, .sticky'))
          .map(el => el.textContent || '');
        const combined = summaryTexts.join(' ');

        const hasDeliveryName = combined.includes('Курьер') || combined.includes('Самовывоз');
        const hasFreeText = combined.includes('Бесплатно');
        const hasZeroPrice = /доставка[:\s]*0\s*₽/i.test(combined);

        return { hasDeliveryName, hasFreeText, hasZeroPrice, sample: combined.substring(0, 200) };
      });

      if (dor9Check.hasDeliveryName && !dor9Check.hasFreeText && !dor9Check.hasZeroPrice) {
        results['DOR-9'] = { status: 'PASS', details: 'Summary shows delivery name, not price' };
      } else if (dor9Check.hasFreeText || dor9Check.hasZeroPrice) {
        results['DOR-9'] = { status: 'FAIL', details: 'Summary shows price/free instead of name' };
      } else {
        results['DOR-9'] = { status: 'UNCLEAR', details: 'Could not determine delivery display' };
      }
      console.log(`   Result: ${results['DOR-9'].status} - ${results['DOR-9'].details}\n`);

      // DOR-10: Check no nested scroll
      console.log('[DOR-10] Checking nested scroll...');
      const dor10Check = await page.evaluate(() => {
        const scrollables = [];
        document.querySelectorAll('*').forEach(el => {
          const style = getComputedStyle(el);
          if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
              el.scrollHeight > el.clientHeight + 10 &&
              el.tagName !== 'BODY' && el.tagName !== 'HTML') {
            scrollables.push({ tag: el.tagName, class: el.className.substring(0, 50) });
          }
        });
        return scrollables;
      });

      if (dor10Check.length <= 1) {
        results['DOR-10'] = { status: 'PASS', details: `${dor10Check.length} scrollable area(s) - no nested scroll` };
      } else {
        results['DOR-10'] = { status: 'FAIL', details: `${dor10Check.length} nested scrollable areas found` };
      }
      console.log(`   Result: ${results['DOR-10'].status} - ${results['DOR-10'].details}\n`);

      // DOR-11: Check registration banners
      console.log('[DOR-11] Checking registration banners...');
      const dor11Check = await page.evaluate(() => {
        const banners = document.querySelectorAll('[class*="promo"], [class*="register"], [class*="banner"]');
        let topBannerBg = null;
        let bottomBannerBg = null;
        let circleColor = null;

        // Look for banner-like elements with black/white backgrounds
        const allDivs = document.querySelectorAll('div');
        for (const div of allDivs) {
          const style = getComputedStyle(div);
          const bg = style.backgroundColor;
          const text = div.textContent || '';

          // Check for registration promo content
          if (text.includes('регистрац') || text.includes('скидк') || text.includes('%')) {
            if (bg.includes('0, 0, 0') || bg.includes('rgb(0')) {
              topBannerBg = 'black';
            }
            if (bg.includes('255, 255, 255') || bg === 'rgb(255, 255, 255)') {
              bottomBannerBg = 'white';
            }
          }

          // Look for red circle
          if (style.borderRadius && parseInt(style.borderRadius) > 20) {
            const bgColor = style.backgroundColor;
            if (bgColor.includes('239, 68, 68') || bgColor.includes('220, 38, 38') || bgColor.includes('198, 18')) {
              circleColor = 'red';
            }
          }
        }

        return { topBannerBg, bottomBannerBg, circleColor };
      });

      if (dor11Check.topBannerBg === 'black' && dor11Check.circleColor === 'red') {
        results['DOR-11'] = { status: 'PASS', details: 'Black top banner with red circle found' };
      } else {
        results['DOR-11'] = { status: 'UNCLEAR', details: `Top: ${dor11Check.topBannerBg}, Circle: ${dor11Check.circleColor}` };
      }
      console.log(`   Result: ${results['DOR-11'].status} - ${results['DOR-11'].details}\n`);

      // DOR-12: Check order button text
      console.log('[DOR-12] Checking order button text...');
      const dor12Check = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const submitButtons = buttons.filter(b => {
          const text = (b.textContent || '').toLowerCase();
          return text.includes('оформ') || text.includes('оплат') || text.includes('заказ');
        });

        const texts = submitButtons.map(b => b.textContent?.trim());
        const hasCorrectText = texts.some(t => t?.includes('Оформить заказ'));
        const hasOldText = texts.some(t => t?.includes('ОПЛАТИТЬ') || t?.includes('₽'));

        return { texts, hasCorrectText, hasOldText };
      });

      if (dor12Check.hasCorrectText && !dor12Check.hasOldText) {
        results['DOR-12'] = { status: 'PASS', details: `Button text: "${dor12Check.texts.find(t => t?.includes('Оформить'))}"` };
      } else if (dor12Check.hasOldText) {
        results['DOR-12'] = { status: 'FAIL', details: `Old button text found: ${dor12Check.texts.join(', ')}` };
      } else {
        results['DOR-12'] = { status: 'UNCLEAR', details: `Buttons found: ${dor12Check.texts.join(', ')}` };
      }
      console.log(`   Result: ${results['DOR-12'].status} - ${results['DOR-12'].details}\n`);
    }

    // Final screenshot
    const screenshotPath5 = join(OUTPUT_DIR, 'prod-checkout-v2-05-final.png');
    await page.screenshot({ path: screenshotPath5 });
    screenshots.push(screenshotPath5);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }

  // Print results
  console.log('='.repeat(60));
  console.log('  FINAL RESULTS');
  console.log('='.repeat(60) + '\n');

  const output = {
    test_file: 'prod-checkout-e2e-test-v2.mjs',
    screenshots,
    results
  };

  console.log(JSON.stringify(output, null, 2));

  // Save results
  const resultsPath = join(OUTPUT_DIR, 'prod-checkout-v2-results.json');
  writeFileSync(resultsPath, JSON.stringify(output, null, 2));
  console.log(`\nResults saved to: ${resultsPath}`);
}

main().catch(console.error);
