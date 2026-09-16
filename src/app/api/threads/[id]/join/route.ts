import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getThreadById } from "@/server/db/threads";
import { joinThread } from "@/server/db/participants";
import type { JoinThreadPayload } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/threads/[id]/join
 * スレッドに参加する（専用プロフィール・マッチング属性設定）
 */
export async function POST(request: Request, context: RouteParams) {
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

    if (thread.status === "closed") {
      return NextResponse.json(
        { success: false, error: "このスレッドは既に終了しています。" },
        { status: 400 }
      );
    }

    const body: JoinThreadPayload = await request.json().catch(() => ({}));

    const attributes = (body.attributes || [])
      .filter((a) => a.key && a.key.trim().length > 0 && a.value && a.value.trim().length > 0)
      .map((a) => ({
        key: a.key.trim(),
        value: a.value.trim(),
        type: a.type?.trim() || "string",
      }));

    const participant = await joinThread(id, user.id, {
      customBio: body.customBio?.trim() || undefined,
      attributes,
    });

    return NextResponse.json(
      {
        success: true,
        data: participant,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("スレッド参加エラー:", error);
    return NextResponse.json(
      { success: false, error: "スレッドへの参加に失敗しました。" },
      { status: 500 }
    );
  }
}
