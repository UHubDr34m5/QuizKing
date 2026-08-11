"use strict";

/*
 * GASをデプロイしたら、次の値を /exec で終わるウェブアプリURLに置き換えてください。
 * 例: https://script.google.com/macros/s/AKfycb.../exec
 */
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwRmGAlg181VIcwnXfeiZb9fNNQcZOdQVAAXEbb0q7DtoQ4c4BP8ak29voYo0X-ul5Q/exec";
const REFERENCE_DATA = window.QUIZKING_REFERENCE_DATA || { olympics: {}, movies: {}, comedy: {}, trivia: [] };

const SUBJECTS_FALLBACK = [
  { id: "japanese", name: "国語", icon: "本", color: "#ef5350", description: "ことばの力を磨き、表現と読解の土台をつくろう。", categories: ["漢字", "四字熟語", "類義語・対義語", "諺", "故事成語", "文法", "文学"] },
  { id: "math", name: "数学", icon: "∑", color: "#20e0ff", description: "計算から数学雑学まで、筋道立てて考える力を育てよう。", categories: ["計算", "数と式", "方程式", "関数", "図形", "確率・統計", "数学史・数学雑学", "素因数分解"] },
  { id: "english", name: "英語", icon: "ABC", color: "#9a70ff", description: "単語・文法・会話表現から英語圏の文化まで学ぼう。", categories: ["英単語", "英熟語", "文法", "発音", "会話表現", "英語圏文化"] },
  { id: "science", name: "理科", icon: "⚗", color: "#b7f43a", description: "自然の「なぜ？」を物理・化学・生物・地学から解き明かそう。", categories: ["物理", "化学", "生物", "地学", "科学史", "身近な科学"] },
  { id: "social", name: "社会", icon: "◎", color: "#ff9f43", description: "歴史・地理・政治・経済をつなげて世界を理解しよう。", categories: ["日本史", "世界史", "地理", "政治", "経済", "時事", "世界遺産"] },
  { id: "pe", name: "体育", icon: "●", color: "#ff6f91", description: "競技のルール、記録、歴史からスポーツをもっと楽しもう。", categories: ["球技", "陸上", "水泳", "体操", "武道", "ルール・記録", "スポーツ史", "オリンピック"] },
  { id: "health", name: "保健", icon: "＋", color: "#9a70ff", description: "体と心を守るために、正しい健康知識を身につけよう。", categories: ["人体", "病気・予防", "応急手当", "心の健康", "栄養", "生活習慣"] },
  { id: "informatics", name: "情報", icon: "</>", color: "#8a94a6", description: "コンピュータ、AI、情報モラルを実生活につなげよう。", categories: ["コンピュータ", "ネットワーク", "プログラミング", "情報モラル", "AI", "データ活用"] },
  { id: "home", name: "家庭科", icon: "⌂", color: "#ff6fae", description: "衣食住、家計、子育てに役立つ生活の知恵を学ぼう。", categories: ["調理", "栄養", "被服", "住生活", "消費生活", "子育て"] },
  { id: "music", name: "音楽", icon: "♪", color: "#dc72ff", description: "楽典、楽器、作曲家、世界の音楽を味わおう。", categories: ["楽典", "楽器", "作曲家", "日本音楽", "世界の音楽", "音楽史"] },
  { id: "art", name: "美術", icon: "◇", color: "#57d6a5", description: "名作と表現技法を知り、見る力とつくる力を育てよう。", categories: ["絵画", "彫刻", "色彩", "デザイン", "日本美術", "西洋美術"] },
  { id: "calligraphy", name: "書道", icon: "墨", color: "#d9c8ff", description: "書体、名筆、漢字の成り立ちから文字文化を味わおう。", categories: ["楷書", "行書", "草書", "書道史", "漢字の成り立ち", "名筆"] },
  { id: "finance", name: "金融", icon: "¥", color: "#ffd75a", description: "家計、税金、投資、保険を知り、お金と上手につき合おう。", categories: ["家計", "貯蓄", "投資", "税金", "保険", "経済の仕組み", "詐欺対策"] },
  { id: "manners", name: "マナー", icon: "礼", color: "#57d6a5", description: "相手を思いやる作法と言葉遣いを場面別に学ぼう。", categories: ["食事", "冠婚葬祭", "ビジネス", "公共の場", "国際マナー", "言葉遣い"] },
  { id: "culture", name: "一般教養", icon: "知", color: "#7ea7ff", description: "法律、文化、哲学、発明など社会人にも役立つ知識を広げよう。", categories: ["法律", "文化", "宗教", "哲学", "暦・単位", "発明・発見", "映画", "お笑い"] },
  { id: "trivia", name: "雑学", icon: "？", color: "#ff8f5a", description: "思わず誰かに話したくなる、身近で意外な知識を集めよう。", categories: ["生き物", "食べ物", "乗り物", "言葉", "世界一・日本一", "企業・商品", "不思議", "アレの名前"] },
];

const QUESTIONS_FALLBACK = [
  { id: "q01", subjectId: "japanese", category: "漢字", type: "text", prompt: "計画の【進捗】を確認する。", choices: [], answer: "しんちょく", explanation: "「捗」は『はかどる』とも読みます。", difficulty: 1, kanjiLevel: "漢検2級" },
  { id: "q02", subjectId: "japanese", category: "四字熟語", type: "text", prompt: "多くの人が同じことを口にすることを表す四字熟語は？", answer: "異口同音", explanation: "異なる口から同じ音が出る、という意味です。", difficulty: 2 },
  { id: "q03", subjectId: "math", category: "計算", type: "choice", prompt: "2³ × 2⁴ の値は？", choices: ["32", "64", "128", "256"], answer: "128", explanation: "同じ底の積では指数を足し、2⁷=128です。", difficulty: 1 },
  { id: "q04", subjectId: "math", category: "確率・統計", type: "text", prompt: "公平なサイコロを1回投げ、偶数が出る確率を分数で答えてください。", answer: "1/2", explanation: "偶数は2・4・6の3通り。3/6=1/2です。", difficulty: 1 },
  { id: "q05", subjectId: "english", category: "英単語", type: "choice", prompt: "「curious」に最も近い意味は？", choices: ["好奇心が強い", "注意深い", "退屈している", "正直な"], answer: "好奇心が強い", explanation: "curious は『知りたがる、好奇心の強い』です。", difficulty: 1 },
  { id: "q06", subjectId: "english", category: "会話表現", type: "text", prompt: "「どういたしまして」を英語で答えてください。", answer: "You're welcome", explanation: "You are welcome. の短縮形です。", difficulty: 1 },
  { id: "q07", subjectId: "science", category: "化学", type: "choice", prompt: "水の化学式は？", choices: ["CO₂", "H₂O", "O₂", "NaCl"], answer: "H₂O", explanation: "水素原子2個と酸素原子1個からできています。", difficulty: 1 },
  { id: "q08", subjectId: "science", category: "生物", type: "truefalse", prompt: "ヒトの心臓には4つの部屋がある。", choices: ["○", "×"], answer: "○", explanation: "右心房・右心室・左心房・左心室の4つです。", difficulty: 1 },
  { id: "q09", subjectId: "social", category: "日本史", type: "choice", prompt: "鎌倉幕府を開いた人物は？", choices: ["源頼朝", "足利尊氏", "徳川家康", "平清盛"], answer: "源頼朝", explanation: "源頼朝は鎌倉を本拠地として武家政権を築きました。", difficulty: 1 },
  { id: "q10", subjectId: "social", category: "地理", type: "text", prompt: "日本で最も面積が大きい都道府県は？", answer: "北海道", explanation: "北海道は国土面積のおよそ22%を占めます。", difficulty: 1 },
  { id: "q11", subjectId: "pe", category: "球技", type: "choice", prompt: "バレーボールで、1チームがコートに入る人数は？", choices: ["5人", "6人", "7人", "9人"], answer: "6人", explanation: "通常の6人制バレーボールではコート内は6人です。", difficulty: 1 },
  { id: "q12", subjectId: "health", category: "応急手当", type: "choice", prompt: "AEDの主な目的は？", choices: ["体温を下げる", "心臓の動きを正常に戻す", "血圧を測る", "骨折を固定する"], answer: "心臓の動きを正常に戻す", explanation: "電気ショックで心室細動などを取り除くことを目指します。", difficulty: 1 },
  { id: "q13", subjectId: "informatics", category: "情報モラル", type: "truefalse", prompt: "同じパスワードを複数のサービスで使い回すと安全性が高まる。", choices: ["○", "×"], answer: "×", explanation: "1件の漏えいが他サービスへの不正ログインにつながります。", difficulty: 1 },
  { id: "q14", subjectId: "home", category: "調理", type: "choice", prompt: "肉の中心部まで十分に加熱できたか確認する温度の目安は？", choices: ["35℃", "50℃", "75℃", "100℃"], answer: "75℃", explanation: "中心部75℃で1分以上が一般的な目安です。", difficulty: 1 },
  { id: "q15", subjectId: "music", category: "作曲家", type: "choice", prompt: "交響曲第9番「合唱付き」を作曲した人物は？", choices: ["モーツァルト", "ベートーヴェン", "バッハ", "ショパン"], answer: "ベートーヴェン", explanation: "第4楽章に「歓喜の歌」の合唱が入ります。", difficulty: 1 },
  { id: "q16", subjectId: "art", category: "西洋美術", type: "choice", prompt: "「モナ・リザ」を描いた人物は？", choices: ["ゴッホ", "ピカソ", "レオナルド・ダ・ヴィンチ", "ミケランジェロ"], answer: "レオナルド・ダ・ヴィンチ", explanation: "ルネサンスを代表する芸術家・科学者です。", difficulty: 1 },
  { id: "q17", subjectId: "calligraphy", category: "楷書", type: "choice", prompt: "点画を崩さず、形が整った基本的な書体は？", choices: ["楷書", "行書", "草書", "篆書"], answer: "楷書", explanation: "楷書は一画ずつをはっきり書く書体です。", difficulty: 1 },
  { id: "q18", subjectId: "finance", category: "詐欺対策", type: "truefalse", prompt: "「必ずもうかる」と保証する投資話は、慎重に疑うべきである。", choices: ["○", "×"], answer: "○", explanation: "投資に絶対はありません。強い断定は警戒サインです。", difficulty: 1 },
  { id: "q19", subjectId: "manners", category: "公共の場", type: "choice", prompt: "エレベーターから乗り降りするときの基本は？", choices: ["乗る人が先", "降りる人が先", "同時に動く", "決まりはない"], answer: "降りる人が先", explanation: "先に降りてもらうと、入口付近の混雑を減らせます。", difficulty: 1 },
  { id: "q20", subjectId: "culture", category: "暦・単位", type: "choice", prompt: "1ダースはいくつ？", choices: ["10", "12", "20", "24"], answer: "12", explanation: "12個をひとまとまりにした数え方です。", difficulty: 1 },
  { id: "q21", subjectId: "trivia", category: "生き物", type: "choice", prompt: "タコの心臓はいくつ？", choices: ["1つ", "2つ", "3つ", "8つ"], answer: "3つ", explanation: "全身へ送る心臓1つと、えらへ送る心臓2つがあります。", difficulty: 2 },
];

const STORAGE = {
  profile: "quizking_profile_v1",
  clientId: "quizking_client_id_v1",
  stats: "quizking_stats_v1",
  attempts: "quizking_attempts_v1",
  kanjiBest: "quizking_kanji_best_v1",
  primeBest: "quizking_prime_best_v1",
};

