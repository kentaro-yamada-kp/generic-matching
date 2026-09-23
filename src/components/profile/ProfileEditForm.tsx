"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import {
  PREFECTURES,
  GENDER_OPTIONS,
  CATEGORY_OPTIONS,
  PURPOSE_OPTIONS,
  DEFAULT_AVATARS,
} from "@/lib/constants";
import type { MyUserProfile, UpdateProfilePayload } from "@/types";
import { getApiUrl } from "@/lib/utils";

export interface ProfileEditFormProps {
  initialData: MyUserProfile;
  onSuccess?: (updatedUser: MyUserProfile) => void;
  className?: string;
}

/**
 * プロフィール編集フォームコンポーネント（基本情報・共通属性Aの入力）
 */
export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  initialData,
  onSuccess,
  className = "",
}) => {
  const [displayName, setDisplayName] = useState(initialData.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl || "");
  const [age, setAge] = useState<string>(
    initialData.profile?.age !== null && initialData.profile?.age !== undefined
      ? String(initialData.profile.age)
      : ""
  );
  const [gender, setGender] = useState(initialData.profile?.gender || "");
  const [location, setLocation] = useState(initialData.profile?.location || "");
  const [purpose, setPurpose] = useState(initialData.profile?.purpose || "");
  const [category, setCategory] = useState(initialData.profile?.category || "");

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // フォームバリデーション
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = "表示名を入力してください。";
    } else if (displayName.trim().length > 50) {
      newErrors.displayName = "表示名は50文字以内で入力してください。";
    }

    if (age.trim() !== "") {
      const parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        newErrors.age = "年齢は1〜120の数値を入力してください。";
      }
    }

    if (avatarUrl.trim() !== "") {
      try {
        const parsed = new URL(avatarUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          newErrors.avatarUrl = "有効なHTTP/HTTPS URLを入力してください。";
        }
      } catch {
        newErrors.avatarUrl = "URLの形式が正しくありません。";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload: UpdateProfilePayload = {
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || null,
        profile: {
          age: age.trim() ? parseInt(age.trim(), 10) : null,
          gender: gender || null,
          location: location || null,
          purpose: purpose || null,
          category: category || null,
        },
      };

      const res = await fetch(getApiUrl("/api/users/me"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "プロフィールの更新に失敗しました。");
      }

      setSuccessMessage("プロフィールを保存しました。");
      onSuccess?.(data.data as MyUserProfile);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "プロフィールの保存中にエラーが発生しました。";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const prefectureOptions = PREFECTURES.map((p) => ({ value: p, label: p }));

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {successMessage && (
        <div className="border-sage/30 bg-sage/10 text-sage flex items-center gap-2 rounded-xl border p-4 text-sm">
          <svg
            className="text-sage h-5 w-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="border-terracotta/30 bg-terracotta/10 text-terracotta flex items-center gap-2 rounded-xl border p-4 text-sm">
          <svg
            className="text-terracotta h-5 w-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* アバター設定セクション */}
      <div className="border-border-soft space-y-4 rounded-2xl border bg-stone-50/70 p-5">
        <label className="block text-sm font-semibold text-stone-800">
          プロフィール画像（アバター）
        </label>
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <Avatar
            src={avatarUrl}
            name={displayName || "ユーザー"}
            size="xl"
            className="shadow-xs ring-4 ring-white"
          />
          <div className="w-full space-y-3">
            <div>
              <p className="mb-2 text-xs text-stone-500">プリセットから選択:</p>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_AVATARS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setAvatarUrl(preset.url)}
                    className={`cursor-pointer rounded-xl border px-2.5 py-1 text-xs transition-all ${
                      avatarUrl === preset.url
                        ? "border-sage bg-sage/15 text-sage font-medium"
                        : "border-border-soft bg-white text-stone-700 hover:bg-stone-50"
                    } `}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <Input
              placeholder="https://example.com/my-avatar.png (カスタムURL)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              error={errors.avatarUrl}
              helperText="画像URLを直接指定することもできます。"
            />
          </div>
        </div>
      </div>

      {/* 基本情報 */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold tracking-wider text-stone-500 uppercase">基本情報</h4>
        <Input
          label="表示名"
          required
          placeholder="例: たろう / Taro"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={errors.displayName}
          helperText="マッチング相手やスレッドに表示される名前です。"
        />
      </div>

      {/* 共通の基本条件 (A) */}
      <div className="space-y-4 pt-2">
        <div>
          <h4 className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
            共通の基本属性 (A)
          </h4>
          <p className="mt-0.5 text-xs text-stone-500">マッチングの基本条件判定に使用されます。</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="年齢"
            type="number"
            min="1"
            max="120"
            placeholder="例: 24"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            error={errors.age}
            helperText="未設定でも可"
          />

          <Select
            label="性別"
            placeholder="未設定"
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="居住地域"
            placeholder="未設定"
            options={prefectureOptions}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <Select
            label="主な利用目的"
            placeholder="未設定"
            options={PURPOSE_OPTIONS}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>

        <Select
          label="メイン興味・カテゴリ"
          placeholder="未設定"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          helperText="よく遊ぶゲームのジャンルや活動分野を選択してください。"
        />
      </div>

      {/* 送信ボタン */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full min-w-[160px] sm:w-auto"
        >
          変更を保存する
        </Button>
      </div>
    </form>
  );
};
