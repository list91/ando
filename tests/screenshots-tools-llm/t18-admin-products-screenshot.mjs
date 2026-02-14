// t18 Admin Products Screenshot - Localized Labels Verification
// Takes screenshot of admin products table with НОВОЕ / % columns
// Uses Supabase API for authentication

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = 'C:/sts/projects/ando/tests/screenshots-tools-llm/test-results/final-judge';

// Supabase config from .env
const SUPABASE_URL = 'http://localhost:8000';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Admin credentials from docker/.env
const ADMIN_EMAIL = 'admin@ando.local';
const ADMIN_PASSWORD = 'Admin123!';

async function loginViaAPI() {
  console.log('Attempting login via Supabase API...');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('Login failed:', error);
      return null;
    }

    const data = await response.json();
    console.log('Login successful! Token received.');
    return data;
  } catch (e) {
    console.log('API login error:', e.message);
    return null;
  }
}

async function main() {
  console.log('=== t18 Admin Products Screenshot ===\n');

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Try to get session via API first
  const session = await loginViaAPI();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    // Navigate to app first to set up localStorage
    console.log('1. Opening app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // If we have session, inject it into localStorage
    if (session && session.access_token) {
      console.log('2. Injecting session into localStorage...');

      const storageKey = `sb-localhost-auth-token`;
      const sessionData = {
        currentSession: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: session.user
        },
        expiresAt: session.expires_at
      };

      await page.evaluate(({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
      }, { key: storageKey, value: sessionData });

      // Reload to apply session
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
    } else {
      console.log('2. No session, trying UI login...');

      // Navigate to auth
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Fill form
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.waitForTimeout(500);

      // Submit
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
    }

    // Navigate to admin products
    console.log('3. Navigating to admin products...');
    await page.goto(`${BASE_URL}/admin/products`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check current URL
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    // Wait for table
    console.log('4. Waiting for products table...');
    try {
      await page.waitForSelector('table', { timeout: 10000 });
      console.log('   Table found!');
      await page.waitForTimeout(1500);
    } catch (e) {
      console.log('   Table not found');
    }

    // Take screenshot
    console.log('5. Taking screenshot...');
    const screenshotPath = `${OUTPUT_DIR}/t18-admin-products.png`;
    await page.screenshot({
      path: screenshotPath,
      fullPage: false
    });
    console.log(`   Saved: ${screenshotPath}`);

    // Take table screenshot if exists
    const table = page.locator('table').first();
    if (await table.count() > 0) {
      const tableScreenshotPath = `${OUTPUT_DIR}/t18-admin-products-table.png`;
      await table.screenshot({ path: tableScreenshotPath });
      console.log(`   Saved: ${tableScreenshotPath}`);
    }

    // Check for localized headers
    const pageContent = await page.content();
    const hasNovoeBadge = pageContent.includes('НОВОЕ');
    const hasPercentColumn = pageContent.includes('%') || pageContent.includes('Скидка');

    console.log('\n=== Verification ===');
    console.log(`НОВОЕ column present: ${hasNovoeBadge}`);
    console.log(`% column present: ${hasPercentColumn}`);

    const result = {
      task_id: 't18-admin-products',
      status: currentUrl.includes('/admin/products') ? 'success' : 'partial',
      result: {
        screenshots: [`${OUTPUT_DIR}/t18-admin-products.png`],
        localized_headers: {
          NOVOE_column: hasNovoeBadge,
          percent_column: hasPercentColumn
        },
        final_url: currentUrl
      }
    };

    console.log('\n=== Result ===');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: `${OUTPUT_DIR}/t18-admin-error.png`, fullPage: true });
    console.log(JSON.stringify({ task_id: 't18-admin-products', status: 'failed', error: error.message }, null, 2));
  } finally {
    await browser.close();
  }
}

main();
