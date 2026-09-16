import { prisma } from "@/lib/prisma";
import type { CreateChatMessageInput, ChatRoomWithDetails, ChatMessage } from "@/types";

/**
 * チャットルームIDから詳細情報（マッチング・参加者2名・メッセージ履歴）を取得する
 */
export async function getChatRoomById(roomId: string): Promise<ChatRoomWithDetails | null> {
  return await prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      match: {
        include: {
          thread: {
            include: {
              owner: {
                include: {
                  profile: true,
                },
              },
              conditions: true,
            },
          },
          user1: {
            include: {
              profile: true,
            },
          },
          user2: {
            include: {
              profile: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          sender: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
  });
}

/**
 * マッチングIDからチャットルーム情報を取得する
 */
export async function getChatRoomByMatchId(matchId: string): Promise<ChatRoomWithDetails | null> {
  return await prisma.chatRoom.findUnique({
    where: { matchId },
    include: {
      match: {
        include: {
          thread: {
            include: {
              owner: {
                include: {
                  profile: true,
                },
              },
              conditions: true,
            },
          },
          user1: {
            include: {
              profile: true,
            },
          },
          user2: {
            include: {
              profile: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          sender: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
  });
}

/**
 * チャットメッセージを送信・保存する
 */
export async function sendChatMessage(input: CreateChatMessageInput): Promise<ChatMessage> {
  return await prisma.chatMessage.create({
    data: {
      roomId: input.roomId,
      senderUserId: input.senderUserId,
      message: input.message,
    },
    include: {
      sender: true,
    },
  });
}

/**
 * 指定ルームのメッセージ履歴を取得する（時系列順）
 */
export async function getChatMessages(
  roomId: string,
  params?: {
    limit?: number;
    offset?: number;
  }
) {
  const { limit = 50, offset = 0 } = params ?? {};

  return await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
    skip: offset,
    include: {
      sender: true,
    },
  });
}

/**
 * メッセージを削除する
 */
export async function deleteChatMessage(messageId: string) {
  return await prisma.chatMessage.delete({
    where: { id: messageId },
  });
}
