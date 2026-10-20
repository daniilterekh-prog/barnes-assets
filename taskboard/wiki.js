import {icon} from './icons.js?v=20261019-gateway';
import {safeHttps,pageTaskModel,SITE_TASKS_ID,SITE_TASKS_TITLE} from './domain.js?v=20261019-site-categories';
const node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text!==undefined)e.textContent=text;return e;};
function renderPageLinks(container,page,{general=false}={}){
  const nav=node('nav','wiki-quick-links');nav.setAttribute('aria-label',general?'Сайт и GitHub':'Ссылки страницы: '+page.title);
  const links=[['front_url','Фронт','arrow-up-right'],['live_url','Живой сайт','arrow-up-right'],['preview_url','Референс Даниил GitHub','arrow-up-right'],['github_url',general?'Репозиторий GitHub':'Папка GitHub','folder'],['source_file_url','HTML','code-xml'],['blocks_url','Блоки','blocks']];
  const data=general?{...page,github_url:'https://github.com/daniilterekh-prog/barnes-sites',source_file_url:'',blocks_url:'https://github.com/daniilterekh-prog/barnes-assets/tree/main/blocks'}:page;
  for(const [key,label,symbol] of links){
    const href=safeHttps(data[key]);if(!href&&['source_file_url','blocks_url'].includes(key))continue;
    const link=node(href?'a':'span','wiki-quick-link'+(href?'':' is-missing'));link.append(icon(symbol),node('span','',label));
    if(href){link.href=href;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',label+': '+(general?'весь сайт':page.title));}
    else link.append(node('small','','Ссылка не указана'));
    const versionKey={front_url:'front_version',live_url:'live_version',preview_url:'preview_version'}[key];if(versionKey&&data[versionKey])link.append(node('small','',data[versionKey]));nav.append(link);
  }
  container.append(nav);
}
export function renderWiki(container,{pages,sections=[],tasks,query,selectedPage,taskScope,taskStatus,me,onSelect,onScope,onStatus,onEdit,onTask,renderTask}) {
  container.replaceChildren();
  const realPages=pages;pages=[{id:SITE_TASKS_ID,title:SITE_TASKS_TITLE,front_url:'',live_url:'',github_url:''},...pages];
  const visible=pages.filter(p=>(p.title+' '+p.front_url+' '+p.live_url+' '+p.github_url).toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')));
  if(!selectedPage&&!visible.length){container.append(node('p','empty','Страницы не найдены'));return;}
  const selected=pages.find(p=>p.id===selectedPage);
  if(!selected){
    renderPageLinks(container,realPages.find(p=>p.id==='home')||{title:'Сайт'},{general:true});
    const grid=node('div','wiki-page-choices');grid.setAttribute('role','group');grid.setAttribute('aria-label','Выбери раздел сайта');
    visible.forEach(p=>{const button=node('button','wiki-page-choice',p.title);button.type='button';button.dataset.pageChoice=p.id;button.append(icon('arrow-up-right'));button.onclick=()=>onSelect(p.id);grid.append(button);});container.append(grid);return;
  }
  const p=selected,back=node('button','filter-button wiki-back','Все разделы');back.type='button';back.onclick=()=>onSelect(null);container.append(back);
    const card=node('article','wiki-card');card.dataset.page=p.id;
    const header=node('div','wiki-heading'),title=node('h2','',p.title),edit=node('button','wiki-edit','Изменить');
    edit.prepend(icon('pencil'));edit.type='button';edit.setAttribute('aria-label','Изменить страницу: '+p.title);edit.onclick=()=>onEdit(p);header.append(title);if(p.id!==SITE_TASKS_ID)header.append(edit);card.append(header);
    title.id='wiki-page-title';title.tabIndex=-1;
    renderPageLinks(card,p.id===SITE_TASKS_ID?(realPages.find(p=>p.id==='home')||{title:'Сайт'}):p,{general:p.id===SITE_TASKS_ID});
    const model=pageTaskModel(tasks,p.id,me,taskScope,taskStatus,realPages,sections);
    const controls=node('div','wiki-task-actions'),add=node('button','primary','Добавить задачу');add.prepend(icon('plus'));add.id='wiki-task-add';add.type='button';add.setAttribute('aria-label',p.id===SITE_TASKS_ID?'Добавить задачу по сайту':'Добавить задачу к странице: '+p.title);add.onclick=()=>onTask(p.id===SITE_TASKS_ID?null:p.id);controls.append(add);card.append(controls);
    const taskArea=node('section','wiki-page-tasks');taskArea.setAttribute('aria-label','Задачи страницы: '+p.title);if(p.id!==SITE_TASKS_ID)taskArea.append(node('h3','wiki-tasks-title','Задачи страницы'));
    const modes=node('div','wiki-task-scopes');modes.setAttribute('role','group');modes.setAttribute('aria-label','Чьи задачи показать');
    const labels={mine:'На мне',assigned:'Я поставил',all:'Все'};
    model.modes.forEach(({id,count})=>{const button=node('button','filter-button',labels[id]);button.type='button';button.dataset.wikiScope=id;button.setAttribute('aria-pressed',String(taskScope===id));button.append(node('span','',String(count)));button.onclick=()=>onScope(id);modes.append(button);});taskArea.append(modes);
    const filters=node('div','wiki-task-filters'),label=node('label','','Статус'),select=node('select','');label.htmlFor='wiki-task-status';select.id='wiki-task-status';
    [['open','Открытые'],['all','Все статусы'],['unmarked','Не отмечено'],['progress','В работе'],['done','Сделано'],['obsolete','Не актуально']].forEach(([value,text])=>{const option=node('option','',text);option.value=value;select.append(option);});select.value=taskStatus;select.onchange=()=>onStatus(select.value);filters.append(label,select);taskArea.append(filters);
    const progress=node('p','muted',`${model.counts.done} из ${model.counts.total} выполнено`);taskArea.append(progress);
    const list=node('div','wiki-task-list');
    if(!model.rows.length)list.append(node('p','muted',taskScope==='mine'?'На тебе нет задач этой страницы по выбранному статусу.':taskScope==='assigned'?'Твоих поручений по этой странице и статусу пока нет.':'Задач этой страницы по выбранному статусу нет.'));
    model.rows.forEach(t=>list.append(renderTask(t,{level:4,showOwner:true})));taskArea.append(list);card.append(taskArea);container.append(card);
}
