/* Isolated book quiz and offline kana IME. No network input transmission. */
window.HontaiQuiz = (() => {
  const books = window.HONTAI_BOOKS;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const kana = text => text.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0)-96));
  const katakana = text => text.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0)+96));
  const dict = new Map(Object.entries(window.HONTAI_WORDS));
  books.forEach(b => [[b.titleReading,b.title],[b.authorReading,b.author]].forEach(([reading,text]) => {
    // Punctuation belongs to the converted spelling, not to the spoken reading.
    for (const r of [reading,reading.replace(/[ ・、]/g,'')]) {
      dict.set(r,[...new Set([...(dict.get(r)||[]),text])]);
    }
  }));
  dict.set('みうらしおん',['三浦しをん']);
  function candidates(reading) {
    if (!reading) return [];
    const r = kana(reading);
    return [...new Set([...(dict.get(r)||[]),katakana(r),r])];
  }
  // Only the family/given-name boundary may contain spaces.
  const family = ['小川','恩田',null,'佐藤','伊坂','湊','冲方','東川','三浦','百田','和田','上橋','宮下','恩田','辻村','瀬尾','凪良','町田','逢坂','凪良','宮島','阿部','朝井'];
  function correct(value, index, field) {
    const b = books[index];
    if(field === 'title') return value === b.title;
    if(!family[index]) return value === b.author;
    const surname = family[index], given = b.author.slice(surname.length);
    return value === b.author || new RegExp(`^${surname}[ 　]+${given}$`).test(value);
  }
  let stage = 'gate', year = '', answers = books.map(() => ({title:'',author:''}));
  let active = -1, cursor = 0, reading = '', choices = [], layout = 'kana', notice = '';
  const fieldName = () => active < 0 ? '開始年' : `${books[Math.floor(active/2)].year}年・${active%2 ? '作者名':'作品名'}`;
  const value = () => active < 0 ? year : answers[Math.floor(active/2)][active%2?'author':'title'];
  const setValue = text => { if(active < 0) year=text; else answers[Math.floor(active/2)][active%2?'author':'title']=text; };
  function insert(text) { const v=value(); setValue(v.slice(0,cursor)+text+v.slice(cursor)); cursor+=text.length; }
  function commit(text=reading) { if(text) insert(text); reading=''; choices=[]; }
  function reset() { stage='gate';year='';answers=books.map(()=>({title:'',author:''}));active=-1;cursor=0;reading='';choices=[];layout='kana';notice=''; }
  const btn = (action,label,extra='') => `<button type="button" data-hq="${action}" ${extra}>${label}</button>`;
  function cell(index,field) {
    const v=answers[index][field];
    if(stage==='result') {
      const ok=correct(v,index,field), b=books[index];
      return `<td class="hq-result ${ok?'hq-correct':'hq-wrong'}"><span class="hq-verdict">${ok?'○ 正解':'× 不正解'}</span>${field==='title'?btn('synopsis',esc(b.title),`data-index="${index}" class="hq-book-link" aria-label="${esc(b.title)}のあらすじ"`):`<strong>${esc(b.author)}</strong>`}${!ok?`<small>あなたの解答：${esc(v||'未解答')}</small>`:''}</td>`;
    }
    const id=index*2+(field==='author'?1:0);
    return `<td>${btn('field',esc(v)||'<span>タップして入力</span>',`data-field="${id}" class="hq-field ${active===id?'selected':''}" aria-label="${books[index].year}年 ${field==='title'?'作品名':'作者名'}" aria-pressed="${active===id}"`)}</td>`;
  }
  function markup() {
    const playing=stage==='gate'||stage==='table';
    let content='';
    if(stage==='gate') content=`<div class="hq-gate"><span class="hq-step">最初の一問</span><h2>本屋大賞は<br>西暦何年に始まったか？</h2><p>正解すると、歴代受賞作のクイズへ。<br>この一問を間違えると終了です。</p>${btn('field',esc(year)||'西暦を入力',`data-field="-1" class="hq-field hq-year selected" aria-label="開始年"`)}<small>数字は「123」キーから入力できます。</small></div>`;
    if(stage==='failed') content=`<div class="hq-gate"><span class="hq-step">チャレンジ終了</span><h2>正解は2004年でした</h2><p>あなたの解答：${esc(year||'未解答')}</p><p>第1回の本屋大賞は2004年に開催されました。</p><a href="https://www.hontai.or.jp/history/hontai2004.html" target="_blank" rel="noopener">公式の発表を見る ↗</a><div class="hq-end-actions">${btn('retry','もう一度挑戦')}</div></div>`;
    if(stage==='table'||stage==='result') {
      const score=answers.reduce((n,a,i)=>n+Number(correct(a.title,i,'title'))+Number(correct(a.author,i,'author')),0);
      content=`${stage==='result'?`<div class="hq-score"><span>答え合わせ</span><strong>${score}<small> / ${books.length*2} 正解</small></strong><p>作品名をタップすると、あらすじが読めます。</p></div>`:`<p class="hq-instructions">作品名と作者名を正式表記で入力してください。<br>作品名は副題・句読点も含めて一致。作者名は姓と名の間のスペースのみ省略できます。</p><p class="hq-instructions">副題の前は半角スペース、巻数は入力不要です。</p><p id="hq-progress"></p>`}<table class="hq-table"><caption class="hq-sr">歴代本屋大賞 ${stage==='result'?'答え合わせ':'解答欄'}</caption><colgroup><col class="hq-year-col"><col><col class="hq-author-col"></colgroup><thead><tr><th scope="col">西暦</th><th scope="col">作品名</th><th scope="col">作者名</th></tr></thead><tbody>${books.map((b,i)=>`<tr><th scope="row">${b.year}</th>${cell(i,'title')}${cell(i,'author')}</tr>`).join('')}</tbody></table>${stage==='result'?`<div class="hq-end-actions">${btn('retry','もう一度挑戦')}</div><p class="hq-sources">受賞情報：<a href="https://www.hontai.or.jp/history/" target="_blank" rel="noopener">本屋大賞公式</a> · 2026年発表分まで</p>`:''}`;
    }
    return `<section class="hq-page ${playing?'hq-playing':''}" aria-labelledby="hq-title"><button class="back-button" data-action="navigate" data-view="home">← ホームへ</button><header class="hq-heading"><p>THE BOOKSHELF CHALLENGE</p><h1 id="hq-title">本屋大賞</h1><span>書店員が選んだ一冊を、記憶から。</span></header>${content}${playing?`<aside class="hq-keyboard" aria-label="日本語入力キーボード">${keyboard()}</aside>`:''}<dialog class="hq-dialog" aria-labelledby="hq-dialog-title"></dialog></section>`;
  }
  function keyboard() {
    const groups=layout==='kana'?['あいうえお','かきくけこ','さしすせそ','たちつてと','なにぬねの','はひふへほ','まみむめも','や「ゆ」よ','らりるれろ','゛゜小','わをんー〜','、。？！・']:['1','2','3','4','5','6','7','8','9',' ','0','・'];
    return `<div class="hq-editor"><span>${esc(fieldName())}</span><div class="hq-composition" aria-live="polite">${esc(value().slice(0,cursor))}<mark>${esc(reading)}</mark><i aria-hidden="true">│</i>${esc(value().slice(cursor))||''}</div></div><div class="hq-candidates">${choices.length?choices.map((c,i)=>btn('candidate',esc(c),`data-choice="${i}"`)).join(''):'<span>かなを入力 → 変換 → 候補を選択</span>'}</div><div class="hq-key-body"><div class="hq-key-grid">${groups.map(g=>g==='゛゜小'?btn('modify','゛゜小'):btn('key',`<b>${g[0]===' '?'空白':esc(g[0])}</b>${g.length>1?`<small>${esc(g.slice(1).split('').join(' '))}</small>`:''}`,`data-chars="${esc(g)}" aria-label="${g===' '?'半角スペース':esc(g)}"`)).join('')}</div><div class="hq-key-tools">${btn('erase','⌫', 'aria-label="一文字削除"')}${btn('layout',layout==='kana'?'123':'かな')}${btn('convert','変換')}${btn('commit','確定')}</div></div><div class="hq-key-footer">${btn('left','←','aria-label="カーソルを左へ"')}${btn('right','→','aria-label="カーソルを右へ"')}${btn('space','空白')}${btn('next','次の欄',stage==='gate'?'disabled':'')}${btn('submit','解答する','class="hq-submit"')}</div><p class="hq-key-help" role="status">${esc(notice||'フリック：中央・左・上・右・下 ／ キーを押すと案内')}</p><div class="hq-flick-guide" hidden aria-hidden="true"></div>`;
  }
  function draw() { const root=document.querySelector('.hq-page'); if(root) { root.outerHTML=markup(); refresh(); } }
  function refresh() {
    const kb=document.querySelector('.hq-keyboard');
    if(kb) { kb.innerHTML=keyboard(); const page=document.querySelector('.hq-page'); page.style.setProperty('--hq-key-height',`${kb.getBoundingClientRect().height}px`); }
    document.querySelectorAll('[data-hq="field"]').forEach(el=>{
      const id=Number(el.dataset.field), v=id<0?year:answers[Math.floor(id/2)][id%2?'author':'title'];
      el.textContent=v|| (id<0?'西暦を入力':'タップして入力');el.classList.toggle('selected',id===active);el.setAttribute('aria-pressed',String(id===active));
    });
    const progress=document.querySelector('#hq-progress');if(progress) progress.textContent=`${answers.flatMap(a=>[a.title,a.author]).filter(Boolean).length} / ${books.length*2} 欄 入力済み`;
  }
  function select(id) { commit();active=id;cursor=value().length;choices=[];notice='';refresh(); requestAnimationFrame(()=>document.querySelector(`[data-field="${id}"]`)?.scrollIntoView({block:'center',behavior:'smooth'})); }
  function type(text) { reading+=text;choices=[];notice='';refresh(); }
  function action(name,el) {
    if(name==='retry') {reset();draw();window.scrollTo(0,0);return;}
    if(name==='synopsis') {
      const b=books[Number(el.dataset.index)],dialog=document.querySelector('.hq-dialog');
      dialog.innerHTML=`${btn('close','閉じる ×','class="hq-close"')}<p>${b.year}年 本屋大賞</p><h2 id="hq-dialog-title">${esc(b.title)}</h2><p>${esc(b.author)}</p><p class="hq-synopsis">${esc(b.synopsis)}</p><a href="${b.source}" target="_blank" rel="noopener">作品紹介の参照元 ↗</a> · <a href="${b.awardSource}" target="_blank" rel="noopener">受賞情報 ↗</a>`;dialog.showModal();return;
    }
    if(name==='close') {document.querySelector('.hq-dialog').close();return;}
    if(!['gate','table'].includes(stage))return;
    if(name==='field'){select(Number(el.dataset.field));return;}
    if(name==='key'){type(el.dataset.chars[0]);return;}
    if(name==='candidate')commit(choices[Number(el.dataset.choice)]);
    if(name==='layout')layout=layout==='kana'?'number':'kana';
    if(name==='space'){commit();insert(' ');}
    if(name==='commit')commit();
    if(name==='convert'){choices=candidates(reading);notice=reading?'候補を選ぶと入力欄に確定します。':'変換したい読みを入力してください。';}
    if(name==='erase') {if(reading)reading=reading.slice(0,-1);else if(cursor>0){const v=value();setValue(v.slice(0,cursor-1)+v.slice(cursor));cursor--;}choices=[];}
    if(name==='left'||name==='right'){commit();cursor=Math.max(0,Math.min(value().length,cursor+(name==='left'?-1:1)));}
    if(name==='modify') {
      const groups=['かが','きぎ','くぐ','けげ','こご','さざ','しじ','すず','せぜ','そぞ','ただ','ちぢ','つづっ','てで','とど','はばぱ','ひびぴ','ふぶぷ','へべぺ','ほぼぽ','あぁ','いぃ','うぅゔ','えぇ','おぉ','やゃ','ゆゅ','よょ','わゎ'];
      if(reading){const last=reading.slice(-1),g=groups.find(g=>g.includes(last));if(g)reading=reading.slice(0,-1)+g[(g.indexOf(last)+1)%g.length];}choices=[];
    }
    if(name==='next'&&stage==='table'){select((active+1)%(books.length*2));return;}
    if(name==='submit'){
      commit();
      if(stage==='gate'){
        if(!year){notice='西暦を入力してください。';refresh();return;}
        stage=year.replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-65248))==='2004'?'table':'failed';active=stage==='table'?0:-1;cursor=0;
      }else stage='result';
      reading='';choices=[];notice='';draw();window.scrollTo(0,0);document.querySelector('#hq-title')?.scrollIntoView();return;
    }
    refresh();
  }
  let gesture=null, suppressClick=false;
  document.addEventListener('pointerdown',e=>{
    const key=e.target.closest('.hq-key-grid [data-chars]');if(!key)return;
    e.preventDefault();key.setPointerCapture(e.pointerId);gesture={key,id:e.pointerId,x:e.clientX,y:e.clientY,chars:key.dataset.chars};
    const guide=document.querySelector('.hq-flick-guide');guide.hidden=false;guide.textContent=`中央 ${gesture.chars[0]}　← ${gesture.chars[1]||'—'}　↑ ${gesture.chars[2]||'—'}　→ ${gesture.chars[3]||'—'}　↓ ${gesture.chars[4]||'—'}`;
  });
  document.addEventListener('pointerup',e=>{
    if(!gesture||gesture.id!==e.pointerId)return;
    const g=gesture;gesture=null;const dx=e.clientX-g.x,dy=e.clientY-g.y;
    const idx=Math.max(Math.abs(dx),Math.abs(dy))<18?0:Math.abs(dx)>Math.abs(dy)?(dx<0?1:3):(dy<0?2:4);
    suppressClick=true;type(g.chars[idx]||g.chars[0]);setTimeout(()=>{suppressClick=false;},0);
  });
  document.addEventListener('pointercancel',()=>{gesture=null;document.querySelector('.hq-flick-guide')?.setAttribute('hidden','');});
  document.addEventListener('click',e=>{const el=e.target.closest('[data-hq]');if(el&&!suppressClick)action(el.dataset.hq,el);});
  document.addEventListener('keydown',e=>{
    if(!document.querySelector('.hq-keyboard')||e.metaKey||e.ctrlKey||e.altKey||e.isComposing)return;
    if(e.key==='Tab'||e.key==='Escape')return;
    // Enter and Space must keep their native button activation behavior.
    if(document.activeElement?.matches('[data-hq]')&&(e.key==='Enter'||e.key===' '))return;
    if(e.key.length===1){e.preventDefault();type(e.key);}
    else if(['Backspace','ArrowLeft','ArrowRight','Enter'].includes(e.key)){e.preventDefault();action({Backspace:'erase',ArrowLeft:'left',ArrowRight:'right',Enter:'commit'}[e.key]);}
  });
  window.addEventListener('resize',()=>{const kb=document.querySelector('.hq-keyboard');if(kb)document.querySelector('.hq-page').style.setProperty('--hq-key-height',`${kb.getBoundingClientRect().height}px`);});
  return {markup,reset,refresh,candidates,correct};
})();
