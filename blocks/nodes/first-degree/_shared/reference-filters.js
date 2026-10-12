/** Opt-in reference UI only; data/feed/submission remain host-owned. */
export async function bootReferenceFilters() {
  if(window.BarnesReferenceFiltersReady)return;
  window.BarnesReferenceFiltersReady=true;
  const base=new URL('../',import.meta.url);
  async function script(file){await new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=new URL(file,base);el.onload=resolve;el.onerror=()=>reject(new Error(`Cannot load ${file}`));document.body.append(el);});}
  await script('filters-modal/filters-template.js');
  await script('filters-modal/filters-modal.js');
  if(document.querySelector('.catalog-projects-map__fullscreen')){
    await script('map/panel/map-projects.js');
    await script('map/panel/map-fullscreen.js');
  }
  await script('quick-filter-dropdowns/quick-filters.js');
  await script('quick-filter-dropdowns/brand-filters.js');
}
