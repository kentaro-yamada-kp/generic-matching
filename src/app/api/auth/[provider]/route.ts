import { NextRequest, NextResponse } from "next/server";
import type { SupportedOAuthProvider } from "@/types/auth";
import { isProviderConfigured, getRedirectUrl } from "@/lib/auth/config";
import { buildAuthorizationUrl, generateMockOAuthUserInfo } from "@/lib/auth/oauth";
import { getSession } from "@/lib/auth/session";
import { handleOAuthLoginOrLink } from "@/server/auth/service";
import { createSessionToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";

const VALID_PROVIDERS: SupportedOAuthProvider[] = ["twitter", "instagram", "line", "discord"];

interface RouteContext {
  params: Promise<{
    provider: string;
  }>;
}

/**
 * GET /api/auth/[provider]
 * OAuth認証認可リクエストの開始エンドポイント
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { provider } = await context.params;

  if (!VALID_PROVIDERS.includes(provider as SupportedOAuthProvider)) {
    return NextResponse.json(
      {
        success: false,
        error: `未対応の認証プロバイダです: ${provider}`,
      },
      { status: 400 }
    );
  }

  const oauthProvider = provider as SupportedOAuthProvider;
  const searchParams = request.nextUrl.searchParams;
  const redirectUrl = searchParams.get("redirectUrl") || "/";
  const isLinking = searchParams.get("link") === "true";
  const forceMock = searchParams.get("mock") === "true";

  let linkUserId: string | undefined;
  if (isLinking) {
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(
        getRedirectUrl(`/?error=${encodeURIComponent("連携するにはログインが必要です。")}`)
      );
    }
    linkUserId = session.sub;
  }

  // プロバイダ設定が存在しない、または開発環境でモック指定の場合は即時モック認証へリダイレクト
  if (
    !isProviderConfigured(oauthProvider) ||
    (process.env.NODE_ENV === "development" && forceMock)
  ) {
    try {
      const mockUser = generateMockOAuthUserInfo(oauthProvider);
      const authResult = await handleOAuthLoginOrLink(mockUser, linkUserId);
      const token = await createSessionToken(authResult.user, oauthProvider);
      await setSessionCookie(token);

      return NextResponse.redirect(getRedirectUrl(redirectUrl));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "認証処理中にエラーが発生しました。";
      return NextResponse.redirect(
        getRedirectUrl(`/?error=${encodeURIComponent(errorMessage)}`)
      );
    }
  }

  try {
    const { url } = await buildAuthorizationUrl(oauthProvider, {
      redirectUrl,
      linkUserId,
    });

    return NextResponse.redirect(url);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "認可URLの生成に失敗しました。";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
