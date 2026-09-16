import { prisma } from "@/lib/prisma";
import type {
  CreateUserInput,
  UpdateUserInput,
  LinkAuthProviderInput,
  UpsertUserProfileInput,
  UserWithDetails,
  PublicUserProfile,
  MyUserProfile,
} from "@/types";

/**
 * ユーザー入力のバリデーション関数群
 */
export function validateDisplayName(name?: string): { valid: boolean; error?: string } {
  if (name === undefined) return { valid: true };
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "表示名は必須です。" };
  }
  if (trimmed.length > 50) {
    return { valid: false, error: "表示名は50文字以内で入力してください。" };
  }
  return { valid: true };
}

export function validateAge(age?: number | null): { valid: boolean; error?: string } {
  if (age === undefined || age === null) return { valid: true };
  if (typeof age !== "number" || isNaN(age) || age < 1 || age > 120) {
    return { valid: false, error: "年齢は1〜120の範囲で数値を入力してください。" };
  }
  return { valid: true };
}

export function validateAvatarUrl(url?: string | null): { valid: boolean; error?: string } {
  if (!url) return { valid: true };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "アバターURLはHTTPまたはHTTPS形式で指定してください。" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "アバターURLの形式が正しくありません。" };
  }
}

/**
 * ユーザーを作成する
 */
export async function createUser(input: CreateUserInput) {
  return await prisma.user.create({
    data: {
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
    },
    include: {
      profile: true,
      authProviders: true,
    },
  });
}

/**
 * 内部ユーザーIDからユーザー詳細情報を取得する
 */
export async function getUserById(id: string): Promise<UserWithDetails | null> {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      authProviders: true,
    },
  });
}

/**
 * 外部認証プロバイダ情報からユーザーを取得する
 */
export async function getUserByAuthProvider(
  provider: string,
  providerUserId: string
): Promise<UserWithDetails | null> {
  const authProvider = await prisma.userAuthProvider.findUnique({
    where: {
      provider_providerUserId: {
        provider,
        providerUserId,
      },
    },
    include: {
      user: {
        include: {
          profile: true,
          authProviders: true,
        },
      },
    },
  });

  return authProvider ? authProvider.user : null;
}

/**
 * ユーザーに外部認証プロバイダを紐付ける
 */
export async function linkAuthProvider(input: LinkAuthProviderInput) {
  return await prisma.userAuthProvider.upsert({
    where: {
      provider_providerUserId: {
        provider: input.provider,
        providerUserId: input.providerUserId,
      },
    },
    update: {
      userId: input.userId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      linkedAt: new Date(),
    },
    create: {
      userId: input.userId,
      provider: input.provider,
      providerUserId: input.providerUserId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
    },
  });
}

/**
 * ユーザーから外部認証プロバイダの連携を解除する（最低1つのプロバイダが残ることを確認）
 */
export async function unlinkAuthProvider(userId: string, provider: string) {
  const providers = await prisma.userAuthProvider.findMany({
    where: { userId },
  });

  if (providers.length <= 1) {
    throw new Error("ログイン不可となるため、唯一の認証連携を解除することはできません。");
  }

  const target = providers.find((p) => p.provider === provider);
  if (!target) {
    throw new Error(`指定されたプロバイダ (${provider}) は連携されていません。`);
  }

  return await prisma.userAuthProvider.delete({
    where: { id: target.id },
  });
}

/**
 * ユーザーが連携している外部認証プロバイダ一覧を取得する
 */
export async function getUserAuthProviders(userId: string) {
  return await prisma.userAuthProvider.findMany({
    where: { userId },
    orderBy: { linkedAt: "asc" },
  });
}

/**
 * ユーザーの基本プロフィール属性を取得する
 */
export async function getUserProfile(userId: string) {
  return await prisma.userProfile.findUnique({
    where: { userId },
  });
}

/**
 * ユーザーの基本プロフィール属性 (A) を登録または更新する
 */
