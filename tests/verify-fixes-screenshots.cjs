/**
 * Verification screenshots for fixes 13, 17, 20
 * Takes AFTER screenshots and compares with BASELINE
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

const BASE_URL = 'http://localhost:8087';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const CURRENT_DIR = path.join(SCREENSHOTS_DIR, 'current');
const BASELINE_DIR = path.join(SCREENSHOTS_DIR, 'baseline');
const DIFF_DIR = path.join(SCREENSHOTS_DIR, 'diff');

// Ensure directories exist
[CURRENT_DIR, DIFF_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });

  try {
    // === PRAVKA 13: Admin Orders with DualScrollTable ===
    console.log('\n=== Pravka 13: Admin Orders ===');
    const adminContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const adminPage = await adminContext.newPage();

    // Login to admin
    await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(500);

    // Check if login is needed
    const loginForm = await adminPage.locator('input[type="password"]').count();
    if (loginForm > 0) {
      await adminPage.fill('input[type="password"]', 'secret123');
      await adminPage.click('button[type="submit"]');
      await adminPage.waitForTimeout(1000);
    }

    // Navigate to orders
    await adminPage.goto(`${BASE_URL}/admin/orders`, { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(1000);

    // Take screenshot of orders table
    await adminPage.screenshot({
      path: path.join(CURRENT_DIR, 'after-13-admin-orders.png'),
      fullPage: false
    });
    console.log('Screenshot: after-13-admin-orders.png');

    // Check for top scrollbar
    const topScrollbar = await adminPage.locator('.dual-scroll-top, [class*="scroll-top"], .top-scrollbar').count();
    const tableScrollable = await adminPage.evaluate(() => {
      const tables = document.querySelectorAll('table');
      for (const table of tables) {
        const container = table.closest('[class*="scroll"]') || table.parentElement;
        if (container && container.scrollWidth > container.clientWidth) {
          return true;
        }
      }
      return false;
    });
    console.log(`Top scrollbar elements: ${topScrollbar}`);
    console.log(`Table is scrollable: ${tableScrollable}`);

    await adminContext.close();

    // === PRAVKA 17: ScrollReveal on Homepage ===
    console.log('\n=== Pravka 17: Homepage ScrollReveal ===');

    // Desktop version
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const desktopPage = await desktopContext.newPage();

    await desktopPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);

    // Initial screenshot
    await desktopPage.screenshot({
      path: path.join(CURRENT_DIR, 'after-17-home-desktop.png'),
      fullPage: false
    });
    console.log('Screenshot: after-17-home-desktop.png');

    // Test scroll functionality
    const scrollWorksDesktop = await desktopPage.evaluate(async () => {
      const initialScroll = window.scrollY;
      window.scrollBy(0, 500);
      await new Promise(r => setTimeout(r, 500));
      const afterScroll = window.scrollY;
      return afterScroll > initialScroll;
    });
    console.log(`Desktop scroll works: ${scrollWorksDesktop}`);

    // Check for hero animation classes
    const heroAnimated = await desktopPage.evaluate(() => {
      const hero = document.querySelector('[class*="hero"], .hero-section, section:first-of-type');
      if (hero) {
        const styles = window.getComputedStyle(hero);
        return {
          hasOpacity: styles.opacity !== '1',
          hasTransform: styles.transform !== 'none',
          hasTransition: styles.transition !== 'none' && styles.transition !== ''
        };
      }
      return null;
    });
    console.log('Hero animation styles:', heroAnimated);

    await desktopContext.close();

    // Mobile version
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    await mobilePage.screenshot({
      path: path.join(CURRENT_DIR, 'after-17-home-mobile.png'),
      fullPage: false
    });
    console.log('Screenshot: after-17-home-mobile.png');

    // Test touch scroll on mobile
    const scrollWorksMobile = await mobilePage.evaluate(async () => {
      const initialScroll = window.scrollY;
      window.scrollBy(0, 300);
      await new Promise(r => setTimeout(r, 500));
      const afterScroll = window.scrollY;
      return afterScroll > initialScroll;
    });
    console.log(`Mobile scroll works: ${scrollWorksMobile}`);

    await mobileContext.close();

    // === PRAVKA 20: Product Color Circles ===
    console.log('\n=== Pravka 20: Product Color Circles ===');
    const productContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const productPage = await productContext.newPage();

    await productPage.goto(`${BASE_URL}/product/coat1`, { waitUntil: 'networkidle' });
    await productPage.waitForTimeout(1000);

    // Scroll to color section if needed
    await productPage.evaluate(() => {
      const colorSection = document.querySelector('[class*="color"], [class*="Color"]');
      if (colorSection) {
        colorSection.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await productPage.waitForTimeout(500);

    await productPage.screenshot({
      path: path.join(CURRENT_DIR, 'after-20-product-colors.png'),
      fullPage: false
    });
    console.log('Screenshot: after-20-product-colors.png');

    // Check for color circles
    const colorCircles = await productPage.evaluate(() => {
      // Look for circular color elements
      const circles = document.querySelectorAll('[class*="color-circle"], [class*="colorCircle"], .color-option, [style*="border-radius: 50%"], [style*="border-radius:50%"]');
      const roundElements = [];

      document.querySelectorAll('*').forEach(el => {
        const styles = window.getComputedStyle(el);
        const width = parseFloat(styles.width);
        const height = parseFloat(styles.height);
        const borderRadius = styles.borderRadius;
        const bgColor = styles.backgroundColor;

        // Check if it's a small circular element with background color
        if (width > 10 && width < 60 && Math.abs(width - height) < 5) {
          if (borderRadius.includes('50%') || borderRadius.includes('9999px') ||
              (parseFloat(borderRadius) >= width / 2)) {
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
              roundElements.push({
                width,
                height,
                borderRadius,
                backgroundColor: bgColor,
                className: el.className
              });
            }
          }
        }
      });

      return {
        foundBySelector: circles.length,
        foundCircular: roundElements.slice(0, 10) // First 10 for debugging
      };
    });
    console.log('Color circles found:', JSON.stringify(colorCircles, null, 2));

    await productContext.close();

  } finally {
    await browser.close();
  }
}

async function compareImages(baselineName, currentName, diffName) {
  const baselinePath = path.join(BASELINE_DIR, baselineName);
  const currentPath = path.join(CURRENT_DIR, currentName);
  const diffPath = path.join(DIFF_DIR, diffName);

  if (!fs.existsSync(baselinePath)) {
    console.log(`Baseline not found: ${baselinePath}`);
    return { error: 'baseline_missing', percentage: null };
  }

  if (!fs.existsSync(currentPath)) {
    console.log(`Current not found: ${currentPath}`);
    return { error: 'current_missing', percentage: null };
  }

  try {
    const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
    const current = PNG.sync.read(fs.readFileSync(currentPath));

    // Handle size mismatch
    const width = Math.max(baseline.width, current.width);
    const height = Math.max(baseline.height, current.height);

    // Resize images if needed
    const resizedBaseline = resizeImage(baseline, width, height);
    const resizedCurrent = resizeImage(current, width, height);

    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
      resizedBaseline.data,
      resizedCurrent.data,
      diff.data,
      width,
      height,
      { threshold: 0.1 }
    );

    fs.writeFileSync(diffPath, PNG.sync.write(diff));

    const totalPixels = width * height;
    const percentage = ((numDiffPixels / totalPixels) * 100).toFixed(2);

    return {
      diffPixels: numDiffPixels,
      totalPixels,
      percentage: `${percentage}%`,
      diffPath
    };
  } catch (err) {
    console.error(`Error comparing ${baselineName} vs ${currentName}:`, err.message);
    return { error: err.message, percentage: null };
  }
}

function resizeImage(img, width, height) {
  if (img.width === width && img.height === height) {
    return img;
  }

  const resized = new PNG({ width, height, fill: true });
  // Fill with white
  for (let i = 0; i < resized.data.length; i += 4) {
    resized.data[i] = 255;     // R
    resized.data[i + 1] = 255; // G
    resized.data[i + 2] = 255; // B
    resized.data[i + 3] = 255; // A
  }

  // Copy original image
  for (let y = 0; y < img.height && y < height; y++) {
    for (let x = 0; x < img.width && x < width; x++) {
      const srcIdx = (img.width * y + x) << 2;
      const dstIdx = (width * y + x) << 2;
      resized.data[dstIdx] = img.data[srcIdx];
      resized.data[dstIdx + 1] = img.data[srcIdx + 1];
      resized.data[dstIdx + 2] = img.data[srcIdx + 2];
      resized.data[dstIdx + 3] = img.data[srcIdx + 3];
    }
  }

  return resized;
}

async function runVerification() {
  console.log('='.repeat(60));
  console.log('VERIFICATION: Taking screenshots AFTER fixes');
  console.log('='.repeat(60));

  // Step 1: Take screenshots
  await takeScreenshots();

  // Step 2: Compare with baseline
  console.log('\n' + '='.repeat(60));
  console.log('COMPARISON: Baseline vs Current');
  console.log('='.repeat(60));

  const comparisons = [
    { baseline: 'baseline-13-admin-orders.png', current: 'after-13-admin-orders.png', diff: 'diff-13-admin-orders.png', name: 'pravka-13' },
    { baseline: 'baseline-17-home-desktop.png', current: 'after-17-home-desktop.png', diff: 'diff-17-home-desktop.png', name: 'pravka-17-desktop' },
    { baseline: 'baseline-17-home-mobile.png', current: 'after-17-home-mobile.png', diff: 'diff-17-home-mobile.png', name: 'pravka-17-mobile' },
    { baseline: 'baseline-20-product-colors.png', current: 'after-20-product-colors.png', diff: 'diff-20-product-colors.png', name: 'pravka-20' }
  ];

  const diffResults = {};

  for (const comp of comparisons) {
    console.log(`\nComparing: ${comp.baseline} vs ${comp.current}`);
    const result = await compareImages(comp.baseline, comp.current, comp.diff);
    diffResults[comp.name] = result.percentage || result.error;
    console.log(`Result: ${JSON.stringify(result)}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('DIFF PERCENTAGES:');
  console.log(JSON.stringify(diffResults, null, 2));
  console.log('='.repeat(60));

  return diffResults;
}

runVerification().catch(console.error);
