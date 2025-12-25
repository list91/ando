import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

// Get the sidebar text
const sidebarText = await page.locator('[class*="sidebar"], [class*="footer"]').allTextContents();
console.log('Sidebar content:', sidebarText);

// Take screenshot
await page.screenshot({ path: '/tmp/check-sidebar.png', fullPage: false });
console.log('Screenshot saved to /tmp/check-sidebar.png');

await browser.close();
