import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

// Scroll to bottom
await page.evaluate(() => {
  window.scrollTo(0, document.body.scrollHeight);
});

await page.waitForTimeout(1000);

// Check if phrase exists in DOM
const phraseExists = await page.evaluate(() => {
  return document.body.innerText.includes('Не является публичной офертой');
});

console.log('Фраза "Не является публичной офертой" в DOM:', phraseExists);

// Get all text from footer area
const footerArea = await page.evaluate(() => {
  const footer = document.querySelector('footer');
  if (footer) {
    return footer.innerText;
  }
  return '';
});

console.log('\n=== FOOTER HTML ===');
const footerHTML = await page.evaluate(() => {
  const footer = document.querySelector('footer');
  if (footer) {
    return footer.innerHTML;
  }
  return '';
});

// Check if text is in HTML but maybe hidden
const isInHTML = footerHTML.includes('публичной офертой');
console.log('Фраза в HTML footer:', isInHTML);

// Get computed style of paragraph with the phrase
const style = await page.evaluate(() => {
  const paragraphs = document.querySelectorAll('footer p');
  for (let p of paragraphs) {
    if (p.textContent.includes('публичной')) {
      const computed = window.getComputedStyle(p);
      return {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        height: computed.height,
        color: computed.color,
        textContent: p.textContent
      };
    }
  }
  return null;
});

console.log('\nСтиль параграфа с фразой:', style);

await browser.close();
