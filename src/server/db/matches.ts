import { prisma } from "@/lib/prisma";
import type { CreateMatchInput, MatchWithDetails } from "@/types";

/**
 * 2名のユーザー間でマッチングを作成し、専用チャットルームを自動生成する
 */
export async function createMatchWithChatRoom(input: CreateMatchInput): Promise<MatchWithDetails> {
  const [u1, u2] = [input.user1Id, input.user2Id].sort();

  return await prisma.$transaction(async (tx) => {
    // マッチングレコードを作成
    const match = await tx.match.create({
      data: {
        threadId: input.threadId,
        user1Id: u1,
        user2Id: u2,
      },
    });

    // 専用チャットルームを自動生成
    await tx.chatRoom.create({
      data: {
        matchId: match.id,
      },
    });

    return await tx.match.findUniqueOrThrow({
      where: { id: match.id },
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
        chatRoom: true,
      },
    });
  });
}

/**
 * マッチングIDから詳細情報を取得する
 */
export async function getMatchById(id: string): Promise<MatchWithDetails | null> {
  return await prisma.match.findUnique({
    where: { id },
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
      chatRoom: true,
    },
  });
}

/**
 * スレッドIDと2名のユーザーIDからマッチング情報を取得する
 */
export async function getMatchByThreadAndUsers(
  threadId: string,
  userAId: string,
  userBId: string
): Promise<MatchWithDetails | null> {
  const [u1, u2] = [userAId, userBId].sort();

  return await prisma.match.findUnique({
    where: {
      threadId_user1Id_user2Id: {
        threadId,
        user1Id: u1,
        user2Id: u2,
      },
    },
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
      chatRoom: true,
    },
  });
}

/**
 * ユーザーが参加しているマッチング一覧を取得する（最新順）
 */
export async function getUserMatches(userId: string): Promise<MatchWithDetails[]> {
  return await prisma.match.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    orderBy: {
      matchedAt: "desc",
    },
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
      chatRoom: {
        include: {
          messages: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });
}

/**
 * 指定スレッドのマッチング一覧を取得する
 */
export async function getThreadMatches(threadId: string): Promise<MatchWithDetails[]> {
  return await prisma.match.findMany({
    where: { threadId },
    orderBy: {
      matchedAt: "desc",
    },
    include: {
      thread: {
        include: {
          owner: true,
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
      chatRoom: true,
    },
  });
}

/**
 * マッチングを解除・削除する（チャットルームやメッセージもカスケード削除）
 */
export async function deleteMatch(id: string) {
  return await prisma.match.delete({
    where: { id },
  });
}
