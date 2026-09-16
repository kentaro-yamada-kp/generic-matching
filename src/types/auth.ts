import type { User, UserProfile } from "./index";

/**
 * 認証プロバイダの識別子
 */
export type SupportedOAuthProvider = "twitter" | "instagram" | "line" | "discord";

/**
 * プロバイダごとの設定情報
 */
export interface OAuthProviderConfig {
  id: SupportedOAuthProvider;
  name: string;
  clientId?: string;
  clientSecret?: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  usePkce?: boolean;
}

/**
 * 外部プロバイダから取得したユーザー情報
 */
export interface OAuthUserInfo {
  provider: SupportedOAuthProvider | string;
  providerUserId: string;
  displayName: string;
  avatarUrl?: string | null;
  email?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
}

/**
 * JWT セッションペイロード
 */
export interface SessionPayload {
  /** ユーザーID (UUID) */
  sub: string;
  /** 表示名 */
  displayName: string;
  /** アバター画像URL */
  avatarUrl?: string | null;
  /** ログインしたプロバイダ種別 */
  provider?: string;
  /** トークン発行日時（UNIX秒） */
  iat: number;
  /** トークン有効期限（UNIX秒） */
  exp: number;
}

/**
 * クライアント側で保持するセッションユーザー情報
 */
export interface SessionUser {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile | null;
  authProviders?: Array<{
    id: string;
    provider: string;
    providerUserId: string;
    linkedAt: string;
  }>;
}

/**
 * セッションAPIのレスポンス型
 */
export interface SessionApiResponse {
  user: SessionUser | null;
  isAuthenticated: boolean;
}

/**
 * OAuthコールバック処理結果
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  isNewUser?: boolean;
}
