/* The array is always visual order: newest at the top, oldest at the bottom. */
window.TimelineRules = (() => {
  const newestFirst = events => [...events].sort((a, b) => b.date.localeCompare(a.date));
  const isCorrect = events => events.every((event, i) => i === 0 || events[i - 1].date >= event.date);
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
  function axis(events) {
    const sorted = newestFirst(events);
    const firstYear = Number(sorted.at(-1).date.slice(0,4));
    const lastYear = Number(sorted[0].date.slice(0,4));
    const startYear = Math.floor(firstYear / 10) * 10, endYear = Math.floor(lastYear / 10) * 10 + 10;
    const start = Date.UTC(startYear,0,1), end = Date.UTC(endYear,0,1), span = end - start;
    const gaps = sorted.slice(1).map((event, i) => Date.parse(sorted[i].date) - Date.parse(event.date)).filter(gap => gap > 0);
    const minGap = Math.min(...gaps);
    const height = Math.ceil(Math.max(660, (endYear - startYear) * 16, Number.isFinite(minGap) ? span / minGap * 100 : 0));
    return {sorted, startYear, endYear, height, position: date => (end - Date.parse(date)) / span * 100};
  }
  return {newestFirst, isCorrect, createRound, move, dateText, axis};
})();

window.TimelineQuiz = (() => {
  const events = window.TIMELINE_EVENTS, rules = window.TimelineRules;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let mode = 'menu', cards = [], count = Math.min(5, events.length), complete = false, notice = '';
  const root = () => document.querySelector('.hq-page[data-subject="timeline"]');
  function enter(next = 'menu') { mode = next; cards = []; complete = false; notice = ''; }
  function leave() { notice = ''; }
  function answerAxis() {
    const axis = rules.axis(events);
    const ticks = [];
    for (let year = axis.endYear; year >= axis.startYear; year -= 10) ticks.push(`<span class="tl-tick" style="top:${axis.position(`${year}-01-01`)}%">${year}</span>`);
    return `<section class="tl-reference" aria-labelledby="tl-reference-title"><div class="tl-reference-heading"><h2 id="tl-reference-title">出来事の年表</h2><span>答え · 全${events.length}件</span></div>
      <p class="hq-note">上ほど新しく、下ほど古い出来事です。目盛りは10年ごと。</p><div class="tl-direction">↑ 新しい</div>
      <div class="tl-axis" style="--axis-height:${axis.height}px"><div class="tl-ticks" aria-hidden="true">${ticks.join('')}</div>
      <ol class="tl-events" aria-label="新しい出来事から古い出来事の順">${axis.sorted.map(event => `<li style="top:${axis.position(event.date)}%"><span class="tl-dot" aria-hidden="true"></span><time datetime="${event.date}">${rules.dateText(event.date)}</time><strong>${esc(event.title)}</strong></li>`).join('')}</ol></div>
      <div class="tl-direction tl-direction-bottom">↓ 古い</div></section>`;
  }
  function menu() {
    return `${answerAxis()}<div class="tl-mode"><a href="#timeline/sort" class="hq-choice"><span class="hq-mode-number">01 / ORDER</span><strong>並び替えモード</strong><span>出来事のカードを、<br>新しいものが上になるように並べよう。</span><b>挑戦する →</b></a></div>`;
  }
  function setup() {
    return `<form id="tl-setup" class="hq-gate"><span class="hq-step">出題数を選択</span><h2>何枚のカードに挑戦する？</h2>
      <label class="hq-config-label">カードの枚数<select name="count" required>${Array.from({length:events.length - 1},(_,i) => i + 2).map(n => `<option value="${n}" ${n === count ? 'selected' : ''}>${n}枚</option>`).join('')}</select></label>
      <p>登録された${events.length}件からランダムに出題します。<br>新しい出来事が上、古い出来事が下です。</p><button type="submit" class="hq-primary">並び替えを始める</button></form>`;
  }
  function play() {
    return `<p class="hq-instructions">${complete ? '日付を見ながら、出来事の順番を振り返りましょう。' : '「↑ 上へ」「↓ 下へ」でカードを動かしてください。<br>すべて並べ終わったら「答え合わせ」を押します。'}</p>
      <div class="tl-play-direction">↑ 新しい出来事</div>
      <ol class="tl-cards" aria-label="上から新しい順に並び替えるカード">${cards.map((event, i) => `<li class="tl-card ${complete ? 'tl-correct' : ''}" data-event="${event.id}"><span class="tl-position" aria-hidden="true">${i + 1}</span><div class="tl-card-copy">${complete ? `<time datetime="${event.date}">${rules.dateText(event.date)}</time>` : ''}<strong>${esc(event.title)}</strong></div>${!complete ? `<div class="tl-controls"><button type="button" data-tl="up" data-id="${event.id}" ${i === 0 ? 'disabled' : ''} aria-label="${esc(event.title)}を上へ">↑ 上へ</button><button type="button" data-tl="down" data-id="${event.id}" ${i === cards.length - 1 ? 'disabled' : ''} aria-label="${esc(event.title)}を下へ">↓ 下へ</button></div>` : '<span class="tl-check" aria-label="正解">✓</span>'}</li>`).join('')}</ol>
      <div class="tl-play-direction">↓ 古い出来事</div>
      <div class="tl-feedback ${complete ? 'is-success' : ''}" role="status" tabindex="-1">${esc(notice)}</div>
      <div class="hq-end-actions">${complete ? '<button type="button" class="hq-primary" data-tl="retry">枚数を選んでもう一度</button><a class="hq-secondary" href="#timeline">年表を見る</a>' : '<button type="button" class="hq-primary" data-tl="check">答え合わせ</button><button type="button" class="hq-secondary" data-tl="retry">枚数を選び直す</button>'}</div>`;
  }
  function markup() {
    return `<section class="hq-page tl-page" data-subject="timeline" aria-labelledby="hq-title"><a class="hq-back" href="${mode === 'menu' ? '#' : '#timeline'}">← ${mode === 'menu' ? 'ホームへ' : '年表へ'}</a><header class="hq-heading"><p>THE TIMELINE CHALLENGE${mode === 'menu' ? '' : ' / 年表'}</p><h1 id="hq-title" tabindex="-1">${mode === 'menu' ? '年表' : '並び替えモード'}</h1></header>${mode === 'menu' ? menu() : cards.length ? play() : setup()}</section>`;
  }
  function draw() { const page = root(); if (page) page.outerHTML = markup(); }
  document.addEventListener('submit', event => {
    if (!root() || event.target.id !== 'tl-setup') return;
    event.preventDefault();
    const value = Number(new FormData(event.target).get('count'));
    if (!Number.isInteger(value) || value < 2 || value > events.length) return;
    count = value; cards = rules.createRound(events, count); complete = false; notice = ''; draw();
    window.scrollTo(0,0); document.getElementById('hq-title')?.focus({preventScroll:true});
  });
  document.addEventListener('click', event => {
    if (!root()) return;
    const button = event.target.closest('[data-tl]'); if (!button) return;
    const action = button.dataset.tl;
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
