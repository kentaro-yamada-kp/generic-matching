# ローカル開発環境構築手順書

本ドキュメントは、**Generic Matching** の開発をローカル環境で開始するためのセットアップ手順、運用方法、およびトラブルシューティングをまとめたものです。

---

## 1. 開発環境アーキテクチャ概要

ローカル開発環境では、フロントエンド・バックエンドを統合した **Next.js** アプリケーションと、データ永続化層である **PostgreSQL** を Docker Compose を用いて連携動作させます。

```text
[ ローカル開発PC ]
  │
  ├── [ホスト環境 / または appコンテナ]
  │     Next.js (ポート: 3000)
  │     - React 19 / App Router (SSR, RSC)
  │     - Route Handlers & Server Actions
  │     - Prisma Client
  │
  └── [db コンテナ (Docker Compose)]
        PostgreSQL 16 (ホスト公開ポート: 5432)
        - データベース名: generic_matching
        - ボリューム: postgres_data (データ永続化)
```

---

## 2. 前提条件と必要ツール

ローカルマシンに以下のツールがインストールされていることを確認してください。

| ツール | 推奨バージョン | 確認コマンド | 備考 |
|---|---|---|---|
| **Node.js** | v20.x または v22.x LTS | `node -v` | JavaScript実行環境 |
| **npm** | v10.x 以上 | `npm -v` | パッケージマネージャー |
| **Docker** | Docker 24.x 以上 | `docker -v` | コンテナ実行基盤 |
| **Docker Compose** | Compose v2.x 以上 | `docker compose version` | 複数コンテナ管理 |
| **Git** | 最新版 | `git --version` | バージョン管理 |

---

## 3. 初回セットアップ手順

リポジトリをクローンした後、以下の手順に従って環境を立ち上げます。

### ステップ 1: パッケージのインストール
リポジトリのルートディレクトリで依存関係をインストールします。

```bash
npm install
```

### ステップ 2: 環境変数ファイルの設定
プロジェクトルートに `.env` ファイルを作成し、データベース接続文字列等を設定します。

```env
# データベース接続文字列 (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/generic_matching?schema=public"

# Next.js / アプリケーション設定
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 認証設定 (Phase 3以降で追加予定)
# NEXTAUTH_SECRET="your-secret-key"
# NEXTAUTH_URL="http://localhost:3000"
```

### ステップ 3: データベース（PostgreSQL）コンテナの起動
Docker Compose を使用して PostgreSQL コンテナをバックグラウンドで起動します。

```bash
docker compose up -d db
```
> ※ `docker compose up -d` を実行すると `app` コンテナと `db` コンテナが同時に起動しますが、ホスト環境で `npm run dev` を動かす場合は `db` コンテナのみの起動で十分です。

起動状態の確認:
```bash
docker compose ps
```

### ステップ 4: Prisma スキーマの適用とクライアント生成
Prisma スキーマをデータベースへ反映し、TypeScript 向け Prisma Client を生成します。

```bash
# Prisma Client の型定義を生成
npm run db:generate

# スキーマをローカルDBへ直接反映（開発時）
npm run db:push
```

### ステップ 5: 開発サーバーの起動
Next.js 開発サーバーを起動します。

```bash
npm run dev
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスし、トップ画面が表示されることを確認してください。  
ヘルスチェックAPI: [http://localhost:3000/api/health](http://localhost:3000/api/health) で `{ "status": "ok", "timestamp": "..." }` が返れば疎通確認完了です。

---

## 4. 日常の開発コマンド

### アプリケーション開発

| コマンド | 説明 |
|---|---|
| `npm run dev` | ホストマシン上でNext.js開発サーバー（ホットリロード対応）を起動 |
| `npm run build` | プロダクションビルドを実行（型チェック・静的解析） |
| `npm run start` | ビルド済み成果物で本番同等のサーバーを起動 |
| `npm run lint` | ESLint による静的コード解析を実行 |
| `npm run format` | Prettier によるコード自動整形 |
| `npm run format:check` | コードフォーマットの整合性チェック |

### データベース運用 (Prisma)

| コマンド | 説明 |
|---|---|
| `npm run db:generate` | `prisma/schema.prisma` から Prisma Client の型とコードを再生成 |
| `npm run db:push` | スキーマ変更をマイグレーション履歴を作らずに直接DBに適用（プロトタイプ時） |
| `npm run db:migrate` | 本番向けマイグレーションファイルを作成し、DBに適用 |
| `npm run db:studio` | ブラウザでDBレコードを閲覧・編集できるGUIツール（Prisma Studio: `localhost:5555`）を起動 |

### Docker コンテナ運用

| コマンド | 説明 |
|---|---|
| `docker compose up -d` | 全コンテナ（app, db）をバックグラウンド起動 |
| `docker compose up -d db` | PostgreSQL データベースコンテナのみを起動 |
| `docker compose down` | コンテナを停止・削除（DBデータボリュームは保持） |
| `docker compose down -v` | コンテナおよびDB永続化ボリュームを完全削除（初期化時） |
| `docker compose logs -f db` | PostgreSQL コンテナのリアルタイムログを表示 |

---

## 5. Prisma Studio によるデータ操作

データベース内のテーブルやデータをブラウザ上で直接確認・編集するには、Prisma Studio を使用します。

1. 以下のコマンドを実行:
   ```bash
   npm run db:studio
   ```
2. 自動的にブラウザが立ち上がり [http://localhost:5555](http://localhost:5555) が開きます。
3. `User`, `Thread`, `Match`, `ChatRoom` などのテーブルを一覧・編集できます。

---

## 6. トラブルシューティング

### Q1. `npm run db:push` や接続時に `Can't reach database server` エラーが出る
- **原因**: PostgreSQL コンテナが起動していないか、接続ポート（5432）が競合しています。
- **対処法**:
  1. `docker compose ps` で `generic-matching-db` が `Up` になっているか確認する。
  2. 起動していない場合は `docker compose up -d db` を実行する。
  3. ホスト側に既に別のPostgreSQLサービスが常駐している場合は停止するか、`docker-compose.yml` のポートマッピングを変更する。

### Q2. Prisma Client の型が更新されない / エディタでエラーが表示される
- **原因**: `prisma/schema.prisma` 変更後に `db:generate` が実行されていない。
- **対処法**:
  1. `npm run db:generate` を実行する。
  2. VS Code / IDEA などのエディタの TypeScript サーバーを再起動する（VS Code: `TypeScript: Restart TS Server`）。

### Q3. Docker のデータベースデータを完全にリセットして初期状態に戻したい
- **対処法**:
  ```bash
  docker compose down -v
  docker compose up -d db
  npm run db:push
  ```
