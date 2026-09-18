const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {window:{}, document:{addEventListener(){}}, clearTimeout, setTimeout};
vm.createContext(context);
for (const name of ['hontai-data.js', 'hontai-memory.js', 'hontai.js']) vm.runInContext(fs.readFileSync(`${__dirname}/../${name}`,'utf8'), context);
const {HONTAI_BOOKS:books,HontaiQuiz:quiz,HontaiMemory:memory} = context.window;
test('All official entries remain strictly gradable', () => {
  assert.equal(books.length,23);
  books.forEach((b,i) => {
    assert.equal(b.year,2004+i);
    for (const field of ['title','author']) {
      assert.ok(quiz.correct(b[field],i,field));
      assert.ok(!quiz.correct(b[field]+'誤',i,field));
    }
    assert.ok(b.synopsis && b.source.startsWith('https://'));
  });
  for (const name of ['小川 洋子','小川　洋子']) assert.ok(quiz.correct(name,0,'author'));
  for (const name of ['小 川洋子','小川洋 子','小川\t洋子',' 小川洋子','小川洋子 ']) assert.ok(!quiz.correct(name,0,'author'));
  assert.ok(!quiz.correct('沖方丁',6,'author'));
  assert.ok(!quiz.correct('三浦しおん',8,'author'));
  assert.ok(!quiz.correct('博士の愛した数式 ',0,'title'));
  assert.ok(!quiz.correct('東京タワー',2,'title'));
  assert.ok(!quiz.correct('同志少女よ敵を撃て',18,'title'));
});
test('Shuffling keeps all 69 cards with unique identities', () => {
  const a = memory.shuffledDeck(books, () => 0);
  assert.equal(a.length,69);
  assert.equal(new Set(a.map(c => c.id)).size,69);
  for (const kind of ['year','title','author']) assert.equal(a.filter(c => c.kind === kind).length,23);
  assert.notEqual(a[0].id,`${books[0].year}-year`);
});
test('Matching uses one of each type and the printed author, including duplicates', () => {
  const deck = memory.shuffledDeck(books);
  const cards = (...ids) => ids.map(id => deck.find(c => c.id === id));
  assert.ok(memory.isMatch(cards('2005-year','2005-title','2017-author'),books));
  assert.ok(memory.isMatch(cards('2020-year','2020-title','2023-author'),books));
  assert.ok(!memory.isMatch(cards('2004-year','2005-title','2005-author'),books));
  assert.ok(!memory.isMatch(cards('2005-year','2005-title','2004-author'),books));
  assert.ok(!memory.isMatch(cards('2005-year','2005-year','2005-author'),books));
  assert.ok(!memory.isMatch(cards('2004-year','2005-year','2006-year'),books));
});
test('A try is counted only on the third unique card and review blocks further taps', () => {
  const g = memory.createGame(books);
  assert.equal(memory.flip(g,'missing',books),false);
  memory.flip(g,'2004-year',books);
  assert.equal(memory.flip(g,'2004-year',books),false);
  assert.equal(g.tries,0);
  memory.flip(g,'2005-year',books);
  assert.equal(g.tries,0);
  memory.flip(g,'2006-year',books);
  assert.equal(g.tries,1);
  assert.equal(g.phase,'review');
  assert.equal(g.matched,false);
  assert.equal(memory.flip(g,'2007-year',books),false);
  memory.resolve(g);
  assert.equal(g.removed.length,0);
  assert.equal(g.selected.length,0);
  assert.equal(g.phase,'choosing');
});
test('All 23 triples can be cleared even with swapped duplicate author cards', () => {
  const g = memory.createGame(books);
  books.forEach(b => {
    const authorYear = ({2005:2017,2017:2005,2020:2023,2023:2020})[b.year] || b.year;
    for (const id of [`${b.year}-year`,`${authorYear}-author`,`${b.year}-title`]) assert.ok(memory.flip(g,id,books));
    assert.ok(g.matched);
    memory.resolve(g);
    assert.equal(memory.flip(g,`${b.year}-year`,books),false);
  });
  assert.equal(g.phase,'complete');
  assert.equal(g.removed.length,69);
  assert.equal(g.tries,23);
});
test('Records survive rereading, only improve, and tolerate corrupt or blocked storage', () => {
  const values = new Map();
  const storage = {getItem:k => values.get(k),setItem:(k,v) => values.set(k,v)};
  assert.equal(memory.readBest(storage,books),null);
  assert.equal(memory.saveBest(storage,books,31).best.tries,31);
  assert.equal(memory.readBest(storage,books).tries,31);
  assert.equal(memory.saveBest(storage,books,40).best.tries,31);
  assert.equal(memory.saveBest(storage,books,25).best.tries,25);
  assert.equal(memory.saveBest(storage,books,25).previous.tries,25);
  assert.equal(memory.saveBest(storage,books,1).saved,false);
  values.set(memory.recordKey(books),'{broken');
  assert.equal(memory.readBest(storage,books),null);
  values.set(memory.recordKey(books),JSON.stringify({tries:-2}));
  assert.equal(memory.readBest(storage,books),null);
  const denied = {getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
  assert.equal(memory.saveBest(denied,books,30).saved,false);
});
