/**
 * Registration page and support button screenshots
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const PROD_URL = 'http://83.166.246.253';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots';
const timestamp = Date.now();

async function main() {
  console.log('=== REGISTRATION & SUPPORT ===\n');
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // Desktop
  const desktopCtx = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const desktopPage = await desktopCtx.newPage();

  // Mobile
  const mobileCtx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
  });
  const mobilePage = await mobileCtx.newPage();

  try {
    // 1. Registration page
    console.log('[1] Loading registration page...');
    await desktopPage.goto(`${PROD_URL}/auth/register`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await desktopPage.waitForTimeout(3000);
    await desktopPage.screenshot({ path: join(OUTPUT_DIR, `prod-register-${timestamp}.png`) });
    console.log('[OK] Registration page screenshot');

    // 2. Home - scroll through entire page
    console.log('\n[2] Loading home page and scrolling...');
    await desktopPage.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await desktopPage.waitForTimeout(4000);

    // Scroll down in steps
    for (let i = 1; i <= 5; i++) {
      await desktopPage.evaluate((step) => window.scrollTo(0, step * 1000), i);
      await desktopPage.waitForTimeout(1000);
    }
    await desktopPage.screenshot({ path: join(OUTPUT_DIR, `prod-home-footer-${timestamp}.png`) });
    console.log('[OK] Home footer screenshot');

    // 3. Mobile home with support button
    console.log('\n[3] Mobile home page...');
    await mobilePage.goto(`${PROD_URL}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await mobilePage.waitForTimeout(4000);

    // Full page mobile
    await mobilePage.screenshot({ path: join(OUTPUT_DIR, `prod-mobile-fullpage-${timestamp}.png`), fullPage: true });
    console.log('[OK] Mobile fullpage screenshot');

    // 4. Check for support button on desktop
    console.log('\n[4] Checking for support elements...');
    const pageContent = await desktopPage.content();

    const hasWhatsApp = pageContent.includes('wa.me') || pageContent.includes('whatsapp');
    const hasSupport = pageContent.toLowerCase().includes('support') || pageContent.toLowerCase().includes('поддержк');
    const hasTelegram = pageContent.includes('t.me') || pageContent.includes('telegram');

    console.log(`   WhatsApp link: ${hasWhatsApp}`);
    console.log(`   Support text: ${hasSupport}`);
    console.log(`   Telegram link: ${hasTelegram}`);

  } catch (error) {
    console.error('[ERROR]', error.message);
  } finally {
    await browser.close();
  }

  console.log('\nDone!');
}

main().catch(console.error);
