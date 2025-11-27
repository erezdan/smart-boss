import React from "react";

/**
 * Badge component
 * Supports neutral defaults + variants (primary, success, warning, error, outline)
 */
export function Badge({ children, icon, variant = "neutral", className = "" }) {
  const base =
    "inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border";

  const variants = {
    neutral:
      "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
    primary:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700",
    success:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-800 dark:text-green-100 dark:border-green-700",
    warning:
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-700 dark:text-yellow-100 dark:border-yellow-600",
    error:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-800 dark:text-red-100 dark:border-red-700",
    outline:
      "bg-transparent text-gray-700 border-gray-300 dark:text-gray-200 dark:border-gray-600",
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
      {icon && <span className="text-base">{icon}</span>}
    </span>
  );
}
