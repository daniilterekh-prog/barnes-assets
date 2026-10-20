const node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text!==undefined)e.textContent=text;return e;};
export function setupNotifications({api,getSession,getBoard,acceptBoard,member,displayDate,toast,onUnauthorized,onOpenTask}){
  const button=document.getElementById('notifications-open'),count=document.getElementById('notifications-count'),dialog=document.getElementById('notifications-dialog'),list=document.getElementById('notifications-list'),all=document.getElementById('notifications-read-all'),error=document.getElementById('notifications-error');
  let busy=false,seen=null,signature='';
  const label=n=>n.kind==='review_returned'?'Задачу вернули с замечаниями':'Задача ждёт твоей проверки';
  button.onclick=()=>{error.textContent='';render();dialog.showModal();document.getElementById('notifications-title').focus();};
  document.getElementById('notifications-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>button.focus({preventScroll:true}));
  async function read(body,taskId=null){
    if(busy)return;const token=getSession()?.token;busy=true;error.textContent='';render();
    try{const data=await api('notification_read',body);if(getSession()?.token!==token)return;acceptBoard(data);if(taskId){dialog.close();onOpenTask(taskId);}}
    catch(e){if(getSession()?.token!==token)return;if(e.status===401){onUnauthorized(e.message);return;}error.textContent=e.message;}
    finally{busy=false;if(getSession()?.token===token)render();}
  }
  all.onclick=()=>{const items=getBoard()?.notifications?.items||[];const max=Math.max(0,...items.map(n=>Number(n.id)));if(max)read({through_id:max});};
  function render(){
    const inbox=getBoard()?.notifications||{items:[],unread:0},items=inbox.items||[],unread=Number(inbox.unread)||0;
    count.textContent=unread>99?'99+':String(unread);count.hidden=!unread;button.classList.toggle('has-unread',unread>0);button.setAttribute('aria-label','Уведомления: '+unread+' непрочитанных');
    const newest=Math.max(0,...items.map(n=>Number(n.id)));
    if(seen!==null&&newest>seen){const fresh=items.filter(n=>Number(n.id)>seen&&!n.read_at);if(fresh.length)toast(fresh.length===1?label(fresh[0])+': '+fresh[0].title:'Новых уведомлений: '+fresh.length);}
    seen=Math.max(seen??0,newest);all.disabled=busy||!unread;
    const next=JSON.stringify(inbox)+':'+busy;if(next===signature)return;signature=next;
    const focused=document.activeElement?.dataset?.notification,top=list.scrollTop;list.replaceChildren();
    if(!items.length)list.append(node('p','muted','Пока нет уведомлений. Здесь появятся задачи на проверку и возвраты с замечаниями.'));
    items.forEach(n=>{
      const row=node('article','notification-item'+(!n.read_at?' is-unread':''));
      row.append(node('strong','notification-kind',label(n)),node('p','notification-meta',member(n.actor).name+' · '+displayDate(n.created_at)+(!n.read_at?' · Новое':'')));
      if(n.reason)row.append(node('p','notification-reason',n.reason));
      const open=node('button','notification-task',n.title);open.type='button';open.dataset.notification=String(n.id);open.disabled=busy;open.setAttribute('aria-label','Открыть задачу: '+n.title);open.onclick=()=>{if(n.read_at){dialog.close();onOpenTask(n.task_id);}else read({id:Number(n.id)},n.task_id);};row.append(open);list.append(row);
    });list.scrollTop=top;if(focused)list.querySelector('[data-notification="'+CSS.escape(focused)+'"]')?.focus({preventScroll:true});
  }
  return {render,reset(){seen=null;signature='';busy=false;error.textContent='';dialog.close();list.replaceChildren();count.textContent='0';count.hidden=true;}};
}
