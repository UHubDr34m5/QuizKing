/* Pure matching rules: author cards with identical printed names are interchangeable. */
window.HontaiMemory = (() => {
  function shuffledDeck(books, random = Math.random) {
    const deck = books.flatMap(book => ['year', 'title', 'author'].map(kind => ({
      id: `${book.year}-${kind}`, kind, value: String(book[kind]), year: book.year,
    })));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
  function isMatch(cards, books) {
    if (cards.length !== 3 || new Set(cards.map(c => c.id)).size !== 3) return false;
    if (new Set(cards.map(c => c.kind)).size !== 3) return false;
    const year = cards.find(c => c.kind === 'year');
    const book = books.find(b => String(b.year) === year?.value);
    return Boolean(book && cards.find(c => c.kind === 'title')?.value === book.title
      && cards.find(c => c.kind === 'author')?.value === book.author);
  }
  function createGame(books, random) {
    return { deck: shuffledDeck(books, random), selected: [], removed: [], tries: 0, phase: 'choosing', matched: false };
  }
  function flip(game, id, books) {
    if (game.phase !== 'choosing' || game.selected.includes(id) || game.removed.includes(id)) return false;
    if (!game.deck.some(card => card.id === id)) return false;
    game.selected.push(id);
    if (game.selected.length === 3) {
      game.tries++;
      game.matched = isMatch(game.selected.map(id => game.deck.find(c => c.id === id)), books);
      game.phase = 'review';
    }
    return true;
  }
  function resolve(game) {
    if (game.phase !== 'review') return false;
    if (game.matched) game.removed.push(...game.selected);
    game.selected = [];
    game.phase = game.removed.length === game.deck.length ? 'complete' : 'choosing';
    return true;
  }
  function recordKey(books, scope) {
    if (scope) return `quizking_memory_best_v2_${scope}_${books.length}`;
    return `quizking_hontai_memory_best_v1_${books.map(b => b.year).join('_')}`;
  }
  function readBest(storage, books, scope) {
    try {
      const record = JSON.parse(storage.getItem(recordKey(books, scope)) || 'null');
      return Number.isSafeInteger(record?.tries) && record.tries >= books.length ? record : null;
    } catch { return null; }
  }
  function saveBest(storage, books, tries, scope) {
    const previous = readBest(storage, books, scope);
    if (!Number.isSafeInteger(tries) || tries < books.length) return { previous, best: previous, saved: false };
    const best = !previous || tries < previous.tries ? { tries, completedAt: new Date().toISOString() } : previous;
    try {
      storage.setItem(recordKey(books, scope), JSON.stringify(best));
      return { previous, best, saved: true };
    } catch { return { previous, best, saved: false }; }
  }
  function sampleEntries(entries, count, random = Math.random) {
    if (!Number.isInteger(count) || count < 2 || count > entries.length) throw new RangeError('Invalid count');
    const pool = [...entries];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count).sort((a, b) => a.year - b.year);
  }
  return { sampleEntries, shuffledDeck, isMatch, createGame, flip, resolve, recordKey, readBest, saveBest };
})();
