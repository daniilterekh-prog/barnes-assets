import {icon} from './icons.js?v=20261019-gateway';
const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
const format=new Intl.DateTimeFormat('ru',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Moscow'});
export function setupDiscussion({api,getSession,getBoard,acceptBoard,member,toast,onUnauthorized}){
  let taskId=null,messages=[],revision=-1,hasMore=false,busy=false,loading=false,epoch=0,replyTo=null,requestId=null;
  const drafts=new Map(),dialog=$('discussion-dialog'),form=$('discussion-form');
  function task(){return getBoard()?.tasks.find(t=>t.id===taskId);}
  function saveDraft(){if(taskId)drafts.set(taskId,{text:$('discussion-text').value,kind:$('discussion-kind').value,recipient:$('discussion-recipient').value,replyTo,requestId});}
  function setBusy(value){busy=value;form.querySelectorAll('button,input,select,textarea').forEach(e=>e.disabled=value);$('discussion-close').disabled=value;}
  function mode(){
    const kind=$('discussion-kind').value;$('discussion-recipient-field').hidden=kind!=='question';
    if(kind!=='comment')replyTo=null;
    $('discussion-reply').hidden=!replyTo;
    if(replyTo)$('discussion-reply-label').textContent='Ответ: '+member(replyTo.actor).name+' — '+replyTo.text.slice(0,100);
    $('discussion-submit').textContent=kind==='completion'?'Сохранить и на проверку':'Отправить';
    $('discussion-submit').prepend(icon(kind==='completion'?'check':'send'));
    $('discussion-text-label').textContent=kind==='question'?'Вопрос':kind==='completion'?'Что сделано':'Сообщение';
  }
  function render(){
    const list=$('discussion-messages'),scroll=$('discussion-scroll'),atBottom=scroll.scrollHeight-scroll.scrollTop-scroll.clientHeight<80,oldTop=scroll.scrollTop;
    list.replaceChildren();
    if(!messages.length)list.append(node('p','muted','Пока нет сообщений. Здесь можно обсудить задачу или задать вопрос.'));
    messages.forEach(m=>{
      const article=node('article','discussion-message'+(m.kind==='question'?' question':'')+(m.resolved_at?' resolved':''));article.dataset.comment=m.id;
      const meta=node('div','discussion-meta');meta.append(node('strong','',member(m.actor).name),node('time','',format.format(new Date(m.created_at))+' мск'));
      if(m.kind==='completion')meta.append(node('span','message-kind','Отчёт о выполнении'));
      if(m.kind==='question')meta.append(node('span','message-kind','Вопрос → '+(m.recipient?member(m.recipient).name:'всем')));
      if(m.reply_to)article.append(node('blockquote','reply-quote',member(m.reply_actor).name+': '+m.reply_text));
      article.prepend(meta);article.append(node('p','message-text',m.text));
      if(m.kind==='question'){
        const controls=node('div','message-actions'),answer=node('button','filter-button','Ответить');answer.type='button';answer.prepend(icon('corner-up-left'));
        answer.onclick=()=>{replyTo=m;$('discussion-kind').value='comment';requestId=null;mode();$('discussion-text').focus();};
        const resolve=node('button','filter-button',m.resolved_at?'Открыть снова':'Вопрос решён');resolve.type='button';resolve.setAttribute('aria-pressed',String(!!m.resolved_at));resolve.prepend(icon(m.resolved_at?'refresh-cw':'check'));resolve.onclick=()=>setResolved(m);
        answer.disabled=busy;resolve.disabled=busy;controls.append(answer,resolve);article.append(controls);
        if(m.resolved_at)article.append(node('small','muted','Решён · '+member(m.resolved_by).name+' · '+format.format(new Date(m.resolved_at))+' мск'));
      }
      list.append(article);
    });
    $('discussion-count').textContent='Показано сообщений: '+messages.length;
    $('discussion-earlier').hidden=!hasMore;$('discussion-earlier').disabled=loading;
    if(atBottom)scroll.scrollTop=scroll.scrollHeight;else scroll.scrollTop=oldTop;
  }
  function apply(data,older=false){
    if(!older&&Number(data.revision)<revision)return;
    const old=messages;
    if(older){messages=[...new Map([...data.messages,...old].map(m=>[Number(m.id),m])).values()].sort((a,b)=>a.id-b.id);hasMore=data.has_more;}
    else{
      const first=data.messages[0]?.id??Infinity;
      const incomingIds=new Set(data.messages.map(m=>Number(m.id))),overlap=old.some(m=>incomingIds.has(Number(m.id)));
      // After a long offline gap, reset the window so older pages remain reachable.
      messages=data.has_more&&old.length&&!overlap?data.messages:[...old.filter(m=>m.id<first),...data.messages];
      if(!old.length||!data.has_more||!overlap)hasMore=data.has_more;
      revision=Number(data.revision);
    }
    const states=new Map((data.question_states||[]).map(q=>[Number(q.id),q]));
    messages=messages.map(m=>{const q=states.get(Number(m.id));return q&&Number(q.revision)>=Number(m.revision)?{...m,...q}:m;});
    if(data.updated_message)messages=messages.map(m=>Number(m.id)===Number(data.updated_message.id)?{...m,...data.updated_message}:m);
    render();
  }
  async function load(older=false){
    if(!taskId||loading||busy)return;loading=true;const current=epoch,id=taskId,token=getSession()?.token;
    const scroll=$('discussion-scroll'),height=scroll.scrollHeight,top=scroll.scrollTop;
    try{
      const action='comments&task_id='+encodeURIComponent(id)+(older&&messages.length?'&before='+messages[0].id:'');
      const data=await api(action);if(epoch!==current||getSession()?.token!==token)return;
      apply(data,older);$('discussion-error').textContent='';
      if(older)scroll.scrollTop=top+scroll.scrollHeight-height;
    }catch(e){if(epoch!==current||getSession()?.token!==token)return;if(e.status===401)onUnauthorized(e.message);else $('discussion-error').textContent=e.message;}
    finally{if(epoch===current){loading=false;$('discussion-earlier').disabled=false;}}
  }
  async function setResolved(message){
    if(busy)return;setBusy(true);const current=epoch,token=getSession()?.token;
    try{
      const data=await api('question_state',{id:Number(message.id),revision:Number(message.revision),resolved:!message.resolved_at});
      if(epoch!==current||getSession()?.token!==token)return;acceptBoard(data.board);apply(data.discussion);$('discussion-error').textContent='';
    }catch(e){if(epoch!==current||getSession()?.token!==token)return;if(e.status===401)onUnauthorized(e.message);else{if(e.data?.board)acceptBoard(e.data.board);$('discussion-error').textContent=e.message;revision=-1;}}
    finally{if(epoch===current){setBusy(false);render();}}
  }
  async function open(id,kind='comment'){
    if(busy)return;saveDraft();taskId=id;messages=[];revision=-1;hasMore=false;loading=false;epoch++;
    const draft=drafts.get(id);form.reset();replyTo=draft?.replyTo||null;requestId=draft?.requestId||null;
    $('discussion-title').textContent=task()?.title||'Обсуждение задачи';
    $('discussion-text').value=draft?.text||'';$('discussion-kind').value=draft?.kind||kind;
    const select=$('discussion-recipient');select.replaceChildren();const all=node('option','','Всем');all.value='';select.append(all);
    (getBoard()?.members||[]).filter(m=>!['team','tatyana'].includes(m.id)).forEach(m=>{const option=node('option','',m.name);option.value=m.id;select.append(option);});select.value=draft?.recipient||'';
    $('discussion-error').textContent='';mode();render();if(!dialog.open)dialog.showModal();$('discussion-text').focus();await load();
  }
  form.addEventListener('input',()=>{requestId=null;saveDraft();});
  $('discussion-kind').onchange=()=>{mode();saveDraft();};
  $('discussion-reply-cancel').onclick=()=>{replyTo=null;requestId=null;mode();saveDraft();};
  $('discussion-earlier').onclick=()=>load(true);
  $('discussion-refresh').onclick=()=>load();
  $('discussion-close').onclick=()=>{if(!busy)dialog.close();};
  dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  dialog.addEventListener('close',saveDraft);
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(busy||!task())return;
    const text=$('discussion-text').value.trim();if(!text){$('discussion-text').focus();return;}
    requestId ||= crypto.randomUUID();const current=epoch,token=getSession()?.token;
    const body={task_id:taskId,request_id:requestId,text,kind:$('discussion-kind').value,recipient:$('discussion-kind').value==='question'?$('discussion-recipient').value:null,reply_to:replyTo?Number(replyTo.id):null,task_revision:Number(task().revision)};
    setBusy(true);$('discussion-error').textContent='';
    try{
      const data=await api('comment',body);if(epoch!==current||getSession()?.token!==token)return;
      acceptBoard(data.board);apply(data.discussion);$('discussion-text').value='';replyTo=null;requestId=null;drafts.delete(taskId);$('discussion-kind').value='comment';$('discussion-recipient').value='';mode();$('discussion-scroll').scrollTop=$('discussion-scroll').scrollHeight;
      toast(body.kind==='completion'?'Отчёт сохранён · задача на проверке':body.kind==='question'?'Вопрос сохранён':'Комментарий сохранён');
    }catch(error){if(epoch!==current||getSession()?.token!==token)return;if(error.status===401)onUnauthorized(error.message);else{if(error.data?.board)acceptBoard(error.data.board);$('discussion-error').textContent=error.message;}}
    finally{if(epoch===current){setBusy(false);render();$('discussion-text').focus();saveDraft();}}
  });
  return {open,refresh(){if(dialog.open&&task()&&Number(task().discussion_revision)!==revision)load();},reset(){epoch++;taskId=null;messages=[];drafts.clear();loading=false;setBusy(false);dialog.close();}};
}
