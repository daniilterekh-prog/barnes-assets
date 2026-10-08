/* Export approved rendered owner-page blocks without modifying source pages.
 * Emits apply_patch text; only binary source assets are copied directly.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');
const sourceRoot = '/home/daniil/Documents/ChatGPT/САЙТ';
const libraryRoot = path.resolve(__dirname, '..');
const sourceCommit = process.env.SOURCE_COMMIT || '43612ab';
const definitions = [
  ['header','Главный хедер','.layout__header'],
  ['sticky-nav','Якорная навигация','.owner-sale-sticky'],
  ['hero','Первый экран','.owner-sale-hero'],
  ['presentation','Стратегия презентации','.owner-sale-presentation'],
  ['team','Единая команда BARNES','.owner-sale-services'],
  ['brand','BARNES / Москва','.about-company'],
  ['mechanics','Эксклюзив / этапы продажи','.owner-sale-exclusive, .owner-sale-stages'],
  ['why-barnes','Почему собственники выбирают BARNES','#why-barnes'],
  ['strategy','Индивидуальная стратегия продажи','.owner-sale-strategy'],
  ['consultation-central','Центральная форма с экспертом','.catalog-consultation'],
  ['property-links','Перелинковка с изображениями','.owner-sale-types'],
  ['consultation-expert','Нижний CTA с круглым портретом','.catalog-contact'],
  ['newsletter','Подписка на материалы','.newsletter-cta'],
  ['footer','Футер','.site-footer'],
  ['floating-expert','Плавающий эксперт','.floating-expert'],
  ['request-modal','Всплывающая форма с Русланом','.feedback-modal']
];
const variant = process.argv[2];
const only = process.argv[3];
if (!['rent','sale'].includes(variant)) throw Error('Use rent or sale, optionally block slug');
const route = variant === 'rent' ? 'arenda_sobstvennikam' : 'prodazha_sobstvennikam';
const origin = 'http://127.0.0.1:4185';
const pageUrl = origin + '/barn-estate-homepage-clone/' + route + '/';
const patches = [];
const manifests = [];
const assets = new Map();
function asset(url, base = pageUrl) {
  if (!url || /^(data:|#|mailto:|tel:)/.test(url)) return url;
  let resolved; try { resolved = new URL(url, base); } catch { return url; }
  if (resolved.origin !== origin) return resolved.href;
  const relative = decodeURIComponent(resolved.pathname).replace(/^\/barn-estate-homepage-clone\//,'').replace(/^\//,'');
  const file = path.resolve(sourceRoot,relative);
  if (!file.startsWith(sourceRoot + '/') || !fs.existsSync(file) || !fs.statSync(file).isFile()) throw Error('Missing asset: ' + file);
  const name = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12) + '-' + path.basename(file);
  const destination = path.join(libraryRoot,'blocks/_assets',name);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  if (!fs.existsSync(destination)) fs.copyFileSync(file,destination);
  assets.set(name,{source:relative,file:name,bytes:fs.statSync(file).size});
  return '../../_assets/' + name;
}
function urls(css,base) { return css.replace(/url\((['"]?)(.*?)\1\)/g,(_,q,u)=>'url("'+asset(u,base)+'")'); }
function scope(selector) {
  return selector.replaceAll('#why-barnes','.be-panorama-root').replace(/:root\b/g,'.barnes-template').replace(/(^|[\s>+~,])(?:html|body)(?=[.#:\[\s>+~,]|$)/g,'$1.barnes-template')
    .replace(/(?<![\w-])\.owner-(rent|sale)-reference-ui/g,'.barnes-template.owner-$1-reference-ui')
    .split(/,(?![^()]*\))/).map(s=>s.trim().includes('.barnes-template')?s.trim():'.barnes-template '+s.trim()).join(', ');
}
function add(file,content) {
  if (fs.existsSync(path.join(libraryRoot,file))) throw Error('Refusing to overwrite '+file);
  patches.push('*** Add File: '+path.join(libraryRoot,file)+'\n'+content.trimEnd().split('\n').map(l=>'+'+l).join('\n'));
}
(async()=>{
  let browser;
  try {
    browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    await page.goto(pageUrl,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('#why-barnes');
    await page.waitForFunction(()=>document.querySelector('.owner-sale-services__text strong'));
    await page.locator('.owner-sale-hero__button').click();
    await page.waitForFunction(()=>document.querySelector('.feedback-modal__hero-image')?.src.includes('modal-ruslan-organic'));
    await page.evaluate(()=>document.fonts.ready);
    for (const [slug,title,selector] of definitions) {
      if (only && !only.split(',').includes(slug)) continue;
      if (!await page.locator(selector).count()) continue;
      const exported=await page.locator(selector).first().evaluate((root)=>{
        const nodes=[root,...root.querySelectorAll('*'),document.body,document.documentElement];
        const clean=root.cloneNode(true);
        const comments=document.createTreeWalker(clean,NodeFilter.SHOW_COMMENT); const remove=[]; while(comments.nextNode()) remove.push(comments.currentNode); remove.forEach(e=>e.remove());
        clean.querySelectorAll('[style]').forEach(e=>{e.style.removeProperty('transform');e.style.removeProperty('width');if(!e.getAttribute('style'))e.removeAttribute('style');});
        clean.querySelectorAll('[aria-hidden="true"]').forEach(e=>{if(e.classList.contains('splide__slide'))e.removeAttribute('aria-hidden');});
        clean.querySelectorAll('.splide__list').forEach(e=>e.style.removeProperty('transform'));
        clean.querySelectorAll('input').forEach(e=>{e.value='';e.removeAttribute('value');});
        clean.classList.remove('vfm--fixed','vfm--inset');
        function matches(selector) {
          const simplified=selector.replace(/::[\w-]+(?:\([^)]*\))?/g,'').replace(/:(hover|focus-visible|focus-within|focus|active|visited)\b/g,'');
          try{return nodes.some(e=>e.matches(simplified));}catch{return false;}
        }
        function rules(list,base) {
          const out=[];
          for(const r of list) {
            if(r.selectorText && matches(r.selectorText)) out.push({selector:r.selectorText,style:r.style.cssText,base});
            else if(r.type===CSSRule.FONT_FACE_RULE || r.type===CSSRule.KEYFRAMES_RULE)out.push({raw:r.cssText,base});
            else if(r.cssRules){const children=rules(r.cssRules,base);if(children.length)out.push({header:r.cssText.slice(0,r.cssText.indexOf('{')).trim(),children});}
          }
          return out;
        }
        const styles=[];for(const sheet of document.styleSheets){try{styles.push(...rules(sheet.cssRules,sheet.href||location.href));}catch{}}
        const vars={};const computed=getComputedStyle(document.body);for(const prop of computed)if(prop.startsWith('--'))vars[prop]=computed.getPropertyValue(prop).trim();
        return {html:clean.outerHTML,styles,vars};
      });
      function css(rules){return rules.map(r=>r.children?r.header+' {\n'+css(r.children)+'\n}':r.selector?scope(r.selector)+' { '+urls(r.style,r.base)+' }':urls(r.raw,r.base)).join('\n');}
      let html=exported.html.replace(/\b(src|poster)="([^"]+)"/g,(_,a,u)=>a+'="'+asset(u)+'"')
        .replace(/srcset="([^"]+)"/g,(_,set)=>'srcset="'+set.split(',').map(s=>{const [u,...rest]=s.trim().split(/\s+/);return asset(u)+' '+rest.join(' ');}).join(', ')+'"');
      html=urls(html,pageUrl);
      if(slug==='why-barnes')html=html.replace('<section id="why-barnes"','<section class="be-panorama-root" id="why-barnes"');
      let content=null;
      if(slug==='why-barnes'){
        const source=fs.readFileSync(path.join(sourceRoot,'shared/owner-panorama.js'),'utf8');
        const expr=source.match(/const reasons = (\[[\s\S]*?\]);\s*const content/)[1];
        content=Function('direction','return '+expr)(variant);
      }
      const settings=content?'<script type="application/json" data-block-content>'+JSON.stringify(content)+'</script>':'';
      const fragment='<div class="barnes-template owner-'+variant+'-reference-ui" data-barnes-block="'+slug+'" data-variant="'+variant+'">\n'+html+'\n'+settings+'\n</div>';
      const folder='blocks/'+slug+'/'+variant;
      const style=css(exported.styles)+'\n.barnes-template { '+Object.entries(exported.vars).map(([k,v])=>k+':'+v+';').join('')+' }\n';
      const preview='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>'+title+' — '+variant+' — BARNES library</title><link rel="stylesheet" href="../../_shared/base.css"><link rel="stylesheet" href="styles.css"></head><body><main>'+fragment+'</main><script type="module">import {initBlock} from "../../_shared/runtime.js";initBlock(document.querySelector("[data-barnes-block]"), {preview:true});</script></body></html>';
      add(folder+'/fragment.html',fragment);
      add(folder+'/styles.css',style);
      add(folder+'/index.html',preview.replace('<body>','<body data-barnes-preview>'));
      const manifest={id:slug,variant,title,version:'1.0.0',source:{repo:'daniilterekh-prog/barn-estate-homepage-clone',commit:sourceCommit,route,selector},files:['fragment.html','styles.css','index.html'],dependencies:['../../_shared/base.css','../../_shared/runtime.js','../../_assets/'],status:'extracted-reference',integration:'Copy fragment and stylesheet, preserve data-v attributes, include base tokens and call initBlock. Supply onRequest/onSubmit for production. Source page is not a dependency.'};
      add(folder+'/block.json',JSON.stringify(manifest,null,2));
      add(folder+'/README.md','# '+title+' — '+(variant==='rent'?'аренда':'продажа')+'\n\n[Визуальное превью](index.html) · [Разметка](fragment.html) · [Стили](styles.css) · [Метаданные](block.json)\n\nИзвлечено из утверждённой страницы, commit `'+sourceCommit+'`. Самостоятельный блок: исходная страница и Nuxt не нужны. Общие ресурсы находятся в `_shared` и `_assets`. Это версионный reference-шаблон, не автоматическая замена компонентов действующих страниц.\n\n## Перенос\n\n1. Скопируйте fragment.html и styles.css. Сохраните scope `.barnes-template`, классы и `data-v-*`, от которых зависят извлечённые стили.\n2. Подключите `_shared/base.css`, импортируйте `initBlock` из `_shared/runtime.js`.\n3. Исправьте относительные пути к ассетам и проверьте все ссылки, эксперта, тексты, якоря. При переносе внутрь SPA выполняйте initBlock после гидратации.\n4. Передайте `onRequest` для формы заявки и `onSubmit` для реальной отправки. Превью никогда не отправляет заявки.\n5. Если добавляете несколько блоков, initBlock уникализирует DOM-ID и ARIA-ссылки. Якоря навигации задавайте под структуру целевой страницы.\n6. Проверьте 390, 768, 1440, 1920 и 2560 px, клавиатуру, картинки и отсутствие конфликтов с CSS страницы.\n\n## Ограничения\n\nГлобальный хедер и футер требуют адаптации ссылок; sticky-navigation требует секций назначения. Галерея не является самостоятельной SEO-страницей. JS-анимация механики и slider — независимый адаптер, а не исходный Vue/Splide-код. Все финансовые обещания и контактные данные проверяйте перед публикацией.\n');
      manifests.push(manifest);
    }
    add('blocks/_exports/'+variant+(only?'-'+only:'')+'.json',JSON.stringify({sourceCommit,blocks:manifests,assets:[...assets.values()]},null,2));
    process.stdout.write('*** Begin Patch\n'+patches.join('\n')+'\n*** End Patch');
  } finally {await browser?.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
