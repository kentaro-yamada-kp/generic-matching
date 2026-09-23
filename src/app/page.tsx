"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/lib/auth/AuthContext";
import { ProviderButton } from "@/components/auth/ProviderButton";
import { AccountLinksModal } from "@/components/auth/AccountLinksModal";
import { ThreadCard } from "@/components/threads/ThreadCard";
import type { ThreadWithDetails } from "@/types";
import { getApiUrl } from "@/lib/utils";

export default function Home() {
  const { user, isAuthenticated, isLoading, openAuthModal, devLogin } = useAuth();
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [recentThreads, setRecentThreads] = useState<ThreadWithDetails[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);

  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    const fetchRecentThreads = async () => {
      try {
        setThreadsLoading(true);
        const res = await fetch(getApiUrl("/api/threads?limit=4"));
        const data = await res.json();
        if (data.success && data.data?.threads) {
          setRecentThreads(data.data.threads);
        }
      } catch (err) {
        console.error("最新スレッド取得エラー:", err);
      } finally {
        setThreadsLoading(false);
      }
    };

    fetchRecentThreads();
  }, []);

  return (
    <div className="flex flex-col">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl space-y-12">
          {/* メインヒーローセクション */}
          <div className="space-y-4">
            <div className="border-sage/30 bg-sage/10 text-sage inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-bold">
              <span>✨ 自由で柔軟なマッチング条件でつながる</span>
            </div>

            <h1 className="text-4xl leading-tight font-black tracking-tight text-stone-800 sm:text-5xl">
              なんでもマッチング
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
              複数のSNS・外部アカウントと連携し、
              目的やスキル、自由なマッチング条件で最適な相手とマッチング。
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Link href="/threads">
                <Button variant="primary" size="lg" className="px-6 font-bold">
                  🔍 募集スレッドを探す
                </Button>
              </Link>
              <Link href="/threads/new">
                <Button variant="outline" size="lg" className="font-semibold">
                  ＋ スレッドを作成する
                </Button>
              </Link>
            </div>
          </div>

          {/* 認証状態に応じたダッシュボード / アクションエリア */}
          {isLoading ? (
            <div className="border-border-soft bg-surface mx-auto max-w-md animate-pulse rounded-2xl border p-6 shadow-xs">
              <div className="mx-auto mb-4 h-6 w-32 rounded-xl bg-stone-200" />
              <div className="mx-auto h-4 w-48 rounded-xl bg-stone-200" />
            </div>
          ) : isAuthenticated && user ? (
            /* ログイン済みユーザー向けダッシュボード */
            <div className="border-border-soft bg-surface mx-auto max-w-xl space-y-5 rounded-2xl border p-6 text-left shadow-sm">
              <div className="border-border-soft flex items-center gap-4 border-b pb-4">
                <Avatar
                  src={user.avatarUrl}
                  name={user.displayName}
                  size="lg"
                  isOnline={user.profile?.isOnline}
                  showStatus={true}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-stone-800">{user.displayName}</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">
                    ID: <code className="text-[11px]">{user.id}</code>
                  </p>
                  {user.profile && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {user.profile.location && (
                        <span className="border-border-soft rounded-full border bg-stone-100 px-2.5 py-0.5 text-[11px] text-stone-700">
                          📍 {user.profile.location}
                        </span>
                      )}
                      {user.profile.category && (
                        <span className="bg-dusty-blue/15 border-dusty-blue/30 text-dusty-blue rounded-full border px-2.5 py-0.5 text-[11px]">
                          🎮 {user.profile.category}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 連携済みSNSアカウント一覧 */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                    連携中のSNSアカウント
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsLinksModalOpen(true)}
                    className="text-sage cursor-pointer text-xs font-medium hover:underline"
                  >
                    連携管理 ＋
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(user.authProviders || []).map((ap) => (
                    <span
                      key={ap.id}
                      className="border-border-soft inline-flex items-center gap-1.5 rounded-full border bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700"
                    >
                      <span className="bg-sage h-1.5 w-1.5 rounded-full" />
                      {ap.provider.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              {/* クイックアクション */}
              <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-3">
                <Link href="/threads" className="w-full">
                  <Button variant="primary" className="w-full text-xs sm:text-sm">
                    📜 スレッド一覧
                  </Button>
                </Link>
                <Link href="/matches" className="w-full">
                  <Button variant="outline" className="w-full text-xs sm:text-sm">
                    🤝 マッチング一覧
                  </Button>
                </Link>
                <Link href="/profile" className="w-full">
                  <Button variant="outline" className="w-full text-xs sm:text-sm">
                    👤 マイページ
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* 未ログイン時: ログインCTA & SNSログインボタン群 */
            <div className="space-y-6">
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="primary" size="lg" onClick={openAuthModal}>
                  ログイン / 新規登録
                </Button>
              </div>

              {/* プロバイダ一覧バナー */}
              <div className="mx-auto max-w-md space-y-2 pt-4">
                <p className="text-xs font-medium text-stone-500">
                  以下の外部OAuthプロバイダに対応しています
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <ProviderButton provider="twitter" onClick={openAuthModal} />
                  <ProviderButton provider="discord" onClick={openAuthModal} />
                  <ProviderButton provider="line" onClick={openAuthModal} />
                  <ProviderButton provider="instagram" onClick={openAuthModal} />
                </div>
              </div>

              {/* 開発モード時の簡易ログイン */}
              {isDev && (
                <div className="border-sage/40 bg-sage/10 mx-auto max-w-md rounded-2xl border border-dashed p-4">
                  <p className="text-sage mb-2 text-xs font-semibold">
                    🛠 開発環境用 1クリックログイン
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => devLogin("twitter")}
                      className="cursor-pointer rounded-xl bg-black py-1.5 text-[11px] font-medium text-white hover:opacity-90"
                    >
                      X (Twitter)
                    </button>
                    <button
                      type="button"
                      onClick={() => devLogin("discord")}
                      className="cursor-pointer rounded-xl bg-[#5865F2] py-1.5 text-[11px] font-medium text-white hover:opacity-90"
                    >
                      Discord
                    </button>
                    <button
                      type="button"
                      onClick={() => devLogin("line")}
                      className="cursor-pointer rounded-xl bg-[#06C755] py-1.5 text-[11px] font-medium text-white hover:opacity-90"
                    >
                      LINE
                    </button>
                    <button
                      type="button"
                      onClick={() => devLogin("instagram")}
                      className="cursor-pointer rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] py-1.5 text-[11px] font-medium text-white hover:opacity-90"
                    >
                      Instagram
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 新着募集スレッドプレビューセクション */}
          <div className="border-border-soft border-t pt-8 text-left">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-stone-800">🔥 新着の募集スレッド</h3>
                <p className="text-xs text-stone-500">今すぐ参加できる最新の募集をチェック</p>
              </div>
              <Link href="/threads" className="text-sage text-sm font-semibold hover:underline">
                すべて見る →
              </Link>
            </div>

            {threadsLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="border-border-soft h-36 animate-pulse rounded-2xl border bg-stone-100"
                  />
                ))}
              </div>
            ) : recentThreads.length === 0 ? (
              <div className="border-border-soft bg-surface rounded-2xl border border-dashed py-12 text-center">
                <p className="mb-4 text-sm text-stone-500">まだ募集スレッドがありません。</p>
                <Link href="/threads/new">
                  <Button variant="primary" size="sm">
                    最初のスレッドを作成する
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {recentThreads.map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 連携管理モーダル */}
      <AccountLinksModal isOpen={isLinksModalOpen} onClose={() => setIsLinksModalOpen(false)} />

      <footer className="border-border-soft border-t py-6 text-center text-sm text-stone-500">
        &copy; {new Date().getFullYear()} なんでもマッチング. All rights reserved.
      </footer>
    </div>
  );
}
