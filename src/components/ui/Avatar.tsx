"use client";

import React, { useState } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  isOnline?: boolean | null;
  showStatus?: boolean;
}

const sizeMap: Record<AvatarSize, { container: string; text: string; dot: string; icon: string }> =
  {
    xs: { container: "w-6 h-6", text: "text-[10px]", dot: "w-2 h-2 ring-1", icon: "w-3 h-3" },
    sm: { container: "w-8 h-8", text: "text-xs", dot: "w-2.5 h-2.5 ring-1.5", icon: "w-4 h-4" },
    md: { container: "w-10 h-10", text: "text-sm", dot: "w-3 h-3 ring-2", icon: "w-5 h-5" },
    lg: { container: "w-14 h-14", text: "text-base", dot: "w-3.5 h-3.5 ring-2", icon: "w-7 h-7" },
    xl: { container: "w-20 h-20", text: "text-xl", dot: "w-4 h-4 ring-2.5", icon: "w-10 h-10" },
    "2xl": { container: "w-28 h-28", text: "text-3xl", dot: "w-6 h-6 ring-3", icon: "w-14 h-14" },
  };

/**
 * ユーザーアバターコンポーネント（オンライン状態表示・フォールバック対応）
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "User avatar",
  name,
  size = "md",
  isOnline,
  showStatus = false,
  className = "",
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const sizeConfig = sizeMap[size];

  // イニシャルの算出（表示名から先頭1〜2文字）
  const getInitials = (str?: string) => {
    if (!str) return "?";
    const trimmed = str.trim();
    if (trimmed.length === 0) return "?";
    return trimmed.slice(0, 2).toUpperCase();
  };

  const showImage = src && !hasError;

  return (
    <div className={`relative inline-block shrink-0 ${className}`} {...props}>
      <div
        className={` ${sizeConfig.container} from-sage/90 to-dusty-blue/90 flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-bold text-white shadow-xs select-none`}
      >
        {showImage ? (
          // Next/Imageのドメイン制限を回避し汎用URLを安全に表示するため標準imgを使用
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            onError={() => setHasError(true)}
            className="h-full w-full object-cover"
          />
        ) : name ? (
          <span className={sizeConfig.text}>{getInitials(name)}</span>
        ) : (
          <svg
            className={`${sizeConfig.icon} text-white/90`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        )}
      </div>

      {showStatus && isOnline !== undefined && isOnline !== null && (
        <span
          className={`absolute right-0 bottom-0 block rounded-full ring-2 ring-white ${sizeConfig.dot} ${isOnline ? "bg-sage" : "bg-stone-400"} `}
          title={isOnline ? "オンライン" : "オフライン"}
        />
      )}
    </div>
  );
};
