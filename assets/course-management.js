import {GitHubCourseStore,statusOf} from './github-course-store.js';
export function mountManager(store=new GitHubCourseStore()){
 const $=id=>document.getElementById(id),names={active:'首页展示',hidden:'已隐藏',deleted:'回收站'};
 let courses=[],loaded=false,busy=false,query='',tab=['hidden','trash'].includes(location.hash.slice(1))?location.hash.slice(1):'all',pending=null,timer,publishTimer,generation=0;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 const normalized=list=>list.map(c=>({...c,status:statusOf(c),revision:c.revision||0}));
 function toast(text,error=false){clearTimeout(timer);$('toast').textContent=text;$('toast').className='toast'+(error?' error':'');$('toast').hidden=false;timer=setTimeout(()=>$('toast').hidden=true,6000)}
 function connection(){
  $('connection-status').textContent=store.connected?'✓ 已连接 · 操作保存到 aisuperteacher/ai-learning-hub':'未连接 · 当前为只读列表';
  $('disconnect-button').hidden=!store.connected;$('connect-form').hidden=store.connected;
  $('connection-summary').textContent=store.connected?'已连接 GitHub · 展开可断开连接':'连接 GitHub 后管理课程';
  $('reload').disabled=busy;$('connect-button').disabled=busy;$('disconnect-button').disabled=busy;
 }
 function actionButton(text,action,course,cls=''){
  const button=el('button','button '+cls,text);button.type='button';button.disabled=busy||!store.connected;button.setAttribute('aria-label',text+'：'+course.title);if(!store.connected)button.title='连接 GitHub 后可操作';
  button.addEventListener('click',()=>{
   if(action==='trash'){pending={course,action};$('dialog-course').textContent=course.title;$('trash-dialog').returnValue='';$('trash-dialog').showModal()}
   else if(action==='purge'){pending={course,action};$('purge-course').textContent=course.title;$('purge-confirmation').value='';$('confirm-purge').disabled=true;$('purge-dialog').returnValue='';$('purge-dialog').showModal();$('purge-confirmation').focus()}
   else change(course,action);
  });return button;
 }
 function render(){
  connection();document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));
  $('view-description').textContent=tab==='trash'?'可恢复课程，也可删除当前发布文件。删除后无法从回收站恢复，Git 提交历史仍保留。':tab==='hidden'?'隐藏的课程暂时不在列表展示，恢复显示后会重新加入课程库。':'管理已收录课程，保留想学的内容。';
  if(!loaded)return;
  const count=status=>courses.filter(c=>c.status===status).length;
  for(const [id,value]of [['count-active',count('active')],['count-hidden',count('hidden')],['count-trash',count('deleted')],['tab-all-count',count('active')+count('hidden')],['tab-hidden-count',count('hidden')],['tab-trash-count',count('deleted')]])$(id).textContent=value;
  const root=$('course-list');root.replaceChildren();const q=query.trim().toLowerCase();
  const filtered=courses.filter(c=>(tab==='trash'?c.status==='deleted':tab==='hidden'?c.status==='hidden':c.status!=='deleted')&&(!q||[c.title,c.category,c.desc,...c.tags].join(' ').toLowerCase().includes(q)));
  if(!filtered.length){const empty=el('div','empty');empty.append(el('strong','',q?'没有匹配的课程':tab==='trash'?'回收站是空的':tab==='hidden'?'没有隐藏的课程':'暂无课程'),el('p','',q?'试试其他关键词，或清除搜索条件。':'新课程加入后会显示在这里。'));root.append(empty);return}
  for(const c of filtered){
   const row=el('article','course-row');row.dataset.courseId=c.id;
   const copy=el('div','course-copy'),title=el('div','title-line'),actions=el('div','row-actions');title.append(el('h2','',c.title),el('span','badge '+(c.status==='active'?'':c.status),names[c.status]));copy.append(title,el('p','category',c.category+' · '+c.mode));
   if(c.status==='deleted')actions.append(actionButton('恢复课程','restore',c,'blue'),actionButton('永久删除','purge',c,'danger'));
   else{const link=el('a','button','查看课程 ↗');link.href='./'+c.path;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','查看课程：'+c.title);actions.append(link,actionButton(c.status==='hidden'?'恢复显示':'隐藏',c.status==='hidden'?'show':'hide',c,c.status==='hidden'?'blue':''),actionButton('移入回收站','trash',c,'danger'))}
   row.append(el('span','course-icon tone-'+c.tone,c.icon),copy,actions);root.append(row);
  }
 }
 async function load(){
  if(busy)return;busy=true;render();$('sync-status').textContent='正在读取课程…';$('sync-status').className='sync';
  try{courses=normalized(await store.load());loaded=true;$('sync-status').textContent=store.connected?'✓ 已读取仓库最新状态':'只读列表 · 连接后可管理'}
  catch(error){$('sync-status').textContent='读取失败，请重试';$('sync-status').className='sync error';toast(error.message,true);if(!loaded){const empty=el('div','empty');empty.setAttribute('role','alert');empty.append(el('strong','','课程暂时无法加载'),el('p','',error.message));$('course-list').replaceChildren(empty)}}
  finally{busy=false;render()}
 }
 function publish(commit){
  clearTimeout(publishTimer);const current=++generation;let tries=0;const status=$('publish-status');status.hidden=false;status.replaceChildren(document.createTextNode('已保存到仓库，正在等待 GitHub Pages 更新。'));
  const link=el('a','','查看发布进度 ↗');link.href='https://github.com/aisuperteacher/ai-learning-hub/actions';link.target='_blank';link.rel='noopener noreferrer';status.append(link);
  async function check(){if(current!==generation)return;tries++;
   try{const run=await store.deployment(commit);if(current!==generation)return;if(run?.status==='completed'){status.firstChild.textContent=run.conclusion==='success'?'✓ GitHub Pages 已更新，其他设备可访问新版。':'文件已保存，但 Pages 发布未成功，请查看发布进度。';return}}
   catch{if(tries>=3){status.firstChild.textContent='文件已保存到仓库，请通过发布进度确认 Pages 是否完成。';return}}
   if(tries<20)publishTimer=setTimeout(check,8000);else status.firstChild.textContent='文件已保存到仓库，Pages 仍在更新，请稍后查看发布进度。';
  }publishTimer=setTimeout(check,5000);
 }
 async function change(course,action){
  if(busy||!store.connected)return;busy=true;render();$('sync-status').textContent='正在保存…';
  try{const result=await store.change(course,action);courses=normalized(result.courses);$('sync-status').textContent='✓ 已保存到 GitHub';$('sync-status').className='sync';publish(result.commit);toast(action==='purge'?'已删除当前发布文件，Pages 更新后生效。':action==='hide'?'已隐藏课程，可在“已隐藏”中恢复。':action==='show'?'已恢复首页显示。':action==='trash'?'已移入回收站，可恢复课程。':'已恢复课程及其原有展示状态。')}
  catch(error){busy=false;await load();$('sync-status').textContent='保存未完成，请重试';$('sync-status').className='sync error';toast(error.message,true)}
  finally{busy=false;render()}
 }
 $('connect-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;busy=true;render();$('connect-button').textContent='正在连接…';const token=$('github-token').value;$('github-token').value='';
  try{courses=normalized(await store.connect(token));loaded=true;$('connection-details').open=false;$('sync-status').textContent='✓ 已读取仓库最新状态';toast('已连接，可以管理课程。')}
  catch(error){toast(error.message,true)}finally{busy=false;$('connect-button').textContent='连接 GitHub';render()}
 });
 $('disconnect-button').addEventListener('click',()=>{if(busy)return;store.disconnect();clearTimeout(publishTimer);generation++;connection();$('connection-details').open=true;load()});
 $('reload').addEventListener('click',load);
 $('manage-search').addEventListener('input',e=>{query=e.target.value;render()});
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;history.replaceState(null,'','#'+tab);render()}));
 window.addEventListener('hashchange',()=>{tab=['hidden','trash'].includes(location.hash.slice(1))?location.hash.slice(1):'all';render()});
 for(const name of ['trash','purge'])$(name+'-dialog').addEventListener('close',()=>{const request=pending;pending=null;if($(name+'-dialog').returnValue==='confirm'&&request&&(name==='trash'||$('purge-confirmation').value==='永久删除'))change(request.course,request.action)});
 $('purge-confirmation').addEventListener('input',()=>{$('confirm-purge').disabled=$('purge-confirmation').value!=='永久删除'});
 window.addEventListener('pagehide',()=>{store.disconnect();clearTimeout(publishTimer);generation++});
 window.addEventListener('pageshow',event=>{if(event.persisted){connection();load()}});
 load();
}
if(document.body.dataset.autostart!=='false')mountManager();
