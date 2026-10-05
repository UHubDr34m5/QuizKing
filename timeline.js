/* The array is always visual order: newest at the top, oldest at the bottom. */
window.TimelineRules = (() => {
  const newestFirst = events => [...events].sort((a, b) => b.date.localeCompare(a.date));
  const isCorrect = events => events.every((event, i) => i === 0 || events[i - 1].date >= event.date);
  const byTag = (events, tag) => tag === '' ? [...events] : events.filter(event => (event.tags || []).includes(tag));
  const tags = events => [...new Set(events.flatMap(event => event.tags || []))];
  function createRound(events, count, random = Math.random) {
    if (!Number.isInteger(count) || count < 2 || count > events.length) throw new RangeError('Invalid card count');
    const pool = [...events];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const cards = pool.slice(0, count);
    // Start with an actual sorting task even when a shuffle happens to be correct.
    if (isCorrect(cards)) {
      const different = cards.findIndex(card => card.date !== cards[0].date);
      if (different > 0) [cards[0], cards[different]] = [cards[different], cards[0]];
    }
    return cards;
  }
  function move(cards, id, direction) {
    const from = cards.findIndex(card => card.id === id), to = from + direction;
    if (![1, -1].includes(direction) || from < 0 || to < 0 || to >= cards.length) return false;
    [cards[from], cards[to]] = [cards[to], cards[from]];
    return true;
  }
  const dateText = date => date.split('-').map(Number).map((part, i) => `${part}${['年','月','日'][i]}`).join('');
  function eventDateText(event) {
    if (!event.dateEnd) return dateText(event.date);
    if (event.date.slice(0,7) === event.dateEnd.slice(0,7)) return `${dateText(event.date).slice(0,-1)}・${Number(event.dateEnd.slice(8))}日`;
    return `${dateText(event.date)}〜${dateText(event.dateEnd)}`;
  }
  function yearGroups(events) {
    const groups = [];
    for (const event of newestFirst(events)) {
      const year = event.date.slice(0,4);
      if (groups.at(-1)?.year !== year) groups.push({year, events:[]});
      groups.at(-1).events.push(event);
    }
    return groups;
  }
  return {newestFirst, isCorrect, createRound, move, dateText, eventDateText, byTag, tags, yearGroups};
})();

