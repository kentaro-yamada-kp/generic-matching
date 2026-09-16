import { prisma } from "@/lib/prisma";
import type { EvaluationResultResponse } from "@/types";

/**
 * スレッド内で候補者に対して評価（Agree / Disagree）を行い、相互Agreeの場合はマッチングとチャットルームを自動生成する
 */
export async function evaluateCandidate(
  threadId: string,
  fromUserId: string,
  toParticipantId: string,
  isAgree: boolean
): Promise<EvaluationResultResponse> {
  return await prisma.$transaction(async (tx) => {
    // 1. 評価者本人の参加情報を取得
    const fromParticipant = await tx.threadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId: fromUserId,
        },
      },
    });

    if (!fromParticipant) {
      throw new Error("スレッドに参加していないため評価できません。");
    }

    // 2. 相手の参加情報を取得
    const toParticipant = await tx.threadParticipant.findUnique({
      where: { id: toParticipantId },
    });

    if (!toParticipant || toParticipant.threadId !== threadId) {
      throw new Error("指定された参加者が見つかりません。");
    }

    if (fromParticipant.id === toParticipant.id) {
      throw new Error("自分自身を評価することはできません。");
    }

    // 3. 評価レコードをUpsert
    const evaluation = await tx.matchEvaluation.upsert({
      where: {
        threadId_fromParticipantId_toParticipantId: {
          threadId,
          fromParticipantId: fromParticipant.id,
          toParticipantId: toParticipant.id,
        },
      },
      create: {
        threadId,
        fromParticipantId: fromParticipant.id,
        toParticipantId: toParticipant.id,
        isAgree,
      },
      update: {
        isAgree,
        evaluatedAt: new Date(),
      },
    });

    // 4. Agreeの場合、相手もAgreeしているかチェック
    if (isAgree) {
      const mutualEvaluation = await tx.matchEvaluation.findUnique({
        where: {
          threadId_fromParticipantId_toParticipantId: {
            threadId,
            fromParticipantId: toParticipant.id,
            toParticipantId: fromParticipant.id,
          },
        },
      });

      if (mutualEvaluation?.isAgree) {
        // 相互Agree成立！
        // ユーザーIDのペアをソートして一意に保つ（user1Id < user2Id）
        const [u1, u2] = [fromParticipant.userId, toParticipant.userId].sort();

        // 既存のマッチングを確認
        let match = await tx.match.findUnique({
          where: {
            threadId_user1Id_user2Id: {
              threadId,
              user1Id: u1,
              user2Id: u2,
            },
          },
          include: {
            chatRoom: true,
          },
        });

        if (!match) {
          // 新規マッチング作成
          match = await tx.match.create({
            data: {
              threadId,
              user1Id: u1,
              user2Id: u2,
            },
            include: {
              chatRoom: true,
            },
          });

          // 専用チャットルーム自動生成
          const chatRoom = await tx.chatRoom.create({
            data: {
              matchId: match.id,
            },
          });

          return {
            evaluation,
            isMatched: true,
            matchId: match.id,
            chatRoomId: chatRoom.id,
          };
        }

        return {
          evaluation,
          isMatched: true,
          matchId: match.id,
          chatRoomId: match.chatRoom?.id,
        };
      }
    }

    return {
      evaluation,
      isMatched: false,
    };
  });
}

/**
 * 参加者が行った評価一覧を取得する
 */
export async function getParticipantEvaluations(participantId: string) {
  return await prisma.matchEvaluation.findMany({
    where: {
      fromParticipantId: participantId,
    },
    include: {
      toParticipant: {
        include: {
          user: true,
          attributes: true,
        },
      },
    },
  });
}
