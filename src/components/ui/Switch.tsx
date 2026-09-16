import React, { useId } from "react";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * 汎用トグルスイッチコンポーネント
 */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = "",
}) => {
  const generatedId = useId();
  const switchId = id || generatedId;

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {(label || description) && (
        <label htmlFor={switchId} className="flex cursor-pointer flex-col select-none">
          {label && <span className="text-sm font-medium text-stone-800">{label}</span>}
          {description && <span className="text-xs text-stone-500">{description}</span>}
        </label>
      )}
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`focus:ring-sage relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-sage" : "bg-stone-300"} `}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"} `}
        />
      </button>
    </div>
  );
};
