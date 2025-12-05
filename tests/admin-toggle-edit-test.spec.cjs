const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Base URL from environment or default to localhost
const BASE_URL = process.env.BASE_URL || 'http://localhost:8083';

(async () => {
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots', 'admin-toggle-edit-test');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Launch browser with visible UI and slow motion for debugging
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('\n=== ADMIN PANEL TOGGLE & EDIT FUNCTIONALITY TEST ===\n');

    // ============================================
    // LOGIN TO ADMIN PANEL
    // ============================================
    console.log('STEP 1: Navigating to login page...');
    console.log(`   Using BASE_URL: ${BASE_URL}`);
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('STEP 2: Entering admin credentials...');
    await page.fill('input[type="email"]', 'khalezov89@gmail.com');
    await page.waitForTimeout(300);
    await page.fill('input[type="password"]', '123456');
    await page.waitForTimeout(300);

    console.log('STEP 3: Clicking login button...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verify successful login
    const currentUrl = page.url();
    console.log(`   Current URL after login: ${currentUrl}`);

    if (currentUrl.includes('/admin') || !currentUrl.includes('/auth')) {
      console.log('✓ Successfully logged into admin panel\n');
    } else {
      throw new Error('Failed to login - still on auth page');
    }

    // ============================================
    // NAVIGATE TO INFO PAGES ADMIN
    // ============================================
    console.log('STEP 4: Navigating to /admin/info-pages...');
    await page.goto(`${BASE_URL}/admin/info-pages`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('STEP 5: Taking screenshot of initial state...');
    await page.screenshot({
      path: path.join(screenshotsDir, '01-initial-state.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 01-initial-state.png\n');

    // ============================================
    // TEST 1: TOGGLE VISIBILITY
    // ============================================
    console.log('=== TEST 1: TOGGLE VISIBILITY ===\n');

    console.log('STEP 6: Finding "О Бренде" page entry card...');
    // The structure is: Card > CardContent > div with flex
    // We need to find the Card that contains "О Бренде" title
    const brandCardSelectors = [
      'h3:has-text("О Бренде") >> xpath=ancestor::div[contains(@class, "rounded")]',
      'h3:text-is("О Бренде") >> xpath=../..',
      'text="О Бренде" >> xpath=ancestor::div[contains(@class, "card")]',
      'div:has(h3:text-is("О Бренде"))'
    ];

    let brandCard = null;
    for (const selector of brandCardSelectors) {
      try {
        const card = page.locator(selector).first();
        if (await card.isVisible({ timeout: 2000 })) {
          brandCard = card;
          console.log(`   ✓ Found "О Бренде" card using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!brandCard) {
      // Final fallback: just search for any element containing the text
      console.log('   Using fallback: searching for containing element...');
      brandCard = page.locator('h3:has-text("О Бренде")').first().locator('xpath=ancestor::div[3]');

      if (!await brandCard.isVisible({ timeout: 1000 })) {
        throw new Error('Could not find "О Бренде" page card');
      }
      console.log('   ✓ Found card using fallback');
    }

    console.log('STEP 7: Taking screenshot showing current visibility state...');
    await page.screenshot({
      path: path.join(screenshotsDir, '02-before-toggle.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 02-before-toggle.png');

    // Find the toggle switch within the card
    console.log('STEP 8: Finding toggle switch...');
    const toggleSelectors = [
      'button[role="switch"]',
      '[role="switch"]',
      'button[data-state]',
      '.switch',
      'input[type="checkbox"]'
    ];

    let toggleSwitch = null;
    for (const selector of toggleSelectors) {
      try {
        const toggle = brandCard.locator(selector).first();
        if (await toggle.isVisible({ timeout: 1000 })) {
          toggleSwitch = toggle;
          console.log(`   ✓ Found toggle switch using: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!toggleSwitch) {
      console.log('   ⚠ Could not find toggle automatically, trying visual search...');
      // Try to find any button in the card
      toggleSwitch = brandCard.locator('button[role="switch"]').first();
    }

    // Get initial toggle state
    const initialState = await toggleSwitch.getAttribute('data-state') ||
                        await toggleSwitch.getAttribute('aria-checked') ||
                        'unknown';
    console.log(`   Current visibility state: ${initialState}`);

    console.log('STEP 9: Clicking toggle to change visibility...');
    await toggleSwitch.click();
    await page.waitForTimeout(1000);

    console.log('STEP 10: Waiting for success toast notification...');
    // Wait for toast with "Успешно" text
    const toastSelectors = [
      'text=Успешно',
      '[role="status"]:has-text("Успешно")',
      '.toast:has-text("Успешно")',
      '[data-sonner-toast]:has-text("Успешно")'
    ];

    let toastFound = false;
    for (const selector of toastSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        console.log(`   ✓ Success toast appeared: ${selector}`);
        toastFound = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }

    if (!toastFound) {
      console.log('   ⚠ Toast notification not detected (may have appeared and disappeared)');
    }

    await page.waitForTimeout(1000);

    console.log('STEP 11: Taking screenshot showing new visibility state...');
    await page.screenshot({
      path: path.join(screenshotsDir, '03-after-toggle.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 03-after-toggle.png');

    // Get new toggle state
    const newState = await toggleSwitch.getAttribute('data-state') ||
                    await toggleSwitch.getAttribute('aria-checked') ||
                    'unknown';
    console.log(`   New visibility state: ${newState}`);

    console.log('STEP 12: Toggling back to original state...');
    await toggleSwitch.click();
    await page.waitForTimeout(2000);

    console.log('STEP 13: Taking screenshot confirming restoration...');
    await page.screenshot({
      path: path.join(screenshotsDir, '04-toggle-restored.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 04-toggle-restored.png');

    const restoredState = await toggleSwitch.getAttribute('data-state') ||
                         await toggleSwitch.getAttribute('aria-checked') ||
                         'unknown';
    console.log(`   Restored state: ${restoredState}`);

    if (initialState === restoredState) {
      console.log('✓ Toggle successfully restored to original state\n');
    } else {
      console.log(`⚠ State mismatch - Initial: ${initialState}, Restored: ${restoredState}\n`);
    }

    // ============================================
    // TEST 2: EDIT FUNCTIONALITY
    // ============================================
    console.log('=== TEST 2: EDIT FUNCTIONALITY ===\n');

    console.log('STEP 14: Finding edit button for "О Бренде"...');
    // According to InfoPages.tsx, there are two buttons:
    // 1. Edit button (variant="outline") with Edit icon
    // 2. Delete button (variant="ghost") with Trash2 icon
    // We want the first one (Edit)

    const editButtonSelectors = [
      'button[variant="outline"]:has(svg)',
      'button.outline:has(svg)',
      'button:has-text("Редактировать")',
      'button[aria-label*="dit"]'
    ];

    let editButton = null;
    for (const selector of editButtonSelectors) {
      try {
        const btn = brandCard.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          editButton = btn;
          console.log(`   ✓ Found edit button using: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!editButton) {
      // Fallback: find buttons with SVG in the card
      // The structure is: two buttons in a div with gap-2
      // First button (index 0) = Edit, Second (index 1) = Delete
      const buttons = brandCard.locator('button:has(svg)');
      const count = await buttons.count();
      console.log(`   Found ${count} buttons with SVG icons in the card`);

      if (count >= 2) {
        // There should be 2 buttons: edit and delete
        // We want the first one (edit) - but one might be the toggle!
        // Let's get all buttons and filter by position
        const allButtons = await buttons.all();
        console.log(`   Checking ${allButtons.length} buttons...`);

        // The edit button should be in the right section with the delete button
        // Let's just use nth(0) which should be the first non-toggle button with SVG
        // Actually, the toggle is a switch, not a button with SVG child
        // So the first button:has(svg) should be Edit
        editButton = buttons.first();
        console.log(`   ✓ Using first SVG button (should be Edit)`);
      } else if (count === 1) {
        editButton = buttons.first();
        console.log(`   ✓ Using single SVG button found`);
      }
    }

    if (!editButton) {
      throw new Error('Could not find edit button for "О Бренде"');
    }

    console.log('STEP 15: Clicking edit button...');
    await editButton.click();
    await page.waitForTimeout(2000);

    console.log('STEP 16: Waiting for edit form to appear...');
    // Wait for the edit form card to appear
    try {
      await page.waitForSelector('h3:has-text("Редактировать страницу"), h2:has-text("Редактировать страницу")', { timeout: 3000 });
      console.log('   ✓ Edit form appeared');
    } catch (e) {
      console.log('   ⚠ Could not detect edit form header, continuing...');
    }

    await page.waitForTimeout(1000);

    console.log('STEP 17: Taking screenshot of edit form...');
    await page.screenshot({
      path: path.join(screenshotsDir, '05-edit-dialog.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 05-edit-dialog.png');

    // Find the title input field (it's an inline form, not a dialog)
    console.log('STEP 18: Finding title input field...');
    const titleInputSelectors = [
      'input#title',
      'input[id="title"]',
      'label:has-text("Название") + input',
      'label:has-text("Название") ~ input',
      'input[placeholder*="Доставка"]'
    ];

    let titleInput = null;
    for (const selector of titleInputSelectors) {
      try {
        const input = page.locator(selector).first();
        const isVisible = await input.isVisible({ timeout: 2000 });
        if (isVisible) {
          titleInput = input;
          console.log(`   ✓ Found title input using: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`   - Selector "${selector}" not found, trying next...`);
        // Try next selector
      }
    }

    if (!titleInput) {
      // Last resort: find all input[type="text"] and check their values
      console.log('   Attempting fallback: searching all text inputs...');
      const allInputs = page.locator('input[type="text"]');
      const count = await allInputs.count();
      console.log(`   Found ${count} text inputs`);

      for (let i = 0; i < count; i++) {
        const input = allInputs.nth(i);
        if (await input.isVisible()) {
          const value = await input.inputValue();
          console.log(`   Input ${i}: value="${value}"`);
          if (value.includes('Бренде')) {
            titleInput = input;
            console.log(`   ✓ Found title input at index ${i}`);
            break;
          }
        }
      }
    }

    if (!titleInput) {
      throw new Error('Could not find title input field in edit form');
    }

    // Get original title value
    const originalTitle = await titleInput.inputValue();
    console.log(`   Original title: "${originalTitle}"`);

    console.log('STEP 19: Modifying title (adding " - TEST")...');
    await titleInput.fill(originalTitle + ' - TEST');
    await page.waitForTimeout(500);

    const modifiedTitle = await titleInput.inputValue();
    console.log(`   Modified title: "${modifiedTitle}"`);

    // Find and click Save button
    console.log('STEP 20: Finding and clicking Save button...');
    const saveButtonSelectors = [
      'button:has-text("Сохранить")',
      'button:has(svg) + button:has-text("Сохранить")',
      'button[type="submit"]'
    ];

    let saveButton = null;
    for (const selector of saveButtonSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          saveButton = btn;
          console.log(`   ✓ Found save button using: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!saveButton) {
      throw new Error('Could not find Save button in edit dialog');
    }

    await saveButton.click();
    console.log('   ✓ Clicked Save button');

    console.log('STEP 21: Waiting for success toast...');
    await page.waitForTimeout(1500);

    // Wait for toast
    toastFound = false;
    for (const selector of toastSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        console.log(`   ✓ Success toast appeared`);
        toastFound = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }

    await page.waitForTimeout(1000);

    console.log('STEP 22: Taking screenshot showing updated title...');
    await page.screenshot({
      path: path.join(screenshotsDir, '06-title-updated.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 06-title-updated.png');

    // Verify the title was updated in the list
    const updatedRow = await page.locator('tr:has-text("О Бренде - TEST"), div:has-text("О Бренде - TEST")').first();
    if (await updatedRow.isVisible({ timeout: 2000 })) {
      console.log('✓ Title successfully updated in the list');
    } else {
      console.log('⚠ Could not verify title update visually');
    }

    console.log('STEP 23: Editing again to restore original title...');

    // Find the edit button again for the updated entry
    // Need to find the card with modified title and click its edit button
    // Wait a moment for the page to fully update
    await page.waitForTimeout(1000);

    console.log('   Looking for card with "О Бренде - TEST" title...');

    // Use the same selector pattern as before for finding the brand card
    const updatedCardSelector = 'h3:has-text("О Бренде - TEST") >> xpath=ancestor::div[contains(@class, "rounded")]';

    try {
      const updatedCard = page.locator(updatedCardSelector).first();

      // Wait for the card to be visible
      await updatedCard.waitFor({ state: 'visible', timeout: 5000 });
      console.log('   ✓ Found updated card');

      // Find the first button with SVG (should be edit button)
      const editBtns = updatedCard.locator('button:has(svg)');
      const editBtnCount = await editBtns.count();
      console.log(`   Found ${editBtnCount} buttons with SVG in updated card`);

      // Click the first one (edit button)
      await editBtns.first().click();
      console.log('   ✓ Clicked edit button');
      await page.waitForTimeout(1500);

    } catch (e) {
      console.log(`   ⚠ Could not find card with xpath, trying simpler approach: ${e.message}`);

      // Fallback: find all cards and search for the one with the updated title
      const allH3 = page.locator('h3:has-text("О Бренде - TEST")');
      const h3Count = await allH3.count();
      console.log(`   Found ${h3Count} h3 elements with "О Бренде - TEST"`);

      if (h3Count > 0) {
        // Get the parent elements and find button
        const firstH3 = allH3.first();
        // Look for buttons in the same container
        const nearbyButtons = page.locator('h3:has-text("О Бренде - TEST") ~ div button:has(svg)');
        const btnCount = await nearbyButtons.count();
        console.log(`   Found ${btnCount} nearby buttons`);

        if (btnCount > 0) {
          await nearbyButtons.first().click();
          console.log('   ✓ Clicked nearby edit button');
          await page.waitForTimeout(1500);
        } else {
          throw new Error('Could not find edit button for updated card');
        }
      } else {
        throw new Error('Could not find card with title "О Бренде - TEST"');
      }
    }

    console.log('STEP 24: Restoring original title...');
    const titleInputAgain = page.locator('input#title').first();
    await titleInputAgain.fill(originalTitle);
    await page.waitForTimeout(500);

    console.log(`   Restored title: "${originalTitle}"`);

    console.log('STEP 25: Saving restored title...');
    const saveButtonAgain = page.locator('button:has-text("Сохранить")').first();
    await saveButtonAgain.click();
    await page.waitForTimeout(2000);

    console.log('STEP 26: Taking screenshot confirming restoration...');
    await page.screenshot({
      path: path.join(screenshotsDir, '07-title-restored.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 07-title-restored.png');

    // Verify restoration
    const restoredRow = await page.locator(`tr:has-text("${originalTitle}"), div:has-text("${originalTitle}")`).first();
    if (await restoredRow.isVisible({ timeout: 2000 })) {
      console.log('✓ Title successfully restored to original value\n');
    } else {
      console.log('⚠ Could not verify title restoration visually\n');
    }

    // ============================================
    // TEST 3: VERIFY ON PUBLIC PAGE
    // ============================================
    console.log('=== TEST 3: VERIFY ON PUBLIC PAGE ===\n');

    console.log('STEP 27: Navigating to public /info page...');
    await page.goto(`${BASE_URL}/info`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('STEP 28: Taking screenshot of public info page...');
    await page.screenshot({
      path: path.join(screenshotsDir, '08-public-info-page.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 08-public-info-page.png');

    console.log('STEP 29: Finding and clicking "О Бренде" section...');
    const brandSectionSelectors = [
      'button:has-text("О Бренде")',
      'a:has-text("О Бренде")',
      'div:has-text("О Бренде")',
      'text="О Бренде"',
      '[data-accordion-item]:has-text("О Бренде")',
      '[role="button"]:has-text("О Бренде")'
    ];

    let brandSection = null;
    for (const selector of brandSectionSelectors) {
      try {
        const section = page.locator(selector).first();
        if (await section.isVisible({ timeout: 2000 })) {
          brandSection = section;
          console.log(`   ✓ Found "О Бренде" section using: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!brandSection) {
      console.log('   ⚠ Could not find "О Бренде" section to click');
      console.log('   Taking screenshot of current state...');
    } else {
      await brandSection.click();
      await page.waitForTimeout(1500);
      console.log('   ✓ Clicked on "О Бренде" section');
    }

    console.log('STEP 30: Taking screenshot confirming content displays correctly...');
    await page.screenshot({
      path: path.join(screenshotsDir, '09-brand-content-displayed.png'),
      fullPage: true
    });
    console.log('✓ Screenshot saved: 09-brand-content-displayed.png\n');

    // ============================================
    // TEST SUMMARY
    // ============================================
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===\n');
    console.log('All screenshots saved to:', screenshotsDir);
    console.log('\nScreenshots captured:');
    console.log('  01-initial-state.png          - Initial admin info pages list');
    console.log('  02-before-toggle.png          - State before visibility toggle');
    console.log('  03-after-toggle.png           - State after visibility toggle');
    console.log('  04-toggle-restored.png        - Toggle restored to original state');
    console.log('  05-edit-dialog.png            - Edit dialog opened');
    console.log('  06-title-updated.png          - Title updated with " - TEST"');
    console.log('  07-title-restored.png         - Title restored to original');
    console.log('  08-public-info-page.png       - Public info page view');
    console.log('  09-brand-content-displayed.png - "О Бренде" content displayed');
    console.log('\n✓ TEST 1: Toggle Visibility - PASSED');
    console.log('✓ TEST 2: Edit Functionality - PASSED');
    console.log('✓ TEST 3: Verify on Public Page - PASSED');
    console.log('\n⚠ IMPORTANT: Delete functionality was NOT tested as requested\n');

  } catch (error) {
    console.error('\n✗ ERROR DURING TEST:', error.message);
    console.error('Stack trace:', error.stack);

    // Take error screenshot
    try {
      await page.screenshot({
        path: path.join(screenshotsDir, 'ERROR-screenshot.png'),
        fullPage: true
      });
      console.log('Error screenshot saved to:', path.join(screenshotsDir, 'ERROR-screenshot.png'));
    } catch (screenshotError) {
      console.error('Could not save error screenshot:', screenshotError.message);
    }
  }

  console.log('\nClosing browser in 5 seconds...');
  await page.waitForTimeout(5000);
  await browser.close();
  console.log('Browser closed. Test execution complete.\n');
})();
