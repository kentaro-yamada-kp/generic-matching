import type {
  UserProfile,
  ThreadCondition,
  ThreadParticipantWithDetails,
  CandidateRecommendation,
} from "@/types";

/**
 * 各条件の評価結果
 */
export interface ConditionEvaluationResult {
  key: string;
  expectedValue: string;
  actualValue: string | number | boolean | null | undefined;
  type: string;
  isMatched: boolean;
  message?: string;
}

/**
 * マッチング判定全体の総合評価結果
 */
export interface MatchingEvaluationResult {
  isMatched: boolean;
  score: number; // 適合率 (0〜100%)
  matchedCount: number;
  totalConditions: number;
  baseConditionsResult: ConditionEvaluationResult[];
  customConditionsResult: ConditionEvaluationResult[];
  reason?: string;
}

/**
 * 単一のカスタム条件を評価する
 */
export function evaluateCondition(
  condition: Pick<ThreadCondition, "key" | "value" | "type">,
  userProfile?: UserProfile | null,
  customUserAttributes?: Record<string, string | number | boolean>
): ConditionEvaluationResult {
  const { key, value: expectedValue, type } = condition;

  // 1. ユーザープロフィール基本属性(A)からの値解決
  let actualValue: string | number | boolean | null | undefined = undefined;
  const normalizedKey = key.toLowerCase().trim();

  if (userProfile) {
    if (normalizedKey === "age" || normalizedKey === "年齢") {
      actualValue = userProfile.age;
    } else if (normalizedKey === "gender" || normalizedKey === "性別") {
      actualValue = userProfile.gender;
    } else if (
      normalizedKey === "location" ||
      normalizedKey === "地域" ||
      normalizedKey === "居住地"
    ) {
      actualValue = userProfile.location;
    } else if (
      normalizedKey === "purpose" ||
      normalizedKey === "目的" ||
      normalizedKey === "利用目的"
    ) {
      actualValue = userProfile.purpose;
    } else if (
      normalizedKey === "category" ||
      normalizedKey === "カテゴリ" ||
      normalizedKey === "趣味"
    ) {
      actualValue = userProfile.category;
    } else if (
      normalizedKey === "isonline" ||
      normalizedKey === "online" ||
      normalizedKey === "オンライン"
    ) {
      actualValue = userProfile.isOnline;
    }
  }

  // 2. カスタム属性からの値解決
  if (actualValue === undefined && customUserAttributes) {
    actualValue = customUserAttributes[key] ?? customUserAttributes[normalizedKey];
  }

  if (actualValue === undefined || actualValue === null || actualValue === "") {
    return {
      key,
      expectedValue,
      actualValue: null,
      type,
      isMatched: false,
      message: `ユーザーの属性「${key}」が設定されていません。`,
    };
  }

  let isMatched = false;
  const expectedLower = expectedValue.toLowerCase().trim();
  const actualStr = String(actualValue).toLowerCase().trim();

  switch (type.toLowerCase()) {
    case "number":
    case "numeric":
    case "range": {
      const actualNum = Number(actualValue);
      if (isNaN(actualNum)) {
        isMatched = false;
        break;
      }

      if (expectedValue.includes("-") || expectedValue.includes("~")) {
        const delimiter = expectedValue.includes("-") ? "-" : "~";
        const [minStr, maxStr] = expectedValue.split(delimiter).map((s) => s.trim());
        const min = minStr ? Number(minStr) : -Infinity;
        const max = maxStr ? Number(maxStr) : Infinity;
        isMatched = actualNum >= min && actualNum <= max;
      } else if (expectedValue.startsWith(">=")) {
        isMatched = actualNum >= Number(expectedValue.slice(2));
      } else if (expectedValue.startsWith("<=")) {
        isMatched = actualNum <= Number(expectedValue.slice(2));
      } else if (expectedValue.startsWith(">")) {
        isMatched = actualNum > Number(expectedValue.slice(1));
      } else if (expectedValue.startsWith("<")) {
        isMatched = actualNum < Number(expectedValue.slice(1));
      } else {
        isMatched = actualNum === Number(expectedValue);
      }
      break;
    }

    case "tag":
    case "tags":
    case "enum": {
      const expectedTags = expectedLower
        .split(/[,、/]/)
        .map((t) => t.trim())
        .filter(Boolean);
      const actualTags = actualStr
        .split(/[,、/]/)
        .map((t) => t.trim())
        .filter(Boolean);

      isMatched = expectedTags.some((exp) =>
        actualTags.some((act) => act.includes(exp) || exp.includes(act))
      );
      break;
    }

    case "boolean": {
      const expBool =
        expectedLower === "true" ||
        expectedLower === "1" ||
        expectedLower === "yes" ||
        expectedLower === "オンライン";
      const actBool =
        actualStr === "true" || actualStr === "1" || actualStr === "yes" || actualValue === true;
      isMatched = expBool === actBool;
      break;
    }

    case "string":
    default: {
      isMatched = actualStr.includes(expectedLower) || expectedLower.includes(actualStr);
      break;
    }
  }

  return {
    key,
    expectedValue,
    actualValue,
    type,
    isMatched,
    message: isMatched
      ? "条件に合致しています。"
      : `条件「${expectedValue}」と不一致です（現在値: ${actualValue}）。`,
  };
}

