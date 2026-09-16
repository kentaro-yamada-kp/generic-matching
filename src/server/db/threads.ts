import { prisma } from "@/lib/prisma";
import type { CreateThreadInput, UpdateThreadInput, ThreadWithDetails } from "@/types";

/**
 * スレッド検索・取得オプション
 */
export interface ListThreadsOptions {
  limit?: number;
  offset?: number;
  ownerUserId?: string;
  category?: string;
  status?: string;
  keyword?: string;
  isOnlineOnly?: boolean;
}

/**
 * スレッドを新規作成する（マッチング条件も同時に作成可能）
 */
export async function createThread(input: CreateThreadInput): Promise<ThreadWithDetails> {
  return await prisma.thread.create({
    data: {
      ownerUserId: input.ownerUserId,
      title: input.title,
      description: input.description,
      category: input.category ?? "general",
      status: input.status ?? "open",
      conditions: input.conditions?.length
        ? {
            create: input.conditions.map((c) => ({
              key: c.key,
              value: c.value,
              type: c.type ?? "string",
            })),
          }
        : undefined,
    },
    include: {
      owner: {
        include: {
          profile: true,
        },
      },
      conditions: true,
      participants: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          attributes: true,
        },
      },
      matches: true,
      _count: {
        select: {
          participants: true,
          matches: true,
        },
      },
    },
  });
}

/**
 * スレッドIDから詳細情報を取得する
 */
export async function getThreadById(id: string): Promise<ThreadWithDetails | null> {
  return await prisma.thread.findUnique({
    where: { id },
    include: {
      owner: {
        include: {
          profile: true,
        },
      },
      conditions: true,
      participants: {
        where: {
          status: "active",
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          attributes: true,
        },
      },
      matches: true,
      _count: {
        select: {
          participants: true,
          matches: true,
        },
      },
    },
  });
}

/**
 * スレッド一覧を取得する（最新順、検索・フィルタリング・ページネーション対応）
 */
export async function listThreads(params?: ListThreadsOptions): Promise<ThreadWithDetails[]> {
  const {
    limit = 20,
    offset = 0,
    ownerUserId,
    category,
    status,
    keyword,
    isOnlineOnly,
  } = params ?? {};

  return await prisma.thread.findMany({
    where: {
      ...(ownerUserId ? { ownerUserId } : {}),
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: "insensitive" } },
              { description: { contains: keyword, mode: "insensitive" } },
              { category: { contains: keyword, mode: "insensitive" } },
              {
                conditions: {
                  some: {
                    value: { contains: keyword, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
      ...(isOnlineOnly
        ? {
            owner: {
              profile: {
                isOnline: true,
              },
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: offset,
    include: {
      owner: {
        include: {
          profile: true,
        },
      },
      conditions: true,
      participants: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          attributes: true,
        },
      },
      matches: true,
      _count: {
        select: {
          participants: true,
          matches: true,
        },
      },
    },
  });
}

/**
 * 条件に合致するスレッドの総数を取得する
 */
export async function countThreads(
  params?: Omit<ListThreadsOptions, "limit" | "offset">
): Promise<number> {
  const { ownerUserId, category, status, keyword, isOnlineOnly } = params ?? {};

  return await prisma.thread.count({
    where: {
      ...(ownerUserId ? { ownerUserId } : {}),
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: "insensitive" } },
              { description: { contains: keyword, mode: "insensitive" } },
              { category: { contains: keyword, mode: "insensitive" } },
              {
                conditions: {
                  some: {
                    value: { contains: keyword, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
      ...(isOnlineOnly
        ? {
            owner: {
              profile: {
                isOnline: true,
              },
            },
          }
        : {}),
    },
  });
}

/**
 * スレッドを更新する（マッチング条件の入れ替えもサポート）
 */
export async function updateThread(
  id: string,
  input: UpdateThreadInput
): Promise<ThreadWithDetails> {
  return await prisma.$transaction(async (tx) => {
    // マッチング条件が指定されている場合は一度既存の条件を削除して再作成
    if (input.conditions) {
      await tx.threadCondition.deleteMany({
        where: { threadId: id },
      });

      if (input.conditions.length > 0) {
        await tx.threadCondition.createMany({
          data: input.conditions.map((c) => ({
            threadId: id,
            key: c.key,
            value: c.value,
            type: c.type ?? "string",
          })),
        });
      }
    }

    return await tx.thread.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: {
        owner: {
          include: {
            profile: true,
          },
        },
        conditions: true,
        participants: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
            attributes: true,
          },
        },
        matches: true,
        _count: {
          select: {
            participants: true,
            matches: true,
          },
        },
      },
    });
  });
}

/**
 * スレッドを削除する（カスケード削除により関連条件・参加者・評価・マッチングも削除）
 */
export async function deleteThread(id: string): Promise<void> {
  await prisma.thread.delete({
    where: { id },
  });
}
