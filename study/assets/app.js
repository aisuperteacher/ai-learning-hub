(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const recentKey = 'study-center-recent-v1';
  const readerUrl = (topic, edition) => 'read.html?' + new URLSearchParams({topic, ...(edition ? {edition} : {})});
  const create = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  function archiveUrl(path) {
    if (!/^(study\/lessons\/|reports\/learning\/)[a-zA-Z0-9_\-/.]+\.html$/.test(path) || path.split('/').includes('..')) throw Error('Invalid archive path');
    return new URL('../' + path, location.href).href;
  }
  async function loadCatalog() {
    const response = await fetch('catalog.json', {cache: 'no-cache'});
    if (!response.ok) throw Error('Catalog HTTP ' + response.status);
    const data = await response.json();
    if (data.schema_version !== 1 || !Array.isArray(data.topics) || !Array.isArray(data.categories)) throw Error('Invalid course catalog');
    if(document.body.dataset.page==='catalog')data.topics=data.topics.filter(t=>!t.hub_status||t.hub_status==='active');
    return data;
  }
  function readRecent() { try { const a = JSON.parse(localStorage.getItem(recentKey) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } }
  function saveRecent(topic, edition) { try { const recent = readRecent().filter(r => r.topic !== topic.id); recent.unshift({topic: topic.id, edition: edition.id, at: new Date().toISOString()}); localStorage.setItem(recentKey, JSON.stringify(recent.slice(0, 20))); } catch { /* Reading remains available without browser storage. */ } }
  let catalog;
  async function initLibrary() {
    try { catalog = await loadCatalog(); } catch { byId('load-error').hidden = false; byId('updated-at').textContent = '课程目录暂时不可用'; return; }
    byId('load-error').hidden = true;
    byId('topic-count').textContent = catalog.topics.length;
    byId('document-count').textContent = catalog.topics.reduce((n, t) => n + t.editions.length, 0);
    byId('updated-at').textContent = '目录更新于 ' + catalog.updated_at;
    const categories = new Map(catalog.categories.map(c => [c.id, c.name]));
    let category = 'all';
    const initial = new URL(location.href).searchParams;
    if (categories.has(initial.get('category'))) category = initial.get('category');
    byId('course-search').value = initial.get('q') || '';
    const filters = byId('categories'); filters.replaceChildren();
    [{id:'all',name:'全部'},...catalog.categories].forEach(c => {
      const count = c.id === 'all' ? catalog.topics.length : catalog.topics.filter(t => t.category === c.id).length;
      if (!count) return;
      const b = create('button', 'filter'); b.type = 'button'; b.dataset.category = c.id; b.setAttribute('aria-pressed', String(category === c.id)); b.append(document.createTextNode(c.name), create('span', '', String(count)));
      b.addEventListener('click', () => { category = c.id; filters.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); render(); }); filters.append(b);
    });
    const recent = readRecent().find(r => catalog.topics.some(t => t.id === r.topic));
    if (recent) {
      const t = catalog.topics.find(t => t.id === recent.topic), e = t.editions.find(e => e.id === recent.edition) || t.editions.find(e => e.id === t.recommended);
      byId('resume-title').textContent = t.title; byId('resume-note').textContent = e.label + ' · 访问记录保存在当前浏览器'; byId('resume-link').href = readerUrl(t.id, e.id); byId('resume').hidden = false;
    }
    function render() {
      const q = byId('course-search').value.trim().toLocaleLowerCase();
      const terms = q.split(/\s+/).filter(Boolean);
      let topics = catalog.topics.filter(t => (category === 'all' || t.category === category) && terms.every(w => [t.title,t.summary,...t.tags,t.search_text || '',...t.editions.map(e => e.label)].join(' ').toLocaleLowerCase().includes(w)));
      topics.sort(byId('course-sort').value === 'title' ? (a,b) => a.title.localeCompare(b.title,'zh-CN') : (a,b) => b.updated_at.localeCompare(a.updated_at) || a.title.localeCompare(b.title,'zh-CN'));
      byId('course-grid').replaceChildren();
      topics.forEach(t => {
        const card = create('article', 'course-card');
        const meta = create('div', 'course-meta'); meta.append(create('span', 'category-dot', categories.get(t.category)), create('time', '', t.updated_at)); meta.lastChild.dateTime = t.updated_at;
        const h = create('h3'), link = create('a', '', t.title); link.href = readerUrl(t.id); h.append(link);
        const summary = create('p', 'course-summary', t.summary);
        const tags = create('div', 'tag-row'); t.tags.slice(0,4).forEach(tag => tags.append(create('span', 'tag', tag)));
        const bottom = create('div', 'card-bottom'), start = create('a', 'start-link', '开始学习'); start.href = readerUrl(t.id); start.append(create('span', '', '↗')); start.setAttribute('aria-label','开始学习：' + t.title);
        bottom.append(start, create('span', 'edition-count', t.editions.length + ' 份课程'));
        card.append(meta, h, summary, tags, bottom);
        if (t.editions.length > 1) {
          const versions = create('details', 'edition-list'); versions.append(create('summary', '', '展开全部版本 / 期次'));
          const ul = create('ul'); [...t.editions].sort((a,b) => b.date.localeCompare(a.date) || Number(b.id === t.recommended) - Number(a.id === t.recommended)).forEach(e => { const li = create('li'), a = create('a', '', e.label + (e.id === t.recommended ? ' · 推荐入口' : '')); a.href = readerUrl(t.id,e.id); li.append(a, create('small','',e.date)); ul.append(li); }); versions.append(ul); card.append(versions);
        }
        byId('course-grid').append(card);
      });
      byId('result-count').textContent = topics.length + ' / ' + catalog.topics.length + ' 个主题';
      byId('empty-state').hidden = topics.length !== 0;
      byId('clear-search').hidden = !q;
      const url = new URL(location.href); if (category === 'all') url.searchParams.delete('category'); else url.searchParams.set('category',category); if(q) url.searchParams.set('q',byId('course-search').value.trim()); else url.searchParams.delete('q'); history.replaceState(null,'',url.pathname+url.search+url.hash);
    }
    byId('course-search').addEventListener('input',render); byId('course-sort').addEventListener('change',render);
    byId('clear-search').addEventListener('click',()=>{byId('course-search').value='';render();byId('course-search').focus();});
    byId('reset-filters').addEventListener('click',()=>{category='all';byId('course-search').value='';filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category==='all')));render();});
    render();
  }
  async function initReader() {
    const error = () => {byId('reader-title').textContent='课程暂时不可用';byId('reader-error').hidden=false;byId('lesson-frame').hidden=true;byId('edition-control').hidden=true;};
    try {
      catalog = await loadCatalog(); const params = new URL(location.href).searchParams; const topic = catalog.topics.find(t => t.id === params.get('topic')); if(!topic) return error();if(topic.hub_status==='deleted'){error();byId('reader-title').textContent='这门课程在回收站中';return;}
      const select = byId('edition-select');
      [...topic.editions].sort((a,b)=>b.date.localeCompare(a.date)).forEach(e => {const option=create('option','',e.date+' · '+e.label);option.value=e.id;select.append(option);});
      const category = catalog.categories.find(c=>c.id===topic.category);
      const frame = byId('lesson-frame'); let edition;
      function show(id) {
        edition = topic.editions.find(e=>e.id===id) || topic.editions.find(e=>e.id===topic.recommended) || topic.editions[0];
        const url = archiveUrl(edition.file); document.title=topic.title+' · 学以致用';byId('reader-title').textContent=topic.title;byId('reader-meta').textContent=category.name+' · 原课程 '+edition.date;
        select.value=edition.id;byId('original-link').href=url;byId('original-link').hidden=false;byId('download-link').href=url;byId('download-link').download=edition.source_names?.[0] || topic.id+'.html';byId('download-link').hidden=false;
        byId('edition-control').hidden=false;byId('reader-status').textContent='载入完整课程…';frame.hidden=false;frame.src=url;
        const current=new URL(location.href);current.searchParams.set('topic',topic.id);current.searchParams.set('edition',edition.id);history.replaceState(null,'',current.pathname+current.search);
      }
      frame.addEventListener('load',()=>{if(edition){byId('reader-status').textContent='完整 HTML · 原交互保留';saveRecent(topic,edition);}});
      select.addEventListener('change',()=>show(select.value));show(params.get('edition'));
    } catch { error(); }
  }
  if(document.body.dataset.page==='catalog'){byId('retry-load').addEventListener('click',initLibrary);initLibrary();} else if(document.body.dataset.page==='reader') initReader();
})();