/**
 * 2名のスレッド参加者間の適合スコアおよび推薦理由を算出する
 */
export function calculateParticipantMatch(
  me: ThreadParticipantWithDetails,
  candidate: ThreadParticipantWithDetails
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 50; // ベーススコア

  // 1. 基本プロフィール(A)の照合
  const myProfile = me.user?.profile;
  const candProfile = candidate.user?.profile;

  if (myProfile && candProfile) {
    // カテゴリ一致
    if (
      myProfile.category &&
      candProfile.category &&
      (myProfile.category.toLowerCase().includes(candProfile.category.toLowerCase()) ||
        candProfile.category.toLowerCase().includes(myProfile.category.toLowerCase()))
    ) {
      score += 15;
      reasons.push(`共通カテゴリ: ${candProfile.category}`);
    }

    // 利用目的一致
    if (
      myProfile.purpose &&
      candProfile.purpose &&
      myProfile.purpose.toLowerCase() === candProfile.purpose.toLowerCase()
    ) {
      score += 15;
      reasons.push(`利用目的が一致 (${candProfile.purpose})`);
    }

    // 地域一致
    if (
      myProfile.location &&
      candProfile.location &&
      myProfile.location.toLowerCase() === candProfile.location.toLowerCase()
    ) {
      score += 10;
      reasons.push(`活動地域が一致 (${candProfile.location})`);
    }

    // オンライン状態
    if (candProfile.isOnline) {
      score += 10;
      reasons.push("現在オンライン中");
    }
  }

  // 2. 参加者独自属性(B)の照合
  const myAttrMap = new Map(me.attributes.map((a) => [a.key.toLowerCase().trim(), a.value.trim()]));

  for (const candAttr of candidate.attributes) {
    const candKey = candAttr.key.toLowerCase().trim();
    const candVal = candAttr.value.trim();

    if (myAttrMap.has(candKey)) {
      const myVal = myAttrMap.get(candKey)!;

      if (candVal.toLowerCase() === myVal.toLowerCase()) {
        score += 15;
        reasons.push(`${candAttr.key}が一致: ${candVal}`);
      } else if (
        candVal.toLowerCase().includes(myVal.toLowerCase()) ||
        myVal.toLowerCase().includes(candVal.toLowerCase())
      ) {
        score += 10;
        reasons.push(`${candAttr.key}が近接: ${candVal}`);
      }
    }
  }

  // スコアは最大100に制限
  score = Math.min(100, Math.max(0, score));

  if (reasons.length === 0) {
    reasons.push("同じスレッドの参加者です");
  }

  return { score, reasons };
}

/**
 * スレッド内の参加者向けに候補者レコメンドリストを構築・ソートする
 */
export function buildCandidateRecommendations(
  me: ThreadParticipantWithDetails,
  allParticipants: ThreadParticipantWithDetails[]
): CandidateRecommendation[] {
  // 自分自身を除外
  const others = allParticipants.filter((p) => p.id !== me.id && p.userId !== me.userId);

  // 自分が既に行った評価のMap
  const evaluatedMap = new Map<string, boolean>();
  if (me.sentEvaluations) {
    for (const ev of me.sentEvaluations) {
      evaluatedMap.set(ev.toParticipantId, ev.isAgree);
    }
  }

  const recommendations: CandidateRecommendation[] = others.map((cand) => {
    const { score, reasons } = calculateParticipantMatch(me, cand);
    const hasEvaluated = evaluatedMap.has(cand.id);
    const isAgree = evaluatedMap.get(cand.id) ?? null;

    return {
      participantId: cand.id,
      userId: cand.userId,
      displayName: cand.user.displayName,
      avatarUrl: cand.user.avatarUrl,
      customBio: cand.customBio,
      joinedAt: cand.joinedAt.toISOString(),
      matchScore: score,
      reasons,
      profile: cand.user.profile ?? null,
      attributes: cand.attributes.map((a) => ({
        id: a.id,
        key: a.key,
        value: a.value,
        type: a.type,
      })),
      evaluated: hasEvaluated,
      isAgree,
    };
  });

  // 未評価を先頭に、適合スコア降順でソート
  return recommendations.sort((a, b) => {
    if (a.evaluated !== b.evaluated) {
      return a.evaluated ? 1 : -1;
    }
    return b.matchScore - a.matchScore;
  });
}
