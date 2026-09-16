import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { updateUserOnlineStatus } from "@/server/db/users";
import type { UpdateOnlineStatusPayload } from "@/types";

/**
 * PATCH /api/users/me/online-status
 * 自身のオンライン状態（isOnline: boolean）を即時更新する
 */
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: "認証が必要です。ログインしてください。",
      },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as UpdateOnlineStatusPayload;

    if (typeof body.isOnline !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "isOnline は真偽値 (boolean) で指定してください。",
        },
        { status: 400 }
      );
    }

    const updatedProfile = await updateUserOnlineStatus(session.sub, body.isOnline);

    return NextResponse.json({
      success: true,
      data: {
        userId: updatedProfile.userId,
        isOnline: updatedProfile.isOnline,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "オンライン状態の更新に失敗しました。";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
