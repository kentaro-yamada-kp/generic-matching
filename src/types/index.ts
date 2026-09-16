import type {
  User as PrismaUser,
  UserAuthProvider as PrismaUserAuthProvider,
  UserProfile as PrismaUserProfile,
  Thread as PrismaThread,
  ThreadCondition as PrismaThreadCondition,
  ThreadParticipant as PrismaThreadParticipant,
  ParticipantAttribute as PrismaParticipantAttribute,
  MatchEvaluation as PrismaMatchEvaluation,
  Match as PrismaMatch,
  ChatRoom as PrismaChatRoom,
  ChatMessage as PrismaChatMessage,
} from "@prisma/client";

// 認証関連型の再エクスポート
export * from "./auth";

/**
 * docs/features.md および docs/domain-model.md に基づく共通ドメイン型定義
 */

// Prisma 基本モデル型のエクスポート
export type {
  PrismaUser as User,
  PrismaUserAuthProvider as UserAuthProvider,
  PrismaUserProfile as UserProfile,
  PrismaThread as Thread,
  PrismaThreadCondition as ThreadCondition,
  PrismaThreadParticipant as ThreadParticipant,
  PrismaParticipantAttribute as ParticipantAttribute,
  PrismaMatchEvaluation as MatchEvaluation,
  PrismaMatch as Match,
  PrismaChatRoom as ChatRoom,
  PrismaChatMessage as ChatMessage,
};

/// プロフィール付きユーザー型
export type UserWithProfile = PrismaUser & {
  profile?: PrismaUserProfile | null;
};

/// 共通の基本条件 (A)
export interface BaseCondition {
  age?: number | null;
  gender?: string | null;
  location?: string | null;
  purpose?: string | null;
  category?: string | null;
  isOnline?: boolean;
}

/// スレッド固有のカスタム条件 / 前提条件 (B)
export interface CustomCondition {
  id?: string;
  key: string;
  value: string;
  type: "string" | "number" | "enum" | "tag" | string;
}

/// 認証プロバイダ種別 (docs/features.md 優先順位)
export type AuthProviderType =
  "twitter" | "instagram" | "line" | "discord" | "steam" | "playstation" | "breal" | "tiktok";

/// APIレスポンス共通型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/// ページネーション付きレスポンス共通型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ==========================================
// DTO & 入力データ型定義
// ==========================================

/// ユーザー作成・連携データ型
export interface CreateUserInput {
  displayName: string;
  avatarUrl?: string | null;
}

/// ユーザー更新データ型
export interface UpdateUserInput {
  displayName?: string;
  avatarUrl?: string | null;
}

/// 外部認証プロバイダ連携入力データ型
export interface LinkAuthProviderInput {
  userId: string;
  provider: AuthProviderType | string;
  providerUserId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
}

/// プロフィール更新データ型
export interface UpsertUserProfileInput extends BaseCondition {
  userId: string;
}

/// ユーザープロフィール更新リクエストペイロード型
export interface UpdateProfilePayload {
  displayName?: string;
  avatarUrl?: string | null;
  profile?: {
    age?: number | null;
    gender?: string | null;
    location?: string | null;
    purpose?: string | null;
    category?: string | null;
    isOnline?: boolean;
  };
}

/// オンラインステータス更新リクエストペイロード型
export interface UpdateOnlineStatusPayload {
  isOnline: boolean;
}

/// スレッド概要データ型（プロフィール画面表示用）
export interface ThreadSummary {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  conditions: Array<{
    id: string;
    key: string;
    value: string;
    type: string;
  }>;
}

/// 公開用ユーザープロフィール型（SCR-08 画面および GET /api/users/[id] 用）
export interface PublicUserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  profile: {
    age: number | null;
    gender: string | null;
    location: string | null;
    purpose: string | null;
    category: string | null;
    isOnline: boolean;
  } | null;
  providers: string[];
  threads: ThreadSummary[];
  matchesCount?: number;
}

/// マイページ用ユーザー詳細型（SCR-07 画面および GET /api/users/me 用）
export interface MyUserProfile extends PublicUserProfile {
  updatedAt: string;
  authProviders: Array<{
    id: string;
    provider: string;
    providerUserId: string;
    linkedAt: string;
  }>;
}

/// スレッド作成データ型
export interface CreateThreadInput {
  ownerUserId: string;
  title: string;
  description?: string | null;
  category?: string;
  status?: string;
  conditions?: Array<{
    key: string;
    value: string;
    type?: string;
  }>;
}

