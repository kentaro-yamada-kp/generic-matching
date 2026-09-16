import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getChatRoomById } from "@/server/db/chat";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/rooms/[id]
 * チャットルーム詳細情報（マッチング情報、スレッド情報、相手ユーザー情報）を取得する
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "認証が必要です。" }, { status: 401 });
    }

    const { id: roomId } = await context.params;
    const room = await getChatRoomById(roomId);

    if (!room) {
      return NextResponse.json(
        { success: false, error: "指定されたチャットルームが見つかりません。" },
        { status: 404 }
      );
    }

    // ユーザーがチャットルームの参加者（user1 または user2）であるか確認
    const isUser1 = room.match.user1Id === user.id;
    const isUser2 = room.match.user2Id === user.id;

    if (!isUser1 && !isUser2) {
      return NextResponse.json(
        { success: false, error: "このチャットルームへのアクセス権限がありません。" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("チャットルーム取得エラー:", error);
    return NextResponse.json(
      { success: false, error: "チャットルームの取得に失敗しました。" },
      { status: 500 }
    );
  }
}
