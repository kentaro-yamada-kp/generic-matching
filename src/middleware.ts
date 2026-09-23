import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/auth/config";
import { verifyJwt } from "./lib/auth/jwt";
import type { SessionPayload } from "./types/auth";

/**
 * 認証が必要な保護対象ルートパス一覧
 */
const PROTECTED_PAGE_PREFIXES = ["/profile", "/threads/new", "/rooms", "/matches"];
const PROTECTED_API_PREFIXES = ["/api/users/me"];

/**
 * Next.js 認証ミドルウェア
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isProtectedApi = PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let sessionPayload: SessionPayload | null = null;

  if (token) {
    sessionPayload = await verifyJwt<SessionPayload>(token);
  }

  // 認証済みの場合はリクエストヘッダーにユーザー情報を付与
  if (sessionPayload) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", sessionPayload.sub);
    requestHeaders.set("x-user-name", encodeURIComponent(sessionPayload.displayName));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 未認証で保護対象APIへのアクセスの場合は401を返却
  if (isProtectedApi) {
    return NextResponse.json(
      {
        success: false,
        error: "認証が必要です。ログインしてください。",
      },
      { status: 401 }
    );
  }

  // 未認証で保護対象ページへのアクセスの場合はログインモーダル表示フラグ付きでトップへリダイレクト
  if (isProtectedPage) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const loginUrl = new URL(`${basePath}/`, request.url);
    loginUrl.searchParams.set("login", "true");
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * ミドルウェア適用マッチャー設定
 */
export const config = {
  matcher: [
    /*
     * 次のパスを除くすべてのリクエストにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - public フォルダ内の静的ファイル
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
