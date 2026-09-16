import { NextRequest, NextResponse } from "next/server";
import type { SupportedOAuthProvider } from "@/types/auth";
import { getAppBaseUrl } from "@/lib/auth/config";
import { verifyOAuthState, exchangeCodeForUserInfo } from "@/lib/auth/oauth";
import { handleOAuthLoginOrLink } from "@/server/auth/service";
import { createSessionToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{
    provider: string;
  }>;
}

/**
 * GET /api/auth/callback/[provider]
 * OAuth認証コールバックハンドラ
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { provider } = await context.params;
  const searchParams = request.nextUrl.searchParams;

  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  if (error) {
    const message = errorDescription || error;
    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent(`認証が拒否または失敗しました: ${message}`)}`,
        getAppBaseUrl()
      )
    );
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent("認証パラメータが不足しています。")}`, getAppBaseUrl())
    );
  }

  // state パラメータの署名・有効期限検証
  const statePayload = await verifyOAuthState(state);
  if (!statePayload || statePayload.provider !== provider) {
    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent("認証セッションがタイムアウトしたか無効です。再度お試しください。")}`,
        getAppBaseUrl()
      )
    );
  }

  try {
    // 認可コードからアクセストークンおよびユーザー情報を取得
    const userInfo = await exchangeCodeForUserInfo(
      provider as SupportedOAuthProvider,
      code,
      statePayload.codeVerifier
    );

    // ユーザー作成・ログイン・アカウント連携処理
    const authResult = await handleOAuthLoginOrLink(userInfo, statePayload.linkUserId);

    // セッショントークン発行 & Cookie設定
    const sessionToken = await createSessionToken(authResult.user, provider);
    await setSessionCookie(sessionToken);

    const redirectUrl = statePayload.redirectUrl || "/";
    return NextResponse.redirect(new URL(redirectUrl, getAppBaseUrl()));
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "認証コールバック処理中にエラーが発生しました。";
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(message)}`, getAppBaseUrl())
    );
  }
}
