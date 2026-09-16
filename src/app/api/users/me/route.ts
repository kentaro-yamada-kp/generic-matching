import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getMeDetailed,
  updateUser,
  upsertUserProfile,
  validateDisplayName,
  validateAge,
  validateAvatarUrl,
} from "@/server/db/users";
import type { UpdateProfilePayload } from "@/types";

/**
 * GET /api/users/me
 * 自身のユーザー情報・プロフィール・スレッド・連携プロバイダ一覧を取得
 */
export async function GET() {
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

  const user = await getMeDetailed(session.sub);
  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: "ユーザーが見つかりません。",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: user,
  });
}

/**
 * PUT /api/users/me
 * 自身の表示名・アバター・共通基本属性 (A) の更新
 */
export async function PUT(request: NextRequest) {
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
    const body = (await request.json()) as UpdateProfilePayload;

    // バリデーション
    if (body.displayName !== undefined) {
      const nameValidation = validateDisplayName(body.displayName);
      if (!nameValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: nameValidation.error,
          },
          { status: 400 }
        );
      }
    }

    if (body.avatarUrl !== undefined) {
      const avatarValidation = validateAvatarUrl(body.avatarUrl);
      if (!avatarValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: avatarValidation.error,
          },
          { status: 400 }
        );
      }
    }

    if (body.profile?.age !== undefined) {
      const ageValidation = validateAge(body.profile.age);
      if (!ageValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: ageValidation.error,
          },
          { status: 400 }
        );
      }
    }

    // ユーザー基本情報の更新
    if (body.displayName !== undefined || body.avatarUrl !== undefined) {
      await updateUser(session.sub, {
        displayName: body.displayName ? body.displayName.trim() : undefined,
        avatarUrl:
          body.avatarUrl !== undefined
            ? body.avatarUrl
              ? body.avatarUrl.trim()
              : null
            : undefined,
      });
    }

    // 共通基本プロフィール (A) の更新
    if (body.profile) {
      await upsertUserProfile({
        userId: session.sub,
        age:
          body.profile.age !== undefined
            ? body.profile.age
              ? Number(body.profile.age)
              : null
            : undefined,
        gender: body.profile.gender !== undefined ? body.profile.gender : undefined,
        location: body.profile.location !== undefined ? body.profile.location : undefined,
        purpose: body.profile.purpose !== undefined ? body.profile.purpose : undefined,
        category: body.profile.category !== undefined ? body.profile.category : undefined,
        isOnline: body.profile.isOnline !== undefined ? Boolean(body.profile.isOnline) : undefined,
      });
    }

    const updatedUser = await getMeDetailed(session.sub);

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "ユーザー情報の更新に失敗しました。";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