const app = document.getElementById("app");
const toastElement = document.getElementById("toast");
let timerId = null;
let toastId = null;

const state = {
  view: "login",
  user: readStorage(STORAGE.profile, null),
  clientId: getClientId(),
  connected: false,
  loading: true,
  subjects: SUBJECTS_FALLBACK.map((subject) => ({ ...subject })),
  questions: QUESTIONS_FALLBACK.map((question) => ({ ...question })),
  selectedSubjectId: null,
  selectedCategory: "すべて",
  search: "",
  questionCount: 5,
  answerMode: "all",
  difficulty: 0,
  quizKanjiLevel: "all",
  timerEnabled: false,
  shuffle: true,
  quizQuestions: [],
  questionIndex: 0,
  response: "",
  answered: false,
  timeLeft: 20,
  results: [],
  latestAttempt: null,
  stats: readStorage(STORAGE.stats, { totalXp: 0, streak: 0, totalAnswers: 0, correctAnswers: 0 }),
  attempts: readStorage(STORAGE.attempts, []),
  rankings: [],
  kanjiDifficulty: "all",
  kanjiQuestionCount: 10,
  kanjiQuestions: [],
  kanjiIndex: 0,
  kanjiResponse: "",
  kanjiWrongAttempts: 0,
  kanjiAnswered: false,
  kanjiTimeLeft: 15,
  kanjiLives: 3,
  kanjiScore: 0,
  kanjiStreak: 0,
  kanjiMaxStreak: 0,
  kanjiResults: [],
  kanjiLatestResult: null,
  kanjiBest: readStorage(STORAGE.kanjiBest, { score: 0, streak: 0 }),
  referenceSection: "olympics",
  referenceTab: "summer",
  primeDifficulty: "normal",
  primeMode: "casual",
  primeTargetCount: 10,
  primeRound: 0,
  primeCurrent: 1,
  primeRemaining: 1,
  primeFactors: [],
  primeMisses: 0,
  primeScore: 0,
  primeStreak: 0,
  primeMaxStreak: 0,
  primeSolved: 0,
  primeTimeLeft: 60,
  primeStartedAt: null,
  primeResults: [],
  primeLatest: null,
  primeBest: readStorage(STORAGE.primeBest, { score: 0, streak: 0 }),
};

if (state.user) {
  state.view = "home";
}
state.stats.streak = calculateStreak(state.attempts);

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_error) {
    // プライベートブラウズ等でもクイズ自体は続行できます。
  }
}

function getClientId() {
  const saved = localStorage.getItem(STORAGE.clientId);
  if (saved) return saved;
  const value = window.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : `qk-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(STORAGE.clientId, value);
  return value;
}

function isConfigured() {
  return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(GAS_WEB_APP_URL);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeImageUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.href : "";
  } catch (_error) {
    return "";
  }
}

function normalizeAnswer(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[。、．.！!？?\s]/g, "")
    .replace(/^アレクサンダーグラハム/, "");
}

const MULTI_PREFIX = "【多答】";
const KANJI_TIME_LIMIT = 15;
const KANKEN_LEVELS = [
  "漢検10級", "漢検9級", "漢検8級", "漢検7級", "漢検6級", "漢検5級",
  "漢検4級", "漢検3級", "漢検準2級", "漢検2級", "漢検準1級", "漢検1級", "未設定",
];

function isMultiQuestion(question) {
  return question?.type === "multi" || String(question?.prompt || "").trim().startsWith(MULTI_PREFIX);
}

function isReadingTrivia(question) {
  return question?.subjectId === "trivia" && question?.category === "読む雑学";
}

function getTriviaLibraryFacts() {
  const databaseFacts = state.questions
    .filter(isReadingTrivia)
    .map((question) => ({
      id: question.id,
      category: question.choices?.[0] || "雑学",
      fact: displayPrompt(question),
      imageUrl: normalizeImageUrl(question.imageUrl),
    }));
  if (state.connected || databaseFacts.length) return databaseFacts;
  return (REFERENCE_DATA.trivia || []).map(([category, fact], index) => ({
    id: `fallback-trivia-${index + 1}`,
    category,
    fact,
    imageUrl: "",
  }));
}

function displayPrompt(question) {
  return String(question?.prompt || "").replace(/^\s*【多答】\s*/, "");
}

function multiExpectedGroups(question) {
  const source = Array.isArray(question?.choices) && question.choices.length
    ? question.choices
    : String(question?.answer || "").split(/[\n、,，;；]+/);
  return source
    .map((item) => String(item).split("::").map((part) => part.trim()).filter(Boolean))
    .filter((group) => group.length);
}

function splitMultiResponse(value) {
  return String(value || "")
    .split(/[\n、,，;；]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function evaluateMultiAnswer(value, question) {
  const groups = multiExpectedGroups(question);
  const responses = splitMultiResponse(value);
  const unmatched = new Set(groups.map((_group, index) => index));
  const extras = [];
  const matched = [];
  responses.forEach((response) => {
    const normalized = normalizeAnswer(response);
    const index = [...unmatched].find((groupIndex) => groups[groupIndex].some((candidate) => normalizeAnswer(candidate) === normalized));
    if (index === undefined) extras.push(response);
    else {
      unmatched.delete(index);
      matched.push(groups[index][0]);
    }
  });
  const missing = [...unmatched].map((index) => groups[index][0]);
  return {
    correct: groups.length > 0 && missing.length === 0 && extras.length === 0,
    matched,
    missing,
    extras,
    expected: groups.map((group) => group[0]),
  };
}

function questionMatchesMode(question, mode = state.answerMode) {
  if (mode === "all" || mode === "mixed") return true;
  if (mode === "multi") return isMultiQuestion(question);
  if (mode === "single") return !isMultiQuestion(question);
  return question.type === mode;
}

function questionTimeLimit(question) {
  return isMultiQuestion(question) ? 180 : 20;
}

function normalizeReading(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60))
    .replace(/[\s　。、，,.・･！!？?「」『』（）()\-ー]/g, "");
}

function extractKanjiTarget(question) {
  const prompt = String(question?.prompt || "");
  const marked = [...prompt.matchAll(/【([^】]{1,24})】/g)]
    .map((match) => match[1])
    .filter((value) => /[\u3400-\u9fff々〆ヵヶ]/u.test(value));
  if (marked.length) return marked.at(-1);
  if (!/(?:何と|なんと|どう)読む|読み方/.test(prompt)) return "";
  const quoted = [...prompt.matchAll(/[「『]([^」』]{1,24})[」』]/g)]
    .map((match) => match[1])
    .filter((value) => /[\u3400-\u9fff々〆ヵヶ]/u.test(value));
  const target = quoted.at(-1) || "";
  return /[\u3400-\u9fff々〆ヵヶ]/u.test(target) ? target : "";
}

function acceptedKanjiReadings(answer) {
  const raw = String(answer ?? "").replace(/[（(][^）)]*[）)]/g, "");
  return raw
    .split(/[、,，／/;；\n]+/)
    .map(normalizeReading)
    .filter(Boolean);
}

function extractKanjiOkurigana(question) {
  const prompt = String(question?.prompt || "");
  const marked = [...prompt.matchAll(/【([^】]{1,24})】/g)]
    .filter((match) => /[\u3400-\u9fff々〆ヵヶ]/u.test(match[1]));
  const match = marked.at(-1);
  if (!match) {
    if (!/(?:何と|なんと|どう)読む|読み方/.test(prompt)) return "";
    const quoted = [...prompt.matchAll(/[「『]([^」』]{1,24})[」』]/g)]
      .filter((item) => /[\u3400-\u9fff々〆ヵヶ]/u.test(item[1]));
    return normalizeReading(quoted.at(-1)?.[1].match(/[ぁ-ゖァ-ヺー]+$/u)?.[0] || "");
  }
  const inside = match[1].match(/[ぁ-ゖァ-ヺー]+$/u)?.[0] || "";
  if (inside) return normalizeReading(inside);
  const afterMarker = prompt.slice((match.index || 0) + match[0].length);
  return normalizeReading(afterMarker.match(/^[ぁ-ゖァ-ヺー]+/u)?.[0] || "");
}

function acceptedKanjiReadingVariants(question) {
  const readings = acceptedKanjiReadings(question?.answer);
  const okurigana = extractKanjiOkurigana(question);
  if (!okurigana) return readings;
  return [...new Set(readings.flatMap((reading) => {
    if (!reading.endsWith(okurigana) || reading.length <= okurigana.length) return [reading];
    return [reading, reading.slice(0, -okurigana.length)];
  }))];
}

function isKanjiReadingQuestion(question) {
  return question?.subjectId === "japanese"
    && question?.category === "漢字"
    && Boolean(extractKanjiTarget(question))
    && acceptedKanjiReadings(question.answer).length > 0;
}

function questionKanjiLevel(question) {
  const level = String(question?.kanjiLevel || "未設定");
  return KANKEN_LEVELS.includes(level) ? level : "未設定";
}

function usesQuizKanjiLevel() {
  return state.selectedSubjectId === "japanese" && state.selectedCategory === "漢字";
}

function questionMatchesQuizKanjiLevel(question) {
  return !usesQuizKanjiLevel()
    || state.quizKanjiLevel === "all"
    || questionKanjiLevel(question) === state.quizKanjiLevel;
}

function getKanjiReadingQuestions(level = "all") {
  return state.questions.filter((question) => {
    return isKanjiReadingQuestion(question)
      && (level === "all" || questionKanjiLevel(question) === level);
  });
}

function kanjiLevelMultiplier(question) {
  const index = KANKEN_LEVELS.indexOf(questionKanjiLevel(question));
  if (index < 0 || questionKanjiLevel(question) === "未設定") return 1;
  return index + 1;
}

function questionDifficultyLabel(question) {
  if (isKanjiReadingQuestion(question)) return questionKanjiLevel(question);
  return `難易度 ${"★".repeat(Number(question?.difficulty) || 1)}`;
}

function isKanjiReadingCorrect(response, question) {
  const normalized = normalizeReading(response);
  return Boolean(normalized) && acceptedKanjiReadingVariants(question).includes(normalized);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function showToast(message) {
  window.clearTimeout(toastId);
  toastElement.textContent = message;
  toastElement.classList.add("show");
  toastId = window.setTimeout(() => toastElement.classList.remove("show"), 3200);
}

function jsonp(action, parameters = {}) {
  return new Promise((resolve, reject) => {
    if (!isConfigured()) {
      reject(new Error("GAS URL is not configured."));
      return;
    }
    const callbackName = `__quizKingCallback${Date.now()}${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    let settled = false;
    const timeout = window.setTimeout(() => finish(new Error("GASからの応答がタイムアウトしました。")), 30000);

    function finish(error, payload) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
      if (error) reject(error);
      else resolve(payload);
    }

    window[callbackName] = (payload) => finish(null, payload);
    const query = new URLSearchParams({
      action,
      callback: callbackName,
      _: String(Date.now()),
      ...Object.fromEntries(
        Object.entries(parameters).map(([key, value]) => [key, String(value)]),
      ),
    });
    script.onerror = () => finish(new Error("GASへの接続に失敗しました。"));
    script.src = `${GAS_WEB_APP_URL}?${query.toString()}`;
    document.head.appendChild(script);
  });
}

