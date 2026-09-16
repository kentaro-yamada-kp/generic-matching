import type { OAuthUserInfo } from "@/types/auth";
import type { UserWithDetails } from "@/types";
import {
  createUser,
  getUserById,
  getUserByAuthProvider,
  linkAuthProvider,
  unlinkAuthProvider,
  upsertUserProfile,
} from "@/server/db/users";

/**
 * OAuth認証ログインまたは既存アカウントへの紐付け処理結果
 */
export interface OAuthAuthResult {
  success: boolean;
  user: UserWithDetails;
  isNewUser: boolean;
  isLinked: boolean;
}

/**
 * 外部プロバイダからのユーザー情報に基づき、ユーザーのログイン・新規作成・アカウント連携を実行する
 */
export async function handleOAuthLoginOrLink(
  userInfo: OAuthUserInfo,
  linkUserId?: string
): Promise<OAuthAuthResult> {
  // 1. 既存ログインユーザーへの追加連携（AUTH-02）の場合
  if (linkUserId) {
    const existingUser = await getUserById(linkUserId);
    if (!existingUser) {
      throw new Error("連携対象のユーザーが見つかりません。");
    }

    // 既に他のユーザーに同じプロバイダIDが紐付いていないか確認
    const existingOwner = await getUserByAuthProvider(userInfo.provider, userInfo.providerUserId);
    if (existingOwner && existingOwner.id !== linkUserId) {
      throw new Error("このSNSアカウントは既に別のユーザーに連携されています。");
    }

    await linkAuthProvider({
      userId: linkUserId,
      provider: userInfo.provider,
      providerUserId: userInfo.providerUserId,
      accessToken: userInfo.accessToken,
      refreshToken: userInfo.refreshToken,
    });

    const updatedUser = await getUserById(linkUserId);
    if (!updatedUser) {
      throw new Error("ユーザー情報の再取得に失敗しました。");
    }

    return {
      success: true,
      user: updatedUser,
      isNewUser: false,
      isLinked: true,
    };
  }

  // 2. 通常のOAuthログイン（認証）の場合
  const existingUser = await getUserByAuthProvider(userInfo.provider, userInfo.providerUserId);

  if (existingUser) {
    // 既存ユーザーが存在する場合: トークン情報を更新
    await linkAuthProvider({
      userId: existingUser.id,
      provider: userInfo.provider,
      providerUserId: userInfo.providerUserId,
      accessToken: userInfo.accessToken,
      refreshToken: userInfo.refreshToken,
    });

    const updatedUser = await getUserById(existingUser.id);
    return {
      success: true,
      user: updatedUser || existingUser,
      isNewUser: false,
      isLinked: false,
    };
  }

  // 3. 新規ユーザー作成（OAuth初回ログイン）の場合
  const newUser = await createUser({
    displayName: userInfo.displayName,
    avatarUrl: userInfo.avatarUrl,
  });

  // プロバイダ連携レコードを作成
  await linkAuthProvider({
    userId: newUser.id,
    provider: userInfo.provider,
    providerUserId: userInfo.providerUserId,
    accessToken: userInfo.accessToken,
    refreshToken: userInfo.refreshToken,
  });

  // 初期プロフィールレコードを作成（デフォルトでオンライン状態に設定）
  await upsertUserProfile({
    userId: newUser.id,
    isOnline: true,
  });

  const fullUser = await getUserById(newUser.id);
  if (!fullUser) {
    throw new Error("新規ユーザーの作成に失敗しました。");
  }

  return {
    success: true,
    user: fullUser,
    isNewUser: true,
    isLinked: false,
  };
}

/**
 * 外部プロバイダ連携を解除する
 */
export async function handleUnlinkProvider(userId: string, provider: string) {
  return await unlinkAuthProvider(userId, provider);
}
