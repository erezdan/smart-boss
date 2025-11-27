// src/components/ui/select.jsx
import React from "react";

/**
 * Generic Select component
 * Neutral by default, supports dark mode, invalid & disabled states.
 */
export function Select({
  value,
  onValueChange,
  children,
  className = "",
  placeholder,
  invalid = false,
  disabled = false,
}) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        disabled={disabled}
        className={`
          appearance-none w-full px-4 py-2 pr-10 text-sm rounded-md border
          bg-white text-gray-900
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:cursor-not-allowed disabled:opacity-70
          dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600
          ${
            invalid
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300"
          }
          ${className}
        `}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>

      {/* SVG arrow indicator */}
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400 dark:text-gray-500">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Option wrapper
 */
export function SelectItem({ children, ...props }) {
  return <option {...props}>{children}</option>;
}

// No-op wrappers for API compatibility
export const SelectTrigger = ({ children }) => <>{children}</>;
export const SelectContent = ({ children }) => <>{children}</>;
export const SelectValue = ({ children }) => <>{children}</>;
