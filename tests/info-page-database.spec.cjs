const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Starting /info page database content test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots', 'info-page');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Track console messages and errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      console.log(`   Console Error: ${msg.text()}`);
    }
  });

  try {
    // Test 1: Navigate to /info page
    console.log('1. Navigating to http://localhost:8081/info...');
    await page.goto('http://localhost:8081/info', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('   Page loaded');

    // Test 2: Wait for page to fully load
    console.log('\n2. Waiting for page content to load...');
    await page.waitForTimeout(1500);

    // Test 3: Check if loading spinner is NOT visible
    console.log('\n3. Checking for loading spinner...');
    const loadingSpinner = await page.locator('[role="status"]').all();
    const spinnerVisible = loadingSpinner.length > 0 && await loadingSpinner[0].isVisible();

    if (spinnerVisible) {
      console.log('   ⚠ WARNING: Loading spinner is still visible');
      await page.screenshot({
        path: path.join(screenshotsDir, '01-spinner-still-visible.png'),
        fullPage: true
      });
    } else {
      console.log('   ✓ Loading spinner is not visible (content loaded)');
    }

    // Test 4: Take screenshot of the initial state (should show "О Бренде" section)
    console.log('\n4. Taking screenshot of "О Бренде" section...');
    await page.screenshot({
      path: path.join(screenshotsDir, '02-info-page-about-brand.png'),
      fullPage: true
    });
    console.log('   ✓ Screenshot saved: 02-info-page-about-brand.png');

    // Test 5: Verify "О Бренде" content is present
    console.log('\n5. Verifying "О Бренде" content...');
    const aboutBrandHeading = await page.locator('text=О Бренде').first();
    if (await aboutBrandHeading.isVisible()) {
      console.log('   ✓ "О Бренде" heading found');
    } else {
      console.log('   ✗ "О Бренде" heading NOT found');
    }

    // Check for actual content (not just loading state)
    const pageText = await page.textContent('body');
    const hasContent = pageText.length > 100; // Should have substantial content
    console.log(`   Page text length: ${pageText.length} characters`);

    if (hasContent) {
      console.log('   ✓ Page has substantial content from database');
    } else {
      console.log('   ✗ Page has minimal content - database might not be loaded');
    }

    // Test 6: Find and click on "Контакты" section
    console.log('\n6. Clicking on "Контакты" section...');

    // Try to find the Контакты button/link in the navigation
    const contactsButton = await page.locator('button:has-text("Контакты"), a:has-text("Контакты")').first();

    if (await contactsButton.isVisible()) {
      console.log('   Found "Контакты" navigation element');
      await contactsButton.click();
      console.log('   ✓ Clicked on "Контакты"');

      // Wait for section to load
      await page.waitForTimeout(1000);

      // Test 7: Take screenshot of Контакты section
      console.log('\n7. Taking screenshot of "Контакты" section...');
      await page.screenshot({
        path: path.join(screenshotsDir, '03-info-page-contacts.png'),
        fullPage: true
      });
      console.log('   ✓ Screenshot saved: 03-info-page-contacts.png');

      // Verify Контакты content
      const contactsHeading = await page.locator('text=Контакты').first();
      if (await contactsHeading.isVisible()) {
        console.log('   ✓ "Контакты" section is displayed');
      } else {
        console.log('   ✗ "Контакты" section NOT visible');
      }
    } else {
      console.log('   ⚠ Could not find "Контакты" navigation element');
      console.log('   Checking available navigation elements...');

      // List all available navigation elements
      const navButtons = await page.locator('button, a').all();
      for (let i = 0; i < Math.min(navButtons.length, 20); i++) {
        const text = await navButtons[i].textContent();
        if (text && text.trim()) {
          console.log(`     - "${text.trim()}"`);
        }
      }
    }

    // Test 8: Check URL parameters
    console.log('\n8. Checking URL state...');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (currentUrl.includes('section=')) {
      console.log('   ✓ URL contains section parameter');
    }

    // Test 9: Verify no loading/error states
    console.log('\n9. Checking for error states...');
    const errorMessages = await page.locator('text=/error|ошибка/i').all();
    if (errorMessages.length > 0) {
      console.log(`   ⚠ Found ${errorMessages.length} potential error messages`);
      for (const err of errorMessages) {
        if (await err.isVisible()) {
          const text = await err.textContent();
          console.log(`     - "${text}"`);
        }
      }
    } else {
      console.log('   ✓ No error messages found');
    }

    // Test 10: Check console errors
    console.log('\n10. Reviewing console output...');
    const errorCount = consoleMessages.filter(m => m.type === 'error').length;
    const warningCount = consoleMessages.filter(m => m.type === 'warning').length;

    console.log(`   Errors: ${errorCount}`);
    console.log(`   Warnings: ${warningCount}`);

    if (errorCount > 0) {
      console.log('\n   Recent console errors:');
      consoleMessages
        .filter(m => m.type === 'error')
        .slice(-5)
        .forEach(m => console.log(`     - ${m.text}`));
    }

    // Test 11: Take final overview screenshot
    console.log('\n11. Taking final overview screenshot...');
    await page.screenshot({
      path: path.join(screenshotsDir, '04-final-state.png'),
      fullPage: true
    });
    console.log('   ✓ Screenshot saved: 04-final-state.png');

    // Summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log('✓ Navigation to /info page successful');
    console.log(`✓ Page content loaded (${hasContent ? 'YES' : 'NO'})`);
    console.log(`✓ Loading spinner hidden (${!spinnerVisible ? 'YES' : 'NO'})`);
    console.log(`✓ Screenshots saved to: ${screenshotsDir}`);
    console.log('========================================\n');

    console.log('Screenshots saved:');
    console.log('  - 02-info-page-about-brand.png');
    console.log('  - 03-info-page-contacts.png');
    console.log('  - 04-final-state.png');
    console.log('\nBrowser will stay open for 8 seconds for inspection...');
    await page.waitForTimeout(8000);

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error('Stack trace:', error.stack);

    // Take error screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '00-error-state.png'),
      fullPage: true
    });
    console.log(`\nError screenshot saved to: ${screenshotsDir}/00-error-state.png`);

    // Keep browser open longer on error
    console.log('\nBrowser will stay open for 15 seconds for debugging...');
    await page.waitForTimeout(15000);

  } finally {
    await browser.close();
    console.log('\nBrowser closed. Test complete.');
  }
})();
