const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{},document:{addEventListener(){}}};vm.createContext(context);
for(const file of ['timeline-data.js','timeline.js','hontai-data.js']) vm.runInContext(fs.readFileSync(`${__dirname}/../${file}`,'utf8'),context);
const {TIMELINE_EVENTS:events,TimelineRules:r}=context.window;
test('Requested titles and dates are preserved exactly',()=>{
 assert.equal(events.length,69);
 for(const [title,date] of [
  ['元号「令和」が始まる','2019-05-01'],['地下鉄サリン事件','1995-03-20'],['日本で消費税が導入される','1989-04-01'],['『千と千尋の神隠し』公開','2001-07-20'],['沖縄返還','1972-05-15'],
  ['『だんご三兄弟』がリリースされる','1999-03-03'],['東日本大震災','2011-03-11'],['関東大震災','1923-09-01'],['高市早苗が日本初の女性首相に就任','2025-10-21'],['阪神・淡路大震災','1995-01-17'],['ベルリンの壁崩壊','1989-11-09'],['ソビエト連邦崩壊','1991-12-25'],['『となりのトトロ』公開','1988-04-16']
 ]) assert.equal(events.find(e=>e.title===title)?.date,date,title);
 assert.equal(new Set(events.map(e=>e.id)).size,events.length);
 assert.equal(new Set(events.map(e=>e.title)).size,events.length);
 for(const event of events){
  assert.equal(new Date(event.date).toISOString().slice(0,10),event.date);
  assert.ok(event.tags.length>=1);
  assert.equal(new Set(event.tags).size,event.tags.length);
 }
});
test('Every allowed count yields a unique solvable random subset, initially unsorted',()=>{
 const original=JSON.stringify(events);
 let seed=17;const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
 const subsets=new Set();
 for(let n=2;n<=events.length;n++) for(let attempt=0;attempt<50;attempt++){
  const cards=r.createRound(events,n,random);assert.equal(cards.length,n);assert.equal(new Set(cards.map(e=>e.id)).size,n);
  if(new Set(cards.map(e=>e.date)).size>1)assert.equal(r.isCorrect(cards),false);
  assert.equal(r.isCorrect(r.newestFirst(cards)),true);
  if(n===2)subsets.add(cards.map(e=>e.id).sort().join(','));
 }
 assert.ok(subsets.size>5);assert.equal(JSON.stringify(events),original);
 for(const bad of [1,events.length+1,2.5,NaN]) assert.throws(()=>r.createRound(events,bad));
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
 assert.equal(cards[0].id,'toy-story-5');assert.equal(cards.at(-1).id,'kanto-earthquake');
 assert.equal(r.isCorrect([...cards].reverse()),false);
 assert.equal(r.isCorrect([{date:'2001-07-20'},{date:'2001-07-20'}]),true);
});
test('Date ordering includes month/day; grouped reference includes every event, including ties',()=>{
 assert.equal(r.isCorrect([{date:'2019-05-01'},{date:'2019-04-30'}]),true);
 assert.equal(r.isCorrect([{date:'2019-04-30'},{date:'2019-05-01'}]),false);
 const groups=r.yearGroups(events);
 assert.equal(groups[0].year,'2026');assert.equal(groups.at(-1).year,'1923');
 assert.equal(groups.flatMap(g=>g.events).length,events.length);
 assert.ok(r.isCorrect(groups.flatMap(g=>g.events)));
 assert.equal(groups.find(g=>g.year==='1988').events.length,2);
 assert.equal(r.yearGroups([]).length,0);
 assert.equal(r.dateText('2019-05-01'),'2019年5月1日');
 assert.equal(r.eventDateText(events.find(e=>e.id==='soviet-union')),'1991年12月25・26日');
});
test('Tags select the complete deck without duplicates; movie dates use Japanese theatrical releases',()=>{
 for(const [tag,count] of [['ジブリ',27],['PIXAR',31],['映画',58],['震災',3],['',69]]){
  const deck=r.byTag(events,tag);assert.equal(deck.length,count);
  assert.equal(new Set(deck.map(e=>e.id)).size,count);
  assert.equal(r.createRound(deck,deck.length).length,count);
 }
 assert.equal(r.byTag(events,'missing').length,0);
 assert.ok(r.byTag(events,'ジブリ').every(e=>e.tags.includes('映画')));
 for(const [id,date] of [['ocean-waves','1993-12-25'],['earwig','2021-08-27'],['soul','2024-04-12'],['luca','2024-03-29'],['turning-red','2024-03-15'],['toy-story-4','2019-07-12']]) assert.equal(events.find(e=>e.id===id).date,date);
 for(const movie of r.byTag(events,'映画'))assert.match(movie.source,/^https:\/\//);
});
test('Every book has a substantial three-paragraph synopsis and a source',()=>{
 for(const b of context.window.HONTAI_BOOKS){assert.equal(b.synopsis.split('\n\n').length,3);assert.ok(b.synopsis.length>=300);assert.match(b.source,/^https:\/\//);}
});
