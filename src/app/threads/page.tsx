"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ThreadCard } from "@/components/threads/ThreadCard";
import { ThreadSearchFilter } from "@/components/threads/ThreadSearchFilter";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthContext";
import type { ThreadWithDetails } from "@/types";

/**
 * SCR-03: スレッド一覧・検索画面
 */
export default function ThreadsPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ThreadWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // 検索条件ステート
  const [searchParams, setSearchParams] = useState({
    keyword: "",
    category: "",
    isOnlineOnly: false,
  });

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (searchParams.keyword) query.set("keyword", searchParams.keyword);
      if (searchParams.category) query.set("category", searchParams.category);
      if (searchParams.isOnlineOnly) query.set("isOnlineOnly", "true");

      const res = await fetch(`/api/threads?${query.toString()}`);
      const data = await res.json();

      if (data.success) {
        setThreads(data.data.threads);
        setTotal(data.data.total);
      } else {
        setError(data.error || "スレッド一覧の取得に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      setError("スレッド一覧の通信中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleSearch = (newParams: {
    keyword: string;
    category: string;
    isOnlineOnly: boolean;
  }) => {
    setSearchParams(newParams);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* ページヘッダー */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">募集スレッド一覧</h1>
          <p className="mt-1 text-sm text-stone-500">
            条件に合う仲間を見つけてマッチングしましょう。
          </p>
        </div>

        {user ? (
          <Link href="/threads/new">
            <Button variant="primary">＋ スレッドを作成</Button>
          </Link>
        ) : (
          <Link href="/threads/new">
            <Button variant="outline">＋ スレッドを作成（ログイン要）</Button>
          </Link>
        )}
      </div>

      {/* 検索・絞り込みフィルター */}
      <ThreadSearchFilter
        initialKeyword={searchParams.keyword}
        initialCategory={searchParams.category}
        initialOnlineOnly={searchParams.isOnlineOnly}
        onSearch={handleSearch}
      />

      {/* エラー表示 */}
      {error && (
        <div className="border-terracotta/30 bg-terracotta/10 text-terracotta mb-6 rounded-2xl border p-4 text-sm">
          {error}
        </div>
      )}

      {/* 件数情報 */}
      <div className="mb-4 flex items-center justify-between text-sm text-stone-500">
        <span>全 {total} 件の募集</span>
      </div>

      {/* スレッドカードグリッド */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="border-border-soft h-44 animate-pulse rounded-2xl border bg-stone-100"
            />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="border-border-soft bg-surface rounded-2xl border border-dashed py-16 text-center">
          <p className="mb-2 text-base font-medium text-stone-700">
            該当する募集スレッドが見つかりませんでした
          </p>
          <p className="mb-6 text-sm text-stone-400">
            検索条件を変更するか、新しくスレッドを立ち上げてみましょう。
          </p>
          <Link href="/threads/new">
            <Button variant="primary">最初のスレッドを作成する</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {threads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}
    </div>
  );
}
