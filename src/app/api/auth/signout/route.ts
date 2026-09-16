import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

/**
 * POST /api/auth/signout
 * ログアウト（セッションCookie破棄）エンドポイント
 */
export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({
      success: true,
      data: {
        message: "ログアウトしました。",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "ログアウト処理中にエラーが発生しました。";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
