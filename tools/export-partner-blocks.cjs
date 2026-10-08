/* Render the approved page, extract scoped references, apply text via apply_patch.
 * Binary assets are copied once by content hash. No source files are changed. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),vm=require('vm');
const {chromium}=require('playwright');
const sourceRoot=path.resolve(process.env.SOURCE_ROOT||'/tmp/barnes-experts-integration');
const libraryRoot=path.resolve(__dirname,'..');
const origin=process.env.SOURCE_ORIGIN||'http://127.0.0.1:4183';
const pageUrl=origin+'/for-partners/';
const sourceCommit=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:sourceRoot,encoding:'utf8'}).trim();
const definitions=[
 ['header','Главный хедер','.layout__header,.site-menu','Навигация, контакты и мобильное меню'],
 ['sticky-nav','Второй хедер','.owner-sale-sticky','Якоря после hero и контакты'],
 ['hero','Первый экран','.ambassadors-hero','Фоновое фото, хлебные крошки и две кнопки'],
 ['conditions','Условия сотрудничества','#conditions','Три фотокарточки с hover/tap-описанием'],
 ['mechanics','Механика партнёрства','#how-it-works','Текстовые этапы со scroll-анимацией'],
 ['directions','Направления BARNES','#requests','Семь категорий, фото и показатели без скачков'],
 ['advantages','Преимущества партнёрства','#advantages','Десять фотокарточек, свайп и раскрытие описаний'],
 ['consultation-expert','Контактный CTA','.catalog-contact','Форма на фото, компактные каналы и эксперт справа'],
 ['faq','Вопросы и ответы','.catalog-faq','Доступный аккордеон'],
 ['newsletter','Подписка','.newsletter-cta','Редакционный CTA с обложками журнала'],
 ['footer','Футер','.site-footer','Разделы сайта, адрес и контакты'],
 ['floating-expert','Плавающий эксперт','.floating-expert','Карточка эксперта справа снизу'],
 ['request-modal','Всплывающая форма','.feedback-modal','Модальная заявка с выбранным направлением']
];
const files=new Map(),assets=new Map();
function add(file,content){files.set(file,content.trimEnd()+'\n');}
function asset(url,base=pageUrl){
 if(!url||/^(data:|#|mailto:|tel:)/.test(url))return url;
 const u=new URL(url,base);if(u.origin!==origin)return u.href;
 const relative=decodeURIComponent(u.pathname).replace(/^\//,'');
 const file=path.resolve(sourceRoot,relative);
 if(!file.startsWith(sourceRoot+path.sep)||!fs.existsSync(file))throw Error('Missing local asset '+file);
 const bytes=fs.readFileSync(file),name=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12)+'-'+path.basename(file);
 const dest=path.join(libraryRoot,'blocks/_assets/partners',name);
 fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest))fs.copyFileSync(file,dest);
 assets.set(name,{source:relative,file:name,bytes:bytes.length});return '../../_assets/partners/'+name;
}
function urls(css,base){return css.replace(/url\((['"]?)(.*?)\1\)/g,(_,q,u)=>'url("'+asset(u,base)+'")');}
function scope(s){
 s=s.replace(/:root\b/g,'.barnes-template').replace(/\b(?:html|body)\b/g,'.barnes-template')
  .replace(/\.partners-owner-shell/g,'.barnes-template.partners-owner-shell')
  .replace(/#([\w-]+)/g,':is([data-source-id="$1"],#barnes-library-specificity-$1)');
 // Keep original ID specificity without requiring duplicate DOM IDs. Split only top-level commas.
 const groups=[];let depth=0,quote=null,start=0;for(let i=0;i<s.length;i++){const c=s[i];if(quote){if(c===quote&&s[i-1]!=='\\')quote=null;}else if(c==='"'||c==="'")quote=c;else if(c==='('||c==='[')depth++;else if(c===')'||c===']')depth--;else if(c===','&&depth===0){groups.push(s.slice(start,i));start=i+1;}}groups.push(s.slice(start));
 return groups.map(v=>v.trim().includes('.barnes-template')?v.trim():'.barnes-template '+v.trim()).join(', ');
}
function renderCSS(rs){return rs.map(r=>r.children?r.header+' {\n'+renderCSS(r.children)+'\n}':r.selector?scope(r.selector)+' { '+urls(r.style,r.base)+' }':urls(r.raw,r.base)).join('\n');}
function patch(){let out='*** Begin Patch\n';for(const [file,content]of files){const full=path.join(libraryRoot,file);if(fs.existsSync(full)){const old=fs.readFileSync(full,'utf8');if(old===content)continue;out+='*** Update File: '+full+'\n@@\n'+old.trimEnd().split('\n').map(l=>'-'+l).join('\n')+'\n'+content.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n';}else out+='*** Add File: '+full+'\n'+content.trimEnd().split('\n').map(l=>'+'+l).join('\n')+'\n';}return out+'*** End Patch\n';}
(async()=>{
 cp.execFileSync('git',['diff','--exit-code','--','for-partners'],{cwd:sourceRoot});
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1000}});
  await p.goto(pageUrl,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  await p.locator('.ambassadors-hero__button--primary').click();await p.locator('.feedback-modal').waitFor();
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(sourceRoot,'for-partners/assets/directions/directions-data.js'),'utf8'),context);
  const fonts=new Map(),manifests=[];
  for(const [slug,title,selector,description] of definitions){
   const exported=await p.evaluate(({selector,slug})=>{
    const variants=[];
    if(slug==='directions'){
     const buttons=[...document.querySelectorAll('.bd-navbtn')];
     for(const button of buttons){button.click();const sample=document.querySelector(selector).cloneNode(true);variants.push(sample,...sample.querySelectorAll('*'));}
     buttons[0].click();
    }
    const roots=[...document.querySelectorAll(selector)];if(!roots.length)throw Error('Missing '+selector);
    const nodes=[...variants,...roots.flatMap(r=>[r,...r.querySelectorAll('*')])];for(const root of roots){let parent=root.parentElement;while(parent){nodes.push(parent);parent=parent.parentElement;}}
    const html=roots.map(root=>{const clean=root.cloneNode(true);const walker=document.createTreeWalker(clean,NodeFilter.SHOW_COMMENT),remove=[];while(walker.nextNode())remove.push(walker.currentNode);remove.forEach(n=>n.remove());
     [clean,...clean.querySelectorAll('[id]')].forEach(e=>{if(e.id)e.dataset.sourceId=e.id;});
     clean.querySelectorAll('[data-initialized]').forEach(e=>e.removeAttribute('data-initialized'));
     clean.querySelectorAll('[style]').forEach(e=>{['transform','transition','width','--partners-stages-last-offset'].forEach(k=>e.style.removeProperty(k));if(!e.getAttribute('style'))e.removeAttribute('style');});
     clean.querySelectorAll('input').forEach(e=>{e.removeAttribute('value');e.value='';});
     clean.querySelectorAll('.is-revealed').forEach(e=>e.classList.remove('is-revealed'));
     clean.querySelectorAll('.splide__slide').forEach(e=>e.removeAttribute('aria-hidden'));
     clean.classList.remove('is-open','owner-sale-stages--scroll-ready');if(slug==='request-modal'){clean.setAttribute('aria-hidden','true');clean.hidden=true;}
     if(slug==='sticky-nav'){clean.removeAttribute('inert');clean.removeAttribute('aria-hidden');clean.classList.add('owner-sale-sticky--visible');}
     return clean.outerHTML;
    }).join('\n');
    function matches(s){s=s.replace(/::[\w-]+(?:\([^)]*\))?/g,'').replace(/:(hover|focus-visible|focus-within|focus|active|visited)\b/g,'').replace(/\.is-(open|revealed|active|past|visible|dragging)/g,'').replace(/(\.site-header)--(scrolled|menu-open)/g,'$1');try{return nodes.some(e=>e.matches(s));}catch{return false;}}
    function rules(list,base){const result=[];for(const r of list){if(r.type===CSSRule.FONT_FACE_RULE)result.push({font:r.cssText,base});else if(r.type===CSSRule.KEYFRAMES_RULE)result.push({raw:r.cssText,base});else if(r.selectorText&&matches(r.selectorText))result.push({selector:r.selectorText,style:r.style.cssText,base});else if(r.cssRules){const children=rules(r.cssRules,base);if(children.length)result.push({header:r.cssText.slice(0,r.cssText.indexOf('{')).trim(),children});}}return result;}
    const styles=[];for(const sheet of document.styleSheets){try{styles.push(...rules(sheet.cssRules,sheet.href||location.href));}catch(e){throw Error('Cannot read stylesheet '+sheet.href);}}
    return {html,styles,pageAttributes:[...document.querySelector('.ambassadors-page').attributes].filter(a=>a.name.startsWith('data-v-')).map(a=>a.name+'=""').join(' ')};
   },{selector,slug});
   function stripFonts(rs){return rs.flatMap(r=>{if(r.font){const text=urls(r.font,r.base);fonts.set(text,text);return [];}if(r.children)return[{...r,children:stripFonts(r.children)}];return[r];});}
   let html=exported.html.replace(/\b(src|poster)="([^"]+)"/g,(_,a,u)=>a+'="'+asset(u)+'"').replace(/srcset="([^"]+)"/g,(_,set)=>'srcset="'+set.split(',').map(item=>{const[u,...rest]=item.trim().split(/\s+/);return asset(u)+' '+rest.join(' ');}).join(', ')+'"');
   html=urls(html,pageUrl).replace(/href="(\/[^\"]*)"/g,(_,href)=>'href="https://daniilterekh-prog.github.io/barn-estate-homepage-clone'+href+'"');
   const data=slug==='directions'?'<script type="application/json" data-block-content>'+JSON.stringify(context.window.BarnesDirectionsData.map(d=>({...d,image:asset('assets/directions/'+d.image)})))+'</script>':'';
   const fragment='<div class="barnes-template partners-owner-shell" data-barnes-block="'+slug+'" data-variant="partners"><div class="page ambassadors-page" '+exported.pageAttributes+'>\n'+html+'\n</div>'+data+'</div>';
   const folder='blocks/'+slug+'/partners';
   const adapter=slug==='conditions'?'\n/* Grid item must not transfer its aspect-ratio into the minimum inline size outside the page shell. */\n.barnes-template[data-barnes-block="conditions"] .ambassadors-conditions__card { min-width:0; width:100%; }\n@media(max-width:768px){.barnes-template[data-barnes-block="conditions"] .ambassadors-conditions__grid { grid-template-columns:minmax(0,1fr); }}':'';
   let css=renderCSS(stripFonts(exported.styles))+adapter;
   const keyframes=[...css.matchAll(/@keyframes\s+([\w-]+)/g)].map(m=>m[1]);
   for(const name of new Set(keyframes))css=css.replace(new RegExp('(?<![\\w-])'+name+'(?![\\w-])','g'),'barnes-partners-'+slug+'-'+name);
   add(folder+'/fragment.html',fragment);add(folder+'/styles.css',css.replace(/[ \t]+$/gm,''));
   add(folder+'/index.html','<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+title+' — BARNES blocks</title><style>body{margin:0}</style><link rel="stylesheet" href="../../_shared/partners/base.css"><link rel="stylesheet" href="styles.css"></head><body>'+fragment+'<script type="module">import {initBlock} from "../../_shared/partners/runtime.js";const api=initBlock(document.querySelector("[data-barnes-block]"),{preview:true});'+(slug==='request-modal'?'api.open();':'')+'</script></body></html>');
   const manifest={id:slug,variant:'partners',title,description,version:'1.0.0',status:'extracted-reference',source:{repo:'daniilterekh-prog/barn-estate-homepage-clone',commit:sourceCommit,route:'for-partners',selector},files:['fragment.html','styles.css','index.html','README.md'],dependencies:['../../_shared/partners/base.css','../../_shared/partners/runtime.js','../../_assets/partners/'],content:slug==='directions'?'data-block-content: семь направлений; не подтверждает актуальность цен и комиссий':'Редактируемые тексты и ссылки в fragment.html',integration:'initBlock(root,{onRequest,onSubmit}); no Nuxt or source-page dependency'};
   add(folder+'/block.json',JSON.stringify(manifest,null,2));manifests.push(manifest);
   add(folder+'/README.md','# '+title+' — амбассадоры\n\n'+description+'.\n\n[Превью](index.html) · [HTML](fragment.html) · [CSS](styles.css) · [Паспорт](block.json) · [Общая инструкция](../../partners/README.md)\n\nИсточник: /for-partners/, commit `'+sourceCommit+'`. Версионный эталон, не автоматическая замена блоков действующих страниц.\n\nСкопируйте фрагмент, стили и зависимости из block.json. Сохраните классы, data-v-*, data-source-id и scope `.barnes-template`. Вызывайте initBlock после вставки в DOM. Меняйте контент, изображения и ссылки под новую страницу; данные клиентов не должны быть зашиты в шаблон.\n\n'+(slug==='directions'?'Все семь направлений находятся в JSON `data-block-content`; цены/комиссии необходимо подтвердить перед публикацией. Картинки — иллюстрации.\n':'')+(slug==='hero'?'H1 допустим только один на целевой странице. Хлебные крошки и URL адаптировать.\n':'')+(slug==='sticky-nav'?'В production передайте options.hero и переназначьте href якорей на секции целевой страницы. Превью показывает хедер постоянно.\n':'')+(slug==='header'||slug==='footer'?'Глобальные ссылки, телефоны, меню и логотип проверьте для целевого сайта.\n':'')+'\nФормы и кнопки не отправляют данные сами. Передайте onRequest/onSubmit и подключите backend. Preview запрещает отправку. Блоки request-modal/floating-expert фиксируются поверх страницы по своему назначению. При вставке нескольких экземпляров ID/ARIA уникализируются; CSS опирается на data-source-id.\n');
  }
