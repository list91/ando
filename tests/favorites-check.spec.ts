import { test, expect } from '@playwright/test';

const BASE_URL = 'https://andojv.com';

test.describe('Favorites page check', () => {

  test.setTimeout(120000);

  test('Add items to favorites and check badges styling', async ({ page }) => {
    // Go to catalog
    await page.goto(`${BASE_URL}/catalog`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);

    // Find heart icons in product cards - look for the svg icons
    const heartIcons = page.locator('svg.lucide-heart');
    const heartCount = await heartIcons.count();
    console.log('Heart icons found:', heartCount);

    // Click on multiple hearts to add to favorites
    for (let i = 0; i < Math.min(3, heartCount); i++) {
      try {
        const heart = heartIcons.nth(i);
        // Get parent button/link
        const clickable = heart.locator('xpath=ancestor::button | ancestor::a').first();
        await clickable.click({ timeout: 3000 });
        await page.waitForTimeout(800);
        console.log(`Clicked heart ${i + 1}`);
      } catch (e) {
        console.log(`Could not click heart ${i}:`, e);
      }
    }

    // Navigate to favorites via URL
    await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Take screenshot of favorites
    await page.screenshot({
      path: 'tests/screenshots/favorites-page.png',
      fullPage: false
    });

    // Check if there are items in favorites
    const pageContent = await page.textContent('body');
    const hasEmptyState = pageContent?.includes('Войдите в аккаунт') || pageContent?.includes('пусто');

    console.log('=== FAVORITES PAGE STATE ===');
    console.log('Has empty state:', hasEmptyState);

    // Try to analyze badges if items present
    const badgeAnalysis = await page.evaluate(() => {
      const results: any = {
        newBadges: [],
        saleBadges: [],
        hasItems: false
      };

      // Check for product cards
      const cards = document.querySelectorAll('[class*="group"], a[href*="/product/"]');
      results.hasItems = cards.length > 0;

      // Find badges
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent?.trim();
        const className = el.className?.toString() || '';

        if (text === 'NEW' && className.includes('absolute')) {
          const style = window.getComputedStyle(el);
          results.newBadges.push({
            color: style.color,
            bgColor: style.backgroundColor,
            borderRadius: style.borderRadius,
            classes: className
          });
        }

        if (text === 'SALE' && className.includes('absolute')) {
          const style = window.getComputedStyle(el);
          results.saleBadges.push({
            color: style.color,
            bgColor: style.backgroundColor,
            borderRadius: style.borderRadius,
            classes: className
          });
        }
      });

      return results;
    });

    console.log('Favorites badge analysis:', JSON.stringify(badgeAnalysis, null, 2));

    // Scroll and take another screenshot
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/favorites-scrolled.png',
      fullPage: false
    });
  });
});
