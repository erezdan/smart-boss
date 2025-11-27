import React from "react";

/**
 * Generic Switch component
 * Neutral by default, supports variants and dark mode.
 */
export function Switch({
  checked,
  onChange,
  className = "",
  variant = "primary", // primary | success | warning | error
  ...props
}) {
  const variants = {
    primary: checked
      ? "bg-blue-600 dark:bg-blue-500"
      : "bg-gray-300 dark:bg-gray-600",
    success: checked
      ? "bg-green-600 dark:bg-green-500"
      : "bg-gray-300 dark:bg-gray-600",
    warning: checked
      ? "bg-yellow-500 dark:bg-yellow-400"
      : "bg-gray-300 dark:bg-gray-600",
    error: checked
      ? "bg-red-600 dark:bg-red-500"
      : "bg-gray-300 dark:bg-gray-600",
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange?.(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variants[variant]} ${className}
      `}
      {...props}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
}
