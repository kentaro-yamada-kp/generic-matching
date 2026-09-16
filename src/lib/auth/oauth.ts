import type { SupportedOAuthProvider, OAuthUserInfo } from "@/types/auth";
import { getProviderConfig, getOAuthCallbackUrl, getAuthSecret } from "./config";
import { base64UrlEncode, base64UrlDecode } from "./jwt";

/**
 * OAuth状態（state）ペイロード
 */
export interface OAuthStatePayload {
  provider: SupportedOAuthProvider;
  redirectUrl?: string;
  linkUserId?: string;
  codeVerifier?: string;
  timestamp: number;
}

/**
 * ランダムな文字列を生成する
 */
export function generateRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64UrlEncode(array).slice(0, length);
}

/**
 * PKCE用の Code Verifier を生成する
 */
export function generateCodeVerifier(): string {
  return generateRandomString(64);
}

/**
 * PKCE用の Code Challenge (S256) を生成する
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(hash);
}

/**
 * OAuth state文字列を生成・署名する
 */
export async function generateOAuthState(
  payload: Omit<OAuthStatePayload, "timestamp">
): Promise<string> {
  const fullPayload: OAuthStatePayload = {
    ...payload,
    timestamp: Date.now(),
  };

  const jsonStr = JSON.stringify(fullPayload);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonStr);

  const secret = getAuthSecret();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  const b64Payload = base64UrlEncode(data);
  const b64Sig = base64UrlEncode(signature);

  return `${b64Payload}.${b64Sig}`;
}

/**
 * OAuth state文字列を検証・復号する
 */
export async function verifyOAuthState(state: string): Promise<OAuthStatePayload | null> {
  try {
    const [b64Payload, b64Sig] = state.split(".");
    if (!b64Payload || !b64Sig) {
      return null;
    }

    const payloadBytes = base64UrlDecode(b64Payload);
    const sigBytes = base64UrlDecode(b64Sig);

    const encoder = new TextEncoder();
    const secret = getAuthSecret();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["verify"]
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      sigBytes as unknown as BufferSource,
      payloadBytes as unknown as BufferSource
    );
    if (!isValid) {
      return null;
    }

    const decoder = new TextDecoder();
    const json = decoder.decode(payloadBytes);
    const payload = JSON.parse(json) as OAuthStatePayload;

    // 15分以内のstateのみ有効
    const maxAge = 15 * 60 * 1000;
    if (Date.now() - payload.timestamp > maxAge) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * プロバイダの認証URLを構築する
 */
export async function buildAuthorizationUrl(
  provider: SupportedOAuthProvider,
  options: {
    redirectUrl?: string;
    linkUserId?: string;
  } = {}
): Promise<{ url: string; state: string; codeVerifier?: string }> {
  const config = getProviderConfig(provider);
  if (!config) {
    throw new Error(`未対応のOAuthプロバイダです: ${provider}`);
  }

  let codeVerifier: string | undefined;
  let codeChallenge: string | undefined;

  if (config.usePkce) {
    codeVerifier = generateCodeVerifier();
    codeChallenge = await generateCodeChallenge(codeVerifier);
  }

  const state = await generateOAuthState({
    provider,
    redirectUrl: options.redirectUrl,
    linkUserId: options.linkUserId,
    codeVerifier,
  });

  const callbackUrl = getOAuthCallbackUrl(provider);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId || "mock_client_id",
    redirect_uri: callbackUrl,
    scope: config.scopes.join(" "),
    state,
  });

  if (codeChallenge) {
    params.set("code_challenge", codeChallenge);
    params.set("code_challenge_method", "S256");
  }

  return {
    url: `${config.authorizationUrl}?${params.toString()}`,
    state,
    codeVerifier,
  };
}

/**
 * 認可コードからアクセストークンを取得し、ユーザー情報をフェッチする
 */
