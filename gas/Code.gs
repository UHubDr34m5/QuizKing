/**
 * QuizKing - Google Apps Script backend
 *
 * 1. setupQuizKing() を実行
 * 2. setAdminKey("8文字以上の管理者キー") を実行
 * 3. ウェブアプリとしてデプロイ
 *
 * GitHub Pagesからの読み込みはJSONP、更新はtext/plainのPOSTで行います。
 */

var QUIZKING = {
  spreadsheetProperty: "QUIZKING_SPREADSHEET_ID",
  adminHashProperty: "QUIZKING_ADMIN_KEY_HASH",
  cacheKey: "quizking-bootstrap-v1",
  sheets: {
    subjects: "Subjects",
    questions: "Questions",
    attempts: "Attempts",
    options: "Options"
  },
  headers: {
    subjects: ["id", "name", "icon", "color", "description", "categoriesJson", "sortOrder", "公開状態", "updatedAt"],
    questions: ["id", "subjectId", "category", "type", "prompt", "choicesJson", "answer", "explanation", "difficulty", "kanjiLevel", "sortOrder", "updatedAt", "公開状態", "imageUrl"],
    attempts: ["id", "clientId", "nickname", "subjectId", "score", "total", "correctRate", "xpEarned", "answersJson", "createdAt"],
    options: ["subjectId", "category", "type", "公開状態", "kanjiLevel"]
  }
};

function setupQuizKing() {
  var spreadsheet = getOrCreateSpreadsheet_();
  var subjectsSheet = ensureSheet_(spreadsheet, QUIZKING.sheets.subjects, QUIZKING.headers.subjects);
  var questionsSheet = ensureSheet_(spreadsheet, QUIZKING.sheets.questions, QUIZKING.headers.questions);
  ensureSheet_(spreadsheet, QUIZKING.sheets.attempts, QUIZKING.headers.attempts);
  ensureSheet_(spreadsheet, QUIZKING.sheets.options, QUIZKING.headers.options);

  if (subjectsSheet.getLastRow() <= 1) {
    appendObjects_(subjectsSheet, QUIZKING.headers.subjects, seedSubjects_());
  }
  if (questionsSheet.getLastRow() <= 1) {
    appendObjects_(questionsSheet, QUIZKING.headers.questions, seedQuestions_());
  }

  refreshOptions_(spreadsheet);
  ensureQuestionIdFormula_(questionsSheet);
  applyWorkbookValidation_(spreadsheet);
  formatWorkbook_(spreadsheet);
  clearBootstrapCache_();
  Logger.log("QuizKingのセットアップが完了しました。");
  Logger.log("スプレッドシート: " + spreadsheet.getUrl());
  return {
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl()
  };
}

function setAdminKey(adminKey) {
  var value = cleanString_(adminKey, 200);
  if (value.length < 8) {
    throw new Error("管理者キーは8文字以上にしてください。");
  }
  PropertiesService.getScriptProperties().setProperty(
    QUIZKING.adminHashProperty,
    sha256_(value)
  );
  Logger.log("管理者キーを設定しました。キー自体は保存されません。");
  return true;
}

function createAdminKey() {
  var rawKey = Utilities.getUuid().replace(/-/g, "").slice(0, 16);
  setAdminKey(rawKey);
  Logger.log("管理者キー: " + rawKey);
  Logger.log("この実行ログを閉じる前に安全な場所へ控えてください。");
  return rawKey;
}

function getQuizKingSpreadsheetUrl() {
  return getOrCreateSpreadsheet_().getUrl();
}

function doGet(event) {
  try {
    var parameters = event && event.parameter ? event.parameter : {};
    var action = cleanString_(parameters.action || "health", 50);
    var result;

    if (action === "health") {
      result = {
        ok: true,
        service: "QuizKing GAS",
        time: new Date().toISOString()
      };
    } else if (action === "bootstrap") {
      result = getBootstrap_();
    } else if (action === "rankings") {
      result = {
        ok: true,
        rankings: getRankings_()
      };
    } else if (action === "progress") {
      result = {
        ok: true,
        attempts: getProgress_(cleanString_(parameters.clientId, 100))
      };
    } else if (action === "mutationResult") {
      result = getMutationResult_(cleanString_(parameters.requestId, 100));
    } else {
      throw new Error("未対応の読み込み操作です。");
    }

    return output_(result, parameters.callback);
  } catch (error) {
    return output_({
      ok: false,
      error: publicError_(error)
    }, event && event.parameter ? event.parameter.callback : "");
  }
}

function doPost(event) {
  var payload = {};
  try {
    payload = parsePostBody_(event);
    var action = cleanString_(payload.action, 60);
    var result;

    if (action === "recordAttempt") {
      result = recordAttempt_(payload);
    } else if (action === "adminAddSubject") {
      assertAdmin_(payload.adminKey);
      result = adminAddSubject_(payload.subject);
    } else if (action === "adminAddQuestion") {
      assertAdmin_(payload.adminKey);
      result = adminAddQuestion_(payload.question);
    } else if (action === "adminReorderSubjects") {
      assertAdmin_(payload.adminKey);
      result = adminReorder_(QUIZKING.sheets.subjects, payload.order);
    } else if (action === "adminReorderQuestions") {
      assertAdmin_(payload.adminKey);
      result = adminReorder_(QUIZKING.sheets.questions, payload.order);
    } else {
      throw new Error("未対応の更新操作です。");
    }

    var successResponse = {
      ok: true,
      result: result
    };
    storeMutationResult_(payload.requestId, successResponse);
    return jsonOutput_(successResponse);
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    var errorResponse = {
      ok: false,
      error: publicError_(error)
    };
    storeMutationResult_(payload.requestId, errorResponse);
    return jsonOutput_(errorResponse);
  }
}

