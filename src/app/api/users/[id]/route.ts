import { NextRequest, NextResponse } from "next/server";
import { getUserPublicProfile } from "@/server/db/users";

/**
 * GET /api/users/[id]
 * 指定されたユーザーの公開プロフィール・作成スレッド一覧・連携SNS情報を取得する
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "ユーザーIDが指定されていません。",
        },
        { status: 400 }
      );
    }

    const publicProfile = await getUserPublicProfile(id);

    if (!publicProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "指定されたユーザーは見つかりませんでした。",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: publicProfile,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "ユーザー情報の取得に失敗しました。";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
