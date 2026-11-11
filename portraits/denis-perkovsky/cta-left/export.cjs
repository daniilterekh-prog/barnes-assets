/* Export the source page's existing CTA layers; do not modify the hosted page. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const source = 'https://daniilterekh-prog.github.io/barn-estate-homepage-clone/kurortnaya/';
(async () => {
  const browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport: {width: 1536, height: 1100}, deviceScaleFactor: 1});
    await page.goto(source, {waitUntil: 'networkidle', timeout: 60000});
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({content: 'html{scrollbar-width:none!important}::-webkit-scrollbar{display:none!important}'});
    const section = page.locator('.catalog-consultation').first();
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await section.locator('.catalog-consultation__image').evaluate(image => image.decode());
    const before = await section.boundingBox();
    const clip = {x: Math.ceil(before.x), y: Math.ceil(before.y), width: Math.floor(before.x+before.width)-Math.ceil(before.x), height: Math.floor(before.y+before.height)-Math.ceil(before.y)};
    await page.screenshot({path: '/tmp/denis-cta-source-reference.png', clip, animations: 'disabled'});
    await page.addStyleTag({content: '.catalog-consultation .catalog-consultation__grid{visibility:hidden!important}'});
    const after = await section.boundingBox();
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('CTA dimensions changed');
    await page.screenshot({path: path.join(__dirname, 'denis-cta-left.png'), clip, animations: 'disabled'});
    const layers = await section.evaluate(el => [...el.querySelectorAll('.catalog-consultation__image,.catalog-consultation__overlay')].map(e => {
      const s = getComputedStyle(e), r = e.getBoundingClientRect(), root = el.getBoundingClientRect();
      return {class: e.className, x: r.x-root.x, y: r.y-root.y, width: r.width, height: r.height, objectFit: s.objectFit, objectPosition: s.objectPosition, background: s.background, src: e.getAttribute('src')};
    }));
    fs.writeFileSync(path.join(__dirname, 'verification.json'), JSON.stringify({source, date: '2026-11-11', method: 'Original browser-rendered scene; only the text/form grid is hidden with visibility:hidden', viewport: {width:1536,height:1100}, deviceScaleFactor:1, before, after, clip, unchangedGeometry: true, layers}, null, 2)+'\n');
    console.log(JSON.stringify({before, after, layers}, null, 2));
  } finally { await browser.close(); }
})();
