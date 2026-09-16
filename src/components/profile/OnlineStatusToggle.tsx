"use client";

import React, { useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";

export interface OnlineStatusToggleProps {
  initialStatus: boolean;
  onStatusChange?: (isOnline: boolean) => void;
  className?: string;
}

/**
 * オンライン状態（isOnline）切り替えコンポーネント
 */
export const OnlineStatusToggle: React.FC<OnlineStatusToggleProps> = ({
  initialStatus,
  onStatusChange,
  className = "",
}) => {
  const [isOnline, setIsOnline] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (newStatus: boolean) => {
    setIsLoading(true);
    setError(null);

    // 楽観的更新
    setIsOnline(newStatus);

    try {
      const res = await fetch("/api/users/me/online-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: newStatus }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "オンライン状態の更新に失敗しました。");
      }

      onStatusChange?.(newStatus);
    } catch (err: unknown) {
      // 失敗時は状態をロールバック
      setIsOnline(!newStatus);
      const message = err instanceof Error ? err.message : "オンライン状態の更新に失敗しました。";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`border-border-soft rounded-2xl border bg-stone-50/70 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-stone-800">マッチング受付状態</span>
            <Badge variant={isOnline ? "success" : "default"} size="sm">
              <span
                className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isOnline ? "bg-sage" : "bg-stone-400"}`}
              />
              {isOnline ? "オンライン（募集中）" : "オフライン（停止中）"}
            </Badge>
          </div>
          <p className="text-xs text-stone-500">
            オンラインにすると、スレッド作成者や他のユーザーとのマッチング対象になります。
          </p>
        </div>
        <Switch checked={isOnline} onChange={handleToggle} disabled={isLoading} />
      </div>
      {error && <p className="text-terracotta mt-2 text-xs font-medium">{error}</p>}
    </div>
  );
};
