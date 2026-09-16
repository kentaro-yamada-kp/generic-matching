import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { handleUnlinkProvider } from "@/server/auth/service";

interface RouteContext {
  params: Promise<{
    provider: string;
  }>;
}

/**
 * DELETE /api/auth/unlink/[provider]
 * 外部認証プロバイダの連携解除エンドポイント
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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

  const { provider } = await context.params;

  try {
    await handleUnlinkProvider(session.sub, provider);

    return NextResponse.json({
      success: true,
      data: {
        message: `${provider} の連携を解除しました。`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "プロバイダ連携の解除に失敗しました。";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
