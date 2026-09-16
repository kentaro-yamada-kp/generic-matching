import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getThreadById, updateThread, deleteThread } from "@/server/db/threads";
import { getParticipantByThreadAndUser } from "@/server/db/participants";
import type { UpdateThreadPayload } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/threads/[id]
 * スレッド詳細情報を取得する（管理者のみ参加者一覧を含む。一般参加者・未ログイン者には人数のみ）
 */
export async function GET(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const thread = await getThreadById(id);

    if (!thread) {
      return NextResponse.json(
        { success: false, error: "指定されたスレッドが見つかりません。" },
        { status: 404 }
      );
    }

    const currentUser = await getCurrentUser();
    let myParticipant = null;

    if (currentUser) {
      myParticipant = await getParticipantByThreadAndUser(id, currentUser.id);
    }

    // 匿名性保護: スレッド管理者以外には参加者詳細リストを公開しない（人数 _count.participants のみ公開）
    const isManager = currentUser && thread.ownerUserId === currentUser.id;
    const safeParticipants = isManager ? thread.participants : [];

    return NextResponse.json({
      success: true,
      data: {
        ...thread,
        participants: safeParticipants,
        myParticipant,
      },
    });
  } catch (error) {
    console.error("スレッド詳細取得エラー:", error);
    return NextResponse.json(
      { success: false, error: "スレッド詳細の取得に失敗しました。" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/threads/[id]
 * スレッド情報およびマッチング条件を更新する（スレッド管理者本人のみ）
 */
export async function PUT(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "認証が必要です。ログインしてください。" },
        { status: 401 }
      );
    }

    const thread = await getThreadById(id);
    if (!thread) {
      return NextResponse.json(
        { success: false, error: "指定されたスレッドが見つかりません。" },
        { status: 404 }
      );
    }

    if (thread.ownerUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: "スレッド管理者のみが編集できます。" },
        { status: 403 }
      );
    }

    const body: UpdateThreadPayload = await request.json();

    if (body.title !== undefined && body.title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "スレッドタイトルは必須です。" },
        { status: 400 }
      );
    }

    if (body.title && body.title.length > 100) {
      return NextResponse.json(
        { success: false, error: "スレッドタイトルは100文字以内で入力してください。" },
        { status: 400 }
      );
    }

    if (body.description && body.description.length > 1000) {
      return NextResponse.json(
        { success: false, error: "説明文は1000文字以内で入力してください。" },
        { status: 400 }
      );
    }

    const conditions = body.conditions
      ? body.conditions
          .filter((c) => c.key && c.key.trim().length > 0 && c.value && c.value.trim().length > 0)
          .map((c) => ({
            key: c.key.trim(),
            value: c.value.trim(),
            type: c.type?.trim() || "string",
          }))
      : undefined;

    const updatedThread = await updateThread(id, {
      title: body.title?.trim(),
      description: body.description !== undefined ? body.description.trim() || null : undefined,
      category: body.category?.trim(),
      status: body.status?.trim(),
      conditions,
    });

    return NextResponse.json({
      success: true,
      data: updatedThread,
    });
  } catch (error) {
    console.error("スレッド更新エラー:", error);
    return NextResponse.json(
      { success: false, error: "スレッドの更新に失敗しました。" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/threads/[id]
 * スレッドを削除する（スレッド管理者本人のみ）
 */
export async function DELETE(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "認証が必要です。ログインしてください。" },
        { status: 401 }
      );
    }

    const thread = await getThreadById(id);
    if (!thread) {
      return NextResponse.json(
        { success: false, error: "指定されたスレッドが見つかりません。" },
        { status: 404 }
      );
    }

    if (thread.ownerUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: "スレッド管理者のみが削除できます。" },
        { status: 403 }
      );
    }

    await deleteThread(id);

    return NextResponse.json({
      success: true,
      message: "スレッドを削除しました。",
    });
  } catch (error) {
    console.error("スレッド削除エラー:", error);
    return NextResponse.json(
      { success: false, error: "スレッドの削除に失敗しました。" },
      { status: 500 }
    );
  }
}
