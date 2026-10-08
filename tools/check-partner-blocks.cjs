const {chromium}=require('playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),cp=require('child_process');
const libraryRoot=path.resolve(__dirname,'..'),base=process.env.LIBRARY_ORIGIN||'http://127.0.0.1:4187';
const catalog=JSON.parse(fs.readFileSync(path.join(libraryRoot,'blocks/partners/catalog.json'),'utf8'));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 const results=[],errors=[];
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
  for(const block of catalog.blocks){
   for(const width of [320,390,768,1024,1440,1920]){
    await page.setViewportSize({width,height:1000});await page.goto(base+'/blocks/'+block.id+'/partners/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
    const root=page.locator('[data-barnes-block]').first();assert.equal(await root.getAttribute('data-barnes-block'),block.id);
    await page.evaluate(()=>document.querySelectorAll('img').forEach(i=>i.loading='eager'));
    await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0),{},{timeout:10000});
    assert.deepEqual(errors,[],block.id+' JS errors');
    const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,ids:[...document.querySelectorAll('[id]')].map(e=>e.id)}));
    assert.equal(layout.overflow,false,block.id+' overflow '+width);assert.equal(new Set(layout.ids).size,layout.ids.length,block.id+' duplicate IDs');
    if(block.id==='consultation-expert'){
     const buttons=await root.locator('.catalog-contact__method').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect(),s=getComputedStyle(b);return{height:r.height,size:s.fontSize,weight:s.fontWeight,icon:b.querySelector('svg').getBoundingClientRect().width,clipped:b.scrollWidth>r.width+1}}));
     assert.equal(buttons.length,4);for(const b of buttons){assert.equal(b.height,width<=540?29:35);assert.equal(b.size,width<=540?'18px':width>=1441?'19px':'17px');assert.equal(b.weight,'400');assert.equal(b.icon,width<=540?22:18);assert.equal(b.clipped,false);}
     for(let i=0;i<4;i++){await root.locator('.catalog-contact__method').nth(i).press('Enter');assert.equal(await root.locator('[aria-pressed=true]').count(),1);}
    }
    if(block.id==='directions'){
     const heights=[];for(let i=0;i<7;i++){if(width<=900)await root.locator('.bd-mobile-picker').selectOption(String(i));else await root.locator('.bd-navbtn').nth(i).press('Enter');
      heights.push(await root.locator('.bd-fixed-panel').evaluate(p=>{const r=p.getBoundingClientRect(),b=p.querySelector('.bd-cta').getBoundingClientRect(),photo=p.querySelector('.bd-imagewrap').getBoundingClientRect();return{h:r.height,y:b.y-r.y,bottom:photo.bottom-b.bottom}}));}
     assert(heights.every(h=>Math.abs(h.h-heights[0].h)<1&&Math.abs(h.y-heights[0].y)<1),'directions layout shift '+width);
     if(width>900)assert(heights.every(h=>Math.abs(h.bottom)<1),'directions photo bottom '+width);
    }
    if(block.id==='conditions'){
     for(let i=0;i<3;i++){await root.locator('.ambassadors-conditions__reveal').nth(i).press('Enter');assert.equal(await root.locator('.ambassadors-conditions__reveal').nth(i).getAttribute('aria-expanded'),'true');}
    }
    if(block.id==='advantages'){
     const track=root.locator('.splide__track');await track.focus();await page.keyboard.press('End');assert.equal(await root.locator('[aria-label="Следующее преимущество"]').isDisabled(),true);await page.keyboard.press('Home');assert.equal(await root.locator('[aria-label="Предыдущее преимущество"]').isDisabled(),true);
     const fit=await root.locator('.ambassadors-advantages__card').evaluateAll(cs=>cs.every(c=>{const p=c.querySelector('.ambassadors-advantages__card-copy'),d=c.querySelector('.ambassadors-advantages__description'),n=c.querySelector('.ambassadors-advantages__number'),t=c.querySelector('h3'),s=getComputedStyle(p);return parseFloat(s.paddingTop)+parseFloat(s.paddingBottom)+n.getBoundingClientRect().height+parseFloat(getComputedStyle(n).marginBottom)+t.getBoundingClientRect().height+d.scrollHeight+16<=c.getBoundingClientRect().height+1;}));assert(fit,'advantage descriptions fit');
    }
    if(block.id==='faq'){const q=root.locator('.catalog-faq__question').first();const initial=await q.getAttribute('aria-expanded');await q.press('Enter');assert.notEqual(await q.getAttribute('aria-expanded'),initial);}
    if(block.id==='header'){await root.locator('.site-header__icon-btn').click();assert.equal(await root.locator('.site-menu').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await root.locator('.site-menu').isVisible(),false);}
    if(block.id==='request-modal'){assert.equal(await root.locator('.feedback-modal').isVisible(),true);await page.keyboard.press('Shift+Tab');assert(await root.locator('.feedback-modal').evaluate(m=>m.contains(document.activeElement)));await page.keyboard.press('Escape');assert.equal(await root.locator('.feedback-modal').isVisible(),false);}
    results.push({block:block.id,width,images:true,noOverflow:true,uniqueIds:true,interaction:'PASS'});
    if(['consultation-expert','directions','advantages'].includes(block.id)&&width===1440){await root.screenshot({path:path.join(libraryRoot,'blocks/partners/'+block.id+'-1440.png')});}
   }
   console.log('PASS '+block.id);
  }
  // Exercise request event + modal dependency in an otherwise standalone preview.
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/blocks/directions/partners/',{waitUntil:'networkidle'});await page.locator('.bd-navbtn').nth(5).press('Enter');await page.locator('.bd-cta').click();await page.locator('.feedback-modal:not([hidden])').waitFor();assert.equal(await page.locator('.feedback-modal__direction').innerText(),'Направление: ВНЖ и гражданство');assert.equal(await page.locator('input[name=directionId]').inputValue(),'residency');await page.keyboard.press('Escape');
  // Mount two instances with their actual dependencies; IDs and state must isolate.
  await page.goto(base+'/blocks/faq/partners/',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{const original=document.querySelector('[data-barnes-block]'),copy=original.cloneNode(true);document.body.append(copy);const {initBlock}=await import('/blocks/_shared/partners/runtime.js');initBlock(copy);});
  const duplicate=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.length!==new Set(ids).size;});assert.equal(duplicate,false);
  const second=page.locator('[data-barnes-block]').nth(1).locator('.catalog-faq__question').first();const firstState=await page.locator('[data-barnes-block]').first().locator('.catalog-faq__question').first().getAttribute('aria-expanded');await second.click();assert.equal(await page.locator('[data-barnes-block]').first().locator('.catalog-faq__question').first().getAttribute('aria-expanded'),firstState);
  assert.deepEqual(errors,[]);
  const report=JSON.stringify({sourceCommit:catalog.sourceCommit,date:'2026-10-08',checks:results.length,results,directionRequestModal:true,twoInstancesIsolated:true,formDelivery:'not connected, preview only'},null,2);
  const file=path.join(libraryRoot,'blocks/partners/checks.json'),old=fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;
  const patch='*** Begin Patch\n'+(old?'*** Update File: '+file+'\n@@\n'+old.trimEnd().split('\n').map(l=>'-'+l).join('\n')+'\n':'*** Add File: '+file+'\n')+report.split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch';
  const applied=cp.spawnSync('apply_patch',[],{input:patch,encoding:'utf8'});if(applied.status)throw Error(applied.stderr||applied.stdout);console.log('PASS '+results.length+' responsive checks, request modal and two-instance isolation');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
