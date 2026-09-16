/**
 * プロフィール管理・共通属性機能（Phase 4）の動作検証スクリプト
 */
import {
  validateDisplayName,
  validateAge,
  validateAvatarUrl,
} from "../src/server/db/users";
import {
  PREFECTURES,
  GENDER_OPTIONS,
  CATEGORY_OPTIONS,
  PURPOSE_OPTIONS,
  DEFAULT_AVATARS,
} from "../src/lib/constants";

async function runProfileTests() {
  console.log("=== プロフィール管理（Phase 4）モジュールの検証開始 ===");

  // 1. バリデーション関数の検証
  console.log("\n1. 入力バリデーションの検証:");

  // 表示名バリデーション
  const validName = validateDisplayName("テスト太郎");
  if (!validName.valid) throw new Error("有効な表示名が拒否されました");

  const emptyName = validateDisplayName("   ");
  if (emptyName.valid) throw new Error("空の表示名が許可されました");

  const longName = validateDisplayName("a".repeat(51));
  if (longName.valid) throw new Error("50文字超の表示名が許可されました");
  console.log("  ✓ 表示名バリデーション成功 (必須・50文字制限)");

  // 年齢バリデーション
  const validAge = validateAge(25);
  if (!validAge.valid) throw new Error("有効な年齢が拒否されました");

  const nullAge = validateAge(null);
  if (!nullAge.valid) throw new Error("null年齢が拒否されました");

  const invalidAgeNegative = validateAge(-5);
  if (invalidAgeNegative.valid) throw new Error("負の年齢が許可されました");

  const invalidAgeTooHigh = validateAge(150);
  if (invalidAgeTooHigh.valid) throw new Error("120超の年齢が許可されました");
  console.log("  ✓ 年齢バリデーション成功 (1〜120数値範囲・null許容)");

  // アバターURLバリデーション
  const validUrl = validateAvatarUrl("https://example.com/avatar.png");
  if (!validUrl.valid) throw new Error("有効なアバターURLが拒否されました");

  const nullUrl = validateAvatarUrl(null);
  if (!nullUrl.valid) throw new Error("nullアバターURLが拒否されました");

  const invalidUrl = validateAvatarUrl("not-a-valid-url");
  if (invalidUrl.valid) throw new Error("不正なURL形式が許可されました");

  const invalidProtocolUrl = validateAvatarUrl("ftp://example.com/avatar.png");
  if (invalidProtocolUrl.valid) throw new Error("HTTP/HTTPS以外のプロトコルが許可されました");
  console.log("  ✓ アバターURLバリデーション成功 (HTTP/HTTPS形式チェック)");

  // 2. 定数データの検証
  console.log("\n2. 定数・選択肢データの検証:");
  if (PREFECTURES.length !== 48) {
    throw new Error(`都道府県リストの数が不正です (期待値: 48, 実際: ${PREFECTURES.length})`);
  }
  console.log(`  ✓ 都道府県リスト: ${PREFECTURES.length} 項目定義済み (北海道〜沖縄県 + 海外/その他)`);

  if (GENDER_OPTIONS.length < 3) {
    throw new Error("性別オプションが不足しています");
  }
  console.log(`  ✓ 性別選択肢: ${GENDER_OPTIONS.length} 項目定義済み`);

  if (CATEGORY_OPTIONS.length < 5) {
    throw new Error("カテゴリ選択肢が不足しています");
  }
  console.log(`  ✓ カテゴリ選択肢: ${CATEGORY_OPTIONS.length} 項目定義済み`);

  if (PURPOSE_OPTIONS.length < 4) {
    throw new Error("利用目的選択肢が不足しています");
  }
  console.log(`  ✓ 利用目的選択肢: ${PURPOSE_OPTIONS.length} 項目定義済み`);

  if ((DEFAULT_AVATARS as readonly unknown[]).length === 0) {
    throw new Error("デフォルトアバターが定義されていません");
  }
  console.log(`  ✓ デフォルトアバタープリセット: ${DEFAULT_AVATARS.length} 項目定義済み`);

  console.log("\n=== Phase 4 のすべての単体検証が正常にパスしました ===");
}

runProfileTests().catch((err) => {
  console.error("テスト失敗:", err);
  process.exit(1);
});
