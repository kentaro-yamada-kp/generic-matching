import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getChatRoomById, sendChatMessage, getChatMessages } from "@/server/db/chat";
import { notifyNewMessage } from "@/server/chat/events";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/rooms/[id]/messages
 * チャットルームのメッセージ履歴を取得する
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "認証が必要です。" }, { status: 401 });
    }

    const { id: roomId } = await context.params;
    const room = await getChatRoomById(roomId);

    if (!room) {
      return NextResponse.json(
        { success: false, error: "チャットルームが見つかりません。" },
        { status: 404 }
      );
    }

    // 参加者チェック（user1 または user2）
    const isParticipant = room.match.user1Id === user.id || room.match.user2Id === user.id;

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: "このチャットルームを閲覧する権限がありません。" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const messages = await getChatMessages(roomId, { limit, offset });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("メッセージ取得エラー:", error);
    return NextResponse.json(
      { success: false, error: "メッセージの取得に失敗しました。" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rooms/[id]/messages
 * チャットメッセージを送信・保存し、リアルタイム通知を発行する
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "認証が必要です。" }, { status: 401 });
    }

    const { id: roomId } = await context.params;
    const room = await getChatRoomById(roomId);

    if (!room) {
      return NextResponse.json(
        { success: false, error: "チャットルームが見つかりません。" },
        { status: 404 }
      );
    }

    // 参加者チェック（user1 または user2）
    const isParticipant = room.match.user1Id === user.id || room.match.user2Id === user.id;

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: "このチャットルームで発言する権限がありません。" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "メッセージを入力してください。" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, error: "メッセージは2000文字以内で入力してください。" },
        { status: 400 }
      );
    }

    // メッセージ保存
    const createdMessage = await sendChatMessage({
      roomId,
      senderUserId: user.id,
      message: message.trim(),
    });

    // リアルタイム通知（SSE等のリスナーへブロードキャスト）
    notifyNewMessage(roomId, createdMessage);

    return NextResponse.json({
      success: true,
      data: createdMessage,
    });
  } catch (error) {
    console.error("メッセージ送信エラー:", error);
    return NextResponse.json(
      { success: false, error: "メッセージの送信に失敗しました。" },
      { status: 500 }
    );
  }
}
