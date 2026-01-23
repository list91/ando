/**
 * Visual test for fixes 15, 16, 20 - checking actual UI elements
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Visual check of fixes 15, 16, 20...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    // Test product with multiple colors
    const testUrl = 'https://andojv.com/product/trousers3';
    console.log(`Testing: ${testUrl}\n`);

    await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('='.repeat(60));
    console.log('FIX 15: Color description');
    console.log('='.repeat(60));

    // Get color text
    const colorLine = await page.locator('text=Цвет:').first();
    if (await colorLine.isVisible()) {
      const colorText = await colorLine.textContent();
      console.log(`Found: "${colorText}"`);

      // Check if there's a comma without a word after
      if (colorText.match(/Цвет:\s*,/) || colorText.match(/Цвет:\s*$/)) {
        console.log('STATUS: NOT DONE - Comma without word or empty color');
      } else {
        console.log('STATUS: DONE - Color name is displayed');
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('FIX 16: Size buttons with circle border');
    console.log('='.repeat(60));

    // Find the "Размер" section
    const sizeSection = await page.locator('text=Размер:').first();
    if (await sizeSection.isVisible()) {
      // Take screenshot of size area
      const sizeBox = await sizeSection.boundingBox();
      if (sizeBox) {
        await page.screenshot({
          path: path.join(screenshotsDir, 'pravki-16-size-section.png'),
          clip: {
            x: sizeBox.x - 20,
            y: sizeBox.y - 10,
            width: 300,
            height: 100
          }
        });
      }
    }

    // Get all size buttons/elements
    const sizeElements = await page.evaluate(() => {
      const results = [];
      // Find elements containing S, M, L, XL etc
      const sizeTexts = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

      // Find all interactive elements that might be size selectors
      const elements = document.querySelectorAll('button, a, span, div');

      for (const el of elements) {
        const text = el.textContent?.trim();
        if (sizeTexts.includes(text)) {
          const style = window.getComputedStyle(el);
          results.push({
            text: text,
            tagName: el.tagName,
            borderRadius: style.borderRadius,
            border: style.border,
            borderWidth: style.borderWidth,
            borderStyle: style.borderStyle,
            borderColor: style.borderColor,
            backgroundColor: style.backgroundColor,
            color: style.color,
            width: style.width,
            height: style.height,
            cursor: style.cursor
          });
        }
      }
      return results;
    });

    console.log(`Found ${sizeElements.length} size elements`);
    for (const el of sizeElements) {
      console.log(`  ${el.text}: tag=${el.tagName}, border-radius=${el.borderRadius}, border=${el.border}`);
      console.log(`    bg=${el.backgroundColor}, color=${el.color}, size=${el.width}x${el.height}`);
    }

    // Check if sizes have circle border (border-radius: 50% or 9999px)
    const hasCircleBorder = sizeElements.some(el =>
      el.borderRadius === '50%' ||
      el.borderRadius === '9999px' ||
      parseInt(el.borderRadius) >= 24
    );

    const hasBorder = sizeElements.some(el =>
      el.borderWidth !== '0px' &&
      el.borderStyle !== 'none'
    );

    if (hasCircleBorder && hasBorder) {
      console.log('STATUS: DONE - Sizes have circle border');
    } else if (hasCircleBorder) {
      console.log('STATUS: PARTIAL - Circle shape but no visible border');
    } else {
      console.log('STATUS: NOT DONE - Sizes lack circle border');
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('FIX 20: Color circles instead of text');
    console.log('='.repeat(60));

    // Find "В другом цвете" section
    const otherColorsText = await page.locator('text=В другом цвете').first();
    if (await otherColorsText.isVisible()) {
      const otherColorsContent = await otherColorsText.textContent();
      console.log(`Found: "${otherColorsContent}"`);

      // Take screenshot of this section
      const box = await otherColorsText.boundingBox();
      if (box) {
        await page.screenshot({
          path: path.join(screenshotsDir, 'pravki-20-other-colors-section.png'),
          clip: {
            x: box.x - 20,
            y: box.y - 10,
            width: 400,
            height: 60
          }
        });
      }

      // Check if there are text links (like "Серый", "Коричневый")
      const hasTextLinks = otherColorsContent.includes('Серый') ||
                          otherColorsContent.includes('Белый') ||
                          otherColorsContent.includes('Черный') ||
                          otherColorsContent.includes('Бежевый') ||
                          otherColorsContent.includes('Коричневый') ||
                          otherColorsContent.includes('Синий');

      // Look for color circles near this text
      const colorCirclesNearby = await page.evaluate(() => {
        const text = document.body.innerText;
        const otherColorsIndex = text.indexOf('В другом цвете');

        // Find parent container
        const container = Array.from(document.querySelectorAll('*')).find(el =>
          el.textContent?.includes('В другом цвете') && el.children.length < 10
        );

        if (container) {
          // Look for circular elements
          const circles = container.querySelectorAll('*');
          let circleCount = 0;
          for (const el of circles) {
            const style = window.getComputedStyle(el);
            const isCircle = style.borderRadius === '50%' || style.borderRadius === '9999px';
            const hasBackground = style.backgroundColor !== 'transparent' &&
                                 style.backgroundColor !== 'rgba(0, 0, 0, 0)';
            const isSmall = parseInt(style.width) > 10 && parseInt(style.width) < 40;

            if (isCircle && hasBackground && isSmall) {
              circleCount++;
            }
          }
          return circleCount;
        }
        return 0;
      });

      console.log(`Color circles found near section: ${colorCirclesNearby}`);
      console.log(`Text color names present: ${hasTextLinks}`);

      if (colorCirclesNearby > 0 && !hasTextLinks) {
        console.log('STATUS: DONE - Color circles are used');
      } else if (hasTextLinks && colorCirclesNearby === 0) {
        console.log('STATUS: NOT DONE - Text color names instead of circles');
      } else if (hasTextLinks && colorCirclesNearby > 0) {
        console.log('STATUS: PARTIAL - Both text and circles present');
      }
    } else {
      console.log('Section "В другом цвете" not found');
    }

    // Full page screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'pravki-full-visual.png'),
      fullPage: true
    });

    console.log('\n' + '='.repeat(60));
    console.log('Screenshots saved to tests/screenshots/');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: path.join(screenshotsDir, 'pravki-error.png') });
  }

  await browser.close();
})();
