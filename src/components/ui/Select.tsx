import React, { forwardRef, useId } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: readonly SelectOption[] | SelectOption[];
  placeholder?: string;
}

/**
 * 汎用セレクトボックスコンポーネント
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, options, placeholder, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-stone-700">
            {label}
            {props.required && <span className="text-terracotta ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-xl shadow-xs">
          <select
            ref={ref}
            id={selectId}
            className={`focus:border-sage focus:ring-sage/20 w-full appearance-none rounded-xl border bg-white py-2.5 pr-10 pl-3.5 text-sm text-stone-800 transition-colors duration-150 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-50 disabled:opacity-50 ${
              error
                ? "border-terracotta text-terracotta focus:border-terracotta focus:ring-terracotta/20"
                : "border-border-soft hover:border-stone-300"
            } ${className} `}
            {...props}
          >
            {placeholder && (
              <option value="" className="text-stone-400">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && <p className="text-terracotta mt-1.5 text-xs font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1.5 text-xs text-stone-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
