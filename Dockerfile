# Next.js 開発環境用 Dockerfile
FROM node:22-alpine AS base

WORKDIR /app

# Alpine環境およびネイティブビルドに必要な依存関係のインストール
RUN apk add --no-cache libc6-compat openssl

# 依存パッケージのインストール層
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline || npm install

# 開発用実行イメージ
FROM base AS dev
WORKDIR /app
ENV NODE_ENV=development
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma Client の生成
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
