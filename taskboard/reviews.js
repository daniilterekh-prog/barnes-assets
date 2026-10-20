import {icon} from './icons.js?v=20261019-gateway';
import {reviewInbox} from './domain.js?v=20261020-review-category';
const node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text!==undefined)e.textContent=text;return e;};
export function setupReviews({api,getSession,getBoard,acceptBoard,member,toast,onUnauthorized,onChange,renderTask}){
  const dialog=document.getElementById('review-return-dialog'),form=document.getElementById('review-return-form'),reason=document.getElementById('review-return-reason'),error=document.getElementById('review-return-error'),submit=document.getElementById('review-return-submit'),close=document.getElementById('review-return-close');
  const pending=new Set();let target=null;
  const focus=()=> (document.querySelector('#task-card-dialog[open] #task-card-title')||document.getElementById('board-title'))?.focus({preventScroll:true});
  close.onclick=()=>{if(!target||!pending.has(target.id))dialog.close();};
  dialog.addEventListener('cancel',e=>{if(target&&pending.has(target.id))e.preventDefault();});
  dialog.addEventListener('close',()=>{target=null;reason.value='';error.textContent='';focus();});
  async function decide(task,decision,text=''){
    if(pending.has(task.id))return;const token=getSession()?.token;pending.add(task.id);submit.disabled=true;close.disabled=true;reason.disabled=true;onChange();
    try{
      const data=await api('review_decision',{id:task.id,review_id:Number(task.review.id),revision:Number(task.revision),decision,reason:text});
      if(getSession()?.token!==token)return;acceptBoard(data);if(decision==='return')dialog.close();
      const saved=data.tasks.find(t=>t.id===task.id);toast(decision==='return'?'Возвращено исполнителю с замечанием':saved?.status==='done'?'Задача принята':'Решение сохранено');
    }catch(e){if(getSession()?.token!==token)return;if(e.status===401){onUnauthorized(e.message);return;}if(e.data?.board){acceptBoard(e.data.board);if(decision==='return'){const current=getBoard()?.tasks.find(t=>t.id===task.id);target=current?.review?.id===task.review.id&&current.review.outcome==='pending'?current:null;}}if(decision==='return')error.textContent=e.message;else toast(e.message);
    }finally{pending.delete(task.id);submit.disabled=dialog.open&&!target;close.disabled=false;reason.disabled=false;if(getSession()?.token===token){onChange();if(!dialog.open)focus();}}
  }
  form.onsubmit=e=>{e.preventDefault();if(target)decide(target,'return',reason.value.trim());};
  function block(task,{controls=false}={}){
    const review=task.review;if(!review)return null;const box=node('section','review-note');box.setAttribute('aria-label','Проверка выполнения');
    const people=review.reviewers||[];const me=getSession()?.member,person=people.find(p=>p.member===me),waiting=review.outcome==='pending';
    box.append(node('strong','',waiting?'Проверяющие':review.outcome==='returned'?'Возвращено в работу':task.status==='done'?'Проверка пройдена':'Предыдущая проверка пройдена'));
    if(review.outcome==='returned'){box.append(node('p','review-reason',member(review.returned_by).name+': '+review.reason));}
    else box.append(node('p','review-people',people.map(p=>member(p.member).name+' — '+(p.approved_at?'принято':review.outcome==='approved'?'подтверждение не требуется':'ждём')).join(' · ')));
    if(waiting&&person&&controls){const actions=node('div','review-actions');
      if(!person.approved_at){const approve=node('button','primary review-approve','Принять');approve.type='button';approve.prepend(icon('check'));approve.disabled=pending.has(task.id);approve.onclick=()=>decide(task,'approve');actions.append(approve);}
      const back=node('button','filter-button review-return','Вернуть с замечаниями');back.type='button';back.disabled=pending.has(task.id);back.onclick=()=>{target=task;reason.value='';error.textContent='';dialog.showModal();reason.focus();};actions.append(back);box.append(actions);
    }
    return box;
  }
  function render(){
    const board=getBoard(),me=getSession()?.member;if(!board||!me)return;const {actionable,waiting,submitted}=reviewInbox(board.tasks,me);document.getElementById('review-count').textContent=String(actionable.length+waiting.length+submitted.length);
    const list=document.getElementById('review-list');list.replaceChildren();
    const section=(title,rows)=>{if(!rows.length)return;const group=node('section','review-group');group.append(node('h2','',title+' · '+rows.length));rows.forEach(task=>group.append(renderTask(task,{level:3,showOwner:true})));list.append(group);};
    if(!actionable.length&&!waiting.length&&!submitted.length)list.append(node('p','muted','Нет задач на проверке.'));
    section('Ждут твоей проверки',actionable);section('Проверено тобой',waiting);section('Мои задачи на проверке',submitted);
  }
  return {render,block,busy:id=>pending.has(id),reset(){pending.clear();target=null;dialog.close();}};
}
