# Next.js コンテナビルド定義
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

# 本番ビルド層
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# 本番実行層
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
