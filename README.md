# なんでもマッチング (Generic Matching)

複数のSNS・外部アカウントと連携し、共通の基本プロフィール属性とスレッドごとのマッチング条件をもとにユーザー同士をマッチングし、リアルタイムチャットを提供するWebアプリケーション基盤です。

---

## 📖 用語一覧 (Ubiquitous Language)

プロジェクト全体（仕様書、UI画面、API、DB、ソースコード）で統一して使用する公式用語の定義です。

| 用語 | 説明 |
|---|---|
| **スレッド** | テーマや目的ごとに開設される参加者の募集単位。 |
| **スレッド管理者** (管理者) | スレッドの設定変更や削除権限を持ち、参加者一覧を確認できるユーザー。※作成者の概念はなく、一律「管理者」として扱います。 |
| **参加** / **参加する** | ユーザーがスレッドに参加登録を行い、マッチング対象となること。 |
| **退出** / **退出する** | 参加中のスレッドからステータスを変更し退出すること。 |
| **マッチング条件** | スレッドや参加者が設定する、マッチング適合度判定のための条件項目。 |
| **Agree** (いいね) / **スキップ** | 推薦された候補者に対してマッチング希望の意思を示すアクション。双方がAgreeした場合にマッチングが成立します。 |

---

## 主な機能

- **マルチプラットフォーム連携**: X(Twitter), Instagram, LINE, Discord, Steam, PlayStation Network などとのOAuth連携
- **柔軟なマッチング機構**:
  - **共通基本条件 (A)**: 年齢、性別、居住地域、オンライン状態、利用目的、スキル/趣味カテゴリ
  - **スレッドマッチング条件 (B)**: ゲームタイトル、ランク帯、活動時間帯、話題タグなど
- **匿名性保護**: スレッド参加者一覧はスレッド管理者のみが閲覧可能。一般参加者にはマッチング評価用の個別レコメンドのみ表示。
- **専用リアルタイムチャット**: 相互Agreeでマッチング成立時に自動で1対1の専用チャットルームを生成
- **将来拡張予定**: WebRTCによる音声通話機能、マッチング優先度機能等のマネタイズ

---

## 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
- **スタイリング**: [Tailwind CSS v4](https://tailwindcss.com/)
- **データベース & ORM**: [PostgreSQL](https://www.postgresql.org/) / [Prisma ORM](https://www.prisma.io/)
- **コンテナ環境**: Docker & Docker Compose (`app` + `db` PostgreSQL)
- **コード品質**: ESLint, Prettier

---

## ディレクトリ構成

```text
generic-matching/
├── .junie/                 # AIエージェント設定・ガイドライン (AGENTS.md, guidelines.md)
├── docs/                   # 仕様書・設計書 (features.md, database-design.md 等)
├── prisma/                 # DBスキーマ・マイグレーション定義 (schema.prisma)
├── public/                 # 静的アセット
├── src/                    # アプリケーションソースコード
│   ├── app/                # Next.js App Router ページ・レイアウト・API
│   ├── components/         # Reactコンポーネント (UI, Layout)
│   ├── lib/                # 共通ユーティリティ (prisma.ts, utils.ts)
│   ├── server/             # サーバーサイドDB・ロジック
│   └── types/              # TypeScript型定義
├── todo/                   # タスク・課題管理 (todo_note.md, todo_junie.md)
├── docker-compose.yml      # Docker Compose設定
├── Dockerfile              # Dockerビルド定義
├── package.json            # パッケージ定義
└── README.md               # 本ドキュメント
```

---

## データベースモデル構成

PostgreSQLデータベースはPrisma (`prisma/schema.prisma`) で管理されています:

| モデル名 | テーブル名 | 説明 |
|---|---|---|
| `User` | `users` | ユーザーの基本エンティティ（内部UUID、表示名、アバターURL、タイムスタンプ）。 |
| `UserAuthProvider` | `user_auth_providers` | OAuthプロバイダ認証連携情報（Twitter, Discord等）。 |
| `UserProfile` | `user_profiles` | ユーザーの共通基本条件属性（年齢、性別、地域、目的、カテゴリ、オンライン状態）。 |
| `Thread` | `threads` | 管理者が作成・管理するマッチング募集スレッド。 |
| `ThreadCondition` | `thread_conditions` | スレッドに付与される動的マッチング条件（キー・値・型）。 |
| `ThreadParticipant` | `thread_participants` | スレッドへの参加情報（自己紹介・ステータス）。 |
| `ParticipantAttribute` | `participant_attributes` | 参加者がスレッド内で設定する個別属性・希望条件。 |
| `MatchEvaluation` | `match_evaluations` | 参加者間のマッチング評価（Agree / スキップ）。 |
| `Match` | `matches` | 双方がAgreeしたマッチング成立レコード。 |
| `ChatRoom` | `chat_rooms` | マッチング成立時に自動生成される専用チャットルーム。 |
| `ChatMessage` | `chat_messages` | チャットルーム内で送受信されるメッセージ履歴。 |

---

## 開発環境のセットアップ

### 前提条件

- [Node.js](https://nodejs.org/) (v20以上 または v22以上推奨)
- [Docker](https://www.docker.com/) & Docker Compose

### 手順

1. **リポジトリのクローンと依存パッケージのインストール**:
   ```bash
   npm install
   ```

2. **Dockerコンテナの起動（PostgreSQLデータベース）**:
   ```bash
   docker compose up -d
   ```

3. **Prisma Clientの生成 & スキーマ適用**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **開発サーバーの起動**:
   ```bash
   npm run dev
   ```

5. ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスします。

---

## スクリプト一覧

| コマンド | 説明 |
|---|---|
| `npm run dev` | Next.js開発サーバーを起動 |
| `npm run build` | プロダクション向けビルドを実行 |
| `npm run start` | ビルド済みプロダクションサーバーを起動 |
| `npm run lint` | ESLintによる静的コード解析を実行 |
| `npm run format` | Prettierによるコード自動整形を実行 |
| `npm run format:check` | Prettierによるコードフォーマットチェックを実行 |
| `npm run db:generate` | Prisma Clientの型・コードを生成 |
| `npm run db:push` | スキーマ変更を直接データベースに反映 |
| `npm run db:migrate` | Prismaマイグレーションを作成・実行 |
| `npm run db:studio` | Prisma Studio（GUI管理画面）を起動 |

---

## 関連ドキュメント

### プロジェクト管理・ガイドライン
- [タスク・進捗管理 (todo/todo_junie.md)](./todo/todo_junie.md)
- [開発ガイドライン・規約 (.junie/guidelines.md)](./.junie/guidelines.md)
- [AIエージェント役割定義 (.junie/AGENTS.md)](./.junie/AGENTS.md)

### 環境構築
- [ローカル開発環境構築手順書 (docs/dev-environment.md)](./docs/dev-environment.md)

### 設計資料
- [機能一覧 (docs/features.md)](./docs/features.md)
- [ドメインモデル定義書 (docs/domain-model.md)](./docs/domain-model.md)
- [データベース詳細設計書 (docs/database-design.md)](./docs/database-design.md)
- [画面設計書 (docs/ui-design.md)](./docs/ui-design.md)
- [API設計書 (docs/api-design.md)](./docs/api-design.md)
- [将来拡張設計書 (docs/future-extensions.md)](./docs/future-extensions.md)
