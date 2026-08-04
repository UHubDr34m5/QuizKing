"use strict";

/*
 * GASをデプロイしたら、次の値を /exec で終わるウェブアプリURLに置き換えてください。
 * 例: https://script.google.com/macros/s/AKfycb.../exec
 */
const GAS_WEB_APP_URL = "PASTE_YOUR_GAS_WEB_APP_EXEC_URL_HERE";

const SUBJECTS_FALLBACK = [
  { id: "japanese", name: "国語", icon: "本", color: "#b7f43a", description: "ことばの力を磨き、表現と読解の土台をつくろう。", categories: ["漢字", "四字熟語", "類義語・対義語", "諺", "故事成語", "文法", "文学"] },
  { id: "math", name: "数学", icon: "∑", color: "#20e0ff", description: "計算から数学雑学まで、筋道立てて考える力を育てよう。", categories: ["計算", "数と式", "方程式", "関数", "図形", "確率・統計", "数学史・数学雑学"] },
  { id: "english", name: "英語", icon: "ABC", color: "#9a70ff", description: "単語・文法・会話表現から英語圏の文化まで学ぼう。", categories: ["英単語", "英熟語", "文法", "発音", "会話表現", "英語圏文化"] },
  { id: "science", name: "理科", icon: "⚗", color: "#b7f43a", description: "自然の「なぜ？」を物理・化学・生物・地学から解き明かそう。", categories: ["物理", "化学", "生物", "地学", "科学史", "身近な科学"] },
  { id: "social", name: "社会", icon: "◎", color: "#20e0ff", description: "歴史・地理・政治・経済をつなげて世界を理解しよう。", categories: ["日本史", "世界史", "地理", "政治", "経済", "時事", "世界遺産"] },
  { id: "pe", name: "体育", icon: "●", color: "#ff6f91", description: "競技のルール、記録、歴史からスポーツをもっと楽しもう。", categories: ["球技", "陸上", "水泳", "体操", "武道", "ルール・記録", "スポーツ史"] },
  { id: "health", name: "保健", icon: "＋", color: "#57d6a5", description: "体と心を守るために、正しい健康知識を身につけよう。", categories: ["人体", "病気・予防", "応急手当", "心の健康", "栄養", "生活習慣"] },
  { id: "informatics", name: "情報", icon: "</>", color: "#20e0ff", description: "コンピュータ、AI、情報モラルを実生活につなげよう。", categories: ["コンピュータ", "ネットワーク", "プログラミング", "情報モラル", "AI", "データ活用"] },
  { id: "home", name: "家庭科", icon: "⌂", color: "#ffb84d", description: "衣食住、家計、子育てに役立つ生活の知恵を学ぼう。", categories: ["調理", "栄養", "被服", "住生活", "消費生活", "子育て"] },
  { id: "music", name: "音楽", icon: "♪", color: "#dc72ff", description: "楽典、楽器、作曲家、世界の音楽を味わおう。", categories: ["楽典", "楽器", "作曲家", "日本音楽", "世界の音楽", "音楽史"] },
  { id: "art", name: "美術", icon: "◇", color: "#ff6f91", description: "名作と表現技法を知り、見る力とつくる力を育てよう。", categories: ["絵画", "彫刻", "色彩", "デザイン", "日本美術", "西洋美術"] },
  { id: "calligraphy", name: "書道", icon: "墨", color: "#d9c8ff", description: "書体、名筆、漢字の成り立ちから文字文化を味わおう。", categories: ["楷書", "行書", "草書", "書道史", "漢字の成り立ち", "名筆"] },
  { id: "finance", name: "金融", icon: "¥", color: "#ffd75a", description: "家計、税金、投資、保険を知り、お金と上手につき合おう。", categories: ["家計", "貯蓄", "投資", "税金", "保険", "経済の仕組み", "詐欺対策"] },
  { id: "manners", name: "マナー", icon: "礼", color: "#57d6a5", description: "相手を思いやる作法と言葉遣いを場面別に学ぼう。", categories: ["食事", "冠婚葬祭", "ビジネス", "公共の場", "国際マナー", "言葉遣い"] },
  { id: "culture", name: "一般教養", icon: "知", color: "#7ea7ff", description: "法律、文化、哲学、発明など社会人にも役立つ知識を広げよう。", categories: ["法律", "文化", "宗教", "哲学", "暦・単位", "発明・発見"] },
  { id: "trivia", name: "雑学", icon: "？", color: "#ff8f5a", description: "思わず誰かに話したくなる、身近で意外な知識を集めよう。", categories: ["生き物", "食べ物", "乗り物", "言葉", "世界一・日本一", "企業・商品", "不思議"] },
];

