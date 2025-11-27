import React from "react";
import { Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const variantStyles = {
  default: {
    icon: Info,
    className:
      "bg-white text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",
  },
  info: {
    icon: Info,
    className:
      "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-700",
  },
  success: {
    icon: CheckCircle,
    className:
      "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-100 dark:border-green-700",
  },
  warning: {
    icon: AlertTriangle,
    className:
      "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-100 dark:border-yellow-700",
  },
  error: {
    icon: XCircle,
    className:
      "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-100 dark:border-red-700",
  },
};

/**
 * Universal Alert component
 */
export function Alert({ variant = "default", className = "", children }) {
  const resolved = variantStyles[variant] || variantStyles.default;
  const Icon = resolved.icon;

  return (
    <div
      className={`w-full flex items-start gap-3 border rounded-lg p-4 ${resolved.className} ${className}`}
    >
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 space-y-1">{children}</div>
    </div>
  );
}

/**
 * AlertTitle component
 */
export function AlertTitle({ children, className = "" }) {
  return <h4 className={`font-semibold ${className}`}>{children}</h4>;
}

/**
 * AlertDescription component
 */
export function AlertDescription({ children, className = "" }) {
  return <p className={`text-sm opacity-90 ${className}`}>{children}</p>;
}
