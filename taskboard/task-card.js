export function setupTaskCard({getTask,isBusy,renderTask,onSelect}){
  const dialog=document.getElementById('task-card-dialog'),body=document.getElementById('task-card-body'),title=document.getElementById('task-card-title');
  let activeId=null,signature='';
  // An asynchronously opened child can share the browser's Escape close group.
  // Consume one Escape for the top child, preserving its busy/cancel safeguards.
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||!dialog.open)return;
    const child=[...document.querySelectorAll('dialog[open]:not(#task-card-dialog)')].at(-1);
    if(!child)return;event.preventDefault();event.stopPropagation();
    if(child.dispatchEvent(new Event('cancel',{cancelable:true})))child.close();
  },{capture:true});
  function refresh(force=false){
    if(!activeId)return;const task=getTask(activeId);if(!task){dialog.close();return;}
    const next=JSON.stringify(task)+':'+isBusy(activeId);if(!force&&next===signature)return;
    signature=next;const top=dialog.scrollTop;title.textContent=task.title;
    body.replaceChildren(renderTask(task,{level:3,showOwner:true,isCard:true}));dialog.scrollTop=top;
  }
  function open(id){if(!getTask(id))return;activeId=id;signature='';refresh(true);if(!dialog.open)dialog.showModal();onSelect(id);dialog.scrollTop=0;title.focus({preventScroll:true});}
  function focusAction(selector){if(dialog.open&&!document.querySelector('dialog[open]:not(#task-card-dialog)'))body.querySelector(selector)?.focus({preventScroll:true});}
  document.getElementById('task-card-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{
    if(dialog.open)return;const id=activeId;activeId=null;signature='';body.replaceChildren();onSelect(null);
    if(id){const button=[...document.querySelectorAll('[data-task="'+CSS.escape(id)+'"] .task-open')].find(e=>e.getClientRects().length);(button||document.getElementById('board-title'))?.focus({preventScroll:true});}
  });
  return {open,refresh,focusAction,isOpenFor:id=>dialog.open&&activeId===id,close:()=>dialog.close(),reset(){activeId=null;signature='';dialog.close();body.replaceChildren();onSelect(null);}};
}
