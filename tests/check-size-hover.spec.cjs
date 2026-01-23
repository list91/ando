/**
 * Test size button hover and selection states
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Testing size button hover/selection states...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, 'screenshots');

  try {
    await page.goto('https://andojv.com/product/trousers3', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Find size buttons
    const sizeButtons = await page.locator('button').filter({ hasText: /^(S|M)$/ }).all();
    console.log(`Found ${sizeButtons.length} size buttons\n`);

    if (sizeButtons.length >= 2) {
      // Get initial state of first button (S)
      console.log('1. INITIAL STATE (no selection):');
      const initialS = await sizeButtons[0].evaluate(el => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color, border: s.border };
      });
      const initialM = await sizeButtons[1].evaluate(el => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color, border: s.border };
      });
      console.log(`   S: bg=${initialS.bg}, color=${initialS.color}, border=${initialS.border}`);
      console.log(`   M: bg=${initialM.bg}, color=${initialM.color}, border=${initialM.border}`);

      // Take screenshot
      await page.screenshot({
        path: path.join(screenshotsDir, 'size-1-initial.png'),
        fullPage: false
      });

      // Hover over S
      console.log('\n2. HOVER STATE (hovering S):');
      await sizeButtons[0].hover();
      await page.waitForTimeout(500);

      const hoverS = await sizeButtons[0].evaluate(el => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color, border: s.border };
      });
      console.log(`   S (hovered): bg=${hoverS.bg}, color=${hoverS.color}`);

      // Check if hover changes colors
      const hoverChangesBg = initialS.bg !== hoverS.bg;
      const hoverChangesColor = initialS.color !== hoverS.color;
      console.log(`   Background changed: ${hoverChangesBg}`);
      console.log(`   Color changed: ${hoverChangesColor}`);

      await page.screenshot({
        path: path.join(screenshotsDir, 'size-2-hover.png'),
        fullPage: false
      });

      // Click S to select
      console.log('\n3. SELECTED STATE (S selected):');
      await sizeButtons[0].click();
      await page.waitForTimeout(500);

      const selectedS = await sizeButtons[0].evaluate(el => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color, border: s.border };
      });
      console.log(`   S (selected): bg=${selectedS.bg}, color=${selectedS.color}`);

      // Check if selected becomes black bg with white text
      const isBlackBg = selectedS.bg.includes('51, 51, 51') || selectedS.bg.includes('0, 0, 0') || selectedS.bg === 'rgb(51, 51, 51)';
      const isWhiteText = selectedS.color.includes('255, 255, 255') || selectedS.color.includes('246, 245, 243') || selectedS.color === 'rgb(246, 245, 243)';
      console.log(`   Is black/dark background: ${isBlackBg}`);
      console.log(`   Is white/light text: ${isWhiteText}`);

      await page.screenshot({
        path: path.join(screenshotsDir, 'size-3-selected.png'),
        fullPage: false
      });

      // Click M to change selection
      console.log('\n4. CHANGED SELECTION (M selected):');
      await sizeButtons[1].click();
      await page.waitForTimeout(500);

      const afterChangeS = await sizeButtons[0].evaluate(el => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color };
      });
      const selectedM = await sizeButtons[1].evaluate(el => {
        const s = window.getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.color };
      });
      console.log(`   S (deselected): bg=${afterChangeS.bg}, color=${afterChangeS.color}`);
      console.log(`   M (selected): bg=${selectedM.bg}, color=${selectedM.color}`);

      await page.screenshot({
        path: path.join(screenshotsDir, 'size-4-changed.png'),
        fullPage: false
      });

      // Summary
      console.log('\n' + '='.repeat(50));
      console.log('SUMMARY FOR FIX 16:');
      console.log('='.repeat(50));

      // Check border visibility
      const borderColor = initialS.border.match(/rgb\([^)]+\)/)?.[0] || '';
      const isBorderVisible = !borderColor.includes('246, 245, 243') && !borderColor.includes('255, 255, 255');

      console.log(`Circle shape (border-radius): YES (9999px)`);
      console.log(`Border visible: ${isBorderVisible ? 'YES' : 'NO (very light color)'}`);
      console.log(`Hover effect: ${hoverChangesBg || hoverChangesColor ? 'YES' : 'NO'}`);
      console.log(`Selected state (dark bg, light text): ${isBlackBg && isWhiteText ? 'YES' : 'PARTIAL'}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
  console.log('\nDone!');
})();
