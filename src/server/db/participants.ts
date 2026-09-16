import { prisma } from "@/lib/prisma";
import type {
  ThreadParticipantWithDetails,
  JoinThreadPayload,
  ParticipantAttributeInput,
} from "@/types";

/**
 * スレッドに参加する（参加者独自プロフィール・属性を登録）
 */
export async function joinThread(
  threadId: string,
  userId: string,
  payload?: JoinThreadPayload
): Promise<ThreadParticipantWithDetails> {
  return await prisma.$transaction(async (tx) => {
    // 既存の参加情報を確認（既に存在する場合は更新）
    const existing = await tx.threadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId,
        },
      },
    });

    if (existing) {
      // 属性の再登録
      if (payload?.attributes) {
        await tx.participantAttribute.deleteMany({
          where: { participantId: existing.id },
        });

        if (payload.attributes.length > 0) {
          await tx.participantAttribute.createMany({
            data: payload.attributes.map((a) => ({
              participantId: existing.id,
              key: a.key,
              value: a.value,
              type: a.type ?? "string",
            })),
          });
        }
      }

      return await tx.threadParticipant.update({
        where: { id: existing.id },
        data: {
          customBio: payload?.customBio ?? existing.customBio,
          status: "active",
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          attributes: true,
          sentEvaluations: true,
          receivedEvaluations: true,
        },
      });
    }

    // 新規作成
    const participant = await tx.threadParticipant.create({
      data: {
        threadId,
        userId,
        customBio: payload?.customBio,
        status: "active",
        attributes: payload?.attributes?.length
          ? {
              create: payload.attributes.map((a) => ({
                key: a.key,
                value: a.value,
                type: a.type ?? "string",
              })),
            }
          : undefined,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        attributes: true,
        sentEvaluations: true,
        receivedEvaluations: true,
      },
    });

    return participant;
  });
}

/**
 * スレッドIDとユーザーIDから参加情報を取得する
 */
export async function getParticipantByThreadAndUser(
  threadId: string,
  userId: string
): Promise<ThreadParticipantWithDetails | null> {
  return await prisma.threadParticipant.findUnique({
    where: {
      threadId_userId: {
        threadId,
        userId,
      },
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      attributes: true,
      sentEvaluations: true,
      receivedEvaluations: true,
    },
  });
}

/**
 * 参加IDから詳細情報を取得する
 */
export async function getParticipantById(
  participantId: string
): Promise<ThreadParticipantWithDetails | null> {
  return await prisma.threadParticipant.findUnique({
    where: { id: participantId },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      attributes: true,
      sentEvaluations: true,
      receivedEvaluations: true,
    },
  });
}

/**
 * スレッドの全参加者一覧を取得する
 */
export async function listThreadParticipants(
  threadId: string
): Promise<ThreadParticipantWithDetails[]> {
  return await prisma.threadParticipant.findMany({
    where: {
      threadId,
      status: "active",
    },
    orderBy: {
      joinedAt: "asc",
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      attributes: true,
      sentEvaluations: true,
      receivedEvaluations: true,
    },
  });
}

/**
 * スレッド参加情報を更新する
 */
export async function updateParticipant(
  participantId: string,
  customBio?: string | null,
  attributes?: ParticipantAttributeInput[]
): Promise<ThreadParticipantWithDetails> {
  return await prisma.$transaction(async (tx) => {
    if (attributes !== undefined) {
      await tx.participantAttribute.deleteMany({
        where: { participantId },
      });

      if (attributes.length > 0) {
        await tx.participantAttribute.createMany({
          data: attributes.map((a) => ({
            participantId,
            key: a.key,
            value: a.value,
            type: a.type ?? "string",
          })),
        });
      }
    }

    return await tx.threadParticipant.update({
      where: { id: participantId },
      data: {
        ...(customBio !== undefined ? { customBio } : {}),
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        attributes: true,
        sentEvaluations: true,
        receivedEvaluations: true,
      },
    });
  });
}

/**
 * スレッドから退出する（ステータスを left に更新）
 */
export async function leaveThread(threadId: string, userId: string): Promise<void> {
  await prisma.threadParticipant.updateMany({
    where: {
      threadId,
      userId,
    },
    data: {
      status: "left",
    },
  });
}
