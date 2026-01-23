import { test, expect } from '@playwright/test';

const BASE_URL = 'https://andojv.com';

test.describe('Final fixes verification', () => {

  test.setTimeout(90000);

  test('Complete catalog check with scrolling', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);

    // Take initial screenshot
    await page.screenshot({
      path: 'tests/screenshots/final-catalog-top.png',
      fullPage: false
    });

    // Scroll down to see full product cards
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: 'tests/screenshots/final-catalog-cards.png',
      fullPage: false
    });

    // Analyze complete product cards
    const cardAnalysis = await page.evaluate(() => {
      const results: any = {
        badges: { new: [], sale: [] },
        colorCircles: [],
        productInfo: []
      };

      // Find all product cards (group class is used for product cards)
      const productCards = document.querySelectorAll('a[href*="/product/"]');

      productCards.forEach((card, idx) => {
        if (idx >= 5) return;

        const parentCard = card.closest('[class*="group"]') || card;

        // Get card structure
        const cardInfo: any = {
          index: idx,
          href: card.getAttribute('href'),
          elements: []
        };

        // Look for title/name
        const titleEl = parentCard.querySelector('h3, [class*="name"], [class*="title"], span');
        if (titleEl) {
          cardInfo.title = titleEl.textContent?.trim().substring(0, 40);
        }

        // Look for price
        const pricePattern = /\d+\s*₽|\d+\s*руб/;
        const priceMatch = parentCard.textContent?.match(pricePattern);
        if (priceMatch) {
          cardInfo.price = priceMatch[0];
        }

        // Look for sizes
        const sizeText = parentCard.textContent?.match(/[SMLX]{1,3}|XS|XL|XXL|\d{2,3}(?=\s|$)/g);
        if (sizeText) {
          cardInfo.sizes = sizeText.slice(0, 5);
        }

        // Look for color circles
        const colorDots = parentCard.querySelectorAll('[class*="rounded-full"]');
        const colorInfo: any[] = [];
        colorDots.forEach(dot => {
          const rect = dot.getBoundingClientRect();
          if (rect.width > 8 && rect.width < 30) {
            const style = window.getComputedStyle(dot);
            colorInfo.push({
              size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
              bgColor: style.backgroundColor,
              visible: rect.width > 0 && rect.height > 0
            });
          }
        });
        cardInfo.colorCircles = colorInfo;

        // Check for badges
        const badgeEls = parentCard.querySelectorAll('[class*="absolute"][class*="top"]');
        badgeEls.forEach(badge => {
          const text = badge.textContent?.trim();
          if (text === 'NEW' || text === 'SALE') {
            const style = window.getComputedStyle(badge);
            const badgeInfo = {
              text,
              color: style.color,
              bgColor: style.backgroundColor,
              borderRadius: style.borderRadius
            };
            if (text === 'NEW') results.badges.new.push(badgeInfo);
            if (text === 'SALE') results.badges.sale.push(badgeInfo);
          }
        });

        results.productInfo.push(cardInfo);
      });

      // Check for all color circles on page
      document.querySelectorAll('.w-4.h-4.rounded-full, .w-5.h-5.rounded-full, [class*="lg:w-5"][class*="rounded-full"]').forEach(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.width > 0) {
          results.colorCircles.push({
            bgColor: style.backgroundColor,
            display: style.display,
            size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
            pointerEvents: style.pointerEvents,
            cursor: style.cursor,
            isVisible: rect.width > 0
          });
        }
      });

      return results;
    });

    console.log('=== COMPLETE CARD ANALYSIS ===');
    console.log('NEW badges:', JSON.stringify(cardAnalysis.badges.new, null, 2));
    console.log('SALE badges:', JSON.stringify(cardAnalysis.badges.sale, null, 2));
    console.log('Product info:', JSON.stringify(cardAnalysis.productInfo, null, 2));
    console.log('Color circles found:', cardAnalysis.colorCircles.length);
    console.log('Color circles details:', JSON.stringify(cardAnalysis.colorCircles.slice(0, 5), null, 2));

    // Scroll more to see full cards
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'tests/screenshots/final-catalog-full-cards.png',
      fullPage: false
    });
  });

  test('Test color circle hover for tooltip', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Scroll to product cards
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);

    // Find color circles specifically
    const colorCircle = page.locator('.w-4.h-4.rounded-full, [class*="lg:w-5"][class*="rounded-full"]').first();

    if (await colorCircle.count() > 0) {
      try {
        await colorCircle.hover({ timeout: 5000 });
        await page.waitForTimeout(800);

        // Check for tooltip
        const tooltipCheck = await page.evaluate(() => {
          // Check for any tooltip elements
          const tooltips = document.querySelectorAll('[role="tooltip"], [class*="tooltip"], [class*="Tooltip"], [data-state="open"]');
          let tooltipText = '';
          tooltips.forEach(t => {
            tooltipText += t.textContent + ' ';
          });
          return {
            tooltipCount: tooltips.length,
            tooltipText: tooltipText.trim()
          };
        });

        console.log('=== TOOLTIP CHECK ===');
        console.log('After hover:', JSON.stringify(tooltipCheck, null, 2));

        await page.screenshot({
          path: 'tests/screenshots/final-color-hover.png',
          fullPage: false
        });
      } catch (e) {
        console.log('Could not hover on color circle:', e);
      }
    }
  });

  test('Check favorites with pre-added items via localStorage', async ({ page }) => {
    // First visit the site to get the structure
    await page.goto(`${BASE_URL}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Try to add something to favorites by clicking heart icons
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Find heart buttons on product cards
    const heartButtons = page.locator('button:has(svg[class*="heart"]), [class*="heart"] svg, svg.lucide-heart').locator('xpath=ancestor::button | xpath=ancestor::a');

    const heartCount = await heartButtons.count();
    console.log('Heart buttons found:', heartCount);

    // Try clicking on the first product card's heart to add to favorites
    if (heartCount > 0) {
      try {
        await heartButtons.first().click({ timeout: 3000 });
        await page.waitForTimeout(500);

        if (heartCount > 1) {
          await heartButtons.nth(1).click({ timeout: 3000 });
          await page.waitForTimeout(500);
        }
      } catch (e) {
        console.log('Could not click heart:', e);
      }
    }

    // Now navigate to favorites
    const favLink = page.locator('a[href="/favorites"], a[href*="favorite"]');
    if (await favLink.count() > 0) {
      await favLink.first().click();
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: 'tests/screenshots/final-favorites.png',
        fullPage: false
      });

      // Analyze favorites page
      const favAnalysis = await page.evaluate(() => {
        const items = document.querySelectorAll('[class*="group"], [class*="card"], [class*="product"]');
        const badges: any[] = [];

        document.querySelectorAll('*').forEach(el => {
          const text = el.textContent?.trim();
          if ((text === 'NEW' || text === 'SALE') && el.className?.includes?.('absolute')) {
            const style = window.getComputedStyle(el);
            badges.push({
              text,
              color: style.color,
              bgColor: style.backgroundColor,
              borderRadius: style.borderRadius
            });
          }
        });

        return {
          itemCount: items.length,
          badges,
          pageContent: document.body.textContent?.substring(0, 500)
        };
      });

      console.log('=== FAVORITES ANALYSIS ===');
      console.log(JSON.stringify(favAnalysis, null, 2));
    }
  });
});
