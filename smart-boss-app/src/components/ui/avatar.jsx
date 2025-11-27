import React from "react";

/**
 * Avatar container
 */
export function Avatar({ className = "", children }) {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Avatar image
 */
export function AvatarImage({ src, alt = "", className = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover w-full h-full ${className}`}
    />
  );
}

/**
 * Avatar fallback (shown if no image)
 */
export function AvatarFallback({ children, className = "" }) {
  return (
    <span
      className={`flex items-center justify-center w-full h-full text-sm font-medium text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 ${className}`}
    >
      {children}
    </span>
  );
}