function storeMutationResult_(requestId, result) {
  var id = cleanString_(requestId, 100);
  if (!/^[a-zA-Z0-9_-]{12,100}$/.test(id)) return;
  CacheService.getScriptCache().put(
    "quizking-mutation-" + id,
    JSON.stringify(result),
    120
  );
}

function getMutationResult_(requestId) {
  if (!/^[a-zA-Z0-9_-]{12,100}$/.test(requestId)) {
    return { ok: false, error: "requestIdが正しくありません。" };
  }
  var cached = CacheService.getScriptCache().get("quizking-mutation-" + requestId);
  if (!cached) return { ok: false, pending: true };
  try {
    return JSON.parse(cached);
  } catch (_ignored) {
    return { ok: false, error: "更新結果を読み取れませんでした。" };
  }
}

function getBootstrap_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(QUIZKING.cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (_ignored) {
      // キャッシュ破損時はシートから読み直します。
    }
  }

  var spreadsheet = getOrCreateSpreadsheet_();
  var result = {
    ok: true,
    subjects: getPublicSubjects_(spreadsheet),
    questions: getPublicQuestions_(spreadsheet),
    generatedAt: new Date().toISOString()
  };
  cache.put(QUIZKING.cacheKey, JSON.stringify(result), 120);
  return result;
}

function getPublicSubjects_(spreadsheet) {
  var objects = readObjects_(
    spreadsheet.getSheetByName(QUIZKING.sheets.subjects),
    QUIZKING.headers.subjects
  );
  return objects
    .filter(function (row) {
      return cleanString_(row.id, 80) && isPublicRow_(row);
    })
    .sort(sortByOrder_)
    .map(function (row) {
      return {
        id: cleanString_(row.id, 80),
        name: cleanString_(row.name, 50),
        icon: cleanString_(row.icon, 8) || "？",
        color: validColor_(row.color),
        description: cleanString_(row.description, 300),
        categories: parseJsonArray_(row.categoriesJson)
      };
    });
}

function getPublicQuestions_(spreadsheet) {
  var objects = readObjects_(
    spreadsheet.getSheetByName(QUIZKING.sheets.questions),
    QUIZKING.headers.questions
  );
  return objects
    .filter(function (row) {
      return cleanString_(row.id, 100) && cleanString_(row.prompt, 1000) && isPublicRow_(row);
    })
    .sort(sortByOrder_)
    .map(function (row) {
      var type = validQuestionType_(row.type);
      return {
        id: cleanString_(row.id, 100),
        subjectId: cleanString_(row.subjectId, 80),
        category: cleanString_(row.category, 80),
        type: type,
        prompt: cleanString_(row.prompt, 1000),
        imageUrl: validImageUrl_(row.imageUrl),
        choices: type === "truefalse" ? ["○", "×"] : parseJsonArray_(row.choicesJson),
        answer: cleanString_(row.answer, 300),
        explanation: cleanString_(row.explanation, 1000),
        difficulty: clampNumber_(row.difficulty, 1, 3, 1),
        kanjiLevel: validKanjiLevel_(row.kanjiLevel)
      };
    });
}

function recordAttempt_(payload) {
  var clientId = cleanString_(payload.clientId, 100);
  var nickname = cleanString_(payload.nickname, 30);
  var subjectId = cleanString_(payload.subjectId || "all", 80);
  if (!clientId || !nickname) {
    throw new Error("利用者情報が不足しています。");
  }

  var score = clampNumber_(payload.score, 0, 100, 0);
  var total = clampNumber_(payload.total, 1, 100, 1);
  if (score > total) score = total;
  var correctRate = clampNumber_(payload.correctRate, 0, 100, Math.round(score / total * 100));
  var xpEarned = clampNumber_(payload.xpEarned, 0, 10000, score * 20);
  var answers = Array.isArray(payload.answers) ? payload.answers.slice(0, 100) : [];
  var now = new Date();

  var row = {
    id: Utilities.getUuid(),
    clientId: clientId,
    nickname: nickname,
    subjectId: subjectId,
    score: score,
    total: total,
    correctRate: correctRate,
    xpEarned: xpEarned,
    answersJson: JSON.stringify(answers),
    createdAt: now
  };

  withDocumentLock_(function () {
    var sheet = getOrCreateSpreadsheet_().getSheetByName(QUIZKING.sheets.attempts);
    appendObjects_(sheet, QUIZKING.headers.attempts, [row]);
  });
  return {
    id: row.id,
    createdAt: now.toISOString()
  };
}

function adminAddSubject_(rawSubject) {
  var subject = rawSubject || {};
  var name = cleanString_(subject.name, 50);
  if (!name) throw new Error("分野名を入力してください。");
  var id = cleanId_(subject.id || ("field-" + new Date().getTime()));
  var categories = normalizeStringArray_(subject.categories, 30, 80);
  if (!categories.length) categories = ["基礎"];

  var spreadsheet = getOrCreateSpreadsheet_();
  var sheet = spreadsheet.getSheetByName(QUIZKING.sheets.subjects);
  assertUniqueId_(sheet, id);
  var now = new Date();
  var row = {
    id: id,
    name: name,
    icon: cleanString_(subject.icon, 8) || "？",
    color: validColor_(subject.color),
    description: cleanString_(subject.description, 300) || (name + "の知識を楽しく学ぼう。"),
    categoriesJson: JSON.stringify(categories),
    sortOrder: Math.max(0, sheet.getLastRow() - 1),
    "公開状態": "公開",
    updatedAt: now
  };

  withDocumentLock_(function () {
    appendObjects_(sheet, QUIZKING.headers.subjects, [row]);
    var optionsSheet = spreadsheet.getSheetByName(QUIZKING.sheets.options);
    addOptionIfMissing_(optionsSheet, "subjectId", id);
    categories.forEach(function (category) {
      addOptionIfMissing_(optionsSheet, "category", category);
    });
  });
  clearBootstrapCache_();
  return { id: id };
}

