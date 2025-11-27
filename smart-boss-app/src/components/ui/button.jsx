import React from "react";
import { cn } from "../../utiles/utiles"; // helper to merge classNames (optional)

export function Button({
  variant = "default",
  size = "default",
  className = "",
  children,
  ...props
}) {
  // ✅ Remove unsupported Radix prop
  if ("asChild" in props) delete props.asChild;

  // Base styles for all buttons
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  // Variants: only semantic, no hard-coded colors
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700", // primary action
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300", // secondary button
    outline: "border border-gray-300 text-gray-900 hover:bg-gray-100", // outlined
    ghost: "bg-transparent hover:bg-gray-100 text-gray-900", // minimal
  };

  // Sizes
  const sizeClasses = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10", // square icon button
  };

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
