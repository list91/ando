import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8087';

test.describe('PRAVKA 6: Mobile header heart icon verification', () => {
  test.setTimeout(60000);

  test('Check heart (favorites) icon in mobile navigation', async ({ page }) => {
    // Set mobile viewport (iPhone X dimensions)
    await page.setViewportSize({ width: 375, height: 812 });

    // Navigate to home page
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('=== PRAVKA 6: Mobile Heart Icon Check ===');

    // On mobile, MobileBottomNav is used instead of Header
    // The bottom navigation bar should be visible with heart icon

    // Check if MobileBottomNav exists (fixed bottom navigation)
    const bottomNav = page.locator('nav[aria-label="Мобильная навигация"]');
    const bottomNavExists = await bottomNav.count() > 0;
    console.log('Bottom navigation exists:', bottomNavExists);

    // Find heart icon in the page
    const heartIconSvg = page.locator('svg.lucide-heart');
    const heartIconCount = await heartIconSvg.count();
    console.log('Heart icons (SVG lucide-heart) found:', heartIconCount);

    // Find favorites link/button with heart
    const favoritesLink = page.locator('a[href="/favorites"], a[aria-label="Избранное"], button[aria-label="Избранное"]');
    const favoritesLinkCount = await favoritesLink.count();
    console.log('Favorites links/buttons found:', favoritesLinkCount);

    // Specifically check bottom nav for heart
    const bottomNavHeart = bottomNav.locator('svg.lucide-heart');
    const bottomNavHeartCount = await bottomNavHeart.count();
    console.log('Heart icons in bottom nav:', bottomNavHeartCount);

    // Check favorites section in bottom nav
    const favoritesSection = bottomNav.locator('a[href="/favorites"]');
    const favoritesSectionVisible = await favoritesSection.isVisible().catch(() => false);
    console.log('Favorites section visible in bottom nav:', favoritesSectionVisible);

    // Get details about the favorites link
    if (favoritesLinkCount > 0) {
      const firstFavLink = favoritesLink.first();
      const isVisible = await firstFavLink.isVisible().catch(() => false);
      const boundingBox = await firstFavLink.boundingBox().catch(() => null);
      console.log('Favorites link visible:', isVisible);
      console.log('Favorites link bounding box:', boundingBox);
    }

    // Take screenshot of the entire mobile page
    await page.screenshot({
      path: 'tests/screenshots/verification/pravka-06-mobile-full.png',
      fullPage: false
    });

    // Take screenshot of just the bottom navigation area
    if (bottomNavExists) {
      const navBox = await bottomNav.boundingBox();
      if (navBox) {
        await page.screenshot({
          path: 'tests/screenshots/verification/pravka-06-mobile-header-heart.png',
          clip: {
            x: navBox.x,
            y: navBox.y,
            width: navBox.width,
            height: navBox.height
          }
        });
        console.log('Bottom nav screenshot saved');
      }
    }

    // Analyze the heart icon structure
    const heartAnalysis = await page.evaluate(() => {
      const results: any = {
        heartIcons: [],
        bottomNavInfo: null,
        favoritesElements: []
      };

      // Find all heart SVGs
      document.querySelectorAll('svg').forEach((svg, idx) => {
        const classes = svg.className?.baseVal || svg.getAttribute('class') || '';
        if (classes.includes('heart') || classes.includes('Heart')) {
          const rect = svg.getBoundingClientRect();
          results.heartIcons.push({
            index: idx,
            classes: classes,
            visible: rect.width > 0 && rect.height > 0,
            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            inViewport: rect.top < window.innerHeight && rect.bottom > 0
          });
        }
      });

      // Find bottom nav
      const bottomNav = document.querySelector('nav[aria-label="Мобильная навигация"]');
      if (bottomNav) {
        const rect = bottomNav.getBoundingClientRect();
        results.bottomNavInfo = {
          exists: true,
          position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          isAtBottom: rect.bottom >= window.innerHeight - 10,
          hasHeartIcon: bottomNav.querySelector('svg.lucide-heart') !== null,
          innerHTML: bottomNav.innerHTML.substring(0, 500) + '...'
        };
      }

      // Find favorites links
      document.querySelectorAll('a[href="/favorites"]').forEach(link => {
        const rect = link.getBoundingClientRect();
        const hasHeart = link.querySelector('svg') !== null;
        results.favoritesElements.push({
          hasHeart: hasHeart,
          text: link.textContent?.trim().substring(0, 50),
          visible: rect.width > 0 && rect.height > 0,
          position: { x: rect.x, y: rect.y }
        });
      });

      return results;
    });

    console.log('\n=== Heart Icon Analysis ===');
    console.log('Heart icons found:', heartAnalysis.heartIcons.length);
    heartAnalysis.heartIcons.forEach((icon: any, i: number) => {
      console.log(`  Icon ${i + 1}: visible=${icon.visible}, inViewport=${icon.inViewport}, y=${icon.position.y}`);
    });

    console.log('\nBottom nav info:', heartAnalysis.bottomNavInfo ? {
      exists: heartAnalysis.bottomNavInfo.exists,
      hasHeartIcon: heartAnalysis.bottomNavInfo.hasHeartIcon,
      isAtBottom: heartAnalysis.bottomNavInfo.isAtBottom
    } : 'Not found');

    console.log('\nFavorites elements:');
    heartAnalysis.favoritesElements.forEach((el: any, i: number) => {
      console.log(`  ${i + 1}: hasHeart=${el.hasHeart}, visible=${el.visible}, text="${el.text}"`);
    });

    // Final verdict
    const hasMobileHeartIcon = heartAnalysis.bottomNavInfo?.hasHeartIcon ||
                               heartAnalysis.heartIcons.some((icon: any) => icon.visible && icon.inViewport);

    console.log('\n=== VERDICT ===');
    console.log('Mobile heart icon present:', hasMobileHeartIcon);

    // Assertions
    expect(bottomNavExists, 'Bottom navigation should exist on mobile').toBeTruthy();
    expect(hasMobileHeartIcon, 'Heart icon should be present in mobile navigation').toBeTruthy();
  });
});
