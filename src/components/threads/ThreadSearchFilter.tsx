"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface ThreadSearchFilterProps {
  initialKeyword?: string;
  initialCategory?: string;
  initialOnlineOnly?: boolean;
  onSearch: (params: { keyword: string; category: string; isOnlineOnly: boolean }) => void;
}

const CATEGORY_OPTIONS = [
  { value: "", label: "すべてのカテゴリ" },
  { value: "FPS", label: "FPS / TPS" },
  { value: "MOBA", label: "MOBA / バトロワ" },
  { value: "RPG", label: "RPG / 協力プレイ" },
  { value: "格闘", label: "格闘ゲーム" },
  { value: "就活・ビジネス", label: "就活・ビジネス・キャリア" },
  { value: "趣味・交流", label: "趣味・カルチャー・交流" },
  { value: "カフェ・雑談", label: "カフェ・雑談 / 通話" },
  { value: "作業・もくもく", label: "作業・もくもく会" },
  { value: "その他", label: "その他" },
];

/**
 * スレッド検索・絞り込みフィルターコンポーネント
 */
export const ThreadSearchFilter: React.FC<ThreadSearchFilterProps> = ({
  initialKeyword = "",
  initialCategory = "",
  initialOnlineOnly = false,
  onSearch,
}) => {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [category, setCategory] = useState(initialCategory);
  const [isOnlineOnly, setIsOnlineOnly] = useState(initialOnlineOnly);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ keyword, category, isOnlineOnly });
  };

  const handleReset = () => {
    setKeyword("");
    setCategory("");
    setIsOnlineOnly(false);
    onSearch({ keyword: "", category: "", isOnlineOnly: false });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border-soft bg-surface mb-6 space-y-4 rounded-2xl border p-5 shadow-xs"
    >
      <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
        <div className="md:col-span-5">
          <Input
            label="キーワード検索"
            placeholder="タイトル、説明文、ゲーム名など..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <div className="md:col-span-4">
          <Select
            label="カテゴリ"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 pt-2 md:col-span-3 md:pt-0">
          <Button type="submit" variant="primary" className="flex-1">
            検索
          </Button>
          {(keyword || category || isOnlineOnly) && (
            <Button type="button" variant="outline" onClick={handleReset}>
              リセット
            </Button>
          )}
        </div>
      </div>

      <div className="border-border-soft flex items-center gap-2 border-t pt-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-stone-700 select-none">
          <input
            type="checkbox"
            checked={isOnlineOnly}
            onChange={(e) => setIsOnlineOnly(e.target.checked)}
            className="border-border-soft text-sage focus:ring-sage h-4 w-4 rounded"
          />
          <span className="flex items-center gap-1.5">
            <span className="bg-sage h-2 w-2 rounded-full" />
            オンライン中のスレッド管理者のみ表示
          </span>
        </label>
      </div>
    </form>
  );
};
