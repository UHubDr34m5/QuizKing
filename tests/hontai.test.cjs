const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {window:{addEventListener(){}},document:{addEventListener(){}}};
vm.createContext(context);
for (const name of ['hontai-data.js','hontai.js']) vm.runInContext(fs.readFileSync(`${__dirname}/../${name}`,'utf8'),context);
const {HONTAI_BOOKS:books,HontaiQuiz:quiz} = context.window;
test('Every award year has a unique complete record and reachable conversion',()=>{
  assert.equal(books.length,23);
  books.forEach((b,i)=>{
    assert.equal(b.year,2004+i);
    for(const field of ['title','author']) {
      assert.ok(quiz.correct(b[field],i,field));
      assert.ok(quiz.candidates(b[`${field}Reading`]).includes(b[field]));
      assert.ok(quiz.candidates(b[`${field}Reading`].replace(/[ ・、]/g,'')).includes(b[field]));
      assert.ok(!quiz.correct(b[field]+'誤',i,field));
    }
    assert.ok(b.synopsis&&b.source.startsWith('https://')&&b.awardSource.startsWith('https://'));
  });
});
test('Only exact official titles and surname-boundary spaces are accepted',()=>{
  assert.ok(quiz.correct('小川 洋子',0,'author'));
  assert.ok(quiz.correct('小川　洋子',0,'author'));
  for(const name of ['小 川洋子','小川洋 子','小川\t洋子',' 小川洋子','小川洋子 '])assert.ok(!quiz.correct(name,0,'author'));
  assert.ok(!quiz.correct('沖方丁',6,'author'));
  assert.ok(!quiz.correct('三浦しおん',8,'author'));
  assert.ok(!quiz.correct('博士の愛した数式 ',0,'title'));
  assert.ok(!quiz.correct('はかせのあいしたすうしき',0,'title'));
  assert.ok(!quiz.correct('東京タワー',2,'title'));
  assert.ok(!quiz.correct('同志少女よ敵を撃て',18,'title'));
  assert.ok(!quiz.correct('５２ヘルツのクジラたち',17,'title'));
});
test('Conversion does not reveal completions for partial readings',()=>{
  assert.ok(!quiz.candidates('はかせの').includes(books[0].title));
  assert.equal(quiz.candidates('').length,0);
  assert.ok(quiz.candidates('はかせ').includes('博士'));
  assert.ok(quiz.candidates('ディナー').includes('ディナー'));
});
