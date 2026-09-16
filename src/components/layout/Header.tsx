"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserMenu } from "@/components/auth/UserMenu";
import { Button } from "@/components/ui/Button";

export interface HeaderProps {
  /** ヘッダーに表示するタイトル（デフォルト: "なんでもマッチング"） */
  title?: string;
}

/**
 * 共通ヘッダーコンポーネント（認証状態連動）
 */
export const Header: React.FC<HeaderProps> = ({ title = "なんでもマッチング" }) => {
  const { isAuthenticated, isLoading, openAuthModal } = useAuth();

  return (
    <header className="border-border-soft bg-surface/85 sticky top-0 z-40 border-b shadow-2xs backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* ロゴ / タイトル */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="group flex items-center space-x-2.5">
            <div className="from-sage via-sage/90 to-dusty-blue flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr text-sm font-extrabold text-white shadow-xs transition-transform group-hover:scale-105">
              NM
            </div>
            <span className="text-lg font-extrabold tracking-tight text-stone-800">{title}</span>
          </Link>

          {/* ナビゲーションリンク */}
          <nav className="hidden items-center space-x-6 md:flex">
            <Link
              href="/threads"
              className="hover:text-sage flex items-center gap-1.5 text-sm font-semibold text-stone-600 transition-colors"
            >
              <span>💬</span>
              <span>スレッド一覧</span>
            </Link>
            {isAuthenticated && (
              <Link
                href="/matches"
                className="hover:text-terracotta flex items-center gap-1.5 text-sm font-semibold text-stone-600 transition-colors"
              >
                <span>💖</span>
                <span>マッチング成立</span>
              </Link>
            )}
            <Link
              href="/threads/new"
              className="border-sage/30 bg-sage/10 text-sage hover:bg-sage/20 flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors"
            >
              <span>＋</span>
              <span>スレッドを作成</span>
            </Link>
          </nav>
        </div>

        {/* 認証・ユーザーアクションエリア */}
        <div className="flex items-center space-x-3">
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-xl bg-stone-200" />
          ) : isAuthenticated ? (
            <UserMenu />
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={openAuthModal}
              className="px-4 py-2 font-bold"
            >
              ログイン / 新規登録
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