function adminAddQuestion_(rawQuestion) {
  var question = rawQuestion || {};
  var subjectId = cleanId_(question.subjectId);
  var category = cleanString_(question.category, 80);
  var prompt = cleanString_(question.prompt, 1000);
  var rawImageUrl = cleanString_(question.imageUrl, 2048);
  var imageUrl = validImageUrl_(rawImageUrl);
  var answer = cleanString_(question.answer, 300);
  var explanation = cleanString_(question.explanation, 1000);
  var type = validQuestionType_(question.type);
  var kanjiLevel = subjectId === "japanese" && category === "漢字"
    ? validKanjiLevel_(question.kanjiLevel)
    : "";
  if (!subjectId || !category || !prompt || !answer || !explanation) {
    throw new Error("問題の必須項目が不足しています。");
  }
  if (rawImageUrl && !imageUrl) {
    throw new Error("画像URLはhttps://で始まる有効なURLを指定してください。");
  }

  var isMulti = type === "multi" || /^【多答】/.test(prompt);
  var choices = type === "truefalse"
    ? ["○", "×"]
    : normalizeStringArray_(question.choices, isMulti ? 100 : 10, 200);
  if (type === "choice" && choices.length < 2) {
    throw new Error("択一問題には2つ以上の選択肢が必要です。");
  }

  var spreadsheet = getOrCreateSpreadsheet_();
  var subjectsSheet = spreadsheet.getSheetByName(QUIZKING.sheets.subjects);
  var questionsSheet = spreadsheet.getSheetByName(QUIZKING.sheets.questions);
  assertSubjectExists_(subjectsSheet, subjectId);
  var now = new Date();
  var id = "";

  withDocumentLock_(function () {
    var nextRowNumber = getLastDataRowInColumn_(questionsSheet, 2) + 1;
    id = questionIdForRow_(nextRowNumber);
    var row = {
      id: "",
      subjectId: subjectId,
      category: category,
      type: type,
      prompt: prompt,
      imageUrl: imageUrl,
      choicesJson: JSON.stringify(choices),
      answer: answer,
      explanation: explanation,
      difficulty: clampNumber_(question.difficulty, 1, 3, 1),
      kanjiLevel: kanjiLevel,
      sortOrder: Math.max(0, nextRowNumber - 2),
      updatedAt: now,
      "公開状態": "公開"
    };
    appendObjects_(questionsSheet, QUIZKING.headers.questions, [row]);
    addCategoryIfMissing_(subjectsSheet, subjectId, category);
    addOptionIfMissing_(spreadsheet.getSheetByName(QUIZKING.sheets.options), "category", category);
  });
  clearBootstrapCache_();
  return { id: id };
}

function adminReorder_(sheetName, rawOrder) {
  if (!Array.isArray(rawOrder) || !rawOrder.length) {
    throw new Error("並び順のデータがありません。");
  }
  var order = rawOrder.slice(0, 1000);
  var spreadsheet = getOrCreateSpreadsheet_();
  var sheet = spreadsheet.getSheetByName(sheetName);
  var headers = sheetName === QUIZKING.sheets.subjects
    ? QUIZKING.headers.subjects
    : QUIZKING.headers.questions;
  var idColumn = headers.indexOf("id") + 1;
  var orderColumn = headers.indexOf("sortOrder") + 1;
  var updatedColumn = headers.indexOf("updatedAt") + 1;

  withDocumentLock_(function () {
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return;
    var ids = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues();
    var rowById = {};
    ids.forEach(function (row, index) {
      rowById[String(row[0])] = index + 2;
    });
    var now = new Date();
    order.forEach(function (item, index) {
      var id = cleanString_(item && item.id, 100);
      var rowNumber = rowById[id];
      if (!rowNumber) return;
      sheet.getRange(rowNumber, orderColumn).setValue(
        clampNumber_(item.sortOrder, 0, 100000, index)
      );
      sheet.getRange(rowNumber, updatedColumn).setValue(now);
    });
  });
  clearBootstrapCache_();
  return { updated: order.length };
}

function addCategoryIfMissing_(subjectsSheet, subjectId, category) {
  var headers = QUIZKING.headers.subjects;
  var rows = readObjectsWithRows_(subjectsSheet, headers);
  var target = rows.filter(function (item) {
    return String(item.data.id) === subjectId;
  })[0];
  if (!target) return;
  var categories = parseJsonArray_(target.data.categoriesJson);
  if (categories.indexOf(category) >= 0) return;
  categories.push(category);
  subjectsSheet.getRange(
    target.rowNumber,
    headers.indexOf("categoriesJson") + 1
  ).setValue(JSON.stringify(categories));
  subjectsSheet.getRange(
    target.rowNumber,
    headers.indexOf("updatedAt") + 1
  ).setValue(new Date());
}

