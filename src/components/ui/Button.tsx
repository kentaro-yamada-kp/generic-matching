import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** ボタンスタイル種別 */
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  /** ボタンサイズ */
  size?: "sm" | "md" | "lg";
  /** ローディング状態 */
  isLoading?: boolean;
}

/**
 * 汎用ボタンコンポーネント (北欧ナチュラル・Tailwind v4規約準拠)
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variantStyles = {
    primary: "bg-sage text-white hover:bg-sage/90 focus:ring-sage/40 shadow-xs",
    secondary:
      "bg-stone-100 text-stone-800 hover:bg-stone-200/90 border border-border-soft focus:ring-stone-400 shadow-xs",
    outline:
      "border border-border-soft bg-white text-stone-700 hover:bg-stone-50 focus:ring-sage/40 shadow-xs",
    danger: "bg-terracotta text-white hover:bg-terracotta/90 focus:ring-terracotta/40 shadow-xs",
    ghost: "bg-transparent text-stone-700 hover:bg-stone-100 focus:ring-stone-300",
  }[variant];

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }[size];

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
};
