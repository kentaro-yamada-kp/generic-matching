import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getThreadById } from "@/server/db/threads";
import { getParticipantByThreadAndUser, joinThread } from "@/server/db/participants";
import { getMatchByThreadAndUsers } from "@/server/db/matches";
import { evaluateCandidate } from "@/server/db/evaluations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/threads/[id]/matches
 * スレッドへの参加およびスレッド管理者へのAgree評価を送信する（レガシー互換エンドポイント）
 */
export async function POST(request: Request, context: RouteParams) {
  try {
    const { id: threadId } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "認証が必要です。ログインしてください。" },
        { status: 401 }
      );
    }

    const thread = await getThreadById(threadId);
    if (!thread) {
      return NextResponse.json(
        { success: false, error: "指定されたスレッドが見つかりません。" },
        { status: 404 }
      );
    }

    // 1. 自己マッチングの禁止
    if (thread.ownerUserId === user.id) {
      return NextResponse.json(
        { success: false, error: "自身が管理するスレッドには参加・マッチングできません。" },
        { status: 400 }
      );
    }

    // 2. 既にマッチング済みかどうかの確認
    const existingMatch = await getMatchByThreadAndUsers(threadId, thread.ownerUserId, user.id);
    if (existingMatch) {
      return NextResponse.json(
        {
          success: true,
          data: {
            matchId: existingMatch.id,
            roomId: existingMatch.chatRoom?.id,
            matchedAt: existingMatch.matchedAt,
            alreadyMatched: true,
          },
        },
        { status: 200 }
      );
    }

    // 3. 参加情報の存在確認（なければ自動参加登録）
    let myParticipant = await getParticipantByThreadAndUser(threadId, user.id);
    if (!myParticipant) {
      myParticipant = await joinThread(threadId, user.id);
    }

    // スレッド管理者の参加情報を取得
    let managerParticipant = await getParticipantByThreadAndUser(threadId, thread.ownerUserId);
    if (!managerParticipant) {
      managerParticipant = await joinThread(threadId, thread.ownerUserId);
    }

    // 4. 管理者へのAgree評価を送信
    const evalResult = await evaluateCandidate(threadId, user.id, managerParticipant.id, true);

    return NextResponse.json(
      {
        success: true,
        data: {
          matchId: evalResult.matchId,
          roomId: evalResult.chatRoomId,
          isMatched: evalResult.isMatched,
          thread: {
            id: thread.id,
            title: thread.title,
            owner: thread.owner,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("マッチング実行エラー:", error);
    return NextResponse.json(
      { success: false, error: "マッチングの処理に失敗しました。" },
      { status: 500 }
    );
  }
}
