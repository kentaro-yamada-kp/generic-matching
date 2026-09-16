# プロジェクトガイドライン & 開発規約 (guidelines.md)

本ドキュメントは、**Generic Matching** プロジェクトにおける設計・実装・品質管理・課題運用の標準ルールおよびコーディング規約を定めたものです。  
すべての開発作業およびAIアシスタント（Junie）の実装は、本ガイドラインに準拠して行われます。

---

## 1. プロジェクト基本方針

1. **シンプル & 保守性の重視**:
   - Next.js App Routerの標準パラダイム（React Server Components, Server Actions, Route Handlers）に則った明瞭なアーキテクチャを採用します。
   - 過度な抽象化を避け、可読性と追従性の高いコードベースを維持します。
2. **完全日本語対応（最重要ルール）**:
   - 仕様書・設計書・README・ToDoリストはもちろん、**ソースコード内のコメント（JSDoc、インラインコメント）、型注釈、コミットメッセージ、ユーザーへの報告**に至るまですべて**日本語**で記述します。
3. **型安全性の徹底**:
   - TypeScriptの恩恵を最大化するため、`any` 型の使用を原則禁止とします。明示的な型定義またはPrismaモデルから生成された型を活用します。

---

## 2. 技術スタック

| カテゴリ | 採用技術 | バージョン / 備考 |
|---|---|---|
| フロントエンド / バックエンド | [Next.js](https://nextjs.org/) | v15+ (App Router, React 19, TypeScript) |
| スタイリング | [Tailwind CSS](https://tailwindcss.com/) | v4.x (CSS-first configuration) |
| データベース | [PostgreSQL](https://www.postgresql.org/) | 16-alpine (Docker Compose / 将来RDS) |
| ORM | [Prisma](https://www.prisma.io/) | v6.x (型安全なクエリビルダー & マイグレーション) |
| コード品質 | ESLint / Prettier | `eslint.config.mjs`, `prettier-plugin-tailwindcss` |
| コンテナ環境 | Docker / Docker Compose | アプリケーションおよびローカルDBの統合環境 |

---

## 3. ディレクトリ構成と責務

```text
generic-matching/
├── .junie/                 # AIエージェント定義およびガイドライン
│   ├── AGENTS.md           # Junieの役割・権限・行動規範
│   └── guidelines.md       # 開発規約・運用ルール（本ドキュメント）
├── docs/                   # プロジェクト各種設計書・仕様書・手順書
├── prisma/                 # DBスキーマ定義 (schema.prisma) およびマイグレーション
├── public/                 # 静的ファイル（画像・アセット・SVGアイコン等）
├── src/                    # アプリケーションソースコード
│   ├── app/                # Next.js App Router ページ・レイアウト・APIハンドラー
│   │   ├── (auth)/         # 認証関連ルーティンググループ
│   │   ├── (main)/         # メイン画面ルーティンググループ（スレッド一覧、マイページ等）
│   │   ├── api/            # API Route Handlers (/api/health, /api/auth, /api/threads 等)
│   │   ├── globals.css     # Tailwind CSS / グローバルスタイル
│   │   ├── layout.tsx      # ルートレイアウト
│   │   └── page.tsx        # トップ画面
│   ├── components/         # 再利用可能なReactコンポーネント
│   │   ├── layout/         # Header, Footer, Sidebar, Navigation 等の構造コンポーネント
│   │   └── ui/             # Button, Input, Modal, Badge 等の汎用プレゼンテーションUI
│   ├── lib/                # 共通ユーティリティ・外部クライアントシングルトン（prisma.ts 等）
│   ├── server/             # サーバーサイド専用ロジック（DBクエリ関数、ビジネスロジック）
│   └── types/              # ドメイン固有の型定義・インターフェース
├── todo/                   # タスク・課題管理用ディレクトリ
│   ├── todo_note.md        # 人間が記述する一次メモ
│   └── todo_junie.md       # Junieが整形・管理する公式ToDoリスト
├── docker-compose.yml      # ローカル開発用コンテナ定義
├── Dockerfile              # Next.js コンテナビルド定義
├── package.json            # 依存関係およびスクリプト
└── tsconfig.json           # TypeScriptコンパイラ設定
```

### ディレクトリごとの責務ルール
- **`src/components/ui/`**: 状態を持たない純粋なUI部品（Presentational Component）を配置。ビジネスロジックや直接のDB呼び出しは行わない。
- **`src/components/layout/`**: アプリケーション全体のレイアウト構造を構成する部品を配置。
- **`src/server/`**: サーバー側でのみ実行される処理（Prismaを使ったデータ取得、Server Actions、認証検証など）を配置。`'use client'` コンポーネントからは直接インポートせず、Server ActionまたはRoute Handlerを経由する。
- **`src/lib/prisma.ts`**: PrismaClientのシングルトンインスタンスを定義。複数インスタンス生成によるコネクション枯渇を防ぐ。

---

## 4. コーディング規約

### 4.1 TypeScript / JavaScript
- **型定義**:
  - 原則として `type` または `interface` を明示する。
  - `any` の使用は禁止。どうしても型が定まらない場合は `unknown` を用い、型ガードで絞り込む。
  - DBモデルに関連する型は `prisma/schema.prisma` から自動生成された `@prisma/client` の型を利用または拡張する。
- **命名規則**:
  - **変数・関数名**: ローワーキャメルケース (`getUserProfile`, `threadList`)
  - **コンポーネント名・クラス名・型名**: パスカルケース (`ThreadCard`, `UserProfile`, `MatchCondition`)
  - **定数名**: アッパースネークケース (`MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE`)
  - **ファイル名**:
    - コンポーネント: パスカルケース または ケバブケース（統一してケバブケース `thread-card.tsx` または `ThreadCard.tsx`。Next.js App Routerファイルは `page.tsx`, `layout.tsx` 等の小文字命名）
    - ユーティリティ/ロジック: ケバブケース (`prisma.ts`, `match-logic.ts`)

### 4.2 React / Next.js
- **Server Components vs Client Components**:
  - 原則としてデフォルトの **React Server Components (RSC)** を使用し、バンドルサイズの削減と高速な初期描画を維持する。
  - `useState`, `useEffect`, ブラウザAPI、イベントリスナー（`onClick` 等）が必要な末端のUI部品にのみ `'use client'` を付与する。
- **データフェッチング & 更新**:
  - RSC内では直接 `src/server/` 経由でPrismaやクエリ関数を呼び出す。
  - フォーム送信やデータ更新は **Server Actions** を優先的に活用する。
- **共通レイアウト・メタデータ**:
  - ページごとに適切な `metadata`（タイトル、説明、OGP）を定義する。

### 4.3 UIデザイン原則 & スタイリング (Tailwind CSS v4)

#### A. デザイン原則 (Design Principles)
1. **親しみやすさと心理的安全性 (Warmth & Psychological Safety)**:
   - ホワイトベージュ・ライトグレーを基調とし、角丸（`rounded-2xl`, `rounded-xl`）や北欧風の落ち着いたパステルトーンで、ユーザーが安心・リラックスして利用できるUIを提供する。
2. **認知的負荷の軽減・シンプルな意思決定 (Simplicity & Low Cognitive Load)**:
   - 1画面あたりの情報量や選択肢を絞り込み、スレッド参加や候補者評価（Agree / スキップ）を迷わず行える直感的な導線を維持する。
3. **クリーン & ハイコントラスト (Clarity & Contrast)**:
   - 背景（ホワイトベージュ）とテキスト（深みのあるチャコールグレー）のコントラスト比を十分に確保し、長時間の利用でも高い可読性を維持する。
4. **階層性と情報整理 (Visual Hierarchy)**:
   - スレッド条件や属性タグ、主要アクション（Agree / スキップ等）の優先度をカード構造・バッジ色・フォントウェイトで直感的に伝える。
5. **一貫した余白・コンポーネント造形 (Consistency & Rhythm)**:
   - 余白（Spacing: 4px/8pxグリッドベース）、角丸、境界線のトーンを統一する。
6. **明瞭な状態フィードバック (Feedback & Interaction)**:
   - ホバー、フォーカス、ローディング、無効状態（Disabled）、トースト通知等のフィードバックを即座かつ穏やかに表現する。

#### B. カラーシステム (北欧ナチュラル × 落ち着いたパステル)
- **ベース背景**: Warm Beige / Ecru (`#F9F8F6` / `bg-stone-50`)
- **カード / サーフェス**: Pure Soft White (`#FFFFFF` / `bg-white`, 微細なボーダー・柔らかい影で浮き立たせる)
- **メインテキスト**: Charcoal Slate (`#2D3748` / `text-stone-800`〜`text-slate-800`)
- **サブテキスト**: Muted Gray (`#718096` / `text-stone-500`〜`text-slate-500`)
- **メインアクセント**: Sage Green (`#6E8B74` / `#7D9D85` - 安心感・マッチング成立・主要アクション)
- **サブアクセント (情報・タグ)**: Dusty Blue (`#6B8EAE` / `#7C9CB9` - カテゴリタグ、情報バッジ、リンク導線)
- **サブアクセント (好意・アクション)**: Muted Terracotta / Peach (`#D9826C` / `#E09F8D` - 「Agree」評価、重要通知)
- **境界線・区切り**: Soft Border (`#EAE6DF` / `border-stone-200`)

#### C. Tailwind CSS コーディングルール
1. **Arbitrary values（任意の値 `[123px]` 等）の原則禁止**:
   - `w-[327px]` や `text-[#123456]` 等のインライン独自値は避け、Tailwind標準トークンやCSS変数を使用する。
2. **クラス記述の並び順ルールの統一**:
   - `レイアウト (flex, grid) → ボックスモデル (p-, m-, w-, h-) → タイポグラフィ (text-, font-) → 装飾 (bg-, border-, shadow-) → 状態・レスポンシブ (hover:, sm:)` の順序を意識する。
3. **角丸・シャドウの段階定義 (Design Tokens)**:
   - カード・モーダル: `rounded-2xl`
   - ボタン・フォーム入力欄: `rounded-xl`
   - タグ・バッジ・アバター: `rounded-full`
   - シャドウ: 濃い影を避け、ふんわり広がる柔らかな影（`shadow-sm`, `shadow-md`）を使用する。
4. **アニメーション・トランジションの統一**:
   - ホバーや状態遷移は `transition-colors duration-200 ease-in-out` などの標準プリセットを用い、穏やかなフィードバックにする。
5. **コンポーネント指向スタイリング & デザイントークン一元管理**:
   - ボタンやバッジなどの汎用UIパーツは `src/components/ui/` に集約し、各ページでの過度なクラス重複・定義分散を避ける。
   - `clsx` / `tailwind-merge`（`cn` ユーティリティ）を活用する。
   - モバイルファースト（ベース → `sm:` → `md:` → `lg:`）を徹底する。

### 4.4 データベースアクセス (Prisma)
- **シングルトンの利用**:
  ```typescript
  import { prisma } from "@/lib/prisma";
  ```
  ルートハンドラーやコンポーネント内で直接 `new PrismaClient()` を生成しない。
- **N+1問題の防止**:
  - 関連データを取得する際は、Prismaの `include` または `select` を適切に活用し、ループ内でのクエリ実行を避ける。
- **トランザクション**:
  - 複数テーブルにまたがる更新（例: マッチング成立時の `matches` 作成と `chat_rooms` 作成）は必ず `prisma.$transaction` を用いてアトミックに実行する。

### 4.5 エラーハンドリング & APIレスポンス
- Route HandlerのAPIレスポンスは以下の共通JSONフォーマットを遵守する:
  ```typescript
  // 成功時
  {
    "success": true,
    "data": T
  }

  // 失敗時
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST" | "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR",
      "message": "エラーの具体的な日本語説明"
    }
  }
  ```

---

## 5. 課題・タスク運用ルール（todo配下の2ファイル運用）

プロジェクトの課題・ToDo管理は、`todo/` ディレクトリ配下の2つのMarkdownファイルを用いて行います。

### 5.1 ファイルの役割

1. **`todo/todo_note.md`（人間が書く一次メモ）**:
   - ユーザーが思いついた課題、バグ報告、要望などを自由に記述するファイル。
   - 形式はラフなメモでよく、Junieが定期的に確認して構造化・整形することを前提とする。
   - **「junie読み取り対象外」セクションの扱い**:
     - `todo_note.md` 内に「junie読み取り対象外」と記載されたセクションがある場合、Junieはその内容を対応・転記・削除せず、そのまま残しておく。
   - Junieが `todo_junie.md` に転記した後、「junie読み取り対象」の転記済みメモはここから削除（クリア）される。
2. **`todo/todo_junie.md`（Junieが整形・管理する公式ToDo）**:
   - `todo_note.md` のメモをもとに、Junieがカテゴリ（Bugs / Improvements / Features）やフェーズ別に構造化・整理して記録する公式の進捗管理表。
   - チェックボックス（`- [ ]` / `- [x]`）で進捗を可視化する。
   - **タスク行の削除は人間のみが行い、Junieは削除せず `[x]` のチェック更新のみを行う**。

### 5.2 実装前イメージのすり合わせルール（重要）

- **実装着手前のイメージ合意**:
  - 実際にコードやスキーマの実装修正を行う前に、**必ず修正内容のイメージ（UIレイアウト、データ構造、振る舞い、仕様変更点等）をユーザーとすり合わせる**。
  - 基本は**対話形式での確認**を行い、合意を得てから実装に進む。
  - 内容が大規模・複雑で対話形式での確認が難しい場合は、**別資料（設計メモ、比較資料、移行手順等）を作成して提示し、すり合わせを行う**。

### 5.3 運用サイクル

```text
[ユーザー] todo_note.md に課題・要望をメモ（読み取り対象外セクションは維持）
    │
    ▼
[Junie] todo_note.md を確認・整形し、todo_junie.md へ転記 ＆ todo_note.md の対象メモをクリア
    │
    ▼
[Junie] 実装着手前に修正イメージ（仕様・UI・挙動）を対話または別資料ですり合わせ
    │
    ▼
[ユーザー] 方針の確認・合意
    │
    ▼
[Junie] todo_junie.md のToDoに基づき実装・修正・検証
    │
    ▼
[Junie] 完了したタスクのチェックボックスを [x] に更新し、ユーザーへ完了報告
    │
    ▼
[ユーザー] 完了したタスクの確認・不要になったタスク行の削除（任意）
```

---

## 6. バージョン管理・Git運用方針

- **Git運用の一時停止方針**:
  - プロジェクトの初期開発・高速プロトタイピング期間中は、**Git運用（自律的なコミット、ブランチ作成、プルリクエスト、マージ等）を行いません**。
  - 不要なコミットの乱立や履歴の煩雑化を防ぎ、ファイルベースでの迅速な修正・検証に集中します。
  - ユーザーから明示的にGitコミットやブランチ操作の指示があった場合のみ実施します。
- **将来的なGit再開時のコミット規約**:
  - 日本語で変更理由と内容を明記する（例: `feat: スレッド一覧の検索フィルター機能を追加`）。
  - AIエージェントによるコミット時は `--trailer "Co-authored-by: Junie <junie@jetbrains.com>"` を付与する。

---

## 7. 品質管理 & 検証手順

コード修正や機能追加を行った際は、以下の検証コマンドを順次実行し、エラーがないことを確認してください。

1. **静的リント検証**:
   ```bash
   npm run lint
   ```
2. **コードフォーマット検証**:
   ```bash
   npm run format:check
   ```
   （必要に応じて `npm run format` で自動整形）
3. **TypeScriptビルド検証**:
   ```bash
   npm run build
   ```
4. **DBスキーマ整合性確認**:
   `prisma/schema.prisma` を修正した場合は、`npm run db:generate` および `npm run db:push` を通して型不整合や構文エラーがないことを確認する。
