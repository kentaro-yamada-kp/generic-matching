# TODOs junie
##### junieがtodo_note.mdを確認、整形して記載する
##### チェックボックスで進捗管理
##### 記載から削除は人が行い、junieは行わない

## Bugs
- [x] [ISSUE-08] スレッド作成時に `category` カラム等の PrismaClientValidationError が発生する不具合の修正
- [x] [ISSUE-18] `threads.roles` カラム不整合による各API（公開プロフィール・マイページ・スレッド一覧）の500エラー解消（todo_note対応）
  - [x] 公開プロフィール取得 (`GET /api/users/[id]`) でのエラー解消
  - [x] マイページ詳細取得 (`GET /api/users/me`) でのエラー解消
  - [x] スレッド一覧取得 (`GET /api/threads`) でのエラー解消
  - [x] Prisma Client の再生成・DBスキーマ同期およびキャッシュ整合性の確認

## Improvements
- [ ] [ISSUE-17] 画面レイアウト改善・情報量削減（デザイン原則：認知的負荷軽減・1画面の情報集約とシンプル化）（todo_note対応）
  - [ ] 各画面（トップ、スレッド一覧・詳細、マイページ、チャット等）の要素・情報密度の整理とシンプル化方針のすり合わせ
  - [ ] 視線誘導と意思決定導線の最適化に向けたUIレイアウト改修
- [ ] Phase 7.5: 品質保証 & 運用準備
  - [ ] テスト設計書の作成 (`docs/test-design.md`)
    - [ ] 単体テスト（ユニットテスト）、結合テスト、E2Eテスト方針の策定
    - [ ] マッチングロジックおよび認証フローのテストケース定義
    - [ ] CI（GitHub Actions）における自動テスト実行計画
  - [ ] 運用設計書の作成 (`docs/operations-design.md`)
    - [ ] ログ設計（アクセスログ、アプリケーションログ、エラーログ）
    - [ ] 監視・アラート設計（CloudWatch, Sentry等による障害検知）
    - [ ] バックアップ・リストア運用方針（PostgreSQL/RDSの自動バックアップ）
    - [ ] セキュリティインシデントおよびユーザー問い合わせ対応フロー
- [x] Phase 8: インフラ設計・本番構築 & デプロイ
  - [x] 設計・構築ドキュメントの作成 (`docs/infrastructure-design.md`, `docs/prod-environment.md`)
  - [x] AWS リソース構築（VPC, サブネット, セキュリティグループ, EC2/ECS, RDS, S3）
  - [x] デプロイパイプライン (CI/CD) の構築（GitHub Actions / Jenkins integration）
- [ ] 将来拡張: スケーラビリティ & インフラ拡張
  - [ ] Redis / ElastiCache による WebSocket コネクションのセッション共有（Redis Pub/Sub）
  - [ ] 単一EC2構成から AWS ECS (Fargate) + ALB 構成への移行（水平オートスケーリング）

## Features
- [ ] 将来拡張: WebRTC 音声通話・リアルタイムボイスチャット機能
  - [ ] 1対1 ブラウザ間 P2P 音声通話機能の実装 (`RTCPeerConnection`, `getUserMedia`)
  - [ ] シグナリングサーバー連携 & STUN/TURNサーバー（`coturn` / AWS）の構築・導入
- [ ] 将来拡張: マネタイズ & 決済基盤
  - [ ] サービスプラン設計 & 権限制御（Free: 3件/日, Pro: ¥500/月, Premium: ¥1,500/月）
  - [ ] Stripe 決済基盤連携（Stripe Checkout / Billing サブスクリプション, Webhooks `/api/webhooks/stripe`）
- [ ] 将来拡張: プラットフォーム連携の拡充
  - [ ] Steam 連携（OpenID 2.0 / Steam Web API: ゲームタイトル、所有ゲーム、フレンド導線）
  - [ ] PlayStation Network (PSN) 連携（OAuth 2.0 / PSN API: PSN ID表示、トロフィー・オンライン状況）
  - [ ] Twitch 連携（OAuth 2.0: 配信ステータス表示、配信者ハイライト）
  - [ ] TikTok / BREAL 連携（OAuth 2.0: ショート動画・日常共有プラットフォーム連携）
- [ ] 将来拡張: AIスマートマッチング & コンテンツモデレーション
  - [ ] AIレコメンドマッチング（マッチング履歴・スレッド・プロフィールのベクトル埋め込みによる推薦）
  - [ ] AIコンテンツモデレーション（スレッド説明文およびチャットメッセージのリアルタイム検閲・マスキング）

