import React from "react";

export type BadgeVariant =
  "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "outline";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-stone-100 text-stone-700 border border-border-soft",
  secondary: "bg-stone-200/80 text-stone-800 border border-border-soft",
  primary: "bg-dusty-blue/15 text-dusty-blue border border-dusty-blue/30",
  success: "bg-sage/15 text-sage border border-sage/30",
  warning: "bg-amber-50 text-amber-800 border border-amber-200",
  danger: "bg-terracotta/15 text-terracotta border border-terracotta/30",
  outline: "border border-border-soft text-stone-700 bg-white",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-xs px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
  lg: "text-sm px-3 py-1.5",
};

/**
 * 汎用バッジコンポーネント
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  size = "md",
  children,
  className = "",
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className} `}
      {...props}
    >
      {children}
    </span>
  );
};