/// スレッド作成リクエストペイロード型
export interface CreateThreadPayload {
  title: string;
  description?: string;
  category?: string;
  conditions?: Array<{
    key: string;
    value: string;
    type?: string;
  }>;
}

/// スレッド更新データ型
export interface UpdateThreadInput {
  title?: string;
  description?: string | null;
  category?: string;
  status?: string;
  conditions?: Array<{
    key: string;
    value: string;
    type?: string;
  }>;
}

/// スレッド更新リクエストペイロード型
export interface UpdateThreadPayload {
  title?: string;
  description?: string;
  category?: string;
  status?: string;
  conditions?: Array<{
    key: string;
    value: string;
    type?: string;
  }>;
}

/// スレッド参加入力データ型
export interface JoinThreadPayload {
  customBio?: string;
  attributes?: Array<{
    key: string;
    value: string;
    type?: string;
  }>;
}

/// スレッド参加者独自属性入力データ型
export interface ParticipantAttributeInput {
  key: string;
  value: string;
  type?: string;
}

/// マッチング推薦候補者型 (API GET /api/threads/[id]/candidates)
export interface CandidateRecommendation {
  participantId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  customBio: string | null;
  joinedAt: string;
  matchScore: number;
  reasons: string[];
  profile: PrismaUserProfile | null;
  attributes: Array<{
    id: string;
    key: string;
    value: string;
    type: string;
  }>;
  evaluated?: boolean;
  isAgree?: boolean | null;
}

/// マッチング評価（Agree / Disagree）送信リクエスト型 (API POST /api/threads/[id]/evaluations)
export interface CreateEvaluationPayload {
  toParticipantId: string;
  isAgree: boolean;
}

/// マッチング評価送信レスポンス型
export interface EvaluationResultResponse {
  evaluation: PrismaMatchEvaluation;
  isMatched: boolean;
  matchId?: string;
  chatRoomId?: string;
}

/// マッチング作成データ型
export interface CreateMatchInput {
  threadId: string;
  user1Id: string;
  user2Id: string;
}

/// チャットメッセージ送信データ型
export interface CreateChatMessageInput {
  roomId: string;
  senderUserId: string;
  message: string;
}

// ==========================================
// リレーション結合型定義
// ==========================================

/// ユーザー詳細情報型（プロフィール・連携プロバイダ含む）
export type UserWithDetails = PrismaUser & {
  profile?: PrismaUserProfile | null;
  authProviders?: PrismaUserAuthProvider[];
};

/// 参加者詳細情報型
export type ThreadParticipantWithDetails = PrismaThreadParticipant & {
  user: PrismaUser & {
    profile?: PrismaUserProfile | null;
  };
  attributes: PrismaParticipantAttribute[];
  sentEvaluations?: PrismaMatchEvaluation[];
  receivedEvaluations?: PrismaMatchEvaluation[];
};

/// スレッド詳細情報型（作成者・前提条件・参加者一覧含む）
export type ThreadWithDetails = PrismaThread & {
  owner: PrismaUser & {
    profile?: PrismaUserProfile | null;
  };
  conditions: PrismaThreadCondition[];
  participants?: ThreadParticipantWithDetails[];
  matches?: PrismaMatch[];
  _count?: {
    participants?: number;
    matches?: number;
  };
};

/// マッチング詳細情報型（スレッド・ユーザー2名・チャットルーム含む）
export type MatchWithDetails = PrismaMatch & {
  thread: PrismaThread & {
    owner?: PrismaUser & {
      profile?: PrismaUserProfile | null;
    };
  };
  user1: PrismaUser & {
    profile?: PrismaUserProfile | null;
  };
  user2: PrismaUser & {
    profile?: PrismaUserProfile | null;
  };
  chatRoom?: PrismaChatRoom | null;
};

/// チャットルーム詳細情報型（メッセージ一覧含む）
export type ChatRoomWithDetails = PrismaChatRoom & {
  match: PrismaMatch & {
    thread: PrismaThread & {
      owner?: PrismaUser & {
        profile?: PrismaUserProfile | null;
      };
    };
    user1: PrismaUser & {
      profile?: PrismaUserProfile | null;
    };
    user2: PrismaUser & {
      profile?: PrismaUserProfile | null;
    };
  };
  messages: Array<
    PrismaChatMessage & {
      sender: PrismaUser;
    }
  >;
};