window.TimelineQuiz = (() => {
  const events = window.TIMELINE_EVENTS, rules = window.TimelineRules;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let mode = 'menu', cards = [], selectedTag = 'ジブリ', challenge = 'tag', selectedCount = 5, referenceTag = '', complete = false, notice = '';
  const allTags = [...['ジブリ','PIXAR'], ...rules.tags(events).filter(tag => !['ジブリ','PIXAR'].includes(tag))];
  const badges = event => `<span class="tl-tags">${(event.tags || []).map(tag => `<span class="tl-tag">${esc(tag)}</span>`).join('')}</span>`;
  function tagOptions(selected, forQuiz = false) {
    return ['', ...allTags].map(tag => {
      const count = rules.byTag(events, tag).length;
      return `<option value="${esc(tag)}" ${tag === selected ? 'selected' : ''} ${forQuiz && count < 2 ? 'disabled' : ''}>${esc(tag || 'すべて')}（${count}件）${forQuiz && count < 2 ? ' · 2件から出題' : ''}</option>`;
    }).join('');
  }
  const eventLink = event => `<button type="button" class="hq-book-link tl-event-link" data-tl="details" data-id="${event.id}" aria-label="${esc(event.title)}の詳細・説明">${esc(event.title)}</button>`;
  const deckSummary = () => challenge === 'random' ? `全${events.length}件からランダムに${selectedCount}枚を出題します。` : `${selectedTag || 'すべて'}の全${rules.byTag(events, selectedTag).length}件を出題します。`;
  const root = () => document.querySelector('.hq-page[data-subject="timeline"]');
  function enter(next = 'menu') { mode = next; cards = []; complete = false; notice = ''; }
  function leave() { root()?.querySelector('.tl-dialog')?.close(); notice = ''; }
  function answerAxis() {
    const filtered = rules.byTag(events, referenceTag);
    return `<section class="tl-reference" aria-labelledby="tl-reference-title"><div class="tl-reference-heading"><h2 id="tl-reference-title">出来事の年表</h2><span>答え · ${filtered.length}件 / 全${events.length}件</span></div>
      <label class="hq-config-label tl-filter">タグで絞り込む<select id="tl-reference-tag">${tagOptions(referenceTag)}</select></label>
      <p class="hq-note">上ほど新しく、下ほど古い出来事です。<br>出来事の名前を押すと、詳細・説明を読めます。<br>年ごとに表示しています。縦の間隔は経過時間に比例しません。</p>
      <details class="tl-scope"><summary>映画の公開日・収録範囲について</summary><p>日本での初回劇場公開日です（2026年9月29日確認）。PIXARは公開済みの長編31作品、ジブリは公式作品一覧の27作品を収録。『風の谷のナウシカ』『海がきこえる』と、併映短編2作品を含みます。配信・テレビ放送が先の作品も劇場公開日で並べています。</p><p><a href="https://www.ghibli.jp/works/" target="_blank" rel="noopener noreferrer">ジブリ公式作品一覧</a> · <a href="https://www.disney.co.jp/column/pixar-movies" target="_blank" rel="noopener noreferrer">PIXAR公式長編一覧</a></p></details>
      <div class="tl-direction">↑ 新しい</div><div class="tl-years">${rules.yearGroups(filtered).map(group => `<section class="tl-year" aria-label="${group.year}年"><h3>${group.year}<small>年</small></h3><ol class="tl-events">${group.events.map(event => `<li><span class="tl-dot" aria-hidden="true"></span><time datetime="${event.date}">${rules.eventDateText(event)}</time>${eventLink(event)}${badges(event)}${event.note || event.source ? `<details class="tl-event-details"><summary>補足・出典</summary>${event.note ? `<p>${esc(event.note)}</p>` : ''}${event.source ? `<a href="${esc(event.source)}" target="_blank" rel="noopener noreferrer">出典を見る ↗</a>` : ''}</details>` : ''}</li>`).join('')}</ol></section>`).join('')}</div>
      <div class="tl-direction tl-direction-bottom">↓ 古い</div></section>`;
  }
  function menu() {
    return `<div class="tl-mode"><a href="#timeline/sort" class="hq-choice"><span class="hq-mode-number">01 / ORDER</span><strong>並び替えモード</strong><span>タグ別、または枚数を選んでランダムに。<br>出来事のカードを<br>新しいものが上になるように並べよう。</span><b>挑戦する →</b></a></div>${answerAxis()}`;
  }
  function setup() {
    return `<form id="tl-setup" class="hq-gate"><span class="hq-step">出題方法を選択</span><h2>どの方法で挑戦する？</h2>
      <fieldset class="tl-challenge"><legend>出題方法</legend><label><input type="radio" name="challenge" value="tag" ${challenge === 'tag' ? 'checked' : ''}>タグで挑戦</label><label><input type="radio" name="challenge" value="random" ${challenge === 'random' ? 'checked' : ''}>ランダムで挑戦</label></fieldset>
      ${challenge === 'tag' ? `<label class="hq-config-label">出題するタグ<select name="tag" id="tl-quiz-tag">${tagOptions(selectedTag, true)}</select></label>` : `<label class="hq-config-label">出題する枚数<select name="count" id="tl-quiz-count">${Array.from({length: events.length - 1}, (_, i) => i + 2).map(n => `<option value="${n}" ${n === selectedCount ? 'selected' : ''}>${n}枚</option>`).join('')}</select></label>`}
      <p id="tl-deck-summary" role="status">${deckSummary()}</p>
      <p>新しい出来事が上、古い出来事が下です。<br>同じ日付のカードは、どちらが上でも正解です。<br>映画は日本の劇場公開日で並べます。</p><button type="submit" class="hq-primary">並び替えを始める</button></form>`;
  }

  function play() {
    return `<p class="tl-deck-label">${challenge === 'random' ? 'ランダム' : esc(selectedTag || 'すべて')} · ${cards.length}枚</p><p class="hq-instructions">${complete ? '日付を見ながら、出来事の順番を振り返りましょう。' : '「↑ 上へ」「↓ 下へ」または移動先の番号でカードを動かしてください。<br>同じ日付はどちらの順でも正解です。すべて並べ終わったら「答え合わせ」を押します。'}</p>
      <p class="hq-note">出来事の名前を押すと、日付と詳細・説明を読めます（ネタバレあり）。</p><div class="tl-play-direction">↑ 新しい出来事</div>
      <ol class="tl-cards" aria-label="上から新しい順に並び替えるカード">${cards.map((event, i) => `<li class="tl-card ${complete ? 'tl-correct' : ''}" data-event="${event.id}"><span class="tl-position" aria-hidden="true">${i + 1}</span><div class="tl-card-copy">${complete ? `<time datetime="${event.date}">${rules.eventDateText(event)}</time>` : ''}${eventLink(event)}${badges(event)}</div>${!complete ? `<div class="tl-controls"><label class="tl-jump">移動先<select data-tl-position="${event.id}" aria-label="${esc(event.title)}の移動先">${cards.map((_, n) => `<option value="${n}" ${i === n ? 'selected' : ''}>${n + 1}番</option>`).join('')}</select></label><button type="button" data-tl="up" data-id="${event.id}" ${i === 0 ? 'disabled' : ''} aria-label="${esc(event.title)}を上へ">↑ 上へ</button><button type="button" data-tl="down" data-id="${event.id}" ${i === cards.length - 1 ? 'disabled' : ''} aria-label="${esc(event.title)}を下へ">↓ 下へ</button></div>` : '<span class="tl-check" aria-label="正解">✓</span>'}</li>`).join('')}</ol>
      <div class="tl-play-direction">↓ 古い出来事</div>
      <div class="tl-feedback ${complete ? 'is-success' : ''}" role="status" tabindex="-1">${esc(notice)}</div>
      <div class="hq-end-actions">${complete ? '<button type="button" class="hq-primary" data-tl="retry">条件を選んでもう一度</button><a class="hq-secondary" href="#timeline">年表を見る</a>' : '<button type="button" class="hq-primary" data-tl="check">答え合わせ</button><button type="button" class="hq-secondary" data-tl="retry">出題条件を選び直す</button>'}</div>`;
  }
  function markup() {
    return `<section class="hq-page tl-page" data-subject="timeline" aria-labelledby="hq-title"><a class="hq-back" href="${mode === 'menu' ? '#' : '#timeline'}">← ${mode === 'menu' ? 'ホームへ' : '年表へ'}</a><header class="hq-heading"><p>THE TIMELINE CHALLENGE${mode === 'menu' ? '' : ' / 年表'}</p><h1 id="hq-title" tabindex="-1">${mode === 'menu' ? '年表' : '並び替えモード'}</h1></header>${mode === 'menu' ? menu() : cards.length ? play() : setup()}<dialog class="hq-dialog tl-dialog" aria-labelledby="tl-dialog-title"></dialog></section>`;
  }
  function draw() { const page = root(); if (page) page.outerHTML = markup(); }
  document.addEventListener('submit', event => {
    if (!root() || event.target.id !== 'tl-setup') return;
    event.preventDefault();
    const data = new FormData(event.target), kind = data.get('challenge');
    if (!['tag', 'random'].includes(kind)) return;
    const value = data.get('tag');
    if (kind === 'tag' && value !== '' && !allTags.includes(value)) return;
    const pool = kind === 'random' ? events : rules.byTag(events, value);
    const count = kind === 'random' ? Number(data.get('count')) : pool.length;
    if (!Number.isInteger(count) || count < 2 || count > pool.length) return;
    challenge = kind;
    if (kind === 'tag') selectedTag = value; else selectedCount = count;
    cards = rules.createRound(pool, count); complete = false; notice = ''; draw();
    window.scrollTo(0,0); document.getElementById('hq-title')?.focus({preventScroll:true});
  });
  document.addEventListener('change', event => {
    if (!root()) return;
    if (event.target.name === 'challenge' && ['tag', 'random'].includes(event.target.value)) {
      challenge = event.target.value; draw();
      root().querySelector(`input[value="${challenge}"]`).focus({preventScroll:true});
    }
    if (event.target.id === 'tl-quiz-count') {
      selectedCount = Number(event.target.value);
      root().querySelector('#tl-deck-summary').textContent = deckSummary();
    }
    if (event.target.id === 'tl-quiz-tag') {
      selectedTag = event.target.value;
      root().querySelector('#tl-deck-summary').textContent = deckSummary();
    }
    if (event.target.id === 'tl-reference-tag') {
      referenceTag = event.target.value; draw();
      root().querySelector('#tl-reference-tag').focus({preventScroll:true});
    }
    if (event.target.matches('[data-tl-position]') && !complete) {
      const id = event.target.dataset.tlPosition;
      const from = cards.findIndex(card => card.id === id), to = Number(event.target.value);
      if (from < 0 || !Number.isInteger(to) || to < 0 || to >= cards.length) return;
      cards.splice(to, 0, cards.splice(from, 1)[0]); notice = ''; draw();
      const moved = root().querySelector(`[data-tl-position="${id}"]`);
      moved.focus({preventScroll:true}); moved.closest('.tl-card').scrollIntoView({block:'nearest'});
    }
  });
  document.addEventListener('click', event => {
    if (!root()) return;
    const button = event.target.closest('[data-tl]'); if (!button) return;
    const action = button.dataset.tl;
    if (action === 'details') {
      const item = events.find(item => item.id === button.dataset.id);
      if (!item) return;
      const dialog = root().querySelector('.tl-dialog');
      dialog.innerHTML = `<button type="button" data-tl="close" class="hq-close" autofocus>閉じる ×</button><p>詳細・説明 · ネタバレあり</p><h2 id="tl-dialog-title">${esc(item.title)}</h2><time datetime="${item.date}">${rules.eventDateText(item)}</time>${badges(item)}<div class="hq-synopsis">${item.description.split(/\n\n+/).map(p => `<p>${esc(p)}</p>`).join('')}</div>${item.note ? `<p class="hq-note">${esc(item.note)}</p>` : ''}<div class="tl-sources">${item.detailSource ? `<a href="${esc(item.detailSource)}" target="_blank" rel="noopener noreferrer">説明の参考資料 ↗</a>` : ''}${item.source ? `<a href="${esc(item.source)}" target="_blank" rel="noopener noreferrer">日付・収録情報の出典 ↗</a>` : ''}</div>`;
      dialog.showModal(); dialog.scrollTop = 0;
    }
    if (action === 'close') root().querySelector('.tl-dialog').close();
    if (action === 'retry') { enter('sort'); draw(); window.scrollTo(0,0); document.getElementById('hq-title')?.focus({preventScroll:true}); }
    if (action === 'check' && cards.length && !complete) {
      complete = rules.isCorrect(cards); notice = complete ? `正解！ ${cards.length}枚すべて、正しい順番です。` : 'まだ順番が違います。新しい出来事が上になるように、もう一度並び替えてみましょう。';
      draw(); root().querySelector('.tl-feedback').focus();
    }
    if ((action === 'up' || action === 'down') && !complete) {
      if (!rules.move(cards, button.dataset.id, action === 'up' ? -1 : 1)) return;
      notice = ''; draw();
      // Keep keyboard focus on the card that moved, including at the list boundaries.
      const moved = root().querySelector(`[data-event="${button.dataset.id}"]`);
      (moved.querySelector(`[data-tl="${action}"]:not(:disabled)`) || moved.querySelector('button:not(:disabled)')).focus({preventScroll:true});
      moved.scrollIntoView({block:'nearest'});
    }
  });
  return {enter, leave, markup, refresh() {}};
})();
