import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { listThreads, createThread, countThreads } from "@/server/db/threads";
import { joinThread } from "@/server/db/participants";
import type { CreateThreadPayload } from "@/types";

/**
 * GET /api/threads
 * スレッド一覧を取得する（検索・絞り込み・ページネーション対応）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || undefined;
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const isOnlineOnly = searchParams.get("isOnlineOnly") === "true";
    const ownerUserId = searchParams.get("ownerUserId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const [threads, total] = await Promise.all([
      listThreads({
        keyword,
        category,
        status,
        isOnlineOnly,
        ownerUserId,
        limit,
        offset,
      }),
      countThreads({
        keyword,
        category,
        status,
        isOnlineOnly,
        ownerUserId,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        threads,
        total,
        limit,
        offset,
        hasMore: offset + threads.length < total,
      },
    });
  } catch (error) {
    console.error("スレッド一覧取得エラー:", error);
    return NextResponse.json(
      { success: false, error: "スレッド一覧の取得に失敗しました。" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/threads
 * 新規スレッドを作成する
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "認証が必要です。ログインしてください。" },
        { status: 401 }
      );
    }

    const body: CreateThreadPayload = await request.json();

    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "スレッドタイトルは必須です。" },
        { status: 400 }
      );
    }

    if (body.title.length > 100) {
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

    // マッチング条件データのバリデーション・整形
    const conditions = (body.conditions || [])
      .filter((c) => c.key && c.key.trim().length > 0 && c.value && c.value.trim().length > 0)
      .map((c) => ({
        key: c.key.trim(),
        value: c.value.trim(),
        type: c.type?.trim() || "string",
      }));

    const thread = await createThread({
      ownerUserId: user.id,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      category: body.category?.trim() || "general",
      status: "open",
      conditions,
    });

    // スレッド管理者自身を初期参加者として登録
    await joinThread(thread.id, user.id, {
      customBio: body.description?.slice(0, 200) || "スレッド管理者です。よろしくお願いします！",
    });

    return NextResponse.json(
      {
        success: true,
        data: thread,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("スレッド作成エラー:", error);
    return NextResponse.json(
      { success: false, error: "スレッドの作成に失敗しました。" },
      { status: 500 }
    );
  }
}
