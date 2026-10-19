// Lucide SVG sprite, ISC license; see icons-LICENSE.txt.
export function icon(name,className='') {
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','ui-icon'+(className?' '+className:''));
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  const use=document.createElementNS(svg.namespaceURI,'use');use.setAttribute('href','./icons.svg?v=20261019-gateway#'+name);svg.append(use);return svg;
}
