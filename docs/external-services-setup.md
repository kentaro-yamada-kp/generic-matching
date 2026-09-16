# 外部サービス（OAuth）連携セットアップ・運用手順書

本ドキュメントは、**Generic Matching** で提供している4つの外部認証プロバイダ（**X / 旧Twitter**, **Discord**, **LINE**, **Instagram**）と実際に連携するためのデベロッパーポータル設定手順、認証情報（クライアントID / シークレット）の取得、環境変数への登録、および運用時の確認事項をまとめた初期構築・運用手順書です。

---

## 📋 目次

1. [全体の認証アーキテクチャ & コールバックURI一覧](#1-全体の認証アーキテクチャ--コールバックuri一覧)
2. [X (旧Twitter) 連携設定手順](#2-x-旧twitter-連携設定手順)
3. [Discord 連携設定手順](#3-discord-連携設定手順)
4. [LINE (LINE Login) 連携設定手順](#4-line-line-login-連携設定手順)
5. [Instagram (Instagram Basic Display / Graph API) 連携設定手順](#5-instagram-連携設定手順)
6. [環境変数（.env / 本番環境）の設定方法](#6-環境変数env--本番環境の設定方法)
7. [動作確認 & トラブルシューティング](#7-動作確認--トラブルシューティング)
8. [本番運用・メンテナンス時の注意点](#8-本番運用メンテナンス時の注意点)

---

## 1. 全体の認証アーキテクチャ & コールバックURI一覧

Generic Matching では、外部OAuthプロバイダを用いたシングルサインオン（SSO）および複数SNSの紐付け（アカウント連携）を採用しています。

### 認証エンドポイント仕様
- **認証開始URL**: `/api/auth/[provider]`（例: `/api/auth/twitter`）
  - ※ NextAuth互換のエイリアス `/api/auth/signin/[provider]`（例: `/api/auth/signin/twitter`）からも自動リダイレクト対応しています。
- **コールバックURL**: `/api/auth/callback/[provider]`（例: `/api/auth/callback/twitter`）

各プロバイダの開発者ポータルにおいて、以下の**リダイレクトURI（Callback URL）**を登録する必要があります。

| プロバイダ名 | ローカル開発環境用 リダイレクトURI | 本番環境用 リダイレクトURI（例） |
|---|---|---|
| **X (旧Twitter)** | `http://localhost:3000/api/auth/callback/twitter` | `https://your-domain.com/api/auth/callback/twitter` |
| **Discord** | `http://localhost:3000/api/auth/callback/discord` | `https://your-domain.com/api/auth/callback/discord` |
| **LINE** | `http://localhost:3000/api/auth/callback/line` | `https://your-domain.com/api/auth/callback/line` |
| **Instagram** | `http://localhost:3000/api/auth/callback/instagram` | `https://your-domain.com/api/auth/callback/instagram` |

> 💡 **ポイント**:
> ローカル開発環境のベースURLは `NEXT_PUBLIC_APP_URL=http://localhost:3000`、本番環境では `NEXT_PUBLIC_APP_URL=https://<本番ドメイン>` となります。

---

## 2. X (旧Twitter) 連携設定手順

### 2.1. 開発者ポータルへのアクセス
1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) にアクセスし、Xアカウントでログインします。
2. Developer Portal利用規約に同意し、開発者アカウントを有効化（FreeまたはBasic以上のプラン）します。

### 2.2. プロジェクトおよびアプリの作成
1. **Projects & Apps** から **Create App**（または既存アプリ）を選択します。
2. アプリ名（例: `Generic Matching`）を入力します。

### 2.3. User authentication settings (OAuth 2.0) の構成
1. アプリの **Settings** タブにある **User authentication settings** の **Set up**（または **Edit**）をクリックします。
2. 以下の項目を設定します:
   - **App permissions**: `Read`（ユーザー基本情報取得のみで十分な場合。DMやツイート投稿を行う場合は `Read and write`）
   - **Type of App**: `Web App, Automated App or Bot`（機密クライアント / Confidential Client）
   - **Callback URI / Redirect URL**:
     - `http://localhost:3000/api/auth/callback/twitter`
     - （本番用）`https://your-domain.com/api/auth/callback/twitter`
   - **Website URL**: サービスのトップURL（例: `http://localhost:3000` または本番URL）
   - **Terms of service** / **Privacy policy**: 利用規約・プライバシーポリシーURL
3. **Save** をクリックして保存します。

### 2.4. X (Twitter) OAuth 2.0 の認可画面表示挙動について (ISSUE-06)
- **毎回「アクセス権限の許可」画面（Authorize App）が表示される挙動**:
  - Xの OAuth 2.0 (Authorization Code Flow with PKCE) 仕様では、従来の OAuth 1.0a (`/oauth/authenticate`) と異なり、認可エンドポイント (`https://twitter.com/i/oauth2/authorize`) を経由する際に、ユーザーが過去に連携済みであっても毎回認可確認画面が表示される場合があります（Xプラットフォーム側の仕様）。
  - アプリケーション側の認可URLパラメータとして強制再認証（`prompt=consent` / `prompt=login`）を付与していない標準状態でも、X側のセッション状態やブラウザセキュリティ設定によって確認画面が表示されます。
  - これはユーザーが意図したアカウントで連携しているかを明示的に確認・保護するための正常なセキュリティ動作です。
  - 一度連携されたアカウントは、データベース上の `user_auth_providers` テーブルに `providerAccountId` が保持され、2回目以降のログイン時も同一ユーザーとして安全にセッションが復元・継続されます。

### 2.5. クライアント情報の取得
- 表示される **Client ID** および **Client Secret** をコピーして控えます。
- `.env` に以下のように設定します:
  ```env
  TWITTER_CLIENT_ID="取得したClient ID"
  TWITTER_CLIENT_SECRET="取得したClient Secret"
  ```

---

## 3. Discord 連携設定手順

### 3.1. 開発者ポータルへのアクセス
1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセスし、Discordアカウントでログインします。

### 3.2. アプリケーションの新規作成
1. 右上の **New Application** をクリックします。
2. アプリケーション名（例: `Generic Matching`）を入力し、利用規約に同意して **Create** をクリックします。
3. 必要に応じてアイコン画像や説明文を設定します。

### 3.3. OAuth2 設定 & リダイレクトURI登録
1. 左側サイドバーから **OAuth2** → **General**（または **OAuth2**）を選択します。
2. **Redirects** セクションの **Add Redirect** をクリックし、以下を登録して **Save Changes** をクリックします:
   - 開発用: `http://localhost:3000/api/auth/callback/discord`
   - 本番用: `https://your-domain.com/api/auth/callback/discord`
3. **Default Authorization Link** は `In-app Authorization` または `Custom URL` で構いません（本システムではサーバー側で動的に認可URLを生成します）。

### 3.4. 権限スコープ (Scopes) の仕様
Generic Matching では以下のスコープを要求します:
- `identify`: ユーザーのID、ユーザー名、アバター画像URLの取得
- `email` (オプション): ユーザーの登録メールアドレス（アカウント照合用）

### 3.5. クライアント情報の取得 & 環境変数設定
1. **OAuth2** タブ上部の **Client ID** をコピーします。
2. **Client Secret** の **Reset Secret** をクリックしてシークレットを生成・コピーします（一度しか表示されないため確実に保存してください）。
3. `.env` に以下のように設定します:
  ```env
  DISCORD_CLIENT_ID="取得したClient ID"
  DISCORD_CLIENT_SECRET="取得したClient Secret"
  ```

---

## 4. LINE (LINE Login) 連携設定手順

### 4.1. LINE Developers コンソールへのアクセス
1. [LINE Developers Console](https://developers.line.biz/console/) にアクセスし、LINEアカウント（ビジネスアカウントまたは個人LINE）でログインします。
2. 初回の場合は開発者情報の登録（氏名・メールアドレス）を行います。

### 4.2. プロバイダーおよびチャネルの作成
1. **プロバイダーを作成** をクリックし、プロバイダー名（例: `Generic Matching Project`）を入力して作成します。
2. プロバイダー配下の **チャネル作成** で **LINEログイン** を選択します。
3. 以下のチャネル基本項目を入力します:
   - **チャネルの種類**: `LINEログイン`
   - **プロバイダー**: 作成したプロバイダー
   - **チャネル名**: `Generic Matching`（認可画面に表示されます）
   - **チャネル説明**: `汎用条件マッチングプラットフォーム`
   - **アプリタイプ**: `ウェブアプリ` をチェック
   - **メールアドレス**: 運用・開発者の連絡用メールアドレス
   - **プライバシーポリシーURL / 利用規約URL**: （任意、本番公開時は設定推奨）
4. LINE開発者規約に同意して **作成** をクリックします。

### 4.3. LINEログイン設定 & コールバックURL登録
1. 作成したチャネルの **LINEログイン設定** タブを開きます。
2. **ウェブアプリ** が「有効」になっていることを確認します。
3. **コールバックURL** の「編集」をクリックし、以下を入力して **更新** します:
   - `http://localhost:3000/api/auth/callback/line`
   - `https://your-domain.com/api/auth/callback/line`
4. ※ LINE公式アカウントと友だち追加を連携させたい場合は、**友だち追加オプション** から「同意画面に友だち追加ボタンを表示する」を設定可能です。

### 4.4. メールアドレス取得権限の申請（任意）
1. ユーザーのメールアドレスを取得して認証照合に利用する場合は、**チャネル基本設定** タブの「OpenID Connect」セクションにある **メールアドレス取得権限** の「申請」をクリックし、利用目的を記載して申請します（即時承認される場合が多いです）。

### 4.5. チャネル情報の取得 & チャネルの公開
1. **チャネル基本設定** タブから **チャネルID (Channel ID)** と **チャネルシークレット (Channel Secret)** をコピーします。
2. チャネル画面上部の **開発中** と表示されているステータスバッジをクリックし、**公開** に切り替えます（※「開発中」のままだと、チャネル作成者以外の一般LINEユーザーがログイン時にエラーとなります）。
3. `.env` に以下のように設定します:
  ```env
  LINE_CLIENT_ID="取得したChannel ID"
  LINE_CLIENT_SECRET="取得したChannel Secret"
  ```

---

## 5. Instagram 連携設定手順

### 5.1. Meta for Developers へのアクセス
1. [Meta for Developers (旧Facebook Developers)](https://developers.facebook.com/) にアクセスし、Facebook/Metaアカウントでログインします。
2. 開発者登録が未完了の場合は登録フロー（本人確認およびメール認証）を完了させます。

### 5.2. アプリの新規作成
1. 右上の **マイアプリ** → **アプリを作成** をクリックします。
2. ユースケースとして **その他**（または「ユーザーの本人確認を行う / ソーシャルログイン」）を選択します。
3. アプリタイプに **コンシューマー** または **ビジネス** を選択します。
4. アプリ表示名（例: `Generic Matching`）および連絡先メールアドレスを入力して **アプリを作成** をクリックします。

### 5.3. Instagram 基本表示 (Instagram Basic Display) の導入
1. アプリダッシュボードの左メニュー「製品を追加」から **Instagram 基本表示**（Instagram Basic Display）を見つけて **設定** をクリックします。
2. 画面最下部の **新しいアプリを作成** をクリックし、表示名を入力してInstagram App IDを作成します。

### 5.4. クライアントOAuth設定 & 有効なリダイレクトURI
1. **Instagram 基本表示** → **基本表示** 画面の **クライアントOAuth設定** を開きます。
2. 以下の項目を設定します:
   - **有効なOAuthリダイレクトURI**:
     - `http://localhost:3000/api/auth/callback/instagram`
     - `https://your-domain.com/api/auth/callback/instagram`
   - **認証の取り消しURL**: `http://localhost:3000/api/auth/callback/instagram`
   - **データ削除リクエストURL**: `http://localhost:3000/api/auth/callback/instagram`
3. **変更を保存** をクリックします。

### 5.5. 開発環境用 Instagram テスターの登録（重要）
Metaアプリが「開発モード」の間は、テスト登録されたInstagramアカウントのみ認証可能です:
1. 左メニューの **役割** → **役割**（または Instagram基本表示 画面の「Instagramテスター」）を開きます。
2. **Instagram テスターを追加** をクリックし、テストログインに利用する自身のInstagramユーザーネームを入力して招待を送信します。
3. **Instagram側での承認作業**:
   - ブラウザで [Instagram](https://www.instagram.com/) にログインし、**設定** → **ウェブサイトの許可**（Apps and Websites） → **テストの招待** タブを開きます。
   - `Generic Matching` からの招待が表示されるので、**承認** をクリックします。

### 5.6. クライアント情報の取得 & 環境変数設定
1. **Instagram 基本表示** → **基本表示** 画面を開きます。
2. **Instagram App ID** をコピーします。
3. **Instagram App Secret** の「表示」をクリックし、パスワードを入力してシークレットをコピーします。
4. `.env` に以下のように設定します:
  ```env
  INSTAGRAM_CLIENT_ID="取得したInstagram App ID"
  INSTAGRAM_CLIENT_SECRET="取得したInstagram App Secret"
  ```

---

## 6. 環境変数（.env / 本番環境）の設定方法

### 6.1. ローカル `.env` の設定例

プロジェクトルートの `.env` ファイルに以下の通り各プロバイダの認証情報を記述します:

```env
# アプリケーション基盤
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_BASE_URL="http://localhost:3000"
JWT_SECRET="generic-matching-super-secret-jwt-key-minimum-32-chars-long"

# データベース接続
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/generic_matching?schema=public"

# X (旧Twitter) OAuth 2.0
TWITTER_CLIENT_ID="your_twitter_client_id"
TWITTER_CLIENT_SECRET="your_twitter_client_secret"

# Discord OAuth 2.0
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"

# LINE Login OAuth 2.0
LINE_CLIENT_ID="your_line_channel_id"
LINE_CLIENT_SECRET="your_line_channel_secret"

# Instagram Basic Display OAuth 2.0
INSTAGRAM_CLIENT_ID="your_instagram_client_id"
INSTAGRAM_CLIENT_SECRET="your_instagram_client_secret"
```

### 6.2. 本番環境（AWS / Docker / Vercel等）での設定

本番環境にデプロイする際は、各プラットフォームの環境変数設定画面（AWS Systems Manager Parameter Store / ECSタスク定義 / Vercel環境変数等）に同様のキーを登録します。
- `NEXT_PUBLIC_APP_URL` および `APP_BASE_URL` は必ず `https://<本番ドメイン>` に変更してください。
- `JWT_SECRET` は暗号学的に安全なランダム文字列（32文字以上）を生成して設定してください。

---

## 7. 動作確認 & トラブルシューティング

### 7.1. 動作確認手順
1. アプリケーションを起動します (`npm run dev`)。
2. 右上の「ログイン / 新規登録」をクリックし、各プロバイダボタンを押下します。
3. 各SNSの認可画面へリダイレクトされ、許可後にGeneric Matchingのトップ画面へ正常に戻り、ヘッダーにユーザー情報が表示されることを確認します。
4. マイページ（`/profile`）またはユーザーメニューから「SNS・外部アカウント連携管理」を開き、他のSNSを追加連携して問題なく複数の連携バッジが付くことを確認します。

### 7.2. よくあるエラーと対処法

| エラー内容 | 原因 | 対処法 |
|---|---|---|
| `redirect_uri_mismatch` / `Invalid Redirect URI` | プロバイダ側に登録したリダイレクトURIと実際のアクセス元URIが一致していない。 | ポータル側のリダイレクトURI末尾のスラッシュ有無、`http`/`https`、ポート番号が `.env` の `NEXT_PUBLIC_APP_URL` と完全一致しているか確認します。 |
| `invalid_client` / `Unauthorized` | Client ID または Client Secret が間違っている。 | 各Developer Portalから再取得し、`.env` に正しく貼り付けてサーバーを再起動します。 |
| `state_mismatch` / `認証セッションがタイムアウト...` | 認可フローのタイムアウトまたはCookie破損。 | ブラウザのCookieをクリアし、再度トップページからログインフローを開始します。 |

---

## 8. 本番運用・メンテナンス時の注意点

1. **シークレット情報の保護**:
   - `*_CLIENT_SECRET` は絶対にフロントエンドやGitリポジトリ（公開コミット）に含めないでください。
2. **APIバージョンの追従**:
   - Meta (Instagram), X, Discord, LINE は定期的にAPIバージョンを更新します。年1回程度、APIの非推奨化アナウンスを確認してください。
3. **プロバイダ側の審査（App Review）**:
   - Instagram / Facebookログインを一般公開ユーザーへ広く提供する場合、Metaによるアプリレビュー（アクセス権限の承認）が必要になる場合があります。
