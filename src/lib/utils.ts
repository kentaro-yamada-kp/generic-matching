/**
 * アプリケーション共通のユーティリティ関数群
 */

/**
 * 日時（Dateオブジェクト、文字列、ミリ秒）を日本語の日時表記にフォーマットします。
 *
 * @param date - フォーマット対象の日時
 * @returns 日本語フォーマットされた日時文字列（例: "2026年9月12日 15:30"）
 */
export function formatDate(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
