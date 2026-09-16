import { getCurrentUser } from "@/lib/auth/session";
import { getChatRoomById } from "@/server/db/chat";
import { subscribeRoomMessages } from "@/server/chat/events";
import type { ChatMessage } from "@/types";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/rooms/[id]/events
 * Server-Sent Events (SSE) を用いてリアルタイムに新着メッセージをクライアントへストリーミング配信する
 */
export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "認証が必要です。" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id: roomId } = await context.params;
  const room = await getChatRoomById(roomId);

  if (!room) {
    return new Response(JSON.stringify({ error: "チャットルームが見つかりません。" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 参加者権限確認（user1 または user2）
  const isParticipant = room.match.user1Id === user.id || room.match.user2Id === user.id;

  if (!isParticipant) {
    return new Response(JSON.stringify({ error: "権限がありません。" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 接続確立通知
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "ok" })}\n\n`)
      );

      // 新着メッセージの購読
      unsubscribe = subscribeRoomMessages(roomId, (message: ChatMessage) => {
        try {
          const payload = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (e) {
          console.error("SSE メッセージ送信エラー:", e);
        }
      });

      // 15秒ごとのキープアライブ（ハートビート）送信
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 15000);
    },
    cancel() {
      if (unsubscribe) {
        unsubscribe();
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
