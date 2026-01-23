import { test, expect } from '@playwright/test';

const BASE_URL = 'https://andojv.com';

test.describe('Detailed fixes check', () => {

  test.setTimeout(60000);

  test('Check catalog - badges colors and product card structure', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`, { timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Screenshot of catalog
    await page.screenshot({
      path: 'tests/screenshots/check-catalog-badges.png',
      fullPage: false
    });

    // Analyze NEW and SALE badges
    const badgeAnalysis = await page.evaluate(() => {
      const results: any = {
        newBadges: [],
        saleBadges: [],
        productCards: []
      };

      // Find all elements that might be badges
      const allElements = document.querySelectorAll('*');

      allElements.forEach(el => {
        const text = el.textContent?.trim();
        const className = el.className?.toString() || '';

        // Check if this is a badge (small element with just NEW or SALE text)
        if (text === 'NEW' && className.includes('absolute')) {
          const style = window.getComputedStyle(el);
          results.newBadges.push({
            tag: el.tagName,
            classes: className,
            color: style.color,
            bgColor: style.backgroundColor,
            borderRadius: style.borderRadius,
            text: text
          });
        }

        if (text === 'SALE' && className.includes('absolute')) {
          const style = window.getComputedStyle(el);
          results.saleBadges.push({
            tag: el.tagName,
            classes: className,
            color: style.color,
            bgColor: style.backgroundColor,
            borderRadius: style.borderRadius,
            text: text
          });
        }
      });

      // Check product card structure for sizes and colors
      const productCards = document.querySelectorAll('[class*="group"]');
      productCards.forEach((card, idx) => {
        if (idx < 3) {
          // Check for size elements
          const sizeEl = card.querySelector('[class*="size"], [class*="Size"]');
          // Check for color circles/swatches
          const colorCircles = card.querySelectorAll('[class*="swatch"], [class*="circle"], [style*="border-radius: 50%"], [style*="border-radius:50%"]');

          results.productCards.push({
            hasSizes: !!sizeEl,
            sizePosition: sizeEl ? sizeEl.className : null,
            colorCirclesCount: colorCircles.length,
            cardHTML: card.innerHTML.substring(0, 500)
          });
        }
      });

      return results;
    });

    console.log('=== BADGE ANALYSIS ===');
    console.log('NEW badges:', JSON.stringify(badgeAnalysis.newBadges, null, 2));
    console.log('SALE badges:', JSON.stringify(badgeAnalysis.saleBadges, null, 2));
    console.log('Product cards:', JSON.stringify(badgeAnalysis.productCards, null, 2));
  });

  test('Check product card for color circles and tooltips', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`, { timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Look for color circles in product cards
    const colorCircleCheck = await page.evaluate(() => {
      // Check for color swatch containers
      const swatchContainers = document.querySelectorAll('[class*="color"], [class*="swatch"], [class*="варианты"]');
      const circles: any[] = [];

      swatchContainers.forEach(container => {
        const style = window.getComputedStyle(container);
        circles.push({
          tag: container.tagName,
          class: container.className,
          display: style.display,
          visibility: style.visibility,
          width: style.width,
          height: style.height
        });
      });

      // Also check for any small round elements that might be color indicators
      const roundElements = document.querySelectorAll('[class*="rounded-full"]');
      const potentialColorDots: any[] = [];

      roundElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        // Small round elements might be color indicators
        if (rect.width > 8 && rect.width < 30 && rect.height > 8 && rect.height < 30) {
          potentialColorDots.push({
            tag: el.tagName,
            class: el.className,
            size: `${rect.width}x${rect.height}`,
            bgColor: style.backgroundColor,
            display: style.display
          });
        }
      });

      return {
        swatchContainers: circles,
        potentialColorDots: potentialColorDots.slice(0, 10)
      };
    });

    console.log('=== COLOR CIRCLE CHECK ===');
    console.log('Swatch containers:', JSON.stringify(colorCircleCheck.swatchContainers, null, 2));
    console.log('Potential color dots:', JSON.stringify(colorCircleCheck.potentialColorDots, null, 2));

    // Try to hover on any potential color element and check for tooltip
    const colorElements = page.locator('[class*="color"], [class*="swatch"]').first();
    if (await colorElements.count() > 0) {
      await colorElements.hover();
      await page.waitForTimeout(500);

      // Check for tooltip
      const tooltipVisible = await page.evaluate(() => {
        const tooltips = document.querySelectorAll('[role="tooltip"], [class*="tooltip"], [class*="Tooltip"]');
        return {
          found: tooltips.length > 0,
          count: tooltips.length
        };
      });

      console.log('Tooltip check after hover:', tooltipVisible);

      await page.screenshot({
        path: 'tests/screenshots/check-color-hover.png',
        fullPage: false
      });
    }
  });

  test('Check individual product page for size layout', async ({ page }) => {
    // First go to catalog to find a product link
    await page.goto(`${BASE_URL}/catalog`, { timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Screenshot showing product cards with sizes
    await page.screenshot({
      path: 'tests/screenshots/check-catalog-sizes.png',
      fullPage: false
    });

    // Analyze product card layout for sizes
    const layoutCheck = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="group"]');
      const cardLayouts: any[] = [];

      cards.forEach((card, idx) => {
        if (idx < 3) {
          // Find product name/title
          const nameEl = card.querySelector('h3, [class*="name"], [class*="title"]');
          // Find size indicator
          const sizeEl = card.querySelector('[class*="size"]');

          if (nameEl && sizeEl) {
            const nameRect = nameEl.getBoundingClientRect();
            const sizeRect = sizeEl.getBoundingClientRect();

            cardLayouts.push({
              productName: nameEl.textContent?.trim().substring(0, 30),
              namePosition: { top: nameRect.top, left: nameRect.left },
              sizePosition: { top: sizeRect.top, left: sizeRect.left },
              areSizesRight: sizeRect.left > nameRect.left + nameRect.width / 2,
              areSizesParallel: Math.abs(nameRect.top - sizeRect.top) < 30
            });
          }
        }
      });

      return cardLayouts;
    });

    console.log('=== SIZE LAYOUT CHECK ===');
    console.log('Card layouts:', JSON.stringify(layoutCheck, null, 2));
  });

  test('Add items to favorites and check badges there', async ({ page, context }) => {
    // Go to catalog first
    await page.goto(`${BASE_URL}/catalog`, { timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Find and click heart icon on a product to add to favorites
    const heartButtons = page.locator('[class*="heart"], [aria-label*="избранн"], svg[class*="heart"]');

    if (await heartButtons.count() > 0) {
      // Click first available heart icon
      await heartButtons.first().click();
      await page.waitForTimeout(1000);

      // Try to add another item
      if (await heartButtons.count() > 1) {
        await heartButtons.nth(1).click();
        await page.waitForTimeout(1000);
      }
    }

    // Now go to favorites page
    await page.goto(`${BASE_URL}/favorites`, { timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'tests/screenshots/check-favorites-with-items.png',
      fullPage: false
    });

    // Analyze badges in favorites
    const favBadges = await page.evaluate(() => {
      const results: any = {
        newBadges: [],
        saleBadges: []
      };

      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent?.trim();
        const className = el.className?.toString() || '';

        if (text === 'NEW' && className.includes('absolute')) {
          const style = window.getComputedStyle(el);
          results.newBadges.push({
            color: style.color,
            bgColor: style.backgroundColor,
            borderRadius: style.borderRadius
          });
        }

        if (text === 'SALE' && className.includes('absolute')) {
          const style = window.getComputedStyle(el);
          results.saleBadges.push({
            color: style.color,
            bgColor: style.backgroundColor,
            borderRadius: style.borderRadius
          });
        }
      });

      return results;
    });

    console.log('=== FAVORITES BADGES ===');
    console.log(JSON.stringify(favBadges, null, 2));
  });
});
