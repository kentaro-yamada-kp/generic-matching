import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { ThreadSummary } from "@/types";

export interface UserThreadsListProps {
  threads: ThreadSummary[];
  isOwner?: boolean;
  className?: string;
}

/**
 * ユーザー作成スレッド一覧コンポーネント
 */
export const UserThreadsList: React.FC<UserThreadsListProps> = ({
  threads,
  isOwner = false,
  className = "",
}) => {
  if (threads.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-stone-600">
            {isOwner
              ? "作成した募集スレッドはありません。"
              : "このユーザーが作成した募集スレッドはありません。"}
          </p>
          {isOwner && (
            <div className="mt-4">
              <Link
                href="/threads/new"
                className="text-sage inline-flex items-center text-xs font-semibold hover:underline"
              >
                ＋ 新しい募集スレッドを作成する
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {threads.map((thread) => {
        const formattedDate = new Date(thread.createdAt).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return (
          <Card key={thread.id} className="hover:border-sage/60 transition-colors">
            <CardHeader className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center sm:p-5">
              <div>
                <Link href={`/threads/${thread.id}`}>
                  <CardTitle className="hover:text-sage text-base transition-colors sm:text-lg">
                    {thread.title}
                  </CardTitle>
                </Link>
                <span className="mt-1 block text-xs text-stone-400">作成日: {formattedDate}</span>
              </div>
              <div>
                <Link
                  href={`/threads/${thread.id}`}
                  className="text-sage inline-flex items-center text-xs font-medium hover:underline"
                >
                  スレッドを見る →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 sm:p-5">
              {thread.description && (
                <p className="line-clamp-2 text-sm text-stone-600">{thread.description}</p>
              )}

              {/* カスタム条件 (B) タグ一覧 */}
              {thread.conditions && thread.conditions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="mr-1 text-xs text-stone-400">条件 (B):</span>
                  {thread.conditions.map((cond) => (
                    <Badge key={cond.id} variant="default" size="sm">
                      <span className="mr-1 font-semibold text-stone-700">{cond.key}:</span>
                      {cond.value}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
