import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { evaluateCandidate } from "@/server/db/evaluations";
import type { CreateEvaluationPayload } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/threads/[id]/evaluations
 * 候補者に対して Agree / Disagree の判定・リアクションを送信する
 * 相互Agree成立時は自動的に Match と ChatRoom が生成される
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

    const body: CreateEvaluationPayload = await request.json();

    if (!body.toParticipantId) {
      return NextResponse.json(
        { success: false, error: "対象参加者ID（toParticipantId）は必須です。" },
        { status: 400 }
      );
    }

    if (typeof body.isAgree !== "boolean") {
      return NextResponse.json(
        { success: false, error: "評価値（isAgree: true/false）は必須です。" },
        { status: 400 }
      );
    }

    const result = await evaluateCandidate(id, user.id, body.toParticipantId, body.isAgree);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("マッチング評価送信エラー:", error);
    const errorMessage = error instanceof Error ? error.message : "評価の送信に失敗しました。";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