function refreshOptions_(spreadsheet) {
  var optionsSheet = spreadsheet.getSheetByName(QUIZKING.sheets.options);
  var subjectsSheet = spreadsheet.getSheetByName(QUIZKING.sheets.subjects);
  var questionsSheet = spreadsheet.getSheetByName(QUIZKING.sheets.questions);
  var subjectIds = [];
  var categories = [];

  readObjects_(subjectsSheet, QUIZKING.headers.subjects).forEach(function (subject) {
    var id = cleanString_(subject.id, 80);
    if (id) subjectIds.push(id);
    parseJsonArray_(subject.categoriesJson).forEach(function (category) {
      categories.push(category);
    });
  });
  readObjects_(questionsSheet, QUIZKING.headers.questions).forEach(function (question) {
    var category = cleanString_(question.category, 80);
    if (category) categories.push(category);
  });

  var columns = {
    subjectId: uniqueStrings_(subjectIds),
    category: uniqueStrings_(categories),
    type: ["text", "choice", "truefalse", "multi"],
    "公開状態": ["公開", "非公開"],
    kanjiLevel: kanjiLevels_()
  };
  var rowCount = Math.max.apply(null, QUIZKING.headers.options.map(function (header) {
    return columns[header].length;
  }));
  var values = [];
  for (var rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    values.push(QUIZKING.headers.options.map(function (header) {
      return columns[header][rowIndex] || "";
    }));
  }
  optionsSheet.clearContents();
  optionsSheet.getRange(1, 1, 1, QUIZKING.headers.options.length).setValues([QUIZKING.headers.options]);
  if (values.length) {
    optionsSheet.getRange(2, 1, values.length, QUIZKING.headers.options.length).setValues(values);
  }
}

function addOptionIfMissing_(optionsSheet, header, value) {
  var normalized = cleanString_(value, 100);
  if (!optionsSheet || !normalized) return;
  var headers = getSheetHeaders_(optionsSheet);
  var column = headers.indexOf(header) + 1;
  if (column <= 0) return;
  var lastRow = Math.max(2, optionsSheet.getLastRow());
  var values = optionsSheet.getRange(2, column, lastRow - 1, 1).getDisplayValues();
  var firstBlank = 0;
  for (var index = 0; index < values.length; index += 1) {
    var current = cleanString_(values[index][0], 100);
    if (current === normalized) return;
    if (!current && !firstBlank) firstBlank = index + 2;
  }
  optionsSheet.getRange(firstBlank || (lastRow + 1), column).setValue(normalized);
}

function ensureQuestionIdFormula_(sheet) {
  var maxRows = sheet.getMaxRows();
  if (maxRows < 2) return;
  sheet.getRange(2, 1, maxRows - 1, 1).clearContent();
  sheet.getRange(2, 1).setFormula(
    '=ARRAYFORMULA(IF(B2:B="","","q"&IF(ROW(B2:B)-1<10,TEXT(ROW(B2:B)-1,"00"),ROW(B2:B)-1)))'
  );
}

function applyWorkbookValidation_(spreadsheet) {
  var optionsSheet = spreadsheet.getSheetByName(QUIZKING.sheets.options);
  var subjectsSheet = spreadsheet.getSheetByName(QUIZKING.sheets.subjects);
  var questionsSheet = spreadsheet.getSheetByName(QUIZKING.sheets.questions);
  var optionHeaders = getSheetHeaders_(optionsSheet);
  var questionHeaders = getSheetHeaders_(questionsSheet);
  var maxQuestionRows = questionsSheet.getMaxRows() - 1;

  function optionRange_(header) {
    var column = optionHeaders.indexOf(header) + 1;
    return optionsSheet.getRange(2, column, Math.max(1, optionsSheet.getMaxRows() - 1), 1);
  }

  [
    ["subjectId", "subjectId"],
    ["category", "category"],
    ["type", "type"],
    ["kanjiLevel", "kanjiLevel"],
    ["公開状態", "公開状態"]
  ].forEach(function (definition) {
    var column = questionHeaders.indexOf(definition[0]) + 1;
    if (column <= 0) return;
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(optionRange_(definition[1]), true)
      .setAllowInvalid(false)
      .build();
    questionsSheet.getRange(2, column, maxQuestionRows, 1).setDataValidation(rule);
  });

  var subjectPublishColumn = getSheetHeaders_(subjectsSheet).indexOf("公開状態") + 1;
  if (subjectPublishColumn > 0) {
    var publishRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(optionRange_("公開状態"), true)
      .setAllowInvalid(false)
      .build();
    subjectsSheet.getRange(2, subjectPublishColumn, subjectsSheet.getMaxRows() - 1, 1)
      .setDataValidation(publishRule);
  }
}

function uniqueStrings_(values) {
  var seen = {};
  return values.map(function (value) {
    return cleanString_(value, 100);
  }).filter(function (value) {
    if (!value || seen[value]) return false;
    seen[value] = true;
    return true;
  }).sort();
}

function kanjiLevels_() {
  return [
    "漢検10級", "漢検9級", "漢検8級", "漢検7級", "漢検6級", "漢検5級",
    "漢検4級", "漢検3級", "漢検準2級", "漢検2級", "漢検準1級", "漢検1級", "未設定"
  ];
}

