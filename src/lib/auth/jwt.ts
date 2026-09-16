import type { SessionPayload } from "@/types/auth";
import { getAuthSecret, SESSION_MAX_AGE } from "./config";

/**
 * ArrayBuffer または Uint8Array を Base64URL 文字列に変換する
 */
export function base64UrlEncode(input: Uint8Array | ArrayBuffer): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Base64URL 文字列を Uint8Array にデコードする
 */
export function base64UrlDecode(input: string): Uint8Array {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 文字列シークレットから Web Crypto 用の HMAC CryptoKey をインポートする
 */
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign", "verify"]
  );
}

/**
 * ペイロードから JWT（HS256）トークンを生成する
 */
export async function signJwt(
  payload: Record<string, unknown>,
  secret: string = getAuthSecret()
): Promise<string> {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const encoder = new TextEncoder();
  const encodedHeader = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const cryptoKey = await getCryptoKey(secret);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(dataToSign));
  const encodedSignature = base64UrlEncode(signature);

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * JWT（HS256）トークンを検証し、ペイロードを取り出す
 */
export async function verifyJwt<T = Record<string, unknown>>(
  token: string,
  secret: string = getAuthSecret()
): Promise<T | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const dataToVerify = `${headerB64}.${payloadB64}`;
    const signatureBytes = base64UrlDecode(signatureB64);
    const cryptoKey = await getCryptoKey(secret);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      signatureBytes as unknown as BufferSource,
      encoder.encode(dataToVerify) as unknown as BufferSource
    );

    if (!isValid) {
      return null;
    }

    const payloadJson = decoder.decode(base64UrlDecode(payloadB64));
    const payload = JSON.parse(payloadJson) as T & { exp?: number; nbf?: number };

    const now = Math.floor(Date.now() / 1000);

    // 有効期限チェック
    if (typeof payload.exp === "number" && payload.exp < now) {
      return null;
    }

    // 発効前チェック
    if (typeof payload.nbf === "number" && payload.nbf > now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * ユーザーセッション用のJWTトークンを発行する
 */
export async function createSessionToken(
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  },
  provider?: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    provider,
    iat: now,
    exp: now + SESSION_MAX_AGE,
  };

  return await signJwt(payload as unknown as Record<string, unknown>);
}

/**
 * セッショントークンを検証して SessionPayload を取得する
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  return await verifyJwt<SessionPayload>(token);
}
