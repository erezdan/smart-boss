import React from "react";
import { cn } from "../../utiles/utiles"; // optional helper to merge classNames

export function Card({ children, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-xl shadow border bg-white text-gray-900", // default light mode
        "dark:bg-gray-800 dark:text-white dark:border-gray-700", // dark mode support
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

export function CardHeader({ children, className = "" }) {
  return <div className={cn("p-4 pb-2", className)}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function CardFooter({ children, className = "" }) {
  return (
    <div
      className={cn(
        "p-4 pt-0 border-t border-gray-200 dark:border-gray-700 flex justify-end",
        className
      )}
    >
      {children}
    </div>
  );
}
