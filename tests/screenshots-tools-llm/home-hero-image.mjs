/**
 * Check home page hero image (БАГ-7)
 */

import { chromium } from 'playwright';

async function checkHeroImage() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Track failed image requests
  const failedImages = [];
  page.on('response', response => {
    if (response.request().resourceType() === 'image' && !response.ok()) {
      failedImages.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const timestamp = Date.now();

  // Screenshot
  await page.screenshot({
    path: `C:/sts/projects/ando/tests/screenshots-tools-llm/screenshots/home-hero-${timestamp}.png`,
    fullPage: false
  });

  // Check for hero images
  const heroImages = await page.locator('img[class*="hero"], img[class*="banner"], section img, .hero img').count();
  const allImages = await page.locator('img').count();

  // Check for broken images
  const brokenImages = await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    const broken = [];
    images.forEach(img => {
      if (!img.complete || img.naturalHeight === 0) {
        broken.push(img.src);
      }
    });
    return broken;
  });

  console.log(JSON.stringify({
    status: 'success',
    screenshot: `home-hero-${timestamp}.png`,
    totalImages: allImages,
    heroImagesFound: heroImages,
    brokenImages: brokenImages,
    failedImageRequests: failedImages
  }, null, 2));

  await browser.close();
}

checkHeroImage();
