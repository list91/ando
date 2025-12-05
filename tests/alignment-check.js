import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkAlignment() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    // Navigating to the product page
    console.log('Opening product page...');
    await page.goto('http://localhost:8081/product/t-shirts2', {
      waitUntil: 'networkidle'
    });

    // Wait for main elements to load
    await page.waitForSelector('[data-testid="sidebar-menu"], aside, nav', { timeout: 5000 }).catch(() => null);
    await page.waitForSelector('img[alt*="product"], img[alt*="shirt"], img[alt*="t-shirt"], .product-image img', { timeout: 5000 }).catch(() => null);

    // Take screenshot
    const screenshotPath = 'C:/Users/Дарья/qq/ando/tests/screenshots/alignment-check-final.png';

    // Ensure directory exists
    const dir = path.dirname(screenshotPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Screenshot saved: ${screenshotPath}`);

    // Get Y-coordinates of elements
    const coordinates = await page.evaluate(() => {
      const elements = {
        sidebar_menu_new: null,
        product_image_top: null,
        metadata_text: null
      };

      // 1. Find sidebar menu "NEW" text
      const sidebarElements = Array.from(document.querySelectorAll('aside, nav, [role="navigation"], .sidebar, .menu')).flat();
      for (const el of sidebarElements) {
        const text = el.textContent;
        if (text && text.includes('NEW')) {
          const rect = el.getBoundingClientRect();
          elements.sidebar_menu_new = {
            text: text.substring(0, 50),
            y: Math.round(rect.top),
            x: Math.round(rect.left)
          };
          break;
        }
      }

      // Alternative: search for "NEW" text across the page
      if (!elements.sidebar_menu_new) {
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
            if (el.textContent.trim() === 'NEW') {
              const rect = el.getBoundingClientRect();
              elements.sidebar_menu_new = {
                text: 'NEW',
                y: Math.round(rect.top),
                x: Math.round(rect.left)
              };
              break;
            }
          }
        }
      }

      // 2. Find product image (top edge)
      const images = document.querySelectorAll('img');
      for (const img of images) {
        const rect = img.getBoundingClientRect();
        if (rect.width > 200 && rect.height > 200) { // Likely main product image
          elements.product_image_top = {
            alt: img.alt || 'product-image',
            y: Math.round(rect.top),
            x: Math.round(rect.left),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          };
          break;
        }
      }

      // 3. Find metadata text (price, description, etc.)
      const metadataSelectors = [
        '[data-testid="metadata"]',
        '.product-info',
        '.product-details',
        '.price',
        '[class*="price"]',
        '[class*="description"]',
        '.meta'
      ];

      for (const selector of metadataSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          elements.metadata_text = {
            text: el.textContent.substring(0, 100),
            y: Math.round(rect.top),
            x: Math.round(rect.left)
          };
          break;
        }
      }

      // Fallback: find any text that looks like price or metadata
      if (!elements.metadata_text) {
        const textElements = Array.from(document.querySelectorAll('p, span, div')).filter(el => {
          const text = el.textContent.trim();
          return (text.includes('$') || text.includes('€') || text.match(/\d+/)) && el.getBoundingClientRect().height < 100;
        });

        if (textElements.length > 0) {
          const el = textElements[0];
          const rect = el.getBoundingClientRect();
          elements.metadata_text = {
            text: el.textContent.substring(0, 100),
            y: Math.round(rect.top),
            x: Math.round(rect.left)
          };
        }
      }

      return elements;
    });

    // Output results
    console.log('\n========== ALIGNMENT CHECK RESULTS ==========');
    console.log(`Screenshot: ${screenshotPath}`);
    console.log(`Viewport: 1920x1080`);
    console.log('\n--- Y-Coordinates of Elements ---');

    if (coordinates.sidebar_menu_new) {
      console.log(`1. Sidebar Menu "NEW" text:`);
      console.log(`   Y: ${coordinates.sidebar_menu_new.y}px`);
      console.log(`   X: ${coordinates.sidebar_menu_new.x}px`);
      console.log(`   Content: ${coordinates.sidebar_menu_new.text}`);
    } else {
      console.log(`1. Sidebar Menu "NEW" text: NOT FOUND`);
    }

    if (coordinates.product_image_top) {
      console.log(`\n2. Product Image (top edge):`);
      console.log(`   Y: ${coordinates.product_image_top.y}px`);
      console.log(`   X: ${coordinates.product_image_top.x}px`);
      console.log(`   Dimensions: ${coordinates.product_image_top.width}x${coordinates.product_image_top.height}px`);
      console.log(`   Alt: ${coordinates.product_image_top.alt}`);
    } else {
      console.log(`\n2. Product Image (top edge): NOT FOUND`);
    }

    if (coordinates.metadata_text) {
      console.log(`\n3. Metadata Text:`);
      console.log(`   Y: ${coordinates.metadata_text.y}px`);
      console.log(`   X: ${coordinates.metadata_text.x}px`);
      console.log(`   Content: ${coordinates.metadata_text.text}`);
    } else {
      console.log(`\n3. Metadata Text: NOT FOUND`);
    }

    console.log('\n--- Alignment Analysis ---');
    if (coordinates.sidebar_menu_new && coordinates.product_image_top) {
      const diff = Math.abs(coordinates.sidebar_menu_new.y - coordinates.product_image_top.y);
      console.log(`Sidebar Menu Y vs Product Image Y: ${diff}px difference`);
      if (diff < 20) {
        console.log('✓ Elements are well aligned');
      } else {
        console.log('⚠ Elements have significant vertical offset');
      }
    }

    console.log('\n==============================================\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

checkAlignment();
