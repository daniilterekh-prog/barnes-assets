export function setupGateway(onChoose){
  const view=document.getElementById('gateway-view'),wheel=document.getElementById('gateway-wheel');
  const buttons=[...wheel.querySelectorAll('button[data-route]')];
  let timer=null,epoch=0,busy=false;
  function reset(){epoch++;clearTimeout(timer);busy=false;wheel.classList.remove('choosing','entering');wheel.removeAttribute('aria-busy');buttons.forEach(b=>{b.disabled=false;b.classList.remove('chosen');});}
  buttons.forEach(button=>button.addEventListener('click',()=>{
    if(busy||view.hidden)return;busy=true;wheel.classList.remove('entering');wheel.setAttribute('aria-busy','true');wheel.classList.add('choosing');button.classList.add('chosen');buttons.forEach(b=>b.disabled=true);
    const current=epoch;
    const choose=()=>{if(current!==epoch||view.hidden)return;onChoose(button.dataset.route);reset();};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)choose();else timer=setTimeout(choose,520);
  }));
  wheel.addEventListener('animationend',e=>{if(e.animationName==='wheel-enter')wheel.classList.remove('entering');});
  return {reset,show(){reset();wheel.classList.add('entering');view.hidden=false;buttons[0].focus({preventScroll:true});}};
}
