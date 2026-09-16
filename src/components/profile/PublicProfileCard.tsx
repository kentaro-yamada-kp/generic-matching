import React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { GENDER_OPTIONS, CATEGORY_OPTIONS, PURPOSE_OPTIONS } from "@/lib/constants";
import type { PublicUserProfile } from "@/types";

export interface PublicProfileCardProps {
  user: PublicUserProfile;
  className?: string;
}

/**
 * ユーザー公開プロフィールカードコンポーネント（SCR-08 公開プロフィール表示用）
 */
export const PublicProfileCard: React.FC<PublicProfileCardProps> = ({ user, className = "" }) => {
  const profile = user.profile;

  // ラベル変換ヘルパー
  const getGenderLabel = (val?: string | null) => {
    if (!val) return "未設定";
    return GENDER_OPTIONS.find((g) => g.value === val)?.label || val;
  };

  const getCategoryLabel = (val?: string | null) => {
    if (!val) return "未設定";
    return CATEGORY_OPTIONS.find((c) => c.value === val)?.label || val;
  };

  const getPurposeLabel = (val?: string | null) => {
    if (!val) return "未設定";
    return PURPOSE_OPTIONS.find((p) => p.value === val)?.label || val;
  };

  // 登録日のフォーマット
  const formattedJoinDate = new Date(user.createdAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className={className}>
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Avatar
            src={user.avatarUrl}
            name={user.displayName}
            size="2xl"
            isOnline={profile?.isOnline}
            showStatus={true}
            className="ring-sage/20 ring-4"
          />

          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">
                  {user.displayName}
                </h1>
                <p className="mt-0.5 text-xs text-stone-400">登録日: {formattedJoinDate}</p>
              </div>

              <div>
                <Badge
                  variant={profile?.isOnline ? "success" : "default"}
                  size="md"
                  className="font-medium"
                >
                  <span
                    className={`mr-1.5 h-2 w-2 rounded-full ${
                      profile?.isOnline ? "bg-sage" : "bg-stone-400"
                    }`}
                  />
                  {profile?.isOnline ? "オンライン（募集中）" : "オフライン"}
                </Badge>
              </div>
            </div>

            {/* 連携SNSバッジ */}
            {user.providers && user.providers.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 sm:justify-start">
                <span className="mr-1 text-xs text-stone-500">連携アカウント:</span>
                {user.providers.map((p) => (
                  <Badge key={p} variant="outline" size="sm" className="capitalize">
                    {p}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 共通の基本属性 (A) 一覧 */}
        <div className="border-border-soft mt-8 grid grid-cols-2 gap-4 border-t pt-6 sm:grid-cols-4">
          <div className="border-border-soft/60 rounded-xl border bg-stone-50 p-3 text-center">
            <span className="mb-1 block text-xs text-stone-500">年齢</span>
            <span className="text-sm font-semibold text-stone-800">
              {profile?.age ? `${profile.age} 歳` : "未設定"}
            </span>
          </div>

          <div className="border-border-soft/60 rounded-xl border bg-stone-50 p-3 text-center">
            <span className="mb-1 block text-xs text-stone-500">性別</span>
            <span className="text-sm font-semibold text-stone-800">
              {getGenderLabel(profile?.gender)}
            </span>
          </div>

          <div className="border-border-soft/60 rounded-xl border bg-stone-50 p-3 text-center">
            <span className="mb-1 block text-xs text-stone-500">居住地域</span>
            <span className="text-sm font-semibold text-stone-800">
              {profile?.location || "未設定"}
            </span>
          </div>

          <div className="border-border-soft/60 rounded-xl border bg-stone-50 p-3 text-center">
            <span className="mb-1 block text-xs text-stone-500">利用目的</span>
            <span
              className="block truncate text-sm font-semibold text-stone-800"
              title={getPurposeLabel(profile?.purpose)}
            >
              {getPurposeLabel(profile?.purpose)}
            </span>
          </div>
        </div>

        {profile?.category && (
          <div className="border-dusty-blue/30 bg-dusty-blue/10 mt-4 rounded-xl border p-4">
            <span className="text-dusty-blue mb-1 block text-xs font-semibold tracking-wider uppercase">
              メイン興味・カテゴリ
            </span>
            <span className="text-sm font-medium text-stone-800">
              {getCategoryLabel(profile.category)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
