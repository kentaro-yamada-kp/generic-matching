# インフラ設計書 (`docs/infrastructure-design.md`)

本書は、**Generic Matching** プロジェクトの本番環境におけるAWSインフラストラクチャ設計、ネットワーク構成、およびリソース配置について定義したものです。

---

## 1. インフラアーキテクチャ概要

本プロジェクトでは、コスト効率と運用性を考慮し、共通インフラ（`../common`）と連携する **単一EC2インスタンス構成（Docker Composeベース）** を採用しています。ドメイン `kykp.net` の配下で複数のアプリケーション（`crane-rank`, `generic-matching`）をサブパスルーティングにより公開します。

```text
[ ユーザー (ブラウザ) ]
       │ HTTPS (Port 443)
       ▼
[ AWS EC2 インスタンス (Elastic IP: GIP-1) ]
       │
       ├── Nginx リバースプロキシ (共通インフラ / /etc/nginx/conf.d/kykp.net.conf)
       │     ├── https://kykp.net/crane-rank/      ──> http://127.0.0.1:3001/
       │     └── https://kykp.net/generic-matching/ ──> http://127.0.0.1:3000/
       │
       └── Docker Compose (generic-matching)
             ├── app コンテナ (Next.js / Port 3000)
             └── db コンテナ (PostgreSQL 16 / Port 5432 + 永続ボリューム)
```

---

## 2. AWS ネットワーク & リソース設計

### 2.1. VPC & サブネット
- **VPC**: デフォルトVPCまたは専用VPC
- **パブリックサブネット**: インターネットからのアクセスを受け付けるパブリックサブネットを配置。
- **インターネットゲートウェイ (IGW)**: パブリックサブネットからのインターネット接続を確保。

### 2.2. セキュリティグループ (Security Group)
EC2インスタンスに適用するセキュリティグループの設定：

| 通信方向 | プロトコル | ポート範囲 | ソース / 宛先 | 用途 |
|---|---|---|---|---|
| **インバウンド** | TCP | 22 (SSH) | 管理者IP / Jenkins | SSH リモート接続・デプロイ |
| **インバウンド** | TCP | 80 (HTTP) | `0.0.0.0/0` | HTTPアクセスおよび Let's Encrypt 認証用 |
| **インバウンド** | TCP | 443 (HTTPS) | `0.0.0.0/0` | セキュアWebアクセス (TLS 1.2 / 1.3) |
| **アウトバウンド** | ALL | すべて | `0.0.0.0/0` | 外部パッケージ取得、API通信等 |

### 2.3. コンピュートリソース (EC2)
- **AMI**: Amazon Linux 2023
- **インスタンスタイプ**: `t3.medium`（ビルド処理やAI連携・データベース動作を考慮したスペック）
- **キーペア**: `ec2-key-1`
- **Elastic IP**: 固定グローバルIP (`GIP-1`) を付与し、DNSドメイン `kykp.net` に紐付け。

### 2.4. ストレージ & データベース
- **データベース (PostgreSQL)**:
  - 本番環境では Docker コンテナ (`postgres:16-alpine`) または Amazon RDS (PostgreSQL) を利用。
  - データ永続化のため Docker ボリューム (`db_data`) をマウント。
- **静的ファイル・アップロードストレージ (S3)**:
  - ユーザーアバター画像やアップロードファイルなどの保存用に Amazon S3 バケットを利用（必要に応じて環境変数で連携）。

---

## 3. リバースプロキシ (Nginx) & SSL/TLS 設計

共通インフラ管理の Nginx 設定を利用し、サブパスによるルーティングと Let's Encrypt によるSSL/TLS暗号化を行います。

- **ドメイン**: `kykp.net`
- **SSL証明書**: Let's Encrypt (Certbot) による自動発行・更新 (`/etc/letsencrypt/live/kykp.net/`)
- **ルーティング定義 (`/etc/nginx/conf.d/kykp.net.conf`)**:
  - `/generic-matching/` ──> `http://127.0.0.1:3000/`
  - `/well-known/acme-challenge/` ──> Let's Encrypt 認証用ディレクトリ (`/var/www/html/`)

---

## 4. 将来の拡張性

- **スケーラビリティ**:
  - トラフィック増加や可用性向上のため、単一EC2構成から AWS ECS (Fargate) + ALB + Amazon RDS 構成への移行を将来拡張として想定。
- **セッション共有**:
  - Redis / ElastiCache による WebSocket / セッション情報の共有基盤の導入を視野に入れた設計。
