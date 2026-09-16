import { cookies } from "next/headers";
import type { SessionPayload, SessionUser } from "@/types/auth";
import { getUserById } from "@/server/db/users";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "./config";
import { verifySessionToken } from "./jwt";

/**
 * サーバー側で現在のセッションペイロードを取得する
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * サーバー側で現在のログインユーザー情報（プロフィール・連携プロバイダ含む）を取得する
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session?.sub) {
    return null;
  }

  const user = await getUserById(session.sub);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    profile: user.profile || null,
    authProviders: (user.authProviders || []).map((ap) => ({
      id: ap.id,
      provider: ap.provider,
      providerUserId: ap.providerUserId,
      linkedAt: ap.linkedAt.toISOString(),
    })),
  };
}

/**
 * 認証が必須の処理で現在のセッションユーザーを取得する（未認証時はエラー送出）
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("認証が必要です。ログインしてください。");
  }
  return user;
}

/**
 * セッションCookieを設定する
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * セッションCookieを削除（サインアウト）する
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
