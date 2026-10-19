export function setupAssignee({api,getBoard,getSession,acceptBoard,toast,onUnauthorized,onSaved}){
  const $=id=>document.getElementById(id),dialog=$('assignee-dialog'),select=$('assignee-select'),error=$('assignee-error');
  let target=null,saving=false;
  const lock=value=>{saving=value;dialog.querySelectorAll('button,select').forEach(e=>e.disabled=value);};
  const close=()=>{if(!saving)dialog.close();};
  $('assignee-close').onclick=close;dialog.addEventListener('cancel',e=>{if(saving)e.preventDefault();});
  $('assignee-form').addEventListener('submit',async event=>{
    event.preventDefault();if(saving||!target)return;
    const token=getSession()?.token,id=target.id;lock(true);error.textContent='';
    try{
      const data=await api('assignee',{...target,owner:select.value});if(getSession()?.token!==token)return;
      acceptBoard(data);dialog.close();toast('Ответственный сохранён');onSaved?.(id);
    }catch(e){
      if(getSession()?.token!==token)return;
      if(e.status===401){onUnauthorized(e.message);return;}
      if(e.status===409&&e.data?.board){acceptBoard(e.data.board);const task=getBoard().tasks.find(t=>t.id===id);if(task){target.revision=Number(task.revision);select.value=task.owner;}}
      error.textContent=e.message;
    }finally{lock(false);}
  });
  return {
    open(task){if(saving)return;target={id:task.id,revision:Number(task.revision)};error.textContent='';$('assignee-title').textContent=task.title;select.replaceChildren();
      [{id:'unassigned',name:'Без исполнителя'},...getBoard().members.filter(m=>!['tatyana','team'].includes(m.id))].forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=m.name;select.append(o);});
      select.value=task.owner;dialog.showModal();select.focus();
    },
    reset(){target=null;dialog.close();}
  };
}
