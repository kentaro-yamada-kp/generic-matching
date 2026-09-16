import { NextResponse } from "next/server";

/**
 * サービスヘルスチェック用 API ルートハンドラー
 *
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "generic-matching",
  });
}
