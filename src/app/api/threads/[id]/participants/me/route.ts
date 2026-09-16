import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getParticipantByThreadAndUser,
  updateParticipant,
  leaveThread,
} from "@/server/db/participants";
import type { JoinThreadPayload } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/threads/[id]/participants/me
 * ログインユーザーの参加詳細を取得する
 */
export async function GET(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "認証が必要です。" }, { status: 401 });
    }

    const participant = await getParticipantByThreadAndUser(id, user.id);
    if (!participant) {
      return NextResponse.json(
        { success: false, error: "スレッドに参加していません。" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: participant,
    });
  } catch (error) {
    console.error("参加情報取得エラー:", error);
    return NextResponse.json(
      { success: false, error: "参加情報の取得に失敗しました。" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/threads/[id]/participants/me
 * 参加情報（自己紹介・マッチング条件属性）を更新する
 */
export async function PUT(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "認証が必要です。" }, { status: 401 });
    }

    const participant = await getParticipantByThreadAndUser(id, user.id);
    if (!participant) {
      return NextResponse.json(
        { success: false, error: "スレッドに参加していません。" },
        { status: 404 }
      );
    }

    const body: JoinThreadPayload = await request.json();

    const attributes = body.attributes
      ? body.attributes
          .filter((a) => a.key && a.key.trim().length > 0 && a.value && a.value.trim().length > 0)
          .map((a) => ({
            key: a.key.trim(),
            value: a.value.trim(),
            type: a.type?.trim() || "string",
          }))
      : undefined;

    const updated = await updateParticipant(
      participant.id,
      body.customBio !== undefined ? body.customBio.trim() || null : undefined,
      attributes
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("参加情報更新エラー:", error);
    return NextResponse.json(
      { success: false, error: "参加情報の更新に失敗しました。" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/threads/[id]/participants/me
 * スレッドから退出する
 */
export async function DELETE(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "認証が必要です。" }, { status: 401 });
    }

    await leaveThread(id, user.id);

    return NextResponse.json({
      success: true,
      message: "スレッドから退出しました。",
    });
  } catch (error) {
    console.error("スレッド退出エラー:", error);
    return NextResponse.json(
      { success: false, error: "スレッドからの退出に失敗しました。" },
      { status: 500 }
    );
  }
}
