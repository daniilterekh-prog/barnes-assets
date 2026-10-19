const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
export function setupAttachments({api,getSession,getBoard,acceptBoard,member,toast,onUnauthorized}){
  const dialog=$('attachments-dialog'),input=$('attachment-file'),form=$('attachment-form');
  let taskId=null,epoch=0,busy=false,loading=false,revision=-1,requestId=null,preview=null;
  const urls=new Map();
  const task=()=>getBoard()?.tasks.find(t=>t.id===taskId);
  function release(){for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();if(preview)URL.revokeObjectURL(preview);preview=null;}
  function clearChoice(){if(preview)URL.revokeObjectURL(preview);preview=null;input.value='';$('attachment-filename').textContent='';requestId=null;$('attachment-preview').hidden=true;$('attachment-preview').removeAttribute('src');$('attachment-submit').disabled=true;}
  function setBusy(value){busy=value;input.disabled=value;$('attachment-submit').disabled=value||!input.files.length;$('attachments-close').disabled=value;$('attachment-submit').textContent=value?'Загружаю…':'Прикрепить';}
  function error(e){if(e.status===401)onUnauthorized(e.message);else $('attachment-error').textContent=e.message;}
  async function apply(data,current){
    if(current!==epoch)return;const list=$('attachment-gallery');list.replaceChildren();
    revision=Math.max(0,...data.attachments.map(a=>Number(a.id)));
    if(!data.attachments.length)list.append(node('p','muted','Пока нет изображений.'));
    await Promise.all(data.attachments.map(async a=>{
      const card=node('figure','attachment-card'),link=node('a','attachment-image'),caption=node('figcaption','');
      caption.append(node('strong','',a.name),node('span','muted',member(a.actor).name+' · '+new Intl.DateTimeFormat('ru',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Moscow'}).format(new Date(a.created_at))));
      const status=node('span','muted','Загрузка изображения…');link.append(status);card.append(link,caption);list.append(card);
      try{
        let url=urls.get(a.id);if(!url){const blob=await api('attachment_file&id='+Number(a.id),undefined,true);if(current!==epoch)return;url=URL.createObjectURL(blob);urls.set(a.id,url);}
        if(current!==epoch)return;
        const img=node('img','');img.alt=a.name;img.src=url;img.width=Number(a.width);img.height=Number(a.height);img.decoding='async';
        link.href=url;link.target='_blank';link.rel='noopener';link.setAttribute('aria-label','Открыть полное изображение: '+a.name);link.replaceChildren(img);
        const download=node('a','text-button','Скачать');download.href=url;download.download=a.name;caption.append(download);
      }catch(e){if(current!==epoch)return;status.textContent='Не удалось открыть. Закрой окно и попробуй ещё раз.';if(e.status===401)onUnauthorized(e.message);}
    }));
  }
  async function load(){
    if(!taskId||busy||loading)return;loading=true;const current=epoch;
    try{const data=await api('attachments&task_id='+encodeURIComponent(taskId));await apply(data,current);}
    catch(e){if(current===epoch)error(e);}
    finally{if(current===epoch)loading=false;}
  }
  async function open(id){
    if(busy)return;epoch++;release();taskId=id;revision=-1;loading=false;clearChoice();$('attachment-error').textContent='';$('attachments-title').textContent=task()?.title||'Изображения задачи';$('attachment-gallery').replaceChildren(node('p','muted','Загрузка…'));dialog.showModal();input.focus();await load();
  }
  input.onchange=()=>{
    requestId=null;$('attachment-filename').textContent='';$('attachment-error').textContent='';if(preview)URL.revokeObjectURL(preview);preview=null;
    const file=input.files[0];$('attachment-preview').hidden=true;$('attachment-preview').removeAttribute('src');$('attachment-submit').disabled=true;
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)){input.value='';$('attachment-error').textContent='Выбери JPG, PNG, WebP или GIF.';return;}
    if(!file.size||file.size>2097152){input.value='';$('attachment-error').textContent='Максимальный размер файла — 2 МБ.';return;}
    $('attachment-filename').textContent=file.name;preview=URL.createObjectURL(file);$('attachment-preview').src=preview;$('attachment-preview').alt='Перед загрузкой: '+file.name;$('attachment-preview').hidden=false;$('attachment-submit').disabled=false;requestId=crypto.randomUUID();
  };
  form.onsubmit=async e=>{
    e.preventDefault();if(busy||!input.files.length)return;const current=epoch;setBusy(true);$('attachment-error').textContent='';
    const data=new FormData();data.append('task_id',taskId);data.append('request_id',requestId);data.append('image',input.files[0]);
    try{const result=await api('attachment_upload',data);if(current!==epoch)return;acceptBoard(result.board);clearChoice();await apply(result.gallery,current);toast('Изображение прикреплено');input.focus();}
    catch(e){if(current===epoch)error(e);}
    finally{if(current===epoch){setBusy(false);if(!input.files.length)input.focus();}}
  };
  $('attachments-close').onclick=()=>{if(!busy)dialog.close();};
  dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  dialog.addEventListener('close',()=>{epoch++;taskId=null;loading=false;release();clearChoice();$('attachment-gallery').replaceChildren();});
  return {open,refresh(){if(dialog.open&&!loading&&!busy&&Number(task()?.attachment_revision||0)!==revision)load();},reset(){epoch++;busy=false;setBusy(false);dialog.close();taskId=null;release();clearChoice();}};
}
