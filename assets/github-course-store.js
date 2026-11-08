const REPO='aisuperteacher/ai-learning-hub',BRANCH='main',API='https://api.github.com/repos/'+REPO;
export const statusOf=course=>course.status||'active';
const encodePath=path=>path.split('/').map(encodeURIComponent).join('/');
const parseJSON=text=>JSON.parse(text.replace(/^\uFEFF/,''));
const serialize=value=>JSON.stringify(value,null,2)+'\n';
const clone=value=>structuredClone(value);
const safeFile=path=>typeof path==='string'&&!path.split('/').includes('..')&&/^(lessons\/[A-Za-z0-9_-]+|study\/lessons\/[a-z0-9-]+\/[A-Za-z0-9_-]+|reports\/learning\/[A-Za-z0-9_-]+)\.html$/.test(path);
const backupPath=id=>'course-trash/'+id+'.json';
export function validateCourses(courses){
 if(!Array.isArray(courses))throw Error('课程目录格式不正确');
 const ids=new Set();
 for(const c of courses){if(!c||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(c.id)||ids.has(c.id)||typeof c.title!=='string'||!Array.isArray(c.tags)||!['active','hidden','deleted'].includes(statusOf(c)))throw Error('课程目录格式不正确');ids.add(c.id)}
 return courses;
}
export function courseFiles(course,archive){
 if(/^lessons\/[A-Za-z0-9_-]+\.html$/.test(course.path))return {files:[course.path],topic:null};
 const url=new URL(course.path,'https://learning.invalid/');
 if(url.origin!=='https://learning.invalid'||url.pathname!=='/study/read.html')throw Error('暂不支持管理此课程路径');
 const topic=archive.topics.find(t=>t.id===url.searchParams.get('topic'));
 if(!topic||!Array.isArray(topic.editions)||!topic.editions.length)throw Error('找不到课程对应的历史版本，请检查归档目录');
 const files=[...new Set(topic.editions.map(e=>e.file))];
 if(files.some(path=>!safeFile(path)))throw Error('归档课程路径无效');
 return {files,topic};
}
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function trashPage(course,path){
 const depth=path.split('/').length-1,root='../'.repeat(depth);
 return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>课程在回收站中</title></head><body data-course-trash-id="'+escapeHTML(course.id)+'"><main><h1>这门课程在回收站中</h1><p>'+escapeHTML(course.title)+'</p><p>恢复课程后，可以继续学习。</p><p><a href="'+root+'manage.html#trash">进入回收站恢复课程</a></p><p><a href="'+root+'index.html#library">返回学习中心</a></p></main></body></html>\n';
}
function assertExclusive(course,files,courses,archive){
 for(const other of courses){if(other.id===course.id)continue;const otherFiles=courseFiles(other,archive).files;if(otherFiles.some(p=>files.includes(p)))throw Error('此文件还被另一门课程使用，请先整理课程引用，避免误删')}
 if(course.path.startsWith('study/')){const topicId=new URL(course.path,'https://learning.invalid/').searchParams.get('topic');for(const t of archive.topics){if(t.id!==topicId&&t.editions.some(e=>files.includes(e.file)))throw Error('课程文件还被其他归档主题使用，无法单独移入回收站')}}
}
export async function planCourseChange(snapshot,id,action,readFile){
 const courses=clone(validateCourses(snapshot.courses)),archive=clone(snapshot.archive);
 const course=courses.find(c=>c.id===id);if(!course)throw Error('课程不存在，请刷新列表');
 const current=statusOf(course),changes=new Map(),{files,topic}=courseFiles(course,archive);
 let next;
 if(action==='hide'&&current==='active')next='hidden';
 else if(action==='show'&&current==='hidden')next='active';
 else if(action==='trash'&&current!=='deleted'){
  assertExclusive(course,files,courses,archive);
  const saved=[];
  for(const path of files){const content=await readFile(path);if(content.includes('data-course-trash-id="'))throw Error('课程文件与目录状态不一致，请检查后重试');saved.push({path,content});changes.set(path,trashPage(course,path))}
  changes.set(backupPath(id),serialize({schemaVersion:1,courseId:id,files:saved}));
  course.priorStatus=current;next='deleted';
 }else if((action==='restore'||action==='purge')&&current==='deleted'){
  assertExclusive(course,files,courses,archive);
  const backup=parseJSON(await readFile(backupPath(id)));
  if(backup.schemaVersion!==1||backup.courseId!==id||!Array.isArray(backup.files)||backup.files.length!==files.length||new Set(backup.files.map(f=>f.path)).size!==files.length||backup.files.some(f=>!files.includes(f.path)||typeof f.content!=='string'))throw Error('回收站备份不完整，操作已停止');
  for(const file of backup.files){if(await readFile(file.path)!==trashPage(course,file.path))throw Error('课程文件已被其他方式修改，请刷新并检查；不会覆盖或删除新的内容');changes.set(file.path,action==='restore'?file.content:null)}
  changes.set(backupPath(id),null);
  if(action==='restore')next=course.priorStatus==='hidden'?'hidden':'active';
  else{courses.splice(courses.indexOf(course),1);if(topic)archive.topics.splice(archive.topics.indexOf(topic),1)}
 }else throw Error('课程状态已变化，请刷新后重新操作');
 if(next){course.status=next;course.revision=(course.revision||0)+1;course.updatedAt=new Date().toISOString();if(next!=='deleted')course.priorStatus=next;if(topic)topic.hub_status=next}
 changes.set('courses.json',serialize(courses));
 if(topic){archive.stats={...archive.stats,topic_count:archive.topics.length,document_count:archive.topics.reduce((n,t)=>n+t.editions.length,0)};changes.set('study/catalog.json',serialize(archive))}
 return {changes,courses,archive};
}
export class GitHubCourseStore{
 #token='';#request;#snapshot=null;
 constructor(request=globalThis.fetch.bind(globalThis)){this.#request=request;this.connected=false}
 async #api(path,options={},publicRequest=false){
  const headers={Accept:'application/vnd.github+json',...(options.body?{'Content-Type':'application/json'}:{})};
  if(this.#token&&!publicRequest)headers.Authorization='Bearer '+this.#token;
  const response=await this.#request(API+path,{...options,headers,credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer'});
  let data;try{data=await response.json()}catch{throw Error('GitHub 返回了无法读取的响应，请稍后重试')}
  if(!response.ok){if(response.status===401)throw Error('GitHub 连接已失效，请重新连接');if(response.status===403)throw Error('GitHub 权限或请求额度不足，请确认此仓库的 Contents 读写权限');if(response.status===409||response.status===422)throw Error('仓库刚刚有其他更新，本次未覆盖它，请刷新列表后重试');throw Error('GitHub 请求未完成（'+response.status+'），请刷新后重试')}
  return data;
 }
 async #branch(){const value=await this.#api('/branches/'+BRANCH);return {head:value.commit.sha,tree:value.commit.commit.tree.sha}}
 async #read(path,ref){
  const value=await this.#api('/contents/'+encodePath(path)+'?ref='+encodeURIComponent(ref));
  if(value.type!=='file'||value.encoding!=='base64'||typeof value.content!=='string')throw Error('课程文件过大或格式不支持，请通过仓库管理此文件');
  return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(value.content.replace(/\s/g,'')),c=>c.charCodeAt(0)));
 }
 async connect(token){
  if(typeof token!=='string'||!token.trim())throw Error('请先填写 GitHub 访问令牌');
  this.disconnect();this.#token=token.trim();
  try{const repository=await this.#api('');if(!repository.permissions?.push)throw Error('此连接没有仓库写入权限，请使用拥有者的连接');this.connected=true;return await this.load()}catch(error){this.disconnect();throw error}
 }
 disconnect(){this.#token='';this.connected=false;this.#snapshot=null}
 async load(){
  if(!this.connected){const response=await this.#request('./courses.json',{cache:'no-store',credentials:'omit'});if(!response.ok)throw Error('课程目录暂时无法读取');return validateCourses(await response.json())}
  const {head,tree}=await this.#branch();
  const [courses,archive]=await Promise.all([this.#read('courses.json',head),this.#read('study/catalog.json',head)]);
  this.#snapshot={head,tree,courses:validateCourses(parseJSON(courses)),archive:parseJSON(archive)};
  if(!Array.isArray(this.#snapshot.archive.topics))throw Error('历史归档目录不正确');
  return this.#snapshot.courses;
 }
 async change(course,action){
  if(!this.connected||!this.#snapshot)throw Error('请先连接 GitHub');
  const original=this.#snapshot;
  if((await this.#branch()).head!==original.head)throw Error('仓库刚刚有其他更新，请刷新列表后重新操作');
  const expected=original.courses.find(c=>c.id===course.id);
  if(!expected||(expected.revision||0)!==(course.revision||0)||statusOf(expected)!==statusOf(course))throw Error('课程状态已变化，请刷新后重试');
  const plan=await planCourseChange(original,course.id,action,path=>this.#read(path,original.head));
  const tree=await this.#api('/git/trees',{method:'POST',body:JSON.stringify({base_tree:original.tree,tree:[...plan.changes].map(([path,content])=>({path,mode:'100644',type:'blob',...(content===null?{sha:null}:{content})}))})});
  const names={hide:'隐藏课程',show:'恢复课程显示',trash:'将课程移入回收站',restore:'恢复回收站课程',purge:'删除当前发布的课程文件'};
  const commit=await this.#api('/git/commits',{method:'POST',body:JSON.stringify({message:names[action]+'：'+course.title,tree:tree.sha,parents:[original.head]})});
  // A sibling commit cannot fast-forward main, so concurrent edits are kept.
  await this.#api('/git/refs/heads/'+BRANCH,{method:'PATCH',body:JSON.stringify({sha:commit.sha,force:false})});
  this.#snapshot={head:commit.sha,tree:tree.sha,courses:plan.courses,archive:plan.archive};
  return {courses:plan.courses,commit:commit.sha};
 }
 async deployment(commit){
  const data=await this.#api('/actions/runs?head_sha='+encodeURIComponent(commit)+'&per_page=10',{},true);
  const run=data.workflow_runs?.find(r=>r.name==='pages build and deployment');
  return run?{status:run.status,conclusion:run.conclusion}:null;
 }
}
