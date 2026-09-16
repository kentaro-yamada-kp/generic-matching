import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * GET /api/auth/session
 * 現在のログインユーザー情報および認証状態を取得する
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({
      success: true,
      data: {
        user,
        isAuthenticated: Boolean(user),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "セッション取得エラー";
    return NextResponse.json(
      {
        success: false,
        error: message,
        data: {
          user: null,
          isAuthenticated: false,
        },
      },
      { status: 500 }
    );
  }
}
