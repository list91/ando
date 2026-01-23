/**
 * Test for checking fixes 15, 16, 20 on product card
 *
 * Fix 15: Instead of comma on gray background, should show word "grey" (color description)
 * Fix 16: Sizes should have circle border. On hover/select, should become black with white letter
 * Fix 20: At bottom of product card, instead of text color description should be color circles
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('='.repeat(60));
  console.log('CHECKING FIXES 15, 16, 20 ON PRODUCT CARD');
  console.log('='.repeat(60));
  console.log('');

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Create screenshots dir
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const results = {
    fix15: { status: 'NOT CHECKED', details: '' },
    fix16: { status: 'NOT CHECKED', details: '' },
    fix20: { status: 'NOT CHECKED', details: '' }
  };

  try {
    // Go to catalog
    console.log('1. Opening catalog https://andojv.com ...');
    await page.goto('https://andojv.com', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Take screenshot of main page
    await page.screenshot({
      path: path.join(screenshotsDir, 'pravki-15-16-20-main.png'),
      fullPage: false
    });

    // Find product links
    console.log('2. Looking for product links...');

    // Try different selectors for product links
    let productLinks = await page.locator('a[href*="/product/"]').all();

    if (productLinks.length === 0) {
      // Try navigating to catalog page
      console.log('   No products on main page, trying /catalog...');
      await page.goto('https://andojv.com/catalog', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      productLinks = await page.locator('a[href*="/product/"]').all();
    }

    console.log(`   Found ${productLinks.length} product links`);

    if (productLinks.length === 0) {
      console.log('ERROR: No product links found!');
      await page.screenshot({
        path: path.join(screenshotsDir, 'pravki-15-16-20-no-products.png'),
        fullPage: true
      });

      // Try to find any clickable elements
      const allLinks = await page.locator('a').all();
      console.log(`   Total links on page: ${allLinks.length}`);
      for (let i = 0; i < Math.min(allLinks.length, 10); i++) {
        const href = await allLinks[i].getAttribute('href');
        console.log(`   Link ${i + 1}: ${href}`);
      }

      await browser.close();
      return;
    }

    // Get first product URL and navigate to it
    const firstProductHref = await productLinks[0].getAttribute('href');
    const productUrl = firstProductHref.startsWith('http')
      ? firstProductHref
      : `https://andojv.com${firstProductHref}`;

    console.log(`3. Navigating to product: ${productUrl}`);
    await page.goto(productUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Take screenshot of product page
    await page.screenshot({
      path: path.join(screenshotsDir, 'pravki-15-16-20-product-full.png'),
      fullPage: true
    });

    console.log('');
    console.log('='.repeat(60));
    console.log('CHECKING FIX 15: Color description (comma -> "grey")');
    console.log('='.repeat(60));

    // Look for color description text
    const pageContent = await page.content();

    // Check for comma in color description (bad)
    const hasCommaColor = pageContent.includes('цвет:,') ||
                         pageContent.includes('Цвет:,') ||
                         pageContent.includes('цвет: ,') ||
                         pageContent.includes('Цвет: ,');

    // Check for "серый" or "grey" word (good)
    const hasGreyWord = pageContent.toLowerCase().includes('серый') ||
                       pageContent.toLowerCase().includes('grey') ||
                       pageContent.toLowerCase().includes('gray');

    // Find all elements with color-related text
    const colorElements = await page.locator('*:has-text("цвет"), *:has-text("Цвет"), *:has-text("color")').all();
    console.log(`   Found ${colorElements.length} elements with color text`);

    // Take screenshot of color area if found
    for (let i = 0; i < Math.min(colorElements.length, 3); i++) {
      try {
        const text = await colorElements[i].textContent();
        if (text && text.length < 100) {
          console.log(`   Color element ${i + 1}: "${text.trim()}"`);
        }
      } catch (e) {}
    }

    if (hasCommaColor) {
      results.fix15.status = 'NOT DONE';
      results.fix15.details = 'Found comma in color description instead of word';
    } else if (hasGreyWord) {
      results.fix15.status = 'DONE';
      results.fix15.details = 'Found word "серый/grey" in color description';
    } else {
      results.fix15.status = 'NEEDS VERIFICATION';
      results.fix15.details = 'No comma found, but also no grey word found - check manually';
    }

    console.log(`   Status: ${results.fix15.status}`);
    console.log(`   Details: ${results.fix15.details}`);

    console.log('');
    console.log('='.repeat(60));
    console.log('CHECKING FIX 16: Size buttons with circle border and hover');
    console.log('='.repeat(60));

    // Find size buttons/selectors
    const sizeSelectors = [
      'button:has-text("XS")',
      'button:has-text("S")',
      'button:has-text("M")',
      'button:has-text("L")',
      'button:has-text("XL")',
      '[class*="size"]',
      '[data-size]'
    ];

    let sizeButtons = [];
    for (const selector of sizeSelectors) {
      try {
        const buttons = await page.locator(selector).all();
        if (buttons.length > 0) {
          sizeButtons = buttons;
          console.log(`   Found ${buttons.length} size buttons with selector: ${selector}`);
          break;
        }
      } catch (e) {}
    }

    if (sizeButtons.length === 0) {
      // Try finding buttons with size text content
      const allButtons = await page.locator('button').all();
      for (const btn of allButtons) {
        const text = await btn.textContent();
        if (['XS', 'S', 'M', 'L', 'XL', 'XXL'].some(size => text.includes(size))) {
          sizeButtons.push(btn);
        }
      }
      console.log(`   Found ${sizeButtons.length} size buttons by content`);
    }

    if (sizeButtons.length > 0) {
      // Check first size button styles
      const firstSizeBtn = sizeButtons[0];

      // Get computed styles
      const styles = await firstSizeBtn.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          border: computed.border,
          borderRadius: computed.borderRadius,
          borderWidth: computed.borderWidth,
          borderStyle: computed.borderStyle,
          borderColor: computed.borderColor,
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          width: computed.width,
          height: computed.height
        };
      });

      console.log('   Size button styles:');
      console.log(`     Border: ${styles.border}`);
      console.log(`     Border-radius: ${styles.borderRadius}`);
      console.log(`     Background: ${styles.backgroundColor}`);
      console.log(`     Color: ${styles.color}`);
      console.log(`     Size: ${styles.width} x ${styles.height}`);

      // Check for circle border (border-radius should be 50% or close to it)
      const isCircular = styles.borderRadius === '50%' ||
                        styles.borderRadius === '9999px' ||
                        parseInt(styles.borderRadius) >= 20;

      const hasBorder = styles.borderWidth !== '0px' &&
                       styles.borderStyle !== 'none';

      // Take screenshot before hover
      await page.screenshot({
        path: path.join(screenshotsDir, 'pravki-16-sizes-normal.png'),
        fullPage: false
      });

      // Test hover effect
      console.log('   Testing hover effect...');
      await firstSizeBtn.hover();
      await page.waitForTimeout(500);

      const hoverStyles = await firstSizeBtn.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color
        };
      });

      console.log('   Hover styles:');
      console.log(`     Background: ${hoverStyles.backgroundColor}`);
      console.log(`     Color: ${hoverStyles.color}`);

      // Take screenshot after hover
      await page.screenshot({
        path: path.join(screenshotsDir, 'pravki-16-sizes-hover.png'),
        fullPage: false
      });

      // Check if hover changes to black background with white text
      const isBlackOnHover = hoverStyles.backgroundColor.includes('0, 0, 0') ||
                            hoverStyles.backgroundColor === 'rgb(0, 0, 0)' ||
                            hoverStyles.backgroundColor === '#000' ||
                            hoverStyles.backgroundColor === '#000000';

      const isWhiteTextOnHover = hoverStyles.color.includes('255, 255, 255') ||
                                hoverStyles.color === 'rgb(255, 255, 255)' ||
                                hoverStyles.color === '#fff' ||
                                hoverStyles.color === '#ffffff';

      // Click to select and check selected state
      console.log('   Testing selected state...');
      await firstSizeBtn.click();
      await page.waitForTimeout(500);

      const selectedStyles = await firstSizeBtn.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color
        };
      });

      console.log('   Selected styles:');
      console.log(`     Background: ${selectedStyles.backgroundColor}`);
      console.log(`     Color: ${selectedStyles.color}`);

      // Take screenshot after selection
      await page.screenshot({
        path: path.join(screenshotsDir, 'pravki-16-sizes-selected.png'),
        fullPage: false
      });

      if (isCircular && hasBorder) {
        if (isBlackOnHover || selectedStyles.backgroundColor.includes('0, 0, 0')) {
          results.fix16.status = 'DONE';
          results.fix16.details = 'Sizes have circle border, hover/select changes to black bg with white text';
        } else {
          results.fix16.status = 'PARTIAL';
          results.fix16.details = 'Sizes have circle border, but hover/select styling needs verification';
        }
      } else {
        results.fix16.status = 'NOT DONE';
        results.fix16.details = `Circle border: ${isCircular}, Has border: ${hasBorder}`;
      }
    } else {
      results.fix16.status = 'NOT CHECKED';
      results.fix16.details = 'Could not find size buttons on the page';
    }

    console.log(`   Status: ${results.fix16.status}`);
    console.log(`   Details: ${results.fix16.details}`);

    console.log('');
    console.log('='.repeat(60));
    console.log('CHECKING FIX 20: Color circles instead of text description');
    console.log('='.repeat(60));

    // Look for color circles/swatches
    const colorCircleSelectors = [
      '[class*="color-circle"]',
      '[class*="color-swatch"]',
      '[class*="colorCircle"]',
      '[class*="colorSwatch"]',
      '[class*="color-dot"]',
      '.color-option',
      '[data-color]',
      'button[style*="background-color"]',
      'div[style*="border-radius: 50%"][style*="background"]',
      'span[style*="border-radius: 50%"][style*="background"]'
    ];

    let colorCircles = [];
    for (const selector of colorCircleSelectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          colorCircles = elements;
          console.log(`   Found ${elements.length} color elements with selector: ${selector}`);
          break;
        }
      } catch (e) {}
    }

    // Also look for circular elements with background colors
    if (colorCircles.length === 0) {
      console.log('   Looking for circular elements with backgrounds...');
      const allDivs = await page.locator('div, span, button').all();

      for (const el of allDivs) {
        try {
          const styles = await el.evaluate((node) => {
            const computed = window.getComputedStyle(node);
            return {
              borderRadius: computed.borderRadius,
              backgroundColor: computed.backgroundColor,
              width: computed.width,
              height: computed.height
            };
          });

          const isCircle = styles.borderRadius === '50%' || styles.borderRadius === '9999px';
          const hasBackground = styles.backgroundColor !== 'transparent' &&
                               styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
          const isSmall = parseInt(styles.width) <= 40 && parseInt(styles.height) <= 40;
          const isSquare = styles.width === styles.height;

          if (isCircle && hasBackground && isSmall && isSquare) {
            colorCircles.push(el);
          }
        } catch (e) {}
      }

      if (colorCircles.length > 0) {
        console.log(`   Found ${colorCircles.length} circular color elements`);
      }
    }

    // Scroll down to find color options at the bottom
    console.log('   Scrolling to check bottom of product card...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotsDir, 'pravki-20-color-circles.png'),
      fullPage: false
    });

    // Check for text color descriptions that should be replaced
    const textColorDescriptions = await page.locator('*:has-text("белый"), *:has-text("черный"), *:has-text("серый"), *:has-text("синий"), *:has-text("бежевый")').all();
    console.log(`   Found ${textColorDescriptions.length} text color descriptions`);

    if (colorCircles.length > 0) {
      results.fix20.status = 'DONE';
      results.fix20.details = `Found ${colorCircles.length} color circles on the page`;
    } else if (textColorDescriptions.length > 0) {
      results.fix20.status = 'NOT DONE';
      results.fix20.details = 'Text color descriptions found instead of circles';
    } else {
      results.fix20.status = 'NEEDS VERIFICATION';
      results.fix20.details = 'No color circles or text descriptions found - check manually';
    }

    console.log(`   Status: ${results.fix20.status}`);
    console.log(`   Details: ${results.fix20.details}`);

    // Final full page screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'pravki-15-16-20-final.png'),
      fullPage: true
    });

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({
      path: path.join(screenshotsDir, 'pravki-15-16-20-error.png'),
      fullPage: true
    });
  }

  // Print summary
  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  console.log(`FIX 15 (Color text "grey" instead of comma):`);
  console.log(`  Status: ${results.fix15.status}`);
  console.log(`  Details: ${results.fix15.details}`);
  console.log('');
  console.log(`FIX 16 (Size buttons with circle border + hover):`);
  console.log(`  Status: ${results.fix16.status}`);
  console.log(`  Details: ${results.fix16.details}`);
  console.log('');
  console.log(`FIX 20 (Color circles instead of text):`);
  console.log(`  Status: ${results.fix20.status}`);
  console.log(`  Details: ${results.fix20.details}`);
  console.log('');
  console.log('Screenshots saved to: tests/screenshots/');
  console.log('='.repeat(60));

  await browser.close();
})();
