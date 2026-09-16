"use client";

import React, { useState, useEffect, useRef, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ChatRoomWithDetails, ChatMessage, UserWithProfile } from "@/types";

interface ChatRoomPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [room, setRoom] = useState<ChatRoomWithDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // スクロールを最下部に移動
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // チャットルーム情報 & 初期メッセージ取得
  const fetchRoomData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/rooms/${roomId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "チャットルームの読み込みに失敗しました。");
      }

      setRoom(data.data);
      setMessages(data.data.messages || []);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "予期せぬエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
      return;
    }
    if (isAuthenticated) {
      fetchRoomData();
    }
  }, [isAuthenticated, authLoading, fetchRoomData, router]);

  // 初期ロード時 & メッセージ更新時に最下部スクロール
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("auto");
    }
  }, [messages.length]);

  // SSE (Server-Sent Events) によるリアルタイム新着メッセージ受信
  useEffect(() => {
    if (!isAuthenticated || !roomId) return;

    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource(`/api/rooms/${roomId}/events`);

      eventSource.addEventListener("message", (event) => {
        try {
          const newMsg: ChatMessage = JSON.parse(event.data);
          setMessages((prev) => {
            // 既に存在する場合は重複追加しない
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
          setTimeout(() => scrollToBottom("smooth"), 50);
        } catch (e) {
          console.error("SSEメッセージパースエラー:", e);
        }
      });

      eventSource.onerror = () => {
        // SSEエラー時はフォールバックとしてポーリングに切り替え
        if (eventSource) {
          eventSource.close();
        }
        if (!fallbackInterval) {
          fallbackInterval = setInterval(async () => {
            try {
              const res = await fetch(`/api/rooms/${roomId}/messages`);
              const data = await res.json();
              if (data.success && Array.isArray(data.data)) {
                setMessages(data.data);
              }
            } catch {
              // ポーリングエラーは握りつぶす
            }
          }, 3000);
        }
      };
    } catch (err) {
      console.error("SSE接続失敗:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [isAuthenticated, roomId]);

  // メッセージ送信処理
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const messageToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    try {
      const res = await fetch(`/api/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "メッセージの送信に失敗しました。");
      }

      // 送信成功したメッセージをローカル状態にも反映（SSEより早く即時反映）
      const sentMsg = data.data;
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });

      setTimeout(() => scrollToBottom("smooth"), 50);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "送信に失敗しました。");
      setInputText(messageToSend); // 失敗時は入力内容を復元
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  // Enterキー送信（Shift+Enterで改行）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <div className="border-sage h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-sm">チャットルームを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card className="border-terracotta/30 bg-terracotta/10 p-6 text-center">
          <h2 className="text-terracotta text-lg font-bold">チャットルームを表示できません</h2>
          <p className="text-terracotta mt-2 text-sm">
            {error || "ルーム情報が見つかりませんでした。"}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/matches">
              <Button variant="secondary">マッチング一覧へ戻る</Button>
            </Link>
            <Link href="/threads">
              <Button variant="outline">スレッド一覧へ</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // チャット相手の特定（user1 または user2 のうち自分ではない方）
  const partner: UserWithProfile =
    room.match.user1Id === user?.id
      ? (room.match.user2 as UserWithProfile)
      : (room.match.user1 as UserWithProfile);

  return (
    <div className="bg-background mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col">
      {/* ルームヘッダー */}
      <header className="border-border-soft bg-surface flex shrink-0 items-center justify-between border-b px-4 py-3 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/matches"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
            title="マッチング一覧へ戻る"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar src={partner.avatarUrl || undefined} name={partner.displayName} size="md" />
              {partner.profile?.isOnline && (
                <span
                  className="bg-sage absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white"
                  title="オンライン"
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/users/${partner.id}`}
                  className="font-bold text-stone-800 hover:underline"
                >
                  {partner.displayName}
                </Link>
                <Badge variant="outline" size="sm" className="text-xs">
                  {partner.id === room.match.thread.ownerUserId ? "スレッド管理者" : "参加メンバー"}
                </Badge>
              </div>
              <p className="max-w-xs truncate text-xs text-stone-500 md:max-w-md">
                スレッド:{" "}
                <Link
                  href={`/threads/${room.match.threadId}`}
                  className="text-sage font-medium hover:underline"
                >
                  {room.match.thread.title}
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/users/${partner.id}`}>
            <Button variant="ghost" size="sm" className="hidden text-xs sm:inline-flex">
              プロフィールを見る
            </Button>
          </Link>
        </div>
      </header>

      {/* メッセージ表示エリア */}
      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="mx-auto max-w-md py-4 text-center">
          <div className="bg-sage/10 border-sage/30 text-sage inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            マッチングが成立しました！楽しく会話を始めましょう。
          </div>
          <p className="mt-2 text-xs text-stone-400">
            マッチング日時: {new Date(room.match.matchedAt).toLocaleString("ja-JP")}
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <p className="text-sm">まだメッセージはありません。</p>
            <p className="mt-1 text-xs">最初の挨拶や自己紹介を送ってみましょう！</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderUserId === user?.id;
            const showDateHeader =
              index === 0 ||
              new Date(msg.createdAt).toDateString() !==
                new Date(messages[index - 1].createdAt).toDateString();

            return (
              <React.Fragment key={msg.id}>
                {showDateHeader && (
                  <div className="my-4 flex justify-center">
                    <span className="rounded-full bg-stone-200/80 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">
                      {new Date(msg.createdAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                      })}
                    </span>
                  </div>
                )}

                <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <Avatar
                      src={partner.avatarUrl || undefined}
                      name={partner.displayName}
                      size="sm"
                      className="mb-1"
                    />
                  )}

                  <div
                    className={`flex flex-col ${
                      isMe ? "items-end" : "items-start"
                    } max-w-[75%] sm:max-w-[70%]`}
                  >
                    {!isMe && (
                      <span className="mb-1 text-[11px] font-medium text-stone-500">
                        {partner.displayName}
                      </span>
                    )}

                    <div className="flex items-end gap-1.5">
                      {isMe && (
                        <span className="text-[10px] text-stone-400 select-none">
                          {new Date(msg.createdAt).toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap shadow-xs ${
                          isMe
                            ? "bg-sage rounded-br-none font-normal text-white"
                            : "border-border-soft bg-surface rounded-bl-none border text-stone-800"
                        }`}
                      >
                        {msg.message}
                      </div>

                      {!isMe && (
                        <span className="text-[10px] text-stone-400 select-none">
                          {new Date(msg.createdAt).toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* メッセージ入力フッター */}
      <footer className="border-border-soft bg-surface shrink-0 border-t p-3 shadow-sm">
        <form onSubmit={handleSendMessage} className="mx-auto flex max-w-4xl items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力... (Shift+Enterで改行, Enterで送信)"
              rows={1}
              className="border-border-soft focus:border-sage focus:ring-sage/30 max-h-32 min-h-[42px] w-full resize-none rounded-xl border bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 focus:bg-white focus:ring-1 focus:outline-none"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={!inputText.trim() || isSending}
            isLoading={isSending}
            className="h-[42px] shrink-0 rounded-xl px-4"
          >
            <svg className="h-4 w-4 rotate-90 transform" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            <span className="ml-1.5 hidden sm:inline">送信</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
