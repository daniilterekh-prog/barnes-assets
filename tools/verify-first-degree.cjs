const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'/home/daniil/Documents/Codex/2026-10-11/firecrawl/work/web-capture-toolkit/node_modules/playwright');
const base=process.argv[2]||'http://127.0.0.1:8770/';
const root='blocks/nodes/first-degree/';
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../',root,'manifest.json')));
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
 const report={sourceCommit:manifest.sourceCommit,checkedAt:'2026-10-12',results:[],failures:0};
 try{
  for(const width of [390,1440,2560])for(const id of ['assembly',...manifest.blocks.map(b=>b.id.replace('first-degree-',''))]){
   const page=await browser.newPage({viewport:{width,height:1000}}),errors=[],missing=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)missing.push(r.url());});
   try{
    await page.goto(new URL(root+(id==='assembly'?'':id+'/'),base).href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('.node-preview')?.children.length>0);
    if(['assembly','listing','hero','map'].includes(id))await page.waitForFunction(()=>!!window.BarnesFilters&&!!document.querySelector('link[data-barnes-brand-filters]'));
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForTimeout(100);
    const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),height:document.querySelector('.node-preview').getBoundingClientRect().height}));
    assert.equal(geometry.overflow,false,'No horizontal overflow');
    assert.deepEqual(geometry.broken,[],'No broken local images');
    if(!['request-modal','floating-expert','sticky-nav'].includes(id))assert.ok(geometry.height>0,'Visible fragment');
    if(id==='listing'||id==='assembly'){
     const sort=page.locator('.catalog-grid__sort .resort-sort-trigger');await sort.click();
     await page.locator('.resort-quick-dropdown').getByRole('option',{name:'Цена меньше',exact:true}).click();
     assert.equal(await page.locator('.catalog-grid__sort select').inputValue(),'price_asc');
     await page.getByRole('button',{name:'Вторичная',exact:true}).click();
     assert.equal(await page.evaluate(()=>BarnesFilters.getState().market),'secondary');
     await page.getByRole('button',{name:'Новостройки',exact:true}).click();
     await page.locator('.catalog-mode-detailed-filters').click();
     await page.locator('.hero-filter-modal__close').click();
    }
    if(id==='map'||id==='assembly'){
     await page.locator('.catalog-projects-map__fullscreen').click();
     await page.locator('.map-browser').waitFor({state:'visible'});
     if(width<=540)await page.locator('.map-browser__handle').click();
     await page.locator('.map-browser .resort-sort-trigger').click();
     await page.keyboard.press('Escape');
     await page.locator('.map-browser__close').click();
    }
    if(id==='sticky-nav'||id==='footer'){
     const trigger=page.locator(id==='footer'?'.site-footer__callback-btn':'.catalog-sticky__request').filter({visible:true}).first();
     await trigger.click({position:{x:12,y:20}});
     await page.locator('.catalog-feedback-modal').waitFor({state:'visible'});
     await page.keyboard.press('Escape');
    }
    assert.deepEqual(errors,[],'No JS errors');assert.deepEqual(missing,[],'No missing local files');
    report.results.push({id,width,pass:true,...geometry});console.log(`PASS ${id} ${width}`);
   }catch(e){report.failures++;report.results.push({id,width,pass:false,error:e.message,errors,missing});console.log(`FAIL ${id} ${width}: ${e.message}`);}
   await page.close();
  }
 }finally{await browser.close();fs.writeFileSync(path.join(__dirname,'../ui-kit/first-degree-verification-2026-10-12.json'),JSON.stringify(report,null,2)+'\n');}
 if(report.failures)throw Error(`${report.failures} preview checks failed`);
})().catch(e=>{console.error(e);process.exitCode=1;});