export async function exchangeCodeForUserInfo(
  provider: SupportedOAuthProvider,
  code: string,
  codeVerifier?: string
): Promise<OAuthUserInfo> {
  const config = getProviderConfig(provider);
  if (!config || !config.clientId || !config.clientSecret) {
    throw new Error(`プロバイダ ${provider} の認証設定が不足しています。`);
  }

  const callbackUrl = getOAuthCallbackUrl(provider);

  // 1. トークンエンドポイントへのリクエスト
  const bodyParams: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    redirect_uri: callbackUrl,
    client_id: config.clientId,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  if (provider === "twitter") {
    // Twitter PKCE: Basic認証ヘッダーまたはパラメータ
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${credentials}`;
    if (codeVerifier) {
      bodyParams["code_verifier"] = codeVerifier;
    }
  } else {
    bodyParams["client_secret"] = config.clientSecret;
  }

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers,
    body: new URLSearchParams(bodyParams).toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`トークン取得に失敗しました (${provider}): ${errorText}`);
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token?: string;
    token_type?: string;
  };

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token || null;

  // 2. ユーザー情報の取得
  return await fetchUserInfoFromProvider(provider, accessToken, refreshToken);
}

/**
 * 各プロバイダのユーザー情報エンドポイントからプロフィールを取得する
 */
async function fetchUserInfoFromProvider(
  provider: SupportedOAuthProvider,
  accessToken: string,
  refreshToken?: string | null
): Promise<OAuthUserInfo> {
  const config = getProviderConfig(provider);
  if (!config) {
    throw new Error(`未対応のOAuthプロバイダです: ${provider}`);
  }

  const response = await fetch(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ユーザー情報取得に失敗しました (${provider}): ${errText}`);
  }

  const data = await response.json();

  switch (provider) {
    case "twitter": {
      // X (Twitter) API v2 format: { data: { id, name, username, profile_image_url } }
      const twitterData = data.data || data;
      return {
        provider: "twitter",
        providerUserId: twitterData.id,
        displayName: twitterData.name || twitterData.username || "X User",
        avatarUrl: twitterData.profile_image_url || null,
        accessToken,
        refreshToken,
      };
    }
    case "discord": {
      // Discord format: { id, username, global_name, avatar, email }
      const avatarUrl = data.avatar
        ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(data.discriminator || "0") % 5}.png`;
      return {
        provider: "discord",
        providerUserId: data.id,
        displayName: data.global_name || data.username || "Discord User",
        avatarUrl,
        email: data.email || null,
        accessToken,
        refreshToken,
      };
    }
    case "line": {
      // LINE format: { userId, displayName, pictureUrl, statusMessage }
      return {
        provider: "line",
        providerUserId: data.userId,
        displayName: data.displayName || "LINE User",
        avatarUrl: data.pictureUrl || null,
        accessToken,
        refreshToken,
      };
    }
    case "instagram": {
      // Instagram Graph API format: { id, username }
      return {
        provider: "instagram",
        providerUserId: data.id,
        displayName: data.username || "Instagram User",
        avatarUrl: null,
        accessToken,
        refreshToken,
      };
    }
    default:
      throw new Error(`未対応のプロバイダです: ${provider}`);
  }
}

/**
 * 開発・ローカルテスト用のモックOAuthユーザー情報を生成する
 */
export function generateMockOAuthUserInfo(
  provider: SupportedOAuthProvider,
  customName?: string
): OAuthUserInfo {
  const providerNames: Record<SupportedOAuthProvider, string> = {
    twitter: "X ユーザー",
    instagram: "Instagram ユーザー",
    line: "LINE ユーザー",
    discord: "Discord ユーザー",
  };

  const displayName =
    customName || `${providerNames[provider]}_${Math.floor(1000 + Math.random() * 9000)}`;
  const providerUserId = `mock_${provider}_${Math.floor(100000 + Math.random() * 900000)}`;
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${providerUserId}`;

  return {
    provider,
    providerUserId,
    displayName,
    avatarUrl,
    accessToken: `mock_access_token_${providerUserId}`,
    refreshToken: `mock_refresh_token_${providerUserId}`,
  };
}
