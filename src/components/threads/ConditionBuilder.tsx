"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export interface ConditionField {
  id: string;
  key: string;
  value: string;
  type: string;
}

interface ConditionBuilderProps {
  conditions: ConditionField[];
  onChange: (conditions: ConditionField[]) => void;
}

const CONDITION_TYPE_OPTIONS = [
  { value: "string", label: "文字列 / テキスト" },
  { value: "enum", label: "タグ / 選択肢（カンマ区切り可）" },
  { value: "number", label: "数値 / 範囲（例: 20-30, >=18）" },
  { value: "boolean", label: "真偽値（true / false）" },
];

const PRESET_CONDITIONS = [
  { key: "game_title", label: "+ ゲーム名", defaultType: "string" },
  { key: "rank", label: "+ ランク帯", defaultType: "enum" },
  { key: "voice_chat", label: "+ VC環境", defaultType: "string" },
  { key: "play_time", label: "+ プレイ時間帯", defaultType: "string" },
  { key: "age", label: "+ 対象年齢（基本条件A）", defaultType: "number" },
  { key: "location", label: "+ 対象地域（基本条件A）", defaultType: "string" },
];

/**
 * スレッドカスタム条件（B）の動的追加・編集ビルダー
 */
export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ conditions, onChange }) => {
  const handleAddCondition = (presetKey?: string, presetType?: string) => {
    const newCondition: ConditionField = {
      id: Math.random().toString(36).substring(2, 9),
      key: presetKey || "",
      value: "",
      type: presetType || "string",
    };
    onChange([...conditions, newCondition]);
  };

  const handleUpdateCondition = (
    index: number,
    field: keyof Omit<ConditionField, "id">,
    val: string
  ) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const handleRemoveCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-stone-800">
            マッチング条件（カスタム条件 B / 基本属性 A）
          </h4>
          <p className="mt-0.5 text-xs text-stone-500">
            参加希望者のプロフィールまたはカスタム属性と照合する条件を設定します。
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => handleAddCondition()}>
          ＋ 条件を追加
        </Button>
      </div>

      {/* プリセットボタン */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-stone-400">クイック追加:</span>
        {PRESET_CONDITIONS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => handleAddCondition(preset.key, preset.defaultType)}
            className="border-border-soft cursor-pointer rounded-xl border bg-stone-100 px-2.5 py-1 text-xs text-stone-700 transition hover:bg-stone-200"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* 条件行一覧 */}
      {conditions.length === 0 ? (
        <div className="border-border-soft rounded-2xl border border-dashed bg-stone-50/50 py-6 text-center text-sm text-stone-400">
          条件が設定されていません（条件なしの場合、誰でもマッチング申請できます）。
        </div>
      ) : (
        <div className="space-y-3">
          {conditions.map((cond, index) => (
            <div
              key={cond.id || index}
              className="border-border-soft flex flex-col items-end gap-3 rounded-2xl border bg-stone-50/80 p-3.5 md:flex-row md:items-center"
            >
              <div className="w-full md:w-1/3">
                <Input
                  label="条件キー（属性名）"
                  placeholder="例: game_title, rank, age"
                  value={cond.key}
                  onChange={(e) => handleUpdateCondition(index, "key", e.target.value)}
                  required
                />
              </div>

              <div className="w-full md:w-1/3">
                <Input
                  label="条件値（期待値）"
                  placeholder="例: Apex Legends, Diamond, 20-30"
                  value={cond.value}
                  onChange={(e) => handleUpdateCondition(index, "value", e.target.value)}
                  required
                />
              </div>

              <div className="w-full md:w-1/4">
                <Select
                  label="判定タイプ"
                  options={CONDITION_TYPE_OPTIONS}
                  value={cond.type}
                  onChange={(e) => handleUpdateCondition(index, "type", e.target.value)}
                />
              </div>

              <div className="pt-2 md:pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCondition(index)}
                  className="text-terracotta hover:bg-terracotta/10 hover:text-terracotta"
                >
                  削除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
