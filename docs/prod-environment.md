# 本番環境構築・デプロイ手順書 (`docs/prod-environment.md`)

本書は、**Generic Matching** プロジェクトの本番環境（AWS EC2）における構築手順、環境変数設定、およびデプロイ・運用管理手順についてまとめたものです。

---

## 1. 前提条件と環境変数設定

### 1.1. 本番環境変数 (`.env.production`)
本番環境サーバー上でプロジェクトルートに `.env.production` ファイルを配置します。機密情報（パスワードやシークレット）はGitに含めず、JenkinsのSecret File等を経由して安全に転送・配置します。

```env
# Node.js 環境設定
NODE_ENV=production
PORT=3000

# データベース接続文字列 (PostgreSQL)
DATABASE_URL="postgresql://postgres:your_secure_password@db:5432/generic_matching?schema=public"

# Next.js / 認証設定
NEXTAUTH_URL="https://kykp.net/generic-matching"
NEXTAUTH_SECRET="your-production-secure-random-secret-key"
```

---

## 2. 本番用 Docker Compose 設定 (`docker-compose.production.yml`)

本番環境では、ソースコードのライブマウントを行わず、ビルド済みイメージを使用してコンテナを起動します。

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: generic_matching_app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@db:5432/${POSTGRES_DB:-generic_matching}?schema=public
      - NEXTAUTH_URL=https://kykp.net/generic-matching
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    container_name: generic_matching_db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-generic_matching}
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-generic_matching}"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  db_data:
    driver: local
```

---

## 3. デプロイ手順

### 3.1. Jenkins Pipeline による自動デプロイ（推奨）
共通インフラの Jenkins (`app-deploy.Jenkinsfile`) を用いて自動デプロイを行います。
- **パラメータ**:
  - `ACTION`: `DEPLOY`
  - `PROJECT`: `generic-matching`
  - `BRANCH`: `main`
  - `EC2_HOST`: `kykp.net` (または対応IP)
  - `APP_PORT`: `3000`
  - `HEALTH_CHECK_PATH`: `/api/health`
  - `COMPOSE_FILE`: `docker-compose.production.yml`

### 3.2. 手動デプロイ手順 (EC2上での直接実行)
緊急時や手動確認を行う場合、以下の手順でEC2にSSH接続してデプロイを実行します。

```bash
# 1. EC2へSSH接続
ssh -i C:\Users\admin\WorkSpace\10.projects\common\secrets\ec2-key-1.pem ec2-user@kykp.net

# 2. プロジェクトディレクトリへ移動
cd /home/ec2-user/generic-matching

# 3. リポジトリの最新化
git fetch origin
git checkout main
git pull --ff-only origin main

# 4. 本番環境変数の存在確認
test -f .env.production

# 5. コンテナのビルドおよび再起動
docker compose -f docker-compose.production.yml up -d --build --remove-orphans

# 6. Nginx設定の反映・リロード
sudo install -m 0644 jenkins/nginx.conf /etc/nginx/conf.d/generic-matching.conf
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. ヘルスチェックと動作確認

### 4.1. ローカルヘルスチェック (EC2内部)
```bash
curl --fail http://127.0.0.1:3000/api/health
```
正常時は `{ "status": "ok", "timestamp": "..." }` が返却されます。

### 4.2. ドメイン経由の動作確認
ブラウザまたは curl にて以下にアクセスし、正常に表示・応答することを確認します。
- `https://kykp.net/generic-matching/`
- `https://kykp.net/generic-matching/api/health`

---

## 5. ロールバックおよびトラブルシューティング

- **データベースマイグレーション失敗時**:
  - DBスキーマ変更に伴うトラブル時は、直前のDBバックアップからのリストア、またはPrismaによる修正を行う。
- **コンテナログの確認**:
  ```bash
  docker compose -f docker-compose.production.yml logs --tail=100 app
  ```
- **Nginxエラー確認**:
  ```bash
  sudo tail -f /var/log/nginx/error.log
  ```
