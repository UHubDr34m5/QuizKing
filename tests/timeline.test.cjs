const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{},document:{addEventListener(){}}};vm.createContext(context);
for(const file of ['timeline-data.js','timeline.js','hontai-data.js']) vm.runInContext(fs.readFileSync(`${__dirname}/../${file}`,'utf8'),context);
const {TIMELINE_EVENTS:events,TimelineRules:r}=context.window;
test('Requested titles and dates are preserved exactly',()=>{
 assert.equal(events.length,5);
 assert.deepEqual(JSON.parse(JSON.stringify(events.map(({title,date})=>[title,date]))),[
  ['元号「令和」が始まる','2019-05-01'],['地下鉄サリン事件','1995-03-20'],['日本で消費税が導入される','1989-04-01'],['『千と千尋の神隠し』公開','2001-07-20'],['沖縄返還','1972-05-15']]);
 assert.equal(new Set(events.map(e=>e.id)).size,5);
});
test('Every allowed count yields a unique solvable random subset, initially unsorted',()=>{
 const original=JSON.stringify(events);
 let seed=17;const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
 const subsets=new Set();
 for(let n=2;n<=events.length;n++) for(let attempt=0;attempt<50;attempt++){
  const cards=r.createRound(events,n,random);assert.equal(cards.length,n);assert.equal(new Set(cards.map(e=>e.id)).size,n);assert.equal(r.isCorrect(cards),false);
  assert.equal(r.isCorrect(r.newestFirst(cards)),true);
  if(n===2)subsets.add(cards.map(e=>e.id).sort().join(','));
 }
 assert.ok(subsets.size>5);assert.equal(JSON.stringify(events),original);
 for(const bad of [1,6,2.5,NaN]) assert.throws(()=>r.createRound(events,bad));
});
test('Top is newest; button movement reaches success and protects boundaries',()=>{
 const cards=[...events];
 assert.equal(r.isCorrect(cards),false);
 assert.equal(r.move(cards,cards[0].id,-1),false);
 assert.equal(r.move(cards,cards.at(-1).id,1),false);
 assert.equal(r.move(cards,'missing',1),false);
 assert.equal(r.move(cards,cards[0].id,2),false);
 for(let target=0;target<cards.length;target++){
  const id=r.newestFirst(events)[target].id;
  while(cards.findIndex(c=>c.id===id)>target) assert.equal(r.move(cards,id,-1),true);
 }
 assert.equal(r.isCorrect(cards),true);
 assert.equal(cards[0].id,'reiwa');assert.equal(cards.at(-1).id,'okinawa');
 assert.equal(r.isCorrect([...cards].reverse()),false);
 assert.equal(r.isCorrect([{date:'2001-07-20'},{date:'2001-07-20'}]),true);
});
test('Date ordering includes month/day; reference positions preserve actual intervals',()=>{
 assert.equal(r.isCorrect([{date:'2019-05-01'},{date:'2019-04-30'}]),true);
 assert.equal(r.isCorrect([{date:'2019-04-30'},{date:'2019-05-01'}]),false);
 const a=r.axis(events);assert.equal(a.startYear,1970);assert.equal(a.endYear,2020);
 assert.equal(a.position('2020-01-01'),0);assert.equal(a.position('1970-01-01'),100);
 assert.ok(a.position('2019-05-01')<a.position('2001-07-20'));
 assert.ok((a.position('1972-05-15')-a.position('1989-04-01'))>(a.position('1989-04-01')-a.position('1995-03-20')));
 assert.equal(r.dateText('2019-05-01'),'2019年5月1日');
 const extended=[...events,{id:'new',title:'追加',date:'2026-09-27'}];assert.equal(r.createRound(extended,6).length,6);assert.equal(r.axis(extended).endYear,2030);
});
test('Every book has a substantial three-paragraph synopsis and a source',()=>{
 for(const b of context.window.HONTAI_BOOKS){assert.equal(b.synopsis.split('\n\n').length,3);assert.ok(b.synopsis.length>=300);assert.match(b.source,/^https:\/\//);}
});