async function postAction(payload) {
  if (!isConfigured()) throw new Error("GAS URL is not configured.");
  const requestId = window.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : `request-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await fetch(GAS_WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({ ...payload, requestId }),
  });
  return requestId;
}

async function loadBootstrap() {
  if (!isConfigured()) {
    state.loading = false;
    state.connected = false;
    render();
    return;
  }
  try {
    let payload;
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        payload = await jsonp("bootstrap");
        if (!payload || payload.ok !== true) throw new Error(payload?.error || "読み込みに失敗しました。");
        break;
      } catch (error) {
        lastError = error;
        if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 700 * (attempt + 1)));
      }
    }
    if (!payload || payload.ok !== true) throw lastError || new Error("読み込みに失敗しました。");
    if (Array.isArray(payload.subjects) && payload.subjects.length) state.subjects = payload.subjects;
    if (Array.isArray(payload.questions) && payload.questions.length) state.questions = payload.questions;
    state.connected = true;
  } catch (error) {
    console.warn(error);
    state.connected = false;
    showToast("データベースとの同期に失敗しました。しばらくして再読み込みしてください。");
  } finally {
    state.loading = false;
    render();
  }
}

function logoMarkup() {
  return '<span class="brand-crown" aria-hidden="true">♛</span><span>QuizKing</span>';
}

function connectionMarkup() {
  if (state.loading) {
    return '<div class="connection-banner"><span class="connection-dot"></span>データを確認しています…</div>';
  }
  if (state.connected) {
    return '<div class="connection-banner connected"><span class="connection-dot"></span>Googleスプレッドシートと接続中</div>';
  }
  return '<div class="connection-banner"><span class="connection-dot"></span>データベースと同期できませんでした。再読み込みしてください</div>';
}

function headerMarkup() {
  const navItems = [
    ["home", "ホーム"],
    ["kanji", "漢字キング"],
    ["records", "学習記録"],
    ["ranking", "ランキング"],
  ];
  return `
    <header class="site-header">
      <button class="brand" data-action="navigate" data-view="home" aria-label="QuizKing ホーム">${logoMarkup()}</button>
      <nav class="desktop-nav" aria-label="メインメニュー">
        ${navItems.map(([view, label]) => `
          <button class="${state.view === view ? "active" : ""}" data-action="navigate" data-view="${view}">${label}</button>
        `).join("")}
      </nav>
      <button class="account" data-action="logout" aria-label="ログアウト">
        <span class="avatar">♛</span>
        <span>${escapeHtml(state.user?.name || "ゲスト")}</span>
        <span>ログアウト</span>
      </button>
    </header>
  `;
}

function mobileNavMarkup() {
  if (["quiz", "kanji-game", "prime-game"].includes(state.view)) return "";
  const navItems = [["home", "⌂", "ホーム"], ["kanji", "読", "漢字"], ["records", "▥", "記録"], ["ranking", "♛", "順位"]];
  return `
    <nav class="mobile-nav" aria-label="スマートフォン用メニュー">
      ${navItems.map(([view, icon, label]) => `
        <button class="${state.view === view ? "active" : ""}" data-action="navigate" data-view="${view}">
          <span>${icon}</span>${label}
        </button>
      `).join("")}
    </nav>
  `;
}

function loginMarkup() {
  return `
    <main class="login-screen">
      <section class="login-brand">
        <div class="brand">${logoMarkup()}</div>
        <p class="eyebrow">毎日ひとつ、知識が増える</p>
        <h1>知識を武器に、<br><span>クイズ王へ。</span></h1>
        <p class="login-lead">学校の勉強から、スポーツ、金融、マナー、雑学まで。<br>楽しく挑戦して、知識の世界を広げよう。</p>
        <div class="login-benefits">
          <span>✓ 16分野を横断</span><span>✓ 学習記録を保存</span><span>✓ 子どもも安心</span>
        </div>
      </section>
      <section class="login-card" aria-labelledby="login-title">
        <div class="login-emblem">♛</div>
        <p class="mini-label">WELCOME TO QUIZKING</p>
        <h2 id="login-title">冒険をはじめよう</h2>
        <p>試作品ではニックネームでログインできます。学習記録はこの端末とスプレッドシートに保存されます。</p>
        <form id="login-form">
          <input name="nickname" maxlength="24" autocomplete="nickname" placeholder="ニックネーム" aria-label="ニックネーム" required>
          <button class="primary-button" type="submit">QuizKingをはじめる <span>→</span></button>
        </form>
        <p class="login-note">本番の課金版では、Firebase Authenticationなどの本人確認つき認証への変更を想定しています。</p>
      </section>
    </main>
  `;
}

function homeMarkup() {
  const keyword = state.search.trim().toLowerCase();
  const visibleSubjects = state.subjects.filter((subject) => {
    if (!keyword) return true;
    return subject.name.toLowerCase().includes(keyword)
      || subject.categories.some((category) => category.toLowerCase().includes(keyword));
  });
  const accuracy = state.stats.totalAnswers
    ? Math.round((state.stats.correctAnswers / state.stats.totalAnswers) * 100)
    : 0;
  const level = Math.floor(state.stats.totalXp / 500) + 1;
  const kanjiQuestionCount = getKanjiReadingQuestions().length;

  return `
    <section class="hero">
      <div>
        <p class="eyebrow">毎日ひとつ、知識が増える</p>
        <h1>知識を武器に、<br><span>クイズ王へ。</span></h1>
        <p class="hero-lead">学校の勉強から雑学まで。楽しく挑戦して、<br>知識の世界を広げよう。</p>
        <button class="primary-button" data-action="select-subject" data-subject="">全分野から挑戦 <span>→</span></button>
      </div>
      <aside class="progress-panel" aria-label="学習状況">
        <div class="level-row">
          <div class="level-orb"><strong><small>LEVEL</small>${level}</strong></div>
          <div class="level-meta"><span>現在の称号</span><strong>${level >= 10 ? "知識の騎士" : "クイズ冒険者"}</strong></div>
        </div>
        <div class="stat-grid">
          <div><span>合計XP</span><strong>${state.stats.totalXp.toLocaleString()}</strong></div>
          <div><span>正答率</span><strong>${accuracy}%</strong></div>
          <div><span>連続学習</span><strong>${state.stats.streak}日</strong></div>
          <div><span>挑戦回数</span><strong>${state.attempts.length}回</strong></div>
        </div>
      </aside>
    </section>
    <section class="challenge-strip">
      <div><span class="challenge-icon">⚡</span><div><p>今日のデイリーチャレンジ</p><strong>全分野から5問・全問正解で50XPボーナス</strong></div></div>
      <button data-action="quick-quiz">挑戦する →</button>
    </section>
    <section class="kanji-feature" aria-labelledby="kanji-feature-title">
      <div class="kanji-feature-copy">
        <p class="section-kicker">SPECIAL GAME</p>
        <h2 id="kanji-feature-title"><span>漢字</span>キング</h2>
        <p>大きく表示される漢字の読みを、15秒以内に入力。<br>3つのライフで連続正解を目指そう。</p>
        <div class="kanji-feature-stats">
          <span><strong>${kanjiQuestionCount}</strong> 語 公開中</span>
          <span><strong>${state.kanjiBest.score.toLocaleString()}</strong> BEST SCORE</span>
        </div>
        <button class="kanji-feature-button" data-action="navigate" data-view="kanji" ${kanjiQuestionCount ? "" : "disabled"}>挑戦する <span>→</span></button>
      </div>
      <div class="kanji-feature-visual" aria-hidden="true">
        <span class="kanji-orbit orbit-one">読</span>
        <span class="kanji-orbit orbit-two">問</span>
        <strong>漢</strong>
        <small>よみを<br>こたえよ</small>
      </div>
    </section>
    <section aria-labelledby="subjects-heading">
      <div class="section-heading-row">
        <div><p class="section-kicker">CHOOSE A FIELD</p><h2 id="subjects-heading">分野から挑戦</h2></div>
        <label class="subject-search"><span>⌕</span><input id="subject-search" value="${escapeHtml(state.search)}" placeholder="分野・分類を検索" aria-label="分野や分類を検索"></label>
      </div>
      <div class="subjects-grid">
        <button class="subject-card all-subjects" style="--subject-color:#ffd15c" data-action="select-subject" data-subject="">
          <span class="subject-icon">♛</span><div><h3>全分野</h3><p>すべての知識からランダム出題</p></div><span class="arrow">→</span>
        </button>
        ${visibleSubjects.map((subject) => `
          <button class="subject-card" style="--subject-color:${escapeHtml(subject.color)}" data-action="select-subject" data-subject="${escapeHtml(subject.id)}">
            <span class="subject-icon">${escapeHtml(subject.icon)}</span>
            <div><h3>${escapeHtml(subject.name)}</h3><p>${escapeHtml(subject.categories.slice(0, 3).join("・"))}</p></div>
            <span class="arrow">→</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

const REFERENCE_LINKS = {
  pe: [{ section: "olympics", eyebrow: "OLYMPIC ARCHIVE", title: "オリンピック資料室", text: "夏季・冬季の開催地、日本のメダル数、主な活躍選手を一覧で確認。", icon: "五輪" }],
  culture: [
    { section: "movies", eyebrow: "MOVIE ARCHIVE", title: "映画資料室", text: "興行収入・年別ヒット作・ジブリ・PIXARを年表で確認。", icon: "映" },
    { section: "comedy", eyebrow: "COMEDY ARCHIVE", title: "お笑い資料室", text: "M-1・R-1・キングオブコントの歴代王者を一覧で確認。", icon: "笑" },
  ],
};

function subjectFeatureMarkup(subjectId) {
  const cards = [];
  (REFERENCE_LINKS[subjectId] || []).forEach((item) => {
    cards.push(`
      <button class="feature-link-card" data-action="open-reference" data-section="${item.section}">
        <span class="feature-link-icon">${item.icon}</span>
        <span><small>${item.eyebrow}</small><strong>${item.title}</strong><em>${item.text}</em></span><i>→</i>
      </button>
    `);
  });
  if (subjectId === "trivia") {
    cards.push(`
      <button class="feature-link-card trivia-link" data-action="navigate" data-view="trivia-library">
        <span class="feature-link-icon">豆</span>
        <span><small>TRIVIA LIBRARY</small><strong>読む雑学ページ</strong><em>問題ではなく、短い雑学を気軽に読み進めるページです。</em></span><i>→</i>
      </button>
    `);
  }
  if (subjectId === "math") {
    cards.push(`
      <button class="feature-link-card prime-link" data-action="navigate" data-view="prime">
        <span class="feature-link-icon">÷</span>
        <span><small>PRIME FACTOR GAME</small><strong>素因数分解ウォール</strong><em>素数を選んで数字の壁を1まで崩そう。5段階の難易度に挑戦。</em></span><i>→</i>
      </button>
    `);
  }
  return cards.length ? `<div class="feature-link-grid">${cards.join("")}</div>` : "";
}

function referenceSourcesMarkup(data) {
  return `
    <footer class="reference-sources">
      <strong>出典・更新基準</strong><span>${escapeHtml(data.asOf || "")}</span>
      <ul>${(data.sources || []).map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)} ↗</a></li>`).join("")}</ul>
    </footer>
  `;
}

function olympicsReferenceMarkup(data) {
  const season = state.referenceTab === "winter" ? "winter" : "summer";
  const rows = data[season] || [];
  return `
    <div class="reference-tabs" role="tablist">
      ${[["summer", "夏季大会"], ["winter", "冬季大会"]].map(([value, label]) => `<button class="${season === value ? "active" : ""}" data-action="set-reference-tab" data-value="${value}">${label}</button>`).join("")}
    </div>
    <div class="reference-summary-grid">
      <div><span>掲載大会</span><strong>${rows.length}</strong><small>中止大会を含む</small></div>
      <div><span>日本の最多金</span><strong>${Math.max(0, ...rows.map((row) => row.medals?.[0] || 0))}</strong><small>1大会での獲得数</small></div>
      <div><span>最新掲載</span><strong>${rows.at(-1)?.year || "—"}</strong><small>${escapeHtml(rows.at(-1)?.host || "")}</small></div>
    </div>
    <div class="table-wrap reference-table-wrap"><table class="reference-table">
      <thead><tr><th>年</th><th>開催地</th><th>日本のメダル（金・銀・銅）</th><th>主な選手・競技</th></tr></thead>
      <tbody>${rows.map((row) => `<tr class="${row.cancelled ? "cancelled" : ""}"><td><strong>${row.year}</strong></td><td>${escapeHtml(row.host)}</td><td>${row.medals ? `<span class="medal gold">${row.medals[0]}</span><span class="medal silver">${row.medals[1]}</span><span class="medal bronze">${row.medals[2]}</span>` : "—"}</td><td>${escapeHtml(row.stars)}</td></tr>`).join("")}</tbody>
    </table></div>
    ${referenceSourcesMarkup(data)}
  `;
}

function moviesReferenceMarkup(data) {
  const tabs = [["allTime", "歴代興収"], ["yearly", "年別ヒット"], ["ghibli", "ジブリ"], ["pixar", "PIXAR"]];
  const tab = tabs.some(([value]) => value === state.referenceTab) ? state.referenceTab : "allTime";
  let table = "";
  if (tab === "allTime") {
    table = `<table class="reference-table"><thead><tr><th>順位</th><th>作品</th><th>興行収入</th><th>公開年</th></tr></thead><tbody>${(data.allTime || []).map(([rank, title, gross, year]) => `<tr><td><strong>${rank}</strong></td><td>${escapeHtml(title)}</td><td>${gross.toFixed(1)}億円</td><td>${year}</td></tr>`).join("")}</tbody></table>`;
  } else if (tab === "yearly") {
    table = `<table class="reference-table"><thead><tr><th>年</th><th>年間総合1位作品</th><th>興行収入</th><th>その年のランキング</th></tr></thead><tbody>${(data.yearly || []).map(([year, title, gross]) => {
      const sourceUrl = year >= 2023
        ? `https://www.eiren.org/toukei/img/eiren_kosyu/${year === 2025 ? "data_current_2025" : `data_${year}`}.pdf`
        : `https://www.eiren.org/toukei/${year}.html`;
      return `<tr><td><strong>${year}</strong></td><td><span class="rank-one">1位</span>${escapeHtml(title)}</td><td>${gross.toFixed(1)}億円</td><td><a class="table-source-link" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">映連の全順位 ↗</a></td></tr>`;
    }).join("")}</tbody></table>`;
  } else {
    const label = tab === "ghibli" ? "スタジオジブリ" : "PIXAR";
    table = `<table class="reference-table"><thead><tr><th>公開年</th><th>${label}長編作品</th></tr></thead><tbody>${(data[tab] || []).map(([year, title]) => `<tr><td><strong>${year}</strong></td><td>${escapeHtml(title)}</td></tr>`).join("")}</tbody></table>`;
  }
  return `
    <div class="reference-tabs" role="tablist">${tabs.map(([value, label]) => `<button class="${tab === value ? "active" : ""}" data-action="set-reference-tab" data-value="${value}">${label}</button>`).join("")}</div>
    <p class="reference-note">興行収入は日本国内。公開後の再集計などで数値・順位が変わることがあります。</p>
    <div class="table-wrap reference-table-wrap">${table}</div>
    ${referenceSourcesMarkup(data)}
  `;
}

function comedyReferenceMarkup(data) {
  const tabs = [["m1", "M-1"], ["r1", "R-1"], ["koc", "キングオブコント"]];
  const tab = tabs.some(([value]) => value === state.referenceTab) ? state.referenceTab : "m1";
  const label = tabs.find(([value]) => value === tab)?.[1] || "歴代王者";
  return `
    <div class="reference-tabs" role="tablist">${tabs.map(([value, tabLabel]) => `<button class="${tab === value ? "active" : ""}" data-action="set-reference-tab" data-value="${value}">${tabLabel}</button>`).join("")}</div>
    <div class="champion-grid">${(data[tab] || []).map(([year, champion]) => `<article><span>${year}</span><strong>${escapeHtml(champion)}</strong></article>`).join("")}</div>
    <p class="reference-note">${escapeHtml(label)}の大会が開催されなかった年は掲載していません。</p>
    ${referenceSourcesMarkup(data)}
  `;
}

function referenceMarkup() {
  const configs = {
    olympics: { kicker: "OLYMPIC ARCHIVE", title: "オリンピック資料室", description: "歴代大会の開催地、日本のメダル数、活躍した主な選手と競技を横断できます。", render: olympicsReferenceMarkup },
    movies: { kicker: "MOVIE ARCHIVE", title: "映画資料室", description: "日本の興行データと、ジブリ・PIXARの作品年表をクイズ前の予習や復習に。", render: moviesReferenceMarkup },
    comedy: { kicker: "COMEDY ARCHIVE", title: "お笑い資料室", description: "3つの賞レースの歴代王者を、開催年とともに確認できます。", render: comedyReferenceMarkup },
  };
  const config = configs[state.referenceSection] || configs.olympics;
  const data = REFERENCE_DATA[state.referenceSection] || {};
  return `
    <section class="page-head reference-head">
      <button class="back-button" data-action="navigate" data-view="${state.referenceSection === "olympics" ? "subject" : "subject"}">← 分類へ戻る</button>
      <p class="section-kicker">${config.kicker}</p><h1 class="page-title">${config.title}</h1><p class="page-description">${config.description}</p>
    </section>
    <section class="reference-panel">${config.render(data)}</section>
  `;
}

function triviaLibraryMarkup() {
  const facts = getTriviaLibraryFacts();
  return `
    <section class="page-head"><button class="back-button" data-action="navigate" data-view="subject">← 雑学へ戻る</button><p class="section-kicker">TRIVIA LIBRARY</p><h1 class="page-title">読む雑学</h1><p class="page-description">正解・不正解はありません。気になるカードをめくるように、知識を拾っていこう。</p></section>
    ${facts.length ? `<div class="trivia-library-grid">${facts.map((item, index) => `<article>${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.category)}の雑学画像" loading="lazy" referrerpolicy="no-referrer">` : ""}<span>${String(index + 1).padStart(2, "0")}</span><small>${escapeHtml(item.category)}</small><p>${escapeHtml(item.fact)}</p></article>`).join("")}</div>` : '<p class="empty-state">公開中の「読む雑学」はまだありません。</p>'}
  `;
}

const PRIME_LEVELS = {
  easy: { label: "EASY", name: "初級", primes: [2, 3, 5, 7], minFactors: 2, maxFactors: 3, color: "#66e4b4" },
  normal: { label: "NORMAL", name: "中級", primes: [2, 3, 5, 7, 11, 13], minFactors: 3, maxFactors: 4, color: "#54d9ff" },
  hard: { label: "HARD", name: "上級", primes: [2, 3, 5, 7, 11, 13, 17, 19, 23], minFactors: 3, maxFactors: 5, color: "#9d7cff" },
  expert: { label: "EXPERT", name: "達人", primes: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37], minFactors: 4, maxFactors: 6, color: "#ff9a62" },
  insane: { label: "INSANE", name: "極限", primes: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53], minFactors: 5, maxFactors: 7, color: "#ff5f89" },
};

function primeSetupMarkup() {
  const level = PRIME_LEVELS[state.primeDifficulty] || PRIME_LEVELS.normal;
  return `
    <section class="prime-setup" style="--prime-color:${level.color}">
      <div class="prime-setup-copy">
        <button class="back-button" data-action="navigate" data-view="subject">← 数学へ戻る</button>
        <p class="section-kicker">PRIME FACTOR WALL</p><h1>素因数分解<br><span>ウォール</span></h1>
        <p>数字を割り切れる素数を選び、残りが1になるまで壁を崩そう。暗算力と素数感覚を鍛えるQuizKingオリジナルゲームです。</p>
        <div class="prime-rule-row"><span><b>1</b> 割れる素数を選ぶ</span><span><b>2</b> 商をさらに分解</span><span><b>3</b> 1で完全制覇</span></div>
      </div>
      <div class="prime-setup-panel">
        <h2>ゲーム設定</h2>
        <div class="setting-group"><label>難易度</label><div class="prime-levels">${Object.entries(PRIME_LEVELS).map(([key, item]) => `<button class="${state.primeDifficulty === key ? "active" : ""}" style="--level-color:${item.color}" data-action="set-prime-difficulty" data-value="${key}"><strong>${item.label}</strong><span>${item.name}・〜${item.primes.at(-1)}</span></button>`).join("")}</div></div>
        <div class="setting-group"><label>モード</label><div class="segmented"><button class="${state.primeMode === "casual" ? "active" : ""}" data-action="set-prime-mode" data-value="casual">壁を10枚</button><button class="${state.primeMode === "timed" ? "active" : ""}" data-action="set-prime-mode" data-value="timed">60秒アタック</button></div></div>
        <div class="prime-preview"><span>使用する素数</span><strong>${level.primes.join("・")}</strong><small>BEST ${Number(state.primeBest.score || 0).toLocaleString()} PTS</small></div>
        <button class="prime-start-button" data-action="start-prime-game">壁を崩し始める <span>→</span></button>
      </div>
    </section>
  `;
}

function primeGameMarkup() {
  const level = PRIME_LEVELS[state.primeDifficulty] || PRIME_LEVELS.normal;
  const solved = state.primeRemaining === 1;
  const factorProduct = state.primeFactors.length ? state.primeFactors.join(" × ") : "素数を選択";
  const progress = state.primeMode === "casual" ? (state.primeSolved / state.primeTargetCount) * 100 : (state.primeTimeLeft / 60) * 100;
  return `
    <section class="prime-game" style="--prime-color:${level.color}">
      <div class="prime-game-topbar">
        <button data-action="exit-prime-game">終了</button><div class="prime-game-progress"><span style="width:${Math.max(0, Math.min(100, progress))}%"></span></div>
        <strong>${state.primeMode === "timed" ? `<span class="prime-clock">${state.primeTimeLeft}</span>秒` : `${state.primeSolved}/${state.primeTargetCount} WALLS`}</strong>
      </div>
      <div class="prime-scorebar"><span>SCORE <strong>${state.primeScore.toLocaleString()}</strong></span><span>STREAK <strong>${state.primeStreak}</strong></span><span>LEVEL <strong>${level.label}</strong></span></div>
      <article class="number-wall ${solved ? "is-solved" : ""}">
        <span class="wall-label">${solved ? "PERFECT FACTORIZATION" : "DIVIDE THE WALL"}</span>
        <div class="wall-number">${state.primeRemaining.toLocaleString()}</div>
        <div class="wall-equation">${state.primeCurrent.toLocaleString()} = ${escapeHtml(factorProduct)}${state.primeRemaining !== state.primeCurrent && state.primeRemaining !== 1 ? ` × ${state.primeRemaining}` : ""}</div>
        ${state.primeMisses ? `<p class="prime-miss">割り切れない選択 ${state.primeMisses}回</p>` : ""}
      </article>
      ${solved ? `<div class="prime-perfect"><strong>PERFECT!</strong><span>${state.primeCurrent.toLocaleString()} = ${state.primeFactors.join(" × ")}</span><button data-action="next-prime-wall">次の壁 <i>→</i></button></div>` : `<div class="prime-pad" aria-label="素数を選ぶ">${level.primes.map((prime) => `<button data-action="choose-prime" data-value="${prime}"><span>${prime}</span><small>PRIME</small></button>`).join("")}</div>`}
    </section>
  `;
}

function primeResultMarkup() {
  const result = state.primeLatest;
  if (!result) return '<p class="empty-state">ゲーム結果がありません。</p>';
  return `
    <section class="prime-result">
      <div class="prime-result-icon">÷</div><p class="section-kicker">FACTORIZATION COMPLETE</p><h1>${result.isBest ? "自己ベスト更新！" : "壁崩し完了！"}</h1>
      <div class="prime-final-score">${result.score.toLocaleString()}<small> PTS</small></div>
      <div class="prime-result-grid"><div><span>分解した壁</span><strong>${result.solved}</strong></div><div><span>最大連続</span><strong>${result.maxStreak}</strong></div><div><span>ミス</span><strong>${result.misses}</strong></div><div><span>所要時間</span><strong>${result.elapsed}秒</strong></div></div>
      <div class="quiz-actions"><button class="secondary-button" data-action="navigate" data-view="home">ホームへ</button><button class="secondary-button" data-action="navigate" data-view="prime">設定を変える</button><button class="prime-start-button compact" data-action="start-prime-game">もう一度 <span>→</span></button></div>
    </section>
  `;
}

function subjectMarkup() {
  const subject = state.subjects.find((item) => item.id === state.selectedSubjectId);
  if (!subject) return homeMarkup();
  const questionCounts = state.questions.reduce((map, question) => {
    if (question.subjectId === subject.id && !isReadingTrivia(question)) map[question.category] = (map[question.category] || 0) + 1;
    return map;
  }, {});
  return `
    <section class="page-head">
      <button class="back-button" data-action="navigate" data-view="home">← 分野一覧へ</button>
      <p class="section-kicker">FIELD: ${escapeHtml(subject.id)}</p>
      <h1 class="page-title">${escapeHtml(subject.name)}</h1>
      <p class="page-description">${escapeHtml(subject.description)}</p>
    </section>
    ${subjectFeatureMarkup(subject.id)}
    <div class="category-grid">
      <button class="category-card" data-action="select-category" data-category="すべて">
        <strong>全分類</strong><span>${state.questions.filter((question) => question.subjectId === subject.id && !isReadingTrivia(question)).length}問を横断</span><i>→</i>
      </button>
      ${subject.categories.map((category) => `
        <button class="category-card" data-action="select-category" data-category="${escapeHtml(category)}">
          <strong>${escapeHtml(category)}</strong><span>${questionCounts[category] || 0}問登録</span><i>→</i>
        </button>
      `).join("")}
    </div>
  `;
}

function settingsMarkup() {
  const subject = state.subjects.find((item) => item.id === state.selectedSubjectId);
  const modeOptions = [["all", "すべて"], ["single", "一問一答"], ["multi", "多答"]];
  const kanjiLevelMode = usesQuizKanjiLevel();
  const kanjiLevelOptions = KANKEN_LEVELS
    .map((level) => [level, state.questions.filter((question) => {
      return !isReadingTrivia(question)
        && question.subjectId === "japanese"
        && question.category === "漢字"
        && questionMatchesMode(question)
        && questionKanjiLevel(question) === level;
    }).length])
    .filter(([, count]) => count > 0);
  const availablePool = state.questions.filter((question) => {
    const subjectMatch = !state.selectedSubjectId || question.subjectId === state.selectedSubjectId;
    const categoryMatch = state.selectedCategory === "すべて" || question.category === state.selectedCategory;
    const difficultyMatch = kanjiLevelMode
      ? questionMatchesQuizKanjiLevel(question)
      : state.difficulty === 0 || Number(question.difficulty) === state.difficulty;
    return !isReadingTrivia(question) && subjectMatch && categoryMatch && difficultyMatch && questionMatchesMode(question);
  });
  const countOptions = state.answerMode === "multi" ? [1, 3, 5, 10] : [5, 10, 20, 30];
  if (!countOptions.includes(state.questionCount)) state.questionCount = countOptions[0];
  const resourceSection = state.selectedCategory === "オリンピック" ? "olympics"
    : state.selectedCategory === "映画" ? "movies"
      : state.selectedCategory === "お笑い" ? "comedy" : "";
  return `
    <section class="page-head">
      <button class="back-button" data-action="back-from-settings">← 戻る</button>
      <p class="section-kicker">QUIZ SETTINGS</p>
      <h1 class="page-title">出題設定</h1>
      <p class="page-description">${escapeHtml(subject?.name || "全分野")}／${escapeHtml(state.selectedCategory)}</p>
    </section>
    <div class="settings-layout">
      <section class="panel">
        <h2>挑戦内容を選ぶ</h2>
        <div class="setting-group">
          <label>問題数</label>
          <div class="segmented">
            ${countOptions.map((count) => `<button class="${state.questionCount === count ? "active" : ""}" data-action="set-count" data-value="${count}">${count}問</button>`).join("")}
          </div>
        </div>
        <div class="setting-group">
          <label>解答形式</label>
          <div class="segmented">
            ${modeOptions.map(([value, label]) => `<button class="${state.answerMode === value ? "active" : ""}" data-action="set-mode" data-value="${value}">${label}</button>`).join("")}
          </div>
        </div>
        ${kanjiLevelMode ? `
          <div class="setting-group">
            <label>漢検級</label>
            <div class="segmented kanji-segmented">
              ${[["all", state.questions.filter((question) => question.subjectId === "japanese" && question.category === "漢字" && questionMatchesMode(question)).length], ...kanjiLevelOptions].map(([value, count]) => `<button class="${state.quizKanjiLevel === value ? "active" : ""}" data-action="set-quiz-kanji-level" data-value="${escapeHtml(value)}">${value === "all" ? "すべて" : escapeHtml(value)} (${count})</button>`).join("")}
            </div>
          </div>
        ` : `
          <div class="setting-group">
            <label>難易度</label>
            <div class="segmented">
              ${[[0, "すべて"], [1, "★"], [2, "★★"], [3, "★★★"]].map(([value, label]) => `<button class="${state.difficulty === value ? "active" : ""}" data-action="set-difficulty" data-value="${value}">${label}</button>`).join("")}
            </div>
          </div>
        `}
        <div class="setting-group">
          <div class="toggle-row"><span>制限時間（多答180秒／一問一答20秒）</span><button class="switch ${state.timerEnabled ? "on" : ""}" data-action="toggle-timer" aria-pressed="${state.timerEnabled}"><span></span></button></div>
          <div class="toggle-row"><span>問題をシャッフル</span><button class="switch ${state.shuffle ? "on" : ""}" data-action="toggle-shuffle" aria-pressed="${state.shuffle}"><span></span></button></div>
        </div>
      </section>
      <aside class="panel quiz-summary">
        <div class="summary-hero"><span>今回の挑戦</span><strong>${escapeHtml(subject?.name || "全分野")}</strong><p>${escapeHtml(state.selectedCategory)}</p></div>
        <div class="mini-stat"><span>問題数</span><strong>${state.questionCount}問</strong></div>
        <div class="mini-stat"><span>形式</span><strong>${escapeHtml(modeOptions.find(([value]) => value === state.answerMode)?.[1] || "すべて")}</strong></div>
        ${kanjiLevelMode ? `<div class="mini-stat"><span>漢検級</span><strong>${state.quizKanjiLevel === "all" ? "すべて" : escapeHtml(state.quizKanjiLevel)}</strong></div>` : ""}
        <div class="mini-stat"><span>該当問題</span><strong>${availablePool.length}問</strong></div>
        ${resourceSection ? `<button class="secondary-button full-button" data-action="open-reference" data-section="${resourceSection}">資料を先に見る</button>` : ""}
        <button class="primary-button" data-action="start-quiz" ${availablePool.length ? "" : "disabled"}>クイズを開始 <span>→</span></button>
      </aside>
    </div>
  `;
}

function kanjiSetupMarkup() {
  const allQuestions = getKanjiReadingQuestions();
  const availableQuestions = getKanjiReadingQuestions(state.kanjiDifficulty);
  const levelOptions = KANKEN_LEVELS
    .map((level) => [level, getKanjiReadingQuestions(level).length])
    .filter(([, count]) => count > 0);
  const playableCount = Math.min(state.kanjiQuestionCount, availableQuestions.length);
  return `
    <section class="kanji-setup">
      <div class="kanji-setup-hero">
        <button class="back-button" data-action="navigate" data-view="home">← ホームへ</button>
        <p class="section-kicker">KANJI READING BATTLE</p>
        <h1><span>漢字</span>キング</h1>
        <p>表示された漢字の読みをひらがなで入力。<br>1問15秒、ライフがなくなる前に王座を目指せ。</p>
        <div class="kanji-rules">
          <div><strong>15</strong><span>秒／1問</span></div>
          <div><strong>3</strong><span>ライフ</span></div>
          <div><strong>${allQuestions.length}</strong><span>公開問題</span></div>
        </div>
      </div>
      <div class="kanji-setup-panel">
        <div class="kanji-emblem" aria-hidden="true">読</div>
        <h2>挑戦内容</h2>
        <div class="setting-group">
          <label>漢検級</label>
          <div class="segmented kanji-segmented">
            ${[["all", allQuestions.length], ...levelOptions].map(([value, count]) => `<button class="${state.kanjiDifficulty === value ? "active" : ""}" data-action="set-kanji-difficulty" data-value="${escapeHtml(value)}">${value === "all" ? "すべて" : escapeHtml(value)} (${count})</button>`).join("")}
          </div>
        </div>
        <div class="setting-group">
          <label>問題数</label>
          <div class="segmented kanji-segmented">
            ${[5, 10, 20].map((count) => `<button class="${state.kanjiQuestionCount === count ? "active" : ""}" data-action="set-kanji-count" data-value="${count}">${count}問</button>`).join("")}
          </div>
          <p class="kanji-availability">この条件では ${availableQuestions.length}問。${availableQuestions.length && playableCount < state.kanjiQuestionCount ? `${playableCount}問すべてを出題します。` : ""}</p>
        </div>
        <button class="kanji-start-button" data-action="start-kanji-game" ${availableQuestions.length ? "" : "disabled"}>
          <span>挑戦開始</span><i>→</i>
        </button>
        <p class="kanji-database-note">スプレッドシートで「国語／漢字」の読み問題を公開すると、このゲームにも自動で追加されます。</p>
      </div>
    </section>
  `;
}

function kanjiGameMarkup() {
  const question = state.kanjiQuestions[state.kanjiIndex];
  if (!question) return '<p class="empty-state">漢字読み問題を準備できませんでした。</p>';
  const target = extractKanjiTarget(question);
  const result = state.kanjiResults.at(-1);
  const isCorrect = state.kanjiAnswered && Boolean(result?.correct);
  const isTimeUp = state.kanjiAnswered && !isCorrect && !state.kanjiResponse;
  const outcomeClass = !state.kanjiAnswered ? "is-active" : isCorrect ? "is-correct" : isTimeUp ? "is-timeup" : "is-incorrect";
  const displayClass = !state.kanjiAnswered ? "is-approaching" : isCorrect ? "is-correct" : isTimeUp ? "is-timeup" : "is-wrong";
  const progress = ((state.kanjiIndex + (state.kanjiAnswered ? 1 : 0)) / state.kanjiQuestions.length) * 100;
  const timerProgress = Math.max(0, (state.kanjiTimeLeft / KANJI_TIME_LIMIT) * 100);
  const lives = Array.from({ length: 3 }, (_, index) => `<span class="${index < state.kanjiLives ? "alive" : "lost"}">♥</span>`).join("");
  return `
    <section class="kanji-game-stage">
      <div class="kanji-game-topbar">
        <button class="kanji-exit" data-action="exit-kanji-game">終了</button>
        <div class="kanji-game-progress"><span style="width:${progress}%"></span></div>
        <div class="kanji-lives" aria-label="残りライフ ${state.kanjiLives}">${lives}</div>
      </div>
      <article class="kanji-game-card ${outcomeClass}" style="--kanji-round-duration:${KANJI_TIME_LIMIT}s">
        ${state.kanjiAnswered && !isCorrect ? `
          <div class="kanji-impact ${isTimeUp ? "timeup" : "wrong"}" aria-hidden="true">
            <span>${isTimeUp ? "TIME UP" : "MISS"}</span>
          </div>
        ` : ""}
        <div class="kanji-game-status">
          <span>第 ${state.kanjiIndex + 1} 問 / ${state.kanjiQuestions.length}</span>
          <strong>${state.kanjiScore.toLocaleString()} <small>PTS</small></strong>
          <span>連続 ${state.kanjiStreak}</span>
        </div>
        <div class="kanji-timer" aria-label="残り時間 ${state.kanjiTimeLeft}秒">
          <span class="kanji-timer-bar" style="width:${timerProgress}%"></span>
          <strong>${state.kanjiTimeLeft}</strong><small>秒</small>
        </div>
        <div class="kanji-prompt-label">この漢字の読みは？</div>
        <div class="kanji-visual-field">
          <span class="kanji-speed-lines" aria-hidden="true"></span>
          <div class="kanji-display ${displayClass}" lang="ja">${escapeHtml(target)}</div>
        </div>
        <div class="kanji-difficulty">${escapeHtml(questionKanjiLevel(question))}<span>${escapeHtml(question.prompt)}</span></div>
        ${state.kanjiAnswered ? `
          <div class="kanji-feedback ${isCorrect ? "correct" : "incorrect"}" role="status">
            <strong>${isCorrect ? "正解！" : state.kanjiResponse ? "不正解" : "時間切れ"}</strong>
            <span>よみ：${escapeHtml(question.answer)}</span>
            <p>${escapeHtml(question.explanation)}</p>
          </div>
          <button class="kanji-next-button" data-action="next-kanji-question">${state.kanjiLives <= 0 || state.kanjiIndex + 1 >= state.kanjiQuestions.length ? "結果を見る" : "次の漢字へ"} <span>→</span></button>
        ` : `
          <form id="kanji-answer-form" class="kanji-answer-form">
            <label for="kanji-answer">よみを入力</label>
            <div><input id="kanji-answer" name="answer" value="${escapeHtml(state.kanjiResponse)}" placeholder="ひらがなで入力" autocomplete="off" autocapitalize="none" spellcheck="false"><button type="submit">決定</button></div>
            <p id="kanji-retry-status" class="kanji-retry-status" role="status" aria-live="polite">${state.kanjiWrongAttempts ? `ちがいます（${state.kanjiWrongAttempts}回目）。時間内なら何度でも再挑戦できます。` : "間違えても、時間内なら何度でも再挑戦できます。"}</p>
          </form>
        `}
      </article>
    </section>
  `;
}

function kanjiResultMarkup() {
  const result = state.kanjiLatestResult;
  if (!result) return '<p class="empty-state">結果がありません。</p>';
  const title = result.rate === 100 ? "完全制覇！" : result.rate >= 70 ? "見事な読み！" : "挑戦完了！";
  return `
    <section class="kanji-result-card">
      <div class="kanji-result-seal">王</div>
      <p class="section-kicker">KANJI BATTLE COMPLETE</p>
      <h1>${title}</h1>
      <p class="kanji-result-score">${result.score.toLocaleString()}<small> PTS</small></p>
      <p class="page-description">${result.isBest ? "自己ベスト更新！漢字王へ一歩前進です。" : "読みと解説を復習して、さらに上の記録を目指そう。"}</p>
      <div class="kanji-result-grid">
        <div><span>正解</span><strong>${result.correct}<small>/${result.total}</small></strong></div>
        <div><span>正答率</span><strong>${result.rate}<small>%</small></strong></div>
        <div><span>最大連続</span><strong>${result.maxStreak}<small>問</small></strong></div>
        <div><span>自己ベスト</span><strong>${state.kanjiBest.score.toLocaleString()}<small>点</small></strong></div>
      </div>
      <div class="quiz-actions kanji-result-actions">
        <button class="secondary-button" data-action="navigate" data-view="home">ホームへ</button>
        <button class="primary-button" data-action="navigate" data-view="kanji">設定を変える</button>
        <button class="kanji-start-button compact" data-action="start-kanji-game"><span>もう一度</span><i>→</i></button>
      </div>
    </section>
  `;
}

function quizMarkup() {
  const question = state.quizQuestions[state.questionIndex];
  if (!question) return '<p class="empty-state">問題を準備できませんでした。</p>';
  const progress = ((state.questionIndex + (state.answered ? 1 : 0)) / state.quizQuestions.length) * 100;
  const responseNormalized = normalizeAnswer(state.response);
  const answerNormalized = normalizeAnswer(question.answer);
  const multi = isMultiQuestion(question);
  const multiEvaluation = multi ? evaluateMultiAnswer(state.response, question) : null;
  const isCorrect = state.answered && (multi ? multiEvaluation.correct : responseNormalized === answerNormalized);
  const choices = question.type === "truefalse" ? ["○", "×"] : (question.choices || []);
  const imageUrl = normalizeImageUrl(question.imageUrl);
  const prompt = displayPrompt(question);
  const inputType = multi || question.type === "text" || question.type === "multi";

  return `
    <section class="quiz-stage">
      <div class="quiz-topbar">
        <button class="back-button" data-action="exit-quiz">終了</button>
        <div class="quiz-progress" aria-label="クイズ進捗"><span style="width:${progress}%"></span></div>
        <span class="timer">${state.timerEnabled ? `残り ${state.timeLeft}秒` : `${state.questionIndex + 1} / ${state.quizQuestions.length}`}</span>
      </div>
      <article class="quiz-card">
        <div class="question-meta"><span>${escapeHtml(question.category)}・${escapeHtml(questionDifficultyLabel(question))}</span><span>QUESTION ${state.questionIndex + 1}</span></div>
        ${imageUrl ? `
          <figure class="question-image-wrap">
            <img class="question-image" src="${escapeHtml(imageUrl)}" alt="問題画像：${escapeHtml(prompt)}" loading="eager" decoding="async" referrerpolicy="no-referrer">
            <figcaption>画像を見て答えてください</figcaption>
            <p class="question-image-error" role="status">画像を読み込めませんでした。</p>
          </figure>
        ` : ""}
        ${multi ? `<div class="multi-badge">多答・全${multiExpectedGroups(question).length}項目</div>` : ""}
        <h1 class="question-text">${escapeHtml(prompt)}</h1>
        ${inputType
          ? `<form id="answer-form">${multi
              ? `<textarea class="text-answer multi-answer" name="answer" placeholder="1行に1つずつ（または読点・カンマ区切り）" autocomplete="off" ${state.answered ? "disabled" : ""}>${escapeHtml(state.response)}</textarea><p class="multi-hint">順不同で回答できます。表記違いは登録済みの別名まで判定します。</p>`
              : `<input class="text-answer" name="answer" value="${escapeHtml(state.response)}" placeholder="答えを入力" autocomplete="off" ${state.answered ? "disabled" : ""}>`}</form>`
          : `<div class="choices">${choices.map((choice) => {
              const selected = normalizeAnswer(choice) === responseNormalized;
              let className = selected ? "selected" : "";
              if (state.answered && normalizeAnswer(choice) === answerNormalized) className = "correct";
              else if (state.answered && selected) className = "incorrect";
              return `<button class="choice-button ${className}" data-action="answer-choice" data-value="${escapeHtml(choice)}" ${state.answered ? "disabled" : ""}>${escapeHtml(choice)}</button>`;
            }).join("")}</div>`
        }
        ${state.answered ? `
          <div class="answer-feedback ${isCorrect ? "correct" : "incorrect"}">
            <strong>${isCorrect ? "正解！すばらしい！" : multi ? `${multiEvaluation.matched.length}/${multiEvaluation.expected.length}項目 正解` : `おしい！正解は「${escapeHtml(question.answer)}」`}</strong>
            ${multi && !isCorrect ? `<div class="multi-feedback">${multiEvaluation.missing.length ? `<p><b>不足：</b>${multiEvaluation.missing.map(escapeHtml).join("／")}</p>` : ""}${multiEvaluation.extras.length ? `<p><b>余分・表記違い：</b>${multiEvaluation.extras.map(escapeHtml).join("／")}</p>` : ""}<details><summary>正解一覧を表示</summary><p>${multiEvaluation.expected.map(escapeHtml).join("／")}</p></details></div>` : ""}
            <p>${escapeHtml(question.explanation)}</p>
          </div>
        ` : ""}
        <div class="quiz-actions">
          ${!state.answered && inputType ? '<button class="primary-button" data-action="submit-text-answer">回答する</button>' : ""}
          ${state.answered ? `<button class="primary-button" data-action="next-question">${state.questionIndex + 1 === state.quizQuestions.length ? "結果を見る" : "次の問題"} <span>→</span></button>` : ""}
        </div>
      </article>
    </section>
  `;
}

function resultMarkup() {
  const attempt = state.latestAttempt;
  if (!attempt) return '<p class="empty-state">結果がありません。</p>';
  return `
    <section class="result-card">
      <div class="result-crown">♛</div>
      <p class="section-kicker">QUIZ COMPLETE</p>
      <h1>挑戦完了！</h1>
      <div class="score">${attempt.score}<small>/${attempt.total}</small></div>
      <p class="page-description">${attempt.rate === 100 ? "全問正解！クイズ王への大きな一歩です。" : attempt.rate >= 70 ? "ナイスチャレンジ！知識がしっかり身についています。" : "挑戦したことが力になります。解説を復習して再挑戦しよう！"}</p>
      <div class="result-grid">
        <div><span>正答率</span><strong>${attempt.rate}%</strong></div>
        <div><span>獲得XP</span><strong>+${attempt.xp}</strong></div>
        <div><span>連続学習</span><strong>${state.stats.streak}日</strong></div>
      </div>
      <div class="quiz-actions">
        <button class="secondary-button" data-action="navigate" data-view="home">ホームへ</button>
        <button class="primary-button" data-action="start-quiz">もう一度挑戦</button>
      </div>
    </section>
  `;
}

function recordsMarkup() {
  const attempts = state.attempts.slice(0, 20);
  const accuracy = state.stats.totalAnswers
    ? Math.round((state.stats.correctAnswers / state.stats.totalAnswers) * 100)
    : 0;
  return `
    <section class="page-head">
      <p class="section-kicker">LEARNING RECORD</p>
      <h1 class="page-title">学習記録</h1>
      <p class="page-description">挑戦の積み重ねを確認して、次の目標を決めよう。</p>
    </section>
    <div class="records-grid">
      <div class="mini-stat"><span>合計XP</span><strong>${state.stats.totalXp.toLocaleString()}</strong></div>
      <div class="mini-stat"><span>総回答数</span><strong>${state.stats.totalAnswers}問</strong></div>
      <div class="mini-stat"><span>正答率</span><strong>${accuracy}%</strong></div>
    </div>
    <section class="panel">
      <h2>最近の挑戦</h2>
      ${attempts.length ? `
        <div class="table-wrap"><table>
          <thead><tr><th>日時</th><th>分野</th><th>得点</th><th>正答率</th><th>XP</th></tr></thead>
          <tbody>${attempts.map((attempt) => {
            const subject = state.subjects.find((item) => item.id === attempt.subjectId);
            return `<tr><td>${formatDate(attempt.createdAt)}</td><td>${escapeHtml(subject?.name || "全分野")}</td><td>${attempt.score}/${attempt.total}</td><td>${attempt.rate}%</td><td>+${attempt.xp}</td></tr>`;
          }).join("")}</tbody>
        </table></div>
      ` : '<p class="empty-state">まだ記録がありません。最初のクイズに挑戦しよう！</p>'}
    </section>
  `;
}

function rankingMarkup() {
  const localPlayer = {
    rank: "—",
    name: state.user?.name || "あなた",
    xp: state.stats.totalXp,
    streak: state.stats.streak,
  };
  const players = state.rankings.length ? state.rankings : [localPlayer];
  return `
    <section class="page-head">
      <p class="section-kicker">QUIZKING RANKING</p>
      <h1 class="page-title">ランキング</h1>
      <p class="page-description">獲得XPを競いながら、みんなで楽しく知識を増やそう。</p>
    </section>
    <section class="panel">
      ${!state.connected ? '<p class="admin-note">サンプルモードでは、この端末の成績だけを表示します。</p>' : ""}
      <div class="table-wrap"><table>
        <thead><tr><th>順位</th><th>プレイヤー</th><th>合計XP</th><th>連続学習</th></tr></thead>
        <tbody>${players.map((player) => `
          <tr><td class="rank-badge">${player.rank <= 3 ? ["♛", "◆", "▲"][player.rank - 1] : escapeHtml(player.rank)}</td><td>${escapeHtml(player.name)}</td><td>${Number(player.xp || 0).toLocaleString()} XP</td><td>${Number(player.streak || 0)}日</td></tr>
        `).join("")}</tbody>
      </table></div>
    </section>
  `;
}

function pageMarkup() {
  const pages = {
    home: homeMarkup,
    kanji: kanjiSetupMarkup,
    "kanji-game": kanjiGameMarkup,
    "kanji-result": kanjiResultMarkup,
    subject: subjectMarkup,
    settings: settingsMarkup,
    quiz: quizMarkup,
    result: resultMarkup,
    records: recordsMarkup,
    ranking: rankingMarkup,
    reference: referenceMarkup,
    "trivia-library": triviaLibraryMarkup,
    prime: primeSetupMarkup,
    "prime-game": primeGameMarkup,
    "prime-result": primeResultMarkup,
  };
  return (pages[state.view] || homeMarkup)();
}

function render() {
  window.clearInterval(timerId);
  if (!state.user || state.view === "login") {
    app.innerHTML = loginMarkup();
    return;
  }
  app.innerHTML = `
    <div class="app-shell">
      ${headerMarkup()}
      <main class="site-main">${connectionMarkup()}${pageMarkup()}</main>
      ${mobileNavMarkup()}
    </div>
  `;
  if (state.view === "quiz" && state.timerEnabled && !state.answered) startTimer();
  if (state.view === "kanji-game" && !state.kanjiAnswered) {
    startKanjiTimer();
    window.requestAnimationFrame(() => document.getElementById("kanji-answer")?.focus());
  }
  if (state.view === "prime-game" && state.primeMode === "timed") startPrimeTimer();
}

function navigate(view) {
  state.view = view;
  if (view === "ranking") loadRankings();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectSubject(subjectId) {
  state.selectedSubjectId = subjectId || null;
  state.selectedCategory = "すべて";
  state.quizKanjiLevel = "all";
  navigate(subjectId ? "subject" : "settings");
}

function buildQuiz() {
  let pool = state.questions.filter((question) => {
    const subjectMatch = !state.selectedSubjectId || question.subjectId === state.selectedSubjectId;
    const categoryMatch = state.selectedCategory === "すべて" || question.category === state.selectedCategory;
    const modeMatch = questionMatchesMode(question);
    const difficultyMatch = usesQuizKanjiLevel()
      ? questionMatchesQuizKanjiLevel(question)
      : state.difficulty === 0 || Number(question.difficulty) === state.difficulty;
    return !isReadingTrivia(question) && subjectMatch && categoryMatch && modeMatch && difficultyMatch;
  });

  if (!pool.length) {
    showToast("この条件で公開中の問題はありません。形式または難易度を変更してください。");
    return;
  }
  if (state.shuffle) pool = shuffle(pool);
  state.quizQuestions = Array.from({ length: state.questionCount }, (_, index) => ({
    ...pool[index % pool.length],
    runtimeId: `${pool[index % pool.length].id}-${index}`,
  }));
  state.questionIndex = 0;
  state.response = "";
  state.answered = false;
  state.timeLeft = questionTimeLimit(state.quizQuestions[0]);
  state.results = [];
  state.latestAttempt = null;
  navigate("quiz");
}

function submitAnswer(value) {
  if (state.answered) return;
  const question = state.quizQuestions[state.questionIndex];
  if (!question) return;
  state.response = String(value ?? "");
  const correct = isMultiQuestion(question)
    ? evaluateMultiAnswer(state.response, question).correct
    : normalizeAnswer(state.response) === normalizeAnswer(question.answer);
  state.results.push({
    questionId: question.id,
    response: state.response || "未回答",
    correct,
  });
  state.answered = true;
  render();
}

function nextQuestion() {
  if (!state.answered) return;
  if (state.questionIndex + 1 >= state.quizQuestions.length) {
    finishQuiz();
    return;
  }
  state.questionIndex += 1;
  state.response = "";
  state.answered = false;
  state.timeLeft = questionTimeLimit(state.quizQuestions[state.questionIndex]);
  render();
}

function startTimer() {
  timerId = window.setInterval(() => {
    state.timeLeft -= 1;
    const timer = document.querySelector(".timer");
    if (timer) timer.textContent = `残り ${Math.max(0, state.timeLeft)}秒`;
    if (state.timeLeft <= 0) {
      window.clearInterval(timerId);
      submitAnswer("");
    }
  }, 1000);
}

function finishQuiz() {
  const score = state.results.filter((result) => result.correct).length;
  const total = state.results.length;
  const rate = total ? Math.round((score / total) * 100) : 0;
  const xp = score * 20 + (rate === 100 ? 50 : 0);
  const now = new Date().toISOString();
  const attempt = {
    id: `local-${Date.now()}`,
    subjectId: state.selectedSubjectId || "all",
    score,
    total,
    rate,
    xp,
    createdAt: now,
  };
  state.latestAttempt = attempt;
  state.attempts = [attempt, ...state.attempts].slice(0, 100);
  state.stats.totalXp += xp;
  state.stats.totalAnswers += total;
  state.stats.correctAnswers += score;
  state.stats.streak = calculateStreak(state.attempts);
  writeStorage(STORAGE.attempts, state.attempts);
  writeStorage(STORAGE.stats, state.stats);
  if (state.connected) {
    postAction({
      action: "recordAttempt",
      clientId: state.clientId,
      nickname: state.user.name,
      subjectId: attempt.subjectId,
      score,
      total,
      correctRate: rate,
      xpEarned: xp,
      answers: state.results,
    }).catch((error) => console.warn(error));
  }
  navigate("result");
}

function startKanjiGame() {
  let pool = getKanjiReadingQuestions(state.kanjiDifficulty);
  if (!pool.length && state.kanjiDifficulty !== "all") {
    state.kanjiDifficulty = "all";
    pool = getKanjiReadingQuestions();
    showToast("選んだ漢検級に問題がないため、すべての級から出題します。");
  }
  if (!pool.length) {
    showToast("公開中の漢字読み問題がありません。");
    return;
  }
  state.kanjiQuestions = shuffle(pool).slice(0, Math.min(state.kanjiQuestionCount, pool.length));
  state.kanjiIndex = 0;
  state.kanjiResponse = "";
  state.kanjiWrongAttempts = 0;
  state.kanjiAnswered = false;
  state.kanjiTimeLeft = KANJI_TIME_LIMIT;
  state.kanjiLives = 3;
  state.kanjiScore = 0;
  state.kanjiStreak = 0;
  state.kanjiMaxStreak = 0;
  state.kanjiResults = [];
  state.kanjiLatestResult = null;
  navigate("kanji-game");
}

function submitKanjiAnswer(value) {
  if (state.kanjiAnswered) return;
  const question = state.kanjiQuestions[state.kanjiIndex];
  if (!question) return;
  const response = String(value ?? "").trim();
  const correct = isKanjiReadingCorrect(response, question);
  const timedOut = !response && state.kanjiTimeLeft <= 0;

  if (!correct && !timedOut) {
    state.kanjiWrongAttempts += 1;
    state.kanjiStreak = 0;
    state.kanjiResponse = "";
    const input = document.getElementById("kanji-answer");
    const status = document.getElementById("kanji-retry-status");
    if (input) {
      input.value = "";
      input.setAttribute("aria-invalid", "true");
      input.focus();
    }
    if (status) {
      status.classList.add("incorrect");
      status.textContent = `ちがいます（${state.kanjiWrongAttempts}回目）。時間内なら何度でも再挑戦できます。`;
    }
    return;
  }

  window.clearInterval(timerId);
  state.kanjiResponse = response;
  let earned = 0;
  if (correct) {
    state.kanjiStreak += 1;
    state.kanjiMaxStreak = Math.max(state.kanjiMaxStreak, state.kanjiStreak);
    earned = kanjiLevelMultiplier(question) * 100 + state.kanjiTimeLeft * 10 + Math.max(0, state.kanjiStreak - 1) * 25;
    state.kanjiScore += earned;
  } else if (timedOut) {
    state.kanjiLives = Math.max(0, state.kanjiLives - 1);
    state.kanjiStreak = 0;
  }
  state.kanjiResults.push({
    questionId: question.id,
    response: state.kanjiResponse || "未回答",
    correct,
    earned,
    attempts: state.kanjiWrongAttempts + (correct ? 1 : 0),
  });
  state.kanjiAnswered = true;
  render();
}

function nextKanjiQuestion() {
  if (!state.kanjiAnswered) return;
  if (state.kanjiLives <= 0 || state.kanjiIndex + 1 >= state.kanjiQuestions.length) {
    finishKanjiGame();
    return;
  }
  state.kanjiIndex += 1;
  state.kanjiResponse = "";
  state.kanjiWrongAttempts = 0;
  state.kanjiAnswered = false;
  state.kanjiTimeLeft = KANJI_TIME_LIMIT;
  render();
}

function startKanjiTimer() {
  timerId = window.setInterval(() => {
    state.kanjiTimeLeft -= 1;
    const timer = document.querySelector(".kanji-timer");
    const timerNumber = timer?.querySelector("strong");
    const timerBar = timer?.querySelector(".kanji-timer-bar");
    if (timer) timer.setAttribute("aria-label", `残り時間 ${Math.max(0, state.kanjiTimeLeft)}秒`);
    if (timerNumber) timerNumber.textContent = String(Math.max(0, state.kanjiTimeLeft));
    if (timerBar) timerBar.style.width = `${Math.max(0, (state.kanjiTimeLeft / KANJI_TIME_LIMIT) * 100)}%`;
    if (state.kanjiTimeLeft <= 0) {
      window.clearInterval(timerId);
      submitKanjiAnswer("");
    }
  }, 1000);
}

function finishKanjiGame() {
  const correct = state.kanjiResults.filter((result) => result.correct).length;
  const total = state.kanjiResults.length;
  const rate = total ? Math.round((correct / total) * 100) : 0;
  const previousBest = Number(state.kanjiBest.score) || 0;
  const isBest = state.kanjiScore > previousBest;
  if (isBest || state.kanjiMaxStreak > (Number(state.kanjiBest.streak) || 0)) {
    state.kanjiBest = {
      score: Math.max(previousBest, state.kanjiScore),
      streak: Math.max(Number(state.kanjiBest.streak) || 0, state.kanjiMaxStreak),
    };
    writeStorage(STORAGE.kanjiBest, state.kanjiBest);
  }
  state.kanjiLatestResult = {
    score: state.kanjiScore,
    correct,
    total,
    rate,
    maxStreak: state.kanjiMaxStreak,
    isBest,
  };

  const xp = correct * 25 + state.kanjiMaxStreak * 5;
  const now = new Date().toISOString();
  const attempt = {
    id: `kanji-${Date.now()}`,
    subjectId: "japanese",
    score: correct,
    total,
    rate,
    xp,
    createdAt: now,
  };
  state.attempts = [attempt, ...state.attempts].slice(0, 100);
  state.stats.totalXp += xp;
  state.stats.totalAnswers += total;
  state.stats.correctAnswers += correct;
  state.stats.streak = calculateStreak(state.attempts);
  writeStorage(STORAGE.attempts, state.attempts);
  writeStorage(STORAGE.stats, state.stats);
  if (state.connected) {
    postAction({
      action: "recordAttempt",
      clientId: state.clientId,
      nickname: state.user.name,
      subjectId: "japanese",
      score: correct,
      total,
      correctRate: rate,
      xpEarned: xp,
      answers: state.kanjiResults,
    }).catch((error) => console.warn(error));
  }
  navigate("kanji-result");
}

function createPrimeWall() {
  const level = PRIME_LEVELS[state.primeDifficulty] || PRIME_LEVELS.normal;
  const factorCount = level.minFactors + Math.floor(Math.random() * (level.maxFactors - level.minFactors + 1));
  const factors = Array.from({ length: factorCount }, () => level.primes[Math.floor(Math.random() * level.primes.length)]).sort((a, b) => a - b);
  const number = factors.reduce((product, factor) => product * factor, 1);
  state.primeRound += 1;
  state.primeCurrent = number;
  state.primeRemaining = number;
  state.primeFactors = [];
  state.primeMisses = 0;
}

function startPrimeGame() {
  state.primeRound = 0;
  state.primeScore = 0;
  state.primeStreak = 0;
  state.primeMaxStreak = 0;
  state.primeSolved = 0;
  state.primeTimeLeft = 60;
  state.primeStartedAt = Date.now();
  state.primeResults = [];
  state.primeLatest = null;
  createPrimeWall();
  navigate("prime-game");
}

function choosePrime(prime) {
  if (state.view !== "prime-game" || state.primeRemaining === 1) return;
  const value = Number(prime);
  if (!Number.isInteger(value) || value < 2) return;
  if (state.primeRemaining % value !== 0) {
    state.primeMisses += 1;
    state.primeStreak = 0;
    showToast(`${value}では割り切れません。別の素数を選ぼう。`);
    render();
    return;
  }
  state.primeRemaining /= value;
  state.primeFactors.push(value);
  if (state.primeRemaining === 1) {
    const earned = Math.max(50, state.primeFactors.length * 120 + state.primeStreak * 35 - state.primeMisses * 40);
    state.primeScore += earned;
    state.primeSolved += 1;
    state.primeStreak += 1;
    state.primeMaxStreak = Math.max(state.primeMaxStreak, state.primeStreak);
    state.primeResults.push({ number: state.primeCurrent, factors: [...state.primeFactors], misses: state.primeMisses, earned });
  }
  render();
}

function nextPrimeWall() {
  if (state.primeRemaining !== 1) return;
  if (state.primeMode === "casual" && state.primeSolved >= state.primeTargetCount) {
    finishPrimeGame();
    return;
  }
  createPrimeWall();
  render();
}

function startPrimeTimer() {
  timerId = window.setInterval(() => {
    state.primeTimeLeft -= 1;
    const clock = document.querySelector(".prime-clock");
    const bar = document.querySelector(".prime-game-progress span");
    if (clock) clock.textContent = String(Math.max(0, state.primeTimeLeft));
    if (bar) bar.style.width = `${Math.max(0, (state.primeTimeLeft / 60) * 100)}%`;
    if (state.primeTimeLeft <= 0) {
      window.clearInterval(timerId);
      finishPrimeGame();
    }
  }, 1000);
}

function finishPrimeGame() {
  window.clearInterval(timerId);
  const elapsed = state.primeMode === "timed"
    ? 60
    : Math.max(1, Math.round((Date.now() - Number(state.primeStartedAt || Date.now())) / 1000));
  const misses = state.primeResults.reduce((sum, result) => sum + result.misses, 0) + (state.primeRemaining === 1 ? 0 : state.primeMisses);
  const previousBest = Number(state.primeBest.score) || 0;
  const isBest = state.primeScore > previousBest;
  state.primeBest = {
    score: Math.max(previousBest, state.primeScore),
    streak: Math.max(Number(state.primeBest.streak) || 0, state.primeMaxStreak),
  };
  writeStorage(STORAGE.primeBest, state.primeBest);
  state.primeLatest = { score: state.primeScore, solved: state.primeSolved, maxStreak: state.primeMaxStreak, misses, elapsed, isBest };
  navigate("prime-result");
}

function calculateStreak(attempts) {
  const dayKeys = [...new Set(attempts.map((attempt) => localDateKey(new Date(attempt.createdAt))))].sort().reverse();
  if (!dayKeys.length) return 0;
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  const newest = new Date(`${dayKeys[0]}T00:00:00`);
  const gap = Math.round((cursor.getTime() - newest.getTime()) / 86400000);
  if (gap > 1) return 0;
  if (gap === 1) cursor.setDate(cursor.getDate() - 1);
  for (const key of dayKeys) {
    if (key !== localDateKey(cursor)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function localDateKey(date) {
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function loadRankings() {
  if (!state.connected) return;
  try {
    const payload = await jsonp("rankings");
    if (payload?.ok && Array.isArray(payload.rankings)) {
      state.rankings = payload.rankings;
      if (state.view === "ranking") render();
    }
  } catch (error) {
    console.warn(error);
    showToast("ランキングを読み込めませんでした。");
  }
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action } = button.dataset;
  if (action === "navigate") navigate(button.dataset.view);
  if (action === "open-reference") {
    const section = button.dataset.section;
    state.referenceSection = section;
    state.referenceTab = section === "olympics" ? "summer" : section === "movies" ? "allTime" : "m1";
    state.selectedSubjectId = section === "olympics" ? "pe" : "culture";
    state.selectedCategory = section === "olympics" ? "オリンピック" : section === "movies" ? "映画" : "お笑い";
    navigate("reference");
  }
  if (action === "set-reference-tab") { state.referenceTab = button.dataset.value; render(); }
  if (action === "set-prime-difficulty") { state.primeDifficulty = button.dataset.value; render(); }
  if (action === "set-prime-mode") { state.primeMode = button.dataset.value; render(); }
  if (action === "start-prime-game") startPrimeGame();
  if (action === "choose-prime") choosePrime(button.dataset.value);
  if (action === "next-prime-wall") nextPrimeWall();
  if (action === "exit-prime-game") {
    if (window.confirm("素因数分解ゲームを終了して数学へ戻りますか？")) navigate("prime");
  }
  if (action === "set-kanji-difficulty") {
    state.kanjiDifficulty = button.dataset.value || "all";
    render();
  }
  if (action === "set-kanji-count") {
    state.kanjiQuestionCount = Number(button.dataset.value);
    render();
  }
  if (action === "start-kanji-game") startKanjiGame();
  if (action === "next-kanji-question") nextKanjiQuestion();
  if (action === "exit-kanji-game") {
    if (window.confirm("漢字キングを終了してホームへ戻りますか？")) navigate("home");
  }
  if (action === "select-subject") selectSubject(button.dataset.subject);
  if (action === "quick-quiz") {
    state.selectedSubjectId = null;
    state.selectedCategory = "すべて";
    state.quizKanjiLevel = "all";
    state.questionCount = 5;
    state.answerMode = "all";
    buildQuiz();
  }
  if (action === "select-category") {
    state.selectedCategory = button.dataset.category;
    state.quizKanjiLevel = "all";
    navigate("settings");
  }
  if (action === "back-from-settings") navigate(state.selectedSubjectId ? "subject" : "home");
  if (action === "set-count") { state.questionCount = Number(button.dataset.value); render(); }
  if (action === "set-mode") { state.answerMode = button.dataset.value; render(); }
  if (action === "set-difficulty") { state.difficulty = Number(button.dataset.value); render(); }
  if (action === "set-quiz-kanji-level") { state.quizKanjiLevel = button.dataset.value || "all"; render(); }
  if (action === "toggle-timer") { state.timerEnabled = !state.timerEnabled; render(); }
  if (action === "toggle-shuffle") { state.shuffle = !state.shuffle; render(); }
  if (action === "start-quiz") buildQuiz();
  if (action === "answer-choice") submitAnswer(button.dataset.value);
  if (action === "submit-text-answer") {
    const input = document.querySelector('#answer-form [name="answer"]');
    if (!input?.value.trim()) { showToast("答えを入力してください。"); return; }
    submitAnswer(input.value);
  }
  if (action === "next-question") nextQuestion();
  if (action === "exit-quiz") {
    if (window.confirm("クイズを終了してホームへ戻りますか？")) navigate("home");
  }
  if (action === "logout") {
    localStorage.removeItem(STORAGE.profile);
    state.user = null;
    state.view = "login";
    render();
  }
});

app.addEventListener("input", (event) => {
  if (event.target.id === "kanji-answer" && event.target.hasAttribute("aria-invalid")) {
    event.target.removeAttribute("aria-invalid");
    const status = document.getElementById("kanji-retry-status");
    status?.classList.remove("incorrect");
  }
  if (event.target.id === "subject-search") {
    state.search = event.target.value;
    const position = event.target.selectionStart;
    render();
    const nextInput = document.getElementById("subject-search");
    nextInput?.focus();
    nextInput?.setSelectionRange(position, position);
  }
});

app.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.target.id === "login-form") {
    const form = new FormData(event.target);
    const nickname = String(form.get("nickname") || "").trim();
    if (!nickname) return;
    state.user = { name: nickname };
    state.view = "home";
    writeStorage(STORAGE.profile, state.user);
    render();
  }
  if (event.target.id === "answer-form") {
    const form = new FormData(event.target);
    const answer = String(form.get("answer") || "").trim();
    if (!answer) { showToast("答えを入力してください。"); return; }
    submitAnswer(answer);
  }
  if (event.target.id === "kanji-answer-form") {
    const form = new FormData(event.target);
    const answer = String(form.get("answer") || "").trim();
    if (!answer) { showToast("読みを入力してください。"); return; }
    submitKanjiAnswer(answer);
  }
});

document.addEventListener("error", (event) => {
  if (!(event.target instanceof HTMLImageElement) || !event.target.matches(".question-image")) return;
  event.target.closest(".question-image-wrap")?.classList.add("load-error");
}, true);

render();
loadBootstrap();
