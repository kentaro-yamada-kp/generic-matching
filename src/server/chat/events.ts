import { EventEmitter } from "events";
import type { ChatMessage } from "@/types";

// グローバルに1つのEventEmitterを保持してプロセス内のPub/Subを実現
declare global {
  var chatEventEmitter: EventEmitter | undefined;
}

const eventEmitter: EventEmitter = global.chatEventEmitter || new EventEmitter();
if (process.env.NODE_ENV !== "production") {
  global.chatEventEmitter = eventEmitter;
}

// 接続クライアント数制限の緩和
eventEmitter.setMaxListeners(100);

/**
 * チャットルームのメッセージ受信イベントを発行
 */
export function notifyNewMessage(roomId: string, message: ChatMessage) {
  eventEmitter.emit(`room:${roomId}`, message);
}

/**
 * チャットルームのメッセージ受信イベントを購読
 */
export function subscribeRoomMessages(roomId: string, listener: (message: ChatMessage) => void) {
  const eventName = `room:${roomId}`;
  eventEmitter.on(eventName, listener);

  return () => {
    eventEmitter.off(eventName, listener);
  };
}
