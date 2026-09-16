"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ConditionBuilder, ConditionField } from "@/components/threads/ConditionBuilder";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * SCR-06: スレッド編集画面
 */
export default function EditThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;
  const { loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("FPS");
  const [status, setStatus] = useState("open");
  const [conditions, setConditions] = useState<ConditionField[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThread = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/threads/${threadId}`);
      const data = await res.json();

      if (data.success && data.data) {
        setTitle(data.data.title || "");
        setDescription(data.data.description || "");
        setCategory(data.data.category || "FPS");
        setStatus(data.data.status || "open");
        setConditions(
          (data.data.conditions || []).map(
            (c: { id: string; key: string; value: string; type: string }) => ({
              id: c.id,
              key: c.key,
              value: c.value,
              type: c.type || "string",
            })
          )
        );
      } else {
        setError(data.error || "スレッド情報の取得に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      setError("スレッド情報の取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

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

      const res = await fetch(`/api/threads/${threadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category: category.trim() || "general",
          status,
          conditions: validConditions,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/threads/${threadId}`);
      } else {
        setError(data.error || "スレッドの更新に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      setError("スレッド更新処理中にエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="border-sage inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">スレッド情報の編集</h1>
          <p className="mt-1 text-sm text-stone-600">
            スレッド情報やマッチング条件、受付ステータスを変更できます。
          </p>
        </div>
        <Link href={`/threads/${threadId}`}>
          <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900">
            ← スレッドへ戻る
          </Button>
        </Link>
      </div>

      <Card className="bg-surface shadow-sm">
        <CardHeader className="border-border-soft border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-stone-800">
            <span>⚙️</span> スレッド設定の変更
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
              <label className="mb-1 block text-sm font-medium text-stone-700">
                募集ステータス
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border-border-soft focus:border-sage focus:ring-sage/20 w-full rounded-xl border bg-white px-3 py-2 text-sm text-stone-800 shadow-xs transition-all focus:ring-2 focus:outline-none"
              >
                <option value="open">🟢 募集中 (Open) - 新規参加・マッチング可能</option>
                <option value="closed">🔴 募集終了 (Closed) - 新規参加停止</option>
              </select>
            </div>

            <div>
              <Textarea
                label="スレッド説明文（任意）"
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
                スレッド参加者に求める前提条件やマッチング項目を編集できます。
              </p>
              <ConditionBuilder conditions={conditions} onChange={setConditions} />
            </div>

            <div className="border-border-soft flex items-center justify-end gap-3 border-t pt-5">
              <Link href={`/threads/${threadId}`}>
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
                {submitting ? "保存中..." : "変更を保存する"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
