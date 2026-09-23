"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PublicProfileCard } from "@/components/profile/PublicProfileCard";
import { UserThreadsList } from "@/components/profile/UserThreadsList";
import type { PublicUserProfile } from "@/types";
import { getApiUrl } from "@/lib/utils";

export default function UserPublicProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchPublicProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(getApiUrl(`/api/users/${userId}`));
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "ユーザー情報の取得に失敗しました。");
        }

        setProfile(data.data as PublicUserProfile);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "ユーザー情報の取得に失敗しました。";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicProfile();
  }, [userId]);

  const isOwner = currentUser?.id === userId;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="flex min-h-[300px] flex-col items-center justify-center space-y-4">
          <div className="border-sage h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-sm text-stone-500">ユーザープロフィールを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <Card className="p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 text-stone-400">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-stone-800">ユーザーが見つかりませんでした</h2>
          <p className="mb-6 text-sm text-stone-500">
            指定されたユーザーは退会したか、URLが正しくない可能性があります。
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/threads">
              <Button variant="outline" size="sm">
                スレッド一覧へ
              </Button>
            </Link>
            <Link href="/">
              <Button variant="primary" size="sm">
                トップページへ
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      {/* ページ上部アクション */}
      <div className="flex items-center justify-between">
        <Link
          href="/threads"
          className="inline-flex items-center text-xs font-semibold text-stone-500 transition-colors hover:text-stone-700"
        >
          ← 募集スレッド一覧へ戻る
        </Link>

        {isOwner && (
          <Link href="/profile">
            <Button variant="primary" size="sm">
              <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              プロフィールを編集（マイページ）
            </Button>
          </Link>
        )}
      </div>

      {/* 公開プロフィールカード */}
      <PublicProfileCard user={profile} />

      {/* 作成した募集スレッド一覧 */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-800">
            {profile.displayName} が作成した募集スレッド ({profile.threads.length})
          </h2>
        </div>

        <UserThreadsList threads={profile.threads} isOwner={isOwner} />
      </div>
    </div>
  );
}
