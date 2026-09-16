import { NextRequest, NextResponse } from "next/server";
import type { SupportedOAuthProvider } from "@/types/auth";
import { generateMockOAuthUserInfo } from "@/lib/auth/oauth";
import { handleOAuthLoginOrLink } from "@/server/auth/service";
import { createSessionToken } from "@/lib/auth/jwt";
import { setSessionCookie, getSession } from "@/lib/auth/session";

/**
 * POST /api/auth/dev-login
 * 開発・ローカル環境専用の簡易テストログイン / アカウント連携API
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        error: "開発環境専用のエンドポイントです。",
      },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      provider?: SupportedOAuthProvider;
      displayName?: string;
      link?: boolean;
    };

    const provider: SupportedOAuthProvider = body.provider || "twitter";
    let linkUserId: string | undefined;

    if (body.link) {
      const session = await getSession();
      if (!session) {
        return NextResponse.json(
          {
            success: false,
            error: "連携するにはログインが必要です。",
          },
          { status: 401 }
        );
      }
      linkUserId = session.sub;
    }

    const mockInfo = generateMockOAuthUserInfo(provider, body.displayName);
    const authResult = await handleOAuthLoginOrLink(mockInfo, linkUserId);

    const sessionToken = await createSessionToken(authResult.user, provider);
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      data: {
        user: authResult.user,
        isNewUser: authResult.isNewUser,
        isLinked: authResult.isLinked,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "モックログイン処理中にエラーが発生しました。";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
