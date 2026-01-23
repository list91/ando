/**
 * Detailed test for checking fixes 15, 16, 20 on multiple products
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Detailed check of fixes 15, 16, 20...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // Go to catalog
    await page.goto('https://andojv.com/catalog', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Find products with multiple sizes (likely clothing items)
    const productLinks = await page.locator('a[href*="/product/"]').all();
    console.log(`Found ${productLinks.length} products in catalog\n`);

    // Check a few different products
    const productsToCheck = [];
    for (let i = 0; i < Math.min(productLinks.length, 3); i++) {
      const href = await productLinks[i].getAttribute('href');
      productsToCheck.push(href);
    }

    for (let idx = 0; idx < productsToCheck.length; idx++) {
      const productPath = productsToCheck[idx];
      const productUrl = `https://andojv.com${productPath}`;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`PRODUCT ${idx + 1}: ${productPath}`);
      console.log('='.repeat(60));

      await page.goto(productUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);

      // Check color description
      const colorText = await page.locator('text=Цвет:').first().textContent().catch(() => null);
      if (colorText) {
        console.log(`Color text: "${colorText}"`);
      }

      // Check sizes
      const sizeButtons = await page.locator('button').filter({ hasText: /^(XS|S|M|L|XL|XXL)$/ }).all();
      console.log(`Size buttons found: ${sizeButtons.length}`);

      if (sizeButtons.length > 0) {
        // Get all sizes
        const sizes = [];
        for (const btn of sizeButtons) {
          const text = await btn.textContent();
          sizes.push(text.trim());
        }
        console.log(`Available sizes: ${sizes.join(', ')}`);

        // Check border-radius of first button
        const styles = await sizeButtons[0].evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            borderRadius: computed.borderRadius,
            border: computed.border,
            width: computed.width,
            height: computed.height
          };
        });
        console.log(`Size button style: border-radius=${styles.borderRadius}, size=${styles.width}x${styles.height}`);
      }

      // Check for "В другом цвете" section with color circles
      const otherColorsSection = await page.locator('text=В другом цвете').first().isVisible().catch(() => false);
      if (otherColorsSection) {
        console.log('Has "В другом цвете" section: YES');

        // Look for color circles near this text
        const colorCircles = await page.evaluate(() => {
          const circles = document.querySelectorAll('div[style*="border-radius"], span[style*="border-radius"], button[style*="border-radius"]');
          let count = 0;
          circles.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.borderRadius === '50%' || style.borderRadius === '9999px') {
              const size = parseInt(style.width);
              if (size > 10 && size < 50) count++;
            }
          });
          return count;
        });
        console.log(`Color circles found: ${colorCircles}`);
      }

      // Take screenshot
      await page.screenshot({
        path: path.join(screenshotsDir, `pravki-product-${idx + 1}.png`),
        fullPage: false
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
  console.log('\nDone!');
})();
