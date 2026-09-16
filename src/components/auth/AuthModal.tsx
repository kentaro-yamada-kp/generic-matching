"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ProviderButton } from "./ProviderButton";
import type { SupportedOAuthProvider } from "@/types/auth";

export interface AuthModalProps {
  redirectUrl?: string;
}

/**
 * ログイン・新規登録用モーダルコンポーネント
 */
export const AuthModal: React.FC<AuthModalProps> = ({ redirectUrl }) => {
  const { isAuthModalOpen, closeAuthModal, login, devLogin, isLoading } = useAuth();
  const [devCustomName, setDevCustomName] = useState("");

  if (!isAuthModalOpen) return null;

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeAuthModal}
      />

      {/* モーダルコンテンツ */}
      <div className="border-border-soft bg-surface relative w-full max-w-md transform overflow-hidden rounded-2xl border p-6 text-left shadow-xl transition-all">
        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={closeAuthModal}
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
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-stone-800">ログイン / 新規登録</h2>
          <p className="mt-2 text-sm text-stone-500">
            お使いのSNS・外部アカウントでかんたんにログインできます。
          </p>
        </div>

        {/* OAuth認証プロバイダボタン一覧 */}
        <div className="space-y-3">
          <ProviderButton
            provider="twitter"
            disabled={isLoading}
            onClick={() => login("twitter", redirectUrl)}
          />
          <ProviderButton
            provider="discord"
            disabled={isLoading}
            onClick={() => login("discord", redirectUrl)}
          />
          <ProviderButton
            provider="line"
            disabled={isLoading}
            onClick={() => login("line", redirectUrl)}
          />
          <ProviderButton
            provider="instagram"
            disabled={isLoading}
            onClick={() => login("instagram", redirectUrl)}
          />
        </div>

        {/* 開発環境用テストログインパネル */}
        {isDev && (
          <div className="border-sage/40 bg-sage/10 mt-6 rounded-xl border border-dashed p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sage text-xs font-bold">🛠 開発用テストログイン (即時)</span>
              <span className="bg-sage/20 text-sage rounded-full px-2 py-0.5 text-[10px] font-semibold">
                Dev Mode
              </span>
            </div>
            <div className="mb-3">
              <input
                type="text"
                placeholder="カスタム表示名（省略可）"
                value={devCustomName}
                onChange={(e) => setDevCustomName(e.target.value)}
                className="border-border-soft focus:border-sage w-full rounded-xl border bg-white px-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["twitter", "discord", "line", "instagram"] as SupportedOAuthProvider[]).map(
                (prov) => (
                  <button
                    key={prov}
                    type="button"
                    disabled={isLoading}
                    onClick={() => devLogin(prov, devCustomName || undefined)}
                    className="bg-sage hover:bg-sage/90 cursor-pointer rounded-xl px-2 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                  >
                    {prov.toUpperCase()} でテスト
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* 注意事項・利用規約フッター */}
        <p className="mt-6 text-center text-xs text-stone-500">
          ログインすることで、当サービスの
          <a href="#" className="text-sage hover:text-sage/80 underline">
            利用規約
          </a>
          および
          <a href="#" className="text-sage hover:text-sage/80 underline">
            プライバシーポリシー
          </a>
          に同意したものとみなされます。
        </p>
      </div>
    </div>
  );
};
