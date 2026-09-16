import React, { forwardRef, useId } from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  showCount?: boolean;
}

/**
 * 汎用テキストエリアコンポーネント
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, helperText, error, showCount, maxLength, className = "", id, value, ...props },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full">
        <div className="mb-1.5 flex items-center justify-between">
          {label && (
            <label htmlFor={textareaId} className="block text-sm font-medium text-stone-700">
              {label}
              {props.required && <span className="text-terracotta ml-1">*</span>}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-xs text-stone-400">
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          value={value}
          className={`focus:border-sage focus:ring-sage/20 w-full rounded-xl border bg-white p-3 text-sm text-stone-800 placeholder-stone-400 transition-colors duration-150 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-50 disabled:opacity-50 ${
            error
              ? "border-terracotta text-terracotta focus:border-terracotta focus:ring-terracotta/20"
              : "border-border-soft hover:border-stone-300"
          } ${className} `}
          {...props}
        />
        {error && <p className="text-terracotta mt-1.5 text-xs font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1.5 text-xs text-stone-500">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