export async function upsertUserProfile(input: UpsertUserProfileInput) {
  return await prisma.userProfile.upsert({
    where: {
      userId: input.userId,
    },
    update: {
      age: input.age,
      gender: input.gender,
      location: input.location,
      purpose: input.purpose,
      category: input.category,
      isOnline: input.isOnline,
    },
    create: {
      userId: input.userId,
      age: input.age,
      gender: input.gender,
      location: input.location,
      purpose: input.purpose,
      category: input.category,
      isOnline: input.isOnline ?? false,
    },
  });
}

/**
 * ユーザーのオンライン状態を更新する
 */
export async function updateUserOnlineStatus(userId: string, isOnline: boolean) {
  return await prisma.userProfile.upsert({
    where: {
      userId,
    },
    update: {
      isOnline,
    },
    create: {
      userId,
      isOnline,
    },
  });
}

/**
 * ユーザー情報を更新する
 */
export async function updateUser(id: string, input: UpdateUserInput) {
  return await prisma.user.update({
    where: { id },
    data: {
      displayName: input.displayName,
      avatarUrl: input.avatarUrl,
    },
    include: {
      profile: true,
      authProviders: true,
    },
  });
}

/**
 * ユーザーを削除する（リレーション先はカスケード削除）
 */
export async function deleteUser(id: string) {
  return await prisma.user.delete({
    where: { id },
  });
}

/**
 * 公開用ユーザープロフィール情報（スレッド一覧・連携SNS含む）を取得する
 */
export async function getUserPublicProfile(id: string): Promise<PublicUserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      authProviders: {
        select: {
          provider: true,
        },
      },
      ownedThreads: {
        include: {
          conditions: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          matchesAsUser1: true,
          matchesAsUser2: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const matchesCount = (user._count?.matchesAsUser1 ?? 0) + (user._count?.matchesAsUser2 ?? 0);

  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    profile: user.profile
      ? {
          age: user.profile.age,
          gender: user.profile.gender,
          location: user.profile.location,
          purpose: user.profile.purpose,
          category: user.profile.category,
          isOnline: user.profile.isOnline,
        }
      : null,
    providers: user.authProviders.map((ap) => ap.provider),
    threads: user.ownedThreads.map((th) => ({
      id: th.id,
      title: th.title,
      description: th.description,
      category: th.category,
      status: th.status,
      createdAt: th.createdAt.toISOString(),
      updatedAt: th.updatedAt.toISOString(),
      conditions: th.conditions.map((c) => ({
        id: c.id,
        key: c.key,
        value: c.value,
        type: c.type,
      })),
    })),
    matchesCount,
  };
}

/**
 * ログインユーザー自身の詳細情報（マイページ表示用）を取得する
 */
export async function getMeDetailed(userId: string): Promise<MyUserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      authProviders: {
        orderBy: {
          linkedAt: "asc",
        },
      },
      ownedThreads: {
        include: {
          conditions: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          matchesAsUser1: true,
          matchesAsUser2: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const matchesCount = (user._count?.matchesAsUser1 ?? 0) + (user._count?.matchesAsUser2 ?? 0);

  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    profile: user.profile
      ? {
          age: user.profile.age,
          gender: user.profile.gender,
          location: user.profile.location,
          purpose: user.profile.purpose,
          category: user.profile.category,
          isOnline: user.profile.isOnline,
        }
      : null,
    providers: user.authProviders.map((ap) => ap.provider),
    authProviders: user.authProviders.map((ap) => ({
      id: ap.id,
      provider: ap.provider,
      providerUserId: ap.providerUserId,
      linkedAt: ap.linkedAt.toISOString(),
    })),
    threads: user.ownedThreads.map((th) => ({
      id: th.id,
      title: th.title,
      description: th.description,
      category: th.category,
      status: th.status,
      createdAt: th.createdAt.toISOString(),
      updatedAt: th.updatedAt.toISOString(),
      conditions: th.conditions.map((c) => ({
        id: c.id,
        key: c.key,
        value: c.value,
        type: c.type,
      })),
    })),
    matchesCount,
  };
}
