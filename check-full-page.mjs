import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

// Wait a bit for content to render
await page.waitForTimeout(2000);

// Get page content - all text
const allText = await page.evaluate(() => {
  return document.body.innerText;
});

console.log('=== PAGE CONTENT ===');
console.log(allText);

// Take full page screenshot
await page.screenshot({ path: '/tmp/check-sidebar-full.png', fullPage: true });
console.log('\n=== Full screenshot saved ===');

await browser.close();
