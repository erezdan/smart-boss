import React, { useEffect } from "react";
import ReactDOM from "react-dom";

/**
 * Main Dialog component with backdrop, styling, and ESC support
 */
export function Dialog({
  open,
  onClose,
  children,
  className = "",
  closeOnBackdropClick = false,
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (!closeOnBackdropClick) return;
        // Only trigger onClose if the backdrop itself was clicked, not its children
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 relative animate-fade-in transition ${className}`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
          aria-label="Close dialog"
        >
          &times;
        </button>
        {children}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>,
    document.body
  );
}

/**
 * Header wrapper for dialog
 */
export function DialogHeader({ children, className = "" }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

/**
 * Title for dialog
 */
export function DialogTitle({ children, className = "" }) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
}

/**
 * Description for dialog
 */
export function DialogDescription({ children, className = "" }) {
  return (
    <p className={`text-sm text-gray-600 dark:text-gray-300 ${className}`}>
      {children}
    </p>
  );
}

/**
 * Content wrapper for dialog
 */
export function DialogContent({ children, className = "" }) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

/**
 * Footer for buttons (aligned to bottom right)
 */
export function DialogFooter({ children, className = "" }) {
  return (
    <div className={`mt-6 flex justify-end gap-2 ${className}`}>{children}</div>
  );
}

/**
 * Close button with consistent styling
 */
export function DialogClose({ children, onClick, className = "", ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm text-gray-900 dark:text-gray-100 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
