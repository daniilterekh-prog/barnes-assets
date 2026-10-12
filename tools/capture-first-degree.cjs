/** Capture reviewed local Kurortnaya DOM; no cookies, analytics, API keys or map tiles. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/home/daniil/Documents/Codex/2026-10-11/firecrawl/work/web-capture-toolkit/node_modules/playwright');
const site = path.resolve(process.argv[2]);
const base = process.argv[3] || 'http://127.0.0.1:8769/';
const publicBase = 'https://daniilterekh-prog.github.io/barn-estate-homepage-clone/';
const out = path.join(site,'.playwright-mcp');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname,'../blocks/nodes/first-degree/manifest.json')));
const roles = {h1:'.catalog-hero__title',h2:'.catalog-grid__title',eyebrow:'.catalog-grid .catalog-section-eyebrow',faqQuestion:'.catalog-faq__question-text',faqAnswer:'.catalog-faq__answer-content',cardName:'.catalog-grid .apartment-card__name-text',cardFact:'.catalog-grid .listing-card-fact__value',cardPrice:'.catalog-grid .apartment-card__price',filter:'.catalog-quick-filters__caption',sort:'.catalog-grid__sort .resort-sort-trigger',contactAction:'.catalog-consultation__method',footerLink:'.site-footer__link'};
const props = ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','backgroundColor','borderRadius','padding','margin','minHeight'];
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',headless:true});
  try {
    for(const width of [390,768,1366,1920,2560]) {
      const page = await browser.newPage({viewport:{width,height:1000}});
      await page.goto(new URL('kurortnaya/',base).href,{waitUntil:'domcontentloaded'});
      await page.waitForSelector('[data-brand-context=listing]');
      await page.waitForSelector('.map-browser [data-custom-dropdown-ready]',{state:'attached'});
      await page.evaluate(()=>document.fonts.ready);
      const measurements = await page.evaluate(({roles,props})=>({viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,roles:Object.fromEntries(Object.entries(roles).map(([name,selector])=>{
        const el=document.querySelector(selector);if(!el)return [name,{selector,missing:true}];const s=getComputedStyle(el);
        return [name,{selector,...Object.fromEntries(props.map(p=>[p,s[p]])),rect:el.getBoundingClientRect().toJSON()}];
      }))}),{roles,props});
      fs.writeFileSync(path.join(out,`first-degree-measurements-${width}.json`),JSON.stringify(measurements,null,2));
      if(width===390 || width===1366) {
        const view=width===390?'mobile':'desktop';
        const rows=await page.evaluate(({blocks,base,publicBase})=>blocks.map(block=>{
          const el=document.querySelector(block.source.selector);if(!el)throw Error('Missing '+block.id);
          const node=el.cloneNode(true);
          // Rebind transient controls after mount, not copied JS event listeners.
          node.querySelectorAll('.resort-sort-trigger,.resort-select-trigger,[data-brand-context]').forEach(n=>n.remove());
          node.querySelectorAll('select[data-custom-dropdown-ready]').forEach(n=>{delete n.dataset.customDropdownReady;n.hidden=false;n.removeAttribute('aria-hidden');n.removeAttribute('tabindex');});
          node.querySelectorAll('[data-start-sales-bound],[data-mode-initializing]').forEach(n=>{n.removeAttribute('data-start-sales-bound');n.removeAttribute('data-mode-initializing');});
          // Yandex tiles and runtime are not portable. Preserve public preview + controls.
          const mapCanvas=node.querySelector('.catalog-projects-map__canvas');
          if(mapCanvas) {
            const image=document.createElement('img');image.src=new URL('kurortnaya/map-preview.png',publicBase).href;image.alt='Статичный снимок карты Яндекс';image.className='node-map-preview';
            mapCanvas.replaceChildren(image);
          }
          node.querySelectorAll('ymaps,[class*="ymaps3"],[class*="ymaps-"],canvas,iframe').forEach(n=>n.remove());
          node.querySelectorAll('source[srcset]').forEach(n=>{
            n.srcset=n.srcset.split(',').map(candidate=>{
              const [url,...descriptor]=candidate.trim().split(/\s+/);
              return [new URL(url,location.href).href.replace(base,publicBase),...descriptor].join(' ');
            }).join(', ');
          });
          node.querySelectorAll('[src]').forEach(n=>{n.setAttribute('src',new URL(n.getAttribute('src'),location.href).href.replace(base,publicBase));n.removeAttribute('srcset');});
          return {id:block.id.replace('first-degree-',''),selector:block.source.selector,html:node.outerHTML};
        }),{blocks:manifest.blocks,base,publicBase});
        fs.writeFileSync(path.join(out,`first-degree-${view}.json`),JSON.stringify(rows.filter(r=>!r.id.startsWith('card-')),null,2));
        fs.writeFileSync(path.join(out,`first-degree-cards-${view}.json`),JSON.stringify(rows.filter(r=>r.id.startsWith('card-')),null,2));
      }
      console.log(`CAPTURE ${width}: ${Object.keys(measurements.roles).length} roles, overflow=${measurements.overflow}`);
      await page.close();
    }
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