function getRankings_() {
  var spreadsheet = getOrCreateSpreadsheet_();
  var sheet = spreadsheet.getSheetByName(QUIZKING.sheets.attempts);
  var attempts = readObjects_(sheet, QUIZKING.headers.attempts);
  var players = {};

  attempts.forEach(function (attempt) {
    var clientId = cleanString_(attempt.clientId, 100);
    if (!clientId) return;
    if (!players[clientId]) {
      players[clientId] = {
        name: cleanString_(attempt.nickname, 30) || "名無しの挑戦者",
        xp: 0,
        dates: {}
      };
    }
    players[clientId].name = cleanString_(attempt.nickname, 30) || players[clientId].name;
    players[clientId].xp += clampNumber_(attempt.xpEarned, 0, 10000, 0);
    var date = new Date(attempt.createdAt);
    if (!isNaN(date.getTime())) {
      players[clientId].dates[dateKey_(date)] = true;
    }
  });

  return Object.keys(players)
    .map(function (clientId) {
      return {
        name: players[clientId].name,
        xp: players[clientId].xp,
        streak: calculateStreak_(Object.keys(players[clientId].dates))
      };
    })
    .sort(function (a, b) {
      return b.xp - a.xp;
    })
    .slice(0, 100)
    .map(function (player, index) {
      return {
        rank: index + 1,
        name: player.name,
        xp: player.xp,
        streak: player.streak
      };
    });
}

function getProgress_(clientId) {
  if (!clientId) return [];
  var spreadsheet = getOrCreateSpreadsheet_();
  var attempts = readObjects_(
    spreadsheet.getSheetByName(QUIZKING.sheets.attempts),
    QUIZKING.headers.attempts
  );
  return attempts
    .filter(function (attempt) {
      return String(attempt.clientId) === clientId;
    })
    .slice(-100)
    .reverse()
    .map(function (attempt) {
      return {
        id: String(attempt.id),
        subjectId: String(attempt.subjectId),
        score: Number(attempt.score) || 0,
        total: Number(attempt.total) || 0,
        correctRate: Number(attempt.correctRate) || 0,
        xpEarned: Number(attempt.xpEarned) || 0,
        createdAt: new Date(attempt.createdAt).toISOString()
      };
    });
}

function parsePostBody_(event) {
  if (!event || !event.postData || !event.postData.contents) {
    throw new Error("送信データがありません。");
  }
  if (event.postData.contents.length > 500000) {
    throw new Error("送信データが大きすぎます。");
  }
  var payload = JSON.parse(event.postData.contents);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("送信形式が正しくありません。");
  }
  return payload;
}

function output_(data, callback) {
  var json = JSON.stringify(data);
  var callbackName = cleanString_(callback, 100);
  if (callbackName) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$\.]{0,80}$/.test(callbackName)) {
      return jsonOutput_({ ok: false, error: "callback名が正しくありません。" });
    }
    return ContentService
      .createTextOutput(callbackName + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSpreadsheet_() {
  var properties = PropertiesService.getScriptProperties();
  var id = properties.getProperty(QUIZKING.spreadsheetProperty);
  var spreadsheet;
  if (id) {
    try {
      spreadsheet = SpreadsheetApp.openById(id);
    } catch (_ignored) {
      properties.deleteProperty(QUIZKING.spreadsheetProperty);
    }
  }
  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create("QuizKing データベース");
    properties.setProperty(QUIZKING.spreadsheetProperty, spreadsheet.getId());
    setupQuizKingSheets_(spreadsheet);
  }
  return spreadsheet;
}

function setupQuizKingSheets_(spreadsheet) {
  ensureSheet_(spreadsheet, QUIZKING.sheets.subjects, QUIZKING.headers.subjects);
  ensureSheet_(spreadsheet, QUIZKING.sheets.questions, QUIZKING.headers.questions);
  ensureSheet_(spreadsheet, QUIZKING.sheets.attempts, QUIZKING.headers.attempts);
  ensureSheet_(spreadsheet, QUIZKING.sheets.options, QUIZKING.headers.options);
  var defaultSheet = spreadsheet.getSheetByName("シート1") || spreadsheet.getSheetByName("Sheet1");
  if (defaultSheet && spreadsheet.getSheets().length > 1) {
    spreadsheet.deleteSheet(defaultSheet);
  }
}

function ensureSheet_(spreadsheet, name, headers) {
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    var lastColumn = Math.max(1, sheet.getLastColumn());
    var currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
      .map(function (header) { return cleanString_(header, 100); });
    headers.forEach(function (header) {
      if (currentHeaders.indexOf(header) >= 0) return;
      currentHeaders.push(header);
      sheet.getRange(1, currentHeaders.length).setValue(header);
    });
  }
  return sheet;
}

function formatWorkbook_(spreadsheet) {
  [
    [QUIZKING.sheets.subjects, QUIZKING.headers.subjects.length],
    [QUIZKING.sheets.questions, QUIZKING.headers.questions.length],
    [QUIZKING.sheets.attempts, QUIZKING.headers.attempts.length],
    [QUIZKING.sheets.options, QUIZKING.headers.options.length]
  ].forEach(function (definition) {
    var sheet = spreadsheet.getSheetByName(definition[0]);
    var lastColumn = Math.max(definition[1], sheet.getLastColumn());
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, lastColumn)
      .setBackground("#111a48")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    sheet.autoResizeColumns(1, lastColumn);
    if (sheet.getMaxColumns() >= 5) sheet.setColumnWidth(5, 420);
    var imageColumn = getSheetHeaders_(sheet).indexOf("imageUrl") + 1;
    if (imageColumn > 0) sheet.setColumnWidth(imageColumn, 360);
  });
}

