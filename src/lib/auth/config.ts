import type { SupportedOAuthProvider, OAuthProviderConfig } from "@/types/auth";

/**
 * アプリケーションのベースURLを取得する
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * 認証用JWTシークレットキーを取得する
 */
export function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("本番環境では NEXTAUTH_SECRET または AUTH_SECRET の設定が必須です。");
    }
    return "development-secret-key-must-be-at-least-32-chars-long";
  }
  return secret;
}

/**
 * 各OAuthプロバイダの設定定義
 */
export const OAUTH_PROVIDERS: Record<SupportedOAuthProvider, OAuthProviderConfig> = {
  twitter: {
    id: "twitter",
    name: "X (旧Twitter)",
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    authorizationUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    userInfoUrl: "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name",
    scopes: ["tweet.read", "users.read", "offline.access"],
    usePkce: true,
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    authorizationUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    userInfoUrl: "https://graph.instagram.com/me?fields=id,username",
    scopes: ["user_profile", "user_media"],
    usePkce: false,
  },
  line: {
    id: "line",
    name: "LINE",
    clientId: process.env.LINE_CLIENT_ID,
    clientSecret: process.env.LINE_CLIENT_SECRET,
    authorizationUrl: "https://access.line.me/oauth2/v2.1/authorize",
    tokenUrl: "https://api.line.me/oauth2/v2.1/token",
    userInfoUrl: "https://api.line.me/v2/profile",
    scopes: ["profile", "openid"],
    usePkce: false,
  },
  discord: {
    id: "discord",
    name: "Discord",
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    authorizationUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    userInfoUrl: "https://discord.com/api/users/@me",
    scopes: ["identify", "email"],
    usePkce: false,
  },
};

/**
 * プロバイダ設定を取得する
 */
export function getProviderConfig(provider: SupportedOAuthProvider): OAuthProviderConfig | null {
  return OAUTH_PROVIDERS[provider] || null;
}

/**
 * プロバイダが正しく設定（Client ID / Secret）されているか判定する
 */
export function isProviderConfigured(provider: SupportedOAuthProvider): boolean {
  const config = OAUTH_PROVIDERS[provider];
  if (!config) return false;
  return Boolean(config.clientId && config.clientSecret);
}

/**
 * OAuthコールバックURLを生成する
 */
export function getOAuthCallbackUrl(provider: SupportedOAuthProvider): string {
  return `${getAppBaseUrl()}/api/auth/callback/${provider}`;
}

/**
 * セッションCookieの設定値
 */
export const SESSION_COOKIE_NAME = "gm_auth_session";
export const STATE_COOKIE_NAME = "gm_auth_state";
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30日（秒）

/**
 * サブパス（basePath）を考慮した安全なリダイレクトURLを生成する
 */
export function getRedirectUrl(path: string): URL {
  const baseUrl = getAppBaseUrl();
  const cleanPath = path.replace(/^\/+/, "");
  return new URL(cleanPath, baseUrl + "/");
}
