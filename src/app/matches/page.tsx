"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/AuthContext";
import type { MatchWithDetails } from "@/types";
import { getApiUrl } from "@/lib/utils";

/**
 * SCR-09: マッチング一覧画面
 */
export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(getApiUrl("/api/matches"));
      const data = await res.json();

      if (data.success && data.data?.matches) {
        setMatches(data.data.matches);
      } else {
        setError(data.error || "マッチング一覧の取得に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      setError("マッチング一覧の取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user, fetchMatches]);

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="border-sage inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <Card className="p-8 shadow-sm">
          <h2 className="mb-3 text-xl font-bold text-stone-800">ログインが必要です</h2>
          <p className="mb-6 text-sm text-stone-500">
            成立したマッチング一覧およびチャットルームを確認するにはログインしてください。
          </p>
          <Link href="/">
            <Button variant="primary">トップページへ戻る</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">成立マッチング一覧</h1>
          <p className="mt-1 text-sm text-stone-500">
            相互Agreeで成立したマッチング相手と専用チャットで交流しましょう。
          </p>
        </div>
        <Link href="/threads">
          <Button variant="outline" size="sm">
            募集スレッドを探す
          </Button>
        </Link>
      </div>

      {error && (
        <div className="border-terracotta/30 bg-terracotta/10 text-terracotta mb-6 rounded-2xl border p-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="border-border-soft h-28 animate-pulse rounded-2xl border bg-stone-100"
            />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="border-border-soft bg-surface rounded-2xl border border-dashed py-16 text-center">
          <p className="mb-2 text-base font-medium text-stone-700">
            成立したマッチングはまだありません
          </p>
          <p className="mb-6 text-sm text-stone-400">
            募集スレッドに参加し、気になる候補者にAgree（いいね）を送りましょう！
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/threads">
              <Button variant="primary">スレッド一覧を見る</Button>
            </Link>
            <Link href="/threads/new">
              <Button variant="outline">スレッドを作成する</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            // 自分以外の相手ユーザーを判定（user1 または user2）
            const partner = match.user1Id === user.id ? match.user2 : match.user1;
            const formattedDate = new Date(match.matchedAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Card
                key={match.id}
                className="hover:border-sage/60 shadow-xs transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={partner?.avatarUrl}
                      name={partner?.displayName || "ユーザー"}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-800">
                          {partner?.displayName || "名無しさん"}
                        </span>
                        {partner?.profile?.isOnline && (
                          <Badge variant="success" className="text-[11px]">
                            Online
                          </Badge>
                        )}
                      </div>

                      <p className="mt-1 text-sm font-medium text-stone-600">
                        スレッド: {match.thread?.title}
                      </p>

                      <span className="mt-1 block text-xs text-stone-400">
                        成立日時: {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link href={`/threads/${match.threadId}`}>
                      <Button variant="ghost" size="sm">
                        スレッド確認
                      </Button>
                    </Link>
                    {match.chatRoom?.id ? (
                      <Link href={`/rooms/${match.chatRoom.id}`}>
                        <Button variant="primary" size="sm">
                          💬 チャットを開く
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        チャット準備中
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