function appendObjects_(sheet, headers, objects) {
  if (!objects || !objects.length) return;
  ensureHeaders_(sheet, headers);
  var sheetHeaders = getSheetHeaders_(sheet);
  var usesAutomaticQuestionIds = sheet.getName() === QUIZKING.sheets.questions
    && /^=ARRAYFORMULA/i.test(sheet.getRange(2, 1).getFormula());
  if (usesAutomaticQuestionIds) {
    var questionHeaders = sheetHeaders.slice(1);
    var questionRows = objects.map(function (object) {
      return questionHeaders.map(function (header) {
        return object[header] === undefined ? "" : object[header];
      });
    });
    var startRow = getLastDataRowInColumn_(sheet, 2) + 1;
    sheet.getRange(startRow, 2, questionRows.length, questionHeaders.length).setValues(questionRows);
    return;
  }
  var rows = objects.map(function (object) {
    return sheetHeaders.map(function (header) {
      return object[header] === undefined ? "" : object[header];
    });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, sheetHeaders.length).setValues(rows);
}

function readObjects_(sheet, headers) {
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var sheetHeaders = getSheetHeaders_(sheet);
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheetHeaders.length).getValues();
  return values.map(function (row) {
    var object = {};
    sheetHeaders.forEach(function (header, index) {
      if (header) object[header] = row[index];
    });
    headers.forEach(function (header) {
      if (object[header] === undefined) object[header] = "";
    });
    return object;
  });
}

function ensureHeaders_(sheet, headers) {
  var sheetHeaders = getSheetHeaders_(sheet);
  headers.forEach(function (header) {
    if (sheetHeaders.indexOf(header) >= 0) return;
    sheetHeaders.push(header);
    sheet.getRange(1, sheetHeaders.length).setValue(header);
  });
}

function getSheetHeaders_(sheet) {
  var lastColumn = Math.max(1, sheet.getLastColumn());
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
    .map(function (header) { return cleanString_(header, 100); });
}

function columnLabel_(columnNumber) {
  var label = "";
  var value = Math.max(1, Number(columnNumber) || 1);
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + value % 26) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

function getLastDataRowInColumn_(sheet, column) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  var values = sheet.getRange(2, column, lastRow - 1, 1).getDisplayValues();
  for (var index = values.length - 1; index >= 0; index -= 1) {
    if (cleanString_(values[index][0], 1000)) return index + 2;
  }
  return 1;
}

function questionIdForRow_(rowNumber) {
  var number = Math.max(1, Number(rowNumber) - 1);
  return "q" + (number < 10 ? ("0" + number) : number);
}

function readObjectsWithRows_(sheet, headers) {
  return readObjects_(sheet, headers).map(function (data, index) {
    return { rowNumber: index + 2, data: data };
  });
}

function assertAdmin_(rawKey) {
  var expected = PropertiesService.getScriptProperties().getProperty(QUIZKING.adminHashProperty);
  if (!expected) {
    throw new Error("GASで管理者キーが設定されていません。");
  }
  var actual = sha256_(cleanString_(rawKey, 200));
  if (!safeEqual_(expected, actual)) {
    throw new Error("管理者キーが正しくありません。");
  }
}

function assertUniqueId_(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var exists = ids.some(function (row) {
    return String(row[0]) === id;
  });
  if (exists) throw new Error("同じIDがすでに登録されています。");
}

function assertSubjectExists_(sheet, subjectId) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) throw new Error("分野が登録されていません。");
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var exists = ids.some(function (row) {
    return String(row[0]) === subjectId;
  });
  if (!exists) throw new Error("指定した分野が見つかりません。");
}

function withDocumentLock_(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function clearBootstrapCache_() {
  CacheService.getScriptCache().remove(QUIZKING.cacheKey);
}

function cleanString_(value, maxLength) {
  var text = value === null || value === undefined ? "" : String(value);
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, maxLength || 1000);
}

