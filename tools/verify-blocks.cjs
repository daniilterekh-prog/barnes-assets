const fs=require('fs');
const path=require('path');
const {chromium}=require('playwright');
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'../blocks/catalog.json'),'utf8'));
(async()=>{
  let browser;const results=[];let failures=0;
  try{
    browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
    for(const block of catalog.blocks){
      const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[],missing=[];
      page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push({url:r.url(),status:r.status()});});
      const url='http://127.0.0.1:4190/blocks/'+block.id+'/'+block.variant+'/';
      await page.goto(url,{waitUntil:'networkidle',timeout:20000});await page.evaluate(()=>document.fonts.ready);
      const widths=[];for(const width of [390,768,1440,2560]){await page.setViewportSize({width,height:1000});widths.push(await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),visible:document.querySelector('[data-barnes-block]')?.getBoundingClientRect().height>0})));}
      const interactions={};
      if(['why-barnes','team'].includes(block.id)){
        await page.setViewportSize({width:1440,height:1000});
        interactions.descriptionTypography=await page.locator(block.id==='why-barnes'?'.be-body':'.owner-sale-services__text span').first().evaluate(e=>getComputedStyle(e).fontSize==='22px');
      }
      if(block.id==='why-barnes'){await page.locator('.be-tabs button').nth(1).click();interactions.secondTab=await page.locator('.be-tabs button').nth(1).getAttribute('aria-selected')==='true';await page.locator('.be-tabs button').nth(1).press('End');interactions.keyboardEnd=await page.locator('.be-tabs button').nth(3).getAttribute('aria-selected')==='true';}
      if(block.id==='team'){const list=page.locator('.splide__list');const before=await list.getAttribute('style');await page.locator('.owner-sale-services__nav-btn').nth(1).click();interactions.slider=(await list.getAttribute('style'))!==before;}
      if(['hero','why-barnes'].includes(block.id)){await page.locator(block.id==='hero'?'.owner-sale-hero__button':'.be-cta').click();await page.waitForSelector('[data-modal-host] .feedback-modal__input');interactions.modal=true;await page.locator('[data-modal-host] .feedback-modal__input').first().press('Escape');interactions.escape=await page.locator('[data-modal-host]').count()===0;}
      const pass=!errors.length&&!missing.length&&widths.every(w=>!w.overflow&&!w.brokenImages.length&&w.visible)&&Object.values(interactions).every(Boolean);
      if(!pass)failures++;results.push({id:block.id,variant:block.variant,pass,widths,errors,missing,interactions});
      await page.close();
    }
    process.stdout.write(JSON.stringify({sourceCommit:catalog.sourceCommit,checkedAt:'2026-10-08',types:catalog.types,variants:catalog.variants,failures,results},null,2));
  }finally{await browser?.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
