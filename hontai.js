/* Native browser inputs and two independent book quiz modes. */
window.HontaiQuiz = (() => {
  const books = window.HONTAI_BOOKS;
  const memory = window.HontaiMemory;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const family = ['小川','恩田',null,'佐藤','伊坂','湊','冲方','東川','三浦','百田','和田','上橋','宮下','恩田','辻村','瀬尾','凪良','町田','逢坂','凪良','宮島','阿部','朝井'];
  const labels = { year: '西暦', title: '作品名', author: '作者名' };
  let mode = 'menu', stage = 'gate', year = '', answers = [], game = null;
  let notice = '', matchTimer = null, composing = false, record = null;
  function storage() {
    try { return window.localStorage; } catch { return { getItem() { return null; }, setItem() { throw Error('unavailable'); } }; }
  }
  function correct(value, index, field) {
    const b = books[index];
    if (field === 'title' || !family[index]) return value === b[field];
    const surname = family[index], given = b.author.slice(surname.length);
    return value === b.author || new RegExp(`^${surname}[ 　]+${given}$`).test(value);
  }
  function leave() { clearTimeout(matchTimer); matchTimer = null; composing = false; }
  function enter(nextMode = 'menu') {
    leave(); mode = nextMode; notice = ''; record = null;
    if (mode === 'perfect') {
      stage = 'gate'; year = ''; answers = books.map(() => ({ title: '', author: '' }));
    }
    if (mode === 'memory') game = memory.createGame(books);
  }
  const button = (action, label, attrs = '') => `<button type="button" data-hq="${action}" ${attrs}>${label}</button>`;
  function bestText() { const best = memory.readBest(storage(), books); return best ? `${best.tries}トライ` : 'まだ記録なし'; }
  function menuMarkup() {
    return `<p class="hq-intro">思い出して書く。めくって揃える。<br>今日の挑戦を選んでください。</p>
      <div class="hq-modes">
        ${button('start-perfect', '<span class="hq-mode-number">01 / RECALL</span><strong>パーフェクト暗記モード</strong><span>年代を手がかりに、<br>作品名と作者名を答える。</span><small>最初は「本屋大賞が始まった年は？」</small><b aria-hidden="true">挑戦する →</b>', 'class="hq-choice"')}
        ${button('start-memory', `<span class="hq-mode-number">02 / MATCH</span><strong>神経衰弱モード</strong><span>西暦・作品・作者の3枚を揃えて、<br>自分の記録を超えよう。</span><small>自己ベスト：${bestText()}</small><b aria-hidden="true">挑戦する →</b>`, 'class="hq-choice"')}
      </div><p class="hq-note">神経衰弱の自己ベストは、この端末のブラウザに保存されます。</p>
      <section class="hq-answer-list" aria-labelledby="hq-answer-list-title">
        <h2 id="hq-answer-list-title">年別の本屋大賞一覧（答え）</h2>
        <p class="hq-note">挑戦の前に、歴代の受賞作を確認できます。</p>
        <table class="hq-reference-table">
          <caption class="hq-sr">本屋大賞の受賞年・作品名・作者名</caption>
          <colgroup><col class="hq-reference-year"><col><col class="hq-reference-author"></colgroup>
          <thead><tr><th scope="col">西暦</th><th scope="col">作品名</th><th scope="col">作者名</th></tr></thead>
          <tbody>${[...books].sort((a, b) => a.year - b.year).map(b => `<tr><th scope="row">${b.year}</th><td>${esc(b.title)}</td><td>${esc(b.author)}</td></tr>`).join('')}</tbody>
        </table>
      </section>`;
  }
  function inputCell(index, field) {
    const b = books[index], value = answers[index][field];
    if (stage === 'result') {
      const ok = correct(value, index, field);
      return `<td class="hq-result ${ok ? 'hq-correct' : 'hq-wrong'}"><span class="hq-verdict">${ok ? '○ 正解' : '× 不正解'}</span>
        ${field === 'title' ? button('synopsis', esc(b.title), `data-index="${index}" class="hq-book-link" aria-label="${esc(b.title)}のあらすじ"`) : `<strong>${esc(b.author)}</strong>`}
        ${!ok ? `<small>あなたの解答：${esc(value || '未解答')}</small>` : ''}</td>`;
    }
    return `<td><textarea class="hq-input" name="${index}-${field}" data-index="${index}" data-field="${field}" rows="2" lang="ja" inputmode="text" enterkeyhint="next" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" maxlength="200" aria-label="${b.year}年 ${labels[field]}" placeholder="${labels[field]}を入力">${esc(value)}</textarea></td>`;
  }
  function perfectMarkup() {
    if (stage === 'gate') return `<form id="hq-gate-form" class="hq-gate">
      <span class="hq-step">最初の一問</span><h2>本屋大賞が始まった年は？</h2>
      <p>西暦で答えてください。<br>正解すると歴代受賞作のクイズへ。間違えると終了です。</p>
      <label class="hq-year-label">西暦<input id="hq-year" name="year" type="text" inputmode="numeric" autocomplete="off" maxlength="4" value="${esc(year)}" aria-describedby="hq-gate-notice" placeholder="4桁で入力"><span>年</span></label>
      <p id="hq-gate-notice" class="hq-notice" role="status">${esc(notice)}</p><button class="hq-primary" type="submit">解答する</button></form>`;
    if (stage === 'failed') return `<div class="hq-gate"><span class="hq-step">チャレンジ終了</span><h2>正解は2004年でした</h2><p>あなたの解答：${esc(year)}</p><p>第1回の本屋大賞は2004年に開催されました。</p><a href="${books[0].awardSource}" target="_blank" rel="noopener">公式の発表を見る ↗</a><div class="hq-end-actions">${button('retry-perfect', 'もう一度挑戦', 'class="hq-primary"')}</div></div>`;
    const score = answers.reduce((n, a, i) => n + Number(correct(a.title, i, 'title')) + Number(correct(a.author, i, 'author')), 0);
    const intro = stage === 'result' ? `<div class="hq-score"><span>答え合わせ</span><strong>${score}<small> / ${books.length * 2} 正解</small></strong><p>作品名をタップすると、あらすじが読めます。</p></div>`
      : `<p class="hq-instructions">作品名と作者名を正式表記で入力してください。<br>作品名は副題・句読点も含めて一致。作者名は姓と名の間の半角・全角スペースを許可します。</p><p class="hq-note">副題の前は半角スペース、巻数は入力不要です。</p>`;
    const table = `<table class="hq-table"><caption class="hq-sr">歴代本屋大賞 ${stage === 'result' ? '答え合わせ' : '解答欄'}</caption><colgroup><col class="hq-year-col"><col><col class="hq-author-col"></colgroup><thead><tr><th scope="col">西暦</th><th scope="col">作品名</th><th scope="col">作者名</th></tr></thead><tbody>${books.map((b, i) => `<tr><th scope="row">${b.year}</th>${inputCell(i, 'title')}${inputCell(i, 'author')}</tr>`).join('')}</tbody></table>`;
    return intro + (stage === 'result' ? `${table}<div class="hq-end-actions">${button('retry-perfect', 'もう一度挑戦', 'class="hq-primary"')}</div><p class="hq-note">受賞情報：<a href="https://www.hontai.or.jp/history/" target="_blank" rel="noopener">本屋大賞公式</a> · 2026年発表分まで</p>`
      : `<form id="hq-answer-form">${table}<div class="hq-submit-bar"><span id="hq-progress"></span><button class="hq-primary" type="submit">解答する</button></div></form>`);
  }
  function memoryStatus() {
    if (game.phase === 'review') return game.matched ? '3枚揃いました！' : 'この3枚は揃いませんでした。内容を確認して次へ。';
    return game.selected.length ? `あと${3 - game.selected.length}枚めくってください。` : 'カードを3枚めくってください。';
  }
  function memoryHud() {
    const picks = game.selected.map(id => game.deck.find(c => c.id === id));
    return `<div class="hq-memory-stats"><span>今回<strong>${game.tries}<small> トライ</small></strong></span><span>残り<strong>${game.deck.length - game.removed.length}<small> 枚</small></strong></span><span>自己ベスト<strong class="hq-best-value">${bestText()}</strong></span></div>
      <div class="hq-picks">${[0, 1, 2].map(i => `<div>${picks[i] ? `<small>${labels[picks[i].kind]}</small><span>${esc(picks[i].value)}</span>` : `<span class="hq-pick-empty">${i + 1}枚目</span>`}</div>`).join('')}</div>
      <div class="hq-memory-message"><p role="status">${memoryStatus()}</p>${game.phase === 'review' && !game.matched ? button('next-try', '次のトライ →', 'class="hq-primary"') : ''}</div>`;
  }
  function cardMarkup(card, index) {
    const removed = game.removed.includes(card.id), open = game.selected.includes(card.id);
    return button('flip', open ? `<small>${labels[card.kind]}</small><span>${esc(card.value)}</span>` : `<span class="hq-card-back" aria-hidden="true">本</span><small aria-hidden="true">${String(index + 1).padStart(2, '0')}</small>`,
      `class="hq-card ${open ? 'is-open' : ''} ${removed ? 'is-removed' : ''}" data-card="${card.id}" ${removed || open || game.phase !== 'choosing' ? 'disabled' : ''} ${removed ? 'aria-hidden="true"' : ''} aria-label="${open ? `${labels[card.kind]}：${esc(card.value)}` : `カード${index + 1}をめくる`}"`);
  }
  function memoryMarkup() {
    if (game.phase === 'complete') {
      const previous = record?.previous;
      const achievement = !previous || game.tries < previous.tries ? '自己ベスト更新！' : game.tries === previous.tries ? '自己ベストタイ！' : `自己ベストまで、あと${game.tries - previous.tries}トライ。`;
      return `<div class="hq-complete"><p class="hq-step">ALL MATCHED</p><h2>全${books.length}組、コンプリート！</h2><strong class="hq-final-tries">${game.tries}<small> トライ</small></strong><p>${achievement}</p><p>自己ベスト：${record?.best?.tries ?? game.tries}トライ</p>${record?.saved === false ? '<p class="hq-note">ブラウザの保存領域を利用できないため、今回の記録は保存できませんでした。</p>' : '<p class="hq-note">記録をこの端末のブラウザに保存しました。</p>'}<div class="hq-end-actions">${button('retry-memory', 'もう一度挑戦', 'class="hq-primary"')}<a class="hq-secondary" href="#hontai">モード選択へ</a></div></div>`;
    }
    return `<p class="hq-instructions">西暦・作品名・作者名を1枚ずつ、同じ受賞作の3枚に揃えよう。<br>3枚めくると1トライ。${books.length}組すべてを揃えるまでの最少トライ数に挑戦！</p><details class="hq-rules"><summary>遊び方と記録について</summary><p>揃ったカードは消え、残りのカードの位置は変わりません。同じ作者名のカードは、どちらを使っても正解です。揃わなかった3枚は「次のトライ」で裏返します。</p><p>自己ベストはこの端末・ブラウザに保存します。途中で戻ったり再読み込みしたりすると、そのゲームは終了します。</p></details>
      <div id="hq-memory-hud" class="hq-memory-hud">${memoryHud()}</div><div class="hq-card-grid" aria-label="神経衰弱のカード">${game.deck.map(cardMarkup).join('')}</div>`;
  }
  function markup() {
    const title = mode === 'perfect' ? 'パーフェクト暗記モード' : mode === 'memory' ? '神経衰弱モード' : '本屋大賞';
    return `<section class="hq-page hq-${mode}" aria-labelledby="hq-title"><a class="hq-back" href="${mode === 'menu' ? '#' : '#hontai'}">← ${mode === 'menu' ? 'ホームへ' : 'モード選択へ'}</a><header class="hq-heading"><p>THE BOOKSHELF CHALLENGE${mode !== 'menu' ? ' / 本屋大賞' : ''}</p><h1 id="hq-title" tabindex="-1">${title}</h1></header>${mode === 'menu' ? menuMarkup() : mode === 'perfect' ? perfectMarkup() : memoryMarkup()}<dialog class="hq-dialog" aria-labelledby="hq-dialog-title"></dialog></section>`;
  }
  function grow(input) { input.style.height = 'auto'; input.style.height = `${Math.max(64, input.scrollHeight)}px`; }
  function refresh() {
    document.querySelectorAll('.hq-input').forEach(grow);
    const progress = document.getElementById('hq-progress');
    if (progress) progress.textContent = `${answers.flatMap(a => [a.title, a.author]).filter(Boolean).length} / ${books.length * 2} 欄 入力済み`;
  }
  function draw() {
    const root = document.querySelector('.hq-page');
    if (root) { root.outerHTML = markup(); refresh(); }
  }
  function drawMemory() {
    if (mode !== 'memory') return;
    if (game.phase === 'complete') {
      record = memory.saveBest(storage(), books, game.tries);
      draw(); window.scrollTo(0, 0); document.getElementById('hq-title')?.focus({ preventScroll: true }); return;
    }
    const hud = document.getElementById('hq-memory-hud');
    if (!hud) return;
    hud.innerHTML = memoryHud();
    document.querySelectorAll('.hq-card').forEach((el, i) => { el.outerHTML = cardMarkup(game.deck[i], i); });
  }
  function finishForm(form) {
    if (composing) return;
    const data = new FormData(form);
    if (form.id === 'hq-gate-form') {
      year = String(data.get('year') || '').trim();
      if (!year) { notice = '西暦を入力してください。'; document.getElementById('hq-gate-notice').textContent = notice; return; }
      stage = year.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 65248)) === '2004' ? 'table' : 'failed';
    } else {
      answers = books.map((_, i) => ({ title: String(data.get(`${i}-title`) || ''), author: String(data.get(`${i}-author`) || '') }));
      stage = 'result';
    }
    document.activeElement?.blur(); draw(); window.scrollTo(0, 0); document.getElementById('hq-title')?.focus({ preventScroll: true });
  }
  document.addEventListener('input', event => {
    const input = event.target;
    if (input.matches('.hq-input')) {
      answers[Number(input.dataset.index)][input.dataset.field] = input.value;
      grow(input);
      const progress = document.getElementById('hq-progress');
      if (progress) progress.textContent = `${answers.flatMap(a => [a.title, a.author]).filter(Boolean).length} / ${books.length * 2} 欄 入力済み`;
    }
    if (input.id === 'hq-year') year = input.value;
  });
  document.addEventListener('keydown', event => {
    if (!event.target.matches('.hq-input') || event.key !== 'Enter' || event.isComposing || composing) return;
    event.preventDefault();
    const fields = [...document.querySelectorAll('.hq-input')];
    const next = fields[fields.indexOf(event.target) + 1] || document.querySelector('#hq-answer-form [type="submit"]');
    next?.focus();
  });
  document.addEventListener('compositionstart', event => { if (event.target.closest('.hq-page')) composing = true; });
  document.addEventListener('compositionend', event => { if (event.target.closest('.hq-page')) composing = false; });
  document.addEventListener('submit', event => {
    if (!['hq-gate-form', 'hq-answer-form'].includes(event.target.id)) return;
    event.preventDefault(); finishForm(event.target);
  });
  document.addEventListener('click', event => {
    const el = event.target.closest('[data-hq]');
    if (!el) return;
    const action = el.dataset.hq;
    if (action === 'start-perfect') location.hash = 'hontai/perfect';
    if (action === 'start-memory') location.hash = 'hontai/memory';
    if (action === 'retry-perfect' || action === 'retry-memory') { enter(action === 'retry-perfect' ? 'perfect' : 'memory'); draw(); window.scrollTo(0, 0); }
    if (action === 'flip' && mode === 'memory' && memory.flip(game, el.dataset.card, books)) {
      drawMemory();
      if (game.phase === 'review' && game.matched) {
        const current = game;
        matchTimer = setTimeout(() => { if (game === current && mode === 'memory') { memory.resolve(game); drawMemory(); } }, 850);
      }
    }
    if (action === 'next-try' && mode === 'memory' && game.phase === 'review' && !game.matched) { memory.resolve(game); drawMemory(); }
    if (action === 'synopsis') {
      const b = books[Number(el.dataset.index)], dialog = document.querySelector('.hq-dialog');
      dialog.innerHTML = `${button('close', '閉じる ×', 'class="hq-close"')}<p>${b.year}年 本屋大賞</p><h2 id="hq-dialog-title">${esc(b.title)}</h2><p>${esc(b.author)}</p><p class="hq-synopsis">${esc(b.synopsis)}</p><a href="${b.source}" target="_blank" rel="noopener">作品紹介の参照元 ↗</a> · <a href="${b.awardSource}" target="_blank" rel="noopener">受賞情報 ↗</a>`;
      dialog.showModal();
    }
    if (action === 'close') document.querySelector('.hq-dialog').close();
  });
  return { enter, leave, markup, refresh, correct };
})();