const QUESTIONS_FALLBACK = [
  { id: "q01", subjectId: "japanese", category: "漢字", type: "choice", prompt: "「進捗」の正しい読み方は？", choices: ["しんちょく", "しんぽ", "しんしょう", "しんたく"], answer: "しんちょく", explanation: "「捗」は『はかどる』とも読みます。", difficulty: 1 },
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
  answerMode: "mixed",
  difficulty: 0,
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
  adminKey: "",
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

function normalizeAnswer(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[。、．.！!？?\s]/g, "")
    .replace(/^アレクサンダーグラハム/, "");
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
    const timeout = window.setTimeout(() => finish(new Error("GASからの応答がタイムアウトしました。")), 12000);

    function finish(error, payload) {
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

async function waitForMutationResult(requestId) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    const payload = await jsonp("mutationResult", { requestId });
    if (payload?.pending) continue;
    return payload;
  }
  throw new Error("更新結果の確認がタイムアウトしました。");
}

async function loadBootstrap() {
  if (!isConfigured()) {
    state.loading = false;
    state.connected = false;
    render();
    return;
  }
  try {
    const payload = await jsonp("bootstrap");
    if (!payload || payload.ok !== true) throw new Error(payload?.error || "読み込みに失敗しました。");
    if (Array.isArray(payload.subjects) && payload.subjects.length) state.subjects = payload.subjects;
    if (Array.isArray(payload.questions) && payload.questions.length) state.questions = payload.questions;
    state.connected = true;
  } catch (error) {
    console.warn(error);
    state.connected = false;
    showToast("GASに接続できないため、サンプル問題で表示しています。");
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
  return '<div class="connection-banner"><span class="connection-dot"></span>サンプルモード：docs/app.js にGASのURLを設定するとデータが同期されます</div>';
}

function headerMarkup() {
  const navItems = [
    ["home", "ホーム"],
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
      <button class="account" data-action="navigate" data-view="admin" aria-label="管理者ページを開く">
        <span class="avatar">♛</span>
        <span>${escapeHtml(state.user?.name || "ゲスト")}</span>
        <span>⌄</span>
      </button>
    </header>
  `;
}

function mobileNavMarkup() {
  if (state.view === "quiz") return "";
  const navItems = [["home", "⌂", "ホーム"], ["records", "▥", "学習記録"], ["ranking", "♛", "ランキング"]];
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

function subjectMarkup() {
  const subject = state.subjects.find((item) => item.id === state.selectedSubjectId);
  if (!subject) return homeMarkup();
  const questionCounts = state.questions.reduce((map, question) => {
    if (question.subjectId === subject.id) map[question.category] = (map[question.category] || 0) + 1;
    return map;
  }, {});
  return `
    <section class="page-head">
      <button class="back-button" data-action="navigate" data-view="home">← 分野一覧へ</button>
      <p class="section-kicker">FIELD: ${escapeHtml(subject.id)}</p>
      <h1 class="page-title">${escapeHtml(subject.name)}</h1>
      <p class="page-description">${escapeHtml(subject.description)}</p>
    </section>
    <div class="category-grid">
      <button class="category-card" data-action="select-category" data-category="すべて">
        <strong>全分類</strong><span>${state.questions.filter((question) => question.subjectId === subject.id).length}問を横断</span><i>→</i>
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
  const modeOptions = [["mixed", "ミックス"], ["choice", "択一"], ["text", "記述"], ["truefalse", "○×"]];
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
            ${[5, 10, 20, 30].map((count) => `<button class="${state.questionCount === count ? "active" : ""}" data-action="set-count" data-value="${count}">${count}問</button>`).join("")}
          </div>
        </div>
        <div class="setting-group">
          <label>解答形式</label>
          <div class="segmented">
            ${modeOptions.map(([value, label]) => `<button class="${state.answerMode === value ? "active" : ""}" data-action="set-mode" data-value="${value}">${label}</button>`).join("")}
          </div>
        </div>
        <div class="setting-group">
          <label>難易度</label>
          <div class="segmented">
            ${[[0, "すべて"], [1, "★"], [2, "★★"], [3, "★★★"]].map(([value, label]) => `<button class="${state.difficulty === value ? "active" : ""}" data-action="set-difficulty" data-value="${value}">${label}</button>`).join("")}
          </div>
        </div>
        <div class="setting-group">
          <div class="toggle-row"><span>制限時間（1問20秒）</span><button class="switch ${state.timerEnabled ? "on" : ""}" data-action="toggle-timer" aria-pressed="${state.timerEnabled}"><span></span></button></div>
          <div class="toggle-row"><span>問題をシャッフル</span><button class="switch ${state.shuffle ? "on" : ""}" data-action="toggle-shuffle" aria-pressed="${state.shuffle}"><span></span></button></div>
        </div>
      </section>
      <aside class="panel quiz-summary">
        <div class="summary-hero"><span>今回の挑戦</span><strong>${escapeHtml(subject?.name || "全分野")}</strong><p>${escapeHtml(state.selectedCategory)}</p></div>
        <div class="mini-stat"><span>問題数</span><strong>${state.questionCount}問</strong></div>
        <div class="mini-stat"><span>形式</span><strong>${escapeHtml(modeOptions.find(([value]) => value === state.answerMode)?.[1] || "ミックス")}</strong></div>
        <button class="primary-button" data-action="start-quiz">クイズを開始 <span>→</span></button>
      </aside>
    </div>
  `;
}

function quizMarkup() {
  const question = state.quizQuestions[state.questionIndex];
  if (!question) return '<p class="empty-state">問題を準備できませんでした。</p>';
  const progress = ((state.questionIndex + (state.answered ? 1 : 0)) / state.quizQuestions.length) * 100;
  const responseNormalized = normalizeAnswer(state.response);
  const answerNormalized = normalizeAnswer(question.answer);
  const isCorrect = state.answered && responseNormalized === answerNormalized;
  const choices = question.type === "truefalse" ? ["○", "×"] : (question.choices || []);

  return `
    <section class="quiz-stage">
      <div class="quiz-topbar">
        <button class="back-button" data-action="exit-quiz">終了</button>
        <div class="quiz-progress" aria-label="クイズ進捗"><span style="width:${progress}%"></span></div>
        <span class="timer">${state.timerEnabled ? `残り ${state.timeLeft}秒` : `${state.questionIndex + 1} / ${state.quizQuestions.length}`}</span>
      </div>
      <article class="quiz-card">
        <div class="question-meta"><span>${escapeHtml(question.category)}・難易度 ${"★".repeat(Number(question.difficulty) || 1)}</span><span>QUESTION ${state.questionIndex + 1}</span></div>
        <h1 class="question-text">${escapeHtml(question.prompt)}</h1>
        ${question.type === "text"
          ? `<form id="answer-form"><input class="text-answer" name="answer" value="${escapeHtml(state.response)}" placeholder="答えを入力" autocomplete="off" ${state.answered ? "disabled" : ""}></form>`
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
            <strong>${isCorrect ? "正解！すばらしい！" : `おしい！正解は「${escapeHtml(question.answer)}」`}</strong>
            ${escapeHtml(question.explanation)}
          </div>
        ` : ""}
        <div class="quiz-actions">
          ${!state.answered && question.type === "text" ? '<button class="primary-button" data-action="submit-text-answer">回答する</button>' : ""}
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

function adminMarkup() {
  const questionRows = state.questions.slice(0, 50);
  return `
    <section class="page-head">
      <p class="section-kicker">ADMIN CONSOLE</p>
      <h1 class="page-title">管理者ページ</h1>
      <p class="page-description">分野・問題を追加し、表示順をいつでも変更できます。</p>
    </section>
    ${!state.connected ? '<div class="connection-banner"><span class="connection-dot"></span>GAS未接続のため、現在の変更は画面上だけのプレビューです。</div>' : ""}
    <div class="admin-key">
      <div class="field"><label for="admin-key">管理者キー（このタブを閉じるまでのみ保持）</label><input id="admin-key" type="password" value="${escapeHtml(state.adminKey)}" autocomplete="current-password" placeholder="GASで設定した管理者キー"></div>
      <button class="secondary-button" data-action="remember-admin-key">キーを適用</button>
    </div>
    <div class="admin-grid">
      <section class="admin-card">
        <h2>分野を追加</h2>
        <p class="admin-note">分類は「、」またはカンマで区切って入力します。</p>
        <form id="subject-form" class="form-grid">
          <div class="form-grid two">
            <div class="field"><label>分野名</label><input name="name" maxlength="30" required placeholder="例：防災"></div>
            <div class="field"><label>アイコン</label><input name="icon" maxlength="4" placeholder="例：守"></div>
          </div>
          <div class="field"><label>分類</label><input name="categories" required placeholder="地震、台風、避難"></div>
          <div class="field"><label>説明</label><textarea name="description" maxlength="200" placeholder="どんなことを学べる分野か"></textarea></div>
          <div class="field"><label>テーマ色</label><input name="color" type="color" value="#20e0ff"></div>
          <button class="primary-button" type="submit">分野を追加</button>
        </form>
      </section>
      <section class="admin-card">
        <h2>問題を追加</h2>
        <form id="question-form" class="form-grid">
          <div class="form-grid two">
            <div class="field"><label>分野</label><select name="subjectId">${state.subjects.map((subject) => `<option value="${escapeHtml(subject.id)}">${escapeHtml(subject.name)}</option>`).join("")}</select></div>
            <div class="field"><label>形式</label><select name="type"><option value="choice">択一</option><option value="text">記述</option><option value="truefalse">○×</option></select></div>
          </div>
          <div class="field"><label>分類</label><input name="category" required placeholder="例：漢字"></div>
          <div class="field"><label>問題文</label><textarea name="prompt" required maxlength="500"></textarea></div>
          <div class="field"><label>選択肢（択一のみ・カンマ区切り）</label><input name="choices" placeholder="答え1, 答え2, 答え3, 答え4"></div>
          <div class="form-grid two">
            <div class="field"><label>正解</label><input name="answer" required maxlength="150"></div>
            <div class="field"><label>難易度</label><select name="difficulty"><option value="1">★</option><option value="2">★★</option><option value="3">★★★</option></select></div>
          </div>
          <div class="field"><label>解説</label><textarea name="explanation" required maxlength="500"></textarea></div>
          <button class="primary-button" type="submit">問題を追加</button>
        </form>
      </section>
      <section class="admin-card">
        <h2>分野の並び替え</h2>
        <div class="sortable-list">
          ${state.subjects.map((subject, index) => `
            <div class="sortable-item"><span>${index + 1}</span><div><strong>${escapeHtml(subject.name)}</strong><small>${escapeHtml(subject.categories.slice(0, 3).join("・"))}</small></div><div class="sort-actions"><button data-action="move-subject" data-id="${escapeHtml(subject.id)}" data-direction="-1" aria-label="上へ">↑</button><button data-action="move-subject" data-id="${escapeHtml(subject.id)}" data-direction="1" aria-label="下へ">↓</button></div></div>
          `).join("")}
        </div>
      </section>
      <section class="admin-card">
        <h2>問題の並び替え</h2>
        <p class="admin-note">先頭50問を表示しています。</p>
        <div class="sortable-list">
          ${questionRows.map((question, index) => {
            const subject = state.subjects.find((item) => item.id === question.subjectId);
            return `<div class="sortable-item"><span>${index + 1}</span><div><strong>${escapeHtml(question.prompt)}</strong><small>${escapeHtml(subject?.name || question.subjectId)}／${escapeHtml(question.category)}</small></div><div class="sort-actions"><button data-action="move-question" data-id="${escapeHtml(question.id)}" data-direction="-1" aria-label="上へ">↑</button><button data-action="move-question" data-id="${escapeHtml(question.id)}" data-direction="1" aria-label="下へ">↓</button></div></div>`;
          }).join("")}
        </div>
      </section>
      <section class="admin-card full">
        <h2>アカウント</h2>
        <p class="admin-note">試作品ログインはこの端末内のニックネーム方式です。</p>
        <button class="danger-button" data-action="logout">ログアウト</button>
      </section>
    </div>
  `;
}

function pageMarkup() {
  const pages = {
    home: homeMarkup,
    subject: subjectMarkup,
    settings: settingsMarkup,
    quiz: quizMarkup,
    result: resultMarkup,
    records: recordsMarkup,
    ranking: rankingMarkup,
    admin: adminMarkup,
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
  navigate(subjectId ? "subject" : "settings");
}

function buildQuiz() {
  let pool = state.questions.filter((question) => {
    const subjectMatch = !state.selectedSubjectId || question.subjectId === state.selectedSubjectId;
    const categoryMatch = state.selectedCategory === "すべて" || question.category === state.selectedCategory;
    const modeMatch = state.answerMode === "mixed" || question.type === state.answerMode;
    const difficultyMatch = state.difficulty === 0 || Number(question.difficulty) === state.difficulty;
    return subjectMatch && categoryMatch && modeMatch && difficultyMatch;
  });

  if (!pool.length) {
    pool = state.questions.filter((question) => !state.selectedSubjectId || question.subjectId === state.selectedSubjectId);
    showToast("条件に合う問題が少ないため、形式・難易度を広げました。");
  }
  if (!pool.length) {
    showToast("この分野には問題がありません。管理ページから追加してください。");
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
  state.timeLeft = 20;
  state.results = [];
  state.latestAttempt = null;
  navigate("quiz");
}

function submitAnswer(value) {
  if (state.answered) return;
  const question = state.quizQuestions[state.questionIndex];
  if (!question) return;
  state.response = String(value ?? "");
  const correct = normalizeAnswer(state.response) === normalizeAnswer(question.answer);
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
  state.timeLeft = 20;
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

function requireAdminKey() {
  if (!state.adminKey) {
    showToast("先に管理者キーを入力してください。");
    return false;
  }
  return true;
}

async function adminPost(payload, successMessage) {
  if (!state.connected) {
    showToast(`${successMessage}（サンプルモードのため端末内のみ）`);
    return;
  }
  if (!requireAdminKey()) return;
  try {
    const requestId = await postAction({ ...payload, adminKey: state.adminKey });
    const result = await waitForMutationResult(requestId);
    if (!result?.ok) throw new Error(result?.error || "GASで更新できませんでした。");
    showToast(`${successMessage}。スプレッドシートに反映しました。`);
  } catch (error) {
    console.warn(error);
    showToast(error?.message || "送信に失敗しました。GASの公開設定を確認してください。");
  }
}

function moveItem(type, id, direction) {
  if (state.connected && !requireAdminKey()) return;
  const collection = type === "subject" ? state.subjects : state.questions;
  const index = collection.findIndex((item) => item.id === id);
  const nextIndex = index + Number(direction);
  if (index < 0 || nextIndex < 0 || nextIndex >= collection.length) return;
  [collection[index], collection[nextIndex]] = [collection[nextIndex], collection[index]];
  render();
  const order = collection.map((item, sortOrder) => ({ id: item.id, sortOrder }));
  const action = type === "subject" ? "adminReorderSubjects" : "adminReorderQuestions";
  adminPost({ action, order }, "並び順を更新しました");
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action } = button.dataset;
  if (action === "navigate") navigate(button.dataset.view);
  if (action === "select-subject") selectSubject(button.dataset.subject);
  if (action === "quick-quiz") {
    state.selectedSubjectId = null;
    state.selectedCategory = "すべて";
    state.questionCount = 5;
    buildQuiz();
  }
  if (action === "select-category") {
    state.selectedCategory = button.dataset.category;
    navigate("settings");
  }
  if (action === "back-from-settings") navigate(state.selectedSubjectId ? "subject" : "home");
  if (action === "set-count") { state.questionCount = Number(button.dataset.value); render(); }
  if (action === "set-mode") { state.answerMode = button.dataset.value; render(); }
  if (action === "set-difficulty") { state.difficulty = Number(button.dataset.value); render(); }
  if (action === "toggle-timer") { state.timerEnabled = !state.timerEnabled; render(); }
  if (action === "toggle-shuffle") { state.shuffle = !state.shuffle; render(); }
  if (action === "start-quiz") buildQuiz();
  if (action === "answer-choice") submitAnswer(button.dataset.value);
  if (action === "submit-text-answer") {
    const input = document.querySelector('#answer-form input[name="answer"]');
    if (!input?.value.trim()) { showToast("答えを入力してください。"); return; }
    submitAnswer(input.value);
  }
  if (action === "next-question") nextQuestion();
  if (action === "exit-quiz") {
    if (window.confirm("クイズを終了してホームへ戻りますか？")) navigate("home");
  }
  if (action === "remember-admin-key") {
    state.adminKey = document.getElementById("admin-key")?.value || "";
    showToast(state.adminKey ? "管理者キーをこのタブに適用しました。" : "管理者キーを入力してください。");
  }
  if (action === "move-subject") moveItem("subject", button.dataset.id, button.dataset.direction);
  if (action === "move-question") moveItem("question", button.dataset.id, button.dataset.direction);
  if (action === "logout") {
    localStorage.removeItem(STORAGE.profile);
    state.user = null;
    state.adminKey = "";
    state.view = "login";
    render();
  }
});

app.addEventListener("input", (event) => {
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
  if (event.target.id === "subject-form") {
    if (state.connected && !requireAdminKey()) return;
    const form = new FormData(event.target);
    const name = String(form.get("name") || "").trim();
    const categories = String(form.get("categories") || "").split(/[,、\n]/).map((item) => item.trim()).filter(Boolean);
    if (!name || !categories.length) return;
    const subject = {
      id: `field-${Date.now()}`,
      name,
      icon: String(form.get("icon") || "？").trim() || "？",
      color: String(form.get("color") || "#20e0ff"),
      description: String(form.get("description") || `${name}の知識を楽しく学ぼう。`).trim(),
      categories,
    };
    state.subjects.push(subject);
    event.target.reset();
    render();
    adminPost({ action: "adminAddSubject", subject }, "分野を追加しました");
  }
  if (event.target.id === "question-form") {
    if (state.connected && !requireAdminKey()) return;
    const form = new FormData(event.target);
    const type = String(form.get("type") || "choice");
    let choices = String(form.get("choices") || "").split(/[,、\n]/).map((item) => item.trim()).filter(Boolean);
    if (type === "truefalse") choices = ["○", "×"];
    const question = {
      id: `q-${Date.now()}`,
      subjectId: String(form.get("subjectId") || ""),
      category: String(form.get("category") || "").trim(),
      type,
      prompt: String(form.get("prompt") || "").trim(),
      choices,
      answer: String(form.get("answer") || "").trim(),
      explanation: String(form.get("explanation") || "").trim(),
      difficulty: Number(form.get("difficulty") || 1),
    };
    if (!question.subjectId || !question.category || !question.prompt || !question.answer || !question.explanation) return;
    if (type === "choice" && choices.length < 2) {
      showToast("択一問題には2つ以上の選択肢を入力してください。");
      return;
    }
    state.questions.push(question);
    event.target.reset();
    render();
    adminPost({ action: "adminAddQuestion", question }, "問題を追加しました");
  }
});

render();
loadBootstrap();
