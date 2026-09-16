import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getParticipantByThreadAndUser, listThreadParticipants } from "@/server/db/participants";
import { buildCandidateRecommendations } from "@/server/matching/engine";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/threads/[id]/candidates
 * スレッド参加者向けに候補者レコメンドリストを取得する
 */
export async function GET(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "認証が必要です。" }, { status: 401 });
    }

    const me = await getParticipantByThreadAndUser(id, user.id);
    if (!me) {
      return NextResponse.json(
        { success: false, error: "スレッドに参加していません。先に参加登録を行ってください。" },
        { status: 403 }
      );
    }

    const allParticipants = await listThreadParticipants(id);
    const candidates = buildCandidateRecommendations(me, allParticipants);

    return NextResponse.json({
      success: true,
      data: candidates,
    });
  } catch (error) {
    console.error("候補者レコメンド取得エラー:", error);
    return NextResponse.json(
      { success: false, error: "候補者の取得に失敗しました。" },
      { status: 500 }
    );
  }
}
