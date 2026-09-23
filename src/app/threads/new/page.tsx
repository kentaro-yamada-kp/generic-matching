"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ConditionBuilder, ConditionField } from "@/components/threads/ConditionBuilder";
import { useAuth } from "@/lib/auth/AuthContext";
import { getApiUrl } from "@/lib/utils";

/**
 * SCR-05: スレッド新規作成画面
 */
export default function NewThreadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("FPS");
  const [conditions, setConditions] = useState<ConditionField[]>([
    { id: "1", key: "game_title", value: "", type: "string" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("スレッドタイトルを入力してください。");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const validConditions = conditions
        .filter((c) => c.key.trim() && c.value.trim())
        .map((c) => ({
          key: c.key.trim(),
          value: c.value.trim(),
          type: c.type.trim(),
        }));

      const res = await fetch(getApiUrl("/api/threads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category: category.trim() || "general",
          conditions: validConditions,
        }),
      });

      const data = await res.json();

      if (data.success && data.data?.id) {
        router.push(`/threads/${data.data.id}`);
      } else {
        setError(data.error || "スレッドの作成に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      setError("スレッド作成処理中にエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="border-sage inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <Card className="p-8 shadow-sm">
          <h2 className="mb-3 text-xl font-bold text-stone-800">ログインが必要です</h2>
          <p className="mb-6 text-sm text-stone-500">
            スレッドを作成するにはログインしてください。
          </p>
          <Link href="/">
            <Button variant="primary">トップページへ戻る</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">新規スレッドの作成</h1>
          <p className="mt-1 text-sm text-stone-600">
            テーマ・募集カテゴリ・マッチング条件を設定してスレッドを作成します。
          </p>
        </div>
        <Link href="/threads">
          <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900">
            ← 一覧へ戻る
          </Button>
        </Link>
      </div>

      <Card className="bg-surface shadow-sm">
        <CardHeader className="border-border-soft border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-stone-800">
            <span>💬</span> スレッド基本情報の入力
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="border-terracotta/30 bg-terracotta/10 text-terracotta flex items-center gap-2 rounded-xl border p-4 text-sm">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <Input
                label="スレッドタイトル"
                placeholder="例: 【VALORANT】ダイヤ帯ランク回しメンバー募集！"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
              />
              <p className="mt-1 text-right text-xs text-stone-400">{title.length} / 100文字</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">募集カテゴリ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-border-soft focus:border-sage focus:ring-sage/20 w-full rounded-xl border bg-white px-3 py-2 text-sm text-stone-800 shadow-xs transition-all focus:ring-2 focus:outline-none"
              >
                <option value="FPS">FPS / TPS</option>
                <option value="MOBA">MOBA / バトロワ</option>
                <option value="RPG">RPG / 協力プレイ</option>
                <option value="格闘">格闘ゲーム</option>
                <option value="就活・ビジネス">就活・ビジネス・キャリア</option>
                <option value="趣味・交流">趣味・カルチャー・交流</option>
                <option value="カフェ・雑談">カフェ・雑談</option>
                <option value="作業・もくもく">作業・もくもく会</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <div>
              <Textarea
                label="スレッド説明文（任意）"
                placeholder="募集の目的、活動時間帯、雰囲気、求める人物像などを自由に記載してください。"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="mt-1 text-right text-xs text-stone-400">
                {description.length} / 1000文字
              </p>
            </div>

            {/* スレッドマッチング条件設定 */}
            <div className="border-border-soft border-t pt-4">
              <label className="mb-1 block text-sm font-semibold text-stone-800">
                スレッドマッチング条件設定
              </label>
              <p className="mb-4 text-xs text-stone-500">
                対象のゲームタイトルやプラットフォーム、スキル区分など、スレッド参加者に求めるマッチング条件を自由に設定できます。
              </p>
              <ConditionBuilder conditions={conditions} onChange={setConditions} />
            </div>

            <div className="border-border-soft flex items-center justify-end gap-3 border-t pt-5">
              <Link href="/threads">
                <Button type="button" variant="outline" disabled={submitting}>
                  キャンセル
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="px-6 font-bold"
              >
                {submitting ? "作成中..." : "スレッドを作成する"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
