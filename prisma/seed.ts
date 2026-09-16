import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * データベースの初期シードデータを投入するスクリプト
 * docs/domain-model.md の仕様に基づくユーザー、OAuthプロバイダ、基本条件(A)、スレッド、カスタム条件(B)、マッチング、チャットルーム、メッセージを作成
 */
async function main() {
  console.log("🌱 データベースのシードデータを投入開始...");

  // 既存データのクリーンアップ（外部キー制約のカスケード削除により users 削除で連鎖）
  await prisma.user.deleteMany();

  // 1. ユーザー作成
  const alice = await prisma.user.create({
    data: {
      displayName: "Alice",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Alice",
      authProviders: {
        create: [
          {
            provider: "twitter",
            providerUserId: "tw_alice_123",
          },
          {
            provider: "discord",
            providerUserId: "dc_alice_456",
          },
        ],
      },
      profile: {
        create: {
          age: 24,
          gender: "female",
          location: "Tokyo",
          purpose: "competitive",
          category: "FPS",
          isOnline: true,
        },
      },
    },
    include: {
      profile: true,
      authProviders: true,
    },
  });

  const bob = await prisma.user.create({
    data: {
      displayName: "Bob",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Bob",
      authProviders: {
        create: [
          {
            provider: "discord",
            providerUserId: "dc_bob_789",
          },
          {
            provider: "steam",
            providerUserId: "steam_bob_101",
          },
        ],
      },
      profile: {
        create: {
          age: 26,
          gender: "male",
          location: "Tokyo",
          purpose: "competitive",
          category: "FPS",
          isOnline: true,
        },
      },
    },
    include: {
      profile: true,
      authProviders: true,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      displayName: "Charlie",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Charlie",
      authProviders: {
        create: [
          {
            provider: "line",
            providerUserId: "line_charlie_555",
          },
        ],
      },
      profile: {
        create: {
          age: 22,
          gender: "non-binary",
          location: "Osaka",
          purpose: "casual",
          category: "RPG",
          isOnline: false,
        },
      },
    },
    include: {
      profile: true,
      authProviders: true,
    },
  });

  console.log(`✅ ユーザー作成完了: ${alice.displayName}, ${bob.displayName}, ${charlie.displayName}`);

  // 2. スレッド作成（Alice がスレッド作成、前提条件を設定）
  const thread = await prisma.thread.create({
    data: {
      ownerUserId: alice.id,
      title: "【VALORANT】ダイヤ帯ランク回しメンバー募集！",
      description: "今夜21時からダイヤ帯でフルパまたはデュオ/トリオで回せる方を募集しています！楽しくVCしながら勝ちを目指しましょう。",
      category: "FPS",
      status: "open",
      conditions: {
        create: [
          {
            key: "game_title",
            value: "VALORANT",
            type: "string",
          },
          {
            key: "platform",
            value: "PC",
            type: "string",
          },
        ],
      },
    },
    include: {
      conditions: true,
    },
  });

  console.log(`✅ スレッド作成完了: ${thread.title} (前提条件数: ${thread.conditions.length})`);

  // 3. スレッド参加エントリー（Alice & Bob が参加登録）
  const aliceParticipant = await prisma.threadParticipant.create({
    data: {
      threadId: thread.id,
      userId: alice.id,
      customBio: "メインイニシエーター（ソーヴァ/フェイド）使ってます！ダイヤ2です。",
      status: "active",
      attributes: {
        create: [
          {
            key: "current_rank",
            value: "Diamond 2",
            type: "enum",
          },
          {
            key: "main_agent",
            value: "Sova",
            type: "string",
          },
          {
            key: "play_time",
            value: "21:00-24:00",
            type: "string",
          },
        ],
      },
    },
    include: {
      attributes: true,
    },
  });

  const bobParticipant = await prisma.threadParticipant.create({
    data: {
      threadId: thread.id,
      userId: bob.id,
      customBio: "デュエリスト/コントローラーメイン。ダイヤ3です。VC可能です！",
      status: "active",
      attributes: {
        create: [
          {
            key: "current_rank",
            value: "Diamond 3",
            type: "enum",
          },
          {
            key: "main_agent",
            value: "Jett",
            type: "string",
          },
          {
            key: "play_time",
            value: "21:00-24:00",
            type: "string",
          },
        ],
      },
    },
    include: {
      attributes: true,
    },
  });

  console.log(`✅ 参加エントリー完了: Alice(ID: ${aliceParticipant.id}), Bob(ID: ${bobParticipant.id})`);

  // 4. マッチング評価（相互Agree）
  await prisma.matchEvaluation.create({
    data: {
      threadId: thread.id,
      fromParticipantId: aliceParticipant.id,
      toParticipantId: bobParticipant.id,
      isAgree: true,
    },
  });

  await prisma.matchEvaluation.create({
    data: {
      threadId: thread.id,
      fromParticipantId: bobParticipant.id,
      toParticipantId: aliceParticipant.id,
      isAgree: true,
    },
  });

  console.log("✅ 相互Agree評価完了");

  // 5. マッチング成立（Alice と Bob の相互Agreeによる Match 生成）
  const match = await prisma.match.create({
    data: {
      threadId: thread.id,
      user1Id: alice.id,
      user2Id: bob.id,
    },
  });

  console.log(`✅ マッチング作成完了: ID=${match.id}`);

  // 6. 専用チャットルーム自動生成
  const chatRoom = await prisma.chatRoom.create({
    data: {
      matchId: match.id,
    },
  });

  console.log(`✅ チャットルーム生成完了: ID=${chatRoom.id}`);

  // 7. チャットメッセージ送受信
  await prisma.chatMessage.createMany({
    data: [
      {
        roomId: chatRoom.id,
        senderUserId: bob.id,
        message: "初めまして！Bobです。スレッド拝見しました。今夜21時から参加可能です！",
      },
      {
        roomId: chatRoom.id,
        senderUserId: alice.id,
        message: "Bobさん、マッチングありがとうございます！ぜひ一緒に行きましょう！DiscordのID共有しますね。",
      },
    ],
  });

  console.log("✅ チャットメッセージ投入完了");
  console.log("✨ データベースのシード処理が正常に完了しました！");
}

main()
  .catch((e) => {
    console.error("❌ シード処理中にエラーが発生しました:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
