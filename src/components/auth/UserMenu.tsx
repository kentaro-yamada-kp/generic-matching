"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { AccountLinksModal } from "./AccountLinksModal";

/**
 * ログイン中ユーザー向けヘッダーメニュー
 */
export const UserMenu: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニュー外クリック時に閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) return null;

  const linkedProviders = user.authProviders || [];
  const isOnline = user.profile?.isOnline ?? true;

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* アバター & ユーザー名トリガーボタン */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="focus:ring-sage/50 flex items-center gap-2.5 rounded-full p-1 transition-all hover:ring-2 hover:ring-stone-300 focus:ring-2 focus:outline-none"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Avatar
            src={user.avatarUrl}
            name={user.displayName}
            size="sm"
            isOnline={isOnline}
            showStatus={true}
          />

          <span className="hidden max-w-[120px] truncate text-sm font-medium text-stone-700 sm:inline-block">
            {user.displayName}
          </span>

          <svg
            className={`h-4 w-4 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* ドロップダウンメニュー */}
        {isOpen && (
          <div className="divide-border-soft border-border-soft bg-surface absolute right-0 z-50 mt-2 w-64 origin-top-right divide-y rounded-2xl border p-2 shadow-md">
            {/* ユーザーヘッダー */}
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-stone-800">{user.displayName}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {linkedProviders.map((ap) => (
                  <span
                    key={ap.id}
                    className="border-border-soft inline-flex items-center rounded-full border bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600"
                  >
                    {ap.provider.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* ナビゲーションリンク一覧 */}
            <div className="py-1">
              <Link
                href="/matches"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                <svg
                  className="text-terracotta h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                成立したマッチング一覧
              </Link>

              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                <svg
                  className="h-4 w-4 text-stone-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                マイページ / プロフィール管理
              </Link>

              <Link
                href={`/users/${user.id}`}
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                <svg
                  className="h-4 w-4 text-stone-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                公開プロフィールの確認
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsLinksModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                <svg
                  className="text-dusty-blue h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                SNSアカウント連携ダイアログ
              </button>
            </div>

            {/* ログアウト */}
            <div className="pt-1">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="text-terracotta hover:bg-terracotta/10 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors"
              >
                <svg
                  className="text-terracotta h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                ログアウト
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 連携管理モーダル */}
      <AccountLinksModal isOpen={isLinksModalOpen} onClose={() => setIsLinksModalOpen(false)} />
    </>
  );
};
