/**
 * Verify scroll within container (ScrollReveal implementation)
 */

const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:8087';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'current');

async function verifyScrollContainer() {
  const browser = await chromium.launch({ headless: true });

  try {
    // Desktop test
    console.log('=== Desktop Container Scroll Test ===\n');

    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const desktopPage = await desktopContext.newPage();

    await desktopPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1500);

    // Find and scroll the container
    const desktopScrollResult = await desktopPage.evaluate(async () => {
      const container = document.querySelector('.overflow-y-auto.snap-y, [class*="overflow-y-auto"][class*="snap"]');
      if (!container) return { found: false };

      const initialScroll = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Scroll down using scrollTo
      container.scrollTo({ top: 500, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 300));

      const afterScroll = container.scrollTop;

      return {
        found: true,
        containerClass: container.className,
        scrollHeight,
        clientHeight,
        maxScrollable: scrollHeight - clientHeight,
        initialScroll,
        afterScroll,
        scrolled: afterScroll > initialScroll,
        scrollAmount: afterScroll - initialScroll
      };
    });

    console.log('Desktop scroll result:', JSON.stringify(desktopScrollResult, null, 2));

    // Take screenshot after scroll
    await desktopPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'after-17-home-desktop.png'),
      fullPage: false
    });

    // Check hero section animation/visibility after scroll
    const heroAfterScroll = await desktopPage.evaluate(async () => {
      const container = document.querySelector('.overflow-y-auto.snap-y, [class*="overflow-y-auto"][class*="snap"]');
      if (!container) return null;

      // Scroll back to top first
      container.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 200));

      // Find hero section (first section in container)
      const hero = container.querySelector('section:first-of-type, div:first-child > section');
      if (!hero) return { heroFound: false };

      // Get initial hero styles
      const initialRect = hero.getBoundingClientRect();
      const initialStyles = window.getComputedStyle(hero);
      const initialData = {
        top: initialRect.top,
        opacity: initialStyles.opacity,
        transform: initialStyles.transform,
        filter: initialStyles.filter
      };

      // Now scroll down
      container.scrollTo({ top: 600, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 500));

      // Get hero styles after scroll
      const afterRect = hero.getBoundingClientRect();
      const afterStyles = window.getComputedStyle(hero);
      const afterData = {
        top: afterRect.top,
        opacity: afterStyles.opacity,
        transform: afterStyles.transform,
        filter: afterStyles.filter
      };

      return {
        heroFound: true,
        initial: initialData,
        after: afterData,
        topChanged: initialData.top !== afterData.top,
        opacityChanged: initialData.opacity !== afterData.opacity,
        transformChanged: initialData.transform !== afterData.transform,
        filterChanged: initialData.filter !== afterData.filter
      };
    });

    console.log('\nHero animation check:', JSON.stringify(heroAfterScroll, null, 2));

    await desktopContext.close();

    // Mobile test
    console.log('\n=== Mobile Container Scroll Test ===\n');

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);

    const mobileScrollResult = await mobilePage.evaluate(async () => {
      const container = document.querySelector('.overflow-y-auto.snap-y, [class*="overflow-y-auto"][class*="snap"]');
      if (!container) return { found: false };

      const initialScroll = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Scroll down
      container.scrollTo({ top: 400, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 300));

      const afterScroll = container.scrollTop;

      return {
        found: true,
        containerClass: container.className,
        scrollHeight,
        clientHeight,
        maxScrollable: scrollHeight - clientHeight,
        initialScroll,
        afterScroll,
        scrolled: afterScroll > initialScroll,
        scrollAmount: afterScroll - initialScroll
      };
    });

    console.log('Mobile scroll result:', JSON.stringify(mobileScrollResult, null, 2));

    // Take screenshot
    await mobilePage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'after-17-home-mobile.png'),
      fullPage: false
    });

    await mobileContext.close();

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Desktop: Container found: ${desktopScrollResult.found}, Scrolled: ${desktopScrollResult.scrolled}`);
    console.log(`Mobile: Container found: ${mobileScrollResult.found}, Scrolled: ${mobileScrollResult.scrolled}`);

    if (heroAfterScroll) {
      console.log(`Hero animation: Top changed: ${heroAfterScroll.topChanged}, Opacity changed: ${heroAfterScroll.opacityChanged}`);
    }

    return {
      desktop: {
        containerFound: desktopScrollResult.found,
        scrollWorks: desktopScrollResult.scrolled,
        maxScrollable: desktopScrollResult.maxScrollable
      },
      mobile: {
        containerFound: mobileScrollResult.found,
        scrollWorks: mobileScrollResult.scrolled,
        maxScrollable: mobileScrollResult.maxScrollable
      },
      heroAnimation: heroAfterScroll
    };

  } finally {
    await browser.close();
  }
}

verifyScrollContainer().catch(console.error);
