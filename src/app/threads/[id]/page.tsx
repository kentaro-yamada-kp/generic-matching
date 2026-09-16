"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/AuthContext";
import type {
  ThreadWithDetails,
  ThreadParticipantWithDetails,
  CandidateRecommendation,
  EvaluationResultResponse,
} from "@/types";

interface ThreadDetailResponse extends ThreadWithDetails {
  myParticipant?: ThreadParticipantWithDetails | null;
}

/**
 * SCR-04: スレッド詳細画面
 */
export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;
  const { user } = useAuth();

  const [thread, setThread] = useState<ThreadDetailResponse | null>(null);
  const [candidates, setCandidates] = useState<CandidateRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 参加モーダル用状態
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [customBio, setCustomBio] = useState("");
  const [attributes, setAttributes] = useState<Array<{ key: string; value: string; type: string }>>(
    [
      { key: "play_time", value: "", type: "string" },
      { key: "skill_level", value: "", type: "string" },
    ]
  );
  const [submittingEntry, setSubmittingEntry] = useState(false);

  // マッチング成立モーダル状態
  const [matchedModalData, setMatchedModalData] = useState<{
    roomId?: string;
    partnerName?: string;
  } | null>(null);

  // スレッド詳細の取得
  const fetchThreadDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/threads/${threadId}`);
      const data = await res.json();

      if (data.success && data.data) {
        setThread(data.data);
        if (data.data.myParticipant) {
          setCustomBio(data.data.myParticipant.customBio || "");
          if (data.data.myParticipant.attributes?.length > 0) {
            setAttributes(
              data.data.myParticipant.attributes.map(
                (a: { key: string; value: string; type: string }) => ({
                  key: a.key,
                  value: a.value,
                  type: a.type || "string",
                })
              )
            );
          }
        }
      } else {
        setError(data.error || "スレッドの取得に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      setError("スレッド詳細の取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  // 候補者レコメンド一覧の取得
  const fetchCandidates = useCallback(async () => {
    if (!user) return;
    try {
      setCandidatesLoading(true);
      const res = await fetch(`/api/threads/${threadId}/candidates`);
      const data = await res.json();
      if (data.success && data.data) {
        setCandidates(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCandidatesLoading(false);
    }
  }, [threadId, user]);

  useEffect(() => {
    fetchThreadDetail();
  }, [fetchThreadDetail]);

  useEffect(() => {
    if (thread?.myParticipant && thread.myParticipant.status === "active") {
      fetchCandidates();
    }
  }, [thread?.myParticipant, fetchCandidates]);

  // 参加登録・情報更新
  const handleJoinOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingEntry(true);

      const validAttributes = attributes
        .filter((a) => a.key.trim() && a.value.trim())
        .map((a) => ({
          key: a.key.trim(),
          value: a.value.trim(),
          type: a.type || "string",
        }));

      const res = await fetch(`/api/threads/${threadId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customBio: customBio.trim() || undefined,
          attributes: validAttributes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEntryModalOpen(false);
        await fetchThreadDetail();
        await fetchCandidates();
      } else {
        alert(data.error || "参加処理に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      alert("参加登録中にエラーが発生しました。");
    } finally {
      setSubmittingEntry(false);
    }
  };

  // スレッドからの退出
  const handleLeaveThread = async () => {
    if (!confirm("このスレッドから退出しますか？")) return;
    try {
      const res = await fetch(`/api/threads/${threadId}/participants/me`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchThreadDetail();
        setCandidates([]);
      } else {
        alert(data.error || "スレッドからの退出に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      alert("退出処理中にエラーが発生しました。");
    }
  };

  // Agree / Disagree 評価送信
  const handleEvaluation = async (toParticipantId: string, isAgree: boolean) => {
    try {
      const res = await fetch(`/api/threads/${threadId}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toParticipantId,
          isAgree,
        }),
      });

      const data: { success: boolean; data?: EvaluationResultResponse; error?: string } =
        await res.json();

      if (data.success && data.data) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.participantId === toParticipantId ? { ...c, evaluated: true, isAgree } : c
          )
        );

        if (data.data.isMatched) {
          const matchedCandidate = candidates.find((c) => c.participantId === toParticipantId);
          setMatchedModalData({
            roomId: data.data.chatRoomId,
            partnerName: matchedCandidate?.displayName || "お相手",
          });
        }
      } else {
        alert(data.error || "評価の送信に失敗しました。");
      }
    } catch (err) {
      console.error(err);
      alert("評価の送信中にエラーが発生しました。");
    }
  };

  // 属性フォームの動的操作
  const handleAddAttribute = () => {
    setAttributes((prev) => [...prev, { key: "", value: "", type: "string" }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, field: "key" | "value" | "type", val: string) => {
    setAttributes((prev) =>
      prev.map((attr, i) => (i === index ? { ...attr, [field]: val } : attr))
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="border-sage inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="mt-3 text-sm text-stone-500">スレッド情報を読み込み中...</p>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <Card className="border-terracotta/30 p-8 shadow-sm">
          <span className="text-3xl">⚠️</span>
          <h2 className="mt-2 text-xl font-bold text-stone-800">スレッドが見つかりません</h2>
          <p className="mt-2 text-sm text-stone-500">
            {error || "指定されたスレッドは削除されたか、存在しません。"}
          </p>
          <div className="mt-6">
            <Link href="/threads">
              <Button variant="primary">スレッド一覧へ戻る</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isManager = user && thread.ownerUserId === user.id;
  const isJoined = thread.myParticipant && thread.myParticipant.status === "active";
  const managerUser =
    (thread as unknown as { manager?: { displayName: string; avatarUrl: string | null } })
      .manager || thread.owner;

  return (
    <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* ナビゲーション */}
      <div className="flex items-center justify-between">
        <Link href="/threads">
          <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900">
            ← スレッド一覧へ戻る
          </Button>
        </Link>
        {isManager && (
          <div className="flex items-center gap-2">
            <Link href={`/threads/${threadId}/edit`}>
              <Button variant="outline" size="sm">
                ⚙️ スレッド設定を編集
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* スレッドヘッダーカード */}
      <Card className="bg-surface shadow-sm">
        <CardHeader className="border-border-soft space-y-4 border-b pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={thread.status === "open" ? "success" : "secondary"}>
                  {thread.status === "open" ? "🟢 募集中" : "🔴 募集終了"}
                </Badge>
                <Badge variant="primary">{thread.category}</Badge>
                <span className="text-xs text-stone-400">
                  作成日: {new Date(thread.createdAt).toLocaleDateString("ja-JP")}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">{thread.title}</h1>
            </div>

            {/* スレッド管理者情報 */}
            <div className="border-border-soft flex items-center gap-3 rounded-xl border bg-stone-50/70 p-2.5 sm:px-3">
              <Avatar src={managerUser?.avatarUrl} name={managerUser?.displayName} size="sm" />
              <div className="text-left">
                <p className="text-sage text-[11px] font-bold">スレッド管理者</p>
                <Link
                  href={`/users/${thread.ownerUserId}`}
                  className="hover:text-sage text-xs font-semibold text-stone-800 hover:underline"
                >
                  {managerUser?.displayName}
                </Link>
              </div>
            </div>
          </div>

          {/* 説明文 */}
          {thread.description && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-stone-600">
              {thread.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          {/* マッチング条件 */}
          {thread.conditions && thread.conditions.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-stone-500 uppercase">
                <span>📋</span> スレッドのマッチング条件
              </h3>
              <div className="flex flex-wrap gap-2">
                {thread.conditions.map((cond) => (
                  <span
                    key={cond.id}
                    className="border-border-soft inline-flex items-center gap-1.5 rounded-full border bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700"
                  >
                    <span className="font-semibold text-stone-800">{cond.key}:</span>
                    <span className="text-dusty-blue font-semibold">{cond.value}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 参加ステータス & アクションバー */}
          <div className="border-border-soft rounded-2xl border bg-stone-50/70 p-4">
            {!isJoined ? (
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div>
                  <h4 className="text-sm font-bold text-stone-800">このスレッドに参加しますか？</h4>
                  <p className="mt-0.5 text-xs text-stone-500">
                    参加登録を行うと、希望条件に合った他の参加者とマッチング・チャットができるようになります。
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setIsEntryModalOpen(true)}
                  disabled={thread.status === "closed"}
                  className="w-full shrink-0 font-bold sm:w-auto"
                >
                  スレッドに参加する
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-sage flex h-2 w-2 rounded-full" />
                    <h4 className="text-sm font-bold text-stone-800">
                      あなたはこのスレッドに参加中です
                    </h4>
                  </div>
                  {thread.myParticipant?.customBio && (
                    <p className="text-xs text-stone-600 italic">
                      「{thread.myParticipant.customBio}」
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEntryModalOpen(true)}>
                    ⚙️ 参加情報の編集
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLeaveThread}
                    className="text-terracotta hover:bg-terracotta/10 hover:text-terracotta"
                  >
                    退出する
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 参加者向け：推薦候補者レコメンドエリア */}
      {isJoined && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-stone-800">
              <span>🎯 あなたにおすすめの候補者</span>
              <span className="border-border-soft rounded-full border bg-stone-100 px-2.5 py-0.5 text-xs font-normal text-stone-600">
                {candidates.length}名
              </span>
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchCandidates}
              disabled={candidatesLoading}
            >
              🔄 再更新
            </Button>
          </div>

          {candidatesLoading ? (
            <div className="py-8 text-center text-stone-500">候補者をレコメンド中...</div>
          ) : candidates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-stone-500">
                現在、このスレッドで他にアクティブな参加者はまだいません。
                他の参加者が集まるのをお待ちください！
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {candidates.map((cand) => (
                <Card
                  key={cand.participantId}
                  className={`border shadow-xs transition duration-200 ${
                    cand.evaluated
                      ? cand.isAgree
                        ? "border-sage/40 bg-sage/5"
                        : "border-border-soft bg-stone-50 opacity-60"
                      : "border-border-soft hover:border-sage/60 hover:shadow-sm"
                  }`}
                >
                  <CardContent className="space-y-4 p-5">
                    {/* ユーザー情報ヘッダー */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={cand.avatarUrl} alt={cand.displayName} size="md" />
                        <div>
                          <Link
                            href={`/users/${cand.userId}`}
                            className="hover:text-sage font-semibold text-stone-800 hover:underline"
                          >
                            {cand.displayName}
                          </Link>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
                            <span>{new Date(cand.joinedAt).toLocaleDateString("ja-JP")} 参加</span>
                            {cand.profile?.isOnline && (
                              <span className="text-sage flex items-center gap-1 font-medium">
                                <span className="bg-sage h-1.5 w-1.5 rounded-full"></span>
                                オンライン
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 適合スコアバッジ */}
                      <Badge
                        variant={
                          cand.matchScore >= 80
                            ? "success"
                            : cand.matchScore >= 60
                              ? "primary"
                              : "secondary"
                        }
                      >
                        適合度 {cand.matchScore}%
                      </Badge>
                    </div>

                    {/* 自己紹介文 */}
                    {cand.customBio && (
                      <p className="border-border-soft/60 rounded-xl border bg-stone-50 p-2.5 text-xs text-stone-700 italic">
                        「{cand.customBio}」
                      </p>
                    )}

                    {/* マッチング理由タグ */}
                    {cand.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {cand.reasons.map((reason, i) => (
                          <span
                            key={i}
                            className="bg-dusty-blue/15 border-dusty-blue/30 text-dusty-blue rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                          >
                            ✨ {reason}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 参加者属性 */}
                    {cand.attributes.length > 0 && (
                      <div className="border-border-soft flex flex-wrap gap-2 border-t pt-2 text-xs text-stone-600">
                        {cand.attributes.map((attr) => (
                          <span
                            key={attr.id}
                            className="border-border-soft rounded-full border bg-stone-100 px-2.5 py-0.5"
                          >
                            <strong>{attr.key}:</strong> {attr.value}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 評価アクションボタン */}
                    <div className="border-border-soft border-t pt-3">
                      {cand.evaluated ? (
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`font-semibold ${
                              cand.isAgree ? "text-sage" : "text-stone-400"
                            }`}
                          >
                            {cand.isAgree ? "✅ Agree（いいね）送信済み" : "✖️ スキップ済み"}
                          </span>
                          <span className="text-stone-400">評価完了</span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-stone-600"
                            onClick={() => handleEvaluation(cand.participantId, false)}
                          >
                            スキップ
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="flex-1 font-bold"
                            onClick={() => handleEvaluation(cand.participantId, true)}
                          >
                            💖 Agree!
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* スレッド管理者専用：参加者一覧管理セクション (ISSUE-14) */}
      {isManager && (
        <div className="border-border-soft space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-stone-800">
              <span>👥 スレッド参加者一覧（管理者専用）</span>
              <span className="bg-dusty-blue/15 border-dusty-blue/30 text-dusty-blue rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                {thread.participants?.length || 0}名
              </span>
            </h2>
            <span className="text-xs text-stone-400">
              ※ 参加者一覧はプライバシー保護のため管理者のみ閲覧可能です
            </span>
          </div>

          {!thread.participants || thread.participants.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-xs text-stone-500">
                まだ他の参加者はいません。
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {thread.participants.map((p) => (
                <Card key={p.id} className="border-border-soft bg-surface border p-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <Avatar src={p.user?.avatarUrl} name={p.user?.displayName} size="md" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/users/${p.userId}`}
                        className="hover:text-sage truncate text-sm font-bold text-stone-800 hover:underline"
                      >
                        {p.user?.displayName}
                      </Link>
                      <p className="text-[11px] text-stone-400">
                        {new Date(p.joinedAt).toLocaleDateString("ja-JP")} 参加
                      </p>
                    </div>
                  </div>
                  {p.customBio && (
                    <p className="border-border-soft/60 mt-2.5 rounded-xl border bg-stone-50 p-2 text-xs text-stone-600">
                      {p.customBio}
                    </p>
                  )}
                  {p.attributes && p.attributes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.attributes.map((a) => (
                        <span
                          key={a.id}
                          className="border-border-soft rounded-full border bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600"
                        >
                          {a.key}: {a.value}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 参加情報入力・編集モーダル */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <Card className="border-border-soft bg-surface max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-xl">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg text-stone-800">
                {isJoined ? "参加情報の編集" : "スレッドへの参加登録"}
              </CardTitle>
              <p className="text-xs text-stone-500">
                このスレッド内での自己紹介や条件設定を入力してください。
              </p>
            </CardHeader>

            <form onSubmit={handleJoinOrUpdate} className="space-y-4">
              {/* スレッド専用Bio */}
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  このスレッドでの自己紹介・メッセージ（任意）
                </label>
                <textarea
                  value={customBio}
                  onChange={(e) => setCustomBio(e.target.value)}
                  placeholder="例: 平日の夜メインで活動しています！気軽にお声がけください。"
                  rows={3}
                  maxLength={500}
                  className="border-border-soft focus:border-sage focus:ring-sage/20 w-full rounded-xl border bg-white p-2.5 text-xs text-stone-800 shadow-xs focus:ring-2 focus:outline-none"
                />
              </div>

              {/* カスタム属性 */}
              <div className="border-border-soft space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">
                    マッチング用属性・希望条件（Key-Value）
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddAttribute}
                    className="text-sage hover:text-sage/80 cursor-pointer text-xs"
                  >
                    ＋ 項目を追加
                  </Button>
                </div>

                {attributes.map((attr, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="属性名 (例: ランク, 活動時間)"
                      value={attr.key}
                      onChange={(e) => handleAttributeChange(index, "key", e.target.value)}
                      className="border-border-soft focus:border-sage w-1/3 rounded-xl border bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="値 (例: プラチナ, 21時〜24時)"
                      value={attr.value}
                      onChange={(e) => handleAttributeChange(index, "value", e.target.value)}
                      className="border-border-soft focus:border-sage flex-1 rounded-xl border bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
                    />
                    {attributes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(index)}
                        className="hover:text-terracotta cursor-pointer p-1 text-stone-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* モーダルアクション */}
              <div className="border-border-soft flex justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEntryModalOpen(false)}
                  disabled={submittingEntry}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingEntry}
                  className="font-bold"
                >
                  {submittingEntry ? "送信中..." : isJoined ? "更新する" : "参加する"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* マッチング成立ポップアップモーダル */}
      {matchedModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="border-sage/40 bg-surface w-full max-w-sm scale-100 transform p-6 text-center shadow-2xl transition-transform">
            <div className="mb-3 animate-bounce text-5xl">🎉</div>
            <h3 className="text-xl font-black text-stone-800">マッチング成立！</h3>
            <p className="mt-2 text-xs text-stone-600">
              お互いにAgree（いいね）を送り合いました！
              <br />
              <strong className="text-sage">{matchedModalData.partnerName}</strong>
              さんと個別のリアルタイムチャットが開始できます。
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {matchedModalData.roomId && (
                <Button
                  variant="primary"
                  onClick={() => router.push(`/rooms/${matchedModalData.roomId}`)}
                  className="py-2.5 font-bold"
                >
                  💬 チャットルームへ行く
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMatchedModalData(null)}
                className="text-stone-500 hover:text-stone-700"
              >
                閉じる
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
