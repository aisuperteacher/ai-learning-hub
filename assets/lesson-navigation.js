(()=>{
'use strict';
const KEY='ai-learning-hub-state-v1';
const bar=document.getElementById('learning-hub-bar');
if(!bar)return;
const pageStyle=getComputedStyle(document.body),rootStyle=getComputedStyle(document.documentElement);
const pageColor=pageStyle.backgroundColor;
const surface=pageColor&&pageColor!=='transparent'&&pageColor!=='rgba(0, 0, 0, 0)'?pageColor:(rootStyle.getPropertyValue('--bg').trim()||rootStyle.getPropertyValue('--paper').trim()||'#f7f8fc');
bar.style.setProperty('--hub-surface',surface);
bar.classList.toggle('hub-dark',rootStyle.colorScheme.includes('dark'));
const lessonId=bar.dataset.courseId;
const title=bar.querySelector('.hub-title').textContent;
const done=bar.querySelector('.hub-complete');
function read(){try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}}
function refresh(){const state=read(),complete=!!(state.done&&state.done[lessonId]);done.textContent=complete?'✓ 已完成 · 取消标记':'标记学完';done.setAttribute('aria-pressed',String(complete));done.setAttribute('aria-label',(complete?'取消完成：':'标记学完：')+title)}
done.addEventListener('click',()=>{const state=read();state.done=state.done||{};state.favorite=state.favorite||{};state.done[lessonId]=!state.done[lessonId];try{localStorage.setItem(KEY,JSON.stringify(state));refresh()}catch{done.textContent='浏览器暂时无法保存'}});
window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null)refresh()});window.addEventListener('pageshow',refresh);refresh();done.hidden=false;
const breadcrumb=document.createElement('div');breadcrumb.className='hub-breadcrumb';
const back=bar.querySelector('.hub-return'),name=bar.querySelector('.hub-title');
back.textContent='← 返回学习中心';back.setAttribute('aria-label','返回学习中心首页');name.title=title;
const slash=document.createElement('span');slash.className='hub-separator';slash.textContent='/';slash.setAttribute('aria-hidden','true');breadcrumb.append(back,slash,name);bar.prepend(breadcrumb);
let nav=document.querySelector('.nav-shell nav, nav.chapters, nav[aria-label="章节目录"], nav[aria-label="课程章节"], nav[aria-label="学习导航"], nav[aria-label="课程目录"]');
let originalContainer=null;
if(nav){
 const parent=nav.parentElement;
 const aside=nav.closest('aside');
 if(aside){originalContainer=aside;aside.parentElement.classList.add('hub-single-column')}
 else if(parent.classList.contains('nav-shell')||(parent.tagName==='DIV'&&parent.children.length===1))originalContainer=parent;
}else{
 const aside=document.querySelector('aside[aria-label="学习导航"]');
 if(aside){nav=document.createElement('nav');for(const a of [...aside.querySelectorAll('a[href^="#"]')])nav.append(a);originalContainer=aside;aside.parentElement.classList.add('hub-single-column')}
 else{
  const headings=[...document.querySelectorAll('section.step h2[id], main section[id] > h2')];
  if(headings.length>1){nav=document.createElement('nav');for(const [i,h]of headings.entries()){const a=document.createElement('a');a.href='#'+(h.id||h.parentElement.id);a.textContent=String(i+1).padStart(2,'0')+' '+h.textContent.trim();nav.append(a)}}
 }
}
let updateOverflow=()=>{};
if(nav&&nav.querySelector('a,button')){
 // Move the original navigation instead of cloning it: paginated lessons
 // retain delegated click handlers, keyboard behavior and their active step.
 nav.classList.add('hub-sections');nav.setAttribute('aria-label','课程章节');
 const strip=document.createElement('div');strip.className='hub-section-strip';
 const previous=document.createElement('button'),next=document.createElement('button');
 for(const [b,label,text]of [[previous,'向前查看章节','‹'],[next,'向后查看章节','›']]){b.type='button';b.className='hub-toc-arrow';b.setAttribute('aria-label',label);b.textContent=text;b.hidden=true}
 strip.append(previous,nav,next);bar.insertBefore(strip,done);
 if(originalContainer)originalContainer.classList.add('hub-original-navigation');
 document.documentElement.classList.add('hub-unified-nav');
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const behavior=()=>motion.matches?'instant':'smooth';
 updateOverflow=()=>{const overflow=nav.scrollWidth>nav.clientWidth+2;previous.hidden=next.hidden=!overflow;previous.disabled=nav.scrollLeft<=2;next.disabled=nav.scrollLeft+nav.clientWidth>=nav.scrollWidth-2};
 previous.addEventListener('click',()=>nav.scrollBy({left:-Math.max(180,nav.clientWidth*.75),behavior:behavior()}));next.addEventListener('click',()=>nav.scrollBy({left:Math.max(180,nav.clientWidth*.75),behavior:behavior()}));nav.addEventListener('scroll',updateOverflow,{passive:true});
 let lastNavInteraction=0;
 for(const type of ['pointerdown','wheel','keydown'])nav.addEventListener(type,()=>lastNavInteraction=Date.now(),{passive:true});
 function reveal(item){if(!item||Date.now()-lastNavInteraction<900)return;const bounds=nav.getBoundingClientRect(),link=item.getBoundingClientRect();if(link.left<bounds.left+4)nav.scrollBy({left:link.left-bounds.left-6,behavior:behavior()});else if(link.right>bounds.right-4)nav.scrollBy({left:link.right-bounds.right+6,behavior:behavior()})}
 const links=[...nav.querySelectorAll('a[href^="#"]')].map(a=>{let id;try{id=decodeURIComponent(a.hash.slice(1))}catch{return null}const target=document.getElementById(id);return target?{a,target}:null}).filter(Boolean);
 if(links.length){
  let active=null,queued=false;
  function updateActive(){queued=false;const edge=bar.getBoundingClientRect().height+32;let current=links[0];for(const item of links){if(item.target.getBoundingClientRect().top<=edge)current=item}
   if(window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-4)current=links[links.length-1];
   if(active===current)return;active=current;for(const item of links){if(item===current)item.a.setAttribute('aria-current','location');else item.a.removeAttribute('aria-current')}reveal(current.a)
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(updateActive)}}
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);window.addEventListener('hashchange',schedule);window.addEventListener('pageshow',schedule);schedule();
 }else{
  // Page-switching lessons update aria-current themselves.
  new MutationObserver(()=>{reveal(nav.querySelector('[aria-current="step"]'));updateOverflow()}).observe(nav,{subtree:true,attributes:true,attributeFilter:['aria-current']});
 }
 if('ResizeObserver'in window)new ResizeObserver(updateOverflow).observe(nav);
 requestAnimationFrame(updateOverflow);
}else{
 // A course without a directory still gets the normal return/title/actions.
 const spacer=document.createElement('span');bar.insertBefore(spacer,done);
}
const readingArea=document.querySelector('main');
function fitReadingWidth(){if(!readingArea)return;const style=getComputedStyle(readingArea),rect=readingArea.getBoundingClientRect();const width=rect.width-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0);if(width>0)bar.style.setProperty('--hub-content-width',Math.min(1280,width)+'px')}
function resize(){fitReadingWidth();document.documentElement.style.setProperty('--hub-nav-height',bar.getBoundingClientRect().height+'px');updateOverflow()}
resize();window.addEventListener('resize',resize);
if('ResizeObserver'in window)new ResizeObserver(resize).observe(bar);
if(readingArea&&'ResizeObserver'in window)new ResizeObserver(resize).observe(readingArea);
})();
