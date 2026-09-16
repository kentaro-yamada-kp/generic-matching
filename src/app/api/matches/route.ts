import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserMatches } from "@/server/db/matches";

/**
 * GET /api/matches
 * ログイン中ユーザーのマッチング一覧を取得する
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "認証が必要です。ログインしてください。" },
        { status: 401 }
      );
    }

    const matches = await getUserMatches(user.id);

    return NextResponse.json({
      success: true,
      data: {
        matches,
      },
    });
  } catch (error) {
    console.error("マッチング一覧取得エラー:", error);
    return NextResponse.json(
      { success: false, error: "マッチング一覧の取得に失敗しました。" },
      { status: 500 }
    );
  }
}
