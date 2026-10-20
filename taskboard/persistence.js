export const SESSION_KEY='barn-taskboard-session-v1';
const prefix='barn-taskboard-view-v1:';
export function createPersistence(local,tab){
  const get=(store,key)=>{try{return JSON.parse(store?.getItem(key)||'null');}catch{return null;}};
  const set=(store,key,value)=>{try{const json=JSON.stringify(value);if(store?.getItem(key)!==json)store?.setItem(key,json);}catch{}};
  const remove=(store,key)=>{try{store?.removeItem(key);}catch{}};
  const validSession=s=>s&&typeof s.token==='string'&&s.token.length>0&&s.token.length<1024&&typeof s.member==='string'&&Number.isFinite(s.expires_at)&&s.expires_at>Date.now()/1000;
  return {
    readSession(){for(const store of [local,tab]){const saved=get(store,SESSION_KEY);if(validSession(saved))return saved;}return null;},
    storeSession(session){set(local,SESSION_KEY,session);set(tab,SESSION_KEY,session);},
    clearSession(token){for(const store of [local,tab]){const current=get(store,SESSION_KEY);if(!token||!current||current.token===token)remove(store,SESSION_KEY);}},
    readView(member){return get(tab,prefix+member)||get(local,prefix+member);},
    writeView(member,view){const snapshot={...view,version:1,member};set(tab,prefix+member,snapshot);set(local,prefix+member,snapshot);},
    clearView(member){remove(tab,prefix+member);remove(local,prefix+member);}
  };
}
export function normalizeView(raw,board,me){
  if(!raw||raw.version!==1||raw.member!==me||!['board','gateway'].includes(raw.screen))return null;
  const choice=(value,allowed,fallback)=>allowed.includes(value)?value:fallback;
  const text=value=>typeof value==='string'?value.slice(0,200):'';
  const ids=(board.members||[]).map(m=>m.id),pages=(board.pages||[]).map(p=>p.id),sections=(board.spec_sections||[]).map(s=>s.tab_id),tasks=(board.tasks||[]).map(t=>t.id);
  const unique=(value,allowed)=>(Array.isArray(value)?[...new Set(value)].filter(id=>allowed.includes(id)):[]).slice(0,1000);
  const statuses=['open','all','unmarked','progress','review','done','obsolete'];
  const mineOrigin=choice(raw.mineOrigin,['spec','telegram','other'],null);
  let mineBrowse=null;
  if(['spec','other'].includes(mineOrigin)&&raw.mineBrowse){const c=raw.mineBrowse;if(c.kind==='page'&&[...pages,'none','site-wide'].includes(c.id)||c.kind==='section'&&[...sections,'outside'].includes(c.id))mineBrowse={kind:c.kind,id:c.id};}
  return {
    screen:raw.screen,view:choice(raw.view,['tasks','pages','review'],'tasks'),scope:choice(raw.scope,['mine','assigned'],'mine'),
    owner:choice(raw.owner,['all','unassigned',...ids],'all'),creator:choice(raw.creator,['all','unknown',...ids],'all'),questionsTo:null,
    query:text(raw.query),pageQuery:text(raw.pageQuery),status:choice(raw.status,statuses,'open'),deadline:choice(raw.deadline,['all','overdue','today','week','none'],'all'),urgent:raw.urgent===true,
    mineOrigin,mineBrowse,selectedTask:tasks.includes(raw.selectedTask)?raw.selectedTask:null,selectedPage:[...pages,'site-wide'].includes(raw.selectedPage)?raw.selectedPage:null,wikiScope:choice(raw.wikiScope,['mine','assigned','all'],'mine'),wikiStatus:choice(raw.wikiStatus,statuses,'open'),wikiSource:choice(raw.wikiSource,['other','spec'],'other'),
    expanded:unique(raw.expanded,['spec','telegram']),specExpanded:unique(raw.specExpanded,['general',...pages.map(id=>'page:'+id),...sections.map(id=>'source:'+id)]),detailsExpanded:unique(raw.detailsExpanded,tasks),
    scrollY:typeof raw.scrollY==='number'&&Number.isFinite(raw.scrollY)?Math.max(0,Math.min(raw.scrollY,1000000)):0
  };
}
