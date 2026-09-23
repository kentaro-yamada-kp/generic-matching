"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { getApiUrl } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { OnlineStatusToggle } from "@/components/profile/OnlineStatusToggle";
import { UserThreadsList } from "@/components/profile/UserThreadsList";
import type { MyUserProfile } from "@/types";
import type { SupportedOAuthProvider } from "@/types/auth";

const ALL_PROVIDERS: Array<{ id: SupportedOAuthProvider; name: string; icon: string }> = [
  { id: "twitter", name: "X (Twitter)", icon: "🐦" },
  { id: "discord", name: "Discord", icon: "💬" },
  { id: "line", name: "LINE", icon: "🟢" },
  { id: "instagram", name: "Instagram", icon: "📸" },
];

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading, openAuthModal, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<MyUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "accounts" | "threads">("profile");

  // SNS連携解除処理
  const [unlinkLoading, setUnlinkLoading] = useState<string | null>(null);
  const [unlinkMessage, setUnlinkMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl("/api/users/me"));
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "ユーザー情報の取得に失敗しました。");
      }
      setProfileData(data.data as MyUserProfile);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "プロフィールの取得中にエラーが発生しました。";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchProfile();
      } else {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, authLoading]);

  // SNS連携解除ハンドラー
  const handleUnlink = async (provider: string) => {
    if (!confirm(`本当に ${provider} の連携を解除しますか？`)) {
      return;
    }

    setUnlinkLoading(provider);
    setUnlinkMessage(null);

    try {
      const res = await fetch(getApiUrl("/api/auth/unlink"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "連携の解除に失敗しました。");
      }

      setUnlinkMessage({
        type: "success",
        text: `${provider} の連携を解除しました。`,
      });

      // ユーザー情報再取得
      await fetchProfile();
      await refreshUser();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "連携解除に失敗しました。";
      setUnlinkMessage({ type: "error", text: message });
    } finally {
      setUnlinkLoading(null);
    }
  };

  // 認証ロード中
  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="flex min-h-[350px] flex-col items-center justify-center space-y-4">
          <div className="border-sage h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-sm text-stone-500">プロフィール情報を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  // 未ログイン時
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <Card className="p-8">
          <div className="bg-sage/10 text-sage mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <CardTitle className="mb-2 text-xl text-stone-800">ログインが必要です</CardTitle>
          <CardDescription className="mb-6 text-stone-500">
            マイページやプロフィール編集を利用するには、アカウントへのログインを行ってください。
          </CardDescription>
          <Button variant="primary" size="lg" onClick={openAuthModal}>
            ログイン / 新規登録
          </Button>
        </Card>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="border-terracotta/30 bg-terracotta/10 space-y-4 rounded-2xl border p-6 text-center">
          <p className="text-terracotta font-medium">
            {error || "ユーザー情報の取得に失敗しました。"}
          </p>
          <Button variant="outline" size="sm" onClick={fetchProfile}>
            再読み込み
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      {/* ページヘッダー */}
      <div className="border-border-soft flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-800 sm:text-3xl">
            マイページ / プロフィール管理
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            基本情報やマッチング条件、SNS連携アカウントの管理が行えます。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/users/${profileData.id}`}>
            <Button variant="outline" size="sm">
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              公開プロフィールを見る
            </Button>
          </Link>
        </div>
      </div>

      {/* オンライン状態切り替えトグル */}
      <OnlineStatusToggle
        initialStatus={profileData.profile?.isOnline ?? false}
        onStatusChange={(isOnline) => {
          setProfileData((prev) =>
            prev
              ? {
                  ...prev,
                  profile: prev.profile
                    ? { ...prev.profile, isOnline }
                    : {
                        age: null,
                        gender: null,
                        location: null,
                        purpose: null,
                        category: null,
                        isOnline,
                      },
                }
              : null
          );
        }}
      />

      {/* タブナビゲーション */}
      <div className="border-border-soft border-b">
        <nav className="flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("profile")}
            className={`cursor-pointer border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "border-sage text-sage font-bold"
                : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700"
            } `}
          >
            👤 プロフィール設定
          </button>

          <button
            onClick={() => setActiveTab("accounts")}
            className={`cursor-pointer border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "accounts"
                ? "border-sage text-sage font-bold"
                : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700"
            } `}
          >
            🔗 連携SNSアカウント ({profileData.authProviders.length})
          </button>

          <button
            onClick={() => setActiveTab("threads")}
            className={`cursor-pointer border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "threads"
                ? "border-sage text-sage font-bold"
                : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700"
            } `}
          >
            📋 作成した募集スレッド ({profileData.threads.length})
          </button>
        </nav>
      </div>

      {/* タブコンテンツ */}
      {activeTab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>プロフィール情報・基本条件 (A) の編集</CardTitle>
            <CardDescription>
              マッチング時に判定される基本プロフィール属性を設定・更新できます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileEditForm
              initialData={profileData}
              onSuccess={(updated) => {
                setProfileData(updated);
                refreshUser();
              }}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === "accounts" && (
        <Card>
          <CardHeader>
            <CardTitle>連携中SNSアカウントの管理</CardTitle>
            <CardDescription>
              外部OAuthアカウントを連携・解除できます。最低1つのアカウント連携が必要です。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {unlinkMessage && (
              <div
                className={`flex items-center gap-2 rounded-xl border p-4 text-sm ${
                  unlinkMessage.type === "success"
                    ? "border-sage/30 bg-sage/10 text-sage"
                    : "border-terracotta/30 bg-terracotta/10 text-terracotta"
                }`}
              >
                {unlinkMessage.text}
              </div>
            )}

            <div className="space-y-3">
              {ALL_PROVIDERS.map((provider) => {
                const linked = profileData.authProviders.find(
                  (ap) => ap.provider.toLowerCase() === provider.id.toLowerCase()
                );

                return (
                  <div
                    key={provider.id}
                    className="border-border-soft flex flex-col justify-between gap-3 rounded-2xl border bg-stone-50/70 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{provider.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-800">{provider.name}</span>
                          {linked && (
                            <Badge variant="success" size="sm">
                              連携済み
                            </Badge>
                          )}
                        </div>
                        {linked && (
                          <p className="mt-0.5 text-xs text-stone-400">
                            連携日時: {new Date(linked.linkedAt).toLocaleDateString("ja-JP")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      {linked ? (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={
                            profileData.authProviders.length <= 1 || unlinkLoading === provider.id
                          }
                          isLoading={unlinkLoading === provider.id}
                          onClick={() => handleUnlink(provider.id)}
                          title={
                            profileData.authProviders.length <= 1
                              ? "唯一の連携アカウントのため解除できません"
                              : "連携を解除する"
                          }
                        >
                          連携解除
                        </Button>
                      ) : (
                        <a href={`/api/auth/signin/${provider.id}`}>
                          <Button variant="outline" size="sm">
                            連携する
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "threads" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-800">作成した募集スレッド</h2>
            <Link href="/threads/new">
              <Button variant="primary" size="sm">
                ＋ 新規スレッド作成
              </Button>
            </Link>
          </div>
          <UserThreadsList threads={profileData.threads} isOwner={true} />
        </div>
      )}
    </div>
  );
}
