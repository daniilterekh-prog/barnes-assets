/* Re-render the existing CTA assets at 1800 x 860 without regenerating the face. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const source = 'https://daniilterekh-prog.github.io/barn-estate-homepage-clone/kurortnaya/';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1536, height: 1100 }, deviceScaleFactor: 1 });
    await page.route('**/*', route => new URL(route.request().url()).hostname === 'daniilterekh-prog.github.io' ? route.continue() : route.abort());
    await page.goto(source, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.addStyleTag({ content: 'html{scrollbar-width:none!important}::-webkit-scrollbar{display:none!important}' });
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('.catalog-consultation').first();
    await section.scrollIntoViewIfNeeded();
    await section.locator('.catalog-consultation__image').evaluate(image => image.decode());
    const original = await section.boundingBox();
    const originalImage = await section.locator('.catalog-consultation__image').boundingBox();
    const scale = 860 / original.height;
    await page.setViewportSize({ width: 1800, height: 1000 });
    await section.evaluate((el, geometry) => {
      const { height, scale, imageWidth, imageHeight } = geometry;
      const set = (node, values) => Object.entries(values).forEach(([name, value]) => node.style.setProperty(name, value, 'important'));
      set(el, { position: 'fixed', top: '0', left: '0', width: `${1802 / scale}px`, height: `${height + 2}px`, 'min-height': '0', 'max-height': 'none', margin: '0', transform: `scale(${scale})`, 'transform-origin': 'top left', 'z-index': '2147483647', overflow: 'hidden' });
      set(el.querySelector('.catalog-consultation__grid'), { visibility: 'hidden' });
      set(el.querySelector('.catalog-consultation__image'), { width: `${imageWidth}px`, height: `${imageHeight}px`, 'max-width': 'none', 'max-height': 'none', left: '0', bottom: '0', top: 'auto' });
    }, { height: original.height, scale, imageWidth: originalImage.width, imageHeight: originalImage.height });
    await page.addStyleTag({ content: 'html{scrollbar-width:none!important}::-webkit-scrollbar{display:none!important}' });
    const output = path.join(__dirname, 'denis-cta-left-1800x860.png');
    await page.screenshot({ path: output, clip: { x: 0, y: 0, width: 1800, height: 860 }, animations: 'disabled' });
    const bytes = fs.readFileSync(output);
    const dimensions = { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
    if (dimensions.width !== 1800 || dimensions.height !== 860) throw new Error('Unexpected PNG dimensions');
    const image = await section.locator('.catalog-consultation__image').evaluate(el => ({ src: el.src, naturalWidth: el.naturalWidth, naturalHeight: el.naturalHeight, complete: el.complete }));
    const report = { source, date: '2026-11-11', method: 'Native browser render from original portrait and interior; uniform scene scaling with added dark space on the right; no face regeneration', original, scale, image, output: { file: path.basename(output), ...dimensions, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') } };
    fs.writeFileSync(path.join(__dirname, 'verification-hd.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
