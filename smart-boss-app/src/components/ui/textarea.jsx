import React from "react";

/**
 * Generic Textarea component
 * Neutral by default, supports dark mode, focus, error, and disabled states.
 */
export function Textarea({ className = "", invalid = false, ...props }) {
  return (
    <textarea
      {...props}
      className={`
        w-full rounded-md border p-2 text-sm resize-y min-h-[80px]
        bg-white text-gray-900 placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:cursor-not-allowed disabled:opacity-70
        dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500
        ${
          invalid
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 dark:border-gray-600"
        }
        ${className}
      `}
    />
  );
}
