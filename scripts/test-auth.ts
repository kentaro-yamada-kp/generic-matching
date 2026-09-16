/**
 * 認証モジュールの動作検証スクリプト
 */
import { signJwt, verifyJwt, createSessionToken, verifySessionToken } from "../src/lib/auth/jwt";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateOAuthState,
  verifyOAuthState,
  generateMockOAuthUserInfo,
} from "../src/lib/auth/oauth";
import { OAUTH_PROVIDERS } from "../src/lib/auth/config";

async function runAuthTests() {
  console.log("=== 認証モジュールの検証開始 ===");

  // 1. JWT 署名と検証
  const payload = { sub: "test-user-id-1234", displayName: "テスト太郎", role: "user" };
  const token = await signJwt(payload, "test-secret-key-1234567890123456");
  console.log("JWT 生成成功:", Boolean(token));

  const verified = await verifyJwt<typeof payload>(token, "test-secret-key-1234567890123456");
  if (!verified || verified.sub !== "test-user-id-1234" || verified.displayName !== "テスト太郎") {
    throw new Error("JWT検証失敗");
  }
  console.log("JWT 検証成功:", verified.displayName);

  // 2. セッショントークン
  const sessionToken = await createSessionToken({
    id: "user-uuid-9999",
    displayName: "花子",
    avatarUrl: "https://example.com/avatar.png",
  }, "twitter");

  const sessionPayload = await verifySessionToken(sessionToken);
  if (!sessionPayload || sessionPayload.sub !== "user-uuid-9999" || sessionPayload.provider !== "twitter") {
    throw new Error("セッショントークン検証失敗");
  }
  console.log("セッショントークン検証成功:", sessionPayload.displayName, sessionPayload.provider);

  // 3. PKCE 生成
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  if (!verifier || !challenge || verifier.length < 43) {
    throw new Error("PKCE生成失敗");
  }
  console.log("PKCE 生成成功 (Verifier / Challenge)");

  // 4. OAuth State 署名・検証
  const state = await generateOAuthState({
    provider: "discord",
    redirectUrl: "/profile",
    codeVerifier: verifier,
  });

  const verifiedState = await verifyOAuthState(state);
  if (!verifiedState || verifiedState.provider !== "discord" || verifiedState.redirectUrl !== "/profile") {
    throw new Error("OAuth State検証失敗");
  }
  console.log("OAuth State 検証成功:", verifiedState.provider, verifiedState.redirectUrl);

  // 5. モックユーザー生成
  const mockTwitter = generateMockOAuthUserInfo("twitter", "テストX");
  const mockDiscord = generateMockOAuthUserInfo("discord");
  const mockLine = generateMockOAuthUserInfo("line");
  const mockInstagram = generateMockOAuthUserInfo("instagram");

  if (mockTwitter.provider !== "twitter" || mockDiscord.provider !== "discord" || mockLine.provider !== "line" || mockInstagram.provider !== "instagram") {
    throw new Error("モックユーザー生成失敗");
  }
  console.log("モックOAuthユーザー生成成功 (4プロバイダ)");

  // 6. プロバイダ設定確認
  console.log("対応プロバイダ一覧:", Object.keys(OAUTH_PROVIDERS).join(", "));

  console.log("=== すべての認証テストが正常にパスしました ===");
}

runAuthTests().catch((err) => {
  console.error("テスト失敗:", err);
  process.exit(1);
});
