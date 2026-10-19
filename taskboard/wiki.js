import {icon} from './icons.js?v=20261019-gateway';
import {safeHttps} from './domain.js?v=20261019-gateway';
const node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text!==undefined)e.textContent=text;return e;};
export function renderWiki(container,{pages,tasks,query,openPages,onToggle,onEdit,onTask,renderTask}) {
  container.replaceChildren();
  const visible=pages.filter(p=>(p.title+' '+p.front_url+' '+p.live_url+' '+p.github_url).toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')));
  if(!visible.length){container.append(node('p','empty','Страницы не найдены'));return;}
  visible.forEach(p=>{
    const card=node('article','wiki-card');card.dataset.page=p.id;
    const header=node('div','wiki-heading'),title=node('h2','',p.title),edit=node('button','wiki-edit','Изменить');
    edit.prepend(icon('pencil'));edit.type='button';edit.setAttribute('aria-label','Изменить страницу: '+p.title);edit.onclick=()=>onEdit(p);header.append(title,edit);card.append(header);
    const versions=node('div','version-grid');
    [['front','Фронт'],['live','Живой сайт'],['preview','Референс Даниил GitHub']].forEach(([key,label])=>{
      const box=node('div','version-cell');box.append(node('span','version-label',label));
      const href=safeHttps(p[key+'_url']);
      if(href){const a=node('a','version-link','Открыть');a.append(icon('arrow-up-right'));a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',label+': '+p.title);box.append(a);}
      else box.append(node('span','version-missing','Ссылка не указана'));
      if(p[key+'_version'])box.append(node('span','version-ref',p[key+'_version']));versions.append(box);
    });card.append(versions);
    const sources=node('div','wiki-sources');
    [['github_url','Папка страницы'],['source_file_url','HTML'],['blocks_url','Блоки']].forEach(([key,label])=>{
      const href=safeHttps(p[key]);if(!href)return;const a=node('a','wiki-source',label);a.prepend(icon({github_url:'folder',source_file_url:'code-xml',blocks_url:'blocks'}[key]));a.append(icon('arrow-up-right'));a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',label+': '+p.title);sources.append(a);
    });card.append(sources);
    const linked=tasks.filter(t=>(t.page_ids||[]).includes(p.id));
    const controls=node('div','wiki-task-actions'),add=node('button','filter-button','Добавить задачу');add.prepend(icon('plus'));add.type='button';add.setAttribute('aria-label','Добавить задачу к странице: '+p.title);add.onclick=()=>onTask(p.id);
    const details=node('details','wiki-linked');details.open=openPages.has(p.id);const summary=node('summary','',`Открытые задачи · ${linked.length}`);summary.prepend(icon('list-todo'));details.append(summary);
    details.addEventListener('toggle',()=>{if(details.isConnected)onToggle(p.id,details.open);});
    const list=node('div','wiki-task-list');if(!linked.length)list.append(node('p','muted','Связанных задач пока нет'));
    linked.forEach(t=>list.append(renderTask(t,{level:3,showOwner:true})));details.append(list);controls.append(add);card.append(controls,details);container.append(card);
  });
}
