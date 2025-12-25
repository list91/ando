import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

// Get page title
const title = await page.title();
console.log('Page title:', title);

// Get first heading
const h1 = await page.locator('h1').first().textContent();
console.log('First h1:', h1);

// Get all text in header section
const headerText = await page.locator('header').first().textContent();
console.log('\nHeader text (first 500 chars):', headerText?.substring(0, 500));

// Check what's actually in the page body
const bodyFirstText = await page.evaluate(() => {
  return document.body.innerText.substring(0, 1000);
});
console.log('\nFirst 1000 chars of body:', bodyFirstText);

await browser.close();
