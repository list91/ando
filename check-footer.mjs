import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

// Scroll to bottom
await page.evaluate(() => {
  window.scrollTo(0, document.body.scrollHeight);
});

await page.waitForTimeout(1000);

// Get footer text
const footerText = await page.evaluate(() => {
  // Try to find footer by common class names and tags
  const footer = document.querySelector('footer') || document.querySelector('[class*="footer"]');
  if (footer) {
    return footer.innerText;
  }
  
  // If no footer, get last 500 chars of body
  const bodyText = document.body.innerText;
  return bodyText.slice(-1000);
});

console.log('=== FOOTER CONTENT ===');
console.log(footerText);

// Take screenshot of bottom part
await page.screenshot({ path: '/tmp/footer-screenshot.png' });
console.log('\n=== Footer screenshot saved ===');

await browser.close();
