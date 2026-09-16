import React, { forwardRef, useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * 汎用テキスト入力コンポーネント
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-stone-700">
            {label}
            {props.required && <span className="text-terracotta ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-xl shadow-xs">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`focus:border-sage focus:ring-sage/20 w-full rounded-xl border bg-white text-sm text-stone-800 placeholder-stone-400 transition-colors duration-150 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-50 disabled:opacity-50 ${leftIcon ? "pl-10" : "pl-3.5"} ${rightIcon ? "pr-10" : "pr-3.5"} py-2.5 ${
              error
                ? "border-terracotta text-terracotta focus:border-terracotta focus:ring-terracotta/20"
                : "border-border-soft hover:border-stone-300"
            } ${className} `}
            {...props}
          />
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-terracotta mt-1.5 text-xs font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1.5 text-xs text-stone-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
