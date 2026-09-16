import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/auth/config";

interface RouteContext {
  params: Promise<{
    provider: string;
  }>;
}

/**
 * GET /api/auth/signin/[provider]
 * NextAuth互換のサインインURLエイリアス。
 * /api/auth/[provider] へリダイレクトして認証フローを開始する。
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { provider } = await context.params;
  const url = new URL(`/api/auth/${provider}`, getAppBaseUrl());

  // クエリパラメータ（redirectUrl, link, mock等）を引き継ぐ
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  return NextResponse.redirect(url, { status: 307 });
}
