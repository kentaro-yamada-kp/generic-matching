"use client";

import React from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { SupportedOAuthProvider } from "@/types/auth";

export interface AccountLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_PROVIDERS: Array<{ id: SupportedOAuthProvider; name: string }> = [
  { id: "twitter", name: "X (旧Twitter)" },
  { id: "discord", name: "Discord" },
  { id: "line", name: "LINE" },
  { id: "instagram", name: "Instagram" },
];

/**
 * 外部SNS連携アカウント管理モーダル
 */
export const AccountLinksModal: React.FC<AccountLinksModalProps> = ({ isOpen, onClose }) => {
  const { user, linkProvider, unlinkProvider, isLoading, devLogin } = useAuth();

  if (!isOpen || !user) return null;

  const linkedProviders = user.authProviders || [];
  const linkedProviderMap = new Map(linkedProviders.map((ap) => [ap.provider, ap]));
  const isOnlyOneLinked = linkedProviders.length <= 1;
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* モーダルコンテンツ */}
      <div className="border-border-soft bg-surface relative w-full max-w-lg transform overflow-hidden rounded-2xl border p-6 text-left shadow-xl transition-all">
        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
          aria-label="閉じる"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* ヘッダー */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-stone-800">SNS・外部アカウント連携管理</h2>
          <p className="mt-1 text-sm text-stone-500">
            複数のSNSアカウントを連携することで、どのアカウントからでも同じプロフィールへログインできます。
          </p>
        </div>

        {/* 連携アカウント一覧 */}
        <div className="divide-border-soft space-y-4 divide-y">
          {ALL_PROVIDERS.map(({ id, name }) => {
            const linked = linkedProviderMap.get(id);

            return (
              <div key={id} className="flex items-center justify-between pt-4 first:pt-0">
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2 text-sm font-semibold text-stone-800">
                      {name}
                      {linked && (
                        <span className="bg-sage/15 border-sage/30 text-sage inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                          連携中
                        </span>
                      )}
                    </span>
                    {linked ? (
                      <span className="text-xs text-stone-500">
                        連携日時: {new Date(linked.linkedAt).toLocaleDateString("ja-JP")}
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">未連携</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {linked ? (
                    <button
                      type="button"
                      disabled={isLoading || isOnlyOneLinked}
                      onClick={() => unlinkProvider(id)}
                      title={
                        isOnlyOneLinked ? "唯一の認証アカウントのため解除できません" : undefined
                      }
                      className="border-terracotta/30 bg-terracotta/10 text-terracotta hover:bg-terracotta/20 cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
                    >
                      解除
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => linkProvider(id)}
                        className="bg-sage hover:bg-sage/90 cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                      >
                        連携する
                      </button>
                      {isDev && (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => devLogin(id, undefined, true)}
                          title="開発用モック連携"
                          className="border-dusty-blue/30 bg-dusty-blue/10 text-dusty-blue hover:bg-dusty-blue/20 cursor-pointer rounded-xl border px-2 py-1.5 text-[11px] font-medium"
                        >
                          Dev連携
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isOnlyOneLinked && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            ⚠️ アカウントの紛失を防ぐため、連携が1つの状態では連携解除できません。
          </div>
        )}
      </div>
    </div>
  );
};