function cleanId_(value) {
  return cleanString_(value, 100)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validQuestionType_(value) {
  var type = cleanString_(value, 20);
  return ["choice", "text", "truefalse", "multi"].indexOf(type) >= 0 ? type : "text";
}

function validKanjiLevel_(value) {
  var level = cleanString_(value, 20);
  return kanjiLevels_().indexOf(level) >= 0 ? level : "未設定";
}

function isPublicRow_(row) {
  var status = cleanString_(row && row["公開状態"], 20);
  if (status) return status === "公開";
  return asBoolean_(row && row.isPublished, false);
}

function validColor_(value) {
  var color = cleanString_(value, 20);
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#20e0ff";
}

function validImageUrl_(value) {
  var url = cleanString_(value, 2048);
  return /^https:\/\/[^\s<>"']+$/i.test(url) ? url : "";
}

function normalizeStringArray_(value, maxItems, maxLength) {
  var array = Array.isArray(value) ? value : [];
  var result = [];
  array.slice(0, maxItems).forEach(function (item) {
    var cleaned = cleanString_(item, maxLength);
    if (cleaned && result.indexOf(cleaned) < 0) result.push(cleaned);
  });
  return result;
}

function parseJsonArray_(value) {
  if (Array.isArray(value)) return normalizeStringArray_(value, 100, 200);
  try {
    return normalizeStringArray_(JSON.parse(String(value || "[]")), 100, 200);
  } catch (_ignored) {
    return String(value || "")
      .split(/[,、\n]/)
      .map(function (item) { return cleanString_(item, 200); })
      .filter(Boolean);
  }
}

function clampNumber_(value, min, max, fallback) {
  var number = Number(value);
  if (!isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function asBoolean_(value, fallback) {
  if (value === true || String(value).toLowerCase() === "true" || value === 1) return true;
  if (value === false || String(value).toLowerCase() === "false" || value === 0) return false;
  return fallback;
}

function sortByOrder_(a, b) {
  return clampNumber_(a.sortOrder, 0, 1000000, 0) - clampNumber_(b.sortOrder, 0, 1000000, 0);
}

function sha256_(value) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  );
  return bytes.map(function (byte) {
    return ("0" + ((byte + 256) % 256).toString(16)).slice(-2);
  }).join("");
}

function safeEqual_(left, right) {
  if (left.length !== right.length) return false;
  var difference = 0;
  for (var index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function publicError_(error) {
  var message = error && error.message ? error.message : "処理中にエラーが発生しました。";
  return cleanString_(message, 300);
}

function dateKey_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone() || "Asia/Tokyo", "yyyy-MM-dd");
}

function calculateStreak_(dateKeys) {
  if (!dateKeys.length) return 0;
  var unique = {};
  dateKeys.forEach(function (key) { unique[key] = true; });
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var todayKey = dateKey_(today);
  var yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (!unique[todayKey] && !unique[dateKey_(yesterday)]) return 0;
  if (!unique[todayKey]) today = yesterday;
  var streak = 0;
  while (unique[dateKey_(today)]) {
    streak += 1;
    today.setDate(today.getDate() - 1);
  }
  return streak;
}

function seedSubjects_() {
  var now = new Date();
  var subjects = [
    ["japanese", "国語", "本", "#b7f43a", "ことばの力を磨き、表現と読解の土台をつくろう。", ["漢字", "四字熟語", "類義語・対義語", "諺", "故事成語", "文法", "文学"]],
    ["math", "数学", "∑", "#20e0ff", "計算から数学雑学まで、筋道立てて考える力を育てよう。", ["計算", "数と式", "方程式", "関数", "図形", "確率・統計", "数学史・数学雑学", "素因数分解"]],
    ["english", "英語", "ABC", "#9a70ff", "単語・文法・会話表現から英語圏の文化まで学ぼう。", ["英単語", "英熟語", "文法", "発音", "会話表現", "英語圏文化"]],
    ["science", "理科", "⚗", "#b7f43a", "自然の「なぜ？」を物理・化学・生物・地学から解き明かそう。", ["物理", "化学", "生物", "地学", "科学史", "身近な科学"]],
    ["social", "社会", "◎", "#20e0ff", "歴史・地理・政治・経済をつなげて世界を理解しよう。", ["日本史", "世界史", "地理", "政治", "経済", "時事", "世界遺産"]],
    ["pe", "体育", "●", "#ff6f91", "競技のルール、記録、歴史からスポーツをもっと楽しもう。", ["球技", "陸上", "水泳", "体操", "武道", "ルール・記録", "スポーツ史", "オリンピック"]],
    ["health", "保健", "＋", "#57d6a5", "体と心を守るために、正しい健康知識を身につけよう。", ["人体", "病気・予防", "応急手当", "心の健康", "栄養", "生活習慣"]],
    ["informatics", "情報", "</>", "#20e0ff", "コンピュータ、AI、情報モラルを実生活につなげよう。", ["コンピュータ", "ネットワーク", "プログラミング", "情報モラル", "AI", "データ活用"]],
    ["home", "家庭科", "⌂", "#ffb84d", "衣食住、家計、子育てに役立つ生活の知恵を学ぼう。", ["調理", "栄養", "被服", "住生活", "消費生活", "子育て"]],
    ["music", "音楽", "♪", "#dc72ff", "楽典、楽器、作曲家、世界の音楽を味わおう。", ["楽典", "楽器", "作曲家", "日本音楽", "世界の音楽", "音楽史"]],
    ["art", "美術", "◇", "#ff6f91", "名作と表現技法を知り、見る力とつくる力を育てよう。", ["絵画", "彫刻", "色彩", "デザイン", "日本美術", "西洋美術"]],
    ["calligraphy", "書道", "墨", "#d9c8ff", "書体、名筆、漢字の成り立ちから文字文化を味わおう。", ["楷書", "行書", "草書", "書道史", "漢字の成り立ち", "名筆"]],
    ["finance", "金融", "¥", "#ffd75a", "家計、税金、投資、保険を知り、お金と上手につき合おう。", ["家計", "貯蓄", "投資", "税金", "保険", "経済の仕組み", "詐欺対策"]],
    ["manners", "マナー", "礼", "#57d6a5", "相手を思いやる作法と言葉遣いを場面別に学ぼう。", ["食事", "冠婚葬祭", "ビジネス", "公共の場", "国際マナー", "言葉遣い"]],
    ["culture", "一般教養", "知", "#7ea7ff", "法律、文化、哲学、発明など社会人にも役立つ知識を広げよう。", ["法律", "文化", "宗教", "哲学", "暦・単位", "発明・発見", "映画", "お笑い"]],
    ["trivia", "雑学", "？", "#ff8f5a", "思わず誰かに話したくなる、身近で意外な知識を集めよう。", ["生き物", "食べ物", "乗り物", "言葉", "世界一・日本一", "企業・商品", "不思議", "アレの名前"]]
  ];
  return subjects.map(function (item, index) {
    return {
      id: item[0],
      name: item[1],
      icon: item[2],
      color: item[3],
      description: item[4],
      categoriesJson: JSON.stringify(item[5]),
      sortOrder: index,
      "公開状態": "公開",
      updatedAt: now
    };
  });
}

function seedQuestions_() {
  var now = new Date();
  var questions = [
    ["q01", "japanese", "漢字", "choice", "「進捗」の正しい読み方は？", ["しんちょく", "しんぽ", "しんしょう", "しんたく"], "しんちょく", "「捗」は『はかどる』とも読みます。", 1],
    ["q02", "japanese", "四字熟語", "text", "多くの人が同じことを口にすることを表す四字熟語は？", [], "異口同音", "異なる口から同じ音が出る、という意味です。", 2],
    ["q03", "math", "計算", "choice", "2³ × 2⁴ の値は？", ["32", "64", "128", "256"], "128", "同じ底の積では指数を足し、2⁷=128です。", 1],
    ["q04", "math", "確率・統計", "text", "公平なサイコロを1回投げ、偶数が出る確率を分数で答えてください。", [], "1/2", "偶数は2・4・6の3通り。3/6=1/2です。", 1],
    ["q05", "english", "英単語", "choice", "「curious」に最も近い意味は？", ["好奇心が強い", "注意深い", "退屈している", "正直な"], "好奇心が強い", "curious は『知りたがる、好奇心の強い』です。", 1],
    ["q06", "english", "会話表現", "text", "「どういたしまして」を英語で答えてください。", [], "You're welcome", "You are welcome. の短縮形です。", 1],
    ["q07", "science", "化学", "choice", "水の化学式は？", ["CO₂", "H₂O", "O₂", "NaCl"], "H₂O", "水素原子2個と酸素原子1個からできています。", 1],
    ["q08", "science", "生物", "truefalse", "ヒトの心臓には4つの部屋がある。", ["○", "×"], "○", "右心房・右心室・左心房・左心室の4つです。", 1],
    ["q09", "social", "日本史", "choice", "鎌倉幕府を開いた人物は？", ["源頼朝", "足利尊氏", "徳川家康", "平清盛"], "源頼朝", "源頼朝は鎌倉を本拠地として武家政権を築きました。", 1],
    ["q10", "social", "地理", "text", "日本で最も面積が大きい都道府県は？", [], "北海道", "北海道は国土面積のおよそ22%を占めます。", 1],
    ["q11", "pe", "球技", "choice", "バレーボールで、1チームがコートに入る人数は？", ["5人", "6人", "7人", "9人"], "6人", "通常の6人制バレーボールではコート内は6人です。", 1],
    ["q12", "health", "応急手当", "choice", "AEDの主な目的は？", ["体温を下げる", "心臓の動きを正常に戻す", "血圧を測る", "骨折を固定する"], "心臓の動きを正常に戻す", "電気ショックで心室細動などを取り除くことを目指します。", 1],
    ["q13", "informatics", "情報モラル", "truefalse", "同じパスワードを複数のサービスで使い回すと安全性が高まる。", ["○", "×"], "×", "1件の漏えいが他サービスへの不正ログインにつながります。", 1],
    ["q14", "home", "調理", "choice", "肉の中心部まで十分に加熱できたか確認する温度の目安は？", ["35℃", "50℃", "75℃", "100℃"], "75℃", "中心部75℃で1分以上が一般的な目安です。", 1],
    ["q15", "music", "作曲家", "choice", "交響曲第9番「合唱付き」を作曲した人物は？", ["モーツァルト", "ベートーヴェン", "バッハ", "ショパン"], "ベートーヴェン", "第4楽章に「歓喜の歌」の合唱が入ります。", 1],
    ["q16", "art", "西洋美術", "choice", "「モナ・リザ」を描いた人物は？", ["ゴッホ", "ピカソ", "レオナルド・ダ・ヴィンチ", "ミケランジェロ"], "レオナルド・ダ・ヴィンチ", "ルネサンスを代表する芸術家・科学者です。", 1],
    ["q17", "calligraphy", "楷書", "choice", "点画を崩さず、形が整った基本的な書体は？", ["楷書", "行書", "草書", "篆書"], "楷書", "楷書は一画ずつをはっきり書く書体です。", 1],
    ["q18", "finance", "詐欺対策", "truefalse", "「必ずもうかる」と保証する投資話は、慎重に疑うべきである。", ["○", "×"], "○", "投資に絶対はありません。強い断定は警戒サインです。", 1],
    ["q19", "manners", "公共の場", "choice", "エレベーターから乗り降りするときの基本は？", ["乗る人が先", "降りる人が先", "同時に動く", "決まりはない"], "降りる人が先", "先に降りてもらうと、入口付近の混雑を減らせます。", 1],
    ["q20", "culture", "暦・単位", "choice", "1ダースはいくつ？", ["10", "12", "20", "24"], "12", "12個をひとまとまりにした数え方です。", 1],
    ["q21", "trivia", "生き物", "choice", "タコの心臓はいくつ？", ["1つ", "2つ", "3つ", "8つ"], "3つ", "全身へ送る心臓1つと、えらへ送る心臓2つがあります。", 2]
  ];
  return questions.map(function (item, index) {
    return {
      id: item[0],
      subjectId: item[1],
      category: item[2],
      type: item[3],
      prompt: item[4],
      imageUrl: "",
      choicesJson: JSON.stringify(item[5]),
      answer: item[6],
      explanation: item[7],
      difficulty: item[8],
      kanjiLevel: item[1] === "japanese" && item[2] === "漢字" ? "未設定" : "",
      sortOrder: index,
      "公開状態": "公開",
      updatedAt: now
    };
  });
}
