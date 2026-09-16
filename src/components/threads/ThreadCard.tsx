import React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { ThreadWithDetails } from "@/types";

interface ThreadCardProps {
  thread: ThreadWithDetails;
}

/**
 * 募集スレッドカードコンポーネント
 */
export const ThreadCard: React.FC<ThreadCardProps> = ({ thread }) => {
  const formattedDate = new Date(thread.createdAt).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const manager =
    (
      thread as unknown as {
        manager?: {
          displayName: string;
          avatarUrl: string | null;
          profile?: { isOnline?: boolean } | null;
        };
      }
    ).manager || thread.owner;
  const isManagerOnline = manager?.profile?.isOnline;
  const participantCount = thread._count?.participants ?? thread.participants?.length ?? 0;
  const matchCount = thread._count?.matches ?? thread.matches?.length ?? 0;

  return (
    <Card className="group border-border-soft bg-surface hover:border-sage/60 transition-all duration-200 hover:shadow-md">
      <Link href={`/threads/${thread.id}`} className="block p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar src={manager?.avatarUrl} name={manager?.displayName || "ユーザー"} size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="group-hover:text-sage text-sm font-semibold text-stone-800 transition-colors">
                  {manager?.displayName || "名無しさん"}
                </span>
                {isManagerOnline && (
                  <span className="border-sage/30 bg-sage/10 text-sage inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
                    <span className="bg-sage h-1.5 w-1.5 animate-pulse rounded-full" />
                    Online
                  </span>
                )}
              </div>
              <span className="text-xs text-stone-400">{formattedDate}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <Badge variant="primary" className="text-xs font-semibold">
              {thread.category || "General"}
            </Badge>
            {participantCount > 0 && (
              <Badge variant="outline" className="text-xs text-stone-700">
                👥 {participantCount}名
              </Badge>
            )}
            {matchCount > 0 && (
              <Badge variant="success" className="text-xs font-medium">
                💖 {matchCount}組成立
              </Badge>
            )}
          </div>
        </div>

        <h3 className="group-hover:text-sage mb-2 line-clamp-1 text-base font-bold text-stone-800 transition-colors sm:text-lg">
          {thread.title}
        </h3>

        {thread.description && (
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-stone-600">
            {thread.description}
          </p>
        )}

        {/* マッチング条件タグ一覧 */}
        {thread.conditions && thread.conditions.length > 0 && (
          <div className="border-border-soft flex flex-wrap gap-1.5 border-t pt-2.5">
            {thread.conditions.map((cond) => (
              <Badge
                key={cond.id || cond.key}
                variant="default"
                className="hover:border-dusty-blue/40 hover:bg-dusty-blue/10 hover:text-dusty-blue text-xs text-stone-700 transition-colors"
              >
                <span className="mr-1 opacity-70">{cond.key}:</span>
                <span className="font-semibold">{cond.value}</span>
              </Badge>
            ))}
          </div>
        )}
      </Link>
    </Card>
  );
};
