# QuizKing（GitHub Pages＋GAS版）

GitHub Pagesで画面を公開し、Google Apps Script（GAS）をAPI、Googleスプレッドシートをデータベースとして使う試作品です。

## 構成

```text
docs/
├── index.html          # GitHub Pagesの画面
├── styles.css          # PC・タブレット・スマホ対応デザイン
├── app.js              # クイズ、ログイン、管理画面、GAS通信
└── gas/
    ├── Code.gs         # GAS API・シート自動作成
    └── appsscript.json # GASプロジェクト設定
```

## 1. GASとスプレッドシートを準備

1. [Google Apps Script](https://script.google.com/)で「新しいプロジェクト」を作成します。
2. `docs/gas/Code.gs` の内容を、GASの `コード.gs` へすべて貼り付けます。
3. GASの「プロジェクトの設定」でマニフェストファイルを表示し、`docs/gas/appsscript.json` の内容を貼り付けます。
4. 関数一覧から `setupQuizKing` を選び、「実行」します。初回だけGoogleの権限確認があります。
5. 続けて `createAdminKey` を実行し、実行ログに表示される16文字の管理者キーを安全な場所へ控えます。
6. `getQuizKingSpreadsheetUrl` を実行すると、作成されたスプレッドシートのURLを確認できます。

`setupQuizKing` は、次の3シートを自動作成します。

- `Subjects`: 分野、分類、色、表示順
- `Questions`: 問題、形式、正解、解説、難易度、表示順
- `Attempts`: ニックネーム、得点、XP、回答履歴

## 2. GASをウェブアプリとして公開

1. GAS画面右上の「デプロイ」→「新しいデプロイ」を開きます。
2. 種類で「ウェブアプリ」を選択します。
3. 「次のユーザーとして実行」は自分、「アクセスできるユーザー」は全員に設定します。
4. デプロイ後、末尾が `/exec` のウェブアプリURLをコピーします。
5. `docs/app.js` 冒頭の次の値を、そのURLへ置き換えます。

```js
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/...../exec";
```

GASコードを後から変更した場合は、「デプロイを管理」から既存デプロイを新しいバージョンへ更新してください。Google公式の手順は、[ウェブアプリのデプロイ](https://developers.google.com/apps-script/guides/web)と[デプロイの管理](https://developers.google.com/apps-script/concepts/deployments)で確認できます。

## 3. GitHub Pagesで公開

1. この一式をGitHubリポジトリへアップロードします。
2. リポジトリの `Settings` → `Pages` を開きます。
3. `Build and deployment` を `Deploy from a branch` にします。
4. Branchを `main`、フォルダを `/docs` にして保存します。
5. 数分後、表示されたGitHub PagesのURLを開きます。

`index.html` と同じ階層に `app.js` と `styles.css` があるため、追加ビルドは不要です。

## 管理者ページ

ログイン後、右上のユーザー名を押すと管理者ページを開けます。

- 分野の追加
- 問題の追加
- 分野の並び替え
- 問題の並び替え
- 新しい分類名を使った問題追加時、その分類を分野へ自動追加

管理者キーはソースコードやブラウザの永続保存領域には保存せず、開いているタブのメモリにだけ保持します。更新結果はGASへPOSTした後、ランダムなリクエストIDで確認します。

## 試作品としてのログイン

現在は、子どもでもすぐ試せる「ニックネーム＋端末ID」方式です。ニックネーム、学習記録、端末IDはブラウザ内に保存され、GAS接続時は成績もスプレッドシートへ送られます。

これは本人確認を伴う認証ではありません。課金、個人情報、保護者管理を導入する本番版では、Firebase AuthenticationやGoogle Cloud Identity Platformなどの認証基盤、利用規約、プライバシーポリシー、決済事業者側のWebhook検証が必要です。

## 通信方式

GitHub PagesとGASは別ドメインです。公開データの読み込みはGASのContent Serviceが対応するJSONPを使用し、更新はURLに管理者キーを含めず `text/plain` のPOSTで送信します。JSONPは読み込み専用に限定しています。Google公式もJSONPで機密データを返さないよう注意しているため、個人情報や秘密情報は読み込みAPIへ載せないでください。[Content Service公式ガイド](https://developers.google.com/apps-script/guides/content)

## ローカル確認

`docs` フォルダで簡易サーバーを起動します。

```bash
cd docs
python3 -m http.server 8080
```

ブラウザで `http://localhost:8080` を開きます。GAS URLをまだ設定していなくても、内蔵サンプル問題で全画面を試せます。

## 問題形式

- `choice`: 択一
- `text`: 記述・一問一答
- `truefalse`: ○×

記述式は、全角・半角、空白、句読点、大文字・小文字の差を吸収して判定します。