add('blocks/_shared/partners/base.css',[...fonts.values()].join('\n')+'\n.barnes-template{font-family:"Tilda Sans",sans-serif;color:#1e1e1e;position:relative;max-width:100%;--accent:#8b1d25}.barnes-template *{box-sizing:border-box}.barnes-template [hidden]{display:none!important}.barnes-template button{cursor:pointer}.barnes-template [data-source-id="requests"]{scroll-margin-top:112px}.barnes-template.is-preview[data-barnes-block="header"]{background:#262626;min-height:210px}.barnes-template.is-preview[data-barnes-block="header"] .layout__header{position:relative!important}.barnes-template.is-preview[data-barnes-block="sticky-nav"] .owner-sale-sticky{position:relative!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:none!important}.barnes-template .barnes-preview-note{padding:16px;background:#fff;color:#1e1e1e;border:1px solid #8b1d25;font:400 16px/22.4px "Tilda Sans",sans-serif}.barnes-template :is(button,a,input,textarea,select):focus-visible{outline:2px solid #8b1d25;outline-offset:3px}');
  add('blocks/partners/catalog.json',JSON.stringify({version:'1.0.0',sourceCommit,blocks:manifests,assets:[...assets.values()]},null,2));
  add('blocks/partners/index.html','<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Блоки BARNES — амбассадоры</title><style>body{font:18px/1.5 sans-serif;margin:40px;color:#1e1e1e}h1{font-weight:300}ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;padding:0;list-style:none}li{border:1px solid #ddd;padding:24px}a{color:#8b1d25}small{display:block}</style></head><body><h1>Библиотека блоков BARNES / Амбассадоры</h1><p>13 самостоятельных reference-шаблонов. <a href="README.md">Инструкция</a> · <a href="../../ui-kit/partners.md">Дополнение UI-кита</a></p><ul>'+manifests.map(m=>'<li><a href="../'+m.id+'/partners/">'+m.title+'</a><small>'+m.description+'</small><a href="../'+m.id+'/partners/fragment.html">HTML</a> · <a href="../'+m.id+'/partners/styles.css">CSS</a> · <a href="../'+m.id+'/partners/README.md">Перенос</a></li>').join('')+'</ul></body></html>');
  const src=fs.readFileSync(path.join(sourceRoot,'for-partners/for-partners.js'),'utf8');
  const carousel=src.slice(src.indexOf('  var advantages = document.querySelector'),src.indexOf('\n  document.querySelectorAll(\'.catalog-contact__form, .newsletter-form\')'))
   .replaceAll('document.querySelector','root.querySelector').replace("description.id = 'advantage-description-' + index;","description.id = uid + '-advantage-description-' + index;")
   .replace(/window.addEventListener\('resize', function \(\) \{ updateAdvantages\(false\); \}, \{ passive: true \}\);/,'window.addEventListener(\'resize\', function () { updateAdvantages(false); }, { passive: true, signal });');
  add('blocks/_shared/partners/carousel.js','export function initCarousel(root,uid,signal){\n'+carousel+'\n}');
  const mechanics=src.slice(src.indexOf('  var stagesScrollFrame = null;'),src.indexOf('\n  var sliderStyle = document.createElement'))
   .replaceAll("page.querySelector('#how-it-works')","root.querySelector('[data-source-id="+'"how-it-works"'+"]')")
   .replace('{ passive: true }','{ passive: true, signal }').replace('{ once: true }','{ once: true, signal }');
  add('blocks/_shared/partners/mechanics.js','export function initMechanics(root,signal){\n'+mechanics+'\n}');
  let dirs=fs.readFileSync(path.join(sourceRoot,'for-partners/assets/directions/directions.js'),'utf8').replace('(function () {','export function initDirections(scope) {').replace(/\}\)\(\);\s*$/,'}').replace('document.getElementById("barnes-directions")','scope.querySelector(\'[data-source-id="barnes-directions"]\')').replace('window.BarnesDirectionsData','JSON.parse(scope.querySelector("[data-block-content]").textContent)').replace('assetBase + d.image','d.image');
  add('blocks/_shared/partners/directions.js',dirs);
  const out=patch();if(process.argv.includes('--apply')){const r=cp.spawnSync('apply_patch',[],{input:out,encoding:'utf8',maxBuffer:5e6});if(r.status!==0)throw Error(r.stderr||r.stdout);console.log('Exported '+manifests.length+' blocks / '+assets.size+' local assets / '+sourceCommit);}else process.stdout.write(out);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
