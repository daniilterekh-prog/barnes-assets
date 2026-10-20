// Apply before the stylesheet paints; explicit preference is local to this browser.
(()=>{
  const key='barn-taskboard-theme-v1',root=document.documentElement;
  let saved=null;
  try{const value=localStorage.getItem(key);if(['light','dark'].includes(value))saved=value;}catch{}
  function apply(theme){
    root.dataset.theme=theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='light'?'#f7f5ef':'#090909');
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
      button.setAttribute('aria-pressed',String(theme==='light'));
      button.setAttribute('aria-label',theme==='light'?'Включить тёмную тему':'Включить светлую тему');
      button.title=button.getAttribute('aria-label');button.querySelector('[data-theme-label]').textContent=theme==='light'?'Светлая':'Тёмная';
    });
  }
  apply(saved||'light');
  function setup(){apply(root.dataset.theme);document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{
    saved=root.dataset.theme==='light'?'dark':'light';try{localStorage.setItem(key,saved);}catch{}apply(saved);
  }));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
  window.addEventListener('storage',event=>{if(event.key!==key&&event.key!==null)return;saved=['light','dark'].includes(event.newValue)?event.newValue:null;apply(saved||'light');});
})();
